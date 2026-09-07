import { getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import { getInventoryOverview } from "@/lib/inventory";

export default async function FinanceData({ tab, period }: { tab: string; period: string }) {
  const { from, to } = getDateRange(period);
  const [kpi, inv] = await Promise.all([getFinancialKPI(from, to), getInventoryOverview(30).catch(()=>null)]);

  if (tab === "overview") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"var(--text2)", letterSpacing:".08em" }}>REVENUE</div>
          <div style={{ fontSize:28, fontWeight:800, marginTop:6, letterSpacing:"-.03em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.revenue)}</div>
          <div className="muted" style={{ fontSize:11 }}>{kpi.transactionCount} transaksi • HPP {formatRupiah(kpi.hpp)}</div>
        </div>
        <div className="card" style={{ padding:14 }}>
          <div className="statement-line"><span className="muted">HPP / COGS</span><b style={{ fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.hpp)}</b></div>
          <div className="statement-line total" style={{ color: "var(--green)" }}><span>Gross Profit</span><b style={{ fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.grossProfit)} · {kpi.grossMargin.toFixed(1)}%</b></div>
          <div className="statement-line"><span className="muted">Operating Expense</span><b style={{ color: "var(--red)", fontVariantNumeric:"tabular-nums" as any }}>-{formatRupiah(kpi.totalExpense)}</b></div>
          <div className="statement-line total"><span>Net Profit</span><b style={{ color: kpi.netProfit >= 0 ? "var(--green)" : "var(--red)", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.netProfit)}</b></div>
        </div>
        <div className="card" style={{ padding:14, display: "flex", justifyContent: "space-between" }}>
          <div><div className="muted" style={{ fontSize:11 }}>Cash In</div><b style={{ color: "var(--green)", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.cashInflow)}</b></div>
          <div style={{ textAlign: "right" }}><div className="muted" style={{ fontSize:11 }}>Cash Out</div><b style={{ color: "var(--red)", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.cashOutflow)}</b></div>
        </div>
        {inv && (
          <div className="card" style={{ padding: 12, background:"var(--surface2)", borderStyle:"dashed" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--muted)", letterSpacing:".06em" }}>INVENTORY (INFORMATIONAL — NOT EXPENSE)</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:8 }}>
              <div><div className="muted" style={{ fontSize:10 }}>STOCK VALUE</div><div style={{ fontWeight:800 }}>{formatRupiah(inv.forecast.totalStockValuation)}</div><div className="muted" style={{ fontSize:10 }}>current × avg_cost</div></div>
              <div><div className="muted" style={{ fontSize:10 }}>FORECAST 7D / 30D</div><div style={{ fontWeight:700, fontSize:12 }}>{formatRupiah(inv.forecast.forecast7)} / {formatRupiah(inv.forecast.forecast30)}</div><div className="muted" style={{ fontSize:10 }}>Estimated purchasing — forecast</div></div>
            </div>
            <a href="/inventory" style={{ display:"block", textAlign:"center", marginTop:8, fontSize:11, fontWeight:700, color:"var(--accent)" }}>Lihat inventory →</a>
          </div>
        )}
      </div>
    );
  }
  if (tab === "cashflow") {
    return (
      <div data-onboarding="finance-cashflow" style={{ display: "grid", gap: 8 }}>
        <div className="card" style={{ padding:14 }}><div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", letterSpacing:".06em" }}>MONEY IN</div><div style={{ fontSize:20, fontWeight:800, color:"var(--green)", fontVariantNumeric:"tabular-nums" as any, marginTop:4 }}>{formatRupiah(kpi.cashInflow)}</div><div className="muted" style={{ marginTop:6, fontSize:11 }}>Sales + other in</div></div>
        <div className="card" style={{ padding:14 }}><div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", letterSpacing:".06em" }}>MONEY OUT</div><div style={{ fontSize:20, fontWeight:800, color:"var(--red)", fontVariantNumeric:"tabular-nums" as any, marginTop:4 }}>{formatRupiah(kpi.cashOutflow)}</div><div className="muted" style={{ marginTop:6, fontSize:11 }}>Expenses + other out</div></div>
        <div className="card" style={{ padding:14, background: "var(--primary)", color: "#fff" }}><div style={{ opacity:.7, fontSize:10, letterSpacing:".08em", fontWeight:800 }}>NET CASHFLOW</div><div style={{ fontSize:24, fontWeight:800, marginTop:6, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.netCashflow)}</div><div style={{ opacity:.7, fontSize:11, marginTop:4 }}>Closing {formatRupiah(kpi.cashPosition)}</div></div>
      </div>
    );
  }
  return (
    <div className="card statement">
      <div style={{ fontWeight: 700, fontSize: 14 }}>Profit & Loss</div>
      <div className="section-label">Revenue</div>
      <div className="statement-line"><span>Sales Revenue</span><b>{formatRupiah(kpi.revenue)}</b></div>
      <div className="statement-line"><span>HPP</span><b>-{formatRupiah(kpi.hpp)}</b></div>
      <div className="statement-line total"><span>Gross Profit</span><b>{formatRupiah(kpi.grossProfit)}</b></div>
      <div className="statement-line"><span>Operating Expenses</span><b>-{formatRupiah(kpi.totalExpense)}</b></div>
      <div className="statement-line total"><span>Net Profit</span><b style={{ color: kpi.netProfit >= 0 ? "var(--green)" : "var(--red)" }}>{formatRupiah(kpi.netProfit)}</b></div>
      <div className="section-label">Ratios</div>
      <div className="list" style={{ padding: 0 }}><div className="list-row"><span className="muted">Gross Margin</span><b>{kpi.grossMargin.toFixed(1)}%</b></div><div className="list-row"><span className="muted">Net Margin</span><b>{kpi.revenue ? ((kpi.netProfit / kpi.revenue) * 100).toFixed(1) : 0}%</b></div></div>
    </div>
  );
}
