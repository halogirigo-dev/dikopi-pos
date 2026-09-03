"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function UsersClient({ users }: { users: any[] }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "CASHIER" });

  async function create() {
    const res = await fetch("/api/users", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form)});
    if (res.ok) location.reload();
    else alert(await res.text());
  }
  async function toggleActive(u: any) {
    await fetch(`/api/users/${u.id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ is_active: !u.is_active })});
    location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h1 className="text-xl font-bold">Users</h1><Button onClick={()=>setShow(true)}>+ User</Button></div>
      <div className="grid gap-2">
        {users.map(u=> (
          <Card key={u.id} className="p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{u.name} <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded">{u.role}</span></p>
              <p className="text-xs text-zinc-500">{u.username} • {u.is_active ? "Aktif" : "Nonaktif"}</p>
            </div>
            <button onClick={()=>toggleActive(u)} className={`text-sm px-3 py-1 rounded-full border ${u.is_active ? "text-red-600":"text-emerald-600"}`}>{u.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
          </Card>
        ))}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-xl p-4 w-full max-w-sm space-y-3" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold">Tambah User</h3>
            <div><Label>Nama</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><Label>Username</Label><Input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /></div>
            <div><Label>Password</Label><Input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
            <div><Label>Role</Label><Select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="CASHIER">CASHIER</option><option value="ADMIN">ADMIN</option></Select></div>
            <div className="flex gap-2"><Button onClick={create} className="flex-1">Simpan</Button><Button variant="outline" onClick={()=>setShow(false)}>Batal</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
