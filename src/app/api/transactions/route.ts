import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";
import { computeRecipeCostDetail } from "@/lib/cogs";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const limitRaw = parseInt(searchParams.get("limit") || "20", 10) || 20;
  const limit = Math.min(Math.max(1, limitRaw), 100);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (from && to) where.created_at = { gte: new Date(from), lte: new Date(to) };
  if (session.user.role === "CASHIER") where.user_id = session.user.id;
  // Use pagination to avoid loading thousands of rows; default 20, max 100
  // SECURITY: select safe user fields only - never leak password_hash
  const [data, total] = await Promise.all([
    prisma.transaction.findMany({ where, include: { user: { select: { id: true, name: true, username: true, role: true } }, items: true }, orderBy: { created_at: "desc" }, skip, take: limit }),
    prisma.transaction.count({ where }),
  ]);
  // If client explicitly paginates, return envelope; otherwise maintain backward-compatible array for old callers
  const hasPaginationParams = searchParams.has("page") || searchParams.has("limit");
  if (hasPaginationParams) {
    return Response.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }
  // Backward compat: no pagination params -> return limited array (capped at limit)
  return Response.json(data);
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const { items, payment_method, amount_paid, change_amount } = body as { items: { product_id: string; quantity: number }[]; payment_method: string; amount_paid?: number; change_amount?: number };
  if (!items?.length || !payment_method) return new Response("Missing fields", { status: 400 });

  // fetch products snapshot
  const productIds = items.map(i=>i.product_id);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const map = new Map(products.map(p=>[p.id,p]));

  // ---- Inventory resolution (Product -> Recipe -> InventoryItem) — done
  // BEFORE the line loop so live recipe HPP (C) can be snapshotted per line.
  const recipeItems = await prisma.recipeItem.findMany({
    where: { product_id: { in: productIds } },
    include: { inventory_item: true },
  });
  const recipeByProduct = new Map<string, typeof recipeItems>();
  for (const r of recipeItems) {
    if (!recipeByProduct.has(r.product_id)) recipeByProduct.set(r.product_id, []);
    recipeByProduct.get(r.product_id)!.push(r);
  }

  // Live recipe HPP per product: Σ(ingredient qty × current avg cost), rounded
  // to whole rupiah. NO_RECIPE products cost 0 (warning-only, sale proceeds).
  const liveCostByProduct = new Map<string, { cost: number; unpriced: string[] }>();
  for (const pid of productIds) {
    const recipe = recipeByProduct.get(pid) || [];
    const detail = computeRecipeCostDetail(
      recipe.map((ri: any) => ({
        inventory_item_id: ri.inventory_item_id,
        quantity: ri.quantity,
        inventory_item: ri.inventory_item,
      }))
    );
    liveCostByProduct.set(pid, { cost: detail.total, unpriced: detail.unpriced.map((u: any) => u.name) });
  }

  let totalRevenue = 0, totalCogs = 0;
  const lineItems: any[] = [];
  for (const it of items) {
    const p = map.get(it.product_id);
    if (!p) return new Response(`Product not found ${it.product_id}`, { status: 400 });
    if (!p.is_available) return new Response(`Product not available ${p.name}`, { status: 400 });
    const qty = Number(it.quantity);
    const revenue = p.selling_price * qty;
    // Single source of truth: COGS is the LIVE recipe HPP (C) at sale time,
    // snapshotted into the transaction item. Historical rows are never
    // recomputed. NO_RECIPE -> cogs 0 (stock not deducted, warning kept).
    const liveUnit = liveCostByProduct.get(p.id)?.cost ?? 0;
    const cogs = liveUnit * qty;
    totalRevenue += revenue;
    totalCogs += cogs;
    lineItems.push({
      product_id: p.id,
      product_name: p.name,
      selling_price: p.selling_price,
      cost_price: liveUnit,
      quantity: qty,
      revenue, cogs, gross_profit: revenue - cogs
    });
  }
  const grossProfit = totalRevenue - totalCogs;

  // Validate cash payment with kembalian
  let paid: number | null = null;
  let change: number | null = null;
  if (payment_method === "CASH") {
    if (amount_paid != null) {
      paid = Number(amount_paid);
      if (paid < totalRevenue) return new Response("Uang diterima kurang dari total", { status: 400 });
      change = paid - totalRevenue;
      // if client sent change_amount, verify consistency
      if (change_amount != null && Number(change_amount) !== change) {
        // override to computed to prevent manipulation
        change = paid - totalRevenue;
      }
    } else {
      // auto: consider exact payment if not provided (legacy)
      paid = totalRevenue;
      change = 0;
    }
  } else {
    // non-cash: paid = total, change 0
    paid = totalRevenue;
    change = 0;
  }

  // ---- Inventory consumption (recipes already fetched above) ----
  // Aggregate total consumption per inventory_item_id
  const consumptionMap = new Map<string, { qty: number; unitCost: number; name: string }>();
  for (const it of items) {
    const recipe = recipeByProduct.get(it.product_id) || [];
    const saleQty = Number(it.quantity);
    for (const ri of recipe) {
      if (!ri.inventory_item.is_active) continue;
      const perUnit = Number(ri.quantity);
      const need = perUnit * saleQty;
      const existing = consumptionMap.get(ri.inventory_item_id);
      if (existing) existing.qty += need;
      else consumptionMap.set(ri.inventory_item_id, { qty: need, unitCost: Number(ri.inventory_item.average_cost), name: ri.inventory_item.name });
    }
  }
  // Detect products without recipe — stock will NOT decrease (silent failure before fix)
  const productsWithoutRecipe: { product_id: string; product_name: string }[] = [];
  for (const it of items) {
    const recipe = recipeByProduct.get(it.product_id);
    if (!recipe || recipe.length === 0) {
      const p = map.get(it.product_id);
      productsWithoutRecipe.push({ product_id: it.product_id, product_name: p?.name || it.product_id });
    }
  }
  if (productsWithoutRecipe.length > 0) {
    console.warn(`[transactions] WARNING: ${productsWithoutRecipe.length} product(s) tanpa recipe — stock TIDAK akan berkurang:`, productsWithoutRecipe.map(p=>p.product_name).join(", "));
  }

  // invoice number (reserve before transaction)
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const countToday = await prisma.transaction.count({ where: { created_at: { gte: today, lt: tomorrow } }});
  let invoice = generateInvoiceNumber(new Date(), countToday);

  // Atomic transaction: Transaction + Items + StockMovement + InventoryItem update
  // If inventory consumption fails, entire sale rolls back.
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const tx = await prisma.$transaction(async (txClient) => {
        // Pre-check stock availability inside transaction to prevent race & negative stock
        if (consumptionMap.size > 0) {
          const invIds = Array.from(consumptionMap.keys());
          const invItems = await txClient.inventoryItem.findMany({ where: { id: { in: invIds } } });
          const invMap = new Map(invItems.map(i=>[i.id,i]));
          for (const entry of Array.from(consumptionMap.entries())) {
            const invId = entry[0]; const need = entry[1];
            const inv = invMap.get(invId) as any;
            if (!inv) throw new Error(`Inventory item not found ${invId}`);
            const current = inv.current_stock?.toNumber ? inv.current_stock.toNumber() : Number(inv.current_stock);
            if (current < need.qty) {
              // Business rule: prevent negative stock - rollback entire sale
              throw Object.assign(new Error(`Stok tidak cukup: ${need.name} butuh ${need.qty} ${inv.unit}, sisa ${current} ${inv.unit}`), { code: "INSUFFICIENT_STOCK", details: { inventory_item_id: invId, name: need.name, required: need.qty, available: current, unit: inv.unit } });
            }
          }
        }

      const created = await txClient.transaction.create({
        data: {
          invoice_number: invoice,
          user_id: session.user.id,
          total_revenue: totalRevenue,
          total_cogs: totalCogs,
          gross_profit: grossProfit,
          payment_method: payment_method as any,
          status: "COMPLETED" as any,
          amount_paid: paid,
          change_amount: change,
          items: { create: lineItems }
        }
      });

      // Create stock movements and update current_stock
      for (const entry of Array.from(consumptionMap.entries())) {
        const invId = entry[0]; const need = entry[1];
        await txClient.stockMovement.create({
          data: {
            inventory_item_id: invId,
            type: "SALE_CONSUMPTION",
            quantity: -Math.abs(need.qty),
            unit_cost: need.unitCost || null,
            reference_type: "TRANSACTION",
            reference_id: created.id,
            note: `POS sale ${created.invoice_number}`,
            created_by: session.user.id,
          }
        });
        await txClient.inventoryItem.update({
          where: { id: invId },
          data: { current_stock: { decrement: Math.abs(need.qty) } }
        });
      }
      return created;
    }, { maxWait: 10000, timeout: 15000 });

      try {
        revalidatePath("/dashboard");
        revalidatePath("/finance");
        revalidatePath("/cashflow");
        revalidatePath("/reports");
        revalidatePath("/transactions");
        revalidatePath("/pos");
        revalidatePath("/inventory");
      } catch {}
      // Attach warning so client can show “stock tidak berkurang” reason
      const consumptionSummary = Array.from(consumptionMap.entries()).map(([inventory_item_id, v]) => ({
        inventory_item_id, quantity: v.qty, name: v.name,
      }));
      return Response.json({
        ...tx,
        _stock: {
          consumption: consumptionSummary,
          productsWithoutRecipe,
          stockDeducted: consumptionMap.size > 0,
          message: productsWithoutRecipe.length > 0
            ? `Stock TIDAK berkurang untuk: ${productsWithoutRecipe.map(p=>p.product_name).join(", ")} — recipe belum dikonfigurasi. Atur di Products → Recipe atau Inventory → Resep.`
            : consumptionMap.size > 0 ? `Stock berkurang untuk ${consumptionSummary.length} bahan` : "Tidak ada bahan terkait — cek recipe",
        }
      });
    } catch (e: any) {
      // Insufficient stock thrown inside the interactive transaction. Prisma
      // unwraps the callback error and surfaces it as a plain Error, so the
      // original `.code` may not survive: re-identify by the stable error
      // identity ("Stok tidak cukup") that only the stock pre-check emits.
      // P2037 (transaction timeout/disconnect) is explicitly excluded so a
      // reliability error is never misclassified as insufficient stock.
      if (e?.code !== "P2037" && (e.code === "INSUFFICIENT_STOCK" || /Stok tidak cukup/.test(e?.message || ""))) {
        return Response.json({
          code: "INSUFFICIENT_STOCK",
          error: e.message,
          details: e.details || null,
        }, { status: 409 });
      }
      if (e.code === "P2002") {
        // unique invoice collision: bump invoice, keep same attempt
        invoice = generateInvoiceNumber(new Date(), countToday + attempt + 1);
        continue;
      }
      if (e.code === "P2037") {
        // Under the pgbouncer pooler a long interactive transaction can be
        // detached (pool connection closed / client disconnect) → P2037
        // "Transaction not found". The interactive callback is a pure create
        // (no reads of its own data), so a fresh attempt is safe and
        // duplicate-free: a fully-committed attempt returns 200 and never
        // reaches this catch; only a pre-commit rollback or a P2037 abort
        // lands here, and retrying cannot double-write. Bounded retry (attempts
        // 0-1); on the final attempt the error propagates as a 500 — no loop,
        // no silent success.
        if (attempt < 1) {
          invoice = generateInvoiceNumber(new Date(), countToday + attempt + 1);
          continue;
        }
        throw new Error("Transaction aborted by database pooler (P2037); request not committed");
      }
      throw e;
    }
  }
  return new Response("Failed to create", { status: 500 });
}
