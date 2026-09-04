"use client";
import { formatRupiah } from "@/lib/utils";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function TransactionsClient({ transactions, isAdmin, activeLabel, initialParams, pagination }: { transactions:any[]; isAdmin:boolean; activeLabel:string; initialParams:any; pagination?: { page:number; limit:number; total:number; totalPages:number } }){
  const router = useRouter();
  const sp = useSearchParams();
  const [filter,setFilter]=useState("");
  const [detail,setDetail]=useState<any|null>(null);
  const [voidId,setVoidId]=useState<string|null>(null);
  const [reason,setReason]=useState("");

  const filtered = transactions.filter(t=> t.invoice_number.toLowerCase().includes(filter.toLowerCase()));

  function push(params: Record<string,string | undefined>){
    const q = new URLSearchParams(sp.toString());
    Object.entries(params).forEach(([k,v])=>{
      if(!v) q.delete(k);
      else q.set(k,v);
    });
    // clean conflicting keys and reset pagination on filter change
    if(params.date) { q.delete("month"); q.delete("period"); q.delete("from"); q.delete("to"); q.delete("page"); }
    if(params.month) { q.delete("date"); q.delete("period"); q.delete("from"); q.delete("to"); q.delete("page"); }
    if(params.period) { q.delete("date"); q.delete("month"); q.delete("page"); if(params.period==="all"){ q.delete("period"); q.delete("from"); q.delete("to"); } }
    if(params.from || params.to) q.delete("page");
    router.push(`/transactions?${q.toString()}`);
  }

  const period = initialParams?.period || (initialParams?.date || initialParams?.month ? "" : "all");
  const isToday = period==="today";
  const isMonth = period==="thisMonth";
  const isAll = !initialParams?.period && !initialParams?.date && !initialParams?.month && !initialParams?.from;

  async function doVoid(){ if(!voidId||!reason) return; const r=await fetch(`/api/transactions/${voidId}/void`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})}); if(r.ok) location.reload(); else alert(await r.text()); }

  return (
    <div>
      {/* Filter hari ini / bulan ini / pilih tanggal & bulan */}
      <div className="card" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }} className="scrollbar-none">
          <button className={`cat ${isAll?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"all" })}>Semua</button>
          <button className={`cat ${isToday?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"today" })}>Hari ini</button>
          <button className={`cat ${isMonth?"active":""}`} style={{ minHeight:36 }} onClick={()=>push({ period:"thisMonth" })}>Bulan ini</button>
          <button className="btn" style={{ minHeight:36, whiteSpace:"nowrap" }} onClick={()=>{
            const d = prompt("Pilih tanggal (YYYY-MM-DD)", new Date().toISOString().slice(0,10));
            if(d) push({ date: d });
          }}>📅 Tanggal</button>
          <button className="btn" style={{ minHeight:36, whiteSpace:"nowrap" }} onClick={()=>{
            const m = prompt("Pilih bulan (YYYY-MM)", new Date().toISOString().slice(0,7));
            if(m) push({ month: m });
          }}>🗓️ Bulan</button>
        </div>

        {/* Native pickers for mobile */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", marginBottom:4 }}>Pilih tanggal</div>
            <input className="input" type="date" value={initialParams?.date || ""} onChange={e=> e.target.value ? push({ date:e.target.value }) : push({ period:"all" })} style={{ minHeight:44 }} />
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#999", marginBottom:4 }}>Pilih bulan</div>
            <input className="input" type="month" value={initialParams?.month || ""} onChange={e=> e.target.value ? push({ month:e.target.value }) : push({ period:"all" })} style={{ minHeight:44 }} />
          </div>
        </div>

        {/* Custom range tambahan */}
        <details style={{ marginTop:10 }}>
          <summary className="muted" style={{ fontSize:12, cursor:"pointer" }}>Rentang kustom</summary>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
            <input className="input" type="date" defaultValue={initialParams?.from||""} id="fromDate" />
            <input className="input" type="date" defaultValue={initialParams?.to||""} id="toDate" />
          </div>
          <button className="btn accent" style={{ width:"100%", marginTop:8, minHeight:44 }} onClick={()=>{
            const f=(document.getElementById("fromDate") as HTMLInputElement).value;
            const t=(document.getElementById("toDate") as HTMLInputElement).value;
            if(f && t) push({ period:"custom", from:f, to:t } as any);
            else alert("Isi Dari dan Sampai");
          }}>Terapkan rentang</button>
        </details>

        <div className="muted" style={{ fontSize:12, marginTop:10, textAlign:"center" }}>Menampilkan: <b style={{ color:"var(--text)" }}>{activeLabel}</b> • {filtered.length} transaksi</div>
      </div>

      <input className="input" placeholder="Search invoice..." value={filter} onChange={e=>setFilter(e.target.value)} />

      {pagination && pagination.totalPages > 1 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, gap:8 }}>
          <span className="muted" style={{ fontSize:12 }}>Hal {pagination.page}/{pagination.totalPages} • {pagination.total} transaksi</span>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn" style={{ minHeight:36, opacity: pagination.page <= 1 ? .5 : 1 }} disabled={pagination.page <= 1} onClick={()=> push({ page: String(pagination.page - 1) } as any)}>‹ Prev</button>
            <button className="btn" style={{ minHeight:36, opacity: pagination.page >= pagination.totalPages ? .5 : 1 }} disabled={pagination.page >= pagination.totalPages} onClick={()=> push({ page: String(pagination.page + 1) } as any)}>Next ›</button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gap:12, marginTop:12 }}>
        {filtered.map(t=> (
          <button key={t.id} className="card" style={{ padding:16, textAlign:"left", width:"100%" }} onClick={()=>setDetail(t)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <b style={{ fontSize:13, fontVariantNumeric:"tabular-nums" }}>{t.invoice_number}</b>
              <span className={`badge ${t.status==="VOID"?"red":""}`}>{t.status==="VOID"?"Void":"Completed"}</span>
            </div>
            <div className="muted" style={{ fontSize:12, marginTop:4 }}>{new Date(t.created_at).toLocaleDateString("id-ID",{day:"2-digit", month:"short"})} • {new Date(t.created_at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})} • {t.user.name}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
              <div><div className="muted" style={{ fontSize:11 }}>{t.items?.length || 0} items</div><div style={{ fontWeight:800, fontSize:15 }}>{formatRupiah(t.total_revenue)}</div></div>
              <span className="badge" style={{ background:"var(--surface2)", color:"var(--text)" }}>{t.payment_method}</span>
            </div>
            {t.payment_method==="CASH" && t.change_amount!=null && t.status!=="VOID" && <div className="muted" style={{ fontSize:11, marginTop:6 }}>Kembalian {formatRupiah(t.change_amount)}</div>}
          </button>
        ))}
        {!filtered.length && <div className="card" style={{ padding:24, textAlign:"center" }}><span className="muted">Tidak ada transaksi untuk filter ini</span><div style={{ marginTop:8 }}><button className="btn" onClick={()=>push({ period:"all" })}>Lihat semua</button></div></div>}
      </div>

      {/* Detail bottom sheet */}
      {detail && (
        <div className="bottom-sheet" onClick={()=>setDetail(null)}>
          <div className="bottom-sheet-card" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding:"0 16px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h3 style={{ margin:0, fontSize:16 }}>{detail.invoice_number}</h3>
                <button className="btn" onClick={()=>setDetail(null)}>Tutup</button>
              </div>
              <div className="muted" style={{ fontSize:12, marginTop:4 }}>{new Date(detail.created_at).toLocaleString("id-ID")} • {detail.user.name} • {detail.payment_method}</div>

              <div style={{ marginTop:12 }}>
                {detail.items?.map((it:any)=> (
                  <div key={it.id} className="list-row">
                    <div>
                      <div style={{ fontWeight:600, fontSize:13 }}>{it.product_name}</div>
                      <div className="muted" style={{ fontSize:12 }}>{formatRupiah(it.selling_price)} × {it.quantity} • HPP {formatRupiah(it.cost_price)}</div>
                    </div>
                    <b>{formatRupiah(it.revenue)}</b>
                  </div>
                ))}
              </div>

              <div style={{ background:"var(--surface2)", borderRadius:12, padding:12, marginTop:12 }}>
                <div className="list-row" style={{ borderBottom:0, padding:"6px 0" }}><span className="muted">Revenue</span><b>{formatRupiah(detail.total_revenue)}</b></div>
                <div className="list-row" style={{ borderBottom:0, padding:"6px 0" }}><span className="muted">HPP</span><b>{formatRupiah(detail.total_cogs)}</b></div>
                <div className="list-row" style={{ borderBottom:0, padding:"6px 0", fontWeight:700 }}><span>Gross</span><b>{formatRupiah(detail.gross_profit)}</b></div>
                {detail.payment_method==="CASH" && <div className="list-row" style={{ borderBottom:0, padding:"6px 0" }}><span className="muted">Diterima</span><b>{formatRupiah(detail.amount_paid||0)}</b></div>}
                {detail.payment_method==="CASH" && <div className="list-row" style={{ borderBottom:0, padding:"6px 0" }}><span className="muted">Kembalian</span><b style={{ color:"var(--green)" }}>{formatRupiah(detail.change_amount||0)}</b></div>}
              </div>

              {isAdmin && detail.status!=="VOID" && <button className="btn" style={{ width:"100%", marginTop:12, color:"var(--red)", borderColor:"var(--red)" }} onClick={()=>{ setDetail(null); setVoidId(detail.id); }}>Void Transaksi</button>}
            </div>
          </div>
        </div>
      )}

      {voidId && (
        <div className="bottom-sheet" onClick={()=>setVoidId(null)}>
          <div className="bottom-sheet-card" style={{ padding:16 }} onClick={e=>e.stopPropagation()}>
            <h3>Void Transaksi</h3>
            <p className="muted" style={{ fontSize:12 }}>Wajib isi alasan</p>
            <input className="input" placeholder="Alasan..." value={reason} onChange={e=>setReason(e.target.value)} style={{ marginTop:12 }} />
            <div style={{ display:"flex", gap:8, marginTop:12 }}><button className="btn primary" style={{ flex:1, background:"var(--red)", borderColor:"var(--red)" }} onClick={doVoid}>Void</button><button className="btn" onClick={()=>setVoidId(null)}>Batal</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
