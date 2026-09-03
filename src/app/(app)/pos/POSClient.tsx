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
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<any>(null);
  const cart = useCart();

  const filtered = products.filter(p=> {
    if (activeCat !== "All" && p.category.name !== activeCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = cart.total();
  const paidNum = Number(amountPaid.replace(/\D/g,""))||0;
  const change = payment==="CASH" && amountPaid ? paidNum - total : 0;
  const isCashInvalid = payment==="CASH" && amountPaid!=="" && paidNum < total;

  async function confirm(){
    if(!cart.items.length) return;
    if(isCashInvalid) return;
    setLoading(true);
    const payload:any={ items: cart.items.map(i=>({product_id:i.product_id,quantity:i.quantity})), payment_method: payment };
    if(payment==="CASH"){ const paid = amountPaid===""? total: paidNum; payload.amount_paid=paid; payload.change_amount=Math.max(0,paid-total); }
    const res=await fetch("/api/transactions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(res.ok){ const d=await res.json(); setLastTx(d); cart.clear(); setAmountPaid(""); } else alert(await res.text());
    setLoading(false);
  }

  return (
    <div className="pos">
      <div>
        <div className="catbar">
          <button className={`cat ${activeCat==="All"?"active":""}`} onClick={()=>setActiveCat("All")}>All</button>
          {categories.map(c=> (
            <button key={c.id} className={`cat ${activeCat===c.name?"active":""}`} onClick={()=>setActiveCat(c.name)}>{c.name}</button>
          ))}
        </div>
        <input className="input" style={{ width: "100%", marginBottom: 14 }} placeholder="Cari produk..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="products">
          {filtered.map(p=> (
            <button key={p.id} className="product" onClick={()=>cart.add({product_id:p.id,product_name:p.name,selling_price:p.selling_price,cost_price:p.cost_price,image_url:p.image_url})}>
              <div className="prod-img">{icons[p.category.name]||"☕"}</div>
              <div className="prod-info">
                <div className="prod-name">{p.name}</div>
                <div className="price">{formatRupiah(p.selling_price)}</div>
                <div style={{ fontSize: 10, color: "#999" }}>{p.category.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card cart">
        <h3>Current Order</h3>
        <div>
          {cart.items.length ? cart.items.map((i:any)=> (
            <div key={i.product_id} className="cart-item">
              <div>
                <b style={{ fontSize:12 }}>{i.product_name}</b>
                <div className="muted">{formatRupiah(i.selling_price)} × {i.quantity}</div>
              </div>
              <div className="qty">
                <button onClick={()=>cart.updateQty(i.product_id,i.quantity-1)}>−</button>
                <span>{i.quantity}</span>
                <button onClick={()=>cart.updateQty(i.product_id,i.quantity+1)}>+</button>
              </div>
            </div>
          )) : <div className="muted" style={{ padding:"30px 0", textAlign:"center" }}>No items yet.<br/>Choose a product to start.</div>}
        </div>
        <div className="total"><span>Total</span><span>{formatRupiah(total)}</span></div>

        <div className="payments">
          {["CASH","QRIS","DEBIT","TRANSFER"].map(m=> (
            <button key={m} className={`pay ${payment===m?"active":""}`} onClick={()=>{setPayment(m); if(m!=="CASH") setAmountPaid("");}}>{m==="CASH"?"Cash":m}</button>
          ))}
        </div>

        {payment==="CASH" && cart.items.length>0 && (
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:12, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#777", marginBottom:6 }}>Uang Diterima (CASH)</div>
            <input className="input" style={{ width:"100%", fontWeight:600 }} inputMode="numeric" placeholder={formatRupiah(total)} value={amountPaid} onChange={e=>{ const d=e.target.value.replace(/\D/g,""); setAmountPaid(d?formatRupiah(Number(d)):""); }} />
            <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
              <button className="btn" style={{ fontSize:11, padding:"6px 10px" }} onClick={()=>setAmountPaid(formatRupiah(total))}>Uang Pas</button>
              {[20000,50000,100000].map(v=> <button key={v} className="btn" style={{ fontSize:11, padding:"6px 10px" }} onClick={()=>setAmountPaid(formatRupiah(v))}>{formatRupiah(v)}</button>)}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, fontSize:13 }}><span>Kembalian</span><b style={{ color: isCashInvalid?"var(--red)": change>0?"var(--green)":"var(--text)" }}>{isCashInvalid?"Uang kurang!":formatRupiah(Math.max(0,change))}</b></div>
          </div>
        )}

        <button className="btn accent" style={{ width:"100%", padding:"12px", fontSize:13 }} onClick={confirm} disabled={loading || !cart.items.length || isCashInvalid}>
          {loading?"Memproses...": payment==="CASH" && amountPaid && !isCashInvalid ? `Bayar • Kembalian ${formatRupiah(Math.max(0,change))}` : "Confirm Payment"}
        </button>

        {lastTx && <div style={{ marginTop:10, background:"var(--green-soft)", border:"1px solid #c8e9d0", borderRadius:8, padding:10, textAlign:"center", fontSize:12 }}><b style={{ color:"var(--green)" }}>✓ {lastTx.invoice_number} berhasil</b><div className="muted">Diterima {formatRupiah(lastTx.amount_paid)} • Kembalian {formatRupiah(lastTx.change_amount)}</div></div>}
      </div>
    </div>
  );
}
