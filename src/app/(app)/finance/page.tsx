import { getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import FinanceTabs from "./FinanceTabs";

export default async function FinancePage({ searchParams }: { searchParams: { tab?: string; period?: string }}) {
  const tab = searchParams.tab || "overview";
  const period = searchParams.period || "thisMonth";
  const { from, to } = getDateRange(period);
  const kpi = await getFinancialKPI(from,to);

  return (
    <div>
      <FinanceTabs tab={tab} period={period} />
      {tab==="overview" && (
        <div style={{ display:"grid", gap:12 }}>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", letterSpacing:".08em" }}>REVENUE</div>
            <div style={{ fontSize:28, fontWeight:800, marginTop:6 }}>{formatRupiah(kpi.revenue)}</div>
            <div className="muted">{kpi.transactionCount} transaksi • HPP {formatRupiah(kpi.hpp)}</div>
          </div>
          <div className="card" style={{ padding:16 }}>
            <div className="statement-line"><span className="muted">HPP / COGS</span><b>{formatRupiah(kpi.hpp)}</b></div>
            <div className="statement-line total" style={{ color:"var(--green)" }}><span>Gross Profit</span><b>{formatRupiah(kpi.grossProfit)} · {kpi.grossMargin.toFixed(1)}%</b></div>
            <div className="statement-line"><span className="muted">Operating Expense</span><b style={{ color:"var(--red)" }}>-{formatRupiah(kpi.totalExpense)}</b></div>
            <div className="statement-line total"><span>Net Profit</span><b style={{ color:kpi.netProfit>=0?"var(--green)":"var(--red)" }}>{formatRupiah(kpi.netProfit)}</b></div>
          </div>
          <div className="card" style={{ padding:16, display:"flex", justifyContent:"space-between" }}>
            <div><div className="muted" style={{ fontSize:11 }}>Cash In</div><b style={{ color:"var(--green)" }}>{formatRupiah(kpi.cashInflow)}</b></div>
            <div style={{ textAlign:"right" }}><div className="muted" style={{ fontSize:11 }}>Cash Out</div><b style={{ color:"var(--red)" }}>{formatRupiah(kpi.cashOutflow)}</b></div>
          </div>
        </div>
      )}
      {tab==="cashflow" && (
        <div style={{ display:"grid", gap:12 }}>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Money In</div>
            <div style={{ fontSize:20, fontWeight:800, color:"var(--green)" }}>{formatRupiah(kpi.cashInflow)}</div>
            <div className="muted" style={{ marginTop:8 }}>Sales + other in</div>
          </div>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Money Out</div>
            <div style={{ fontSize:20, fontWeight:800, color:"var(--red)" }}>{formatRupiah(kpi.cashOutflow)}</div>
            <div className="muted" style={{ marginTop:8 }}>Expenses + other out</div>
          </div>
          <div className="card" style={{ padding:16, background:"var(--primary)", color:"#fff" }}>
            <div style={{ opacity:.7, fontSize:11, letterSpacing:".08em", fontWeight:700 }}>NET CASHFLOW</div>
            <div style={{ fontSize:24, fontWeight:800, marginTop:6 }}>{formatRupiah(kpi.netCashflow)}</div>
            <div style={{ opacity:.7, fontSize:12, marginTop:4 }}>Closing {formatRupiah(kpi.cashPosition)}</div>
          </div>
        </div>
      )}
      {tab==="pnl" && (
        <div className="card statement">
          <div style={{ fontWeight:700, fontSize:14 }}>Profit & Loss</div>
          <div className="section-label">Revenue</div>
          <div className="statement-line"><span>Sales Revenue</span><b>{formatRupiah(kpi.revenue)}</b></div>
          <div className="statement-line"><span>HPP</span><b>-{formatRupiah(kpi.hpp)}</b></div>
          <div className="statement-line total"><span>Gross Profit</span><b>{formatRupiah(kpi.grossProfit)}</b></div>
          <div className="statement-line"><span>Operating Expenses</span><b>-{formatRupiah(kpi.totalExpense)}</b></div>
          <div className="statement-line total"><span>Net Profit</span><b style={{ color:kpi.netProfit>=0?"var(--green)":"var(--red)" }}>{formatRupiah(kpi.netProfit)}</b></div>
          <div className="section-label">Ratios</div>
          <div className="list" style={{ padding:0 }}>
            <div className="list-row"><span className="muted">Gross Margin</span><b>{kpi.grossMargin.toFixed(1)}%</b></div>
            <div className="list-row"><span className="muted">Net Margin</span><b>{kpi.revenue?((kpi.netProfit/kpi.revenue)*100).toFixed(1):0}%</b></div>
          </div>
        </div>
      )}
    </div>
  );
}
