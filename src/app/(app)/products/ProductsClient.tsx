"use client";
import { useState } from "react";
import { formatRupiah, calcMargin } from "@/lib/utils";

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
    const payload={ name:form.name.trim(), category_id:form.category_id, selling_price:Number(form.selling_price), cost_price:Number(form.cost_price), hpp_breakdown:breakdown.length?breakdown.map(b=>({name:b.name,cost:Number(b.cost)})):null, image_url:form.image_url.trim()||null, is_available:form.is_available };
    const url=editing?`/api/products/${editing.id}`:"/api/products";
    const res=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(res.ok) location.reload(); else setError(await res.text());
  }
  async function del(id:string){ if(!confirm("Hapus produk?")) return; await fetch(`/api/products/${id}`,{method:"DELETE"}); location.reload(); }

  return (
    <div>
      <div className="filters"><button className="btn accent" onClick={openCreate}>＋ Add Product</button><input className="input" placeholder="Search product..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Product</th><th>Category</th><th>Selling Price</th><th>HPP</th><th>Gross Margin</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {filtered.map(p=>{
              const m=calcMargin(p.selling_price, p.selling_price - p.cost_price);
              return (
                <tr key={p.id}>
                  <td><b>{p.name}</b></td>
                  <td>{p.category.name}</td>
                  <td>{formatRupiah(p.selling_price)}</td>
                  <td>{formatRupiah(p.cost_price)}</td>
                  <td>{m.toFixed(1)}%</td>
                  <td>{p.is_available ? <span className="badge">Available</span> : <span className="badge red">Hidden</span>}</td>
                  <td><button className="btn" style={{ padding:"6px 10px", marginRight:6 }} onClick={()=>openEdit(p)}>Edit</button><button className="btn" style={{ color:"var(--red)" }} onClick={()=>del(p.id)}>Hapus</button></td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={7} style={{ textAlign:"center", padding:20 }} className="muted">Tidak ada produk</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:50, padding:16 }} onClick={()=>setShowForm(false)}>
          <div className="card" style={{ padding:20, width:500, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 14px" }}>{editing?"Edit Produk":"Tambah Produk"}</h3>
            <div className="formgrid">
              <div className="field full"><label>Nama *</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Es Kopi Susu" /></div>
              <div className="field"><label>Kategori *</label><select className="input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Pilih</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="field"><label>Status</label><select className="input" value={String(form.is_available)} onChange={e=>setForm({...form,is_available:e.target.value==="true"})}><option value="true">Tersedia</option><option value="false">Hidden</option></select></div>
              <div className="field"><label>Harga Jual *</label><input className="input" type="number" value={form.selling_price} onChange={e=>setForm({...form,selling_price:e.target.value})} /></div>
              <div className="field"><label>HPP *</label><input className="input" type="number" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})} /></div>
              <div className="field full"><label>Image URL</label><input className="input" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} placeholder="https://..." /></div>
              <div className="field full">
                <button className="btn" style={{ width:"100%" }} onClick={()=>setShowCalc(!showCalc)}>🧮 Hitung HPP {showCalc?"−":"+"}</button>
                {showCalc && (
                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:10, marginTop:8 }}>
                    {breakdown.map((b,i)=>(
                      <div key={i} style={{ display:"flex", gap:6, marginBottom:6 }}>
                        <input className="input" style={{ flex:1 }} placeholder="Komponen" value={b.name} onChange={e=>{ const nb=[...breakdown]; nb[i].name=e.target.value; setBreakdown(nb); }} />
                        <input className="input" style={{ width:100 }} type="number" placeholder="Biaya" value={b.cost} onChange={e=>{ const nb=[...breakdown]; nb[i].cost=e.target.value; setBreakdown(nb); }} />
                        <button className="btn" onClick={()=>setBreakdown(breakdown.filter((_,j)=>j!==i))}>×</button>
                      </div>
                    ))}
                    <button className="btn" onClick={()=>setBreakdown([...breakdown,{name:"",cost:""}])}>+ Komponen</button>
                    {breakdown.length>0 && <div style={{ marginTop:8, display:"flex", justifyContent:"space-between" }}><span>Total {formatRupiah(breakdown.reduce((s,b)=>s+(Number(b.cost)||0),0))}</span><button className="btn accent" onClick={()=>setForm({...form,cost_price:String(breakdown.reduce((s,b)=>s+(Number(b.cost)||0),0))})}>Pakai</button></div>}
                  </div>
                )}
              </div>
              {error && <div className="full" style={{ background:"var(--red-soft)", color:"var(--red)", border:"1px solid #f5c6c6", borderRadius:8, padding:8, fontSize:12 }}>{error}</div>}
              <div className="full" style={{ display:"flex", gap:8 }}><button className="btn accent" style={{ flex:1 }} onClick={submit}>{editing?"Simpan":"Tambah"}</button><button className="btn" onClick={()=>setShowForm(false)}>Batal</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
