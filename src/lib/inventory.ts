import { prisma } from "./prisma";

// Helper to safely parse Decimal to number
function d(v: any): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v.toNumber === "function") return v.toNumber();
  return Number(v);
}

export type StockStatus = "OUT" | "CRITICAL" | "LOW" | "SAFE";

export type RunwayInfo = {
  inventory_item_id: string;
  name: string;
  sku: string | null;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  target_stock: number | null;
  average_cost: number;
  is_active: boolean;
  item_type: "BASE" | "SEMI_FINISH";
  // consumption
  avg_daily_consumption: number;
  avg_daily_cost: number;
  // runway
  runway_days: number | null; // null = no forecast (no consumption)
  stock_status: StockStatus;
  // reorder
  reorder_needed: boolean;
  reorder_quantity: number;
  reorder_cost: number;
  // visual
  bar_pct: number; // 0-100 based on current/target
  run_out_date: Date | null;
  has_forecast: boolean;
  // meta
  days_sampled: number;
  total_consumed_in_window: number;
};

/**
 * CENTRALIZED threshold logic — single source of truth.
 * Must not be duplicated in UI.
 * Spec:
 * OUT: current_stock <= 0
 * CRITICAL: runway_days <= 3
 * LOW: runway_days <= 7 OR current <= minimum
 * SAFE: otherwise
 * If no forecast (runway null) → LOW if current <= minimum else SAFE, unless OUT.
 */
export function getStockStatus(current: number, minimum: number, runwayDays: number | null, avgDaily: number): StockStatus {
  if (current <= 0) return "OUT";
  if (runwayDays != null && runwayDays <= 3) return "CRITICAL";
  if (current <= minimum || (runwayDays != null && runwayDays <= 7)) return "LOW";
  return "SAFE";
}

export function getStockStatusMeta(status: StockStatus): { label: string; labelLong: string; icon: string; color: string; bg: string; barColor: string } {
  switch (status) {
    case "OUT":
      return { label: "OUT", labelLong: "OUT OF STOCK", icon: "⛔", color: "#DC2626", bg: "#FEE2E2", barColor: "#DC2626" };
    case "CRITICAL":
      return { label: "CRITICAL", labelLong: "CRITICAL", icon: "🔴", color: "#DC2626", bg: "#FEE2E2", barColor: "#EF4444" };
    case "LOW":
      return { label: "LOW", labelLong: "LOW", icon: "🟡", color: "#B45309", bg: "#FEF3C7", barColor: "#F59E0B" };
    case "SAFE":
    default:
      return { label: "SAFE", labelLong: "SAFE", icon: "🟢", color: "#15803D", bg: "#DCFCE7", barColor: "#22C55E" };
  }
}

export function formatStockQty(qty: number, unit: string): string {
  // keep 2 decimals but trim trailing zeros
  const s = qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}

export function getRunoutDate(runwayDays: number | null): Date | null {
  if (runwayDays == null) return null;
  const dte = new Date();
  dte.setHours(0, 0, 0, 0);
  dte.setDate(dte.getDate() + Math.ceil(runwayDays));
  return dte;
}

