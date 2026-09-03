"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home", ico: "◫", match: "/dashboard" },
  { href: "/pos", label: "POS", ico: "＋", cta: true },
  { href: "/transactions", label: "Transaksi", ico: "▤" },
  { href: "/finance", label: "Finance", ico: "◒" },
  { href: "/more", label: "More", ico: "☰" },
];

export default function BottomNav({ role }: { role: string }) {
  const path = usePathname();
  const isCashier = role === "CASHIER";
  const navItems = isCashier
    ? [
        { href: "/pos", label: "POS", ico: "＋", cta: true },
        { href: "/transactions", label: "Riwayat", ico: "▤" },
        { href: "/more", label: "Akun", ico: "☰" },
      ]
    : items;

  return (
    <nav className="bottom-nav">
      {navItems.map((it) => {
        const active = path === it.href || path.startsWith(it.href + "/") || (it.href === "/finance" && path.startsWith("/finance"));
        if ((it as any).cta) {
          return (
            <Link key={it.href} href={it.href} className={`pos-cta ${active ? "active" : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 64 }}>
              <span className="ico" style={{ fontSize: 20 }}>{it.ico}</span>
              <span style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</span>
            </Link>
          );
        }
        return (
          <Link key={it.href} href={it.href} className={active ? "active" : ""}>
            <span className="ico">{it.ico}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
