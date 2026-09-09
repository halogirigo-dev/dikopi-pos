"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const nav = [
  { section: "OVERVIEW", items: [{ href: "/dashboard", label: "Dashboard", ico: "◫" }] },
  { section: "SALES", items: [{ href: "/pos", label: "POS", ico: "＋" }, { href: "/transactions", label: "Transactions", ico: "▤" }] },
  { section: "INVENTORY", items: [{ href: "/inventory", label: "Inventory", ico: "▤" }] },
  { section: "FINANCE", items: [{ href: "/expenses", label: "Expenses", ico: "−" }, { href: "/cashflow", label: "Cashflow", ico: "↔" }, { href: "/reports", label: "Profit & Loss", ico: "◒", match: "/reports" }] },
  { section: "REPORTS", items: [{ href: "/reports?view=products", label: "Product Performance", ico: "◉" }] },
  { section: "MASTER", items: [{ href: "/products", label: "Products", ico: "☕" }, { href: "/categories", label: "Categories", ico: "▦" }, { href: "/users", label: "Users", ico: "◐" }] },
];

export default function AppNav({ role, userName }: { role: string; userName: string }) {
  const path = usePathname();
  const isCashier = role === "CASHIER";

  if (isCashier) {
    return (
      <aside className="sidebar" aria-label="Main navigation">
        <div className="logo">DIK<span>O</span>PI</div>
        <div className="section">SALES</div>
        <div className="nav">
          <Link href="/pos" prefetch data-onboarding="nav-pos" className={path.startsWith("/pos") ? "active" : ""} aria-current={path.startsWith("/pos") ? "page" : undefined}>
            <span className="ico">＋</span><span>POS</span>
          </Link>
          <Link href="/transactions" prefetch data-onboarding="nav-transactions" className={path.startsWith("/transactions") ? "active" : ""} aria-current={path.startsWith("/transactions") ? "page" : undefined}>
            <span className="ico">▤</span><span>Transactions</span>
          </Link>
        </div>
        <div className="profile"><div className="avatar">{userName[0]?.toUpperCase()}</div><div><b style={{ fontSize: 12 }}>{userName}</b><div style={{ fontSize: 10, color: "#999" }}>Cashier</div></div><button onClick={() => signOut({ callbackUrl: "/login" })} className="btn" style={{ marginLeft: "auto", padding: "6px 8px", fontSize: 11 }}>Logout</button></div>
      </aside>
    );
  }

  const onboardingMap: Record<string,string> = {
    Dashboard: "nav-dashboard",
    POS: "nav-pos",
    Transactions: "nav-transactions",
    Inventory: "nav-inventory",
    Expenses: "nav-finance",
    Cashflow: "nav-finance",
    "Profit & Loss": "nav-finance",
    "Product Performance": "nav-finance",
    Products: "nav-products",
  };
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="logo">DIK<span>O</span>PI</div>
      {nav.map((g) => (
        <div key={g.section}>
          <div className="section">{g.section}</div>
          <div className="nav">
            {g.items.map((it) => {
              const active = path === it.href || path.startsWith((it as any).match || it.href + "/") || (it.href === "/dashboard" && path === "/dashboard");
              const isProductPerf = it.label === "Product Performance";
              const activePerf = isProductPerf && typeof window !== "undefined" && window.location.search.includes("view=products") && path.startsWith("/reports");
              const navAttr = onboardingMap[it.label];
              const isActive = Boolean(active || activePerf);
              return (
                <Link key={it.href} href={it.href} prefetch data-onboarding={navAttr} className={isActive ? "active" : ""} aria-current={isActive ? "page" : undefined}>
                  <span className="ico">{it.ico}</span><span>{it.label}</span>
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
