import { prisma } from "@/lib/prisma";
import ExpensesClient from "./ExpensesClient";
import { getDateRange } from "@/lib/utils";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExpensesPage({ searchParams }: { searchParams: { period?: string; date?: string; month?: string; category?: string; from?: string; to?: string } }) {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" }});

  let from: Date | null = null;
  let to: Date | null = null;
  let activeLabel = "Semua";

  if (searchParams.date) {
    const d = new Date(searchParams.date);
    if (!isNaN(d.getTime())) {
      from = new Date(d); from.setHours(0,0,0,0);
      to = new Date(d); to.setHours(23,59,59,999);
      activeLabel = new Date(d).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
    }
  } else if (searchParams.month) {
    const m = new Date(searchParams.month + "-01");
    if (!isNaN(m.getTime())) {
      from = new Date(m.getFullYear(), m.getMonth(), 1, 0,0,0,0);
      to = new Date(m.getFullYear(), m.getMonth()+1, 0, 23,59,59,999);
      activeLabel = new Date(m).toLocaleDateString("id-ID", { month:"long", year:"numeric" });
    }
  } else if (searchParams.period && searchParams.period !== "all") {
    if (searchParams.period === "custom" && searchParams.from) {
      const r = getDateRange("custom", searchParams.from, searchParams.to);
      from = r.from; to = r.to;
      activeLabel = `${from.toLocaleDateString("id-ID")} - ${to.toLocaleDateString("id-ID")}`;
    } else {
      const r = getDateRange(searchParams.period);
      from = r.from; to = r.to;
      const labels: Record<string,string> = { today:"Hari ini", thisMonth:"Bulan ini", thisWeek:"Minggu ini", lastMonth:"Bulan lalu", yesterday:"Kemarin" };
      activeLabel = labels[searchParams.period] || searchParams.period;
    }
  } else if (searchParams.from && searchParams.to) {
    const r = getDateRange("custom", searchParams.from, searchParams.to);
    from = r.from; to = r.to;
    activeLabel = `${from.toLocaleDateString("id-ID")} - ${to.toLocaleDateString("id-ID")}`;
  }

  const where: any = {};
  if (from && to) where.expense_date = { gte: from, lte: to };
  if (searchParams.category && searchParams.category !== "all") where.category_id = searchParams.category;

  const expenses = await prisma.expense.findMany({ where, include: { category: true, creator: { select: { id: true, name: true, username: true, role: true } } }, orderBy: { expense_date: "desc" }, take: 100 });

  return (
    <>
      <RealtimeRefresher tables={["Expense"]} intervalMs={12000} />
      <ExpensesClient categories={categories} expenses={expenses} activeLabel={activeLabel} initialParams={searchParams} />
    </>
  );
}
