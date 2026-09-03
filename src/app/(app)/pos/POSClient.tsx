"use client";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Cat = { id: string; name: string };
type Prod = { id: string; name: string; selling_price: number; cost_price: number; category_id: string; category: Cat; image_url?: string | null };

export default function POSClient({ categories, products }: { categories: Cat[]; products: Prod[] }) {
  const [activeCat, setActiveCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<string>("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<{ invoice_number: string; change_amount: number; amount_paid: number } | null>(null);
  const cart = useCart();

  const filtered = products.filter(p=> {
    if (activeCat !== "ALL" && p.category.name !== activeCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = cart.total();
  const count = cart.count();
  const paidNum = Number(amountPaid.replace(/\D/g, "")) || 0;
  const change = payment === "CASH" && amountPaid ? paidNum - total : 0;
  const isCashInvalid = payment === "CASH" && amountPaid !== "" && paidNum < total;

  async function confirm() {
    if (!cart.items.length) return;
    if (payment === "CASH" && isCashInvalid) return;
    setLoading(true);
    const payload: any = {
      items: cart.items.map(i=>({ product_id: i.product_id, quantity: i.quantity })),
      payment_method: payment,
    };
    if (payment === "CASH") {
      const paid = amountPaid === "" ? total : paidNum;
      payload.amount_paid = paid;
      payload.change_amount = Math.max(0, paid - total);
    }
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      setLastTx({ invoice_number: data.invoice_number, change_amount: data.change_amount ?? 0, amount_paid: data.amount_paid ?? total });
      cart.clear();
      setAmountPaid("");
      setShowCart(false);
    } else {
      alert("Gagal: " + await res.text());
    }
    setLoading(false);
  }

  // Reset amountPaid when switching to non-cash
  function handlePaymentChange(m: string) {
    setPayment(m);
    if (m !== "CASH") setAmountPaid("");
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Products */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          <button onClick={()=>setActiveCat("ALL")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${activeCat==="ALL" ? "bg-zinc-900 text-white" : "bg-white"}`}>ALL</button>
          {categories.map(c=> (
            <button key={c.id} onClick={()=>setActiveCat(c.name)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${activeCat===c.name ? "bg-zinc-900 text-white" : "bg-white"}`}>{c.name.toUpperCase()}</button>
          ))}
        </div>
        <input placeholder="Cari produk..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full h-10 rounded-lg border px-3 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p=> (
            <button key={p.id} onClick={()=>cart.add({ product_id: p.id, product_name: p.name, selling_price: p.selling_price, cost_price: p.cost_price, image_url: p.image_url })} className="bg-white border rounded-xl p-3 text-left hover:border-zinc-900 transition-colors">
              <div className="aspect-square bg-zinc-100 rounded-lg mb-2 flex items-center justify-center text-2xl">☕</div>
              <p className="text-sm font-medium leading-tight line-clamp-2">{p.name}</p>
              <p className="text-sm font-bold mt-1">{formatRupiah(p.selling_price)}</p>
              <p className="text-xs text-zinc-400">{p.category.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart - desktop sticky */}
      <div className="hidden lg:block w-96 shrink-0">
        <CartPanel total={total} payment={payment} setPayment={handlePaymentChange} confirm={confirm} loading={loading} lastTx={lastTx} amountPaid={amountPaid} setAmountPaid={setAmountPaid} change={change} isCashInvalid={isCashInvalid} />
      </div>

      {/* Mobile cart bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 px-3">
        {lastTx && <div className="bg-emerald-600 text-white text-sm rounded-lg p-2 mb-2 text-center">Transaksi {lastTx.invoice_number} • Kembalian {formatRupiah(lastTx.change_amount)}</div>}
        <div className="bg-white border rounded-xl shadow-lg p-3 flex items-center justify-between">
          <div>
            <p className="font-bold">{count} item • {formatRupiah(total)}</p>
            <p className="text-xs text-zinc-500">{cart.items.length} produk</p>
          </div>
          <Button onClick={()=>setShowCart(true)} className="rounded-full">Lihat Keranjang</Button>
        </div>
      </div>

      {/* Mobile drawer */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={()=>setShowCart(false)}>
          <div className="bg-white rounded-t-2xl max-h-[85vh] flex flex-col" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">Keranjang</h3>
              <button onClick={()=>setShowCart(false)} className="text-xl">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CartPanel total={total} payment={payment} setPayment={handlePaymentChange} confirm={confirm} loading={loading} lastTx={lastTx} amountPaid={amountPaid} setAmountPaid={setAmountPaid} change={change} isCashInvalid={isCashInvalid} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CartPanel({ total, payment, setPayment, confirm, loading, lastTx, amountPaid, setAmountPaid, change, isCashInvalid }: any) {
  const cart = useCart();
  const quickAmounts = [20000, 50000, 100000];

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3">
      <h3 className="font-bold">CART</h3>
      {cart.items.length===0 ? <p className="text-sm text-zinc-500 py-8 text-center">Keranjang kosong</p> : (
        <div className="space-y-2">
          {cart.items.map((i: any)=> (
            <div key={i.product_id} className="flex justify-between items-center border rounded-lg p-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{i.product_name}</p>
                <p className="text-xs text-zinc-500">{formatRupiah(i.selling_price)} × {i.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={()=>cart.updateQty(i.product_id, i.quantity-1)} className="h-8 w-8 rounded-full border flex items-center justify-center">-</button>
                <span className="w-6 text-center text-sm">{i.quantity}</span>
                <button onClick={()=>cart.updateQty(i.product_id, i.quantity+1)} className="h-8 w-8 rounded-full border flex items-center justify-center">+</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t pt-3">
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL</span><span>{formatRupiah(total)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {["CASH","QRIS","DEBIT","TRANSFER"].map(m=> (
            <button key={m} onClick={()=>setPayment(m)} className={`h-10 rounded-lg border text-sm font-medium ${payment===m ? "bg-zinc-900 text-white" : "bg-white"}`}>{m}</button>
          ))}
        </div>

        {/* Kembalian feature - only for CASH */}
        {payment === "CASH" && cart.items.length > 0 && (
          <div className="mt-3 space-y-2 bg-zinc-50 border rounded-lg p-3">
            <label className="text-xs font-medium text-zinc-700">Uang Diterima (CASH)</label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={formatRupiah(total)}
              value={amountPaid}
              onChange={e=> {
                const digits = e.target.value.replace(/\D/g, "");
                setAmountPaid(digits ? formatRupiah(Number(digits)) : "");
              }}
              className={`h-11 text-base font-medium ${isCashInvalid ? "border-red-500 focus:ring-red-500" : ""}`}
            />
            <div className="flex gap-1.5 flex-wrap">
              <button type="button" onClick={()=>setAmountPaid(formatRupiah(total))} className="px-2 py-1 text-xs rounded-full border bg-white hover:bg-zinc-100">Uang Pas</button>
              {quickAmounts.map(v=> (
                <button key={v} type="button" onClick={()=>setAmountPaid(formatRupiah(v))} className="px-2 py-1 text-xs rounded-full border bg-white hover:bg-zinc-100">{formatRupiah(v)}</button>
              ))}
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm text-zinc-600">Kembalian</span>
              <span className={`text-base font-bold ${isCashInvalid ? "text-red-600" : change > 0 ? "text-emerald-600" : "text-zinc-900"}`}>
                {isCashInvalid ? "Uang kurang!" : formatRupiah(Math.max(0, change))}
              </span>
            </div>
            {isCashInvalid && <p className="text-xs text-red-600">Uang diterima kurang dari total</p>}
            {!isCashInvalid && amountPaid && change >= 0 && <p className="text-xs text-zinc-500">{formatRupiah(Number(amountPaid.replace(/\D/g,"")))} - {formatRupiah(total)} = {formatRupiah(change)}</p>}
          </div>
        )}

        {payment !== "CASH" && cart.items.length > 0 && (
          <p className="text-xs text-zinc-500 mt-2 text-center">Pembayaran {payment} — tidak perlu kembalian</p>
        )}

        <Button onClick={confirm} disabled={loading || cart.items.length===0 || isCashInvalid} className="w-full mt-3 h-12 text-base">
          {loading ? "Memproses..." : payment==="CASH" && amountPaid && !isCashInvalid ? `BAYAR • Kembalian ${formatRupiah(Math.max(0, change))}` : "CONFIRM PAYMENT"}
        </Button>
        {lastTx && (
          <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-sm text-center">
            <p className="font-medium text-emerald-700">Transaksi {lastTx.invoice_number} berhasil</p>
            <p className="text-xs text-zinc-600">Diterima {formatRupiah(lastTx.amount_paid)} • Kembalian {formatRupiah(lastTx.change_amount)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
