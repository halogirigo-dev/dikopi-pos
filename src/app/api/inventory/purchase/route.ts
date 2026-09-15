import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { inventory_item_id, quantity, unit_cost, note } = body;
  if (!inventory_item_id || quantity == null || unit_cost == null) return new Response("Missing fields: inventory_item_id, quantity, unit_cost", { status: 400 });
  const qty = Number(quantity);
  const uc = Number(unit_cost);
  if (!(qty > 0)) return new Response("Quantity must be > 0", { status: 400 });
  if (!(uc >= 0)) return new Response("Unit cost must be >= 0", { status: 400 });

  const item = await prisma.inventoryItem.findUnique({ where: { id: inventory_item_id } });
  if (!item) return new Response("Inventory item not found", { status: 404 });
  if (!item.is_active) return new Response("Item is inactive", { status: 400 });

  // Resolve expense category: prefer "Raw Material", fall back to first available category
  const rawCat = await prisma.expenseCategory.findFirst({ where: { name: "Raw Material" } });
  const fallbackCat = rawCat ?? await prisma.expenseCategory.findFirst({ orderBy: { name: "asc" } });

  // Weighted average cost update inside transaction
  const result = await prisma.$transaction(async (txClient) => {
    const current = await txClient.inventoryItem.findUnique({ where: { id: inventory_item_id } });
    if (!current) throw new Error("Not found");
    const prevStock = Number((current as any).current_stock);
    const prevAvg = Number((current as any).average_cost);
    const newStock = prevStock + qty;
    let newAvg = prevAvg;
    if (newStock > 0) {
      newAvg = (prevStock * prevAvg + qty * uc) / newStock;
    } else {
      newAvg = uc;
    }
    const updated = await txClient.inventoryItem.update({
      where: { id: inventory_item_id },
      data: { current_stock: newStock, average_cost: Math.round(newAvg * 100) / 100 },
    });
    // Compute total purchase amount (round to whole rupiah)
    const totalAmount = Math.round(qty * uc);

    // Create expense record linked to this purchase (only when there's an amount and a category exists)
    let expense: any = null;
    if (totalAmount > 0 && fallbackCat) {
      expense = await txClient.expense.create({
        data: {
          category_id: (fallbackCat as any).id,
          description: `Pembelian ${item.name} — ${qty} ${item.unit}`,
          amount: totalAmount,
          payment_method: "CASH",
          expense_date: new Date(),
          created_by: session.user.id,
          notes: `Otomatis dari pembelian stok • Item: ${item.name} • Qty: ${qty} ${item.unit} • ${uc} Rp/unit${note ? ` • ${note}` : ""}`,
        },
      });
    }

    const movement = await txClient.stockMovement.create({
      data: {
        inventory_item_id,
        type: "PURCHASE",
        quantity: qty,
        unit_cost: uc,
        reference_type: "PURCHASE",
        reference_id: expense ? expense.id : undefined,
        note: note || null,
        created_by: session.user.id,
      },
    });
    return { updated, movement, expense };
  });

  try { revalidatePath("/inventory"); revalidatePath("/dashboard"); revalidatePath("/finance"); revalidatePath("/expenses"); revalidatePath("/cashflow"); revalidatePath("/reports"); } catch {}
  return Response.json({
    item: { ...result.updated, current_stock: Number((result.updated as any).current_stock), average_cost: Number((result.updated as any).average_cost) },
    movement: { ...result.movement, quantity: Number((result.movement as any).quantity), unit_cost: result.movement.unit_cost != null ? Number((result.movement as any).unit_cost) : null },
    expense: result.expense ? { id: result.expense.id, amount: Number(result.expense.amount), description: result.expense.description } : null,
  });
}
