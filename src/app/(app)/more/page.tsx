import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import MoreLogout from "@/components/mobile/MoreLogout";

const adminLinks = [
  { href:"/products", label:"Products", desc:"Kelola menu & HPP", ico:"☕" },
  { href:"/categories", label:"Categories", desc:"Kategori produk", ico:"▦" },
  { href:"/users", label:"Users", desc:"Kasir & owner", ico:"◐" },
  { href:"/expenses", label:"Expenses", desc:"Catat pengeluaran", ico:"−" },
  { href:"/reports?view=products", label:"Product Performance", desc:"Revenue, HPP, margin", ico:"◉" },
  { href:"/cashflow", label:"Cashflow Detail", desc:"Laporan lengkap", ico:"↔" },
  { href:"/reports", label:"Profit & Loss", desc:"Laporan laba rugi", ico:"◒" },
  { href:"/settings", label:"Settings", desc:"Opening balance", ico:"⚙" },
];

const cashierLinks = [
  { href:"/pos", label:"POS", desc:"Buat transaksi", ico:"＋" },
  { href:"/transactions", label:"Riwayat", desc:"Transaksi saya", ico:"▤" },
];

export default async function MorePage(){
  const session:any = await getServerSession(authOptions);
  const isCashier = session.user.role==="CASHIER";
  const links = isCashier ? cashierLinks : adminLinks;
  return (
    <div style={{ display:"grid", gap:12 }}>
      <div className="card" style={{ padding:16, display:"flex", alignItems:"center", gap:12 }}>
        <div className="avatar">{session.user.name[0]?.toUpperCase()}</div>
        <div><div style={{ fontWeight:700 }}>{session.user.name}</div><div className="muted" style={{ fontSize:12 }}>{session.user.username} • {session.user.role}</div></div>
      </div>
      {links.map(l=> (
        <Link key={l.href} href={l.href} className="card" style={{ padding:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ width:36, height:36, borderRadius:10, background:"var(--surface2)", display:"grid", placeItems:"center" }}>{l.ico}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{l.label}</div>
            <div className="muted" style={{ fontSize:12 }}>{l.desc}</div>
          </div>
          <span className="muted">›</span>
        </Link>
      ))}
      <MoreLogout />
    </div>
  );
}
