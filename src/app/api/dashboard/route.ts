import { getFinancialKPI } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");
  const { from, to } = getDateRange(period, fromQ || undefined, toQ || undefined);
  const kpi = await getFinancialKPI(from, to);
  return Response.json({ period, from, to, ...kpi });
}
