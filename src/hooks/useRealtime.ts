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

    // juga refresh saat POS selesai transaksi di tab yang sama (custom event) atau saat tab kembali fokus
    const onCustom = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onFocus = () => refresh();
    window.addEventListener("dikopi:refresh" as any, onCustom);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

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

    // Fallback polling — selalu aktif sebagai backup jika realtime delay/gagal
    // polling ringan 12-15s, router.refresh() akan revalidate server components
    interval = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => {
      if (channel && supa) supa.removeChannel(channel);
      if (interval) clearInterval(interval);
      window.removeEventListener("dikopi:refresh" as any, onCustom);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, intervalMs]);
}
