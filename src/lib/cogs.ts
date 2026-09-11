import { prisma } from "./prisma";

function d(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export type CogsVariance = {
  product_id: string;
  product_name: string;
  category_name: string;
  stored_cost: number;
  recipe_cost: number;
  overhead_cost: number;
  total_recipe_cost: number;
  diff: number;
  diffPct: number | null;
  has_recipe: boolean;
  recipe_items: Array<{ inventory_item_id: string; name: string; unit: string; quantity: number; average_cost: number; cost: number }>;
  status: "OK" | "DRIFT" | "NO_RECIPE" | "NO_STOCK_COST";
};

export function computeRecipeCost(
  recipeItems: Array<{ quantity: any; inventory_item: { average_cost: any } }>
): number {
  let sum = 0;
  for (const ri of recipeItems) {
    const qty = d(ri.quantity);
    const avg = d(ri.inventory_item.average_cost);
    sum += qty * avg;
  }
  return Math.round(sum);
}

function parseOverhead(hpp_breakdown: any): number {
  if (!hpp_breakdown) return 0;
  try {
    const arr = typeof hpp_breakdown === "string" ? JSON.parse(hpp_breakdown) : hpp_breakdown;
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((s: number, b: any) => s + (Number(b.cost) || 0), 0);
  } catch {
    return 0;
  }
}

export async function getCogsVariance(thresholdPct = 10): Promise<{
  items: CogsVariance[];
  counts: { total: number; ok: number; drift: number; noRecipe: number };
  driftTotalDiff: number;
}> {
  const products = await prisma.product.findMany({
    include: { category: true, recipeItems: { include: { inventory_item: true } } },
    orderBy: { name: "asc" },
  });

  const items: CogsVariance[] = [];
  for (const p of products) {
    const recipeCost = computeRecipeCost(p.recipeItems as any);
    const overhead = 0; // overhead is part of stored_cost, not auto; we compare stored vs pure recipe
    // For variance, compare stored_cost vs recipe_cost (when recipe exists)
    // If product has no recipe, status NO_RECIPE
    const hasRecipe = p.recipeItems.length > 0;
    const hasStockCost = hasRecipe ? p.recipeItems.every((ri: any) => d(ri.inventory_item.average_cost) > 0) : false;

    let status: CogsVariance["status"] = "OK";
    let diff = 0;
    let diffPct: number | null = null;

    if (!hasRecipe) {
      status = "NO_RECIPE";
    } else if (!hasStockCost && recipeCost === 0) {
      status = "NO_STOCK_COST";
    } else {
      diff = p.cost_price - recipeCost;
      diffPct = recipeCost > 0 ? (diff / recipeCost) * 100 : null;
      const absPct = diffPct != null ? Math.abs(diffPct) : 0;
      // Also check relative to stored_cost for UI stability when recipeCost small
      const altPct = p.cost_price > 0 ? Math.abs(diff / p.cost_price) * 100 : absPct;
      const usePct = Math.min(absPct, altPct);
      // If either representation exceeds threshold -> drift
      if (recipeCost > 0 && (Math.abs(diffPct!) > thresholdPct || usePct > thresholdPct)) {
        status = "DRIFT";
      } else if (recipeCost === 0 && p.cost_price > 0) {
        status = "DRIFT";
      }
    }

    const recipe_items = p.recipeItems.map((ri: any) => ({
      inventory_item_id: ri.inventory_item_id,
      name: ri.inventory_item.name,
      unit: ri.inventory_item.unit,
      quantity: d(ri.quantity),
      average_cost: d(ri.inventory_item.average_cost),
      cost: d(ri.quantity) * d(ri.inventory_item.average_cost),
    }));

    items.push({
      product_id: p.id,
      product_name: p.name,
      category_name: p.category.name,
      stored_cost: p.cost_price,
      recipe_cost: recipeCost,
      overhead_cost: parseOverhead(p.hpp_breakdown),
      total_recipe_cost: recipeCost,
      diff,
      diffPct,
      has_recipe: hasRecipe,
      recipe_items,
      status,
    });
  }

  // Sort drift first, then no recipe, then ok
  const rank: Record<string, number> = { DRIFT: 0, NO_RECIPE: 1, NO_STOCK_COST: 2, OK: 3 };
  items.sort((a, b) => rank[a.status] - rank[b.status] || Math.abs(b.diff) - Math.abs(a.diff));

  const counts = {
    total: items.length,
    ok: items.filter((i) => i.status === "OK").length,
    drift: items.filter((i) => i.status === "DRIFT").length,
    noRecipe: items.filter((i) => i.status === "NO_RECIPE").length,
  };
  const driftTotalDiff = items.filter((i) => i.status === "DRIFT").reduce((s, i) => s + Math.abs(i.diff), 0);

  return { items, counts, driftTotalDiff };
}

export async function getCogsByCategory(from: Date, to: Date) {
  const rows = await prisma.$queryRaw<
    Array<{ category: string; revenue: bigint; hpp: bigint; gross: bigint; sold: bigint }>
  >`
    SELECT
      c."name" as category,
      COALESCE(SUM(ti."revenue"),0)::bigint as revenue,
      COALESCE(SUM(ti."cogs"),0)::bigint as hpp,
      COALESCE(SUM(ti."gross_profit"),0)::bigint as gross,
      COALESCE(SUM(ti."quantity"),0)::bigint as sold
    FROM "TransactionItem" ti
    JOIN "Transaction" t ON t."id" = ti."transaction_id"
    JOIN "Product" p ON p."id" = ti."product_id"
    JOIN "Category" c ON c."id" = p."category_id"
    WHERE t."created_at" >= ${from} AND t."created_at" <= ${to} AND t."status" = 'COMPLETED'
    GROUP BY c."name"
    ORDER BY revenue DESC
  `;
  return rows.map((r) => {
    const revenue = Number(r.revenue);
    const hpp = Number(r.hpp);
    const gross = Number(r.gross);
    return {
      category: r.category,
      revenue,
      hpp,
      gross,
      sold: Number(r.sold),
      hppRatio: revenue ? (hpp / revenue) * 100 : 0,
      margin: revenue ? (gross / revenue) * 100 : 0,
    };
  });
}

export async function getCogsHealth(period: string, from: Date, to: Date) {
  const { getFinancialKPI, getSalesReport, getProductPerformance } = await import("./finance");
  const [kpi, sales, topProducts, variance, byCategory] = await Promise.all([
    getFinancialKPI(from, to),
    getSalesReport(from, to),
    getProductPerformance(from, to),
    getCogsVariance(10).catch(() => ({ items: [], counts: { total: 0, ok: 0, drift: 0, noRecipe: 0 }, driftTotalDiff: 0 })),
    getCogsByCategory(from, to).catch(() => []),
  ]);

  const hppRatio = kpi.revenue ? (kpi.hpp / kpi.revenue) * 100 : 0;
  const health: "Sehat" | "Cukup" | "Tipis" | "-" =
    kpi.revenue === 0 ? "-" : hppRatio <= 35 ? "Sehat" : hppRatio <= 50 ? "Cukup" : "Tipis";

  // top HPP contributors (by hpp, not revenue)
  const topByHpp = [...topProducts].sort((a, b) => b.hpp - a.hpp).slice(0, 5);

  return {
    period,
    from,
    to,
    kpi,
    hppRatio,
    health,
    sales,
    topProducts,
    topByHpp,
    variance,
    byCategory,
  };
}
