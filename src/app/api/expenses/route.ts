import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: any = {};
  if (from && to) where.expense_date = { gte: new Date(from), lte: new Date(to) };
  const data = await prisma.expense.findMany({ where, include: { category: true, creator: true }, orderBy: { expense_date: "desc" }});
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
  return Response.json(e);
}
