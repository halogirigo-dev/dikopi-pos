import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
export async function PUT(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { name } = await req.json();
  const c = await prisma.category.update({ where: { id: params.id }, data: { name }});
  revalidatePath("/pos");
  revalidatePath("/categories");
  return Response.json(c);
}
export async function DELETE(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  await prisma.category.delete({ where: { id: params.id }});
  revalidatePath("/pos");
  revalidatePath("/categories");
  return Response.json({ ok: true });
}
