import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";
export default async function ProductsPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" }});
  const products = await prisma.product.findMany({ include: { category: true }, orderBy: { created_at: "desc" }});
  return <ProductsClient categories={categories} products={products} />;
}
