import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventoryOverview } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InventoryPage({ searchParams }: { searchParams: { window?: string } }) {
  const session: any = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/pos");
  const windowDays = Math.min(Math.max(parseInt(searchParams.window || "7", 10) || 7, 7), 90);
  const overview = await getInventoryOverview(windowDays);
  // Fetch products for recipe editor and inventory items raw for quick stock view
  const [products] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
  ]);
  // Serialize for RSC -> Client (Dates -> ISO string, Decimals already numbers)
  const serializeItems = (arr: any[]) => arr.map((it: any) => ({
    ...it,
    run_out_date: it.run_out_date ? (it.run_out_date as Date).toISOString() : null,
  }));
  const serializedOverview = {
    ...overview,
    since: overview.since ? (overview.since as Date).toISOString() : null,
    items: serializeItems(overview.items as any),
    reorderList: serializeItems(overview.reorderList as any),
    lowStock: serializeItems(overview.lowStock as any),
  };
  return <InventoryClient initialOverview={serializedOverview} products={products} windowDays={windowDays} />;
}
