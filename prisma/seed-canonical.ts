/**
 * CANONICAL PRODUCTION MENU (Dikopi POS)
 * ======================================
 * Builds the 13-product canonical café menu on top of the existing master /
 * sim-fixture data, replacing the stale production menu.
 *
 * Design contract (mirrors prisma/seed-master.ts conventions so the two seeds
 * coexist on one dev DB):
 *
 *   - Reuses existing inventory items by canonical ingredient name where one
 *     already exists (Milk -> Fresh Milk, Espresso -> Espresso Shot, etc.).
 *     Never creates a duplicate just because the menu uses a shorter name.
 *   - Creates only the ingredients the new menu actually needs. Each NEW item
 *     gets a single OPENING stock movement when first created, so the ledger
 *     invariant (current_stock == Σ movements) stays true. Existing (sim-owned)
 *     items are NEVER re-stocked or re-costed here.
 *   - Water is intentionally UNTRACKED (not an inventory item) — see the
 *     existing "untracked-water policy" in prisma/seed-refresh-products.ts and
 *     docs/e2e-simulation-spec.md §2.2. Canonical recipes that list Water omit
 *     it from RecipeItem rows (Water appears nowhere in stock/costing).
 *   - Espresso costing reuses the existing SEMI_FINISH "Espresso Shot" (blended
 *     from Arabica+Robusta via the /inventory/produce route). The canonical
 *     `Espresso` recipe references Espresso Shot — never a made-up "Espresso"
 *     ingredient.
 *   - Product.cost_price and Product.hpp_breakdown are CLEARED (manual HPP
 *     sources are retired; HPP is derived live = Σ qty × avg_cost).
 *
 * LOCKED E2E BASELINE — must not be touched:
 *   npm run seed:simulation (prisma/seed-simulation.ts) builds a deterministic
 *   62/62 fixture owned by these 6 product names + 9 inventory items.
 *   sim/run.ts asserts against those rows on the CURRENT db state BEFORE any
 *   reset, and sim:reset deletes+recreates rows by those exact names.
 *   Three canonical names collide with the fixture by exact name:
 *     "Iced Americano", "Cappuccino", "Dikopispace".
 *   Overwriting them breaks sim step 4 (revenue) / step 7 (live COGS) and so
 *   would regress the 62/62 baseline. They are therefore SKIPPED (left as the
 *   fixture owns them) and reported as a documented, name-collision exception.
 *   This is the "explicitly documented reason otherwise" of OLD MENU.
 *
 * Historical TransactionItem data is preserved by construction: products are
 * only is_available=false'd (never deleted), and recipe items reference
 * inventory items that are never deleted (Restrict FK). No historical rows
 * exist in this dev DB, but the invariant holds for any that do.
 *
 * Usage: npx tsx prisma/seed-canonical.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Ing = {
  name: string; sku: string; unit: string;
  stock: number; avg: number; min: number; target: number;
  item_type?: "BASE" | "SEMI_FINISH";
};

/**
 * Canonical ingredient library.
 * Reused (already-exist) items are listed too, so the seed's bookkeeping
 * (min/target refresh) is idempotent — but stock & average_cost are left
 * untouched on existing rows per the ledger-ownership rule.
 */
