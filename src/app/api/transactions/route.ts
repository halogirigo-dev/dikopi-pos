import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";
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
          payment_method: payment_method as any,
          status: "COMPLETED" as any,
          amount_paid: paid,
          change_amount: change,
          items: { create: lineItems }
        },
        include: { items: true }
      });
      // paksa revalidate agar Dashboard/Finance/Cashflow/Reports/Transactions langsung fresh saat navigasi berikutnya
      try {
        revalidatePath("/dashboard");
        revalidatePath("/finance");
        revalidatePath("/cashflow");
        revalidatePath("/reports");
        revalidatePath("/transactions");
        revalidatePath("/pos");
      } catch {}
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
