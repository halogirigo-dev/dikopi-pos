import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TransactionsClient from "./TransactionsClient";
export default async function TransactionsPage() {
  const session: any = await getServerSession(authOptions);
  const where: any = session.user.role === "CASHIER" ? { user_id: session.user.id } : {};
  const txs = await prisma.transaction.findMany({ where, include: { user: true, items: true }, orderBy: { created_at: "desc" }, take: 100 });
  return <TransactionsClient transactions={txs} isAdmin={session.user.role==="ADMIN"} />;
}
