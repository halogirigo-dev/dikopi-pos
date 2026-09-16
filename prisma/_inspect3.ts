import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const prods = await prisma.product.findMany({
    where: { name: { in: ["Iced Americano", "Cappuccino", "Dikopispace"] } },
    include: { recipeItems: { include: { inventory_item: true } } },
  });
  console.log("=== rows named Iced Americano / Cappuccino / Dikopispace ===");
  for (const p of prods) {
    const bom = p.recipeItems.map((ri) => `${ri.inventory_item.name}×${ri.quantity}`).join(", ") || "NO_RECIPE";
    console.log(
      `  id=${p.id.slice(0, 8)} "${p.name}" avail=${p.is_available} price=${p.selling_price} cost_price=${p.cost_price} hpp_breakdown=${p.hpp_breakdown ? "SET" : "null"}\n    bom: ${bom}`
    );
  }
  // how many active products total + the full active list
  const active = await prisma.product.findMany({ where: { is_available: true }, select: { name: true } });
  console.log(`\nactive products (${active.length}): ${active.map((p) => p.name).join(", ")}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
