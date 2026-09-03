"use client";
import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/utils";

type Cat = { id: string; name: string };
type Prod = { id: string; name: string; selling_price: number; cost_price: number; category_id: string; category: Cat; image_url?: string | null };

const icons: Record<string,string> = { Coffee:"☕", "Non Coffee":"🍵", Food:"🥐", Snack:"🍟" };

export default function POSClient({ categories, products }: { categories: Cat[]; products: Prod[] }) {
  const [activeCat, setActiveCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<string>("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const cart = useCart();

  const filtered = products.filter(p=> {
    if (activeCat !== "All" && p.category.name !== activeCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = cart.total();
  const count = cart.count();
  const paidNum = Number(amountPaid.replace(/\D/g,""))||0;
  const change = payment==="CASH" && amountPaid ? paidNum - total : 0;
  const isCashInvalid = payment==="CASH" && amountPaid!=="" && paidNum < total;

  async function confirm(){
    if(!cart.items.length || isCashInvalid) return;
    setLoading(true);
    const payload:any={ items: cart.items.map(i=>({product_id:i.product_id,quantity:i.quantity})), payment_method: payment };
    if(payment==="CASH"){ const paid = amountPaid===""? total: paidNum; payload.amount_paid=paid; payload.change_amount=Math.max(0,paid-total); }
    const res=await fetch("/api/transactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(res.ok){
      const d=await res.json();
      setSuccess(d);
      setShowPayment(false);
      setShowCart(false);
      cart.clear();
      setAmountPaid("");
    } else alert(await res.text());
    setLoading(false);
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Header mobile per spec: Back | POS | Search handled via topbar, here we show search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <a href="/dashboard" className="btn" style={{ minHeight:40, padding:"8px 12px" }}>‹ Back</a>
        <span style={{ fontWeight:700 }}>POS</span>
        <span className="muted" style={{ marginLeft:"auto", fontSize:12 }}>{filtered.length} produk</span>
      </div>

      <input className="input" placeholder="Search product..." value={search} onChange={e=>setSearch(e.target.value)} style={{ marginBottom:12 }} />

      <div className="catbar">
        <button className={`cat ${activeCat==="All"?"active":""}`} onClick={()=>setActiveCat("All")}>All</button>
        {categories.map(c=> (
          <button key={c.id} className={`cat ${activeCat===c.name?"active":""}`} onClick={()=>setActiveCat(c.name)}>{c.name}</button>
        ))}
      </div>

      <div className="products">
        {filtered.map(p=> (
          <div key={p.id} className="product">
            <div className="prod-img">{icons[p.category.name]||"☕"}</div>
            <div className="prod-info">
              <div className="prod-name">{p.name}</div>
              <div className="price">{formatRupiah(p.selling_price)}</div>
              <button className="btn primary" style={{ marginTop:8, minHeight:36, padding:"6px 10px", fontSize:13, width:"100%" }} onClick={()=>cart.add({product_id:p.id,product_name:p.name,selling_price:p.selling_price,cost_price:p.cost_price,image_url:p.image_url})}>＋ Tambah</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length===0 && <div className="card" style={{ padding:20, textAlign:"center", marginTop:12 }}><span className="muted">Tidak ada produk</span></div>}

      {/* Sticky bottom cart summary */}
      {cart.items.length>0 && (
        <div style={{ position:"fixed", bottom:72, left:0, right:0, padding:"0 16px", zIndex:30 }}>
          <div className="card" style={{ padding:12, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
            <div><div style={{ fontWeight:700, fontSize:14 }}>{count} items</div><div style={{ fontWeight:800, fontSize:16 }}>{formatRupiah(total)}</div></div>
            <button className="btn primary" style={{ minHeight:48, padding:"12px 20px" }} onClick={()=>setShowCart(true)}>Lihat Keranjang</button>
          </div>
        </div>
      )}

      {/* Bottom sheet cart detail */}
      {showCart && (
        <div className="bottom-sheet" onClick={()=>setShowCart(false)}>
          <div className="bottom-sheet-card" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding:"0 16px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--border)" }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:700 }}>Keranjang</h3>
              <button className="btn" onClick={()=>setShowCart(false)}>Tutup</button>
            </div>
            <div style={{ overflowY:"auto", flex:1, padding:"0 16px" }}>
              {cart.items.map((i:any)=> (
                <div key={i.product_id} className="cart-item">
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{i.product_name}</div>
                    <div className="muted">{formatRupiah(i.selling_price)} × {i.quantity}</div>
                  </div>
                  <div className="qty">
                    <button onClick={()=>cart.updateQty(i.product_id,i.quantity-1)}>−</button>
                    <span style={{ minWidth:20, textAlign:"center", fontWeight:700 }}>{i.quantity}</span>
                    <button onClick={()=>cart.updateQty(i.product_id,i.quantity+1)}>＋</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:16, borderTop:"1px solid var(--border)" }}>
              <div className="total"><span>Total</span><span>{formatRupiah(total)}</span></div>
              <button className="btn primary" style={{ width:"100%", minHeight:48 }} onClick={()=>{ setShowCart(false); setShowPayment(true); }}>Lanjut ke Pembayaran</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment bottom sheet */}
      {showPayment && (
        <div className="bottom-sheet" onClick={()=>setShowPayment(false)}>
          <div className="bottom-sheet-card" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding:"0 16px 16px" }}>
              <h3 style={{ margin:"8px 0 4px", fontSize:16, fontWeight:700 }}>Pembayaran</h3>
              <div style={{ textAlign:"center", padding:"12px 0" }}>
                <div className="muted" style={{ fontSize:11, letterSpacing:".08em", textTransform:"uppercase", fontWeight:700 }}>TOTAL</div>
                <div style={{ fontSize:32, fontWeight:800, letterSpacing:"-.03em", marginTop:4 }}>{formatRupiah(total)}</div>
              </div>

              <div className="payments">
                {[
                  { id:"CASH", label:"Cash" },
                  { id:"QRIS", label:"QRIS" },
                  { id:"DEBIT", label:"Debit" },
                  { id:"TRANSFER", label:"Transfer" },
                ].map(m=> (
                  <button key={m.id} className={`pay ${payment===m.id?"active":""}`} onClick={()=>{setPayment(m.id); if(m.id!=="CASH") setAmountPaid("");}}>{m.label}</button>
                ))}
              </div>

              {payment==="CASH" && (
                <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:16, padding:14, marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#777", marginBottom:8 }}>Uang Diterima</div>
                  <input className="input" inputMode="numeric" placeholder={formatRupiah(total)} value={amountPaid} onChange={e=>{ const d=e.target.value.replace(/\D/g,""); setAmountPaid(d?formatRupiah(Number(d)):""); }} style={{ fontWeight:700 }} />
                  <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                    <button className="btn" style={{ fontSize:12 }} onClick={()=>setAmountPaid(formatRupiah(total))}>Uang Pas</button>
                    {[20000,50000,100000].map(v=> <button key={v} className="btn" style={{ fontSize:12 }} onClick={()=>setAmountPaid(formatRupiah(v))}>{formatRupiah(v)}</button>)}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:12 }}><span style={{ fontSize:13, color:"var(--text2)" }}>Kembalian</span><b style={{ color: isCashInvalid?"var(--red)": change>0?"var(--green)":"var(--text)", fontSize:16 }}>{isCashInvalid?"Uang kurang!":formatRupiah(Math.max(0,change))}</b></div>
                </div>
              )}

              <button className="btn primary" style={{ width:"100%", minHeight:52, fontSize:16 }} onClick={confirm} disabled={loading || isCashInvalid}>
                {loading?"Memproses...":`Bayar ${formatRupiah(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bottom-sheet" onClick={()=>setSuccess(null)}>
          <div className="bottom-sheet-card" style={{ textAlign:"center", padding:24 }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--green-soft)", color:"var(--green)", display:"grid", placeItems:"center", fontSize:28, margin:"0 auto 12px" }}>✓</div>
            <h3 style={{ margin:0, fontSize:18, fontWeight:800 }}>Transaksi Berhasil</h3>
            <div style={{ fontSize:24, fontWeight:800, marginTop:8 }}>{formatRupiah(success.total_revenue || total)}</div>
            <div className="muted" style={{ marginTop:4 }}>{success.payment_method || payment} • {success.invoice_number}</div>
            {success.change_amount!=null && success.payment_method==="CASH" && <div className="muted" style={{ marginTop:6 }}>Kembalian {formatRupiah(success.change_amount)}</div>}
            <button className="btn primary" style={{ width:"100%", marginTop:20, minHeight:48 }} onClick={()=>setSuccess(null)}>Selesai</button>
          </div>
        </div>
      )}
    </div>
  );
}
