"use client";
import { useState, useEffect } from "react";
import { formatRupiah, calcMargin } from "@/lib/utils";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/Tour";
import { PRODUCTS_TOUR } from "@/components/onboarding/data";
import { EmptyStateGuide } from "@/components/onboarding/EmptyState";

type Product = any;
type Category = { id: string; name: string };

export default function ProductsClient({ categories, products: initial }: { categories: Category[]; products: Product[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category_id: "", selling_price: "", cost_price: "", image_url: "", is_available: true });
  const [breakdown, setBreakdown] = useState<{name:string,cost:string}[]>([]);
  const [showCalc, setShowCalc] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [recipeMap, setRecipeMap] = useState<Record<string, any[]>>({});
  const [recipeFor, setRecipeFor] = useState<string | null>(null);
  const [recipeDraft, setRecipeDraft] = useState<{ inventory_item_id: string; quantity: string }[]>([]);
  const { state: obState, isCompleted, markCompleted } = useOnboarding();
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!obState.tipsEnabled || isCompleted("products") || !obState.welcome) return;
    const t = setTimeout(() => setShowTour(true), 900);
    return () => clearTimeout(t);
  }, [obState.tipsEnabled, obState.welcome, isCompleted]);

  useEffect(() => {
    fetch("/api/inventory/items").then(r=>r.ok?r.json():[]).then(d=> setInventoryItems(Array.isArray(d)?d:(d.items||[]))).catch(()=>{});
    // fetch recipes for all products (parallel)
    Promise.all(initial.map(p=> fetch(`/api/inventory/recipes?product_id=${p.id}`).then(r=>r.ok?r.json():[]).then(arr=> ({pid:p.id, arr})).catch(()=>({pid:p.id, arr:[]}))))
      .then(results=> {
        const m: Record<string, any[]> = {};
        results.forEach(({pid, arr})=> m[pid]=arr);
        setRecipeMap(m);
      });
  }, []);
  async function openRecipe(productId: string){
    setRecipeFor(productId);
    const r = await fetch(`/api/inventory/recipes?product_id=${productId}`).then(x=>x.ok?x.json():[]).catch(()=>[]);
    setRecipeDraft((r as any[]).map((x:any)=>({ inventory_item_id: x.inventory_item_id, quantity: String(x.quantity)})));
    if(!(r as any[]).length) setRecipeDraft([]);
  }
  async function saveRecipe(){
    if(!recipeFor) return;
    const clean = recipeDraft.filter(x=> x.inventory_item_id && Number(x.quantity)>0);
    const seen = new Set<string>();
    for(const c of clean){ if(seen.has(c.inventory_item_id)) return alert("Duplikat bahan"); seen.add(c.inventory_item_id); }
    const res = await fetch("/api/inventory/recipes",{ method:"PUT", headers:{ "Content-Type":"application/json"}, body: JSON.stringify({ product_id: recipeFor, items: clean.map(c=>({ inventory_item_id:c.inventory_item_id, quantity:Number(c.quantity)}))})});
    if(res.ok){ alert("Resep disimpan"); const arr = await res.json(); setRecipeMap(prev=> ({...prev, [recipeFor]:arr})); setRecipeFor(null);} else alert(await res.text());
  }

  const filtered = initial.filter(p=> !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.name.toLowerCase().includes(search.toLowerCase()));

  function openCreate(){
    setEditing(null); setForm({ name:"", category_id:categories[0]?.id||"", selling_price:"", cost_price:"", image_url:"", is_available:true });
    setBreakdown([]); setShowCalc(false); setError(""); setShowForm(true);
  }
  function openEdit(p:Product){
    setEditing(p); setForm({ name:p.name, category_id:p.category_id, selling_price:String(p.selling_price), cost_price:String(p.cost_price), image_url:p.image_url||"", is_available:p.is_available });
    try{ const bd=p.hpp_breakdown?JSON.parse(p.hpp_breakdown):[]; setBreakdown(bd.map((b:any)=>({name:b.name,cost:String(b.cost)}))); }catch{ setBreakdown([]);} setError(""); setShowForm(true);
  }
  async function submit(){
    setError(""); if(!form.name.trim()) return setError("Nama wajib"); if(!form.category_id) return setError("Kategori wajib"); if(!form.selling_price||Number(form.selling_price)<=0) return setError("Harga jual >0");
    setSubmitting(true);
    try{
      const payload={ name:form.name.trim(), category_id:form.category_id, selling_price:Number(form.selling_price), cost_price:Number(form.cost_price), hpp_breakdown:breakdown.length?breakdown.map(b=>({name:b.name,cost:Number(b.cost)})):null, image_url:form.image_url.trim()||null, is_available:form.is_available };
      const url=editing?`/api/products/${editing.id}`:"/api/products";
      const res=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(res.ok) location.reload(); else setError(await res.text());
    } finally{ setSubmitting(false); }
  }
  async function del(id:string){ if(!confirm("Hapus produk?")) return; await fetch(`/api/products/${id}`,{method:"DELETE"}); location.reload(); }

  return (
    <div>
      <div className="filters"><button data-onboarding="products-add" className="btn accent" onClick={openCreate}>＋ Add Product</button><input className="input" placeholder="Search product..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      {/* micro hint */}
      <div className="muted" style={{ fontSize:12, marginBottom:10 }}>💡 Harga jual = omzet, HPP = biaya bikin. Selisihnya = laba kotor.</div>
      {/* Mobile cards spec 14 */}
      <div style={{ display:"grid", gap:12 }} className="mobile-product-cards">
        <style>{`@media(min-width:901px){ .mobile-product-cards{display:none} } @media(max-width:900px){ .desktop-table{display:none} }`}</style>
        {filtered.map(p=>{
          const m=calcMargin(p.selling_price, p.selling_price - p.cost_price);
          const recipe = recipeMap[p.id] || [];
          const hasRecipe = recipe.length>0;
          return (
            <div key={p.id} className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{p.name}</div><div className="muted" style={{ fontSize:12 }}>{p.category.name} • {p.is_available?"Aktif":"Hidden"}</div></div>
                <span className="badge" style={{ background: m>=50?"var(--green-soft)": m>=30?"var(--warning-soft)":"var(--red-soft)", color: m>=50?"var(--green)": m>=30?"var(--warning)":"var(--red)" }}>{m.toFixed(1)}%</span>
              </div>
              <div data-onboarding={filtered.indexOf(p)===0 ? "products-margin" : undefined} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginTop:12, background:"var(--surface2)", borderRadius:12, padding:12 }}>
                <div><div className="muted" style={{ fontSize:11 }}>Selling Price</div><div style={{ fontWeight:700 }}>{formatRupiah(p.selling_price)}</div></div>
                <div data-onboarding={filtered.indexOf(p)===0 ? "products-hpp" : undefined}><div className="muted" style={{ fontSize:11 }}>HPP</div><div style={{ fontWeight:700 }}>{formatRupiah(p.cost_price)}</div></div>
              </div>
              <div className="muted" style={{ fontSize:12, marginTop:8 }}>Margin {m.toFixed(1)}% • Gross {formatRupiah(p.selling_price - p.cost_price)}</div>
              <div style={{ marginTop:10, background: hasRecipe?"var(--green-soft)":"#FFF7E5", border:`1px solid ${hasRecipe?"#BBF7D0":"#FED7AA"}`, borderRadius:10, padding:"8px 10px" }}>
                <div style={{ fontSize:11, fontWeight:800, color:hasRecipe?"var(--green)":"#B45309", letterSpacing:".06em" }}>{hasRecipe? "✓ Recipe terkonfigurasi" : "⚠ Recipe belum dikonfigurasi"}</div>
                {hasRecipe ? <div className="muted" style={{ fontSize:11, marginTop:4 }}>{recipe.map((r:any)=> `${r.inventory_item.name} ${Number(r.quantity)}${r.inventory_item.unit}`).join(" • ")}</div>
                : <div className="muted" style={{ fontSize:11, marginTop:4 }}>Setiap 1 {p.name} terjual tidak mengurangi stock. Lengkapi recipe.</div>}
                <div style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>Product sold → Recipe → Stock berkurang otomatis</div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button className="btn" style={{ flex:1 }} onClick={()=>openEdit(p)}>Edit</button>
                <button className="btn accent" style={{ flex:1 }} onClick={()=>openRecipe(p.id)}>Recipe</button>
              </div>
            </div>
          );
        })}
        {!filtered.length && <EmptyStateGuide icon="☕" title="Belum ada produk" description="Tambahkan menu cafe kamu agar bisa mulai transaksi di POS. Produk butuh harga jual & HPP untuk hitung laba." actionLabel="＋ Tambah Produk" onAction={openCreate} hint="Contoh: Es Kopi Susu — Harga 18.000, HPP 6.000 → laba 12.000" />}
      </div>
      <div className="card desktop-table">
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>Selling Price</th><th>HPP</th><th>Gross Margin</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map(p=>{
              const m=calcMargin(p.selling_price, p.selling_price - p.cost_price);
              const recipe = recipeMap[p.id] || [];
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b><div className="muted" style={{ fontSize:11 }}>{recipe.length? recipe.map((r:any)=>`${r.inventory_item.name} ${Number(r.quantity)}${r.inventory_item.unit}`).join(" • ") : "⚠ no recipe"}</div></td>
                  <td>{p.category.name}</td>
                  <td>{formatRupiah(p.selling_price)}</td>
                  <td>{formatRupiah(p.cost_price)}</td>
                  <td>{m.toFixed(1)}%</td>
                  <td>{p.is_available ? <span className="badge">Available</span> : <span className="badge red">Hidden</span>}</td>
                  <td>
                    <button className="btn" style={{ padding:"6px 10px", marginRight:6 }} onClick={()=>openEdit(p)}>Edit</button>
                    <button className="btn" style={{ padding:"6px 10px", marginRight:6 }} onClick={()=>openRecipe(p.id)}>Recipe</button>
                    <button className="btn" style={{ color:"var(--red)" }} onClick={()=>del(p.id)}>Hapus</button>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={7} style={{ textAlign:"center", padding:20 }} className="muted">Tidak ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          className="modal-overlay"
          style={{
            alignItems:"flex-start",
            padding:"16px", paddingTop:"max(16px, env(safe-area-inset-top))",
            paddingBottom:"max(16px, env(safe-area-inset-bottom))",
            overflowY:"auto"
          }}
          onClick={()=>setShowForm(false)}
        >
          <div
            className="card modal-card"
            style={{
              width:"100%", maxWidth:520, margin:"auto",
              maxHeight:"min(92vh, 720px)", overflowY:"auto",
              borderRadius:16, padding:20,
              display:"flex", flexDirection:"column"
            }}
            onClick={e=>e.stopPropagation()}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, gap:12 }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800 }}>{editing?"Edit Produk":"Tambah Produk"}</h3>
              <button className="btn" style={{ minHeight:36, padding:"6px 10px" }} onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <div className="formgrid" style={{ gap:12 }}>
              <div className="field full"><label>Nama *</label><input className="input" style={{ minWidth:0 }} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Es Kopi Susu" /></div>
              <div className="field" style={{ minWidth:0 }}><label>Kategori *</label><select className="input" style={{ minWidth:0 }} value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Pilih</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="field" style={{ minWidth:0 }}><label>Status</label><select className="input" style={{ minWidth:0 }} value={String(form.is_available)} onChange={e=>setForm({...form,is_available:e.target.value==="true"})}><option value="true">Tersedia</option><option value="false">Hidden</option></select></div>
              <div className="field" style={{ minWidth:0 }}><label>Harga Jual *</label><input className="input" style={{ minWidth:0 }} type="number" inputMode="numeric" value={form.selling_price} onChange={e=>setForm({...form,selling_price:e.target.value})} placeholder="18000" /></div>
              <div className="field" style={{ minWidth:0 }}><label>HPP *</label><input data-onboarding="products-hpp-input" className="input" style={{ minWidth:0 }} type="number" inputMode="numeric" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})} placeholder="6000" /></div>
              <div className="field full" style={{ minWidth:0 }}><label>Image URL <span className="muted" style={{ fontWeight:400 }}>(opsional)</span></label><input className="input" style={{ minWidth:0 }} value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." /></div>
              <div className="field full" style={{ minWidth:0 }}>
                <button data-onboarding="products-calc" className="btn" style={{ width:"100%", minHeight:44 }} onClick={()=>setShowCalc(!showCalc)}>🧮 Hitung HPP {showCalc?"−":"+"}</button>
                {showCalc && (
                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:12, marginTop:8 }}>
                    <div className="muted" style={{ fontSize:11, marginBottom:8 }}>Bahan + cup + operasional = HPP</div>
                    {breakdown.map((b,i)=>(
                      <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                        <input className="input" style={{ flex:"1 1 0", minWidth:0 }} placeholder="Komponen (mis. susu)" value={b.name} onChange={e=>{ const nb=[...breakdown]; nb[i].name=e.target.value; setBreakdown(nb); }} />
                        <input className="input" style={{ width:110, flex:"0 0 110px", minWidth:0 }} type="number" inputMode="numeric" placeholder="Biaya" value={b.cost} onChange={e=>{ const nb=[...breakdown]; nb[i].cost=e.target.value; setBreakdown(nb); }} />
                        <button className="btn" style={{ width:44, height:44, flex:"0 0 44px", padding:0 }} onClick={()=>setBreakdown(breakdown.filter((_,j)=>j!==i))}>×</button>
                      </div>
                    ))}
                    <button className="btn" style={{ width:"100%", minHeight:40 }} onClick={()=>setBreakdown([...breakdown,{name:"",cost:""}])}>＋ Komponen</button>
                    {breakdown.length>0 && <div style={{ marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}><span style={{ fontWeight:700, fontSize:13 }}>Total {formatRupiah(breakdown.reduce((s,b)=>s+(Number(b.cost)||0),0))}</span><button className="btn accent" style={{ minHeight:40 }} onClick={()=>setForm({...form,cost_price:String(breakdown.reduce((s,b)=>s+(Number(b.cost)||0),0))})}>Pakai total → HPP</button></div>}
                  </div>
                )}
              </div>
              <div className="full" style={{ minHeight: error ? "auto" : 0 }}>
                {error && <div style={{ background:"var(--red-soft)", color:"var(--red)", border:"1px solid #f5c6c6", borderRadius:10, padding:"10px 12px", fontSize:12, lineHeight:"16px", animation:"dikopi-enter var(--duration-base) var(--ease-out) both" }}>{error}</div>}
              </div>
              <div className="full" style={{ display:"flex", gap:8, marginTop:4 }}><button className="btn accent" style={{ flex:1, minHeight:48 }} onClick={submit} disabled={submitting} aria-busy={submitting}>{submitting && <span className="spinner spinner-sm" aria-hidden />}{editing?"Simpan":"Tambah"}</button><button className="btn" style={{ flex:1, minHeight:48 }} onClick={()=>setShowForm(false)} disabled={submitting}>Batal</button></div>
            </div>
          </div>
        </div>
      )}
      {recipeFor && (
        <div className="modal-overlay" onClick={()=>setRecipeFor(null)}>
          <div className="card modal-card" style={{ padding:16, width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <h3 style={{ margin:0, fontSize:14, fontWeight:800 }}>Recipe — {initial.find(x=>x.id===recipeFor)?.name}</h3>
              <button className="btn" style={{ minHeight:36, padding:"6px 10px" }} onClick={()=>setRecipeFor(null)}>✕</button>
            </div>
            <div className="muted" style={{ fontSize:11, marginBottom:10 }}>Setiap 1 {initial.find(x=>x.id===recipeFor)?.name} terjual akan mengurangi stock sesuai recipe di atas.</div>
            {recipeDraft.map((r,idx)=> (
              <div key={idx} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                <select className="input" style={{ flex:"1 1 0" }} value={r.inventory_item_id} onChange={e=>{ const nd=[...recipeDraft]; nd[idx].inventory_item_id=e.target.value; setRecipeDraft(nd); }}>
                  <option value="">Pilih bahan</option>
                  {inventoryItems.map((it:any)=><option key={it.id||it.inventory_item_id} value={it.id||it.inventory_item_id}>{it.name} ({it.unit})</option>)}
                </select>
                <input className="input" style={{ width:110, flex:"0 0 110px" }} type="number" step="0.001" placeholder="Qty" value={r.quantity} onChange={e=>{ const nd=[...recipeDraft]; nd[idx].quantity=e.target.value; setRecipeDraft(nd); }} />
                <span className="muted" style={{ fontSize:10 }}>{inventoryItems.find((x:any)=>(x.id||x.inventory_item_id)===r.inventory_item_id)?.unit||""}</span>
                <button className="btn" style={{ width:44, height:44, flex:"0 0 44px", padding:0 }} onClick={()=>setRecipeDraft(recipeDraft.filter((_,i)=>i!==idx))}>×</button>
              </div>
            ))}
            <button className="btn" style={{ width:"100%", minHeight:40 }} onClick={()=>setRecipeDraft([...recipeDraft,{inventory_item_id:"", quantity:""}])}>＋ Bahan</button>
            <div style={{ display:"flex", gap:8, marginTop:12 }}><button className="btn accent" style={{ flex:1, minHeight:44 }} onClick={saveRecipe}>Simpan</button><button className="btn" style={{ flex:1 }} onClick={()=>setRecipeFor(null)}>Batal</button></div>
            <div style={{ display:"flex", gap:8, marginTop:10 }}>
              <a href="/inventory" className="btn" style={{ flex:1, fontSize:12 }}>Buka Inventory →</a>
            </div>
          </div>
        </div>
      )}
      {showTour && <OnboardingTour tour={PRODUCTS_TOUR} onComplete={()=>{ markCompleted("products"); setShowTour(false); }} onSkip={()=>{ markCompleted("products"); setShowTour(false); }} />}
    </div>
  );
}
