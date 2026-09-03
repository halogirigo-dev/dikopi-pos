import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { name, category_id, selling_price, cost_price, hpp_breakdown, image_url, is_available } = body;
  const p = await prisma.product.update({ where: { id: params.id }, data: {
    name, category_id, selling_price: Number(selling_price), cost_price: Number(cost_price),
    hpp_breakdown: hpp_breakdown ?? null,
    image_url: image_url || null, is_available
  }});
  return Response.json(p);
}
export async function DELETE(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  await prisma.product.delete({ where: { id: params.id }});
  return Response.json({ ok: true });
}
