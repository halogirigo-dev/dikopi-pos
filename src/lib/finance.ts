import { prisma } from "./prisma";
import { getDateRange } from "./utils";

export async function getFinancialKPI(from: Date, to: Date) {
  const tx = await prisma.transaction.findMany({
    where: { created_at: { gte: from, lte: to }, status: "COMPLETED" },
    include: { items: true },
  });
  const revenue = tx.reduce((s, t) => s + t.total_revenue, 0);
  const hpp = tx.reduce((s, t) => s + t.total_cogs, 0);
  const grossProfit = revenue - hpp;
  const grossMargin = revenue ? (grossProfit / revenue) * 100 : 0;

  const expenses = await prisma.expense.findMany({
    where: { expense_date: { gte: from, lte: to } },
  });
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - totalExpense;

  // cashflow: inflow = revenue (all payment methods considered cash in), outflow = expenses + adjustments
  const adjustments = await prisma.cashAdjustment.findMany({
    where: { created_at: { gte: from, lte: to } },
  });
  // opening balance from settings
  const openingSetting = await prisma.setting.findUnique({ where: { key: "opening_balance" } });
  const openingBalance = openingSetting ? parseInt(openingSetting.value) : 0;

  // net cashflow in period
  const cashInflow = revenue + adjustments.filter(a => a.type === "CORRECTION" && a.amount > 0).reduce((s,a)=>s+a.amount,0);
  const cashOutflow = totalExpense + adjustments.filter(a => a.type === "CORRECTION" && a.amount < 0).reduce((s,a)=>s+Math.abs(a.amount),0);
  const netCashflow = cashInflow - cashOutflow;

  // cash position: opening + all time inflow - all time outflow (if viewing full period use same, else compute all time)
  const allTx = await prisma.transaction.findMany({ where: { status: "COMPLETED" }});
  const allRevenue = allTx.reduce((s,t)=>s+t.total_revenue,0);
  const allExpenses = await prisma.expense.findMany();
  const allExpenseTotal = allExpenses.reduce((s,e)=>s+e.amount,0);
  const allAdj = await prisma.cashAdjustment.findMany();
  const allAdjSum = allAdj.reduce((s,a)=> {
    if (a.type === "OPENING_BALANCE") return s;
    return s + a.amount;
  },0);
  const cashPosition = openingBalance + allRevenue - allExpenseTotal + allAdjSum;

  return {
    revenue, hpp, grossProfit, grossMargin, totalExpense, netProfit,
    cashInflow, cashOutflow, netCashflow, cashPosition, openingBalance,
    transactionCount: tx.length,
  };
}

export async function getSalesReport(from: Date, to: Date) {
  // group by date
  const txs = await prisma.transaction.findMany({
    where: { created_at: { gte: from, lte: to }, status: "COMPLETED" },
    orderBy: { created_at: "asc" },
  });
  const map = new Map<string, { date: string; transactions: number; revenue: number; hpp: number; gross: number }>();
  for (const t of txs) {
    const key = t.created_at.toISOString().slice(0,10);
    const cur = map.get(key) || { date: key, transactions: 0, revenue: 0, hpp: 0, gross: 0 };
    cur.transactions += 1;
    cur.revenue += t.total_revenue;
    cur.hpp += t.total_cogs;
    cur.gross += t.gross_profit;
    map.set(key, cur);
  }
  return Array.from(map.values());
}

export async function getProductPerformance(from: Date, to: Date) {
  const items = await prisma.transactionItem.findMany({
    where: { transaction: { created_at: { gte: from, lte: to }, status: "COMPLETED" } },
  });
  const map = new Map<string, { product_id: string; product_name: string; sold: number; revenue: number; hpp: number; gross: number }>();
  for (const it of items) {
    const cur = map.get(it.product_id) || { product_id: it.product_id, product_name: it.product_name, sold: 0, revenue: 0, hpp: 0, gross: 0 };
    cur.sold += it.quantity;
    cur.revenue += it.revenue;
    cur.hpp += it.cogs;
    cur.gross += it.gross_profit;
    map.set(it.product_id, cur);
  }
  return Array.from(map.values()).map(r => ({ ...r, margin: r.revenue ? (r.gross / r.revenue) * 100 : 0 })).sort((a,b)=> b.revenue - a.revenue);
}
