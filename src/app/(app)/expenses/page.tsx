import { prisma } from "@/lib/prisma";
import ExpensesClient from "./ExpensesClient";
export default async function ExpensesPage() {
  const categories = await prisma.expenseCategory.findMany({ orderBy: { name: "asc" }});
  const expenses = await prisma.expense.findMany({ include: { category: true, creator: true }, orderBy: { expense_date: "desc" }, take: 100 });
  return <ExpensesClient categories={categories} expenses={expenses} />;
}
