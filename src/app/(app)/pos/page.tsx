import { prisma } from "@/lib/prisma";
import POSClient from "./POSClient";
import RealtimeRefresher from "@/components/RealtimeRefresher";
// POS must always show fresh recipe status — no cache, otherwise NO RECIPE badge stale after saving.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
