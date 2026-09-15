"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

type QuickAddProps = {
  categories: { id: string; name: string }[];
};

export default function ExpenseQuickAdd({ categories }: QuickAddProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    category_id: categories.find((c) => c.name !== "Raw Material")?.id || categories[0]?.id || "",
    description: "",
    amount: "",
    payment_method: "CASH",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!form.category_id || !form.description || !(Number(form.amount) > 0)) {
      alert("Lengkapi kategori, deskripsi, dan nominal");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm((f) => ({ ...f, description: "", amount: "", notes: "" }));
      setOpen(false);
      router.refresh();
      window.dispatchEvent(new CustomEvent("dikopi:refresh"));
    } else {
      alert(await res.text());
    }
  }

  const total = Number(form.amount) || 0;

  return (
    <>
      <button className="btn accent" onClick={() => setOpen(true)} style={{ minHeight: 44, fontSize: 13, fontWeight: 700 }}>
        ＋ Catat
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }} onClick={() => setOpen(false)}>
          <div className="card" style={{ padding: 20, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>Catat Pengeluaran Operasional</h3>
            <div className="formgrid">
              <div className="field"><label>Kategori</label>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  {categories.filter((c) => c.name !== "Raw Material").map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="field"><label>Payment</label>
                <select className="input" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                  <option>CASH</option><option>QRIS</option><option>DEBIT</option><option>TRANSFER</option>
                </select>
              </div>
              <div className="field full"><label>Deskripsi</label>
                <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Listrik / Sewa / Gaji / Internet" />
              </div>
              <div className="field full"><label>Amount (Rp)</label>
                <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="500000" />
              </div>
              <div className="field full"><label>Notes</label>
                <input className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opsional" />
              </div>
              {total > 0 && (
                <div className="full" style={{ background: "var(--surface2)", borderRadius: 10, padding: 10, fontSize: 12 }}>
                  Total: <b>{formatRupiah(total)}</b>
                </div>
              )}
              <div className="full" style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className="btn accent" style={{ flex: 1 }} onClick={submit} disabled={submitting}>
                  {submitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button className="btn" onClick={() => setOpen(false)}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
