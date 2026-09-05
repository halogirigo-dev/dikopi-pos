import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { name: "Owner", username: "admin", password_hash: hash, role: "ADMIN", is_active: true },
  });
  await prisma.user.upsert({
    where: { username: "kasir1" },
    update: {},
    create: { name: "Budi", username: "kasir1", password_hash: hash, role: "CASHIER", is_active: true },
  });
  await prisma.user.upsert({
    where: { username: "kasir2" },
    update: {},
    create: { name: "Andi", username: "kasir2", password_hash: hash, role: "CASHIER", is_active: true },
  });

  const catNames = ["Coffee", "Non Coffee", "Food", "Snack"];
  for (const n of catNames) {
    await prisma.category.upsert({ where: { name: n }, update: {}, create: { name: n } });
  }
  const expCats = ["Raw Material","Salary","Rent","Electricity","Water","Internet","Marketing","Transport","Maintenance","Other"];
  for (const n of expCats) {
    await prisma.expenseCategory.upsert({ where: { name: n }, update: {}, create: { name: n } });
  }

  const coffee = await prisma.category.findUnique({ where: { name: "Coffee" }});
  const nonCoffee = await prisma.category.findUnique({ where: { name: "Non Coffee" }});
  const food = await prisma.category.findUnique({ where: { name: "Food" }});
  const snack = await prisma.category.findUnique({ where: { name: "Snack" }});

  // Free stock images (Unsplash) - deterministic per menu name
  const IMG = {
    espresso: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=400&fit=crop&auto=format&q=80",
    americano: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop&auto=format&q=80",
    latte: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop&auto=format&q=80",
    cappuccino: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop&auto=format&q=80",
    beans: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=400&fit=crop&auto=format&q=80",
    matcha: "https://images.unsplash.com/photo-1515825838458-f2a94b20105a?w=400&h=400&fit=crop&auto=format&q=80",
    chocolate: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&h=400&fit=crop&auto=format&q=80",
    peach: "https://images.unsplash.com/photo-1544148103-005eec06c04d?w=400&h=400&fit=crop&auto=format&q=80",
  };

  const products = [
    { name: "Espresso", category_id: coffee!.id, selling_price: 10000, cost_price: 4500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"Cup & operasional",cost:1500}], image_url: IMG.espresso },
    { name: "Iced Americano", category_id: coffee!.id, selling_price: 17000, cost_price: 5000, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"water",cost:200},{name:"ice",cost:300},{name:"Cup & operasional",cost:1500}], image_url: IMG.americano },
    { name: "Caramel Latte", category_id: coffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"caramel syrup",cost:2000},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.latte },
    { name: "Hazelnut Latte", category_id: coffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"hazelnut syrup",cost:2000},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.latte },
    { name: "Butterscotch", category_id: coffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"butterscotch syrup",cost:2000},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.cappuccino },
    { name: "Cappuccino", category_id: coffee!.id, selling_price: 17000, cost_price: 7000, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"Cup & operasional",cost:1500}], image_url: IMG.cappuccino },
    { name: "Black Peach / Americano Peach", category_id: coffee!.id, selling_price: 18000, cost_price: 6700, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"peach syrup",cost:2000},{name:"water",cost:200},{name:"Cup & operasional",cost:1500}], image_url: IMG.peach },
    { name: "Matcha Latte", category_id: nonCoffee!.id, selling_price: 15000, cost_price: 7500, hpp_breakdown: [{name:"Matcha",cost:4000},{name:"milk",cost:2500},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.matcha },
    { name: "Matcha Nut", category_id: nonCoffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Matcha",cost:4000},{name:"cream",cost:2000},{name:"nut syrup",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.matcha },
    { name: "Chocolate Latte", category_id: nonCoffee!.id, selling_price: 15000, cost_price: 6500, hpp_breakdown: [{name:"Cocoa powder",cost:2500},{name:"milk",cost:2500},{name:"Cup & operasional",cost:1500}], image_url: IMG.chocolate },
    { name: "Chocolate Creamy Nut", category_id: nonCoffee!.id, selling_price: 17000, cost_price: 8000, hpp_breakdown: [{name:"Cocoa powder",cost:2500},{name:"cream",cost:2000},{name:"nut syrup",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.chocolate },
    { name: "Peach Coffee Latte", category_id: coffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"peach syrup",cost:2000},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.peach },
    { name: "Dikopispace", category_id: coffee!.id, selling_price: 17000, cost_price: 8500, hpp_breakdown: [{name:"Espresso",cost:3000},{name:"milk",cost:2500},{name:"gula aren",cost:1500},{name:"cream",cost:2000},{name:"Cup & operasional",cost:1500}], image_url: IMG.beans },
  ];
  for (const p of products) {
    const exists = await prisma.product.findFirst({ where: { name: p.name }});
    if (!exists) await prisma.product.create({ data: p as any });
    else if (!(exists as any).image_url) {
      await prisma.product.update({ where: { id: (exists as any).id }, data: { image_url: (p as any).image_url } });
    }
  }

  await prisma.setting.upsert({ where: { key: "opening_balance" }, update: {}, create: { key: "opening_balance", value: "5000000" } });
  await prisma.setting.upsert({ where: { key: "allow_cashier_expense" }, update: {}, create: { key: "allow_cashier_expense", value: "false" } });

  // sample transactions for current month
  const admin = await prisma.user.findUnique({ where: { username: "admin" }});
  const now = new Date();
  // create 3 sample days if no transactions
  const count = await prisma.transaction.count();
  if (count === 0) {
    const prods = await prisma.product.findMany();
    for (let day = 0; day < 3; day++) {
      const d = new Date(now); d.setDate(now.getDate() - day); d.setHours(10+day,0,0,0);
      const items = [prods[0], prods[1]].map(p=> ({
        product_id: p.id,
        product_name: p.name,
        selling_price: p.selling_price,
        cost_price: p.cost_price,
        quantity: 2 + day,
        revenue: p.selling_price * (2+day),
        cogs: p.cost_price * (2+day),
        gross_profit: (p.selling_price - p.cost_price) * (2+day),
      }));
      const total_rev = items.reduce((s,i)=>s+i.revenue,0);
      const total_cogs = items.reduce((s,i)=>s+i.cogs,0);
      const inv = `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-00${day+1}`;
      const tx = await prisma.transaction.create({ data: {
        invoice_number: inv,
        user_id: admin!.id,
        total_revenue: total_rev,
        total_cogs: total_cogs,
        gross_profit: total_rev - total_cogs,
        payment_method: day % 2 === 0 ? "CASH" : "QRIS",
        status: "COMPLETED",
        created_at: d,
      }});
      for (const it of items) {
        await prisma.transactionItem.create({ data: { transaction_id: tx.id, ...it }});
      }
    }
    // sample expenses
    const cat = await prisma.expenseCategory.findFirst();
    if (cat) {
      await prisma.expense.create({ data: { category_id: cat.id, description: "Pembelian susu", amount: 250000, payment_method: "CASH", expense_date: now, created_by: admin!.id, notes: "Seed" }});
      await prisma.expense.create({ data: { category_id: cat.id, description: "Listrik", amount: 500000, payment_method: "TRANSFER", expense_date: now, created_by: admin!.id }});
    }
  }

  console.log("Seed done");
}
main().then(()=>prisma.$disconnect()).catch(e=>{console.error(e); process.exit(1)});
