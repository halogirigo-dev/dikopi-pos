import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppNav from "@/components/dashboard/AppNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="app">
      <AppNav role={session.user.role} userName={session.user.name} />
      <div className="main">
        <header className="topbar">
          <div>
            <div className="page-title">DIKOPI POS</div>
            <div className="date">Financial Monitoring · {session.user.role === "CASHIER" ? `Kasir ${session.user.name}` : "Owner view"}</div>
          </div>
          <div className="actions">
            <span className="muted" style={{ fontSize: 12 }}>{session.user.name} · {session.user.role}</span>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
