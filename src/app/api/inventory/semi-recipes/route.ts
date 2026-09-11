import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const output_item_id = searchParams.get("output_item_id");
  if (!output_item_id) return new Response("Missing output_item_id", { status: 400 });
  const items = await prisma.inventoryRecipe.findMany({
    where: { output_item_id },
    include: { input_item: { select: { id: true, name: true, unit: true, current_stock: true, sku: true, average_cost: true } } },
    orderBy: { created_at: "asc" },
  });
  return Response.json(items.map((r: any) => ({ ...r, quantity: Number(r.quantity), input_item: { ...r.input_item, current_stock: Number(r.input_item.current_stock), average_cost: Number(r.input_item.average_cost) } })));
}

export async function PUT(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { output_item_id, items } = body as { output_item_id: string; items: { input_item_id: string; quantity: number }[] };
  if (!output_item_id || !Array.isArray(items)) return new Response("Missing output_item_id or items", { status: 400 });
  const output = await prisma.inventoryItem.findUnique({ where: { id: output_item_id } });
  if (!output) return new Response("Output item not found", { status: 404 });
  if (output.item_type !== "SEMI_FINISH") return new Response("Output must be SEMI_FINISH", { status: 400 });
  if (output_item_id && items.some(i=> i.input_item_id === output_item_id)) return new Response("Cannot use self as input", { status: 400 });

  const seen = new Set<string>();
  for (const it of items) {
    if (!it.input_item_id || !(Number(it.quantity) > 0)) return new Response("Each input needs input_item_id and quantity >0", { status: 400 });
    if (seen.has(it.input_item_id)) return new Response("Duplicate input_item in recipe", { status: 400 });
    seen.add(it.input_item_id);
    const inv = await prisma.inventoryItem.findUnique({ where: { id: it.input_item_id } });
    if (!inv) return new Response(`Inventory item not found ${it.input_item_id}`, { status: 404 });
    if (!inv.is_active) return new Response(`Inventory item inactive ${inv.name}`, { status: 400 });
    if (inv.item_type !== "BASE") return new Response(`Input must be BASE, ${inv.name} is ${inv.item_type}`, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.inventoryRecipe.deleteMany({ where: { output_item_id } });
    if (items.length === 0) return [];
    const created = await Promise.all(
      items.map((it) =>
        tx.inventoryRecipe.create({
          data: {
            output_item_id,
            input_item_id: it.input_item_id,
            quantity: Number(it.quantity),
          },
          include: { input_item: { select: { id: true, name: true, unit: true, sku: true, current_stock: true, average_cost: true } } },
        })
      )
    );
    return created;
  });

  try { revalidatePath("/inventory"); } catch {}
  return Response.json(result.map((r: any) => ({ ...r, quantity: Number(r.quantity), input_item: { ...r.input_item, current_stock: Number(r.input_item.current_stock), average_cost: Number(r.input_item.average_cost) } })));
}
