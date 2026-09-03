"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsClient({ initial }: { initial: Record<string,string> }) {
  const [opening, setOpening] = useState(initial.opening_balance || "5000000");
  const [saving, setSaving] = useState(false);

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
        </CardContent>
      </Card>
    </div>
  );
}
