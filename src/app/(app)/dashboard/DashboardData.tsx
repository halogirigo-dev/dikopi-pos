import { getFinancialKPI, getSalesReport, getProductPerformance } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";

export default async function DashboardData({ period }: { period: string }) {
  const { from, to } = getDateRange(period);
  const [kpi, sales, topProducts] = await Promise.all([
    getFinancialKPI(from, to),
    getSalesReport(from, to),
    getProductPerformance(from, to),
  ]);

  return (
    <>
      <div className="card" style={{ padding: 16, marginTop: 12 }}>
        <div className="kpi-label">Revenue Hari Ini</div>
        <div className="kpi-value lg">{formatRupiah(kpi.revenue)}</div>
        <div className="delta">{kpi.transactionCount} transaksi • {kpi.grossMargin.toFixed(1)}% gross margin</div>
        <a href="/pos" className="btn accent" style={{ width: "100%", marginTop: 14, minHeight: 48, fontSize: 15 }}>＋ Buat Transaksi</a>
      </div>

      <div className="grid-kpi" style={{ marginTop: 12 }}>
        <div className="card kpi"><div className="kpi-label">HPP</div><div className="kpi-value" style={{ fontSize: 20 }}>{formatRupiah(kpi.hpp)}</div><div className="delta">{kpi.revenue ? ((kpi.hpp / kpi.revenue) * 100).toFixed(1) : 0}% of revenue</div></div>
        <div className="card kpi"><div className="kpi-label">Gross Profit</div><div className="kpi-value positive" style={{ fontSize: 20 }}>{formatRupiah(kpi.grossProfit)}</div><div className="delta">Margin {kpi.grossMargin.toFixed(1)}%</div></div>
        <div className="card kpi"><div className="kpi-label">Expense</div><div className="kpi-value" style={{ fontSize: 20 }}>{formatRupiah(kpi.totalExpense)}</div><div className="delta">Operasional</div></div>
        <div className="card kpi"><div className="kpi-label">Net Profit</div><div className={`kpi-value ${kpi.netProfit >= 0 ? "positive" : "negative"}`} style={{ fontSize: 20 }}>{formatRupiah(kpi.netProfit)}</div><div className="delta">{kpi.revenue ? ((kpi.netProfit / kpi.revenue) * 100).toFixed(1) : 0}% net</div></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head"><div className="card-title">Ringkasan Penjualan</div><div className="muted">{period}</div></div>
        <div style={{ padding: 16, display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
          {sales.length ? sales.slice(-7).map((s, i, arr) => {
            const max = Math.max(...sales.map(x => x.revenue), 1);
            const h = Math.max(12, (s.revenue / max) * 90);
            return <div key={s.date} style={{ flex: 1, background: i === arr.length - 1 ? "var(--accent)" : "var(--border)", borderRadius: "6px 6px 0 0", height: `${h}%`, minHeight: 12 }} title={`${s.date}: ${formatRupiah(s.revenue)}`} />;
          }) : <div className="muted" style={{ padding: 20 }}>Belum ada penjualan</div>}
        </div>
        <div className="muted" style={{ padding: "0 16px 12px", fontSize: 11 }}>7 hari terakhir · Cashflow In {formatRupiah(kpi.cashInflow)} / Out {formatRupiah(kpi.cashOutflow)}</div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-head"><div className="card-title">Top Products</div><a href="/reports?view=products" className="btn" style={{ fontSize: 12, minHeight: 32 }}>Lihat semua</a></div>
        <div className="list">
          {topProducts.slice(0, 3).map((p, i) => (
            <div key={p.product_id} className="list-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{i + 1}. {p.product_name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{p.sold} terjual</div>
              </div>
              <b style={{ fontSize: 13 }}>{formatRupiah(p.revenue)}</b>
            </div>
          ))}
          {!topProducts.length && <div className="list-row"><span className="muted">Belum ada penjualan</span><b>-</b></div>}
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 12, background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" }}>
        <div style={{ fontSize: 11, opacity: .7, letterSpacing: ".08em", fontWeight: 700 }}>CASH POSITION</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6, letterSpacing: "-.02em" }}>{formatRupiah(kpi.cashPosition)}</div>
        <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>Net cashflow {formatRupiah(kpi.netCashflow)} • Opening {formatRupiah(kpi.openingBalance)}</div>
      </div>
    </>
  );
}
