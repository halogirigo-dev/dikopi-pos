import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { Suspense } from "react";
import DashboardData from "./DashboardData";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export default async function DashboardPage({ searchParams }: { searchParams: { period?: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/pos");

  const period = searchParams.period || "today";

  return (
    <div>
      <RealtimeRefresher tables={["Transaction", "TransactionItem", "Expense"]} intervalMs={12000} />
      {/* Header - renders instantly, no DB wait */}
      <div style={{ marginBottom:16 }}>
        <div className="muted" style={{ fontSize:12 }}>{new Date().toLocaleDateString("id-ID",{ weekday:"long", day:"numeric", month:"long", year:"numeric"})}</div>
        <h1 style={{ fontSize:24, fontWeight:800, margin:"4px 0 0", letterSpacing:"-.03em" }}>Halo, {session.user.name} 👋</h1>
        <div className="muted">Ringkasan bisnis hari ini</div>
      </div>

      <DashboardClient period={period} />

      {/* KPI + charts streaming - shell appears instantly, data streams in */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardData period={period} />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton(){
  return (
    <div style={{ display:"grid", gap:12, marginTop:12, animation:"pulse 1.2s infinite" }}>
      <div className="card" style={{ height:120 }} />
      <div className="grid-kpi"><div className="card" style={{height:96}}/><div className="card" style={{height:96}}/><div className="card" style={{height:96}}/><div className="card" style={{height:96}}/></div>
      <div className="card" style={{ height:140 }} />
      <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}`}</style>
    </div>
  );
}
