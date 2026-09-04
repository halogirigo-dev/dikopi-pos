import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type NewProduct = {
  name: string;
  ingredients: string;
  price: number;
  category: string;
};

const newProducts: NewProduct[] = [
  { name: "Espresso", ingredients: "Espresso", price: 10000, category: "Coffee" },
  { name: "Iced Americano", ingredients: "Espresso, water, ice", price: 17000, category: "Coffee" },
  { name: "Caramel Latte", ingredients: "Espresso, milk, caramel syrup, cream", price: 17000, category: "Coffee" },
  { name: "Hazelnut Latte", ingredients: "Espresso, milk, hazelnut syrup, cream", price: 17000, category: "Coffee" },
  { name: "Butterscotch", ingredients: "Espresso, milk, butterscotch syrup, cream", price: 17000, category: "Coffee" },
  { name: "Cappuccino", ingredients: "Espresso, milk", price: 17000, category: "Coffee" },
  { name: "Black Peach / Americano Peach", ingredients: "Espresso, peach syrup, water", price: 18000, category: "Coffee" },
  { name: "Matcha Latte", ingredients: "Matcha, milk, cream", price: 15000, category: "Non Coffee" },
  { name: "Matcha Nut", ingredients: "Matcha, cream, nut syrup", price: 17000, category: "Non Coffee" },
  { name: "Chocolate Latte", ingredients: "Cocoa powder, milk", price: 15000, category: "Non Coffee" },
  { name: "Chocolate Creamy Nut", ingredients: "Cocoa powder, cream, nut syrup", price: 17000, category: "Non Coffee" },
  { name: "Peach Coffee Latte", ingredients: "Espresso, milk, peach syrup, cream", price: 17000, category: "Coffee" },
  { name: "Dikopispace", ingredients: "Espresso, milk, gula aren, cream", price: 17000, category: "Coffee" },
];

// Simple heuristic untuk cost_price: 35-45% dari selling_price tergantung ingredients
// Base cost mapping per ingredient (estimasi Rupiah)
const ingredientCost: Record<string, number> = {
  "espresso": 3000,
  "water": 200,
  "ice": 300,
  "milk": 2500,
  "caramel syrup": 2000,
  "hazelnut syrup": 2000,
  "butterscotch syrup": 2000,
  "peach syrup": 2000,
  "peach": 1500,
  "nut syrup": 2000,
  "matcha": 4000,
  "cocoa powder": 2500,
  "cream": 2000,
  "gula aren": 1500,
  "sugar": 500,
};

function estimateCost(ingredients: string, selling_price: number): number {
  const parts = ingredients.split(",").map(s => s.trim().toLowerCase());
  let sum = 0;
  for (const p of parts) {
    // cari key yang match substring
    let found = 0;
    for (const [k, v] of Object.entries(ingredientCost)) {
      if (p.includes(k) || k.includes(p)) { found = v; break; }
    }
    if (!found) found = 1000; // fallback
    sum += found;
  }
  // cup + operasional minimal 1500
  sum += 1500;
  // clamp agar tidak > 50% atau < 25% dari harga jual
  const min = Math.round(selling_price * 0.28);
  const max = Math.round(selling_price * 0.50);
  return Math.min(max, Math.max(min, sum));
}

async function main() {
  console.log("Updating products...");
  for (const p of newProducts) {
    const cat = await prisma.category.findUnique({ where: { name: p.category } });
    if (!cat) throw new Error(`Category not found: ${p.category}`);
    const cost = estimateCost(p.ingredients, p.price);
    const breakdown = p.ingredients.split(",").map(s => s.trim()).map(name => {
      const low = name.toLowerCase();
      let c = 0;
      for (const [k, v] of Object.entries(ingredientCost)) {
        if (low.includes(k) || k.includes(low)) { c = v; break; }
      }
      if (!c) c = 1000;
      return { name, cost: c };
    });
    // tambah cup
    breakdown.push({ name: "Cup & operasional", cost: 1500 });

    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          category_id: cat.id,
          selling_price: p.price,
          cost_price: cost,
          hpp_breakdown: breakdown,
          is_available: true,
        },
      });
      console.log(`Updated: ${p.name} -> ${p.price} | cost ${cost} | ${p.category}`);
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          category_id: cat.id,
          selling_price: p.price,
          cost_price: cost,
          hpp_breakdown: breakdown,
          is_available: true,
        },
      });
      console.log(`Created: ${p.name} -> ${p.price} | cost ${cost} | ${p.category}`);
    }
  }

  // Nonaktifkan produk lama yang tidak ada di menu baru (keep history)
  const keepNames = new Set(newProducts.map(p => p.name));
  const all = await prisma.product.findMany();
  for (const prod of all) {
    if (!keepNames.has(prod.name)) {
      await prisma.product.update({ where: { id: prod.id }, data: { is_available: false } });
      console.log(`Deactivated (not in new menu): ${prod.name}`);
    }
  }

  console.log("\nFinal product list:");
  const final = await prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  for (const f of final) {
    console.log(`${f.is_available ? "✓" : "✗"} ${f.name.padEnd(30)} | ${f.category.name.padEnd(10)} | Rp ${String(f.selling_price).padStart(5)} | cost Rp ${String(f.cost_price).padStart(5)} | ${JSON.stringify(f.hpp_breakdown)}`);
  }
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); process.exit(1); });
