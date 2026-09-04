import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const all = await prisma.setting.findMany();
  const obj: Record<string,string> = {};
  all.forEach(s=>obj[s.key]=s.value);
  return Response.json(obj);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { key, value } = await req.json();
  if (!key) return new Response("Missing key", { status: 400 });
  const s = await prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) }});
  return Response.json(s);
}
