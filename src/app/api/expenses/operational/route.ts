import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = {
    // Exclude auto-generated stock purchase expenses — those are tracked under "Raw Material"
    NOT: { category: { name: "Raw Material" } },
  };
  if (from && to) where.expense_date = { gte: new Date(from), lte: new Date(to) };

  const [expenses, catAgg] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true, creator: { select: { id: true, name: true } } },
      orderBy: { expense_date: "desc" },
      take: 100,
    }),
    prisma.expense.groupBy({
      by: ["category_id"] as any,
      where,
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } } as any,
    }),
  ]);

  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" } });
  const perCat = (catAgg as any[]).map((g: any) => ({
    ...g,
    category: categories.find((c) => c.id === g.category_id),
  }));

  const total = expenses.reduce((s: number, e: any) => s + e.amount, 0);
  return Response.json({ expenses, perCat, total, count: expenses.length });
}
