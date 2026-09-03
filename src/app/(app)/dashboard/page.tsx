import { prisma } from "@/lib/prisma";
import { getFinancialKPI } from "@/lib/finance";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatRupiah, formatRupiahShort } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string; from?: string; to?: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/pos");

  const period = searchParams.period || "today";
  // compute date range inline for server
  const { getDateRange } = await import("@/lib/utils");
  const { from, to } = getDateRange(period, searchParams.from, searchParams.to);
  const kpi = await getFinancialKPI(from, to);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Financial Dashboard</h1>
          <p className="text-sm text-zinc-500">Periode: {period} • {from.toLocaleDateString("id-ID")} - {to.toLocaleDateString("id-ID")}</p>
        </div>
        <DashboardClient period={period} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader><CardTitle className="text-zinc-500">REVENUE</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(kpi.revenue)}</p>
            <p className="text-xs text-zinc-500">{kpi.transactionCount} transaksi</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader><CardTitle className="text-zinc-500">HPP</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(kpi.hpp)}</p>
            <p className="text-xs text-zinc-500">Cost of Goods</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader><CardTitle className="text-zinc-500">GROSS PROFIT</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatRupiah(kpi.grossProfit)}</p>
            <p className="text-xs text-zinc-500">{kpi.grossMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader><CardTitle className="text-zinc-500">EXPENSE</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatRupiah(kpi.totalExpense)}</p>
            <p className="text-xs text-zinc-500">Operating Expense</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-zinc-900 bg-zinc-900 text-white">
          <CardHeader><CardTitle className="text-zinc-300">NET PROFIT</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(kpi.netProfit)}</p>
            <p className="text-xs text-zinc-400">Gross - Expense</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Cash Position</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Opening Balance</span><span>{formatRupiah(kpi.openingBalance)}</span></div>
            <div className="flex justify-between text-emerald-600"><span>Cash Inflow (periode)</span><span>+{formatRupiah(kpi.cashInflow)}</span></div>
            <div className="flex justify-between text-red-600"><span>Cash Outflow (periode)</span><span>-{formatRupiah(kpi.cashOutflow)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>Net Cashflow</span><span>{formatRupiah(kpi.netCashflow)}</span></div>
            <div className="bg-zinc-900 text-white rounded-lg p-3 flex justify-between font-bold"><span>Cash Position (saldo)</span><span>{formatRupiah(kpi.cashPosition)}</span></div>
            <p className="text-xs text-zinc-500">Catatan: HPP tidak mengurangi cashflow, hanya laba. Cashflow dari uang aktual.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Formula:</p>
            <p className="font-mono text-xs bg-zinc-50 p-2 rounded">Gross = Revenue - HPP</p>
            <p className="font-mono text-xs bg-zinc-50 p-2 rounded">Net = Gross - Expense</p>
            <p className="font-mono text-xs bg-zinc-50 p-2 rounded">Cash = Opening + In - Out</p>
            <a href="/reports" className="inline-block mt-2 text-blue-600 text-sm">Lihat Reports →</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
