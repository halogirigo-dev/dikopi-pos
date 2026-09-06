import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();
  const is_active = searchParams.get("is_active");
  const where: any = {};
  if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }];
  if (is_active === "true") where.is_active = true;
  if (is_active === "false") where.is_active = false;
  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { recipeItems: true, movements: true } } },
  });
  // Serialize Decimal to number for JSON
  const data = items.map((i: any) => ({
    ...i,
    current_stock: Number(i.current_stock),
    minimum_stock: Number(i.minimum_stock),
    target_stock: i.target_stock != null ? Number(i.target_stock) : null,
    average_cost: Number(i.average_cost),
  }));
  return Response.json(data);
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { name, sku, unit, current_stock, minimum_stock, target_stock, average_cost, is_active } = body;
  if (!name || !unit) return new Response("Missing name/unit", { status: 400 });
  if (Number(current_stock) < 0 || Number(minimum_stock) < 0) return new Response("Stock cannot be negative", { status: 400 });
  try {
    const item = await prisma.inventoryItem.create({
      data: {
        name: String(name).trim(),
        sku: sku ? String(sku).trim() : null,
        unit: String(unit).trim(),
        current_stock: current_stock != null ? Number(current_stock) : 0,
        minimum_stock: minimum_stock != null ? Number(minimum_stock) : 0,
        target_stock: target_stock != null && target_stock !== "" ? Number(target_stock) : null,
        average_cost: average_cost != null ? Number(average_cost) : 0,
        is_active: is_active ?? true,
      },
    });
    // Optionally create OPENING movement if initial stock >0
    if (Number(current_stock) > 0) {
      await prisma.stockMovement.create({
        data: {
          inventory_item_id: item.id,
          type: "OPENING",
          quantity: Number(current_stock),
          unit_cost: average_cost != null ? Number(average_cost) : null,
          reference_type: "OPENING",
          note: "Initial stock",
          created_by: session.user.id,
        },
      });
    }
    try { revalidatePath("/inventory"); } catch {}
    return Response.json({
      ...item,
      current_stock: Number((item as any).current_stock),
      minimum_stock: Number((item as any).minimum_stock),
      target_stock: (item as any).target_stock != null ? Number((item as any).target_stock) : null,
      average_cost: Number((item as any).average_cost),
    });
  } catch (e: any) {
    if (e.code === "P2002") return new Response("Name or SKU already exists", { status: 409 });
    throw e;
  }
}
