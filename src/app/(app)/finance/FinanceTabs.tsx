"use client";
import { useRouter, useSearchParams } from "next/navigation";
export default function FinanceTabs({ tab, period }: { tab:string; period:string }){
  const router=useRouter(); const sp=useSearchParams();
  function go(t:string){ const p=new URLSearchParams(sp.toString()); p.set("tab",t); router.push(`/finance?${p.toString()}`); }
  function goPeriod(v:string){ const p=new URLSearchParams(sp.toString()); p.set("period",v); router.push(`/finance?${p.toString()}`); }
  return (
    <div style={{ marginBottom:16, display:"grid", gap:12 }}>
      <div data-onboarding="finance-tabs" className="segment">
        {[
          { id:"overview", label:"Overview" },
          { id:"cashflow", label:"Cashflow" },
          { id:"pnl", label:"P&L" },
        ].map(i=> <button key={i.id} className={tab===i.id?"active":""} onClick={()=>go(i.id)}>{i.label}</button>)}
      </div>
      <select className="input" value={period} onChange={e=>goPeriod(e.target.value)}>
        <option value="today">Today</option><option value="thisWeek">This Week</option><option value="thisMonth">This Month</option><option value="lastMonth">Last Month</option>
      </select>
    </div>
  );
}
