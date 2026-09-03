import { getFinancialKPI, getSalesReport, getProductPerformance } from "@/lib/finance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/pos");

  const period = searchParams.period || "thisMonth";
  const { getDateRange } = await import("@/lib/utils");
  const { from, to } = getDateRange(period);
  const kpi = await getFinancialKPI(from, to);
  const sales = await getSalesReport(from, to);
  const topProducts = await getProductPerformance(from, to);

  // payment breakdown
  const txs = await prisma.transaction.findMany({ where: { created_at: { gte: from, lte: to }, status: "COMPLETED" }});
  const payMap: Record<string, number> = {};
  txs.forEach(t=> { payMap[t.payment_method] = (payMap[t.payment_method]||0)+ t.total_revenue; });

  const maxSales = Math.max(...sales.map(s=>s.revenue), 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <div className="date">Periode {period} · {from.toLocaleDateString("id-ID")} - {to.toLocaleDateString("id-ID")}</div>
        </div>
        <DashboardClient period={period} />
      </div>

      <div className="grid6">
        <div className="card kpi"><div className="kpi-label">Revenue</div><div className="kpi-value">{formatRupiah(kpi.revenue)}</div><div className="delta">{kpi.transactionCount} transaksi · {kpi.grossMargin.toFixed(1)}% margin</div></div>
        <div className="card kpi"><div className="kpi-label">HPP / COGS</div><div className="kpi-value">{formatRupiah(kpi.hpp)}</div><div className="delta">{kpi.revenue ? ((kpi.hpp/kpi.revenue)*100).toFixed(1) : 0}% of revenue</div></div>
        <div className="card kpi"><div className="kpi-label">Gross Profit</div><div className="kpi-value positive">{formatRupiah(kpi.grossProfit)}</div><div className="delta">{kpi.grossMargin.toFixed(1)}% gross margin</div></div>
        <div className="card kpi"><div className="kpi-label">Operating Expense</div><div className="kpi-value">{formatRupiah(kpi.totalExpense)}</div><div className="delta">Net {formatRupiah(kpi.netProfit)}</div></div>
        <div className="card kpi"><div className="kpi-label">Net Profit</div><div className="kpi-value positive">{formatRupiah(kpi.netProfit)}</div><div className="delta">Sisa setelah HPP & expense</div></div>
        <div className="card kpi"><div className="kpi-label">Cash Position</div><div className="kpi-value">{formatRupiah(kpi.cashPosition)}</div><div className="delta">In {formatRupiah(kpi.cashInflow)} · Out {formatRupiah(kpi.cashOutflow)}</div></div>
      </div>

      <div className="row">
        <div className="card">
          <div className="card-head"><div><div className="card-title">Revenue Trend</div><div className="muted">Daily sales · {period}</div></div></div>
          <div className="chart">
            {sales.length ? sales.slice(-7).map((s,i)=> (
              <div key={s.date} className={`bar ${i===sales.slice(-7).length-1 ? "ac" : ""}`} style={{ height: `${Math.max(25, (s.revenue/maxSales)*90)}%` }}><small>{s.date.slice(5)}</small></div>
            )) : <div className="muted" style={{ padding: 20 }}>Belum ada data</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Payment Breakdown</div><div className="muted">{period}</div></div>
          <div className="list">
            {Object.entries(payMap).length ? Object.entries(payMap).map(([k,v])=> (
              <div key={k} className="list-row"><span>{k}</span><b>{formatRupiah(v as number)}</b></div>
            )) : <div className="list-row"><span>Belum ada</span><b>-</b></div>}
          </div>
        </div>
      </div>

      <div className="row">
        <div className="card">
          <div className="card-head"><div className="card-title">Cashflow</div><div className="muted">Inflow vs outflow</div></div>
          <div className="list">
            <div className="list-row"><span>Total Cash In</span><b className="positive">+{formatRupiah(kpi.cashInflow)}</b></div>
            <div className="list-row"><span>Total Cash Out</span><b className="negative">−{formatRupiah(kpi.cashOutflow)}</b></div>
            <div className="list-row"><span>Net Cashflow</span><b>{formatRupiah(kpi.netCashflow)}</b></div>
            <div className="list-row"><span>Cash Position</span><b>{formatRupiah(kpi.cashPosition)}</b></div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div className="card-title">Top Products</div><a href="/reports?view=products" className="btn">View all</a></div>
          <div className="list">
            {topProducts.slice(0,3).map((p,i)=> (
              <div key={p.product_id} className="list-row"><span>{i+1} · {p.product_name}</span><b>{formatRupiah(p.revenue)}</b></div>
            ))}
            {!topProducts.length && <div className="list-row"><span>Belum ada penjualan</span><b>-</b></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
