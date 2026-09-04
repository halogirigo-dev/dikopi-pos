"use client";
import { useRealtimeRefresh } from "@/hooks/useRealtime";

export default function RealtimeRefresher({ tables, intervalMs }: { tables: ("Transaction" | "Expense" | "Product" | "Category" | "TransactionItem" | "CashAdjustment")[]; intervalMs?: number }) {
  useRealtimeRefresh(tables, { intervalMs });
  return null;
}
