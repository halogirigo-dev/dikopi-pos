import { getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import { getInventoryOverview } from "@/lib/inventory";
import { getCogsVariance } from "@/lib/cogs";

export default async function FinanceData({ tab, period }: { tab: string; period: string }) {
  const { from, to } = getDateRange(period);
  const [kpi, inv, cogsVar] = await Promise.all([getFinancialKPI(from, to), getInventoryOverview(30).catch(()=>null), getCogsVariance(10).catch(()=>null)]);

  if (tab === "overview") {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        <div className="card" style={{ padding:14 }}>
          <div style={{ fontSize:10, fontWeight:800, color:"var(--text2)", letterSpacing:".08em" }}>REVENUE</div>
          <div style={{ fontSize:28, fontWeight:800, marginTop:6, letterSpacing:"-.03em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.revenue)}</div>
          <div className="muted" style={{ fontSize:11 }}>{kpi.transactionCount} transaksi • HPP {formatRupiah(kpi.hpp)}</div>
        </div>
        <div className="card" style={{ padding:14 }}>
          {(() => {
            const ratio = kpi.revenue ? (kpi.hpp/kpi.revenue)*100 : 0;
            const health = !kpi.revenue ? {label:"-", color:"var(--muted)", bg:"var(--surface2)"} : ratio<=35 ? {label:"Sehat", color:"var(--green)", bg:"var(--green-soft)"} : ratio<=50 ? {label:"Cukup", color:"var(--warning)", bg:"var(--warning-soft)"} : {label:"Tipis", color:"var(--red)", bg:"var(--red-soft)"};
            return (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:11, fontWeight:800, letterSpacing:".06em", color:"var(--muted)" }}>COGS OVERVIEW</span>
                  <span style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:999, background:health.bg, color:health.color }}>{health.label} • {ratio.toFixed(1)}%</span>
                </div>
                <div className="statement-line"><span className="muted">HPP / COGS</span><b style={{ fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.hpp)}</b></div>
                <div style={{ height:4, background:"var(--surface2)", borderRadius:999, margin:"6px 0 8px", overflow:"hidden" }}><div style={{ width:`${Math.min(100,ratio)}%`, height:"100%", background:health.color as string }} /></div>
                <div className="statement-line total" style={{ color: "var(--green)" }}><span>Gross Profit</span><b style={{ fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.grossProfit)} · {kpi.grossMargin.toFixed(1)}%</b></div>
                <div className="statement-line"><span className="muted">Operating Expense</span><b style={{ color: "var(--red)", fontVariantNumeric:"tabular-nums" as any }}>-{formatRupiah(kpi.totalExpense)}</b></div>
                <div className="statement-line total"><span>Net Profit</span><b style={{ color: kpi.netProfit >= 0 ? "var(--green)" : "var(--red)", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.netProfit)}</b></div>
                <div style={{ display:"flex", gap:8, marginTop:10 }}><a href="/reports?view=cogs" className="btn" style={{ flex:1, fontSize:12, minHeight:36 }}>COGS Detail →</a><a href="/products" className="btn" style={{ fontSize:12, minHeight:36 }}>Products</a></div>
              </>
            );
          })()}
        </div>
        {cogsVar && (cogsVar.counts.drift>0 || cogsVar.counts.noRecipe>0) && (
          <div className="card" style={{ padding:12, background: cogsVar.counts.drift? "var(--warning-soft)" : "var(--surface2)", borderColor: cogsVar.counts.drift? "var(--warning)" : "var(--border)", borderStyle: cogsVar.counts.drift? "solid":"dashed" }}>
            <div style={{ fontSize:11, fontWeight:800, color: cogsVar.counts.drift?"var(--warning)":"var(--muted)" }}>{cogsVar.counts.drift? "⚠️ COGS DRIFT":"ℹ️ COGS CHECK"}</div>
            <div style={{ fontSize:12, fontWeight:700, marginTop:4 }}>{cogsVar.counts.drift} produk HPP beda &gt;10% dari resep • {cogsVar.counts.noRecipe} tanpa resep</div>
            <div className="muted" style={{ fontSize:11, marginTop:4 }}>{cogsVar.items.filter((x:any)=>x.status==="DRIFT").slice(0,2).map((x:any)=>`${x.product_name} ${formatRupiah(x.stored_cost)}→${formatRupiah(x.recipe_cost)}`).join(" • ") || "Lengkapi resep"}</div>
            <a href="/reports?view=cogs" style={{ fontSize:11, fontWeight:700, color:"var(--accent)", marginTop:6, display:"inline-block" }}>Lihat COGS →</a>
          </div>
        )}
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
