import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDateRange } from "@/lib/utils";
import { getCogsHealth, getCogsVariance } from "@/lib/cogs";
import { getFinancialKPI } from "@/lib/finance";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");
  const view = searchParams.get("view") || "health";

  if (view === "variance") {
    const v = await getCogsVariance(10);
    return Response.json(v);
  }

  const { from, to } = getDateRange(period, fromQ || undefined, toQ || undefined);
  const health = await getCogsHealth(period, from, to);
  return Response.json(health);
}
