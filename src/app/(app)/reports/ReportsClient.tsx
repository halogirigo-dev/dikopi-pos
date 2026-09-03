"use client";
import { useRouter } from "next/navigation";
export default function ReportsClient({ period }: { period: string }) {
  const router = useRouter();
  const opts = ["today","thisWeek","thisMonth","lastMonth"].map(v=>({v,l:v}));
  return (
    <div className="flex gap-1">
      {opts.map(o=> <button key={o.v} onClick={()=>router.push(`/reports?period=${o.v}`)} className={`px-3 py-1.5 rounded-full text-xs border ${period===o.v ? "bg-zinc-900 text-white":"bg-white"}`}>{o.l}</button>)}
    </div>
  );
}
