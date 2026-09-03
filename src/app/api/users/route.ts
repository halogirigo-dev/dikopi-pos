import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, username: true, role: true, is_active: true, created_at: true }, orderBy: { created_at: "desc" }});
  return Response.json(users);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { name, username, password, role } = await req.json();
  if (!name || !username || !password) return new Response("Missing", { status: 400 });
  const hash = await bcrypt.hash(password, 10);
  const u = await prisma.user.create({ data: { name, username, password_hash: hash, role: role || "CASHIER" }});
  return Response.json({ id: u.id, name: u.name, username: u.username, role: u.role });
}
