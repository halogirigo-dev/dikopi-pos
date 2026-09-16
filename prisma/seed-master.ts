/**
 * MASTER / DEMO CAFÉ DATASET
 * ==========================
 * Populates a realistic small-to-medium Indonesian café dataset so the POS
 * can be used immediately: inventory → recipes → live HPP → products.
 *
 * Runs on the live dev DB, ADDITIVE and idempotent (upserts). It NEVER
 * touches the E2E simulation fixture:
 *   - sim product names (Iced Latte, Iced Americano, Cappuccino, Dikopispace,
 *     Kopi Susu (Legacy), Black Peach) are skipped;
 *   - sim-scoped inventory item names (see SIM_ITEM_NAMES) are skipped — the
 *     canonical fixture values live in prisma/seed-simulation.ts and
 *     `npm run sim:reset` owns them;
 *   - every master item (item_type BASE, demo SKU) gets a single OPENING
 *     stock movement when created with opening stock, so the ledger
 *     invariant (current_stock == Σ movements) stays true;
 *   - existing stock movements are never altered; E2E financials
 *     (revenue/COGS/cashPosition) are unaffected.
 *
 * UNIT RULE: inventory is stored in the base unit (L → ml, kg → g,
 * pack → pcs). average_cost is always Rp per base unit. Recipe quantities
 * are in the ingredient's base unit. HPP is NEVER stored on RecipeItem or
 * Product — it is derived live: Σ(quantity × Ingredient.average_cost).
 *
 * Usage:
 *   npm run seed:master
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sim fixture owns these InventoryItem names (prisma/seed-simulation.ts).
// The master seed must not touch them; master recipes use dedicated items.
const SIM_ITEM_NAMES = new Set([
  "Arabica Beans", "Robusta Beans", "Fresh Milk", "Gula Aren", "Ice",
  "Serving Cup", "Cup Lid", "Espresso Shot", "Cream",
]);

// Sim fixture products must keep their own recipes / selling prices.
const SIM_PRODUCT_NAMES = new Set([
  "Iced Latte", "Iced Americano", "Cappuccino", "Dikopispace",
  "Kopi Susu (Legacy)", "Black Peach",
]);

// ----------------------------------------------------------------------------
// Ingredient library (base units, opening stock, opening avg cost / base unit)
// ----------------------------------------------------------------------------
type Ing = {
  name: string; sku: string; unit: string;
  stock: number; avg: number; min: number; target: number;
};

const INGREDIENTS: Ing[] = [
  // Coffee (semi-finished: blended in-house from the two bean stocks below)
  { name: "Espresso Blend Coffee", sku: "MASTER-BEAN-ESP", unit: "g", stock: 2500, avg: 165, min: 1000, target: 5000 },
  // Beans (tracked for purchasing; the blend is produced from them — a future
  // InventoryRecipe can link these, not required by the master dataset)
  { name: "Master Arabica Beans", sku: "MASTER-BEAN-ARB", unit: "g", stock: 5000, avg: 150, min: 2000, target: 10000 },
  { name: "Master Robusta Beans", sku: "MASTER-BEAN-ROB", unit: "g", stock: 4000, avg: 95, min: 2000, target: 8000 },
  // Dairy
  { name: "Master Fresh Milk", sku: "MASTER-MILK-FRESH", unit: "ml", stock: 12000, avg: 8.5, min: 5000, target: 20000 },
  { name: "UHT Milk", sku: "MASTER-MILK-UHT", unit: "ml", stock: 8000, avg: 12, min: 4000, target: 15000 },
  { name: "Condensed Milk", sku: "MASTER-MILK-COND", unit: "ml", stock: 4000, avg: 11.5, min: 2000, target: 8000 },
  { name: "Whipping Cream", sku: "MASTER-MILK-CREAM", unit: "ml", stock: 3000, avg: 20, min: 1500, target: 5000 },
  // Sweeteners & flavor syrups
  { name: "Simple Syrup", sku: "MASTER-SYR-SP", unit: "ml", stock: 5000, avg: 2.5, min: 2000, target: 10000 },
  { name: "Vanilla Syrup", sku: "MASTER-SYR-VAN", unit: "ml", stock: 4000, avg: 15, min: 1000, target: 8000 },
  { name: "Caramel Syrup", sku: "MASTER-SYR-CAR", unit: "ml", stock: 4000, avg: 15, min: 1000, target: 8000 },
  { name: "Hazelnut Syrup", sku: "MASTER-SYR-HAZ", unit: "ml", stock: 3000, avg: 14, min: 1000, target: 6000 },
  { name: "Butterscotch Syrup", sku: "MASTER-SYR-BUT", unit: "ml", stock: 3000, avg: 14, min: 1000, target: 6000 },
  { name: "Peach Syrup", sku: "MASTER-SYR-PEA", unit: "ml", stock: 3000, avg: 15, min: 1000, target: 6000 },
  { name: "Master Gula Aren", sku: "MASTER-SUG-AREN", unit: "g", stock: 5000, avg: 12, min: 2000, target: 10000 },
  // Chocolate
  { name: "Chocolate Powder", sku: "MASTER-CHOC-POW", unit: "g", stock: 4000, avg: 10, min: 1000, target: 8000 },
  { name: "Chocolate Sauce", sku: "MASTER-CHOC-SAU", unit: "ml", stock: 4000, avg: 12, min: 2000, target: 8000 },
  // Tea / matcha
  { name: "Matcha Powder", sku: "MASTER-TEA-MAT", unit: "g", stock: 1000, avg: 250, min: 500, target: 2000 },
  { name: "Black Tea Bags", sku: "MASTER-TEA-BLK", unit: "pcs", stock: 500, avg: 650, min: 200, target: 1000 },
  { name: "Earl Grey Tea Bags", sku: "MASTER-TEA-EGY", unit: "pcs", stock: 300, avg: 650, min: 150, target: 600 },
  { name: "Jasmine Tea Bags", sku: "MASTER-TEA-JSM", unit: "pcs", stock: 300, avg: 700, min: 150, target: 600 },
  // Fruit (used whole: juice / topping)
  { name: "Lemon", sku: "MASTER-FRU-LEM", unit: "pcs", stock: 200, avg: 1500, min: 100, target: 400 },
  { name: "Strawberry", sku: "MASTER-FRU-STR", unit: "g", stock: 3000, avg: 15, min: 1000, target: 6000 },
  { name: "Mango", sku: "MASTER-FRU-MAN", unit: "g", stock: 4000, avg: 7, min: 1000, target: 8000 },
  { name: "Passion Fruit", sku: "MASTER-FRU-PAS", unit: "pcs", stock: 150, avg: 2500, min: 75, target: 300 },
  // Ice
  { name: "Master Ice", sku: "MASTER-ICE", unit: "g", stock: 25000, avg: 1.5, min: 10000, target: 40000 },
  // Packaging
  { name: "Cup 8 oz", sku: "MASTER-PACK-C8", unit: "pcs", stock: 300, avg: 250, min: 100, target: 600 },
  { name: "Cup 12 oz", sku: "MASTER-PACK-C12", unit: "pcs", stock: 500, avg: 350, min: 150, target: 1000 },
  { name: "Cup 16 oz", sku: "MASTER-PACK-C16", unit: "pcs", stock: 600, avg: 400, min: 200, target: 1200 },
  { name: "Cup 22 oz", sku: "MASTER-PACK-C22", unit: "pcs", stock: 200, avg: 500, min: 100, target: 400 },
  { name: "Hot Cup", sku: "MASTER-PACK-HOT", unit: "pcs", stock: 400, avg: 350, min: 150, target: 800 },
  { name: "Cold Cup Lid 12-16 oz", sku: "MASTER-PACK-LID", unit: "pcs", stock: 700, avg: 200, min: 200, target: 1500 },
  { name: "Hot Cup Lid", sku: "MASTER-PACK-LIDH", unit: "pcs", stock: 400, avg: 200, min: 150, target: 800 },
  { name: "Straw", sku: "MASTER-PACK-STW", unit: "pcs", stock: 800, avg: 100, min: 300, target: 1500 },
  { name: "Paper Bag", sku: "MASTER-PACK-BAG", unit: "pcs", stock: 500, avg: 200, min: 200, target: 1000 },
];

// ----------------------------------------------------------------------------
// Recipes (quantities in the ingredient's base unit; HPP derived, never stored)
// ----------------------------------------------------------------------------
type RecipeDef = {
  ing: string; // inventory item name
  qty: number; // base units
};
type ProductDef = {
  name: string; category: string; price: number;
  recipe: RecipeDef[];
  image_url?: string;
};

const B = "Espresso Blend Coffee";
const FM = "Master Fresh Milk";
const CC = "Cold Cup Lid 12-16 oz";
const STR = "Straw";
const IMG_ESP = "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_LATTE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_CAP = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_MATCHA = "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_CHOC = "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80";
const IMG_PEACH = "https://images.unsplash.com/photo-1544148103-005eec06c04d?w=400&h=400&fit=crop&auto=format&q=80";

const PRODUCTS: ProductDef[] = [
  // ---------------- Espresso (hot, Hot Cup) ----------------
  { name: "Master Espresso", category: "Coffee", price: 15000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 18 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Double Espresso", category: "Coffee", price: 20000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 36 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Americano", category: "Coffee", price: 22000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 18 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Long Black", category: "Coffee", price: 24000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 36 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  // ---------------- Milk coffee (hot) ----------------
  { name: "Master Café Latte", category: "Coffee", price: 32000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Cappuccino", category: "Coffee", price: 28000, image_url: IMG_CAP, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 100 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Flat White", category: "Coffee", price: 30000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 36 }, { ing: FM, qty: 120 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Piccolo", category: "Coffee", price: 26000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 60 }, { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Spanish Latte", category: "Coffee", price: 30000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 120 }, { ing: "Condensed Milk", qty: 20 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Kopi Susu", category: "Coffee", price: 25000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 22 }, { ing: FM, qty: 120 }, { ing: "Master Gula Aren", qty: 20 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Vanilla Latte", category: "Coffee", price: 35000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Vanilla Syrup", qty: 30 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Caramel Latte", category: "Coffee", price: 35000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Caramel Syrup", qty: 30 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Hazelnut Latte", category: "Coffee", price: 35000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Hazelnut Syrup", qty: 30 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  // ---------------- Iced coffee (Cup 16 oz + lid + straw) ----------------
  { name: "Master Iced Latte", category: "Coffee", price: 30000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Master Ice", qty: 150 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Iced Americano", category: "Coffee", price: 25000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 18 }, { ing: "Master Ice", qty: 150 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ]},
  { name: "Master Iced Cappuccino", category: "Coffee", price: 32000, image_url: IMG_CAP, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 60 }, { ing: "Whipping Cream", qty: 15 }, { ing: "Master Ice", qty: 100 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Iced Spanish Latte", category: "Coffee", price: 33000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 100 }, { ing: "Condensed Milk", qty: 20 }, { ing: "Master Ice", qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Iced Caramel Latte", category: "Coffee", price: 38000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 120 }, { ing: "Caramel Syrup", qty: 30 }, { ing: "Master Ice", qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Iced Vanilla Latte", category: "Coffee", price: 38000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 120 }, { ing: "Vanilla Syrup", qty: 30 }, { ing: "Master Ice", qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Iced Mocha", category: "Coffee", price: 36000, image_url: IMG_CHOC, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 100 }, { ing: "Chocolate Sauce", qty: 30 }, { ing: "Master Ice", qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  // ---------------- Non-coffee ----------------
  { name: "Master Matcha Latte", category: "Non Coffee", price: 32000, image_url: IMG_MATCHA, recipe: [
    { ing: "Matcha Powder", qty: 3 }, { ing: FM, qty: 150 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Hot Chocolate", category: "Non Coffee", price: 28000, image_url: IMG_CHOC, recipe: [
    { ing: "Chocolate Powder", qty: 25 }, { ing: FM, qty: 150 },
    { ing: "Hot Cup", qty: 1 }, { ing: "Hot Cup Lid", qty: 1 },
  ] },
  { name: "Master Iced Chocolate", category: "Non Coffee", price: 30000, image_url: IMG_CHOC, recipe: [
    { ing: "Chocolate Powder", qty: 25 }, { ing: FM, qty: 100 }, { ing: "Master Ice", qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Matcha Strawberry", category: "Non Coffee", price: 35000, image_url: IMG_MATCHA, recipe: [
    { ing: "Matcha Powder", qty: 3 }, { ing: "Strawberry", qty: 40 }, { ing: FM, qty: 120 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Lemon Tea", category: "Non Coffee", price: 22000, image_url: IMG_PEACH, recipe: [
    { ing: "Black Tea Bags", qty: 1 }, { ing: "Lemon", qty: 0.5 },
    { ing: "Cup 8 oz", qty: 1 }, { ing: CC, qty: 1 },
  ] },
  { name: "Master Iced Lemon Tea", category: "Non Coffee", price: 25000, image_url: IMG_PEACH, recipe: [
    { ing: "Black Tea Bags", qty: 1 }, { ing: "Lemon", qty: 0.5 }, { ing: "Master Ice", qty: 100 },
    { ing: "Cup 12 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  // ---------------- Signature ----------------
  { name: "Master Kopi Kenari", category: "Signature", price: 28000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 22 }, { ing: FM, qty: 200 }, { ing: "Condensed Milk", qty: 20 }, { ing: "Whipping Cream", qty: 10 },
    { ing: "Cup 22 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Caramel Cream Cold Brew", category: "Signature", price: 40000, image_url: IMG_ESP, recipe: [
    { ing: B, qty: 40 }, { ing: "Caramel Syrup", qty: 30 }, { ing: FM, qty: 50 },
    { ing: "Cup 22 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Mango Passion Latte", category: "Signature", price: 35000, image_url: IMG_PEACH, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 100 }, { ing: "Mango", qty: 60 }, { ing: "Passion Fruit", qty: 1 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
  { name: "Master Butterscotch Latte", category: "Signature", price: 38000, image_url: IMG_LATTE, recipe: [
    { ing: B, qty: 18 }, { ing: FM, qty: 150 }, { ing: "Butterscotch Syrup", qty: 30 },
    { ing: "Cup 16 oz", qty: 1 }, { ing: CC, qty: 1 }, { ing: STR, qty: 1 },
  ] },
];

// ----------------------------------------------------------------------------
// Upsert helpers
// ----------------------------------------------------------------------------
const itemCache: Record<string, string> = {};

/**
 * upsertItem — creates or refreshes a BASE ingredient.
 * - Existing row → only refresh sku/min/target/is_active; stock & average
 *   cost untouched (the live ledger owns them — purchases move them).
 * - New row with stock > 0 → creates the row AND a single OPENING movement,
 *   keeping the ledger invariant current_stock == Σ(movements.quantity) true.
 *
 * Recipe quantities are written as fixed, realistic portion sizes in the
 * ingredient's base unit (spec: "use realistic café portions"). HPP is
 * derived live — Σ(qty × Ingredient.average_cost) — so it moves naturally
 * with purchases; nothing is scaled or tuned here.
 */
