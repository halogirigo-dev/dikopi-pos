import { prisma } from "./prisma";

function d(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export type RecipeCostDetail = {
  total: number; // live HPP per unit of product, whole rupiah
  hasUnpriced: boolean;
  unpriced: Array<{ inventory_item_id: string; name: string; unit: string; quantity: number }>;
};

/**
 * Live recipe HPP = Σ(ingredient quantity × current inventory average cost).
 * Ingredients whose average_cost is 0/missing are NOT silently zeroed —
 * they are reported in `unpriced` so the UI can flag them explicitly.
 */
export function computeRecipeCostDetail(
  recipeItems: Array<{ inventory_item_id: string; quantity: any; inventory_item: { average_cost: any; name?: string; unit?: string } }>
): RecipeCostDetail {
  let sum = 0;
  const unpriced: RecipeCostDetail["unpriced"] = [];
  for (const ri of recipeItems) {
    const qty = d(ri.quantity);
    const avg = d(ri.inventory_item.average_cost);
    if (avg > 0) {
      sum += qty * avg;
    } else if (qty > 0) {
      unpriced.push({
        inventory_item_id: ri.inventory_item_id,
        name: ri.inventory_item.name || ri.inventory_item_id,
        unit: ri.inventory_item.unit || "",
        quantity: qty,
      });
    }
  }
  return { total: Math.round(sum), hasUnpriced: unpriced.length > 0, unpriced };
}

export function computeRecipeCost(
  recipeItems: Array<{ inventory_item_id: string; quantity: any; inventory_item: { average_cost: any } }>
): number {
  return computeRecipeCostDetail(recipeItems).total;
}

export type CogsVariance = {
  product_id: string;
  product_name: string;
  category_name: string;
  recipe_cost: number;
  hasUnpriced: boolean;
  unpriced: Array<{ inventory_item_id: string; name: string; unit: string; quantity: number }>;
  recipe_items: Array<{ inventory_item_id: string; name: string; unit: string; quantity: number; average_cost: number; cost: number; unpriced: boolean }>;
  has_recipe: boolean;
  status: "OK" | "NO_RECIPE" | "NO_STOCK_COST";
};

export async function getCogsVariance(): Promise<{
  items: CogsVariance[];
  counts: { total: number; ok: number; noRecipe: number; noCost: number };
}> {
  const products = await prisma.product.findMany({
    include: { category: true, recipeItems: { include: { inventory_item: true } } },
    orderBy: { name: "asc" },
  });

  const items: CogsVariance[] = [];
  for (const p of products) {
    const recipeItems = p.recipeItems as any[];
    const detail = computeRecipeCostDetail(
      recipeItems.map((ri) => ({
        inventory_item_id: ri.inventory_item_id,
        quantity: ri.quantity,
        inventory_item: ri.inventory_item,
      }))
    );
    const hasRecipe = recipeItems.length > 0;
    const allPriced = hasRecipe && !detail.hasUnpriced;

    let status: CogsVariance["status"];
    if (!hasRecipe) status = "NO_RECIPE";
    else if (allPriced && detail.total > 0) status = "OK";
    else if (allPriced && detail.total === 0) status = "NO_STOCK_COST";
    else status = "NO_STOCK_COST"; // recipe exists but some ingredients have no cost

    const recipe_rows = recipeItems.map((ri: any) => {
      const avg = d(ri.inventory_item.average_cost);
      const qty = d(ri.quantity);
      return {
        inventory_item_id: ri.inventory_item_id,
        name: ri.inventory_item.name,
        unit: ri.inventory_item.unit,
        quantity: qty,
        average_cost: avg,
        cost: Math.round(qty * avg * 100) / 100,
        unpriced: qty > 0 && avg <= 0,
      };
    });

    items.push({
      product_id: p.id,
      product_name: p.name,
      category_name: p.category.name,
      recipe_cost: detail.total,
      hasUnpriced: detail.hasUnpriced,
      unpriced: detail.unpriced,
      recipe_items: recipe_rows,
      has_recipe: hasRecipe,
      status,
    });
  }

  // No-recipe first, then partially priced, then fully priced
  const rank: Record<string, number> = { NO_RECIPE: 0, NO_STOCK_COST: 1, OK: 2 };
  items.sort((a, b) => rank[a.status] - rank[b.status] || a.product_name.localeCompare(b.product_name));

  const counts = {
    total: items.length,
    ok: items.filter((i) => i.status === "OK").length,
    noRecipe: items.filter((i) => i.status === "NO_RECIPE").length,
    noCost: items.filter((i) => i.status === "NO_STOCK_COST").length,
  };

  return { items, counts };
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
    getCogsVariance().catch(() => ({ items: [], counts: { total: 0, ok: 0, noRecipe: 0, noCost: 0 } })),
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
