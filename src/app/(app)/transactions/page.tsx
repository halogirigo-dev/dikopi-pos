import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TransactionsClient from "./TransactionsClient";
import { getDateRange } from "@/lib/utils";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { FeatureTourClient } from "@/components/onboarding/FeatureTourClient";
import { TRANSACTIONS_TOUR } from "@/components/onboarding/data";

export default async function TransactionsPage({ searchParams }: { searchParams: { period?: string; date?: string; month?: string; from?: string; to?: string; page?: string; limit?: string } }) {
  const session: any = await getServerSession(authOptions);
  const baseWhere: any = session.user.role === "CASHIER" ? { user_id: session.user.id } : {};

  let from: Date | null = null;
  let to: Date | null = null;
  let activeLabel = "Semua";

  if (searchParams.date) {
    const d = new Date(searchParams.date);
    if (!isNaN(d.getTime())) {
      from = new Date(d); from.setHours(0,0,0,0);
      to = new Date(d); to.setHours(23,59,59,999);
      activeLabel = new Date(d).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
    }
  } else if (searchParams.month) {
    const m = new Date(searchParams.month + "-01");
    if (!isNaN(m.getTime())) {
      from = new Date(m.getFullYear(), m.getMonth(), 1, 0,0,0,0);
      to = new Date(m.getFullYear(), m.getMonth()+1, 0, 23,59,59,999);
      activeLabel = new Date(m).toLocaleDateString("id-ID", { month:"long", year:"numeric" });
    }
  } else if (searchParams.period && searchParams.period !== "all") {
    if (searchParams.period === "custom" && searchParams.from) {
      const r = getDateRange("custom", searchParams.from, searchParams.to);
      from = r.from; to = r.to;
      activeLabel = `${from.toLocaleDateString("id-ID")} - ${to.toLocaleDateString("id-ID")}`;
    } else {
      const r = getDateRange(searchParams.period);
      from = r.from; to = r.to;
      const labels: Record<string,string> = { today: "Hari ini", thisMonth: "Bulan ini", thisWeek: "Minggu ini", lastMonth: "Bulan lalu", yesterday: "Kemarin" };
      activeLabel = labels[searchParams.period] || searchParams.period;
    }
  } else if (searchParams.from && searchParams.to) {
    const r = getDateRange("custom", searchParams.from, searchParams.to);
    from = r.from; to = r.to;
    activeLabel = `${from.toLocaleDateString("id-ID")} - ${to.toLocaleDateString("id-ID")}`;
  }

  const where: any = { ...baseWhere };
  if (from && to) where.created_at = { gte: from, lte: to };

  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.limit || "20", 10) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const skip = (page - 1) * limit;

  const [txs, total] = await Promise.all([
    prisma.transaction.findMany({ where, include: { user: { select: { id: true, name: true, username: true, role: true } }, items: true }, orderBy: { created_at: "desc" }, skip, take: limit }),
    prisma.transaction.count({ where }),
  ]);
  const pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
  return (
    <>
      <RealtimeRefresher tables={["Transaction", "TransactionItem"]} intervalMs={8000} />
      <TransactionsClient transactions={txs} isAdmin={session.user.role==="ADMIN"} activeLabel={activeLabel} initialParams={searchParams} pagination={pagination as any} />
      <FeatureTourClient tour={TRANSACTIONS_TOUR} />
    </>
  );
}
