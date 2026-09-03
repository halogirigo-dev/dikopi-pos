import { getSalesReport, getProductPerformance, getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: { period?: string; view?: string }}) {
  const period = searchParams.period || "thisMonth";
  const view = searchParams.view || "";
  const { from, to } = getDateRange(period);
  const sales = await getSalesReport(from,to);
  const products = await getProductPerformance(from,to);
  const kpi = await getFinancialKPI(from,to);

  // If view=products, show product performance spec 13 mobile cards
  if (view==="products") {
    return (
      <div>
        <div className="filters"><h1 style={{ fontSize:18, fontWeight:700, margin:0 }}>Product Performance</h1><ReportsClient period={period} /></div>
        <style>{`@media(min-width:901px){ .mobile-pp{display:none} } @media(max-width:900px){ .desktop-pp{display:none} }`}</style>
        <div className="mobile-pp" style={{ display:"grid", gap:12 }}>
          {products.map(p=> (
            <div key={p.product_id} className="card" style={{ padding:16 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>{p.product_name}</div>
              <div className="muted" style={{ fontSize:12 }}>{p.sold} terjual</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:12, background:"var(--surface2)", borderRadius:12, padding:12 }}>
                <div><div className="muted" style={{ fontSize:11 }}>Revenue</div><div style={{ fontWeight:700 }}>{formatRupiah(p.revenue)}</div></div>
                <div><div className="muted" style={{ fontSize:11 }}>HPP</div><div style={{ fontWeight:700 }}>{formatRupiah(p.hpp)}</div></div>
                <div><div className="muted" style={{ fontSize:11 }}>Gross Profit</div><div style={{ fontWeight:700, color:"var(--green)" }}>{formatRupiah(p.gross)}</div></div>
                <div><div className="muted" style={{ fontSize:11 }}>Margin</div><div style={{ fontWeight:700 }}>{p.margin.toFixed(1)}%</div></div>
              </div>
            </div>
          ))}
          {!products.length && <div className="card" style={{ padding:20, textAlign:"center" }}><span className="muted">Belum ada data</span></div>}
        </div>
        <div className="card desktop-pp">
          <div className="card-head"><div><div className="card-title">Product Performance</div><div className="muted">Revenue and profitability by product</div></div><a href="/reports" className="btn">P&amp;L ▸</a></div>
          <table className="table"><thead><tr><th>Product</th><th>Qty Sold</th><th>Revenue</th><th>HPP</th><th>Gross Profit</th><th>Margin</th></tr></thead>
          <tbody>
            {products.map(p=> (
              <tr key={p.product_id}><td><b>{p.product_name}</b></td><td>{p.sold}</td><td className="num">{formatRupiah(p.revenue)}</td><td className="num">{formatRupiah(p.hpp)}</td><td className="num">{formatRupiah(p.gross)}</td><td className="num">{p.margin.toFixed(1)}%</td></tr>
            ))}
            {!products.length && <tr><td colSpan={6} style={{ textAlign:"center", padding:20 }} className="muted">Belum ada data</td></tr>}
          </tbody></table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="filters"><h1 style={{ fontSize:18, fontWeight:700, margin:0 }}>Profit & Loss</h1><ReportsClient period={period} /></div>
      <div className="report-grid">
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
    </div>
  );
}
