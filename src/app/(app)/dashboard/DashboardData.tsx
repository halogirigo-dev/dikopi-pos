import { getFinancialKPI, getSalesReport, getProductPerformance } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import { getInventoryOverview } from "@/lib/inventory";
import { getCogsVariance, getCogsByCategory } from "@/lib/cogs";

export default async function DashboardData({ period }: { period: string }) {
  const { from, to } = getDateRange(period);
  const [kpi, sales, topProducts, invOverview, cogsVariance, byCategory] = await Promise.all([
    getFinancialKPI(from, to),
    getSalesReport(from, to),
    getProductPerformance(from, to),
    getInventoryOverview(30).catch(()=>null),
    getCogsVariance(10).catch(()=>({ items:[], counts:{total:0,ok:0,drift:0,noRecipe:0}, driftTotalDiff:0 } as any)),
    getCogsByCategory(from,to).catch(()=>[]),
  ]);
  const hppRatio = kpi.revenue ? (kpi.hpp / kpi.revenue)*100 : 0;
  const hppHealth = !kpi.revenue ? {label:"-", color:"var(--muted)", bg:"var(--surface2)"} : hppRatio <= 35 ? {label:"Sehat", color:"var(--green)", bg:"var(--green-soft)"} : hppRatio <= 50 ? {label:"Cukup", color:"var(--warning)", bg:"var(--warning-soft)"} : {label:"Tipis", color:"var(--red)", bg:"var(--red-soft)"};
  const topByHpp = [...topProducts].sort((a,b)=> b.hpp - a.hpp).slice(0,3);

  return (
    <div style={{ display:"grid", gap:8 }}>
      <div data-onboarding="dash-revenue" className="card" style={{ padding:14 }}>
        <div className="kpi-label">Revenue Hari Ini</div>
        <div className="kpi-value lg" style={{ fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.revenue)}</div>
        <div className="delta">{kpi.transactionCount} transaksi • {kpi.grossMargin.toFixed(1)}% gross margin</div>
        <a href="/pos" className="btn accent" style={{ width: "100%", marginTop:12, minHeight:44, fontSize:14 }}>＋ Buat Transaksi</a>
      </div>

      <div data-onboarding="dash-kpi" className="grid-kpi">
        <div className="card kpi" style={{ padding:14, position:"relative", overflow:"hidden" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div className="kpi-label">HPP / COGS</div>
            <span style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:999, background:hppHealth.bg, color:hppHealth.color, letterSpacing:".06em" }}>{hppHealth.label}</span>
          </div>
          <div className="kpi-value" style={{ fontSize:20, fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.hpp)}</div>
          <div className="delta">{hppRatio.toFixed(1)}% of revenue • {kpi.revenue ? `${formatRupiah(kpi.hpp)}/${formatRupiah(kpi.revenue)}` : "no revenue"}</div>
          <div style={{ height:4, background:"var(--surface2)", borderRadius:999, marginTop:8, overflow:"hidden" }}>
            <div style={{ width:`${Math.min(100, hppRatio)}%`, height:"100%", background: hppHealth.color as string, borderRadius:999 }} />
          </div>
          <a href="/reports?view=cogs" style={{ fontSize:11, fontWeight:700, color:"var(--accent)", marginTop:6, display:"inline-block" }}>Detail COGS →</a>
        </div>
        <div className="card kpi" style={{ padding:14 }}><div className="kpi-label">Gross Profit</div><div className="kpi-value positive" style={{ fontSize:20, fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.grossProfit)}</div><div className="delta">Margin {kpi.grossMargin.toFixed(1)}% • HPP {hppRatio.toFixed(1)}%</div></div>
        <div className="card kpi" style={{ padding:14 }}><div className="kpi-label">Expense</div><div className="kpi-value" style={{ fontSize:20, fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.totalExpense)}</div><div className="delta">Operasional • {kpi.revenue? ((kpi.totalExpense/kpi.revenue)*100).toFixed(1):0}% of rev</div></div>
        <div className="card kpi" style={{ padding:14 }}><div className="kpi-label">Net Profit</div><div className={`kpi-value ${kpi.netProfit >= 0 ? "positive" : "negative"}`} style={{ fontSize:20, fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.netProfit)}</div><div className="delta">{kpi.revenue ? ((kpi.netProfit / kpi.revenue) * 100).toFixed(1) : 0}% net • after HPP</div></div>
      </div>

      {/* Warning Card — ultra-minimal for UMKM owners */}
      {cogsVariance && (cogsVariance.counts.drift > 0 || cogsVariance.counts.noRecipe > 0) && (
        <div className="card" style={{ padding:16, borderColor:"var(--warning)", background:"var(--warning-soft)" }}>
          <div style={{ fontSize:14, fontWeight:700 }}>⚠️ Cek Harga Modal</div>
          <div className="muted" style={{ fontSize:12, marginTop:6, lineHeight:"18px" }}>Ada perbedaan harga modal di sistem dengan resep.</div>
          <a href="/products" className="btn accent" style={{ width:"100%", marginTop:14, minHeight:44, fontSize:14, borderRadius:12, fontWeight:700 }}>Perbaiki Sekarang</a>
        </div>
      )}

      <div data-onboarding="dash-chart" className="card" style={{ overflow:"hidden" }}>
        <div className="card-head" style={{ borderBottom:"none", paddingBottom:12 }}><div className="card-title" style={{ fontSize:16, fontWeight:800 }}>Keuangan Hari Ini</div></div>
        {/* 4 prominent metrics — Omset / Modal / Operasional / Sisa Uang */}
        <div style={{ display:"grid", gap:10, padding:"0 16px 16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
            <div style={{ background:"var(--surface2)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:".06em" }}>OMSET</div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:6, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.revenue)}</div>
            </div>
            <div style={{ background:"var(--surface2)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:".06em" }}>MODAL</div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:6, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.hpp)}</div>
            </div>
            <div style={{ background:"var(--surface2)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:".06em" }}>OPERASIONAL</div>
              <div style={{ fontSize:18, fontWeight:800, marginTop:6, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.totalExpense)}</div>
            </div>
          </div>
          <div style={{ background:"var(--primary)", color:"#fff", borderRadius:14, padding:"18px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".08em", opacity:.6 }}>SISA UANG</div>
              <div style={{ fontSize:11, opacity:.5, marginTop:2 }}>Kas bersih</div>
            </div>
            <div style={{ fontSize:30, fontWeight:900, letterSpacing:"-.04em", lineHeight:1, fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.netProfit)}</div>
          </div>
          {/* Minimal chart — spacious, no legend, no dates */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:64, marginTop:4 }}>
            {sales.length ? sales.slice(-7).map((s, i) => {
              const max = Math.max(...sales.map(x => x.revenue), 1);
              const totalH = Math.max(10, (s.revenue / max) * 64);
              const hppH = s.revenue ? (s.hpp / s.revenue) * totalH : 0;
              const expH = 0;
              const grossH = totalH - hppH;
              return (
                <div key={s.date} style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"flex-end", height: totalH+"%", minHeight:10, gap:1, borderRadius:6, overflow:"hidden" }}>
                  <div style={{ height: grossH+"%", background: i===6 ? "var(--primary)" : "var(--border)", minHeight: grossH>2?2:0 }} />
                  <div style={{ height: hppH+"%", background: i===6 ? "var(--accent)" : "#E8DDD3", minHeight: hppH>2?2:0 }} />
                </div>
              );
            }) : <div className="muted" style={{ padding:12, fontSize:12, textAlign:"center", width:"100%" }}>Belum ada penjualan</div>}
          </div>
        </div>
      </div>

      {/* Breakdown — Rincian Pengeluaran with Modal / Operasional sections */}
      <div className="card">
        <div className="card-head"><div className="card-title">Rincian Pengeluaran</div></div>
        <div style={{ padding:"14px 16px", display:"grid", gap:16 }}>
          {topByHpp.length === 0 && kpi.totalExpense === 0 ? (
            <div className="muted" style={{ padding:20, textAlign:"center", fontSize:13 }}>Belum ada pengeluaran hari ini.</div>
          ) : (
            <>
              <div>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:".06em", color:"var(--muted)", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }} /> MODAL
                  <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"var(--muted)", fontSize:11 }}>(bahan baku)</span>
                </div>
                {topByHpp.length ? (
                  <div style={{ display:"grid", gap:10 }}>
                    {topByHpp.map((p)=>{
                      const maxHpp = Math.max(...topByHpp.map(x=>x.hpp),1);
                      const w = (p.hpp / maxHpp)*100;
                      return (
                        <div key={p.product_id}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                            <b style={{ fontSize:13 }}>{p.product_name}</b>
                            <span style={{ fontWeight:700 }}>{formatRupiah(p.hpp)}</span>
                          </div>
                          <div style={{ height:6, background:"var(--surface2)", borderRadius:999, marginTop:6, overflow:"hidden" }}>
                            <div style={{ width:`${w}%`, background:"var(--accent)", borderRadius:999 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize:12, padding:"8px 0" }}>Belum ada pengeluaran hari ini.</div>
                )}
              </div>
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:14 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:".06em", color:"var(--muted)", marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"var(--warning)", display:"inline-block" }} /> OPERASIONAL
                  <span style={{ fontWeight:400, textTransform:"none", letterSpacing:0, color:"var(--muted)", fontSize:11 }}>(overhead)</span>
                </div>
                {kpi.totalExpense > 0 ? (
                  <div style={{ background:"var(--surface2)", borderRadius:12, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>Total operasional</span>
                    <b style={{ fontSize:14 }}>{formatRupiah(kpi.totalExpense)}</b>
                  </div>
                ) : (
                  <div className="muted" style={{ fontSize:12, padding:"8px 0" }}>Belum ada pengeluaran hari ini.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><div className="card-title">Top Products</div><a href="/reports?view=products" className="btn" style={{ fontSize:12, minHeight:32, borderRadius:10 }}>Lihat semua</a></div>
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

      {invOverview && invOverview.counts.reorder > 0 && (
        <div className="card" style={{ padding:14, borderColor:"var(--warning)", background:"var(--warning-soft)" }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:".08em", color:"var(--warning)" }}>⚠️ INVENTORY ALERT</div>
          <div style={{ fontSize:14, fontWeight:700, marginTop:6 }}>{invOverview.counts.reorder} bahan perlu reorder • {invOverview.counts.critical} kritis/habis</div>
          <div className="muted" style={{ fontSize:11, marginTop:4 }}>Estimasi 7 hari {formatRupiah(invOverview.forecast.forecast7)} • Reorder sekarang {formatRupiah(invOverview.forecast.immediateReorderCost)}</div>
          <a href="/inventory" className="btn" style={{ width:"100%", marginTop:10, minHeight:40, borderColor:"var(--warning)", color:"var(--warning)", background:"#fff", borderRadius:10 }}>Lihat Inventory →</a>
        </div>
      )}
      {invOverview && invOverview.counts.reorder === 0 && invOverview.counts.total > 0 && (
        <div className="card" style={{ padding:14, background:"var(--green-soft)", borderColor:"var(--green)" }}>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:".08em", color:"var(--green)" }}>✓ STOK AMAN</div>
          <div style={{ fontSize:11, marginTop:4 }} className="muted">{invOverview.counts.total} bahan • Valuasi {formatRupiah(invOverview.forecast.totalStockValuation)} • Forecast 30 hari {formatRupiah(invOverview.forecast.forecast30)}</div>
        </div>
      )}
      <div data-onboarding="dash-cash" className="card" style={{ padding: 14, background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" }}>
        <div style={{ fontSize:10, opacity:.7, letterSpacing:".08em", fontWeight:800 }}>CASH POSITION</div>
        <div style={{ fontSize:24, fontWeight:800, marginTop:6, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(kpi.cashPosition)}</div>
        <div style={{ fontSize:11, opacity:.7, marginTop:4 }}>Net cashflow {formatRupiah(kpi.netCashflow)} • Opening {formatRupiah(kpi.openingBalance)}</div>
      </div>
    </div>
  );
}
