"use client";
import { useRouter } from "next/navigation";
export default function ReportsClient({ period }: { period:string }){
  const router=useRouter();
  return (
    <div className="filters">
      <select className="input" value={period} onChange={e=>router.push(`/reports?period=${e.target.value}`)}>
        <option value="thisMonth">This month</option><option value="today">Today</option><option value="thisWeek">This week</option><option value="lastMonth">Last month</option>
      </select>
    </div>
  );
}
