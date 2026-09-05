"use client";
import { useState } from "react";

type Slide = { icon: string; title: string; desc: string };

const SLIDES: Slide[] = [
  {
    icon: "👋",
    title: "Selamat datang di DIKOPI POS",
    desc: "Kelola penjualan dan pantau keuangan cafe kamu dengan lebih mudah — tanpa ribet akuntansi.",
  },
  {
    icon: "☕",
    title: "1. Catat Penjualan",
    desc: "POS mencatat setiap transaksi. Data ini jadi dasar hitung omzet, HPP, dan laba otomatis.",
  },
  {
    icon: "📊",
    title: "2. Kelola Keuangan",
    desc: "Catat pengeluaran harian seperti bahan, sewa, listrik. DIKOPI hitung laba bersih untuk kamu.",
  },
  {
    icon: "💰",
    title: "3. Pantau Profit",
    desc: "Lihat omzet, HPP, laba kotor, laba bersih, dan posisi kas — semua ringkas di Dashboard.",
  },
];

export function WelcomeModal({ onSkip, onFinish }: { onSkip: () => void; onFinish: () => void }) {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div style={{ position:"fixed", inset:0, zIndex:70, display:"grid", placeItems:"center", padding:16, background:"rgba(0,0,0,.45)" }}>
      <div className="card" role="dialog" aria-modal="true" aria-label="Selamat datang" style={{ width:"min(420px,100%)", overflow:"hidden" }}>
        <div style={{ padding:"28px 24px 20px", textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:"var(--accent-soft)", color:"var(--accent)", display:"grid", placeItems:"center", fontSize:28, margin:"0 auto 14px" }}>{slide.icon}</div>
          <h2 style={{ fontSize:18, fontWeight:800, lineHeight:"22px", margin:0 }}>{slide.title}</h2>
          <p style={{ fontSize:13, color:"var(--text2)", lineHeight:"18px", margin:"10px 0 0" }}>{slide.desc}</p>
          {/* dots */}
          <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:18 }}>
            {SLIDES.map((_, i)=> (
              <span key={i} style={{ width: i===idx ? 18:6, height:6, borderRadius:999, background: i===idx?"var(--accent)":"var(--border)", transition:"all .2s" }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18 }}>
            <button className="btn" style={{ flex:1, minHeight:44 }} onClick={onSkip}>Lewati</button>
            {!isLast ? (
              <button className="btn accent" style={{ flex:1, minHeight:44 }} onClick={()=>setIdx(i=>i+1)}>Berikutnya →</button>
            ) : (
              <button className="btn accent" style={{ flex:1, minHeight:44 }} onClick={onFinish}>Mulai Jelajahi →</button>
            )}
          </div>
          <div style={{ marginTop:10 }}>
            {idx>0 && <button onClick={()=>setIdx(i=>Math.max(0,i-1))} style={{ fontSize:12, color:"var(--muted)", background:"transparent", border:0 }}>Kembali</button>}
          </div>
        </div>
        <div style={{ background:"var(--surface2)", padding:"10px 16px", textAlign:"center", borderTop:"1px solid var(--border)" }}>
          <span style={{ fontSize:11, color:"var(--muted)" }}>{idx+1} dari {SLIDES.length}</span>
        </div>
      </div>
    </div>
  );
}