const INGREDIENTS: Ing[] = [
  // --- reused from sim fixture / master (do NOT override stock/avg) ---
  { name: "Espresso Shot",      sku: "DRINK-ESP-SHOT",  unit: "shot", type: "SEMI_FINISH", stock: 0, avg: 0,   min: 20, target: 100, item_type: "SEMI_FINISH" },
  { name: "Fresh Milk",         sku: "DRINK-MILK",      unit: "ml",   type: "BASE",        stock: 0, avg: 0,   min: 5000, target: 20000 },
  { name: "Cream",              sku: "DRINK-CREAM",     unit: "ml",   type: "BASE",        stock: 0, avg: 0,   min: 1500, target: 5000 },
  { name: "Gula Aren",          sku: "DRINK-GULA",      unit: "g",    type: "BASE",        stock: 0, avg: 0,   min: 2000, target: 10000 },
  { name: "Ice",                sku: "DRINK-ICE",       unit: "g",    type: "BASE",        stock: 0, avg: 0,   min: 10000, target: 40000 },

  // --- NEW canonical ingredients (created + OPENING movement) ---
  // Assumed purchase basis is stored per BASE unit (spec §AVERAGE COST).
  { name: "Matcha",             sku: "DRINK-MATCHA",       unit: "g",  stock: 1000, avg: 250, min: 500, target: 2000 },          // ~Rp250/g ceremonial-grade, 1000g opening
  { name: "Nut Syrup",          sku: "DRINK-SYR-NUT",      unit: "ml", stock: 3000, avg: 16,  min: 1000, target: 6000 },        // ~Rp16/ml, 3L opening
  { name: "Cocoa Powder",       sku: "DRINK-COCOA",        unit: "g",  stock: 3000, avg: 9,   min: 1000, target: 6000 },        // ~Rp9/g, 3kg opening
  { name: "Peach Syrup",        sku: "DRINK-SYR-PEACH",    unit: "ml", stock: 3000, avg: 15,  min: 1000, target: 6000 },        // ~Rp15/ml, 3L opening
  { name: "Caramel Syrup",      sku: "DRINK-SYR-CAR",      unit: "ml", stock: 3000, avg: 15,  min: 1000, target: 6000 },        // ~Rp15/ml, 3L opening
  { name: "Hazelnut Syrup",     sku: "DRINK-SYR-HAZ",      unit: "ml", stock: 3000, avg: 14,  min: 1000, target: 6000 },        // ~Rp14/ml, 3L opening
  { name: "Butterscotch Syrup", sku: "DRINK-SYR-BUT",      unit: "ml", stock: 3000, avg: 14,  min: 1000, target: 6000 },        // ~Rp14/ml, 3L opening
];

// Canonical ingredient-name -> canonical InventoryItem row name
function itemName(canonical: string): string {
  const m: Record<string, string> = {
    "Espresso": "Espresso Shot",
    "Milk": "Fresh Milk",
    "Cream": "Cream",
    "Gula Aren": "Gula Aren",
    "Ice": "Ice",
    "Matcha": "Matcha",
    "Nut Syrup": "Nut Syrup",
    "Cocoa Powder": "Cocoa Powder",
    "Peach Syrup": "Peach Syrup",
    "Caramel Syrup": "Caramel Syrup",
    "Hazelnut Syrup": "Hazelnut Syrup",
    "Butterscotch Syrup": "Butterscotch Syrup",
    // Water: untracked — intentionally absent (not a recipe line)
  };
  return m[canonical] ?? canonical;
}

type RecipeDef = { ingredient: string; quantity: number };
type ProductDef = {
  name: string; category: string; price: number; isCanonical: boolean;
  recipe: { ingredient: string; quantity: number }[];
  image_url?: string;
};

// Canonical menu. Recipe quantities are in the ingredient's BASE unit.
// "Water" lines are omitted (untracked). "Espresso" maps to Espresso Shot.
// NOTE: the 3 sim-locked names are marked isCanonical=false — they are kept
// as the fixture (see file header) and skipped on write. They're still listed
// so the delivery report can show intended-canonical vs actual-fixture.
const IMG_ESP = "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_LATTE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_CAP = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_MATCHA = "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_CHOC = "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_PEACH = "https://images.unsplash.com/photo-1544148103-005eec06c04d?w=400&h=400&fit=crop&auto=format&q=80";

