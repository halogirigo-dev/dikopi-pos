"use client";
import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/Tour";
import { EXPENSES_TOUR } from "@/components/onboarding/data";
import { EmptyStateGuide } from "@/components/onboarding/EmptyState";

export default function ExpensesClient({ categories, expenses, activeLabel, initialParams }: { categories:any[]; expenses:any[]; activeLabel:string; initialParams:any }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [show, setShow]=useState(false);
  const [form,setForm]=useState({category_id:categories[0]?.id||"",description:"",amount:"",payment_method:"CASH",expense_date:new Date().toISOString().slice(0,10),notes:""});
  const { state: obState, isCompleted, markCompleted } = useOnboarding();
  const [showTour, setShowTour] = useState(false);
  useEffect(() => {
    if (!obState.tipsEnabled || isCompleted("expenses") || !obState.welcome) return;
    const t = setTimeout(() => setShowTour(true), 900);
    return () => clearTimeout(t);
  }, [obState.tipsEnabled, obState.welcome, isCompleted]);

  async function submit(){
    const res=await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,amount:Number(form.amount)})});
    if(res.ok) location.reload(); else alert(await res.text());
  }

  function push(params: Record<string,string|undefined>){
    const q = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k,v])=>{
      if(!v) q.delete(k);
      else q.set(k,v);
    });
    if(params.date){ q.delete("month"); q.delete("period"); q.delete("from"); q.delete("to"); }
    if(params.month){ q.delete("date"); q.delete("period"); q.delete("from"); q.delete("to"); }
    if(params.period){ q.delete("date"); q.delete("month"); if(params.period==="all"){ q.delete("period"); q.delete("from"); q.delete("to"); } }
    if(params.category){ if(params.category==="all") q.delete("category"); }
    router.push(`/expenses?${q.toString()}`);
  }

  const period = initialParams?.period || (initialParams?.date || initialParams?.month ? "" : "all");
  const isAll = !initialParams?.period && !initialParams?.date && !initialParams?.month && !initialParams?.from;
  const activeCat = initialParams?.category || "all";

  const total = expenses.reduce((s:number,e:any)=>s+e.amount,0);

  // per-category per-bulan breakdown for current view
  const perCat: Record<string, number> = {};
  expenses.forEach((e:any)=>{ perCat[e.category.name]=(perCat[e.category.name]||0)+e.amount; });
  const perCatEntries = Object.entries(perCat).sort((a,b)=> (b[1] as number)-(a[1] as number));

  return (
    <div>
      {/* Filters: hari ini / bulan ini / tanggal & bulan + kategori */}
      <div data-onboarding="expenses-filter" className="card" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }} className="scrollbar-none">
          <button className={`cat ${isAll?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"all" })}>Semua</button>
          <button className={`cat ${period==="today"?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"today" })}>Hari ini</button>
          <button className={`cat ${period==="thisMonth"?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"thisMonth" })}>Bulan ini</button>
          <button className="btn" style={{ minHeight:36, whiteSpace:"nowrap" }} onClick={()=>{
            const d = prompt("Pilih tanggal (YYYY-MM-DD)", new Date().toISOString().slice(0,10));
            if(d) push({ date:d });
          }}>📅 Tanggal</button>
          <button className="btn" style={{ minHeight:36, whiteSpace:"nowrap" }} onClick={()=>{
            const m = prompt("Pilih bulan (YYYY-MM)", new Date().toISOString().slice(0,7));
            if(m) push({ month:m });
          }}>🗓️ Bulan</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", marginBottom:4 }}>Pilih tanggal</div>
            <input className="input" type="date" value={initialParams?.date||""} onChange={e=> e.target.value ? push({ date:e.target.value }) : push({ period:"all" })} style={{ minHeight:44 }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", marginBottom:4 }}>Pilih bulan</div>
            <input className="input" type="month" value={initialParams?.month||""} onChange={e=> e.target.value ? push({ month:e.target.value }) : push({ period:"all" })} style={{ minHeight:44 }} />
          </div>
        </div>

        <div style={{ marginTop:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#999", marginBottom:4 }}>Filter kategori</div>
          <select className="input" value={activeCat} onChange={e=>push({ category:e.target.value })} style={{ minHeight:44 }}>
            <option value="all">Semua kategori</option>
            {categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <details style={{ marginTop:10 }}>
          <summary className="muted" style={{ fontSize:12, cursor:"pointer" }}>Rentang kustom</summary>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            <input className="input" type="date" defaultValue={initialParams?.from||""} id="expFrom" />
            <input className="input" type="date" defaultValue={initialParams?.to||""} id="expTo" />
          </div>
          <button className="btn accent" style={{ width:"100%", marginTop:8, minHeight:44 }} onClick={()=>{
            const f=(document.getElementById("expFrom") as HTMLInputElement).value;
            const t=(document.getElementById("expTo") as HTMLInputElement).value;
            if(f&&t) push({ period:"custom", from:f, to:t } as any);
            else alert("Isi Dari dan Sampai");
          }}>Terapkan rentang</button>
        </details>

        <div className="muted" style={{ fontSize:12, marginTop:10, textAlign:"center" }}>Menampilkan: <b style={{ color:"var(--text)" }}>{activeLabel}</b>{activeCat!=="all" ? ` • ${categories.find((c:any)=>c.id===activeCat)?.name}` : ""} • {expenses.length} data • Total <b style={{ color:"var(--red)" }}>{formatRupiah(total)}</b></div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <button data-onboarding="expenses-add" className="btn accent" style={{ flex:1, minHeight:48 }} onClick={()=>setShow(true)}>＋ Tambah Pengeluaran</button>
      </div>
      <div className="muted" style={{ fontSize:11, margin:"0 0 12px", textAlign:"center" }}>💡 Pengeluaran = biaya operasional. Dicatat di sini agar laba bersih akurat.</div>

      {/* Per-kategori per-bulan summary */}
      {perCatEntries.length>0 && (
        <div data-onboarding="expenses-summary" className="card" style={{ padding:12, marginBottom:12 }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Ringkasan per kategori • {activeLabel}</div>
          <div style={{ display:"grid", gap:8 }}>
            {perCatEntries.map(([name, amt])=>(
              <div key={name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--surface2)", borderRadius:10, padding:"10px 12px" }}>
                <span style={{ fontSize:13, fontWeight:600 }}>{name}</span>
                <b style={{ fontSize:13, color:"var(--red)" }}>-{formatRupiah(amt as number)}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile cards */}
      <div style={{ display:"grid", gap:12 }}>
        <style>{`@media(min-width:901px){ .mobile-exp{display:none} } @media(max-width:900px){ .desktop-exp{display:none} }`}</style>
        <div className="mobile-exp" style={{ display:"grid", gap:12 }}>
          {expenses.map((e:any)=> (
            <div key={e.id} className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{e.description}</div><div className="muted" style={{ fontSize:12 }}>{e.category.name}</div></div>
                <div style={{ fontWeight:800, color:"var(--red)", fontSize:14 }}>-{formatRupiah(e.amount)}</div>
              </div>
              <div className="muted" style={{ fontSize:12, marginTop:8 }}>{new Date(e.expense_date).toLocaleDateString("id-ID",{day:"2-digit", month:"long", year:"numeric"})} • {e.payment_method} • {e.creator?.name||""}</div>
              {e.notes && <div className="muted" style={{ fontSize:12, marginTop:6 }}>{e.notes}</div>}
            </div>
          ))}
          {!expenses.length && <EmptyStateGuide icon="💸" title="Belum ada pengeluaran" description="Catat biaya operasional seperti sewa, listrik, gaji, bahan untuk hitung laba bersih yang akurat." actionLabel="＋ Tambah Pengeluaran" onAction={()=>setShow(true)} hint="Tanpa pengeluaran, laporan laba akan terlihat terlalu besar." />}
        </div>
      </div>

      <div className="card desktop-exp" style={{ marginTop:12 }}>
        <div className="card-head"><div className="card-title">Expenses</div><div className="muted">Total {formatRupiah(total)} • {activeLabel}</div></div>
        <table className="table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th>Amount</th></tr></thead>
          <tbody>
            {expenses.map((e:any)=> (
              <tr key={e.id}><td>{new Date(e.expense_date).toLocaleDateString("id-ID")}</td><td>{e.category.name}</td><td>{e.description}</td><td>{e.payment_method}</td><td className="num" style={{ color:"var(--red)" }}>-{formatRupiah(e.amount)}</td></tr>
            ))}
            {!expenses.length && <tr><td colSpan={5} style={{ textAlign:"center", padding:20 }} className="muted">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:50 }} onClick={()=>setShow(false)}>
          <div className="card" style={{ padding:20, width:420 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 12px" }}>Tambah Pengeluaran</h3>
            <div className="formgrid">
              <div className="field"><label>Kategori</label><select className="input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>{categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="field"><label>Payment</label><select className="input" value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option>CASH</option><option>QRIS</option><option>DEBIT</option><option>TRANSFER</option></select></div>
              <div className="field full"><label>Deskripsi</label><input className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Listrik / Sewa / Bahan" /></div>
              <div className="field"><label>Amount (Rp)</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
              <div className="field"><label>Tanggal</label><input className="input" type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})} /></div>
              <div className="field full"><label>Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
              <div className="full" style={{ display:"flex", gap:8, marginTop:6 }}><button className="btn accent" style={{ flex:1 }} onClick={submit}>Simpan</button><button className="btn" onClick={()=>setShow(false)}>Batal</button></div>
            </div>
          </div>
        </div>
      )}
      {showTour && <OnboardingTour tour={EXPENSES_TOUR} onComplete={()=>{ markCompleted("expenses"); setShowTour(false); }} onSkip={()=>{ markCompleted("expenses"); setShowTour(false); }} />}
    </div>
  );
}
