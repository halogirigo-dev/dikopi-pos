import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: any = {};
  if (from && to) where.created_at = { gte: new Date(from), lte: new Date(to) };
  if (session.user.role === "CASHIER") where.user_id = session.user.id;
  const data = await prisma.transaction.findMany({ where, include: { user: true, items: true }, orderBy: { created_at: "desc" }, take: 100 });
  return Response.json(data);
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const { items, payment_method } = body as { items: { product_id: string; quantity: number }[]; payment_method: string };
  if (!items?.length || !payment_method) return new Response("Missing fields", { status: 400 });

  // fetch products snapshot
  const productIds = items.map(i=>i.product_id);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const map = new Map(products.map(p=>[p.id,p]));
  let totalRevenue = 0, totalCogs = 0;
  const lineItems: any[] = [];
  for (const it of items) {
    const p = map.get(it.product_id);
    if (!p) return new Response(`Product not found ${it.product_id}`, { status: 400 });
    if (!p.is_available) return new Response(`Product not available ${p.name}`, { status: 400 });
    const qty = Number(it.quantity);
    const revenue = p.selling_price * qty;
    const cogs = p.cost_price * qty;
    totalRevenue += revenue;
    totalCogs += cogs;
    lineItems.push({
      product_id: p.id,
      product_name: p.name,
      selling_price: p.selling_price,
      cost_price: p.cost_price,
      quantity: qty,
      revenue, cogs, gross_profit: revenue - cogs
    });
  }
  const grossProfit = totalRevenue - totalCogs;

  // invoice number
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const countToday = await prisma.transaction.count({ where: { created_at: { gte: today, lt: tomorrow } }});
  let invoice = generateInvoiceNumber(new Date(), countToday);
  // retry if collision (rare)
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const tx = await prisma.transaction.create({
        data: {
          invoice_number: invoice,
          user_id: session.user.id,
          total_revenue: totalRevenue,
          total_cogs: totalCogs,
          gross_profit: grossProfit,
          payment_method,
          status: "COMPLETED",
          items: { create: lineItems }
        },
        include: { items: true }
      });
      return Response.json(tx);
    } catch (e: any) {
      if (e.code === "P2002") {
        invoice = generateInvoiceNumber(new Date(), countToday + attempt + 1);
        continue;
      }
      throw e;
    }
  }
  return new Response("Failed to create", { status: 500 });
}
