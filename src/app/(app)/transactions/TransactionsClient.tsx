"use client";
import { formatRupiah } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TransactionsClient({ transactions, isAdmin }: { transactions: any[]; isAdmin: boolean }) {
  const [filter, setFilter] = useState("");
  const [voidId, setVoidId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = transactions.filter(t=> t.invoice_number.toLowerCase().includes(filter.toLowerCase()));

  async function doVoid() {
    if (!voidId || !reason) return;
    const res = await fetch(`/api/transactions/${voidId}/void`, { method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ reason })});
    if (res.ok) location.reload();
    else alert(await res.text());
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <span className="text-sm text-zinc-500">{transactions.length} data</span>
      </div>
      <Input placeholder="Cari invoice..." value={filter} onChange={e=>setFilter(e.target.value)} />

      {/* Mobile cards */}
      <div className="grid gap-2 lg:hidden">
        {filtered.map(t=> (
          <div key={t.id} className={`bg-white border rounded-xl p-3 ${t.status==="VOID" ? "opacity-50" : ""}`}>
            <div className="flex justify-between">
              <span className="font-mono text-sm font-bold">{t.invoice_number}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${t.status==="VOID" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>{t.status}</span>
            </div>
            <p className="text-xs text-zinc-500">{new Date(t.created_at).toLocaleString("id-ID")} • {t.user.name} • {t.payment_method}</p>
            <p className="font-bold mt-1">{formatRupiah(t.total_revenue)}</p>
            <p className="text-xs text-zinc-500">HPP {formatRupiah(t.total_cogs)} • Gross {formatRupiah(t.gross_profit)}</p>
            {t.payment_method==="CASH" && t.amount_paid != null && (
              <p className="text-xs mt-1">Diterima {formatRupiah(t.amount_paid)} • Kembalian <span className="font-medium text-emerald-600">{formatRupiah(t.change_amount ?? 0)}</span></p>
            )}
            {isAdmin && t.status==="COMPLETED" && <Button size="sm" variant="outline" className="mt-2 w-full text-red-600" onClick={()=>setVoidId(t.id)}>Void</Button>}
            {t.status==="VOID" && t.void_reason && <p className="text-xs text-red-600 mt-1">Void: {t.void_reason}</p>}
          </div>
        ))}
      </div>

      <div className="hidden lg:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50"><tr><th className="p-3 text-left">Invoice</th><th className="p-3">Tanggal</th><th className="p-3">Kasir</th><th className="p-3">Revenue</th><th className="p-3">Payment</th><th className="p-3">Kembalian</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>
            {filtered.map(t=> (
              <tr key={t.id} className="border-t">
                <td className="p-3 font-mono">{t.invoice_number}</td>
                <td className="p-3">{new Date(t.created_at).toLocaleString("id-ID")}</td>
                <td className="p-3">{t.user.name}</td>
                <td className="p-3">{formatRupiah(t.total_revenue)}</td>
                <td className="p-3">{t.payment_method}</td>
                <td className="p-3">{t.payment_method==="CASH" && t.change_amount != null ? formatRupiah(t.change_amount) : "-"}</td>
                <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${t.status==="VOID"?"bg-red-100 text-red-600":"bg-emerald-100 text-emerald-600"}`}>{t.status}</span></td>
                <td className="p-3">{isAdmin && t.status==="COMPLETED" ? <button onClick={()=>setVoidId(t.id)} className="text-red-600">Void</button> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {voidId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setVoidId(null)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold">Void Transaksi</h3>
            <p className="text-sm text-zinc-600">Wajib isi alasan void, transaksi tidak akan masuk laporan.</p>
            <Input placeholder="Alasan void..." value={reason} onChange={e=>setReason(e.target.value)} />
            <div className="flex gap-2">
              <Button onClick={doVoid} variant="destructive" className="flex-1">Void</Button>
              <Button variant="outline" onClick={()=>setVoidId(null)}>Batal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