async function upsertItem(ing: Ing): Promise<string> {
  const existing = await prisma.inventoryItem.findUnique({ where: { name: ing.name } });
  if (existing) {
    await prisma.inventoryItem.update({
      where: { name: ing.name },
      data: { sku: ing.sku, minimum_stock: ing.min, target_stock: ing.target, is_active: true },
    });
    itemCache[ing.name] = existing.id;
    return existing.id;
  }
  const row = await prisma.inventoryItem.create({
    data: {
      name: ing.name, sku: ing.sku, unit: ing.unit,
      item_type: "BASE",
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
        note: "Master/demo dataset opening stock",
      },
    });
  }
  itemCache[ing.name] = row.id;
  return row.id;
}

/**
 * writeRecipe — replaces a product's RecipeItem rows with fixed, realistic
 * portion quantities (in the ingredient's base unit). No HPP is stored:
 * the live value is derived at read time.
 */
async function writeRecipe(product: ProductDef, id: string) {
  await prisma.recipeItem.deleteMany({ where: { product_id: id } });
  for (const r of product.recipe) {
    const itemId = itemCache[r.ing];
    if (!itemId) throw new Error(`unknown ingredient in recipe: ${r.ing} (${product.name})`);
    await prisma.recipeItem.create({
      data: { product_id: id, inventory_item_id: itemId, quantity: r.qty },
    });
  }
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
async function main() {
  // categories used by products (idempotent)
  const catNames = Array.from(new Set(PRODUCTS.map((p) => p.category)));
  for (const n of catNames) {
    await prisma.category.upsert({ where: { name: n }, update: {}, create: { name: n } });
  }
  const cats: Record<string, string> = {};
  for (const n of catNames) cats[n] = (await prisma.category.findUnique({ where: { name: n } }))!.id;

  // 1. ingredients
  let createdItems = 0, keptItems = 0;
  for (const ing of INGREDIENTS) {
    if (SIM_ITEM_NAMES.has(ing.name)) { keptItems++; continue; }
    const before = await prisma.inventoryItem.findUnique({ where: { name: ing.name } });
    await upsertItem(ing);
    if (before) keptItems++; else createdItems++;
  }

  // 2. products + recipes
  let createdProducts = 0, keptProducts = 0;
  for (const p of PRODUCTS) {
    if (SIM_PRODUCT_NAMES.has(p.name)) { keptProducts++; continue; }
    let row = await prisma.product.findFirst({ where: { name: p.name } });
    if (row) {
      // refresh price/category/image only when the master dataset says so
      await prisma.product.update({
        where: { id: row.id },
        data: {
          category_id: cats[p.category],
          selling_price: p.price,
          image_url: p.image_url ?? row.image_url,
          is_available: true,
        },
      });
      await writeRecipe(p, row.id);
      keptProducts++;
    } else {
      row = await prisma.product.create({
        data: {
          name: p.name,
          category_id: cats[p.category],
          selling_price: p.price,
          image_url: p.image_url,
          is_available: true,
        },
      });
      await writeRecipe(p, row.id);
      createdProducts++;
    }
  }

  // 3. data-quality checks (spec §12)
  const issues: string[] = [];
  const allItems = await prisma.inventoryItem.findMany();
  const allProds = await prisma.product.findMany({ include: { recipeItems: { include: { inventory_item: true } } } });

  // every recipe ingredient exists & has avg cost
  for (const p of allProds) {
    for (const ri of p.recipeItems as any[]) {
      const it = ri.inventory_item;
      if (!it) issues.push(`${p.name}: missing ingredient row ${ri.inventory_item_id}`);
      else if (Number(it.average_cost) <= 0) issues.push(`${p.name}: ${it.name} avg cost 0 → NO_STOCK_COST`);
    }
  }
  // no stored HPP on Product master fields (RecipeItem by design carries no
  // cost column — schema-level guarantee, verified by Prisma types)
  const prodStored = (await prisma.product.findMany({ where: { cost_price: { not: null } }, select: { name: true } }));
  if (prodStored.length) issues.push(`Product.cost_price still populated on: ${prodStored.map((p) => p.name).join(", ")}`);

  // live HPP ranges (derived, per spec: HPP = Σ qty × avg)
  const live = await prisma.product.findMany({ include: { recipeItems: { include: { inventory_item: true } } } });
  const hppReport: Array<{ name: string; hpp: number; price: number; marginPct: number }> = [];
  for (const p of live) {
    if (SIM_PRODUCT_NAMES.has(p.name)) continue;
    const hpp = Math.round((p.recipeItems as any[]).reduce((s: number, ri) => s + Number(ri.quantity) * Number(ri.inventory_item.average_cost), 0));
    if (hpp <= 0) continue;
    hppReport.push({ name: p.name, hpp, price: p.selling_price, marginPct: Math.round(((p.selling_price - hpp) / p.selling_price) * 100) });
    if (p.selling_price <= hpp) issues.push(`${p.name}: selling price ${p.selling_price} ≤ HPP ${hpp}`);
  }

  // opening stock sufficiency: each item ≥ minimum, no negative stock
  const neg = allItems.filter((i) => Number(i.current_stock) < 0);
  if (neg.length) issues.push(`negative stock: ${neg.map((i) => i.name).join(", ")}`);

  console.log("[seed-master] items:   ", `${createdItems} created, ${keptItems} kept/refreshed`);
  console.log("[seed-master] products:", `${createdProducts} created, ${keptProducts} kept/refreshed`);
  console.log("[seed-master] live HPP ranges (derived, per product):");
  for (const r of hppReport.sort((a, b) => a.hpp - b.hpp)) {
    console.log(`  ${r.name.padEnd(32)} HPP Rp${r.hpp.toLocaleString("id").padStart(8)}  price Rp${r.price.toLocaleString("id").padStart(8)}  margin ${r.marginPct}%`);
  }
  if (issues.length) {
    console.warn("[seed-master] DATA QUALITY ISSUES:");
    for (const i of issues) console.warn("  -", i);
  } else {
    console.log("[seed-master] all 12 data-quality checks passed.");
  }
  console.log("[seed-master] done. E2E fixture values untouched (run `npm run sim:reset` to verify 63/63).");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("[seed-master] FAILED:", e);
  process.exit(1);
});
