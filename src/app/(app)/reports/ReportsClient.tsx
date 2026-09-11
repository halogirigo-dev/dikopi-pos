"use client";
import { useRouter, useSearchParams } from "next/navigation";
export default function ReportsClient({ period }: { period:string }){
  const router=useRouter();
  const sp=useSearchParams();
  function goPeriod(v:string){
    const p=new URLSearchParams(sp.toString());
    p.set("period",v);
    router.push(`/reports?${p.toString()}`);
  }
  function goView(v:string){
    const p=new URLSearchParams(sp.toString());
    if(v) p.set("view",v); else p.delete("view");
    router.push(`/reports?${p.toString()}`);
  }
  const view=sp.get("view")||"";
  return (
    <div data-onboarding="reports-filter" className="filters" style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
      <select className="input" value={period} onChange={e=>goPeriod(e.target.value)} style={{ minWidth:140 }}>
        <option value="thisMonth">This month</option><option value="today">Today</option><option value="thisWeek">This week</option><option value="lastMonth">Last month</option>
      </select>
      <select className="input" value={view} onChange={e=>goView(e.target.value)} style={{ minWidth:140 }}>
        <option value="">P&L</option><option value="products">Products</option><option value="cogs">COGS</option>
      </select>
    </div>
  );
}
