import { getFinancialKPI } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "today";
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");
  const { from, to } = getDateRange(period, fromQ || undefined, toQ || undefined);
  const kpi = await getFinancialKPI(from, to);
  return Response.json({ period, from, to, ...kpi });
}
