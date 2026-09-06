import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInventoryOverview } from "@/lib/inventory";

export async function GET(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  // CASHIER can see overview but not forecast cost? Keep ADMIN-only for now, but allow CASHIER read low stock status
  const { searchParams } = new URL(req.url);
  const windowDays = Math.min(Math.max(parseInt(searchParams.get("window") || "30", 10) || 30, 1), 90);
  const overview = await getInventoryOverview(windowDays);
  return Response.json(overview);
}
