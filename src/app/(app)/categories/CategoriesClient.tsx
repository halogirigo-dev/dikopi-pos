"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
export default function CategoriesClient({ categories }: { categories: any[] }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  async function create() {
    if (!name) return;
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    await fetch(url, { method: editing ? "PUT" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ name })});
    location.reload();
  }
  async function del(id: string) {
    if (!confirm("Hapus kategori?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    location.reload();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Categories</h1>
      <Card className="p-4 flex gap-2">
        <Input placeholder="Nama kategori" value={name} onChange={e=>setName(e.target.value)} />
        <Button onClick={create}>{editing ? "Update" : "Tambah"}</Button>
        {editing && <Button variant="outline" onClick={()=>{setEditing(null); setName("");}}>Batal</Button>}
      </Card>
      <div className="grid gap-2">
        {categories.map(c=> (
          <Card key={c.id} className="p-3 flex justify-between items-center">
            <span>{c.name}</span>
            <div className="flex gap-2">
              <button onClick={()=>{setEditing(c); setName(c.name)}} className="text-blue-600 text-sm">Edit</button>
              <button onClick={()=>del(c.id)} className="text-red-600 text-sm">Hapus</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
