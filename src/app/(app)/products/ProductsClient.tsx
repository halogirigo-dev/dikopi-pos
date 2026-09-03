"use client";
import { useState } from "react";
import { formatRupiah, calcMargin, getMarginStatus } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Product = any;
type Category = { id: string; name: string };

export default function ProductsClient({ categories, products: initial }: { categories: Category[]; products: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", category_id: "", selling_price: "", cost_price: "", is_available: true });
  const [breakdown, setBreakdown] = useState<{name:string,cost:string}[]>([]);
  const [showCalc, setShowCalc] = useState(false);

  const margin = form.selling_price && form.cost_price ? ((Number(form.selling_price)-Number(form.cost_price))/Number(form.selling_price)*100) : 0;
  const status = getMarginStatus(margin);
  const totalHppFromBreakdown = breakdown.reduce((s,b)=> s + (Number(b.cost)||0), 0);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", category_id: categories[0]?.id || "", selling_price: "", cost_price: "", is_available: true });
    setBreakdown([]);
    setShowCalc(false);
    setShowForm(true);
  }
  function openEdit(p: Product) {
    setEditing(p);
    setForm({ name: p.name, category_id: p.category_id, selling_price: String(p.selling_price), cost_price: String(p.cost_price), is_available: p.is_available });
    try { const bd = p.hpp_breakdown ? JSON.parse(p.hpp_breakdown) : []; setBreakdown(bd.map((b:any)=>({name:b.name,cost:String(b.cost)}))); } catch { setBreakdown([]); }
    setShowForm(true);
  }

  async function submit() {
    const payload = {
      name: form.name,
      category_id: form.category_id,
      selling_price: Number(form.selling_price),
      cost_price: Number(form.cost_price),
      hpp_breakdown: breakdown.length ? breakdown.map(b=>({name:b.name,cost:Number(b.cost)})) : null,
      is_available: form.is_available
    };
    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)});
    if (res.ok) location.reload();
    else alert(await res.text());
  }

  async function del(id: string) {
    if (!confirm("Hapus produk?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Products</h1>
        <Button onClick={openCreate}>+ Produk</Button>
      </div>

      {/* Mobile cards vs desktop table */}
      <div className="grid gap-3 lg:hidden">
        {products.map(p=> {
          const m = calcMargin(p.selling_price, p.selling_price - p.cost_price);
          const st = getMarginStatus(m);
          return (
            <Card key={p.id} className="p-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-zinc-500">{p.category.name} • {p.is_available ? "Aktif" : "Nonaktif"}</p>
                  <p className="text-sm mt-1">Jual {formatRupiah(p.selling_price)} • HPP {formatRupiah(p.cost_price)}</p>
                  <p className="text-xs">Profit {formatRupiah(p.selling_price - p.cost_price)}/cup</p>
                </div>
                <span className={`h-fit text-xs px-2 py-1 rounded-full border ${st.color}`}>{st.label} {m.toFixed(1)}%</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" onClick={()=>openEdit(p)} className="flex-1">Edit</Button>
                <Button variant="ghost" size="sm" onClick={()=>del(p.id)} className="text-red-600">Hapus</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="hidden lg:block bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50"><tr><th className="p-3 text-left">Produk</th><th className="p-3">Harga Jual</th><th className="p-3">HPP</th><th className="p-3">Margin</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr></thead>
          <tbody>
            {products.map(p=> {
              const m = calcMargin(p.selling_price, p.selling_price - p.cost_price);
              const st = getMarginStatus(m);
              return (
                <tr key={p.id} className="border-t">
                  <td className="p-3"><p className="font-medium">{p.name}</p><p className="text-xs text-zinc-500">{p.category.name}</p></td>
                  <td className="p-3 text-center">{formatRupiah(p.selling_price)}</td>
                  <td className="p-3 text-center">{formatRupiah(p.cost_price)}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs border ${st.color}`}>{st.label} {m.toFixed(1)}%</span></td>
                  <td className="p-3 text-center">{p.is_available ? "Aktif" : "Nonaktif"}</td>
                  <td className="p-3 text-center"><button onClick={()=>openEdit(p)} className="text-blue-600 mr-2">Edit</button><button onClick={()=>del(p.id)} className="text-red-600">Hapus</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={()=>setShowForm(false)}>
          <div className="bg-white rounded-t-2xl lg:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 space-y-4" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold text-lg">{editing ? "Edit Produk" : "Produk Baru"}</h3>
            <div>
              <Label>Nama Produk</Label>
              <Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}>
                {categories.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Harga Jual (Rp)</Label>
                <Input type="number" inputMode="numeric" value={form.selling_price} onChange={e=>setForm({...form,selling_price:e.target.value})} />
              </div>
              <div>
                <Label>HPP / Cost (Rp)</Label>
                <Input type="number" inputMode="numeric" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})} />
              </div>
            </div>

            {/* HPP Calculator */}
            <div className="border rounded-xl p-3 space-y-3 bg-zinc-50">
              <button type="button" onClick={()=>setShowCalc(!showCalc)} className="w-full flex justify-between items-center text-sm font-medium">
                <span>🧮 Hitung HPP (opsional)</span><span>{showCalc ? "−" : "+"}</span>
              </button>
              {showCalc && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">Tambah komponen untuk hitung HPP otomatis</p>
                  {breakdown.map((b,i)=> (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Nama (Susu 100ml)" value={b.name} onChange={e=>{ const nb=[...breakdown]; nb[i].name=e.target.value; setBreakdown(nb); }} className="flex-1" />
                      <Input placeholder="Biaya" type="number" value={b.cost} onChange={e=>{ const nb=[...breakdown]; nb[i].cost=e.target.value; setBreakdown(nb); }} className="w-28" />
                      <button onClick={()=>setBreakdown(breakdown.filter((_,j)=>j!==i))} className="text-red-600 px-2">×</button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={()=>setBreakdown([...breakdown,{name:"",cost:""}])}>+ Tambah Komponen</Button>
                  {breakdown.length>0 && (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm">Total: {formatRupiah(totalHppFromBreakdown)}</span>
                      <Button size="sm" onClick={()=>setForm({...form,cost_price:String(totalHppFromBreakdown)})}>Pakai sebagai HPP</Button>
                    </div>
                  )}
                </div>
              )}
              {/* Preview */}
              {form.selling_price && form.cost_price && Number(form.selling_price)>0 && (
                <div className="bg-white border rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span>Harga Jual</span><span>{formatRupiah(Number(form.selling_price))}</span></div>
                  <div className="flex justify-between"><span>HPP</span><span>{formatRupiah(Number(form.cost_price))}</span></div>
                  <div className="flex justify-between font-bold"><span>Gross Profit</span><span className={Number(form.cost_price) > Number(form.selling_price) ? "text-red-600" : "text-emerald-600"}>{formatRupiah(Number(form.selling_price)-Number(form.cost_price))}</span></div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs border ${status.color}`}>{status.label} {margin.toFixed(1)}% margin</div>
                  {Number(form.cost_price) > Number(form.selling_price) && <p className="text-xs text-red-600">⚠️ HPP lebih besar dari harga jual (rugi)</p>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_available} onChange={e=>setForm({...form,is_available:e.target.checked})} />
              <Label>Tersedia</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={submit} className="flex-1 h-11">{editing ? "Simpan" : "Buat Produk"}</Button>
              <Button variant="outline" onClick={()=>setShowForm(false)}>Batal</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
