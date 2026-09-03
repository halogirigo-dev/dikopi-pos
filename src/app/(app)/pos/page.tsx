import { prisma } from "@/lib/prisma";
import POSClient from "./POSClient";
export default async function POSPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }});
  const products = await prisma.product.findMany({ where: { is_available: true }, include: { category: true }, orderBy: { name: "asc" }});
  return <POSClient categories={categories} products={products} />;
}
