import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { inventory_item_id, quantity, type, note } = body;
  if (!inventory_item_id || quantity == null) return new Response("Missing inventory_item_id / quantity", { status: 400 });
  const qtyRaw = Number(quantity);
  if (qtyRaw === 0) return new Response("Quantity cannot be 0", { status: 400 });
  const movType = type === "WASTE" ? "WASTE" : "ADJUSTMENT";
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventory_item_id } });
  if (!item) return new Response("Not found", { status: 404 });
  if (!item.is_active) return new Response("Item inactive", { status: 400 });

  let finalQty = qtyRaw;
  if (movType === "WASTE") finalQty = -Math.abs(qtyRaw);

  try {
    const result = await prisma.$transaction(async (txClient) => {
      const current = await txClient.inventoryItem.findUnique({ where: { id: inventory_item_id } });
      if (!current) throw new Error("Not found");
      const prevStock = Number((current as any).current_stock);
      const newStock = prevStock + finalQty;
      if (newStock < 0) {
        throw Object.assign(new Error(`Adjustment would make stock negative (${prevStock} + ${finalQty} = ${newStock})`), { code: "NEGATIVE_STOCK" });
      }
      const updated = await txClient.inventoryItem.update({
        where: { id: inventory_item_id },
        data: { current_stock: newStock },
      });
      const movement = await txClient.stockMovement.create({
        data: {
          inventory_item_id,
          type: movType as any,
          quantity: finalQty,
          reference_type: movType,
          note: note || null,
          created_by: session.user.id,
        },
      });
      return { updated, movement };
    });
    try { revalidatePath("/inventory"); } catch {}
    return Response.json({
      item: { ...(result as any).updated, current_stock: Number((result as any).updated.current_stock), average_cost: Number((result as any).updated.average_cost), minimum_stock: Number((result as any).updated.minimum_stock), target_stock: (result as any).updated.target_stock != null ? Number((result as any).updated.target_stock) : null },
      movement: { ...(result as any).movement, quantity: Number((result as any).movement.quantity) },
    });
  } catch (e: any) {
    if (e.code === "NEGATIVE_STOCK" || e.message?.includes("negative")) {
      return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    throw e;
  }
}
