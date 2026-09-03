"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className={cn("px-3 py-2 rounded-lg text-sm font-medium transition-colors", active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100")}>
      {label}
    </Link>
  );
}

export default function AppNav({ role, userName }: { role: string; userName: string }) {
  const path = usePathname();
  const isCashier = role === "CASHIER";

  // Cashier mobile bottom nav minimal
  if (isCashier) {
    return (
      <>
        <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between">
          <span className="font-bold">DIKOPI <span className="font-normal text-zinc-500 text-sm">Kasir • {userName}</span></span>
          <button onClick={()=>signOut({callbackUrl:"/login"})} className="text-sm text-zinc-600">Logout</button>
        </header>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-40 lg:hidden">
          <Link href="/pos" className={cn("flex flex-col items-center text-xs px-4 py-1 rounded-lg", path.startsWith("/pos") ? "text-zinc-900 font-semibold" : "text-zinc-500")}>
            <span className="text-lg">🛒</span> POS
          </Link>
          <Link href="/transactions" className={cn("flex flex-col items-center text-xs px-4 py-1 rounded-lg", path.startsWith("/transactions") ? "text-zinc-900 font-semibold" : "text-zinc-500")}>
            <span className="text-lg">📋</span> Riwayat
          </Link>
          <Link href="/pos" onClick={(e)=>{}} className="flex flex-col items-center text-xs text-zinc-500 px-4 py-1">
            <span className="text-lg">👤</span> {userName}
          </Link>
        </nav>
      </>
    );
  }

  // Admin
  const adminLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/pos", label: "POS" },
    { href: "/transactions", label: "Transaksi" },
    { href: "/expenses", label: "Expenses" },
    { href: "/cashflow", label: "Cashflow" },
    { href: "/reports", label: "Reports" },
    { href: "/products", label: "Products" },
    { href: "/categories", label: "Categories" },
    { href: "/users", label: "Users" },
  ];

  return (
    <>
      {/* Mobile top + bottom */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between lg:pl-72">
        <span className="font-bold">DIKOPI <span className="text-zinc-400 text-xs ml-1">ADMIN</span></span>
        <span className="text-sm text-zinc-600 hidden sm:block">{userName} • {role}</span>
        <button onClick={()=>signOut({callbackUrl:"/login"})} className="text-sm border px-3 py-1 rounded-lg">Logout</button>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r flex-col p-4 gap-1 overflow-y-auto">
        <div className="font-bold text-lg mb-4 px-2">DIKOPI <span className="text-xs font-normal text-zinc-500">POS & Finance</span></div>
        {adminLinks.map(l=> (
          <Link key={l.href} href={l.href} className={cn("px-3 py-2 rounded-lg text-sm", path===l.href || path.startsWith(l.href+"/") ? "bg-zinc-900 text-white" : "hover:bg-zinc-100 text-zinc-700")}>{l.label}</Link>
        ))}
        <div className="mt-auto pt-4 border-t text-xs text-zinc-400 px-2">
          <p>Cashier login: kasir1 / password123</p>
        </div>
      </aside>

      {/* Mobile bottom for admin */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 z-40 lg:hidden overflow-x-auto scrollbar-none">
        <Link href="/dashboard" className={cn("flex flex-col items-center text-[11px] px-2", path==="/dashboard" ? "text-zinc-900 font-bold" : "text-zinc-500")}>📊 Dashboard</Link>
        <Link href="/pos" className={cn("flex flex-col items-center text-[11px] px-2", path.startsWith("/pos") ? "text-zinc-900 font-bold" : "text-zinc-500")}>🛒 POS</Link>
        <Link href="/transactions" className={cn("flex flex-col items-center text-[11px] px-2", path.startsWith("/transactions") ? "text-zinc-900 font-bold" : "text-zinc-500")}>📋 Transaksi</Link>
        <Link href="/reports" className={cn("flex flex-col items-center text-[11px] px-2", path.startsWith("/reports") ? "text-zinc-900 font-bold" : "text-zinc-500")}>📈 Report</Link>
        <Link href="/products" className={cn("flex flex-col items-center text-[11px] px-2", path.startsWith("/products") ? "text-zinc-900 font-bold" : "text-zinc-500")}>📦 Master</Link>
      </nav>
    </>
  );
}
