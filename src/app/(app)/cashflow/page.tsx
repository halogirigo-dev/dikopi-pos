import { prisma } from "@/lib/prisma";
import { getFinancialKPI } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";
import { formatRupiah } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CashflowPage({ searchParams }: { searchParams: { period?: string }}) {
  const period = searchParams.period || "thisMonth";
  const { from, to } = getDateRange(period);
  const kpi = await getFinancialKPI(from, to);
  const openingSetting = await prisma.setting.findUnique({ where: { key: "opening_balance" }});

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Cashflow</h1>
      <p className="text-sm text-zinc-500">Periode: {period} • {from.toLocaleDateString("id-ID")} - {to.toLocaleDateString("id-ID")}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader><CardTitle className="text-emerald-600">Cash Inflow</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">+{formatRupiah(kpi.cashInflow)}</p>
            <p className="text-xs text-zinc-500">Penjualan + koreksi masuk</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-red-600">Cash Outflow</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">-{formatRupiah(kpi.cashOutflow)}</p>
            <p className="text-xs text-zinc-500">Expense operasional + koreksi keluar</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ringkasan Cashflow</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Opening Balance</span><span>{formatRupiah(kpi.openingBalance)}</span></div>
          <div className="flex justify-between"><span>Total Inflow</span><span className="text-emerald-600">+{formatRupiah(kpi.cashInflow)}</span></div>
          <div className="flex justify-between"><span>Total Outflow</span><span className="text-red-600">-{formatRupiah(kpi.cashOutflow)}</span></div>
          <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Net Cashflow</span><span>{formatRupiah(kpi.netCashflow)}</span></div>
          <div className="bg-zinc-900 text-white rounded-lg p-3 flex justify-between font-bold"><span>Cash Position</span><span>{formatRupiah(kpi.cashPosition)}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Profit & Loss Snapshot</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="flex justify-between"><span>Revenue</span><span>{formatRupiah(kpi.revenue)}</span></div>
          <div className="flex justify-between"><span>HPP</span><span>-{formatRupiah(kpi.hpp)}</span></div>
          <div className="flex justify-between font-medium border-t pt-1"><span>Gross Profit ({kpi.grossMargin.toFixed(1)}%)</span><span>{formatRupiah(kpi.grossProfit)}</span></div>
          <div className="flex justify-between"><span>Expense</span><span>-{formatRupiah(kpi.totalExpense)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>Net Profit</span><span>{formatRupiah(kpi.netProfit)}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
