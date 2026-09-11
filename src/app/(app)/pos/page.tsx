import { prisma } from "@/lib/prisma";
import POSClient from "./POSClient";
import RealtimeRefresher from "@/components/RealtimeRefresher";
// POS menu is highly interactive - allow Next.js to cache at edge for 30s while keeping correctness.
// Revalidation ensures fresh data after product updates without hitting DB on every navigation.
export const revalidate = 30;

export default async function POSPage() {
  const [categories, products, recipes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }}),
    prisma.product.findMany({ where: { is_available: true }, include: { category: true }, orderBy: { name: "asc" }}),
    prisma.recipeItem.findMany({ select: { product_id: true } }),
  ]);
  const productIdsWithRecipe = Array.from(new Set(recipes.map(r=>r.product_id)));
  return (
    <>
      <RealtimeRefresher tables={["Product", "Category"]} intervalMs={10000} />
      <POSClient categories={categories} products={products} productIdsWithRecipe={productIdsWithRecipe} />
    </>
  );
}
