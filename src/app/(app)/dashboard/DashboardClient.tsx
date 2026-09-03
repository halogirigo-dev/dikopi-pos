"use client";
import { useRouter } from "next/navigation";
export default function DashboardClient({ period }: { period: string }) {
  const router = useRouter();
  const options = [
    { v: "today", l: "Today" },
    { v: "yesterday", l: "Yesterday" },
    { v: "thisWeek", l: "This Week" },
    { v: "thisMonth", l: "This Month" },
    { v: "lastMonth", l: "Last Month" },
  ];
  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
      {options.map(o=> (
        <button key={o.v} onClick={()=>router.push(`/dashboard?period=${o.v}`)} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap border ${period===o.v ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600"}`}>{o.l}</button>
      ))}
    </div>
  );
}