export function formatRunoutDate(dte: Date | null): string {
  if (!dte) return "-";
  return dte.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function getBarPct(current: number, target: number | null, minimum: number, avgDaily: number): number {
  let denom: number | null = target;
  if (denom == null || denom <= 0) {
    // fallback: use minimum*2 as visual target, or avgDaily*14, or current itself
    if (minimum > 0) denom = minimum * 2;
    else if (avgDaily > 0) denom = avgDaily * 14;
    else denom = Math.max(current, 1);
  }
  const pct = denom > 0 ? (current / denom) * 100 : 0;
  return Math.max(0, Math.min(100, pct));
}

/**
 * For a given item row (with Decimal fields), compute runway & reorder info
 * using pre-calculated avgDaily.
 */
export function computeRunwayForItem(
  item: { id: string; name: string; sku: string | null; unit: string; current_stock: any; minimum_stock: any; target_stock: any; average_cost: any; is_active: boolean; item_type?: any },
  avgDaily: number,
  totalConsumed: number,
  windowDays: number
): RunwayInfo {
  const current = d(item.current_stock);
  const minimum = d(item.minimum_stock);
  const target = item.target_stock != null ? d(item.target_stock) : null;
  const avgCost = d(item.average_cost);

  const avgDailyCost = avgDaily * avgCost;
  const has_forecast = avgDaily > 0 && totalConsumed > 0;
  let runwayDays: number | null = null;
  if (has_forecast) runwayDays = current / avgDaily;
  else if (current > 0) runwayDays = null; // no forecast
  else runwayDays = 0;

  const stock_status = getStockStatus(current, minimum, runwayDays, avgDaily);

  // reorder logic: need reorder if below minimum OR runway <= 7 days OR out
  const runwayThreshold = 7;
  const reorder_needed = current <= minimum || (runwayDays != null && runwayDays <= runwayThreshold && avgDaily > 0) || current <= 0;
  let reorder_quantity = 0;
  if (reorder_needed) {
    if (target != null && target > current) reorder_quantity = target - current;
    else if (minimum > 0) reorder_quantity = Math.max(minimum * 2 - current, minimum - current, 0);
    else reorder_quantity = Math.max(avgDaily * 14 - current, 0);
  }
  reorder_quantity = Math.max(0, Math.round(reorder_quantity * 1000) / 1000);
  const reorder_cost = reorder_quantity * avgCost;

  const bar_pct = getBarPct(current, target, minimum, avgDaily);
  const run_out_date = getRunoutDate(runwayDays);

  return {
    inventory_item_id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    current_stock: current,
    minimum_stock: minimum,
    target_stock: target,
    average_cost: avgCost,
    is_active: item.is_active,
    item_type: (item as any).item_type || "BASE",
    avg_daily_consumption: avgDaily,
    avg_daily_cost: avgDailyCost,
    runway_days: runwayDays != null ? Math.round(runwayDays * 10) / 10 : null,
    stock_status,
    reorder_needed,
    reorder_quantity,
    reorder_cost,
    bar_pct: Math.round(bar_pct * 10) / 10,
    run_out_date,
    has_forecast,
    days_sampled: windowDays,
    total_consumed_in_window: totalConsumed,
  };
}

export async function getInventoryOverview(windowDays = 30) {
  const items = await prisma.inventoryItem.findMany({
    where: { is_active: true },
    orderBy: { name: "asc" },
  });

  // Forecast uses 7-day avg fallback to 30-day per spec §18
  const since30 = new Date(); since30.setDate(since30.getDate() - 30); since30.setHours(0, 0, 0, 0);
  const since7 = new Date(); since7.setDate(since7.getDate() - 7); since7.setHours(0, 0, 0, 0);
  const since = new Date(); since.setDate(since.getDate() - windowDays); since.setHours(0, 0, 0, 0);

  const movements30 = await prisma.stockMovement.findMany({
    where: {
      created_at: { gte: since30 },
      type: { in: ["SALE_CONSUMPTION", "WASTE"] },
      inventory_item_id: { in: items.map((i) => i.id) },
    },
    select: { inventory_item_id: true, quantity: true, created_at: true },
  });
  const grouped7 = new Map<string, number>();
  const grouped30 = new Map<string, number>();
  for (const m of movements30) {
    const abs = Math.abs(d(m.quantity));
    grouped30.set(m.inventory_item_id, (grouped30.get(m.inventory_item_id) || 0) + abs);
    if (m.created_at >= since7) grouped7.set(m.inventory_item_id, (grouped7.get(m.inventory_item_id) || 0) + abs);
  }
  // window-specific grouping for UI window selector (keeps bar/valuation window-aware)
  const groupedWindow = new Map<string, number>();
  for (const m of movements30) {
    if (m.created_at >= since) {
      const abs = Math.abs(d(m.quantity));
      groupedWindow.set(m.inventory_item_id, (groupedWindow.get(m.inventory_item_id) || 0) + abs);
    }
  }
  const runwayList: RunwayInfo[] = [];
  for (const item of items) {
    const total30 = grouped30.get(item.id) || 0;
    const total7 = grouped7.get(item.id) || 0;
    // Use 7-day avg if 7-day data exists, else fallback to 30-day avg (§18)
    let avgDaily: number;
    let totalForForecast: number;
    let sampledDays: number;
    if (total7 > 0) { avgDaily = total7 / 7; totalForForecast = total7; sampledDays = 7; }
    else { avgDaily = total30 > 0 ? total30 / 30 : 0; totalForForecast = total30; sampledDays = 30; }
    // For UI display we still keep windowDays for bar/context but forecast uses 7→30 fallback
    runwayList.push(computeRunwayForItem(item, avgDaily, totalForForecast, sampledDays));
  }

  // Sort per spec: OUT → CRITICAL → LOW → SAFE, then lowest runway first
  const statusRank: Record<StockStatus, number> = { OUT: 0, CRITICAL: 1, LOW: 2, SAFE: 3 };
  runwayList.sort((a, b) => {
    const r = statusRank[a.stock_status] - statusRank[b.stock_status];
    if (r !== 0) return r;
    const da = a.runway_days ?? 9999;
    const db = b.runway_days ?? 9999;
    return da - db;
  });

  const counts = {
    total: runwayList.length,
    safe: runwayList.filter((r) => r.stock_status === "SAFE").length,
    low: runwayList.filter((r) => r.stock_status === "LOW").length,
    critical: runwayList.filter((r) => r.stock_status === "CRITICAL").length,
    out: runwayList.filter((r) => r.stock_status === "OUT").length,
    lowAll: runwayList.filter((r) => r.stock_status !== "SAFE").length,
    reorder: runwayList.filter((r) => r.reorder_needed).length,
  };

  const reorderList = runwayList.filter((r) => r.reorder_needed);
  const lowStock = runwayList.filter((r) => r.stock_status !== "SAFE");

  const forecast7 = runwayList.reduce((sum, r) => sum + r.avg_daily_cost * 7, 0);
  const forecast30 = runwayList.reduce((sum, r) => sum + r.avg_daily_cost * 30, 0);
  const immediateReorderCost = reorderList.reduce((sum, r) => sum + r.reorder_cost, 0);

  const purchases = await prisma.stockMovement.findMany({
    where: { type: "PURCHASE", created_at: { gte: since } },
    select: { quantity: true, unit_cost: true },
  });
  let purchaseTotalCost = 0;
  let purchaseTotalQty = 0;
  for (const p of purchases) {
    const q = d(p.quantity);
    const uc = p.unit_cost != null ? d(p.unit_cost) : 0;
    purchaseTotalCost += q * uc;
    purchaseTotalQty += q;
  }

  const totalStockValuation = runwayList.reduce((sum, r) => sum + r.current_stock * r.average_cost, 0);

  return {
    windowDays,
    since,
    items: runwayList,
    counts,
    reorderList,
    lowStock,
    forecast: {
      forecast7,
      forecast30,
      immediateReorderCost,
      purchaseTotalCost,
      purchaseTotalQty,
      totalStockValuation,
    },
  };
}

export function getDepletionSeries(current: number, avgDaily: number, runwayDays: number | null, maxPoints = 7): Array<{ offset: number; stock: number; date: Date }> {
  if (avgDaily <= 0 || runwayDays == null) return [];
  const points: Array<{ offset: number; stock: number; date: Date }> = [];
  const totalDays = Math.max(1, Math.ceil(runwayDays));
  const step = Math.max(1, Math.ceil(totalDays / (maxPoints - 1)));
  for (let d = 0; d <= totalDays; d += step) {
    const stock = Math.max(0, current - avgDaily * d);
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + d);
    points.push({ offset: d, stock, date: dt });
  }
  // ensure last point is exactly run-out if not included
  const last = points[points.length - 1];
  if (last && last.offset !== totalDays) {
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + totalDays);
    points.push({ offset: totalDays, stock: 0, date: dt });
  }
  return points;
}

