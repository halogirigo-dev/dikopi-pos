import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const cats = await prisma.category.findMany({ orderBy: { name: "asc" }});
  return Response.json(cats);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { name } = await req.json();
  const c = await prisma.category.create({ data: { name }});
  revalidatePath("/pos");
  revalidatePath("/categories");
  return Response.json(c);
}
