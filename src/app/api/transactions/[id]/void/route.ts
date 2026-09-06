import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { reason } = await req.json();
  if (!reason) return new Response("Reason required", { status: 400 });

  // Fetch transaction with movements to reverse consumption atomically
  const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!existing) return new Response("Transaction not found", { status: 404 });
  if (existing.status === "VOID") return new Response("Already voided", { status: 400 });

  const result = await prisma.$transaction(async (txClient) => {
    const tx = await txClient.transaction.update({
      where: { id: params.id },
      data: { status: "VOID" as any, voided_by: session.user.id, voided_at: new Date(), void_reason: reason }
    });
    // Reverse inventory consumption: find SALE_CONSUMPTION movements linked to this transaction
    const movements = await txClient.stockMovement.findMany({
      where: { reference_type: "TRANSACTION", reference_id: params.id, type: "SALE_CONSUMPTION" }
    });
    for (const m of movements) {
      const qty = m.quantity as any;
      const absQty = Math.abs(qty?.toNumber ? qty.toNumber() : Number(qty));
      // Avoid duplicate reversal: check if RETURN already exists for this movement? use reference check
      const existingReturn = await txClient.stockMovement.findFirst({
        where: { reference_type: "TRANSACTION_VOID", reference_id: params.id, inventory_item_id: m.inventory_item_id, type: "RETURN" }
      });
      if (existingReturn) continue;
      await txClient.stockMovement.create({
        data: {
          inventory_item_id: m.inventory_item_id,
          type: "RETURN",
          quantity: absQty,
          unit_cost: m.unit_cost,
          reference_type: "TRANSACTION_VOID",
          reference_id: params.id,
          note: `Void ${existing.invoice_number}: ${reason}`,
          created_by: session.user.id,
        }
      });
      await txClient.inventoryItem.update({
        where: { id: m.inventory_item_id },
        data: { current_stock: { increment: absQty } }
      });
    }
    return tx;
  });

  try {
    revalidatePath("/dashboard");
    revalidatePath("/finance");
    revalidatePath("/cashflow");
    revalidatePath("/reports");
    revalidatePath("/transactions");
    revalidatePath("/inventory");
  } catch {}
  return Response.json(result);
}