export async function getDailyConsumptionSeries(inventory_item_id: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);
  const rows = await prisma.$queryRaw<Array<{ date: string; consumed: number }>>`
    SELECT DATE("created_at") as date, COALESCE(SUM(ABS("quantity")),0) as consumed
    FROM "StockMovement"
    WHERE "inventory_item_id" = ${inventory_item_id}
      AND "created_at" >= ${since}
      AND "type" IN ('SALE_CONSUMPTION','WASTE')
    GROUP BY DATE("created_at")
    ORDER BY DATE("created_at") ASC
  `;
  const map = new Map<string, number>(rows.map((r) => [String(r.date).slice(0, 10), Number(r.consumed)]));
  const series: Array<{ date: string; consumed: number }> = [];
  for (let i = 0; i < days; i++) {
    const dte = new Date(since);
    dte.setDate(since.getDate() + i);
    const key = dte.toISOString().slice(0, 10);
    series.push({ date: key, consumed: map.get(key) || 0 });
  }
  return series;
}

// Legacy helper kept for compatibility — avoid using in new UI; shows proper empty handling instead
export function formatRunway(runway: number | null): string {
  if (runway == null) return "No forecast yet";
  if (runway < 0) return "0 days";
  if (runway < 1) return "<1 day";
  return `${runway.toFixed(1)} days`;
}
