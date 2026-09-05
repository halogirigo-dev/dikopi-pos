import { getDateRange } from "@/lib/utils";
import FinanceTabs from "./FinanceTabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import FinanceData from "./FinanceData";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { FeatureTourClient } from "@/components/onboarding/FeatureTourClient";
import { FINANCE_TOUR } from "@/components/onboarding/data";

export default async function FinancePage({ searchParams }: { searchParams: { tab?: string; period?: string }}) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/pos");
  const tab = searchParams.tab || "overview";
  const period = searchParams.period || "thisMonth";

  return (
    <div>
      <RealtimeRefresher tables={["Transaction", "Expense", "CashAdjustment"]} intervalMs={15000} />
      <FinanceTabs tab={tab} period={period} />
      <Suspense fallback={<FinanceSkeleton />}>
        <FinanceData tab={tab} period={period} />
      </Suspense>
      <FeatureTourClient tour={FINANCE_TOUR} />
    </div>
  );
}

function FinanceSkeleton(){
  return <div style={{ display:"grid", gap:12, animation:"pulse 1.2s infinite" }}><div className="card" style={{height:120}}/><div className="card" style={{height:160}}/><style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}`}</style></div>;
}
