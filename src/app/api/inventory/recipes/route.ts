import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const product_id = searchParams.get("product_id");
  // If no product_id, return all recipes grouped — used by POS to show NO RECIPE badge live
  if (!product_id) {
    const all = await prisma.recipeItem.findMany({
      select: { product_id: true },
    });
    const ids = Array.from(new Set(all.map(r=>r.product_id)));
    return Response.json({ productIdsWithRecipe: ids });
  }
  const items = await prisma.recipeItem.findMany({
    where: { product_id },
    include: { inventory_item: { select: { id: true, name: true, unit: true, current_stock: true, sku: true } } },
    orderBy: { created_at: "asc" },
  });
  return Response.json(items.map((r: any) => ({ ...r, quantity: Number(r.quantity), inventory_item: { ...r.inventory_item, current_stock: Number(r.inventory_item.current_stock) } })));
}

export async function PUT(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { product_id, items } = body as { product_id: string; items: { inventory_item_id: string; quantity: number }[] };
  if (!product_id || !Array.isArray(items)) return new Response("Missing product_id or items", { status: 400 });
  const product = await prisma.product.findUnique({ where: { id: product_id } });
  if (!product) return new Response("Product not found", { status: 404 });
  // Validate items: quantity >0, inventory active, no duplicates
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.inventory_item_id || !(Number(it.quantity) > 0)) return new Response("Each recipe item needs inventory_item_id and quantity >0", { status: 400 });
    if (seen.has(it.inventory_item_id)) return new Response("Duplicate inventory_item in recipe", { status: 400 });
    seen.add(it.inventory_item_id);
    const inv = await prisma.inventoryItem.findUnique({ where: { id: it.inventory_item_id } });
    if (!inv) return new Response(`Inventory item not found ${it.inventory_item_id}`, { status: 404 });
    if (!inv.is_active) return new Response(`Inventory item inactive ${inv.name}`, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Delete existing recipe for product (and recreate)
    await tx.recipeItem.deleteMany({ where: { product_id } });
    if (items.length === 0) return [];
    const created = await Promise.all(
      items.map((it) =>
        tx.recipeItem.create({
          data: {
            product_id,
            inventory_item_id: it.inventory_item_id,
            quantity: Number(it.quantity),
          },
          include: { inventory_item: { select: { id: true, name: true, unit: true, sku: true, current_stock: true } } },
        })
      )
    );
    return created;
  });

  try { revalidatePath("/inventory"); revalidatePath("/products"); revalidatePath("/pos"); } catch {}
  return Response.json(result.map((r: any) => ({ ...r, quantity: Number(r.quantity), inventory_item: { ...r.inventory_item, current_stock: Number(r.inventory_item.current_stock) } })));
}
