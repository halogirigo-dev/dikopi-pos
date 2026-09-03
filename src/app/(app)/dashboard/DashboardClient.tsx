"use client";
import { useRouter } from "next/navigation";
export default function DashboardClient({ period }: { period: string }) {
  const router = useRouter();
  const opts = ["today","thisWeek","thisMonth","lastMonth"];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select className="input" value={period} onChange={e=>router.push(`/dashboard?period=${e.target.value}`)}>
        {opts.map(o=> <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
