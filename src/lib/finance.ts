import { prisma } from "./prisma";

// Optimized KPI: use DB aggregation (SUM/COUNT) instead of loading all rows into Node.js
// Preserves financial semantics:
//   grossProfit = revenue - hpp
//   netProfit   = grossProfit - totalExpense
//   cashPosition = openingBalance + allRevenue - allExpense + allAdjSum(CORRECTION only)
export async function getFinancialKPI(from: Date, to: Date) {
  const [
    txAgg,
    expenseAgg,
    adjPosAgg,
    adjNegAgg,
    openingSetting,
    allTxAgg,
    allExpenseAgg,
    allAdjAgg,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { created_at: { gte: from, lte: to }, status: "COMPLETED" },
      _sum: { total_revenue: true, total_cogs: true, gross_profit: true },
      _count: { _all: true },
    }),
    prisma.expense.aggregate({
      where: { expense_date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.cashAdjustment.aggregate({
      where: { created_at: { gte: from, lte: to }, type: "CORRECTION", amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.cashAdjustment.aggregate({
      where: { created_at: { gte: from, lte: to }, type: "CORRECTION", amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.setting.findUnique({ where: { key: "opening_balance" } }),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { total_revenue: true },
    }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.cashAdjustment.aggregate({
      where: { type: "CORRECTION" },
      _sum: { amount: true },
    }),
  ]);

  const revenue = txAgg._sum.total_revenue ?? 0;
  const hpp = txAgg._sum.total_cogs ?? 0;
  const grossProfit = revenue - hpp;
  const grossMargin = revenue ? (grossProfit / revenue) * 100 : 0;

  const totalExpense = expenseAgg._sum.amount ?? 0;
  const netProfit = grossProfit - totalExpense;

  const openingBalance = openingSetting ? parseInt(openingSetting.value) : 0;

  const posAdj = adjPosAgg._sum.amount ?? 0;
  const negAdjAbs = Math.abs(adjNegAgg._sum.amount ?? 0);
  const cashInflow = revenue + posAdj;
  const cashOutflow = totalExpense + negAdjAbs;
  const netCashflow = cashInflow - cashOutflow;

  const allRevenue = allTxAgg._sum.total_revenue ?? 0;
  const allExpenseTotal = allExpenseAgg._sum.amount ?? 0;
  const allAdjSum = allAdjAgg._sum.amount ?? 0;
  const cashPosition = openingBalance + allRevenue - allExpenseTotal + allAdjSum;

  return {
    revenue, hpp, grossProfit, grossMargin, totalExpense, netProfit,
    cashInflow, cashOutflow, netCashflow, cashPosition, openingBalance,
    transactionCount: txAgg._count._all,
  };
}

export async function getSalesReport(from: Date, to: Date) {
  // Use DB aggregation to avoid loading all transactions into JS
  // Prisma $queryRaw for date-grouped SUM/COUNT
  const rows = await prisma.$queryRaw<Array<{ date: string; transactions: bigint; revenue: bigint; hpp: bigint; gross: bigint }>>`
    SELECT
      DATE("created_at") as date,
      COUNT(*)::bigint as transactions,
      COALESCE(SUM("total_revenue"),0)::bigint as revenue,
      COALESCE(SUM("total_cogs"),0)::bigint as hpp,
      COALESCE(SUM("gross_profit"),0)::bigint as gross
    FROM "Transaction"
    WHERE "created_at" >= ${from} AND "created_at" <= ${to} AND "status" = 'COMPLETED'
    GROUP BY DATE("created_at")
    ORDER BY DATE("created_at") ASC
  `;
  return rows.map(r => ({
    date: String(r.date).slice(0,10),
    transactions: Number(r.transactions),
    revenue: Number(r.revenue),
    hpp: Number(r.hpp),
    gross: Number(r.gross),
  }));
}

export async function getProductPerformance(from: Date, to: Date) {
  // Aggregate at DB level via JOIN - avoids loading all items into Node.js
  const rows = await prisma.$queryRaw<Array<{ product_id: string; product_name: string; sold: bigint; revenue: bigint; hpp: bigint; gross: bigint }>>`
    SELECT
      ti."product_id" as product_id,
      ti."product_name" as product_name,
      COALESCE(SUM(ti."quantity"),0)::bigint as sold,
      COALESCE(SUM(ti."revenue"),0)::bigint as revenue,
      COALESCE(SUM(ti."cogs"),0)::bigint as hpp,
      COALESCE(SUM(ti."gross_profit"),0)::bigint as gross
    FROM "TransactionItem" ti
    JOIN "Transaction" t ON t."id" = ti."transaction_id"
    WHERE t."created_at" >= ${from} AND t."created_at" <= ${to} AND t."status" = 'COMPLETED'
    GROUP BY ti."product_id", ti."product_name"
    ORDER BY revenue DESC
  `;
  return rows.map(r => {
    const revenue = Number(r.revenue);
    const gross = Number(r.gross);
    return {
      product_id: r.product_id,
      product_name: r.product_name,
      sold: Number(r.sold),
      revenue,
      hpp: Number(r.hpp),
      gross,
      margin: revenue ? (gross / revenue) * 100 : 0,
    };
  }).sort((a,b)=> b.revenue - a.revenue);
}
