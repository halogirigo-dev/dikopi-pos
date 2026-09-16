import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  // 1. current inventory
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  console.log("=== INVENTORY ITEMS ===");
  for (const it of items) {
    console.log(`  [${it.is_active?"A":"X"}] ${it.name.padEnd(24)} unit=${it.unit.padEnd(5)} type=${it.item_type.padEnd(11)} stock=${it.current_stock} avg=${it.average_cost}`);
  }
  // 2. espresso shot details
  const esps = await prisma.inventoryRecipe.findMany({ include: { input_item: { select: { name: true, average_cost: true } }, output_item: { select: { name: true, average_cost: true, current_stock: true } } } });
  console.log("\n=== ESPRESSO BLEND BOM ===");
  for (const r of esps) {
    console.log(`  ${r.output_item.name} (stock=${r.output_item.current_stock}, avg=${r.output_item.average_cost}) <- ${r.input_item.name} qty=${r.quantity} (in avg=${r.input_item.average_cost})`);
  }
  // 3. products: all active
  const active = await prisma.product.findMany({ where: { is_available: true }, include: { recipeItems: { include: { inventory_item: { select: { name: true, unit: true, average_cost: true } } } } }, orderBy: { name: "asc" } });
  console.log(`\n=== ACTIVE PRODUCTS (${active.length}) ===`);
  for (const p of active) {
    const ritems = p.recipeItems as any[];
    const hpp = Math.round(ritems.reduce((s: number, ri: any) => s + Number(ri.quantity) * Number(ri.inventory_item?.average_cost ?? 0), 0));
    console.log(`  ${p.name.padEnd(32)} Rp${String(p.selling_price).padStart(5)}  HPP=${String(hpp).padStart(5)}  ${ritems.map((r:any)=>`${r.inventory_item?.name??"?"} ${r.quantity}${r.inventory_item?.unit??""}`).join(", ")||"(no recipe)"}`);
  }
  // 4. transactions
  const tx = await prisma.transaction.count();
  const ti = await prisma.transactionItem.count();
  console.log(`\nHISTORICAL TX: ${tx} transactions, ${ti} items`);
}
main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e);process.exit(1)});
