import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { output_item_id, quantity, note } = body as { output_item_id: string; quantity: number; note?: string };
  if (!output_item_id || !(Number(quantity) > 0)) return new Response("output_item_id and quantity>0 required", { status: 400 });

  const outputItem = await prisma.inventoryItem.findUnique({ where: { id: output_item_id } });
  if (!outputItem) return new Response("Output item not found", { status: 404 });
  if (outputItem.item_type !== "SEMI_FINISH") return new Response("Output must be SEMI_FINISH", { status: 400 });

  const bom = await prisma.inventoryRecipe.findMany({ where: { output_item_id }, include: { input_item: true } });
  if (bom.length === 0) return new Response("No BOM/blending recipe for this semi-finished item. Atur di Inventory -> Resep Semi", { status: 400 });

  const qty = Number(quantity);
  // Build consumption map
  const needs: Array<{ input: any; need: number }> = bom.map(r => ({ input: r.input_item, need: Number(r.quantity) * qty }));

  // Check stock
  for (const { input, need } of needs) {
    const cur = (input as any).current_stock?.toNumber ? (input as any).current_stock.toNumber() : Number(input.current_stock);
    if (cur < need) {
      return new Response(JSON.stringify({ error: `Stok tidak cukup: ${input.name} butuh ${need} ${input.unit}, sisa ${cur} ${input.unit}` }), { status: 409, headers: { "Content-Type": "application/json" } });
    }
  }

  // Compute blended cost per unit (weighted average of inputs)
  let totalCost = 0;
  for (const { input, need } of needs) {
    const uc = (input as any).average_cost?.toNumber ? (input as any).average_cost.toNumber() : Number(input.average_cost);
    totalCost += uc * need;
  }
  const unitCost = qty > 0 ? totalCost / qty : 0;

  const result = await prisma.$transaction(async (tx) => {
    // Decrement base inputs
    for (const { input, need } of needs) {
      await tx.stockMovement.create({
        data: {
          inventory_item_id: input.id,
          type: "PRODUCTION",
          quantity: -Math.abs(need),
          unit_cost: (input as any).average_cost != null ? Number((input as any).average_cost) : null,
          reference_type: "PRODUCTION",
          reference_id: output_item_id,
          note: note ? `Blend untuk ${outputItem.name} x${qty}: ${note}` : `Blend untuk ${outputItem.name} x${qty}`,
          created_by: session.user.id,
        },
      });
      await tx.inventoryItem.update({ where: { id: input.id }, data: { current_stock: { decrement: Math.abs(need) } } });
    }
    // Increment semi-finished output
    await tx.stockMovement.create({
      data: {
        inventory_item_id: output_item_id,
        type: "PRODUCTION",
        quantity: Math.abs(qty),
        unit_cost: Math.round(unitCost * 100) / 100,
        reference_type: "PRODUCTION",
        reference_id: output_item_id,
        note: note ? `Hasil blend ${outputItem.name} x${qty}: ${note}` : `Hasil blend ${outputItem.name} x${qty}`,
        created_by: session.user.id,
      },
    });
    const updatedOutput = await tx.inventoryItem.update({
      where: { id: output_item_id },
      data: { current_stock: { increment: Math.abs(qty) }, average_cost: Math.round(unitCost * 100) / 100 },
    });
    return { updatedOutput, needs, unitCost, totalCost };
  });

  try { revalidatePath("/inventory"); } catch {}
  return Response.json({ ok: true, output: result.updatedOutput, unit_cost: result.unitCost, total_cost: result.totalCost, consumed: needs.map(n=>({ name: n.input.name, unit: n.input.unit, quantity: n.need })) });
}
