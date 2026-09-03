import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  return Response.json(products);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const { name, category_id, selling_price, cost_price, hpp_breakdown, image_url, is_available } = body;
  if (!name || !category_id || selling_price == null || cost_price == null) return new Response("Missing fields", { status: 400 });
  const p = await prisma.product.create({ data: {
    name, category_id, selling_price: Number(selling_price), cost_price: Number(cost_price),
    hpp_breakdown: hpp_breakdown ? JSON.stringify(hpp_breakdown) : null,
    image_url: image_url || null, is_available: is_available ?? true
  }});
  return Response.json(p);
}
