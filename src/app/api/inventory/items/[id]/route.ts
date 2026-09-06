import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const item = await prisma.inventoryItem.findUnique({
    where: { id: params.id },
    include: { recipeItems: { include: { product: { select: { id: true, name: true } } } } },
  });
  if (!item) return new Response("Not found", { status: 404 });
  return Response.json({
    ...item,
    current_stock: Number((item as any).current_stock),
    minimum_stock: Number((item as any).minimum_stock),
    target_stock: (item as any).target_stock != null ? Number((item as any).target_stock) : null,
    average_cost: Number((item as any).average_cost),
    recipeItems: item.recipeItems.map((r: any) => ({ ...r, quantity: Number(r.quantity) })),
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { name, sku, unit, minimum_stock, target_stock, average_cost, is_active } = body;
  // Note: current_stock should NOT be directly updated here; use purchase/adjustment ledger. But allow if needed via adjustment.
  // We keep current_stock immutable via PUT to preserve ledger integrity, unless explicitly allowed.
  const current = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
  if (!current) return new Response("Not found", { status: 404 });
  try {
    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name: name != null ? String(name).trim() : undefined,
        sku: sku !== undefined ? (sku ? String(sku).trim() : null) : undefined,
        unit: unit != null ? String(unit).trim() : undefined,
        minimum_stock: minimum_stock != null ? Number(minimum_stock) : undefined,
        target_stock: target_stock !== undefined ? (target_stock != null && target_stock !== "" ? Number(target_stock) : null) : undefined,
        average_cost: average_cost != null ? Number(average_cost) : undefined,
        is_active: is_active != null ? Boolean(is_active) : undefined,
      },
    });
    try { revalidatePath("/inventory"); } catch {}
    return Response.json({
      ...updated,
      current_stock: Number((updated as any).current_stock),
      minimum_stock: Number((updated as any).minimum_stock),
      target_stock: (updated as any).target_stock != null ? Number((updated as any).target_stock) : null,
      average_cost: Number((updated as any).average_cost),
    });
  } catch (e: any) {
    if (e.code === "P2002") return new Response("Name or SKU already exists", { status: 409 });
    throw e;
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  // Prevent delete if used in recipes or has movements
  const countRecipe = await prisma.recipeItem.count({ where: { inventory_item_id: params.id } });
  if (countRecipe > 0) return new Response("Cannot delete: still used in recipes", { status: 400 });
  const countMov = await prisma.stockMovement.count({ where: { inventory_item_id: params.id } });
  if (countMov > 0) {
    // soft delete: deactivate
    const item = await prisma.inventoryItem.update({ where: { id: params.id }, data: { is_active: false } });
    return Response.json({ ok: true, soft: true, item });
  }
  await prisma.inventoryItem.delete({ where: { id: params.id } });
  try { revalidatePath("/inventory"); } catch {}
  return Response.json({ ok: true });
}
