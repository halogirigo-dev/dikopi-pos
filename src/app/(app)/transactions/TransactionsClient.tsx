"use client";
import { formatRupiah } from "@/lib/utils";
import { useState } from "react";

export default function TransactionsClient({ transactions, isAdmin }: { transactions: any[]; isAdmin: boolean }) {
  const [filter, setFilter] = useState("");
  const [voidId, setVoidId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filtered = transactions.filter(t=> t.invoice_number.toLowerCase().includes(filter.toLowerCase()));
  async function doVoid(){
    if(!voidId||!reason) return;
    const res=await fetch(`/api/transactions/${voidId}/void`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});
    if(res.ok) location.reload(); else alert(await res.text());
  }

  return (
    <div>
      <div className="filters"><input className="input" placeholder="Search invoice..." value={filter} onChange={e=>setFilter(e.target.value)} /><span className="muted" style={{ alignSelf:"center" }}>{filtered.length} data</span></div>
      <div className="card">
        <table className="table">
          <thead><tr><th>Invoice</th><th>Date</th><th>Cashier</th><th>Total</th><th>Payment</th><th>Kembalian</th><th>Status</th>{isAdmin&&<th>Aksi</th>}</tr></thead>
          <tbody>
            {filtered.map(t=> (
              <tr key={t.id}>
                <td><b>{t.invoice_number}</b></td>
                <td>{new Date(t.created_at).toLocaleString("id-ID")}</td>
                <td>{t.user.name}</td>
                <td className="num">{formatRupiah(t.total_revenue)}</td>
                <td>{t.payment_method}</td>
                <td className="num">{t.payment_method==="CASH" && t.change_amount!=null ? formatRupiah(t.change_amount) : "-"}</td>
                <td>{t.status==="VOID" ? <span className="badge red">Void</span> : <span className="badge">Completed</span>}</td>
                {isAdmin && <td>{t.status==="COMPLETED" ? <button className="btn" style={{ padding:"6px 10px", color:"var(--red)" }} onClick={()=>setVoidId(t.id)}>Void</button> : "-"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {voidId && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:50 }} onClick={()=>setVoidId(null)}>
          <div className="card" style={{ padding:20, width:360 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ margin:"0 0 8px" }}>Void Transaksi</h3>
            <p className="muted" style={{ fontSize:12 }}>Wajib isi alasan — tidak masuk laporan</p>
            <input className="input" style={{ width:"100%", marginTop:10 }} placeholder="Alasan void..." value={reason} onChange={e=>setReason(e.target.value)} />
            <div style={{ display:"flex", gap:8, marginTop:14 }}>
              <button className="btn primary" style={{ flex:1, background:"var(--red)", borderColor:"var(--red)" }} onClick={doVoid}>Void</button>
              <button className="btn" onClick={()=>setVoidId(null)}>Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
