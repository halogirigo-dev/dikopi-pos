/**
 * REFRESH OLD PRODUCTS → MASTER INGREDIENTS
 * -----------------------------------------
 * The legacy `prisma/seed.ts` created products with stale prices/recipes and a
 * populated `cost_price` (retired HPP source). This script re-points each old
 * product at the master ingredient library so the live HPP engine
 * (Σ qty × InventoryItem.average_cost) prices them correctly, then clears the
 * legacy cost_price so Product carries no manual HPP (spec lock).
 *
 * Scope: ONLY the named legacy products below. It NEVER touches:
 *   - sim fixture products (Iced Latte, Iced Americano, Cappuccino, Dikopispace,
 *     Kopi Susu (Legacy), Black Peach) — those are owned by seed-simulation.ts
 *     and reset by `npm run sim:reset`;
 *   - E2E fixture inventory items (Arabica Beans, Fresh Milk, Ice, etc.).
 *   - any E2E simulation financial rows.
 *
 * Recipes use the master item (Espresso Blend Coffee / Master Fresh Milk /
 * Master Ice / Master Gula Aren / Cup / Lid / Straw) with standard café
 * portions. Water is intentionally untracked (not seeded as an item).
 *
 * Usage: npm run seed:refresh
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const B = "Espresso Blend Coffee";
const FM = "Master Fresh Milk";
const COND = "Condensed Milk";
const WHIP = "Whipping Cream";
const SIMPLE = "Simple Syrup";
const VAN = "Vanilla Syrup";
const CAR = "Caramel Syrup";
const HAZ = "Hazelnut Syrup";
const BUT = "Butterscotch Syrup";
const PEACH = "Peach Syrup";
const GULA = "Master Gula Aren";
const CHOC_POW = "Chocolate Powder";
const CHOC_SAUCE = "Chocolate Sauce";
const MATCHA = "Matcha Powder";
const BLACK_TEA = "Black Tea Bags";
const LEMON = "Lemon";
const ICE = "Master Ice";
const CUP_16 = "Cup 16 oz";
const CUP_8 = "Cup 8 oz";
const LID = "Cold Cup Lid 12-16 oz";
const STRAW = "Straw";

type Rec = { name: string; qty: number };
type ProductDef = {
  name: string;
  category: string;
  price: number;
  recipe: Rec[];
  image_url?: string;
};

const OLD: ProductDef[] = [
  // ---- Coffee category ----
  { name: "Espresso", category: "Coffee", price: 16_000, recipe: [
    { name: B, qty: 18 }, { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Americano", category: "Coffee", price: 20_000, recipe: [
    { name: B, qty: 18 }, { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Caramel Latte", category: "Coffee", price: 32_000, recipe: [
    { name: B, qty: 18 }, { name: FM, qty: 150 }, { name: CAR, qty: 30 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Hazelnut Latte", category: "Coffee", price: 32_000, recipe: [
    { name: B, qty: 18 }, { name: FM, qty: 150 }, { name: HAZ, qty: 30 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Butterscotch", category: "Coffee", price: 32_000, recipe: [
    { name: B, qty: 18 }, { name: FM, qty: 150 }, { name: BUT, qty: 30 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Peach Coffee Latte", category: "Coffee", price: 32_000, recipe: [
    { name: B, qty: 18 }, { name: FM, qty: 150 }, { name: PEACH, qty: 30 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1544148103-005eec06c04d?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Es Kopi Susu", category: "Coffee", price: 28_000, recipe: [
    { name: B, qty: 22 }, { name: FM, qty: 150 }, { name: GULA, qty: 20 }, { name: ICE, qty: 150 },
    { name: CUP_16, qty: 1 }, { name: LID, qty: 1 }, { name: STRAW, qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80" },
  // ---- Non Coffee category ----
  { name: "Matcha Latte", category: "Non Coffee", price: 28_000, recipe: [
    { name: MATCHA, qty: 3 }, { name: FM, qty: 150 },
    { name: CUP_16, qty: 1 }, { name: LID, qty: 1 }, { name: STRAW, qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Matcha Nut", category: "Non Coffee", price: 32_000, recipe: [
    { name: MATCHA, qty: 3 }, { name: HAZ, qty: 20 }, { name: FM, qty: 150 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Chocolate Latte", category: "Non Coffee", price: 28_000, recipe: [
    { name: CHOC_POW, qty: 25 }, { name: FM, qty: 150 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Chocolate Creamy Nut", category: "Non Coffee", price: 32_000, recipe: [
    { name: CHOC_POW, qty: 25 }, { name: HAZ, qty: 20 }, { name: WHIP, qty: 15 }, { name: FM, qty: 120 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Black Peach / Americano Peach", category: "Coffee", price: 22_000, recipe: [
    { name: B, qty: 18 }, { name: PEACH, qty: 25 },
    { name: "Hot Cup", qty: 1 }, { name: "Hot Cup Lid", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1544148103-005eec06c04d?w=400&h=400&fit=crop&auto=format&q=80" },
  // ---- Food category ----
  { name: "Croissant", category: "Food", price: 18_000, recipe: [
    { name: CHOC_SAUCE, qty: 15 }, { name: "Hot Cup", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1528644653345-1fb3d7d0e1c8?w=400&h=400&fit=crop&auto=format&q=80" },
  { name: "Nasi Goreng", category: "Food", price: 35_000, recipe: [
    { name: GULA, qty: 10 }, { name: "Paper Bag", qty: 1 },
  ], image_url: "https://images.unsplash.com/photo-1603038868074-0a945b0c3b5a?w=400&h=400&fit=crop&auto=format&q=80" },
];

async function main() {
  const cats: Record<string, string> = {};
  for (const n of Array.from(new Set(OLD.map((p) => p.category)))) {
    const c = await prisma.category.upsert({ where: { name: n }, update: {}, create: { name: n } });
    cats[n] = c.id;
  }

  const items = await prisma.inventoryItem.findMany({
    where: { name: { in: Array.from(new Set(OLD.flatMap((p) => p.recipe.map((r) => r.name)))) } },
    select: { name: true, id: true },
  });
  const itemByName = new Map(items.map((i) => [i.name, i.id]));

  const missing = OLD.flatMap((p) => p.recipe.map((r) => r.name)).filter((n) => !itemByName.has(n));
  if (missing.length) {
    throw new Error(`missing ingredients: ${Array.from(new Set(missing)).join(", ")}`);
  }

  let updated = 0;
  for (const p of OLD) {
    let row = await prisma.product.findFirst({ where: { name: p.name } });
    if (!row) {
      row = await prisma.product.create({
        data: { name: p.name, category_id: cats[p.category], selling_price: p.price,
          image_url: p.image_url, is_available: true },
      });
    } else {
      await prisma.product.update({
        where: { id: row.id },
        data: { category_id: cats[p.category], selling_price: p.price,
          image_url: p.image_url ?? row.image_url, is_available: true,
          cost_price: null, // clear legacy manual HPP → live-only costing
        },
      });
      updated++;
    }
    await prisma.recipeItem.deleteMany({ where: { product_id: row.id } });
    for (const r of p.recipe) {
      await prisma.recipeItem.create({
        data: { product_id: row.id, inventory_item_id: itemByName.get(r.name)!, quantity: r.qty },
      });
    }
  }

  // Verify live HPP per refreshed product
  console.log("[seed-refresh] refreshed " + updated + " old products with master recipes + cleared cost_price");
  const live = await prisma.product.findMany({
    include: { recipeItems: { include: { inventory_item: true } } },
  });
  for (const p of live) {
    const hpp = Math.round((p.recipeItems as any[]).reduce((s, ri) => s + Number(ri.quantity) * Number(ri.inventory_item.average_cost), 0));
    const cp = Number(p.cost_price ?? 0);
    console.log(`  ${p.name.padEnd(28)} price Rp${p.selling_price.toLocaleString("id").padStart(8)}  cost_price ${cp || "null"}  live HPP Rp${hpp.toLocaleString("id").padStart(8)}`);
  }

  console.log("[seed-refresh] done.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error("[seed-refresh] FAILED:", e); process.exit(1); });