const PRODUCTS: ProductDef[] = [
  { name: "Matcha Latte",               category: "Non Coffee", price: 15000, isCanonical: true,  image_url: IMG_MATCHA, recipe: [ { ingredient: "Matcha",             quantity: 3  }, { ingredient: "Milk",  quantity: 150 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Matcha Nut",                 category: "Non Coffee", price: 17000, isCanonical: true,  image_url: IMG_MATCHA, recipe: [ { ingredient: "Matcha",             quantity: 3  }, { ingredient: "Cream", quantity: 60 }, { ingredient: "Nut Syrup", quantity: 25 } ] },
  { name: "Chocolate Latte",            category: "Non Coffee", price: 15000, isCanonical: true,  image_url: IMG_CHOC,   recipe: [ { ingredient: "Cocoa Powder",     quantity: 25 }, { ingredient: "Milk",  quantity: 150 } ] },
  { name: "Chocolate Creamy Nut",       category: "Non Coffee", price: 17000, isCanonical: true,  image_url: IMG_CHOC,   recipe: [ { ingredient: "Cocoa Powder",     quantity: 25 }, { ingredient: "Cream", quantity: 30 }, { ingredient: "Nut Syrup", quantity: 25 } ] },
  { name: "Peach Coffee Latte",         category: "Coffee",     price: 17000, isCanonical: true,  image_url: IMG_PEACH,  recipe: [ { ingredient: "Espresso",          quantity: 1  }, { ingredient: "Milk",  quantity: 150 }, { ingredient: "Peach Syrup", quantity: 30 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Dikopispace",                category: "Coffee",     price: 17000, isCanonical: false, image_url: IMG_PEACH,  recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Milk", quantity: 150 }, { ingredient: "Gula Aren", quantity: 20 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Espresso",                   category: "Coffee",     price: 10000, isCanonical: true,  image_url: IMG_ESP,    recipe: [ { ingredient: "Espresso", quantity: 1 } ] },
  { name: "Iced Americano",             category: "Coffee",     price: 17000, isCanonical: false, image_url: IMG_ESP,    recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Ice", quantity: 150 } ] },
  { name: "Caramel Latte",              category: "Coffee",     price: 17000, isCanonical: true,  image_url: IMG_LATTE,  recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Milk", quantity: 150 }, { ingredient: "Caramel Syrup", quantity: 30 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Hazelnut Latte",             category: "Coffee",     price: 17000, isCanonical: true,  image_url: IMG_LATTE,  recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Milk", quantity: 150 }, { ingredient: "Hazelnut Syrup", quantity: 30 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Butterscotch",               category: "Coffee",     price: 17000, isCanonical: true,  image_url: IMG_LATTE,  recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Milk", quantity: 150 }, { ingredient: "Butterscotch Syrup", quantity: 30 }, { ingredient: "Cream", quantity: 30 } ] },
  { name: "Cappuccino",                 category: "Coffee",     price: 17000, isCanonical: false, image_url: IMG_CAP,    recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Milk", quantity: 150 } ] },
  { name: "Black Peach / Americano Peach", category: "Coffee", price: 18000, isCanonical: true, image_url: IMG_PEACH,  recipe: [ { ingredient: "Espresso", quantity: 1 }, { ingredient: "Peach Syrup", quantity: 30 } ] },
];

// The 6 sim-fixture names. These rows are owned by prisma/seed-simulation.ts
// and the 62/62 baseline (sim/run.ts). They are SKIPPED on write so the
// baseline stays green and so sim:reset can reclaim them.
const SIM_FIXTURE_NAMES = new Set([
  "Iced Latte", "Iced Americano", "Cappuccino", "Dikopispace",
  "Kopi Susu (Legacy)", "Black Peach",
]);

const itemCache: Record<string, string> = {};

/**
 * Upsert an ingredient. For an EXISTING row (sim-owned items): refresh only
 * sku/min/target/is_active — stock & average_cost stay owned by the ledger.
 * For a NEW row with opening stock: create it + a single OPENING movement so
 * current_stock == Σ(movements) holds.
 */
async function upsertItem(ing: Ing): Promise<string> {
  const existing = await prisma.inventoryItem.findUnique({ where: { name: ing.name } });
  if (existing) {
    await prisma.inventoryItem.update({
      where: { name: ing.name },
      data: {
        sku: ing.sku,
        unit: existing.unit,           // never change the base unit of an existing row
        minimum_stock: ing.min,
        target_stock: ing.target,
        is_active: true,
        // DO NOT touch current_stock or average_cost — the live ledger owns them.
      },
    });
    itemCache[ing.name] = existing.id;
    return existing.id;
  }

  const row = await prisma.inventoryItem.create({
    data: {
      name: ing.name,
      sku: ing.sku,
      unit: ing.unit,
      item_type: ing.item_type ?? "BASE",
      current_stock: ing.stock,
      average_cost: ing.avg,
      minimum_stock: ing.min,
      target_stock: ing.target,
      is_active: true,
    },
  });
  if (ing.stock > 0) {
    await prisma.stockMovement.create({
      data: {
        inventory_item_id: row.id,
        type: "OPENING",
        quantity: ing.stock,
        unit_cost: ing.avg,
        reference_type: "OPENING",
        note: "Canonical menu opening stock",
      },
    });
  }
  itemCache[ing.name] = row.id;
  return row.id;
}

/** Replace a product's RecipeItem rows with the canonical recipe. */
async function writeRecipe(product: ProductDef, productId: string) {
  await prisma.recipeItem.deleteMany({ where: { product_id: productId } });
  for (const r of product.recipe) {
    const canonical = r.ingredient;
    const rowName = itemName(canonical);
    const itemId = itemCache[rowName];
    if (!itemId) throw new Error(`recipe ingredient not resolved: ${canonical} -> ${rowName} (${product.name})`);
    await prisma.recipeItem.create({
      data: { product_id: productId, inventory_item_id: itemId, quantity: r.quantity },
    });
  }
}

/** Map a canonical category name to an id (create if missing). */
async function ensureCategory(name: string): Promise<string> {
  const c = await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  return c.id;
}

async function main() {
  const now = new Date();
  const issues: string[] = [];

  // ---- 1. ingredients -------------------------------------------------------
  let createdItems = 0, keptItems = 0;
  for (const ing of INGREDIENTS) {
    const before = await prisma.inventoryItem.findUnique({ where: { name: ing.name } });
    await upsertItem(ing);
    if (before) keptItems++; else createdItems++;
  }

  // ---- 2. categories --------------------------------------------------------
  const cats: Record<string, string> = {};
  for (const n of Array.from(new Set(PRODUCTS.map((p) => p.category)))) {
    cats[n] = await ensureCategory(n);
  }

  // ---- 3. products + recipes ------------------------------------------------
  // Build the "keep active" set: canonical (13) + sim-fixture (6) = names that stay.
  const keepActive = new Set([...PRODUCTS.map((p) => p.name), ...SIM_FIXTURE_NAMES]);

  let created = 0, updated = 0, skipped = 0, deactivated = 0;
  for (const p of PRODUCTS) {
    const isSimLocked = SIM_FIXTURE_NAMES.has(p.name);
    let row = await prisma.product.findFirst({ where: { name: p.name } });

    if (isSimLocked) {
      // Locked E2E baseline owns this name — do NOT overwrite recipe/price.
      skipped++;
      continue;
    }

    if (row) {
      await prisma.product.update({
        where: { id: row.id },
        data: {
          name: p.name,
          category_id: cats[p.category],
          selling_price: p.price,
          image_url: p.image_url ?? row.image_url,
          is_available: true,
          cost_price: null,          // clear retired manual HPP source
          hpp_breakdown: null,       // clear retired manual HPP source
        },
      });
      await writeRecipe(p, row.id);
      updated++;
    } else {
      row = await prisma.product.create({
        data: {
          name: p.name,
          category_id: cats[p.category],
          selling_price: p.price,
          image_url: p.image_url,
          is_available: true,
          cost_price: null,
          hpp_breakdown: null,
        },
      });
      await writeRecipe(p, row.id);
      created++;
    }
  }

  // ---- 4. deactivate obsolete non-canonical, non-fixture products -----------
  // Clear residual manual-HPP fields on ANY product (retired cost source) — for
  // both kept and obsolete rows. Historical TransactionItem.cost_price/cogs stay
  // immutable (they're snapshot rows, not the Product master field).
  const allProducts = await prisma.product.findMany({
    select: { id: true, name: true, is_available: true, cost_price: true, hpp_breakdown: true },
  });
  for (const p of allProducts) {
    if (p.cost_price != null || p.hpp_breakdown != null) {
      await prisma.product.update({ where: { id: p.id }, data: { cost_price: null, hpp_breakdown: null } });
    }
    if (keepActive.has(p.name)) {
      // canonical + sim fixtures stay active
      continue;
    }
    if (p.is_available) {
      await prisma.product.update({ where: { id: p.id }, data: { is_available: false } });
      deactivated++;
    }
  }

  // ---- 5. data-quality checks ----------------------------------------------
  // 5a. every canonical recipe ingredient resolved
  for (const p of PRODUCTS) {
    if (SIM_FIXTURE_NAMES.has(p.name)) continue;
    for (const r of p.recipe) {
      const rowName = itemName(r.ingredient);
      const it = await prisma.inventoryItem.findUnique({ where: { name: rowName } });
      if (!it) issues.push(`${p.name}: ingredient '${r.ingredient}' (${rowName}) missing`);
      else if (Number(it.average_cost) <= 0 && r.ingredient !== "Water") {
        issues.push(`${p.name}: ${it.name} avg_cost=${it.average_cost} -> NO_STOCK_COST`);
      }
    }
  }

  // 5b. no stored HPP on Product master fields (RecipeItem carries no cost column)
  const stored = await prisma.product.findMany({ where: { cost_price: { not: null } }, select: { name: true } });
  if (stored.length) issues.push(`cost_price still populated on: ${stored.map((p) => p.name).join(", ")}`);
  const storedB = await prisma.product.findMany({ where: { hpp_breakdown: { not: null } }, select: { name: true } });
  if (storedB.length) issues.push(`hpp_breakdown still populated on: ${storedB.map((p) => p.name).join(", ")}`);

  // 5c. ledger integrity: current_stock == SUM(movement.quantity)
  // 5d. no negative stock
  const allItems = await prisma.inventoryItem.findMany();
  const negatives: string[] = [];
  for (const it of allItems) {
    const agg = await prisma.stockMovement.aggregate({
      where: { inventory_item_id: it.id },
      _sum: { quantity: true },
    });
    const sum = Number(agg._sum.quantity ?? 0);
    const cur = Number(it.current_stock);
    if (Math.abs(cur - sum) > 0.001) issues.push(`${it.name}: ledger drift stock=${cur} Σmov=${sum}`);
    if (cur < 0) negatives.push(it.name);
  }

  console.log(`[seed-canonical] ingredients: ${createdItems} created, ${keptItems} reused`);
  console.log(`[seed-canonical] products: ${created} created, ${updated} updated, ${skipped} sim-locked (untouched), ${deactivated} deactivated`);

  // ---- 6. live HPP report (uses existing computeRecipeCostDetail) -----------
  const { computeRecipeCostDetail } = await import("../src/lib/cogs");
  type RecipeCostDetail = Awaited<ReturnType<typeof computeRecipeCostDetail>>;
  const live = await prisma.product.findMany({
    where: { is_available: true },
    include: { category: true, recipeItems: { include: { inventory_item: true } } },
    orderBy: { name: "asc" },
  });
  console.log("\n[seed-canonical] live HPP (Σ qty × avg_cost) for active canonical products:");
  const rows: Array<{ name: string; price: number; hpp: number; gp: number; margin: number; status: string; detail: RecipeCostDetail }> = [];
  for (const p of live) {
    if (SIM_FIXTURE_NAMES.has(p.name)) continue; // skip sim-only fixtures (Iced Latte, etc.)
    const ritems = p.recipeItems as any[];
    const detail = computeRecipeCostDetail(
      ritems.map((ri: any) => ({
        inventory_item_id: ri.inventory_item_id,
        quantity: ri.quantity,
        inventory_item: ri.inventory_item,
      }))
    );
    const hpp = detail.total;
    const gp = p.selling_price - hpp;
    const margin = p.selling_price ? Math.round((gp / p.selling_price) * 100) : 0;
    const status = detail.total <= 0 ? "NO_STOCK_COST" : detail.hasUnpriced ? "NO_STOCK_COST" : "OK";
    rows.push({ name: p.name, price: p.selling_price, hpp, gp, margin, status, detail });
    const qty = ritems.map((ri: any) => `${ri.inventory_item.name} ${Number(ri.quantity)}${ri.inventory_item.unit}`).join(", ");
    console.log(`  ${p.name.padEnd(28)} Rp${String(p.selling_price).padStart(5)}  HPP Rp${String(hpp).padStart(5)}  GP Rp${String(gp).padStart(5)}  ${status === "OK" ? margin + "%" : status}  [${qty}]`);
  }

  if (issues.length) {
    console.warn("\n[seed-canonical] DATA QUALITY ISSUES:");
    for (const i of issues) console.warn("  -", i);
  } else {
    console.log("\n[seed-canonical] all data-quality checks passed.");
  }
  console.log(`[seed-canonical] done. sim fixture untouched; run 'npm run sim:reset' to verify 62/62.`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error("[seed-canonical] FAILED:", e); process.exit(1); });
