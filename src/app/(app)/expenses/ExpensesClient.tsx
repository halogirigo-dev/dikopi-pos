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
      <div className="filters"><button className="btn accent" onClick={()=>setShow(true)}>＋ Add Expense</button><span className="muted" style={{ alignSelf:"center" }}>September 2026 · Total {formatRupiah(total)}</span></div>
      <div className="card">
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
