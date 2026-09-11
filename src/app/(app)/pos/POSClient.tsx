"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { formatRupiah } from "@/lib/utils";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/Tour";
import { POS_TOUR } from "@/components/onboarding/data";

type Cat = { id: string; name: string };
type Prod = { id: string; name: string; selling_price: number; cost_price: number; category_id: string; category: Cat; image_url?: string | null };

export default function POSClient({ categories, products, productIdsWithRecipe = [] }: { categories: Cat[]; products: Prod[]; productIdsWithRecipe?: string[] }) {
  const [activeCat, setActiveCat] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<string>("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const router = useRouter();
  const cart = useCart();
  const { state: obState, isCompleted, markCompleted } = useOnboarding();
  const [showPosTour, setShowPosTour] = useState(false);
  useEffect(() => {
    if (!obState.tipsEnabled || isCompleted("pos") || !obState.welcome || !obState.nav) return;
    if (cart.items.length > 0) return;
    if (products.length === 0) return;
    const t = setTimeout(() => setShowPosTour(true), 900);
    return () => clearTimeout(t);
  }, [obState.tipsEnabled, obState.welcome, obState.nav, isCompleted, cart.items.length, products.length]);


  // Instant client-side filtering: category + search never hits DB
  // Memoized to avoid re-filter on every render (cart changes, etc.)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p=> {
      if (activeCat !== "All" && p.category.name !== activeCat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, activeCat, search]);

  const total = cart.total();
  const count = cart.count();
  const paidNum = Number(amountPaid.replace(/\D/g,""))||0;
  const change = payment==="CASH" && amountPaid ? paidNum - total : 0;
  const isCashInvalid = payment==="CASH" && amountPaid!=="" && paidNum < total;
  // Live sync recipe ids — fixes stale NO RECIPE after save without hard reload
  const [liveRecipeIds, setLiveRecipeIds] = useState<string[]>(productIdsWithRecipe);
  useEffect(()=> { setLiveRecipeIds(productIdsWithRecipe); }, [productIdsWithRecipe]);
  useEffect(()=>{
    let cancelled=false;
    async function refreshRecipes(){
      try{
        const res=await fetch("/api/inventory/recipes",{cache:"no-store"});
        if(!res.ok) return;
        const data=await res.json();
        const ids = Array.isArray(data) ? [] : (data.productIdsWithRecipe || []);
        if(!cancelled && ids.length) setLiveRecipeIds(ids);
      }catch{}
    }
    refreshRecipes();
    const onVis=()=> { if(document.visibilityState==="visible") refreshRecipes(); };
    const onRefresh=()=> refreshRecipes();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("dikopi:refresh", onRefresh);
    window.addEventListener("focus", refreshRecipes);
    const id=setInterval(refreshRecipes, 15000);
    return ()=>{ cancelled=true; document.removeEventListener("visibilitychange", onVis); window.removeEventListener("dikopi:refresh", onRefresh); window.removeEventListener("focus", refreshRecipes); clearInterval(id); };
  },[]);
  const withRecipeSet = useMemo(()=> new Set(liveRecipeIds), [liveRecipeIds]);
  const cartWithoutRecipe = useMemo(()=> cart.items.filter((it:any)=> !withRecipeSet.has(it.product_id)), [cart.items, withRecipeSet]);

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
      // paksa revalidate agar Dashboard/Finance langsung terupdate saat navigasi
      router.refresh();
      // juga trigger event untuk RealtimeRefresher di halaman lain yang sedang terbuka
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("dikopi:refresh"));
    } else alert(await res.text());
    setLoading(false);
  }

  return (
    <div className="pos-page">
      <style>{`
        .pos-page { padding-bottom: 88px; }
        .pos-page.has-cart { padding-bottom: 140px; }
        .pos-desktop-cart { display: none; }
        .pos-mobile-bar { position:fixed; bottom:72px; left:12px; right:12px; z-index:30; }
        @media(min-width:901px){
          .pos-page { padding-bottom: 24px !important; }
          .pos-mobile-bar { display:none !important; }
          .pos-desktop-cart { display:flex !important; }
          .pos-layout { align-items: start; gap: 20px; }
        }
        @media(max-width:900px){
          .pos-layout { display:block !important; }
        }
        /* Desktop cart internal scroll */
        .pos-desktop-cart { flex-direction:column; overflow:hidden; max-height: calc(100vh - 96px); }
        .pos-desktop-cart .cart-scroll { overflow-y:auto; flex:1; min-height:0; scrollbar-width: thin; }
        .pos-desktop-cart .cart-scroll::-webkit-scrollbar { width:6px; }
        .pos-desktop-cart .cart-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius:999px; }
        /* Make payment bottom-sheet centered on desktop */
        @media(min-width:901px){
          .bottom-sheet { align-items:center; justify-content:center; padding:24px; }
          .bottom-sheet-card { border-radius:20px !important; max-width:480px; width:100%; max-height: 88vh; }
        }
      `}</style>

      {/* Compact page header — Warm Counter, hierarchy: POS > count, Back de-emphasized */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", gap:12, marginBottom:12 }}>
        <div style={{ minWidth:0 }}>
          <h1 style={{ fontSize:18, fontWeight:800, letterSpacing:"-.03em", lineHeight:1, margin:0 }}>POS</h1>
          <div style={{ fontSize:11, color:"var(--text2)", marginTop:4, fontWeight:500, letterSpacing:".01em" }}>{filtered.length} produk • {categories.length} kategori • {count>0 ? `${count} di keranjang` : "siap jual"}</div>
        </div>
        <a href="/dashboard" style={{ fontSize:12, fontWeight:600, color:"var(--muted)", textDecoration:"none", padding:"6px 8px", flexShrink:0, lineHeight:1 }}>‹ Kembali</a>
      </div>

      {/* Search — primary control, dominant, 48px, 12px radius */}
      <input data-onboarding="pos-search" className="input" placeholder="Search produk..." value={search} onChange={e=>setSearch(e.target.value)} style={{ marginBottom:8 }} />

      {/* Category row — pill chips, horizontal scroll, charcoal active */}
      <div data-onboarding="pos-categories" className="catbar scrollbar-none" style={{ marginBottom:10, gap:8, paddingBottom:2 }}>
        <button className={`cat ${activeCat==="All"?"active":""}`} onClick={()=>setActiveCat("All")}>All</button>
        {categories.map(c=> (
          <button key={c.id} className={`cat ${activeCat===c.name?"active":""}`} onClick={()=>setActiveCat(c.name)}>{c.name}</button>
        ))}
      </div>

      {/* POS layout: products left + sticky cart right (desktop) */}
      <div className="pos pos-layout" style={{ gap:16 }}>
        {/* LEFT: products */}
        <div style={{ minWidth:0 }}>
          <div className="products" data-onboarding="pos-products" style={{ gap:8 }}>
            {filtered.map((p,i)=> {
              const qty = cart.items.find(it=>it.product_id===p.id)?.quantity || 0;
              const isAdded = qty > 0;
              const hasRecipe = withRecipeSet.has(p.id);
              return (
              <div key={p.id} className="product" {...(i===0?{"data-onboarding":"pos-product"}:{})} style={{ background:"var(--surface)", border: hasRecipe ? "1px solid var(--border)" : "1px solid #FED7AA", borderRadius:16, overflow:"hidden", boxShadow:"var(--shadow)", opacity: hasRecipe ? 1 : 0.98 }}>
                <div style={{ padding:12, flex:1, display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:6 }}>
                    <div style={{ fontSize:10, fontWeight:700, letterSpacing:".06em", color:"var(--muted)", textTransform:"uppercase", lineHeight:1 }}>{p.category.name}</div>
                    {!hasRecipe && <span title="Recipe belum dikonfigurasi — stock tidak akan berkurang" style={{ fontSize:9, fontWeight:800, color:"#B45309", background:"#FEF3C7", border:"1px solid #FED7AA", padding:"2px 6px", borderRadius:999, letterSpacing:".04em", whiteSpace:"nowrap" }}>⚠ NO RECIPE</span>}
                  </div>
                  <div style={{ fontSize:14, fontWeight:700, lineHeight:"16px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" as any, overflow:"hidden", minHeight:32 }}>{p.name}</div>
                  <div style={{ fontSize:14, fontWeight:800, color:"var(--text)", letterSpacing:"-.01em", fontVariantNumeric:"tabular-nums" as any, marginTop:2 }}>{formatRupiah(p.selling_price)}</div>
                  {!hasRecipe && <div style={{ fontSize:10, color:"#B45309", fontWeight:600, lineHeight:1.2, marginTop:2 }}>Stock TIDAK akan berkurang saat terjual</div>}
                  {isAdded ? (
                    <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:6, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:4 }}>
                      <button aria-label="Kurangi" className="btn" style={{ width:36, height:36, minHeight:36, minWidth:36, padding:0, borderRadius:8, fontSize:16, flex:"0 0 36px", background:"var(--surface)" }} onClick={()=>cart.updateQty(p.id, qty-1)}>−</button>
                      <span style={{ flex:1, textAlign:"center", fontWeight:800, fontSize:14, fontVariantNumeric:"tabular-nums" as any, minWidth:20 }}>{qty}</span>
                      <button aria-label="Tambah" className="btn" style={{ width:36, height:36, minHeight:36, minWidth:36, padding:0, borderRadius:8, fontSize:16, flex:"0 0 36px", background:"var(--surface)" }} onClick={()=>cart.updateQty(p.id, qty+1)}>＋</button>
                    </div>
                  ) : (
                    <button className="btn" style={{ marginTop:8, minHeight:40, padding:"8px 12px", fontSize:13, fontWeight:600, width:"100%", borderRadius:10 }} onClick={()=>cart.add({product_id:p.id,product_name:p.name,selling_price:p.selling_price,cost_price:p.cost_price,image_url:p.image_url})}>＋ Tambah</button>
                  )}
                </div>
              </div>
            )})}
          </div>
          {filtered.length===0 && <div className="card" style={{ padding:20, textAlign:"center", marginTop:10 }}><span className="muted" style={{ fontSize:13 }}>Tidak ada produk</span></div>}

          {/* Empty cart hint — only on mobile or when left column empty, desktop has its own panel */}
          {cart.items.length===0 && (
            <div data-onboarding="pos-cart" className="pos-mobile-hint" style={{ marginTop:10, border:"1px dashed var(--border)", borderRadius:12, padding:12, textAlign:"center", background:"var(--surface)" }}>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text2)" }}>Keranjang kosong</div>
              <div className="muted" style={{ fontSize:11, marginTop:2 }}>Tambah produk untuk melihat total — keranjang tetap di samping (desktop) atau di bawah (HP)</div>
            </div>
          )}
          <div data-onboarding="pos-pay" style={{ height:1 }} />
        </div>

        {/* RIGHT: sticky cart — desktop only */}
        <aside className="pos-desktop-cart cart card" style={{ position:"sticky", top:84, height:"fit-content" }}>
          <div style={{ padding:"4px 0 12px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:".07em", color:"var(--muted)" }}>KERANJANG</div>
              <div style={{ fontSize:13, fontWeight:700, marginTop:2 }}>{count>0 ? `${count} item • ${formatRupiah(total)}` : "Belum ada item"}</div>
            </div>
            {count>0 && <button className="btn" style={{ minHeight:32, padding:"6px 10px", fontSize:12 }} onClick={()=>cart.clear()}>Kosongkan</button>}
          </div>

          <div className="cart-scroll" style={{ padding:"8px 0" }}>
            {cart.items.length===0 ? (
              <div style={{ padding:"28px 12px", textAlign:"center", border:"1px dashed var(--border)", borderRadius:12, background:"var(--surface2)", marginTop:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text2)" }}>Keranjang kosong</div>
                <div className="muted" style={{ fontSize:11, marginTop:4 }}>Pilih produk di kiri — tetap terlihat tanpa scroll</div>
              </div>
            ) : (
              <div style={{ display:"grid", gap:0 }}>
                {cart.items.map((it:any)=> {
                  const hasR = withRecipeSet.has(it.product_id);
                  return (
                    <div key={it.product_id} style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)", alignItems:"center" }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, lineHeight:1.2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{it.product_name}</div>
                        <div className="muted" style={{ fontSize:11, marginTop:2 }}>{formatRupiah(it.selling_price)} × {it.quantity} = <b style={{color:"var(--text)"}}>{formatRupiah(it.selling_price * it.quantity)}</b></div>
                        {!hasR && <div style={{ fontSize:10, fontWeight:700, color:"#B45309", marginTop:2 }}>⚠ Stock tidak berkurang</div>}
                      </div>
                      <div className="qty" style={{ gap:6 }}>
                        <button aria-label="Kurangi" onClick={()=>cart.updateQty(it.product_id,it.quantity-1)} style={{ width:32, height:32, fontSize:14 }}>−</button>
                        <span style={{ minWidth:18, textAlign:"center", fontWeight:800, fontSize:13 }}>{it.quantity}</span>
                        <button aria-label="Tambah" onClick={()=>cart.updateQty(it.product_id,it.quantity+1)} style={{ width:32, height:32, fontSize:14 }}>＋</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {cartWithoutRecipe.length>0 && cart.items.length>0 && (
            <div style={{ background:"#FFF7E5", border:"1px solid #FED7AA", borderRadius:10, padding:"8px 10px", margin:"8px 0" }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#B45309" }}>⚠ {cartWithoutRecipe.length} tanpa recipe</div>
              <div style={{ fontSize:11, color:"#92400E", marginTop:2, lineHeight:1.3 }}>{cartWithoutRecipe.map((it:any)=> it.product_name).join(", ")} — stock TIDAK berkurang.</div>
            </div>
          )}

          <div style={{ borderTop:"1px solid var(--border)", paddingTop:12, marginTop:8, background:"var(--surface)", position:"sticky", bottom:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
              <span style={{ fontSize:11, fontWeight:800, letterSpacing:".06em", color:"var(--muted)" }}>TOTAL</span>
              <span style={{ fontSize:18, fontWeight:800, letterSpacing:"-.02em", fontVariantNumeric:"tabular-nums" as any }}>{formatRupiah(total)}</span>
            </div>
            <button className="btn primary" style={{ width:"100%", minHeight:48, marginTop:10, fontSize:14, fontWeight:700, borderRadius:12 }} onClick={()=> setShowPayment(true)} disabled={count===0}>Bayar • {formatRupiah(total)}</button>
            <div className="muted" style={{ fontSize:10, textAlign:"center", marginTop:6 }}>Keranjang tetap terlihat — tidak perlu scroll</div>
          </div>
        </aside>
      </div>

      {/* Mobile: fixed bottom bar — stay without scroll (hidden on desktop) */}
      {cart.items.length>0 && (
        <div data-onboarding="pos-cart" className="pos-mobile-bar">
          <div className="card" style={{ padding:"10px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, borderRadius:14, border:"1px solid var(--border)", boxShadow:"0 8px 24px rgba(0,0,0,.12)" }}>
            <div style={{ minWidth:0, lineHeight:1.2 }}>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:".06em", color:"var(--muted)" }}>{count} ITEM • KERANJANG</div>
              <div style={{ fontWeight:800, fontSize:14, fontVariantNumeric:"tabular-nums" as any, marginTop:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{formatRupiah(total)}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button className="btn" style={{ minHeight:40, padding:"8px 12px", fontSize:13, fontWeight:600, borderRadius:10, background:"var(--surface2)" }} onClick={()=>setShowCart(true)}>Lihat</button>
              <button className="btn primary" style={{ minHeight:40, padding:"8px 16px", fontSize:13, fontWeight:700, borderRadius:10 }} onClick={()=>setShowPayment(true)}>Bayar</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet cart detail — mobile only (desktop uses sticky panel) */}
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
              {cartWithoutRecipe.length>0 && (
                <div style={{ background:"#FFF7E5", border:"1px solid #FED7AA", borderRadius:10, padding:"8px 10px", marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#B45309" }}>⚠ {cartWithoutRecipe.length} produk tanpa recipe</div>
                  <div style={{ fontSize:11, color:"#B45309", marginTop:2 }}>{cartWithoutRecipe.map((it:any)=> it.product_name).join(", ")} — stock TIDAK akan berkurang. Atur di Products → Recipe.</div>
                </div>
              )}
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
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text2)", marginBottom:8 }}>Uang Diterima</div>
                  <input className="input" inputMode="numeric" placeholder={formatRupiah(total)} value={amountPaid} onChange={e=>{ const d=e.target.value.replace(/\D/g,""); setAmountPaid(d?formatRupiah(Number(d)):""); }} style={{ fontWeight:700 }} />
                  <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap" }}>
                    <button className="btn" style={{ fontSize:12 }} onClick={()=>setAmountPaid(formatRupiah(total))}>Uang Pas</button>
                    {[20000,50000,100000].map(v=> <button key={v} className="btn" style={{ fontSize:12 }} onClick={()=>setAmountPaid(formatRupiah(v))}>{formatRupiah(v)}</button>)}
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:12 }}><span style={{ fontSize:13, color:"var(--text2)" }}>Kembalian</span><b style={{ color: isCashInvalid?"var(--red)": change>0?"var(--green)":"var(--text)", fontSize:16 }}>{isCashInvalid?"Uang kurang!":formatRupiah(Math.max(0,change))}</b></div>
                </div>
              )}

              {cartWithoutRecipe.length>0 && (
                <div style={{ background:"#FFF7E5", border:"1px solid #FED7AA", borderRadius:10, padding:"8px 10px", marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:800, color:"#B45309" }}>⚠ Stock tidak berkurang untuk {cartWithoutRecipe.length} item</div>
                  <div style={{ fontSize:11, color:"var(--text2)" }}>{cartWithoutRecipe.map((it:any)=> it.product_name).join(", ")} — lengkapi recipe agar inventory terpotong otomatis.</div>
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
            {success._stock?.productsWithoutRecipe?.length > 0 ? (
              <div style={{ marginTop:12, background:"#FFF7E5", border:"1px solid #FED7AA", borderRadius:10, padding:"10px 12px", textAlign:"left" }}>
                <div style={{ fontSize:11, fontWeight:800, color:"#B45309" }}>⚠ Stock TIDAK berkurang</div>
                <div style={{ fontSize:11, color:"#92400E", marginTop:4 }}>{success._stock.message}</div>
                <a href="/products" style={{ fontSize:11, fontWeight:700, color:"var(--text)", display:"inline-block", marginTop:6 }}>Atur Recipe →</a>
              </div>
            ) : success._stock?.stockDeducted ? (
              <div style={{ marginTop:12, background:"var(--green-soft)", border:"1px solid #BBF7D0", borderRadius:10, padding:"10px 12px", textAlign:"left", display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:14 }}>✓</span>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--green)" }}>Stock otomatis berkurang ({success._stock.consumption?.length} bahan) — cek di Inventory</div>
              </div>
            ) : null}
            <button className="btn primary" style={{ width:"100%", marginTop:20, minHeight:48 }} onClick={()=>setSuccess(null)}>Selesai</button>
          </div>
        </div>
      )}
      {showPosTour && (
        <OnboardingTour tour={POS_TOUR} onComplete={()=>{ markCompleted("pos"); setShowPosTour(false); }} onSkip={()=>{ markCompleted("pos"); setShowPosTour(false); }} />
      )}
    </div>
  );
}
