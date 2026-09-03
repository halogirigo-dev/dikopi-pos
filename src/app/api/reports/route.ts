import { getSalesReport, getProductPerformance } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "thisMonth";
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");
  const { from, to } = getDateRange(period, fromQ || undefined, toQ || undefined);
  const sales = await getSalesReport(from, to);
  const products = await getProductPerformance(from, to);
  return Response.json({ from, to, sales, products });
}
