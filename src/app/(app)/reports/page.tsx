import { getSalesReport, getProductPerformance } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";
import { formatRupiah, formatRupiahShort } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage({ searchParams }: { searchParams: { period?: string; from?: string; to?: string }}) {
  const period = searchParams.period || "thisMonth";
  const { from, to } = getDateRange(period, searchParams.from, searchParams.to);
  const sales = await getSalesReport(from, to);
  const products = await getProductPerformance(from, to);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-sm text-zinc-500">{from.toLocaleDateString("id-ID")} - {to.toLocaleDateString("id-ID")}</p>
        </div>
        <ReportsClient period={period} />
      </div>

      <Card>
        <CardHeader><CardTitle>Sales Report</CardTitle></CardHeader>
        <CardContent>
          {/* mobile cards */}
          <div className="grid gap-2 lg:hidden">
            {sales.length===0 ? <p className="text-sm text-zinc-500">Belum ada data</p> : sales.map(s=> (
              <div key={s.date} className="border rounded-lg p-3 text-sm">
                <p className="font-medium">{s.date} • {s.transactions} transaksi</p>
                <p>Revenue {formatRupiah(s.revenue)} • HPP {formatRupiah(s.hpp)} • Gross {formatRupiah(s.gross)}</p>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50"><tr><th className="p-2 text-left">Tanggal</th><th className="p-2">Transaksi</th><th className="p-2">Revenue</th><th className="p-2">HPP</th><th className="p-2">Gross</th></tr></thead>
              <tbody>{sales.map(s=> (
                <tr key={s.date} className="border-t"><td className="p-2">{s.date}</td><td className="p-2 text-center">{s.transactions}</td><td className="p-2 text-center">{formatRupiah(s.revenue)}</td><td className="p-2 text-center">{formatRupiah(s.hpp)}</td><td className="p-2 text-center font-medium">{formatRupiah(s.gross)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Product Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 lg:hidden">
            {products.map(p=> (
              <div key={p.product_id} className="border rounded-lg p-3 text-sm">
                <p className="font-medium">{p.product_name} • {p.sold} terjual</p>
                <p>Revenue {formatRupiahShort(p.revenue)} • HPP {formatRupiahShort(p.hpp)}</p>
                <p>Gross {formatRupiahShort(p.gross)} • Margin {p.margin.toFixed(1)}%</p>
                <div className="h-2 bg-zinc-100 rounded-full mt-1"><div className="h-2 bg-zinc-900 rounded-full" style={{width: `${Math.min(p.margin,100)}%`}} /></div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50"><tr><th className="p-2 text-left">Produk</th><th className="p-2">Terjual</th><th className="p-2">Revenue</th><th className="p-2">HPP</th><th className="p-2">Gross</th><th className="p-2">Margin</th></tr></thead>
              <tbody>{products.map(p=> (
                <tr key={p.product_id} className="border-t"><td className="p-2">{p.product_name}</td><td className="p-2 text-center">{p.sold}</td><td className="p-2 text-center">{formatRupiah(p.revenue)}</td><td className="p-2 text-center">{formatRupiah(p.hpp)}</td><td className="p-2 text-center font-medium">{formatRupiah(p.gross)}</td><td className="p-2 text-center">{p.margin.toFixed(1)}%</td></tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
