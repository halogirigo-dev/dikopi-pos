import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET() {
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" }});
  return Response.json(cats);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { name } = await req.json();
  const c = await prisma.category.create({ data: { name }});
  return Response.json(c);
}
