import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.get("limit") || "50", 10) || 50;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (from && to) where.expense_date = { gte: new Date(from), lte: new Date(to) };
  const hasPagination = searchParams.has("page") || searchParams.has("limit");
  if (hasPagination) {
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, include: { category: true, creator: { select: { id: true, name: true, username: true, role: true } } }, orderBy: { expense_date: "desc" }, skip, take: limit }),
      prisma.expense.count({ where }),
    ]);
    return Response.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }
  // SECURITY: select safe creator fields only
  const data = await prisma.expense.findMany({ where, include: { category: true, creator: { select: { id: true, name: true, username: true, role: true } } }, orderBy: { expense_date: "desc" }, take: 100 });
  return Response.json(data);
}
export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  // cashier check via setting
  if (session.user.role === "CASHIER") {
    const setting = await prisma.setting.findUnique({ where: { key: "allow_cashier_expense" }});
    if (!setting || setting.value !== "true") return new Response("Forbidden", { status: 403 });
  }
  const body = await req.json();
  const { category_id, description, amount, payment_method, expense_date, notes } = body;
  if (!category_id || !description || !amount || !payment_method) return new Response("Missing fields", { status: 400 });
  const e = await prisma.expense.create({ data: {
    category_id, description, amount: Number(amount), payment_method: payment_method as any,
    expense_date: expense_date ? new Date(expense_date) : new Date(),
    created_by: session.user.id, notes: notes || null
  }});
  try { revalidatePath("/dashboard"); revalidatePath("/finance"); revalidatePath("/expenses"); revalidatePath("/cashflow"); revalidatePath("/reports"); } catch {}
  return Response.json(e);
}
