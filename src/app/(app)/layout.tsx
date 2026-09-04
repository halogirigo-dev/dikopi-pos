import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppNav from "@/components/dashboard/AppNav";
import BottomNav from "@/components/mobile/BottomNav";
import RouteProgress from "@/components/mobile/RouteProgress";
import { Suspense } from "react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="app">
      <AppNav role={session.user.role} userName={session.user.name} />
      <div className="main">
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <header className="topbar">
          <div>
            <div className="page-title">DIKOPI</div>
            <div className="date">{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
          </div>
          <div className="actions">
            <span className="muted" style={{ fontSize: 11, background: "var(--surface2)", padding: "6px 10px", borderRadius: 999 }}>{session.user.role}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
      <BottomNav role={session.user.role} />
    </div>
  );
}
