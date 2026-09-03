import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET() { return Response.json(await prisma.expenseCategory.findMany({ orderBy: { name: "asc" }})); }
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { name } = await req.json();
  const c = await prisma.expenseCategory.create({ data: { name }});
  return Response.json(c);
}
