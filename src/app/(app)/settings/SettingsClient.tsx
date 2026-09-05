"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";

export default function SettingsClient({ initial }: { initial: Record<string,string> }) {
  const [opening, setOpening] = useState(initial.opening_balance || "5000000");
  const [saving, setSaving] = useState(false);
  const { state, setTipsEnabled, resetAll, resetTour } = useOnboarding();

  async function save() {
    setSaving(true);
    await fetch("/api/settings", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ key: "opening_balance", value: opening })});
    setSaving(false);
    alert("Tersimpan");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Opening Balance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Label>Saldo Awal Kas (Rp)</Label>
          <Input type="number" value={opening} onChange={e=>setOpening(e.target.value)} />
          <Button onClick={save} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          <p className="text-xs text-muted-foreground">Dipakai untuk hitung Cash Position: Saldo awal + semua pemasukan - pengeluaran</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Panduan Aplikasi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--surface2)", padding:12, borderRadius:12 }}>
            <div>
              <div style={{ fontWeight:600, fontSize:13 }}>Tampilkan tips</div>
              <div className="muted" style={{ fontSize:11 }}>Matikan jika tidak ingin lihat panduan lagi</div>
            </div>
            <button
              onClick={()=>setTipsEnabled(!state.tipsEnabled)}
              style={{
                width:48, height:28, borderRadius:999, border:"1px solid var(--border)",
                background: state.tipsEnabled ? "var(--accent)" : "var(--surface2)",
                position:"relative", transition:"all .2s"
              }}
              aria-label="Toggle tips"
            >
              <span style={{
                position:"absolute", top:2, left: state.tipsEnabled?22:2, width:22, height:22, borderRadius:"50%", background:"#fff",
                boxShadow:"0 1px 3px rgba(0,0,0,.2)", transition:"all .2s"
              }} />
            </button>
          </div>

          <div style={{ display:"grid", gap:8 }}>
            <Button variant="outline" onClick={()=>{ resetAll(); alert("Panduan di-reset. Reload untuk lihat welcome kembali."); location.reload(); }}>
              🔄 Mulai ulang semua panduan
            </Button>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Button variant="outline" onClick={()=>{ resetTour("nav"); alert("Tour navigasi di-reset"); }} style={{ fontSize:12 }}>Reset Nav Tour</Button>
              <Button variant="outline" onClick={()=>{ resetTour("pos"); alert("Tour POS di-reset"); }} style={{ fontSize:12 }}>Reset POS Tour</Button>
              <Button variant="outline" onClick={()=>{ resetTour("products"); alert("Tour produk di-reset"); }} style={{ fontSize:12 }}>Reset Produk</Button>
              <Button variant="outline" onClick={()=>{ resetTour("dashboard"); alert("Tour dashboard di-reset"); }} style={{ fontSize:12 }}>Reset Dashboard</Button>
              <Button variant="outline" onClick={()=>{ resetTour("expenses"); alert("Tour pengeluaran di-reset"); }} style={{ fontSize:12 }}>Reset Expense</Button>
              <Button variant="outline" onClick={()=>{ resetTour("reports"); alert("Tour laporan di-reset"); }} style={{ fontSize:12 }}>Reset Laporan</Button>
            </div>
            <p className="text-xs text-muted-foreground" style={{ textAlign:"center" }}>Panduan muncul otomatis pertama kali per fitur. Kamu bisa skip kapan saja dengan Esc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
