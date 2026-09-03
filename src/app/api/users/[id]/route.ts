import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const body = await req.json();
  const data: any = {};
  if (body.name) data.name = body.name;
  if (body.role) data.role = body.role;
  if (body.is_active !== undefined) data.is_active = body.is_active;
  if (body.password) data.password_hash = await bcrypt.hash(body.password, 10);
  const u = await prisma.user.update({ where: { id: params.id }, data });
  return Response.json(u);
}
export async function DELETE(req: Request, { params }: { params: { id: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  await prisma.user.delete({ where: { id: params.id }});
  return Response.json({ ok: true });
}
