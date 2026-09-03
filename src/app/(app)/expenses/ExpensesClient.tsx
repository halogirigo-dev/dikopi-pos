"use client";
import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function ExpensesClient({ categories, expenses }: { categories: any[]; expenses: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category_id: categories[0]?.id || "", description: "", amount: "", payment_method: "CASH", expense_date: new Date().toISOString().slice(0,10), notes: "" });

  async function submit() {
    const res = await fetch("/api/expenses", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ ...form, amount: Number(form.amount) })});
    if (res.ok) location.reload();
    else alert(await res.text());
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Expenses</h1>
        <Button onClick={()=>setShowForm(true)}>+ Expense</Button>
      </div>

      <div className="grid gap-2 lg:hidden">
        {expenses.map(e=> (
          <Card key={e.id} className="p-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{e.description}</span>
              <span className="text-sm font-bold text-red-600">{formatRupiah(e.amount)}</span>
            </div>
            <p className="text-xs text-zinc-500">{e.category.name} • {e.payment_method} • {new Date(e.expense_date).toLocaleDateString("id-ID")} • {e.creator.name}</p>
            {e.notes && <p className="text-xs mt-1">{e.notes}</p>}
          </Card>
        ))}
      </div>

      <div className="hidden lg:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50"><tr><th className="p-3 text-left">Tanggal</th><th className="p-3 text-left">Deskripsi</th><th className="p-3">Kategori</th><th className="p-3">Amount</th><th className="p-3">Payment</th><th className="p-3">Oleh</th></tr></thead>
          <tbody>{expenses.map(e=> (
            <tr key={e.id} className="border-t"><td className="p-3">{new Date(e.expense_date).toLocaleDateString("id-ID")}</td><td className="p-3">{e.description}</td><td className="p-3 text-center">{e.category.name}</td><td className="p-3 text-center text-red-600 font-medium">{formatRupiah(e.amount)}</td><td className="p-3 text-center">{e.payment_method}</td><td className="p-3">{e.creator.name}</td></tr>
          ))}</tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end lg:items-center justify-center p-0 lg:p-4 z-50" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-xl w-full max-w-md p-4 space-y-4" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold">Tambah Expense</h3>
            <div><Label>Kategori</Label><Select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>{categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div><Label>Deskripsi</Label><Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Pembelian susu" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount (Rp)</Label><Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} /></div>
              <div><Label>Payment</Label><Select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}><option>CASH</option><option>QRIS</option><option>DEBIT</option><option>TRANSFER</option></Select></div>
            </div>
            <div><Label>Tanggal</Label><Input type="date" value={form.expense_date} onChange={e=>setForm({...form,expense_date:e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
            <div className="flex gap-2"><Button onClick={submit} className="flex-1">Simpan</Button><Button variant="outline" onClick={()=>setShowForm(false)}>Batal</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
