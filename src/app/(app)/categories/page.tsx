import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";
export default async function CategoriesPage() {
  const cats = await prisma.category.findMany({ orderBy: { created_at: "desc" }});
  return <CategoriesClient categories={cats} />;
}
