import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const tx = await prisma.transaction.findUnique({ where: { id: params.id } });
  if (!tx) return new Response("Not found", { status: 404 });
  if (session.user.role === "CASHIER" && tx.user_id !== session.user.id) return new Response("Forbidden", { status: 403 });
  const movements = await prisma.stockMovement.findMany({
    where: { reference_type: "TRANSACTION", reference_id: params.id },
    include: { inventory_item: { select: { id: true, name: true, unit: true, sku: true } } },
    orderBy: { created_at: "asc" },
  });
  return Response.json(movements.map((m: any) => ({
    ...m,
    quantity: Number(m.quantity),
    unit_cost: m.unit_cost != null ? Number(m.unit_cost) : null,
  })));
}
