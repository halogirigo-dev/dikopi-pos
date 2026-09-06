import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInventoryOverview } from "@/lib/inventory";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });
  const { searchParams } = new URL(req.url);
  const windowDays = Math.min(Math.max(parseInt(searchParams.get("window") || "30", 10) || 30, 1), 90);
  const overview = await getInventoryOverview(windowDays);
  // Shape forecast explicitly
  return Response.json({
    windowDays: overview.windowDays,
    since: overview.since,
    counts: overview.counts,
    forecast: overview.forecast,
    reorderList: overview.reorderList,
    lowStock: overview.lowStock,
    items: overview.items,
  });
}
