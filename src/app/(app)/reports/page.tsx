import { getSalesReport, getProductPerformance, getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah, formatRupiahShort } from "@/lib/utils";
import ReportsClient from "./ReportsClient";
import { FeatureTourClient } from "@/components/onboarding/FeatureTourClient";
import { REPORTS_TOUR } from "@/components/onboarding/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage({ searchParams }: { searchParams: { period?: string; view?: string }}) {
  const period = searchParams.period || "thisMonth";
  const view = searchParams.view || "";
  const { from, to } = getDateRange(period);
  const sales = await getSalesReport(from,to);
  const products = await getProductPerformance(from,to);
  const kpi = await getFinancialKPI(from,to);

  // Visual calculations for product performance
  const totalRev = products.reduce((s,p)=>s+p.revenue,0);
  const totalGross = products.reduce((s,p)=>s+p.gross,0);
  const maxRev = Math.max(...products.map(p=>p.revenue),1);
  const maxSold = Math.max(...products.map(p=>p.sold),1);

  // If view=products, show visual product performance
  if (view==="products") {
    return (
      <div>
        <div className="filters" style={{ justifyContent:"space-between" }}><h1 style={{ fontSize:18, fontWeight:700, margin:0 }}>Product Performance</h1><ReportsClient period={period} /></div>
        <div data-onboarding="reports-performance" className="muted" style={{ fontSize:12, marginBottom:12 }}>{totalRev? `${products.length} produk • Total ${formatRupiah(totalRev)} • Gross ${formatRupiah(totalGross)}` : "Belum ada penjualan di periode ini"}</div>

        {/* Summary KPI visual */}
        {products.length>0 && (
          <div className="grid-kpi" style={{ marginBottom:12 }}>
            <div className="card kpi"><div className="kpi-label">Revenue Produk</div><div className="kpi-value" style={{ fontSize:18 }}>{formatRupiahShort(totalRev)}</div><div className="delta">{products.length} produk terjual</div></div>
            <div className="card kpi"><div className="kpi-label">Gross Profit</div><div className="kpi-value positive" style={{ fontSize:18 }}>{formatRupiahShort(totalGross)}</div><div className="delta">{totalRev?((totalGross/totalRev)*100).toFixed(1):0}% avg margin</div></div>
            <div className="card kpi"><div className="kpi-label">Best Margin</div><div className="kpi-value" style={{ fontSize:18 }}>{Math.max(...products.map(p=>p.margin)).toFixed(1)}%</div><div className="delta">{[...products].sort((a,b)=>b.margin-a.margin)[0]?.product_name}</div></div>
          </div>
        )}

        {/* Visual 1: Revenue Share horizontal bars */}
        <div className="card" style={{ padding:16, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontWeight:700, fontSize:13 }}>Pangsa Revenue</div><div className="muted" style={{ fontSize:11 }}>Siapa penyumbang terbesar</div></div>
            <span className="badge" style={{ background:"var(--surface2)", color:"var(--text)" }}>{products.length} produk</span>
          </div>
          <div style={{ display:"grid", gap:12, marginTop:14 }}>
            {products.slice(0,6).map(p=>{
              const share = totalRev? (p.revenue/totalRev*100):0;
              const w = (p.revenue/maxRev*100);
              return (
                <div key={p.product_id}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <b style={{ fontSize:13 }}>{p.product_name}</b>
                    <span className="muted">{share.toFixed(1)}% • {formatRupiahShort(p.revenue)}</span>
                  </div>
                  <div style={{ height:10, background:"var(--surface2)", borderRadius:999, overflow:"hidden" }}>
                    <div style={{ width:`${w}%`, height:"100%", background:"var(--accent)", borderRadius:999 }} />
                  </div>
                  <div className="muted" style={{ fontSize:11, marginTop:3 }}>{p.sold} terjual • {formatRupiahShort(p.revenue/p.sold)}/pcs</div>
                </div>
              );
            })}
            {!products.length && <div className="muted" style={{ textAlign:"center", padding:12 }}>Belum ada data</div>}
          </div>
        </div>

        {/* Visual 2: Profitability stacked HPP vs Gross */}
        <div className="card" style={{ padding:16, marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13 }}>Profitability (Revenue = HPP + Gross)</div>
          <div className="muted" style={{ fontSize:11, marginBottom:10 }}>Abu = HPP • Hijau = Gross Profit — panjang = Revenue</div>
          <div style={{ display:"grid", gap:10 }}>
            {products.slice(0,6).map(p=>{
              const hppPct = p.revenue? (p.hpp/p.revenue*100):0;
              const grossPct = 100 - hppPct;
              return (
                <div key={p.product_id}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                    <span style={{ fontWeight:600 }}>{p.product_name}</span>
                    <span className="muted">{formatRupiahShort(p.revenue)}</span>
                  </div>
                  <div style={{ display:"flex", height:14, borderRadius:999, overflow:"hidden", background:"var(--surface2)", marginTop:4 }}>
                    <div style={{ width:`${hppPct}%`, background:"#D6D3CD" }} title={`HPP ${formatRupiah(p.hpp)}`} />
                    <div style={{ width:`${grossPct}%`, background:"var(--green)" }} title={`Gross ${formatRupiah(p.gross)}`} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginTop:3 }}>
                    <span className="muted">HPP {formatRupiahShort(p.hpp)} ({hppPct.toFixed(0)}%)</span>
                    <span style={{ color:"var(--green)", fontWeight:700 }}>Gross {formatRupiahShort(p.gross)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 3: Margin health */}
        <div className="card" style={{ padding:16, marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13 }}>Kesehatan Margin</div>
          <div className="muted" style={{ fontSize:11 }}>Target sehat ≥50% • Cukup ≥30% • Tipis &lt;30%</div>
          <div style={{ display:"grid", gap:10, marginTop:12 }}>
            {[...products].sort((a,b)=>b.margin-a.margin).slice(0,6).map(p=>{
              const color = p.margin>=50?"var(--green)": p.margin>=30?"var(--warning)":"var(--red)";
              const bg = p.margin>=50?"var(--green-soft)": p.margin>=30?"var(--warning-soft)":"var(--red-soft)";
              const label = p.margin>=50?"Sehat": p.margin>=30?"Cukup":"Tipis";
              return (
                <div key={p.product_id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                      <b>{p.product_name}</b>
                      <span style={{ fontWeight:700, color }}>{p.margin.toFixed(1)}% <span style={{ background:bg, color, padding:"2px 6px", borderRadius:999, fontSize:10 }}>{label}</span></span>
                    </div>
                    <div style={{ height:8, background:"var(--surface2)", borderRadius:999, marginTop:6, position:"relative" }}>
                      <div style={{ width:`${Math.min(p.margin,100)}%`, height:"100%", background:color, borderRadius:999 }} />
                      {/* threshold markers 30 & 50 */}
                      <div style={{ position:"absolute", left:"30%", top:-3, bottom:-3, width:2, background:"var(--warning)", opacity:.6 }} />
                      <div style={{ position:"absolute", left:"50%", top:-3, bottom:-3, width:2, background:"var(--green)", opacity:.6 }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {!products.length && <div className="muted" style={{ textAlign:"center", padding:8 }}>Belum ada data</div>}
          </div>
        </div>

        {/* Visual 4: Qty vs Revenue bubble / bar */}
        <div className="card" style={{ padding:16, marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13 }}>Quantity Terjual</div>
          <div className="muted" style={{ fontSize:11 }}>Volume vs popularitas</div>
          <div style={{ display:"grid", gap:10, marginTop:12 }}>
            {[...products].sort((a,b)=>b.sold-a.sold).slice(0,6).map(p=>(
              <div key={p.product_id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--accent-soft)", display:"grid", placeItems:"center", fontWeight:800, color:"var(--accent)", fontSize:12 }}>{p.sold}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{p.product_name}</div>
                  <div style={{ height:6, background:"var(--surface2)", borderRadius:999, marginTop:4 }}>
                    <div style={{ width:`${(p.sold/maxSold*100)}%`, height:"100%", background:"var(--primary)", borderRadius:999 }} />
                  </div>
                </div>
                <b style={{ fontSize:12 }}>{p.sold} pcs</b>
              </div>
            ))}
          </div>
        </div>

          {/* Detail cards + desktop table */}
        <style>{`@media(min-width:901px){ .mobile-pp{display:none} } @media(max-width:900px){ .desktop-pp{display:none} }`}</style>
        <div className="mobile-pp" style={{ display:"grid", gap:10 }}>
          {products.map(p=> (
            <div key={p.product_id} className="card" style={{ padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontWeight:700 }}>{p.product_name}</div><div className="muted" style={{ fontSize:12 }}>{p.sold} terjual</div></div>
                <span className="badge" style={{ background:p.margin>=50?"var(--green-soft)":p.margin>=30?"var(--warning-soft)":"var(--red-soft)", color:p.margin>=50?"var(--green)":p.margin>=30?"var(--warning)":"var(--red)" }}>{p.margin.toFixed(1)}%</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10, background:"var(--surface2)", borderRadius:12, padding:10, fontSize:12 }}>
                <div><div className="muted">Revenue</div><b>{formatRupiah(p.revenue)}</b></div>
                <div><div className="muted">HPP</div><b>{formatRupiah(p.hpp)}</b></div>
                <div><div className="muted">Gross</div><b style={{ color:"var(--green)" }}>{formatRupiah(p.gross)}</b></div>
                <div><div className="muted">Rata/pcs</div><b>{formatRupiahShort(p.revenue/p.sold)}</b></div>
              </div>
            </div>
          ))}
        </div>
        <div className="card desktop-pp" style={{ marginTop:12 }}>
          <div className="card-head"><div><div className="card-title">Detail Tabel</div><div className="muted">Revenue and profitability by product</div></div><a href="/reports" className="btn">P&amp;L ▸</a></div>
          <table className="table"><thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>HPP</th><th>Gross Profit</th><th>Margin</th></tr></thead>
          <tbody>
            {products.map(p=> (
              <tr key={p.product_id}><td><b>{p.product_name}</b></td><td>{p.sold}</td><td className="num">{formatRupiah(p.revenue)}</td><td className="num">{formatRupiah(p.hpp)}</td><td className="num">{formatRupiah(p.gross)}</td><td className="num">{p.margin.toFixed(1)}%</td></tr>
            ))}
            {!products.length && <tr><td colSpan={6} style={{ textAlign:"center", padding:20 }} className="muted">Belum ada data</td></tr>}
          </tbody></table>
        </div>
        <FeatureTourClient tour={REPORTS_TOUR} />
      </div>
    );
  }

  return (
    <div>
      <div className="filters"><h1 style={{ fontSize:18, fontWeight:700, margin:0 }}>Profit & Loss</h1><ReportsClient period={period} /></div>
      <div data-onboarding="reports-pnl" className="report-grid">
        <div className="card statement">
          <div className="card-title">Profit & Loss</div>
          <div className="section-label">Revenue</div>
          <div className="statement-line"><span>Sales Revenue</span><b>{formatRupiah(kpi.revenue)}</b></div>
          <div className="section-label">Cost of Goods Sold</div>
          <div className="statement-line"><span>HPP / COGS</span><b>{formatRupiah(kpi.hpp)}</b></div>
          <div className="statement-line total"><span>Gross Profit</span><b className="positive">{formatRupiah(kpi.grossProfit)}</b></div>
          <div className="section-label">Operating Expense</div>
          <div className="statement-line"><span>Total Operating Expense</span><b>{formatRupiah(kpi.totalExpense)}</b></div>
          <div className="statement-line total"><span>Net Profit</span><b className="positive">{formatRupiah(kpi.netProfit)}</b></div>
        </div>
        <div className="card statement">
          <div className="card-title">Margins</div>
          <div className="list" style={{ padding:"10px 0" }}>
            <div className="list-row"><span>Gross Margin</span><b>{kpi.grossMargin.toFixed(1)}%</b></div>
            <div className="list-row"><span>HPP Ratio</span><b>{kpi.revenue?((kpi.hpp/kpi.revenue)*100).toFixed(1):0}%</b></div>
            <div className="list-row"><span>Operating Expense Ratio</span><b>{kpi.revenue?((kpi.totalExpense/kpi.revenue)*100).toFixed(1):0}%</b></div>
            <div className="list-row"><span>Net Margin</span><b className="positive">{kpi.revenue?((kpi.netProfit/kpi.revenue)*100).toFixed(1):0}%</b></div>
          </div>
          <div style={{ marginTop:16 }}>
            <div className="card-head" style={{ padding:"12px 0", borderBottom:0 }}><div className="card-title" style={{ fontSize:13 }}>Sales Report</div></div>
            <table className="table" style={{ fontSize:11 }}><thead><tr><th>Tanggal</th><th>Trx</th><th>Revenue</th><th>Gross</th></tr></thead><tbody>
              {sales.slice(-5).map(s=> <tr key={s.date}><td>{s.date}</td><td>{s.transactions}</td><td className="num">{formatRupiah(s.revenue)}</td><td className="num">{formatRupiah(s.gross)}</td></tr>)}
            </tbody></table>
          </div>
        </div>
      </div>
      <div style={{ marginTop:16, textAlign:"center" }}><a href="/reports?view=products" className="btn">Lihat Product Performance →</a></div>
      <FeatureTourClient tour={REPORTS_TOUR} />
    </div>
  );
}
