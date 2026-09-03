import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}K`;
  return formatRupiah(value);
}

export function calcMargin(revenue: number, profit: number): number {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
}

export function getMarginStatus(margin: number): { label: string; color: string } {
  if (margin >= 50) return { label: "Sehat", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
  if (margin >= 30) return { label: "Cukup", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Tipis", color: "text-red-600 bg-red-50 border-red-200" };
}

export function generateInvoiceNumber(date: Date, count: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const seq = String(count + 1).padStart(3, "0");
  return `INV-${y}${m}${d}-${seq}`;
}

export function getDateRange(period: string, customFrom?: string, customTo?: string) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "thisWeek": {
      const day = now.getDay() === 0 ? 6 : now.getDay() - 1;
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "thisMonth":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "lastMonth":
      start.setMonth(now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "custom":
      if (customFrom) {
        const c = new Date(customFrom);
        c.setHours(0, 0, 0, 0);
        return { from: c, to: customTo ? (() => { const t = new Date(customTo); t.setHours(23,59,59,999); return t; })() : end };
      }
      break;
  }
  return { from: start, to: end };
}
