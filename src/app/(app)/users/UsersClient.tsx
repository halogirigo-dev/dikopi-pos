"use client";
import { useState } from "react";
export default function UsersClient({ users }: { users:any[] }){
  const [show,setShow]=useState(false); const [form,setForm]=useState({name:"",username:"",password:"",role:"CASHIER"});
  async function create(){ const res=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)}); if(res.ok) location.reload(); else alert(await res.text()); }
  async function toggle(u:any){ await fetch(`/api/users/${u.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_active:!u.is_active})}); location.reload(); }
  return (
    <div>
      <div className="filters"><button className="btn accent" onClick={()=>setShow(true)}>＋ Add User</button><span className="muted">{users.length} users</span></div>
      <div className="card">
        <table className="table"><thead><tr><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
          {users.map((u:any)=><tr key={u.id}><td><b>{u.name}</b></td><td>{u.username}</td><td>{u.role}</td><td>{u.is_active?<span className="badge">Aktif</span>:<span className="badge red">Nonaktif</span>}</td><td><button className="btn" onClick={()=>toggle(u)}>{u.is_active?"Nonaktifkan":"Aktifkan"}</button></td></tr>)}
        </tbody></table>
      </div>
      {show && <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.4)", display:"grid", placeItems:"center", zIndex:50 }} onClick={()=>setShow(false)}><div className="card" style={{ padding:20, width:400 }} onClick={e=>e.stopPropagation()}><h3>Tambah User</h3><div className="formgrid" style={{ marginTop:12 }}><div className="field"><label>Nama</label><input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div><div className="field"><label>Role</label><select className="input" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option>CASHIER</option><option>ADMIN</option></select></div><div className="field"><label>Username</label><input className="input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} /></div><div className="field"><label>Password</label><input className="input" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div><div className="full" style={{ display:"flex", gap:8 }}><button className="btn accent" style={{ flex:1 }} onClick={create}>Simpan</button><button className="btn" onClick={()=>setShow(false)}>Batal</button></div></div></div></div>}
    </div>
  );
}
