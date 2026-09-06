import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const limitRaw = parseInt(searchParams.get("limit") || "30", 10) || 30;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const movements = await prisma.stockMovement.findMany({
    where: { inventory_item_id: params.id },
    include: { creator: { select: { id: true, name: true, username: true } } },
    orderBy: { created_at: "desc" },
    take: limit,
  });
  return Response.json(movements.map((m: any) => ({ ...m, quantity: Number(m.quantity), unit_cost: m.unit_cost != null ? Number(m.unit_cost) : null })));
}
