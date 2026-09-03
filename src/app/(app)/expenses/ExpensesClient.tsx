"use client";
import { useState } from "react";
import { formatRupiah } from "@/lib/utils";

export default function ExpensesClient({ categories, expenses }: { categories:any[]; expenses:any[] }) {
  const [show, setShow]=useState(false);
  const [form,setForm]=useState({category_id:categories[0]?.id||"",description:"",amount:"",payment_method:"CASH",expense_date:new Date().toISOString().slice(0,10),notes:""});
  async function submit(){
    const res=await fetch("/api/expenses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,amount:Number(form.amount)})});
    if(res.ok) location.reload(); else alert(await res.text());
  }
  const total = expenses.reduce((s:number,e:any)=>s+e.amount,0);
  return (
    <div>
      <div className="filters"><button className="btn accent" onClick={()=>setShow(true)}>＋ Tambah Pengeluaran</button><span className="muted" style={{ alignSelf:"center" }}>Total {formatRupiah(total)}</span></div>

      {/* Mobile cards spec 15 */}
      <div style={{ display:"grid", gap:12 }}>
        <style>{`@media(min-width:901px){ .mobile-exp{display:none} } @media(max-width:900px){ .desktop-exp{display:none} }`}</style>
        <div className="mobile-exp" style={{ display:"grid", gap:12 }}>
          {expenses.map((e:any)=> (
            <div key={e.id} className="card" style={{ padding:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <div><div style={{ fontWeight:700, fontSize:14 }}>{e.description}</div><div className="muted" style={{ fontSize:12 }}>{e.category.name}</div></div>
                <div style={{ fontWeight:800, color:"var(--red)", fontSize:14 }}>-{formatRupiah(e.amount)}</div>
              </div>
              <div className="muted" style={{ fontSize:12, marginTop:8 }}>{new Date(e.expense_date).toLocaleDateString("id-ID",{day:"2-digit", month:"short", year:"numeric"})} • {e.payment_method}</div>
              {e.notes && <div className="muted" style={{ fontSize:12, marginTop:6 }}>{e.notes}</div>}
            </div>
          ))}
          {!expenses.length && <div className="card" style={{ padding:20, textAlign:"center" }}><span className="muted">Belum ada pengeluaran</span></div>}
        </div>
      </div>

      <div className="card desktop-exp">
        <div className="card-head"><div className="card-title">Expenses</div><div className="muted">Total {formatRupiah(total)}</div></div>
        <table className="table">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Payment</th><th>Amount</th></tr></thead>
          <tbody>
            {expenses.map((e:any)=> (
              <tr key={e.id}><td>{new Date(e.expense_date).toLocaleDateString("id-ID")}</td><td>{e.category.name}</td><td>{e.description}</td><td>{e.payment_method}</td><td className="num">{formatRupiah(e.amount)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:50 }} onClick={()=>setShow(false)}>
          <div className="card" style={{ padding:20, width:420 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 12px" }}>Add Expense</h3>
            <div className="formgrid">
              <div className="field"><label>Kategori</label><select className="input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>{categories.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="field"><label>Payment</label><select className="input" value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option>CASH</option><option>QRIS</option><option>DEBIT</option><option>TRANSFER</option></select></div>
              <div className="field full"><label>Deskripsi</label><input className="input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Milk & coffee beans" /></div>
              <div className="field"><label>Amount (Rp)</label><input className="input" type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
              <div className="field"><label>Tanggal</label><input className="input" type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})} /></div>
              <div className="field full"><label>Notes</label><input className="input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
              <div className="full" style={{ display:"flex", gap:8, marginTop:6 }}><button className="btn accent" style={{ flex:1 }} onClick={submit}>Simpan</button><button className="btn" onClick={()=>setShow(false)}>Batal</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
