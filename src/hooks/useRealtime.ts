"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

type Table = "Transaction" | "Expense" | "Product" | "Category" | "TransactionItem" | "CashAdjustment";

export function useRealtimeRefresh(tables: Table[], opts?: { intervalMs?: number }) {
  const router = useRouter();
  const intervalMs = opts?.intervalMs ?? 15000;
  const tablesKey = tables.join(",");

  useEffect(() => {
    const supa = getSupabase();
    let channel: any = null;
    let interval: any = null;

    function refresh() {
      router.refresh();
    }

    if (supa) {
      channel = supa
        .channel("dikopi-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Transaction" },
          () => tables.includes("Transaction") && refresh()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Expense" },
          () => tables.includes("Expense") && refresh()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Product" },
          () => tables.includes("Product") && refresh()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Category" },
          () => tables.includes("Category") && refresh()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "TransactionItem" },
          () => tables.includes("TransactionItem") && refresh()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "CashAdjustment" },
          () => tables.includes("CashAdjustment") && refresh()
        )
        .subscribe();
    }

    // Fallback polling jika Realtime tidak aktif (env belum set) atau sebagai backup
    interval = setInterval(() => {
      if (!supa) refresh();
    }, intervalMs);

    return () => {
      if (channel && supa) supa.removeChannel(channel);
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, intervalMs]);
}
