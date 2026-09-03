"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { section: "OVERVIEW", items: [{ href: "/dashboard", label: "Dashboard", ico: "◫" }] },
  { section: "SALES", items: [{ href: "/pos", label: "POS", ico: "＋" }, { href: "/transactions", label: "Transactions", ico: "▤" }] },
  { section: "FINANCE", items: [{ href: "/expenses", label: "Expenses", ico: "−" }, { href: "/cashflow", label: "Cashflow", ico: "↔" }, { href: "/reports", label: "Profit & Loss", ico: "◒", match: "/reports" }] },
  { section: "REPORTS", items: [{ href: "/reports?view=products", label: "Product Performance", ico: "◉" }] },
  { section: "MASTER", items: [{ href: "/products", label: "Products", ico: "☕" }, { href: "/categories", label: "Categories", ico: "▦" }, { href: "/users", label: "Users", ico: "◐" }] },
];

export default function AppNav({ role, userName }: { role: string; userName: string }) {
  const path = usePathname();
  const isCashier = role === "CASHIER";

  // Cashier simplified sidebar
  if (isCashier) {
    return (
      <aside className="sidebar">
        <div className="logo">DIK<span>O</span>PI</div>
        <div className="section">SALES</div>
        <div className="nav">
          <Link href="/pos" className={path.startsWith("/pos") ? "active" : ""} style={{ display: "flex", width: "100%", textDecoration: "none" }}>
            <button className={path.startsWith("/pos") ? "active" : ""} style={{ width: "100%" }}><span className="ico">＋</span><span>POS</span></button>
          </Link>
          <Link href="/transactions" className={path.startsWith("/transactions") ? "active" : ""} style={{ display: "flex", width: "100%", textDecoration: "none" }}>
            <button className={path.startsWith("/transactions") ? "active" : ""} style={{ width: "100%" }}><span className="ico">▤</span><span>Transactions</span></button>
          </Link>
        </div>
        <div className="profile"><div className="avatar">{userName[0]?.toUpperCase()}</div><div><b style={{ fontSize: 12 }}>{userName}</b><div style={{ fontSize: 10, color: "#999" }}>Cashier</div></div><button onClick={() => signOut({ callbackUrl: "/login" })} className="btn" style={{ marginLeft: "auto", padding: "6px 8px", fontSize: 11 }}>Logout</button></div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="logo">DIK<span>O</span>PI</div>
      {nav.map((g) => (
        <div key={g.section}>
          <div className="section">{g.section}</div>
          <div className="nav">
            {g.items.map((it) => {
              const active = path === it.href || path.startsWith((it as any).match || it.href + "/") || (it.href === "/dashboard" && path === "/dashboard");
              // handle reports?view special: highlight Product Performance when ?view=products
              const isProductPerf = it.label === "Product Performance";
              const activePerf = isProductPerf && typeof window !== "undefined" && window.location.search.includes("view=products") && path.startsWith("/reports");
              return (
                <Link key={it.href} href={it.href} style={{ textDecoration: "none" }}>
                  <button className={active || activePerf ? "active" : ""}><span className="ico">{it.ico}</span><span>{it.label}</span></button>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      <div className="profile"><div className="avatar">{userName[0]?.toUpperCase()}</div><div><b style={{ fontSize: 12 }}>{userName}</b><div style={{ fontSize: 10, color: "#999" }}>{role}</div></div><button onClick={() => signOut({ callbackUrl: "/login" })} className="btn" style={{ marginLeft: "auto", padding: "6px 8px", fontSize: 11 }}>Logout</button></div>
    </aside>
  );
}
