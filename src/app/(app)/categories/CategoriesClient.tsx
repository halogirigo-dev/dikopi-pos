"use client";
import { useState } from "react";
export default function CategoriesClient({ categories }: { categories:any[] }){
  const [name,setName]=useState(""); const [editing,setEditing]=useState<any|null>(null);
  async function create(){ if(!name) return; const url=editing?`/api/categories/${editing.id}`:"/api/categories"; await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})}); location.reload(); }
  async function del(id:string){ if(!confirm("Hapus kategori?")) return; await fetch(`/api/categories/${id}`,{method:"DELETE"}); location.reload(); }
  return (
    <div>
      <div className="filters"><input className="input" placeholder="Nama kategori" value={name} onChange={e=>setName(e.target.value)} /><button className="btn accent" onClick={create}>{editing?"Update":"Tambah"}</button>{editing&&<button className="btn" onClick={()=>{setEditing(null);setName("");}}>Batal</button>}</div>
      <div className="card">
        <table className="table"><thead><tr><th>Nama</th><th>Aksi</th></tr></thead><tbody>
          {categories.map((c:any)=><tr key={c.id}><td><b>{c.name}</b></td><td><button className="btn" style={{ marginRight:6 }} onClick={()=>{setEditing(c);setName(c.name);}}>Edit</button><button className="btn" style={{ color:"var(--red)" }} onClick={()=>del(c.id)}>Hapus</button></td></tr>)}
        </tbody></table>
      </div>
    </div>
  );
}
