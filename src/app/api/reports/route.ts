import { getSalesReport, getProductPerformance } from "@/lib/finance";
import { getDateRange } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "thisMonth";
  const fromQ = searchParams.get("from");
  const toQ = searchParams.get("to");
  const { from, to } = getDateRange(period, fromQ || undefined, toQ || undefined);
  const [sales, products] = await Promise.all([
    getSalesReport(from, to),
    getProductPerformance(from, to),
  ]);
  return Response.json({ from, to, sales, products });
}
