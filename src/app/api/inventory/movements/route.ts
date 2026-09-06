import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const inventory_item_id = searchParams.get("inventory_item_id");
  const type = searchParams.get("type");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.get("limit") || "50", 10) || 50;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (inventory_item_id) where.inventory_item_id = inventory_item_id;
  if (type) where.type = type as any;
  if (from && to) where.created_at = { gte: new Date(from), lte: new Date(to) };
  else if (from) where.created_at = { gte: new Date(from) };
  else if (to) where.created_at = { lte: new Date(to) };

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        inventory_item: { select: { id: true, name: true, unit: true, sku: true } },
        creator: { select: { id: true, name: true, username: true } },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);
  const serialized = data.map((m: any) => ({
    ...m,
    quantity: Number(m.quantity),
    unit_cost: m.unit_cost != null ? Number(m.unit_cost) : null,
  }));
  return Response.json({ data: serialized, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}
