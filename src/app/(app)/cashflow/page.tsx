import { getFinancialKPI } from "@/lib/finance";
import { getDateRange, formatRupiah } from "@/lib/utils";
import { FeatureTourClient } from "@/components/onboarding/FeatureTourClient";
import { CASHFLOW_TOUR } from "@/components/onboarding/data";

export default async function CashflowPage({ searchParams }: { searchParams: { period?: string }}) {
  const period = searchParams.period || "thisMonth";
  const { from, to } = getDateRange(period);
  const kpi = await getFinancialKPI(from,to);
  return (
    <div>
      <div data-onboarding="cashflow-opening" className="grid6">
        <div className="card kpi"><div className="kpi-label">Opening Balance</div><div className="kpi-value">{formatRupiah(kpi.openingBalance)}</div></div>
        <div className="card kpi"><div className="kpi-label">Cash In</div><div className="kpi-value positive">{formatRupiah(kpi.cashInflow)}</div></div>
        <div className="card kpi"><div className="kpi-label">Cash Out</div><div className="kpi-value negative">{formatRupiah(kpi.cashOutflow)}</div></div>
      </div>
      <div className="card" style={{ marginTop:16 }}>
        <div className="card-head"><div className="card-title">Cashflow Summary</div><div className="muted">{period} · {from.toLocaleDateString("id-ID")} - {to.toLocaleDateString("id-ID")}</div></div>
        <div className="list">
          <div className="list-row"><span>Sales receipts</span><b>+{formatRupiah(kpi.cashInflow)}</b></div>
          <div className="list-row"><span>Operating expenses</span><b className="negative">−{formatRupiah(kpi.totalExpense)}</b></div>
          <div className="list-row"><span>Other cash out</span><b className="negative">−{formatRupiah(kpi.cashOutflow - kpi.totalExpense)}</b></div>
          <div className="list-row"><span>Closing Cash Position</span><b>{formatRupiah(kpi.cashPosition)}</b></div>
          <div className="list-row"><span>Net Cashflow</span><b style={{ color: kpi.netCashflow>=0?"var(--green)":"var(--red)" }}>{formatRupiah(kpi.netCashflow)}</b></div>
        </div>
      </div>
      <div className="grid6" style={{ marginTop:16 }}>
        <div className="card kpi"><div className="kpi-label">Revenue</div><div className="kpi-value">{formatRupiah(kpi.revenue)}</div></div>
        <div className="card kpi"><div className="kpi-label">HPP</div><div className="kpi-value">{formatRupiah(kpi.hpp)}</div></div>
        <div className="card kpi"><div className="kpi-label">Net Profit</div><div className="kpi-value positive">{formatRupiah(kpi.netProfit)}</div></div>
      </div>
      <FeatureTourClient tour={CASHFLOW_TOUR} />
    </div>
  );
}
