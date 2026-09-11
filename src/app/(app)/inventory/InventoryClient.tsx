"use client";
import { useState, useEffect, useMemo } from "react";
import { formatRupiah } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Segment } from "@/components/ui/segment";

// Client-side helpers mirroring server getStockStatusMeta — do not duplicate thresholds
function statusMeta(s: string) {
  switch (s) {
    case "OUT": return { label: "OUT OF STOCK", short: "OUT OF STOCK", icon: "●", color: "#DC2626", bg: "#FEE2E2", bar: "#DC2626" };
    case "CRITICAL": return { label: "CRITICAL", short: "CRITICAL", icon: "●", color: "#DC2626", bg: "#FEE2E2", bar: "#EF4444" };
    case "LOW": return { label: "LOW", short: "LOW", icon: "●", color: "#B45309", bg: "#FEF3C7", bar: "#F59E0B" };
    default: return { label: "SAFE", short: "SAFE", icon: "●", color: "#15803D", bg: "#DCFCE7", bar: "#22C55E" };
  }
}
function typeMeta(t: string) {
  if (t === "SEMI_FINISH") return { label: "SEMI", long: "SEMI-FINISH", color: "#A66A3F", bg: "#F4E9E0", border: "#EAD9C8" };
  return { label: "BASE", long: "BASE", color: "#6B6B6B", bg: "#F2F1ED", border: "#E5E3DE" };
}
function fmtQty(qty: number, unit: string) {
  const s = qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2).replace(/\.?0+$/, "");
  return `${s} ${unit}`;
}
function normalizeQty(qty: number, unit: string): string {
  // 2000 g → 2 kg, 1500 ml → 1.5 liter, keep pcs/bottle as is
  if (unit === "g" && qty >= 1000) return fmtQty(qty / 1000, "kg");
  if (unit === "ml" && qty >= 1000) return fmtQty(qty / 1000, "liter");
  return fmtQty(qty, unit);
}
function fmtTarget(target: number | null, unit: string) {
  if (target == null) return "—";
  return normalizeQty(target, unit);
}
function fmtDate(d: string | Date | null) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
function fmtDateLong(d: string | Date | null) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function StockBar({ pct, status }: { pct: number; status: string }) {
  const m = statusMeta(status);
  return (
    <div aria-label={`Stock level ${Math.round(pct)} percent`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} style={{ height: 6, background: "#E5E3DE", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", background: m.bar, borderRadius: 999, transition: "width .4s ease" }} />
    </div>
  );
}

function RunwayTimeline({ current, unit, runOutDate, runwayDays, hasForecast }: { current: number; unit: string; runOutDate: any; runwayDays: number | null; hasForecast: boolean }) {
  if (!hasForecast || runwayDays == null) {
    return (
      <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14, textAlign: "center", border: "1px dashed var(--border)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>No forecast yet</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Not enough consumption data.<br />Continue recording sales to estimate how long this stock will last.</div>
      </div>
    );
  }
  const todayLabel = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const outLabel = fmtDate(runOutDate);
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em" }}>TODAY</div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{todayLabel}</div>
          <div className="muted" style={{ fontSize: 11 }}>{fmtQty(current, unit)} remaining</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "0 8px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, background: "#fff", border: "1px solid var(--border)", borderRadius: 999, padding: "4px 10px" }}>~{runwayDays} DAYS</div>
          <div style={{ width: "100%", height: 4, background: "var(--border)", borderRadius: 999, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, var(--border) 0 6px, transparent 6px 10px)" }} />
            <div style={{ position: "absolute", left: 0, top: -4, width: 8, height: 8, borderRadius: "50%", background: "#111" }} />
            <div style={{ position: "absolute", right: 0, top: -4, width: 8, height: 8, borderRadius: "50%", background: statusMeta(runwayDays <= 3 ? "CRITICAL" : runwayDays <= 7 ? "LOW" : "SAFE").bar }} />
          </div>
          <div style={{ width: "100%", height: 2, background: "linear-gradient(90deg, #22C55E, #F59E0B, #EF4444)", borderRadius: 999, opacity: 0.9 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em" }}>RUN OUT</div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{outLabel}</div>
          <div className="muted" style={{ fontSize: 11 }}>≈ 0 {unit}</div>
        </div>
      </div>
    </div>
  );
}

function DepletionChart({ current, avgDaily, runwayDays, hasForecast, unit }: { current: number; avgDaily: number; runwayDays: number | null; hasForecast: boolean; unit: string }) {
  if (!hasForecast || avgDaily <= 0 || runwayDays == null) {
    return (
      <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14, textAlign: "center", border: "1px dashed var(--border)" }}>
        <div className="muted" style={{ fontSize: 12 }}>No recent consumption</div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Chart appears after sales consume this item.</div>
      </div>
    );
  }
  const totalDays = Math.max(1, Math.ceil(runwayDays));
  const maxPoints = 6;
  const step = Math.max(1, Math.ceil(totalDays / (maxPoints - 1)));
  const points: { d: number; stock: number }[] = [];
  for (let d = 0; d <= totalDays; d += step) points.push({ d, stock: Math.max(0, current - avgDaily * d) });
  if (points[points.length - 1].d !== totalDays) points.push({ d: totalDays, stock: 0 });
  const maxStock = Math.max(current, 1);
  const W = 100, H = 60;
  const pad = 6;
  // Build SVG path
  const coords = points.map((p, i) => {
    const x = pad + (p.d / totalDays) * (W - pad * 2);
    const y = pad + (1 - p.stock / maxStock) * (H - pad * 2);
    return { x, y, p };
  });
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = `${pathD} L ${coords[coords.length - 1].x} ${H - pad} L ${coords[0].x} ${H - pad} Z`;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".06em" }}>EXPECTED DEPLETION</div>
        <div className="muted" style={{ fontSize: 11 }}>{avgDaily.toFixed(2)} {unit}/day</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 72, display: "block" }}>
        <path d={areaD} fill="var(--surface2)" stroke="none" />
        <path d={pathD} fill="none" stroke="#1F2933" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={i === 0 || i === coords.length - 1 ? 2.2 : 1.6} fill={i === coords.length - 1 ? "#DC2626" : "#1F2933"} stroke="#fff" strokeWidth={0.8} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--muted)" }}>
        {coords.filter((_, i) => i % 2 === 0 || i === coords.length - 1).map((c, i) => (
          <span key={i} style={{ textAlign: "center" }}>
            <span style={{ display: "block", fontWeight: 700, color: "var(--text)", fontSize: 11 }}>{c.p.stock.toFixed(1)} {unit}</span>
            {c.p.d === 0 ? "Today" : `+${c.p.d}d`}
          </span>
        ))}
      </div>
      <div className="muted" style={{ fontSize: 10, marginTop: 8, textAlign: "center" }}>If consumption continues, stock reaches ~0 on <b style={{ color: "var(--text)" }}>{fmtDateLong(new Date(new Date().setDate(new Date().getDate() + totalDays)))}</b>.</div>
    </div>
  );
}

export default function InventoryClient({ initialOverview, products, windowDays }: { initialOverview: any; products: any[]; windowDays: number }) {
  const [tab, setTab] = useState<"overview" | "items" | "movements" | "recipes" | "blending">("overview");
  // Ensure Dates came as ISO strings from page.tsx serialization
  const [overview, setOverview] = useState(initialOverview);
  const [items, setItems] = useState<any[]>(initialOverview.items || []);
  const [movements, setMovements] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", sku: "", unit: "g", current_stock: "", minimum_stock: "", target_stock: "", average_cost: "", item_type: "BASE" as "BASE" | "SEMI_FINISH" });
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BASE" | "SEMI_FINISH">("ALL");
  const [purchase, setPurchase] = useState({ inventory_item_id: "", quantity: "", unit_cost: "", note: "" });
  const [showPurchase, setShowPurchase] = useState(false);
  const [adjust, setAdjust] = useState({ inventory_item_id: "", quantity: "", type: "ADJUSTMENT", note: "" });
  const [showAdjust, setShowAdjust] = useState(false);
  const [recipeProductId, setRecipeProductId] = useState<string>(products[0]?.id || "");
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [recipeDraft, setRecipeDraft] = useState<{ inventory_item_id: string; quantity: string }[]>([]);
  // Semi-finish blending (Arabica+Robusta -> Espresso)
  const [semiOutputId, setSemiOutputId] = useState<string>("");
  const [semiBom, setSemiBom] = useState<any[]>([]);
  const [semiDraft, setSemiDraft] = useState<{ input_item_id: string; quantity: string }[]>([]);
  const [produceQty, setProduceQty] = useState<string>("");
  const [produceNote, setProduceNote] = useState<string>("");
  const [showProduce, setShowProduce] = useState(false);
  const router = useRouter();

  async function refreshOverview() {
    const res = await fetch(`/api/inventory/overview?window=${windowDays}`);
    if (res.ok) {
      const d = await res.json();
      setOverview(d);
      setItems(d.items || []);
    }
  }
  async function fetchItems() {
    const res = await fetch("/api/inventory/items");
    if (res.ok) {
      const d = await res.json();
      // items API returns raw InventoryItem, not RunwayInfo — merge with overview for visuals if possible
      // For simplicity reload overview to have runway; keep raw for form
      setItems(d);
      // try to refetch overview to have runway sync
      refreshOverview();
    }
  }
  async function fetchMovements() {
    const res = await fetch("/api/inventory/movements?limit=50");
    if (res.ok) {
      const d = await res.json();
      setMovements(d.data);
    }
  }
  async function fetchRecipe(productId: string) {
    const res = await fetch(`/api/inventory/recipes?product_id=${productId}`);
    if (res.ok) {
      const d = await res.json();
      setRecipeItems(d);
      setRecipeDraft(d.map((r: any) => ({ inventory_item_id: r.inventory_item_id, quantity: String(r.quantity) })));
    } else {
      setRecipeItems([]);
      setRecipeDraft([]);
    }
  }
  async function fetchSemiBom(outputId: string) {
    if (!outputId) { setSemiBom([]); setSemiDraft([]); return; }
    const res = await fetch(`/api/inventory/semi-recipes?output_item_id=${outputId}`);
    if (res.ok) {
      const d = await res.json();
      setSemiBom(d);
      setSemiDraft(d.map((r: any) => ({ input_item_id: r.input_item_id, quantity: String(r.quantity) })));
    } else { setSemiBom([]); setSemiDraft([]); }
  }
  async function saveSemiBom() {
    if (!semiOutputId) return alert("Pilih semi-finish dulu");
    const clean = semiDraft.filter(r=> r.input_item_id && Number(r.quantity)>0);
    const seen=new Set<string>(); for(const r of clean) if(seen.has(r.input_item_id)) return alert("Duplikat bahan"), seen.add(r.input_item_id); else seen.add(r.input_item_id);
    const res=await fetch("/api/inventory/semi-recipes",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({output_item_id:semiOutputId, items: clean.map(r=>({input_item_id:r.input_item_id, quantity:Number(r.quantity)}))})});
    if(res.ok){ alert("BOM blending disimpan"); fetchSemiBom(semiOutputId); } else alert(await res.text());
  }
  async function doProduce(){
    if(!semiOutputId || !produceQty || !(Number(produceQty)>0)) return alert("Pilih output & qty");
    const res=await fetch("/api/inventory/produce",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({output_item_id:semiOutputId, quantity:Number(produceQty), note: produceNote})});
    if(res.ok){ const d=await res.json(); alert(`Berhasil blend ${d.output.name} x${produceQty} (cost ${formatRupiah(d.unit_cost)}/shot)`); setShowProduce(false); setProduceQty(""); setProduceNote(""); await refreshOverview(); if(tab==="movements") fetchMovements(); } else alert(await res.text());
  }
  useEffect(() => {
    if (tab === "movements") fetchMovements();
    if (tab === "recipes" && recipeProductId) fetchRecipe(recipeProductId);
  }, [tab]);
  useEffect(() => {
    if (tab === "recipes" && recipeProductId) fetchRecipe(recipeProductId);
  }, [recipeProductId]);
  useEffect(()=>{ if(semiOutputId) fetchSemiBom(semiOutputId); },[semiOutputId]);
  // Auto-refresh when POS transaction fires (fix “stock tidak terupdate” tanpa reload manual)
  useEffect(() => {
    const handler = () => { refreshOverview(); if (tab === "movements") fetchMovements(); };
    if (typeof window !== "undefined") {
      window.addEventListener("dikopi:refresh", handler);
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshOverview(); });
    }
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("dikopi:refresh", handler);
    };
  }, [tab, windowDays]);

  // Use runway-sorted overview items for dashboard; for items tab use filtered runway items with search + type filter
  const displayItems = useMemo(() => overview.items || [], [overview.items]);
  const filteredDisplay = useMemo(() => {
    let arr = displayItems;
    if (typeFilter !== "ALL") arr = arr.filter((it:any)=> (it.item_type||"BASE")===typeFilter);
    if (!search) return arr;
    const q = search.toLowerCase();
    return arr.filter((it: any) => it.name.toLowerCase().includes(q) || (it.sku && it.sku.toLowerCase().includes(q)));
  }, [displayItems, search, typeFilter]);
  const semiItems = useMemo(()=> displayItems.filter((it:any)=> (it.item_type||"BASE")==="SEMI_FINISH"),[displayItems]);
  const baseItems = useMemo(()=> displayItems.filter((it:any)=> (it.item_type||"BASE")==="BASE"),[displayItems]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", sku: "", unit: "g", current_stock: "", minimum_stock: "", target_stock: "", average_cost: "", item_type: "BASE" });
    setShowItemForm(true);
  }
  function openEdit(it: any) {
    setEditing(it);
    setForm({
      name: it.name,
      sku: it.sku || "",
      unit: it.unit,
      current_stock: String(it.current_stock),
      minimum_stock: String(it.minimum_stock),
      target_stock: it.target_stock != null ? String(it.target_stock) : "",
      average_cost: String(it.average_cost),
      item_type: (it.item_type as any) || "BASE",
    });
    setShowItemForm(true);
  }
  async function submitItem() {
    if (!form.name.trim() || !form.unit.trim()) return alert("Nama & satuan wajib");
    const payload: any = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      unit: form.unit.trim(),
      minimum_stock: form.minimum_stock ? Number(form.minimum_stock) : 0,
      target_stock: form.target_stock ? Number(form.target_stock) : null,
      average_cost: form.average_cost ? Number(form.average_cost) : 0,
      item_type: form.item_type,
    };
    if (!editing) payload.current_stock = form.current_stock ? Number(form.current_stock) : 0;
    const url = editing ? `/api/inventory/items/${editing.inventory_item_id || editing.id}` : "/api/inventory/items";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      setShowItemForm(false);
      await refreshOverview();
    } else alert(await res.text());
  }
  async function doPurchase() {
    if (!purchase.inventory_item_id || !purchase.quantity || !purchase.unit_cost) return alert("Lengkapi data");
    const res = await fetch("/api/inventory/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_item_id: purchase.inventory_item_id, quantity: Number(purchase.quantity), unit_cost: Number(purchase.unit_cost), note: purchase.note }),
    });
    if (res.ok) {
      setShowPurchase(false);
      setPurchase({ inventory_item_id: "", quantity: "", unit_cost: "", note: "" });
      await refreshOverview();
      if (tab === "movements") fetchMovements();
    } else alert(await res.text());
  }
  async function doAdjust() {
    if (!adjust.inventory_item_id || !adjust.quantity) return alert("Lengkapi data");
    const res = await fetch("/api/inventory/adjustment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory_item_id: adjust.inventory_item_id, quantity: Number(adjust.quantity), type: adjust.type, note: adjust.note }),
    });
    if (res.ok) {
      setShowAdjust(false);
      setAdjust({ inventory_item_id: "", quantity: "", type: "ADJUSTMENT", note: "" });
      await refreshOverview();
      if (tab === "movements") fetchMovements();
    } else alert(await res.text());
  }
  async function saveRecipe() {
    const clean = recipeDraft.filter((r) => r.inventory_item_id && Number(r.quantity) > 0);
    const seen = new Set<string>();
    for (const r of clean) if (seen.has(r.inventory_item_id)) return alert("Duplikat bahan"), seen.add(r.inventory_item_id); else seen.add(r.inventory_item_id);
    const res = await fetch("/api/inventory/recipes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: recipeProductId, items: clean.map((r) => ({ inventory_item_id: r.inventory_item_id, quantity: Number(r.quantity) })) }),
    });
    if (res.ok) { alert("Resep disimpan"); fetchRecipe(recipeProductId); } else alert(await res.text());
  }

  const forecast = overview.forecast;
  const counts = overview.counts || { total: 0, safe: 0, low: 0, critical: 0, out: 0 };

  return (
    <div style={{ display: "grid", gap: 12, paddingBottom: 24 }}>
      {/* Tabs — single glass bubble shared layout */}
      <Segment
        items={[
          { id: "overview", label: "Stok" },
          { id: "items", label: "Kelola" },
          { id: "movements", label: "Riwayat" },
          { id: "recipes", label: "Resep" },
          { id: "blending", label: "Blending" },
        ]}
        active={tab}
        onChange={(v) => setTab(v as any)}
        style={{ maxWidth: 640 }}
      />

      {/* Window selector */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em" }}>WINDOW KONSUMSI</span>
        {[7, 14, 30, 60].map((w) => (
          <button key={w} className={`cat ${windowDays === w ? "active" : ""}`} style={{ minHeight: 32, padding: "6px 12px", fontSize: 12 }} onClick={() => router.push(`/inventory?window=${w}`)}>
            {w} hari
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* QUICK SUMMARY per spec §8 */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em" }}>TOTAL ITEMS</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1 }}>{counts.total}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Stock items tracked • Base {baseItems.length} • Semi {semiItems.length}</div>
                <div className="muted" style={{ fontSize:10, marginTop:4, display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={{ background: typeMeta("BASE").bg, color: typeMeta("BASE").color, padding:"2px 6px", borderRadius:999, border:`1px solid ${typeMeta("BASE").border}`, fontWeight:700 }}>BASE</span>
                  <span style={{ background: typeMeta("SEMI_FINISH").bg, color: typeMeta("SEMI_FINISH").color, padding:"2px 6px", borderRadius:999, border:`1px solid ${typeMeta("SEMI_FINISH").border}`, fontWeight:700 }}>SEMI</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1, maxWidth: 220 }}>
                <div style={{ background: "#DCFCE7", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#15803D" }}>{counts.safe}</div><div style={{ fontSize: 10, fontWeight: 700, color: "#15803D", letterSpacing: ".06em" }}>SAFE</div>
                </div>
                <div style={{ background: "#FEF3C7", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#B45309" }}>{counts.low}</div><div style={{ fontSize: 10, fontWeight: 700, color: "#B45309", letterSpacing: ".06em" }}>LOW</div>
                </div>
                <div style={{ background: widths(counts.critical), borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#DC2626" }}>{counts.critical}</div><div style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", letterSpacing: ".06em" }}>CRITICAL</div>
                </div>
                <div style={{ background: counts.out ? "#FEE2E2" : "#F5F5F5", borderRadius: 10, padding: "8px 10px", textAlign: "center", border: counts.out ? "1px solid #FECACA" : "1px solid var(--border)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: counts.out ? "#DC2626" : "var(--muted)" }}>{counts.out}</div><div style={{ fontSize: 10, fontWeight: 700, color: counts.out ? "#DC2626" : "var(--muted)", letterSpacing: ".06em" }}>OUT</div>
                </div>
              </div>
            </div>
          </div>

          {/* Projected Restock */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em" }}>PROJECTED RESTOCK</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginTop: 6, letterSpacing: ".06em" }}>NEXT 7 DAYS <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(forecast)</span></div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{formatRupiah(forecast.forecast7 || 0)}</div>
              <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>Estimated • not actual expense</div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: ".08em", visibility: "hidden" }}>PROJECTED</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginTop: 6, letterSpacing: ".06em" }}>NEXT 30 DAYS <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(forecast)</span></div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{formatRupiah(forecast.forecast30 || 0)}</div>
              <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>Estimated • not actual</div>
            </div>
          </div>
          <div className="card" style={{ padding: 12, background: "var(--surface2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700 }}>Restock now (to target)</div>
              <div className="muted" style={{ fontSize: 11 }}>{overview.reorderList?.length || 0} items needing restock</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{formatRupiah(forecast.immediateReorderCost || 0)}</div>
              <div className="muted" style={{ fontSize: 10 }}>Forecast • estimated</div>
            </div>
          </div>

          {/* Type filter BASE vs SEMI */}
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <span className="muted" style={{ fontSize:11, fontWeight:700, letterSpacing:".06em" }}>KLASIFIKASI</span>
            <Segment items={[{id:"ALL", label:`Semua (${displayItems.length})`},{id:"BASE", label:`Base (${baseItems.length})`},{id:"SEMI_FINISH", label:`Semi (${semiItems.length})` }]} active={typeFilter} onChange={v=> setTypeFilter(v as any)} style={{ maxWidth: 420 }} />
          </div>
          {/* Search inline */}
          <input className="input" placeholder="Cari bahan / SKU..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minHeight: 44 }} />

          {/* STOCK NEEDING ATTENTION — sorted OUT→CRITICAL→LOW→SAFE (§7) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em" }}>STOCK NEEDING ATTENTION</div>
            <span className="muted" style={{ fontSize: 11 }}>{filteredDisplay.length} items • window {overview.windowDays}d</span>
          </div>

          {/* STOCK NEEDING ATTENTION vs All Stock §14 */}
          {(() => {
            const attention = filteredDisplay.filter((it: any) => it.stock_status !== "SAFE");
            const safeOnly = filteredDisplay.filter((it: any) => it.stock_status === "SAFE");
            const renderCard = (it: any) => {
              const m = statusMeta(it.stock_status);
              const hasForecast = it.has_forecast && it.runway_days != null;
              const isOut = it.stock_status === "OUT";
              const stockQty = normalizeQty(it.current_stock, it.unit);
              const targetLabel = fmtTarget(it.target_stock, it.unit);
              return (
                <div key={it.inventory_item_id} className="card" style={{ padding: 14, cursor: "pointer", display: "grid", gap: 10 }} onClick={() => setSelected(it)} role="button" tabIndex={0} aria-label={`${it.name} ${m.label} ${hasForecast ? `${it.runway_days} hari` : isOut ? "habis" : "tanpa data"}`}>
                  {/* Header: name + type + status pill */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                      <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                        {(() => { const tm=typeMeta(it.item_type||"BASE"); return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 6px", borderRadius:999, background:tm.bg, color:tm.color, border:`1px solid ${tm.border}`, fontSize:9, fontWeight:800, letterSpacing:".06em" }}>{tm.label}</span>; })()}
                        <span className="muted" style={{ fontSize:10 }}>{it.unit} • {it.sku || "no SKU"}</span>
                      </div>
                    </div>
                    <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 999, background: m.bg, color: m.color, fontSize: 10, fontWeight: 800, letterSpacing: ".06em", lineHeight: 1 }}>
                      <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, display: "inline-block" }} />
                      {m.label}
                    </span>
                  </div>

                  {/* Hero: current stock — strongest hierarchy */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1 }}>{stockQty}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 600 }}>target {targetLabel}</div>
                  </div>

                  {/* Bar — compact 6px, less noise */}
                  <div style={{ height: 6, background: "#E5E3DE", borderRadius: 999, overflow: "hidden" }} role="progressbar" aria-valuenow={Math.round(it.bar_pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`Stok ${Math.round(it.bar_pct)} persen`}>
                    <div style={{ width: `${Math.min(100, Math.max(0, it.bar_pct))}%`, height: "100%", background: m.bar, borderRadius: 999, transition: "width .4s ease" }} />
                  </div>

                  {/* Runway + restock — single integrated row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", background: "var(--surface2)", borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ minWidth: 0 }}>
                      {isOut ? (
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", lineHeight: 1.3 }}>Habis • restock sekarang</div>
                      ) : hasForecast ? (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>~{it.runway_days} hari lagi</div>
                          <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Habis {fmtDate(it.run_out_date)} • {it.avg_daily_consumption.toFixed(1)} {it.unit}/hari</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text2)" }}>Belum ada data pakai</div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".07em", color: "var(--text2)", lineHeight: 1 }}>BIAYA RESTOCK</div>
                      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 2, color: it.reorder_needed ? "var(--text)" : "var(--text2)" }}>{it.reorder_needed ? formatRupiah(it.reorder_cost) : "—"}</div>
                      {it.reorder_needed && it.reorder_quantity != null && (
                        <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 1 }}>{normalizeQty(it.reorder_quantity, it.unit)} • ke target</div>
                      )}
                    </div>
                  </div>

                  {/* Actions — low noise, 40px meets tap target */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" style={{ flex: 1, minHeight: 40, padding: "8px 10px", fontSize: 13, fontWeight: 600, borderRadius: 10 }} onClick={(e) => { e.stopPropagation(); setSelected(it); }}>Detail</button>
                    <button className="btn accent" style={{ flex: 1, minHeight: 40, padding: "8px 10px", fontSize: 13, fontWeight: 600, borderRadius: 10 }} onClick={(e) => { e.stopPropagation(); setPurchase({ inventory_item_id: it.inventory_item_id, quantity: "", unit_cost: String(it.average_cost), note: "" }); setShowPurchase(true); }}>{isOut ? "Restock sekarang" : it.reorder_needed ? "Restock" : "Beli"}</button>
                  </div>
                </div>
              );
            };
            return (
              <>
                <div style={{ display: "grid", gap: 12 }}>
                  {attention.length ? attention.map(renderCard) : <div className="card" style={{ padding: 20, textAlign: "center" }}><span className="muted" style={{ fontSize: 13 }}>All caught up — no stock needs attention</span></div>}
                </div>
                {attention.length > 0 && safeOnly.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em", marginTop: 16 }}>ALL STOCK</div>
                    <div style={{ display: "grid", gap: 12 }}>{safeOnly.map(renderCard)}</div>
                  </>
                )}
                {attention.length === 0 && safeOnly.length > 0 && (
                  <div style={{ display: "grid", gap: 12 }}>{safeOnly.map(renderCard)}</div>
                )}
                {!filteredDisplay.length && <div className="card" style={{ padding: 20, textAlign: "center" }}><span className="muted">Tidak ada bahan sesuai pencarian</span></div>}
              </>
            );
          })()}
        </>
      )}

      {tab === "items" && (
        <>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" placeholder="Cari bahan / SKU..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
            <button className="btn accent" onClick={openCreate} style={{ minHeight: 44, whiteSpace: "nowrap" }}>＋ Bahan</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowPurchase(true)} style={{ flex: 1 }}>📦 Beli</button>
            <button className="btn" onClick={() => setShowAdjust(true)} style={{ flex: 1 }}>⚖️ Adjust/Waste</button>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {filteredDisplay.map((it: any) => {
              const m = statusMeta(it.stock_status);
              const tm = typeMeta(it.item_type||"BASE");
              return (
                <div key={it.inventory_item_id} className="card" style={{ padding: 14, borderLeft: tm.label==="SEMI" ? `3px solid ${tm.color}`: undefined }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap:8 }}>
                    <div><div style={{ fontWeight: 800, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>{it.name} <span style={{ background:tm.bg, color:tm.color, border:`1px solid ${tm.border}`, borderRadius:999, padding:"2px 6px", fontSize:9, fontWeight:800 }}>{tm.label}</span></div><div className="muted" style={{ fontSize: 11 }}>{it.sku || "-"} • avg {formatRupiah(it.average_cost)} • {it.unit}</div></div>
                    <span style={{ background: m.bg, color: m.color, borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 800, flexShrink:0 }}>{m.icon} {m.short}</span>
                  </div>
                  <div style={{ marginTop: 10 }}><StockBar pct={it.bar_pct} status={it.stock_status} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10, background: "var(--surface2)", borderRadius: 10, padding: 10 }}>
                    <div><div className="muted" style={{ fontSize: 10 }}>STOK</div><div style={{ fontWeight: 800, fontSize: 13 }}>{fmtQty(it.current_stock, it.unit)}</div><div className="muted" style={{ fontSize: 10 }}>min {fmtQty(it.minimum_stock, it.unit)}</div></div>
                    <div><div className="muted" style={{ fontSize: 10 }}>RUNWAY</div><div style={{ fontWeight: 800, fontSize: 13, color: m.color }}>{it.has_forecast ? `~${it.runway_days} hari` : (it.current_stock <= 0 ? "habis" : "—")}</div><div className="muted" style={{ fontSize: 10 }}>{it.has_forecast ? `${it.avg_daily_consumption.toFixed(2)}/hari` : "no data"}</div></div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button className="btn" style={{ flex: 1, minHeight: 40 }} onClick={() => openEdit(it)}>Edit</button>
                    <button className="btn" style={{ flex: 1, minHeight: 40 }} onClick={() => { setPurchase({ inventory_item_id: it.inventory_item_id, quantity: "", unit_cost: String(it.average_cost), note: "" }); setShowPurchase(true); }}>Beli</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "movements" && (
        <div className="card">
          <div className="card-head"><div className="card-title">Riwayat Pergerakan Stok</div><button className="btn" onClick={fetchMovements} style={{ minHeight: 32, padding: "6px 12px", fontSize: 12 }}>Refresh</button></div>
          <div className="list">
            {movements.map((m: any) => (
              <div key={m.id} className="list-row">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.inventory_item.name} <span className="badge" style={{ marginLeft: 6, background: m.type === "PURCHASE" ? "var(--green-soft)" : m.type === "SALE_CONSUMPTION" ? "var(--warning-soft)" : "var(--surface2)", color: m.type === "PURCHASE" ? "var(--green)" : "var(--text)", fontSize: 10 }}>{m.type}</span></div>
                  <div className="muted" style={{ fontSize: 12 }}>{new Date(m.created_at).toLocaleString("id-ID")} • {m.creator?.name || "-"} {m.note ? `• ${m.note}` : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, color: m.quantity > 0 ? "var(--green)" : "var(--red)", fontSize: 13 }}>{m.quantity > 0 ? "+" : ""}{m.quantity} {m.inventory_item.unit}</div>
                  {m.unit_cost != null && <div className="muted" style={{ fontSize: 11 }}>{formatRupiah(Number(m.unit_cost))}/unit</div>}
                </div>
              </div>
            ))}
            {!movements.length && <div className="list-row"><span className="muted">Belum ada pergerakan</span><b>-</b></div>}
          </div>
        </div>
      )}

      {tab === "recipes" && (
        <>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Resep / BOM per Produk</div>
            <div className="field">
              <label>Produk</label>
              <select className="input" value={recipeProductId} onChange={(e) => setRecipeProductId(e.target.value)}>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.category.name}</option>
                ))}
              </select>
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>Setiap produk = resep bahan. Cappuccino → 18g beans + 150ml milk.</div>
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Bahan untuk {products.find((p) => p.id === recipeProductId)?.name}</div>
            {recipeDraft.map((r, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <select className="input" style={{ flex: "1 1 0" }} value={r.inventory_item_id} onChange={(e) => { const nd = [...recipeDraft]; nd[idx].inventory_item_id = e.target.value; setRecipeDraft(nd); }}>
                  <option value="">Pilih bahan</option>
                  {displayItems.map((it: any) => (
                    <option key={it.inventory_item_id} value={it.inventory_item_id}>{it.name} ({it.unit} • {fmtQty(it.current_stock, it.unit)})</option>
                  ))}
                </select>
                <input className="input" style={{ width: 110, flex: "0 0 110px" }} type="number" step="0.001" placeholder="Qty" value={r.quantity} onChange={(e) => { const nd = [...recipeDraft]; nd[idx].quantity = e.target.value; setRecipeDraft(nd); }} />
                <span className="muted" style={{ fontSize: 10 }}>{displayItems.find((x: any) => x.inventory_item_id === r.inventory_item_id)?.unit || ""}</span>
                <button className="btn" style={{ width: 44, height: 44, flex: "0 0 44px", padding: 0 }} onClick={() => setRecipeDraft(recipeDraft.filter((_, i) => i !== idx))}>×</button>
              </div>
            ))}
            <button className="btn" style={{ width: "100%", minHeight: 40, marginTop: 4 }} onClick={() => setRecipeDraft([...recipeDraft, { inventory_item_id: "", quantity: "" }])}>＋ Tambah Bahan</button>
            <button className="btn accent" style={{ width: "100%", minHeight: 44, marginTop: 10 }} onClick={saveRecipe}>Simpan Resep</button>
            {recipeItems.length > 0 && <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Saat ini: {recipeItems.map((r: any) => `${r.inventory_item.name} ${Number(r.quantity)}${r.inventory_item.unit}`).join(", ")}</div>}
          </div>
        </>
      )}

      {tab === "blending" && (
        <>
          <div className="card" style={{ padding:16, background:"#FFF7E5", border:"1px solid #FED7AA" }}>
            <div style={{ fontWeight:800, fontSize:13, color:"#B45309" }}>☕ Blending: BASE → SEMI-FINISH</div>
            <div className="muted" style={{ fontSize:11, marginTop:4, color:"#92400E" }}>Espresso (Semi Finish) adalah hasil blending Arabica + Robusta. Produksi mengurangi stok Base dan menambah stok Semi.</div>
            <div className="muted" style={{ fontSize:11, marginTop:6 }}>Alur: <b style={{color:"#92400E"}}>Arabica 12g + Robusta 6g → Espresso 1 shot</b> • Atur BOM lalu Blend.</div>
          </div>
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontWeight:700, marginBottom:8 }}>Pilih Semi-Finish untuk di-blend</div>
            <select className="input" value={semiOutputId} onChange={e=> setSemiOutputId(e.target.value)}>
              <option value="">Pilih semi-finish</option>
              {semiItems.length===0 ? <option disabled>Tidak ada SEMI_FINISH — buat di Kelola</option> :
               semiItems.map((it:any)=><option key={it.inventory_item_id} value={it.inventory_item_id}>{it.name} ({it.unit} • stok {fmtQty(it.current_stock, it.unit)})</option>)
              }
            </select>
            <div className="muted" style={{ fontSize:11, marginTop:6 }}>{semiBom.length? `BOM saat ini: ${semiBom.map((r:any)=> `${r.input_item.name} ${Number(r.quantity)}${r.input_item.unit}`).join(" + ")} → 1 ${semiItems.find((x:any)=>x.inventory_item_id===semiOutputId)?.unit || "shot"}` : "Belum ada BOM — tambah di bawah"}</div>
          </div>
          {semiOutputId && (
            <>
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontWeight:700, marginBottom:12 }}>BOM / Resep Blending untuk {semiItems.find((x:any)=>x.inventory_item_id===semiOutputId)?.name}</div>
                <div className="muted" style={{ fontSize:11, marginBottom:8 }}>Hanya BASE yang bisa jadi input. Contoh: Arabica 12g + Robusta 6g per 1 shot Espresso.</div>
                {semiDraft.map((r,idx)=> (
                  <div key={idx} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
                    <select className="input" style={{ flex:"1 1 0" }} value={r.input_item_id} onChange={e=>{ const nd=[...semiDraft]; nd[idx].input_item_id=e.target.value; setSemiDraft(nd); }}>
                      <option value="">Pilih bahan BASE</option>
                      {baseItems.map((it:any)=> <option key={it.inventory_item_id} value={it.inventory_item_id}>{it.name} ({it.unit} • {fmtQty(it.current_stock, it.unit)})</option>)}
                    </select>
                    <input className="input" style={{ width:110, flex:"0 0 110px" }} type="number" step="0.001" placeholder="Qty" value={r.quantity} onChange={e=>{ const nd=[...semiDraft]; nd[idx].quantity=e.target.value; setSemiDraft(nd); }} />
                    <span className="muted" style={{ fontSize:10 }}>{baseItems.find((x:any)=>x.inventory_item_id===r.input_item_id)?.unit||""}</span>
                    <button className="btn" style={{ width:44, height:44, flex:"0 0 44px", padding:0 }} onClick={()=> setSemiDraft(semiDraft.filter((_,i)=>i!==idx))}>×</button>
                  </div>
                ))}
                <button className="btn" style={{ width:"100%", minHeight:40, marginTop:4 }} onClick={()=> setSemiDraft([...semiDraft,{input_item_id:"", quantity:""}])}>＋ Tambah Bahan</button>
                <button className="btn accent" style={{ width:"100%", minHeight:44, marginTop:10 }} onClick={saveSemiBom}>Simpan BOM Blending</button>
              </div>
              <div className="card" style={{ padding:16 }}>
                <div style={{ fontWeight:700, marginBottom:12 }}>Produksi / Blending</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <div className="field"><label>Qty Output (shot)</label><input className="input" type="number" step="1" placeholder="20" value={produceQty} onChange={e=> setProduceQty(e.target.value)} /></div>
                  <div className="field"><label>Catatan</label><input className="input" placeholder="Batch pagi" value={produceNote} onChange={e=> setProduceNote(e.target.value)} /></div>
                </div>
                {semiBom.length>0 && produceQty && Number(produceQty)>0 && (
                  <div style={{ background:"var(--surface2)", borderRadius:10, padding:10, marginTop:10, fontSize:11 }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>Kebutuhan untuk {produceQty} shot:</div>
                    {semiBom.map((r:any)=> {
                      const need = Number(r.quantity) * Number(produceQty);
                      const input = baseItems.find((x:any)=> x.inventory_item_id===r.input_item_id);
                      const stock = input ? input.current_stock : 0;
                      const ok = stock >= need;
                      return <div key={r.input_item_id} style={{ display:"flex", justifyContent:"space-between", color: ok? "var(--text)" : "var(--red)", fontWeight: ok?400:700 }}>{r.input_item.name} {fmtQty(need, r.input_item.unit)} <span style={{ color: ok? "var(--muted)":"var(--red)" }}>stok {fmtQty(stock, r.input_item.unit)} {ok?"✓":"✗ kurang"}</span></div>
                    })}
                  </div>
                )}
                <button className="btn accent" style={{ width:"100%", minHeight:44, marginTop:10 }} onClick={doProduce}>Blend Sekarang</button>
              </div>
            </>
          )}
        </>
      )}

      {/* Inventory Detail — Runway + Depletion Chart (§5 §6) */}
      {selected && (
        <div className="bottom-sheet" onClick={() => setSelected(null)}>
          <div className="bottom-sheet-card" style={{ maxHeight: "88vh" }} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: "0 16px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{selected.name}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{selected.sku || "-"} • {selected.unit}</div>
              </div>
              <button className="btn" style={{ minHeight: 36, padding: "6px 10px" }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ overflowY: "auto", padding: 16, display: "grid", gap: 12 }}>
              {/* WHAT / HOW MUCH (§13 sequence) */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em" }}>WHAT?</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{selected.name}</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em", marginTop: 10 }}>HOW MUCH?</div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em" }}>{fmtQty(selected.current_stock, selected.unit)}</div>
                <div className="muted" style={{ fontSize: 11 }}>target {selected.target_stock != null ? fmtQty(selected.target_stock, selected.unit) : "-"} • min {fmtQty(selected.minimum_stock, selected.unit)}</div>
                <div style={{ marginTop: 12 }}><StockBar pct={selected.bar_pct} status={selected.stock_status} /></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                  <span style={{ background: statusMeta(selected.stock_status).bg, color: statusMeta(selected.stock_status).color, borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>
                    {statusMeta(selected.stock_status).icon} {statusMeta(selected.stock_status).label}
                  </span>
                  <span className="muted" style={{ fontSize: 11 }}>{selected.has_forecast ? `${selected.avg_daily_consumption.toFixed(2)} ${selected.unit}/day` : "No recent consumption"}</span>
                </div>
              </div>

              {/* STOCK RUNWAY §5 */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", letterSpacing: ".08em", marginBottom: 8 }}>STOCK RUNWAY</div>
                <RunwayTimeline current={selected.current_stock} unit={selected.unit} runOutDate={selected.run_out_date} runwayDays={selected.runway_days} hasForecast={selected.has_forecast} />
                <div className="muted" style={{ fontSize: 11, marginTop: 8, display: "grid", gap: 2 }}>
                  <div><b style={{ color: "var(--text)" }}>HOW FAST?</b> {selected.has_forecast ? `${selected.avg_daily_consumption.toFixed(2)} ${selected.unit}/day` : "Not enough data"}</div>
                  <div><b style={{ color: "var(--text)" }}>HOW LONG?</b> {selected.has_forecast ? `~${selected.runway_days} days` : "—"}</div>
                  <div><b style={{ color: "var(--text)" }}>WHEN RUN OUT?</b> {selected.has_forecast ? fmtDateLong(selected.run_out_date) : "—"}</div>
                  <div><b style={{ color: "var(--text)" }}>WHAT TO DO?</b> {selected.reorder_needed ? "Restock" : "Stock sufficient"}</div>
                  <div><b style={{ color: "var(--text)" }}>COST?</b> {selected.reorder_needed ? `~${formatRupiah(selected.reorder_cost)} for ${fmtQty(selected.reorder_quantity, selected.unit)}` : "—"}</div>
                </div>
              </div>

              {/* Depletion trend chart §6 */}
              <DepletionChart current={selected.current_stock} avgDaily={selected.avg_daily_consumption} runwayDays={selected.runway_days} hasForecast={selected.has_forecast} unit={selected.unit} />

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn accent" style={{ flex: 1, minHeight: 44 }} onClick={() => { setPurchase({ inventory_item_id: selected.inventory_item_id, quantity: "", unit_cost: String(selected.average_cost), note: "" }); setSelected(null); setTimeout(() => setShowPurchase(true), 80); }}>
                  Restock • {selected.reorder_needed ? formatRupiah(selected.reorder_cost) : "Beli"}
                </button>
                <button className="btn" style={{ flex: 1, minHeight: 44 }} onClick={() => { setAdjust({ inventory_item_id: selected.inventory_item_id, quantity: "", type: "ADJUSTMENT", note: "" }); setSelected(null); setTimeout(() => setShowAdjust(true), 80); }}>Adjust / Waste</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {showItemForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }} onClick={() => setShowItemForm(false)}>
          <div className="card" style={{ padding: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>{editing ? "Edit Bahan" : "Tambah Bahan"}</h3>
            <div className="formgrid">
              <div className="field full"><label>Nama *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Espresso Beans" /></div>
              <div className="field"><label>SKU</label><input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="BEANS-001" /></div>
              <div className="field"><label>Satuan *</label><select className="input" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="liter">liter</option><option value="pcs">pcs</option><option value="shot">shot</option><option value="pack">pack</option><option value="bottle">bottle</option><option value="sachet">sachet</option><option value="box">box</option></select></div>
              <div className="field"><label>Klasifikasi *</label><select className="input" value={form.item_type} onChange={e=> setForm({...form, item_type:e.target.value as any})}><option value="BASE">BASE — bahan baku (Arabica, Robusta, Milk)</option><option value="SEMI_FINISH">SEMI-FINISH — hasil blending (Espresso Shot)</option></select></div>
              {!editing && <div className="field"><label>Stok Awal</label><input className="input" type="number" step="0.001" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} placeholder="0" /></div>}
              <div className="field"><label>Minimum Stok</label><input className="input" type="number" step="0.001" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} placeholder="5" /></div>
              <div className="field"><label>Target Stok</label><input className="input" type="number" step="0.001" value={form.target_stock} onChange={(e) => setForm({ ...form, target_stock: e.target.value })} placeholder="20" /></div>
              <div className="field"><label>Avg Cost (Rp / unit)</label><input className="input" type="number" value={form.average_cost} onChange={(e) => setForm({ ...form, average_cost: e.target.value })} placeholder="15000" /></div>
              <div className="field full" style={{ background: form.item_type==="SEMI_FINISH" ? "#F4E9E0" : "#F2F1ED", border:`1px solid ${form.item_type==="SEMI_FINISH" ? "#EAD9C8" : "var(--border)"}`, borderRadius:10, padding:"8px 10px", fontSize:11, lineHeight:1.4 }}>{form.item_type==="SEMI_FINISH" ? "☕ Semi-finish: akan di-blend dari BASE (Arabica+Robusta). Atur BOM di Inventory → Resep Semi." : "🌱 Base: bahan baku langsung dibeli dari supplier."}</div>
              <div className="full" style={{ display: "flex", gap: 8, marginTop: 8 }}><button className="btn accent" style={{ flex: 1 }} onClick={submitItem}>{editing ? "Simpan" : "Tambah"}</button><button className="btn" style={{ flex: 1 }} onClick={() => setShowItemForm(false)}>Batal</button></div>
            </div>
            {editing && <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Stok tidak bisa diedit langsung; gunakan Pembelian / Adjust / Blending.</div>}
          </div>
        </div>
      )}

      {showPurchase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }} onClick={() => setShowPurchase(false)}>
          <div className="card" style={{ padding: 20, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>Catat Pembelian Stok</h3>
            <div className="formgrid">
              <div className="field full"><label>Bahan</label><select className="input" value={purchase.inventory_item_id} onChange={(e) => setPurchase({ ...purchase, inventory_item_id: e.target.value })}><option value="">Pilih bahan</option>{displayItems.map((it: any) => (<option key={it.inventory_item_id} value={it.inventory_item_id}>{it.name} ({it.unit})</option>))}</select></div>
              <div className="field"><label>Qty</label><input className="input" type="number" step="0.001" value={purchase.quantity} onChange={(e) => setPurchase({ ...purchase, quantity: e.target.value })} placeholder="5" /></div>
              <div className="field"><label>Unit Cost (Rp)</label><input className="input" type="number" value={purchase.unit_cost} onChange={(e) => setPurchase({ ...purchase, unit_cost: e.target.value })} placeholder="150000" /></div>
              <div className="field full"><label>Catatan</label><input className="input" value={purchase.note} onChange={(e) => setPurchase({ ...purchase, note: e.target.value })} placeholder="Supplier / invoice" /></div>
              {purchase.quantity && purchase.unit_cost && <div className="full" style={{ background: "var(--surface2)", borderRadius: 10, padding: 10, fontSize: 12 }}>Total: <b>{formatRupiah(Number(purchase.quantity) * Number(purchase.unit_cost))}</b></div>}
              <div className="full" style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn accent" style={{ flex: 1 }} onClick={doPurchase}>Simpan</button><button className="btn" onClick={() => setShowPurchase(false)}>Batal</button></div>
            </div>
          </div>
        </div>
      )}

      {showAdjust && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 16 }} onClick={() => setShowAdjust(false)}>
          <div className="card" style={{ padding: 20, width: "100%", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 12px", fontWeight: 800 }}>Adjust / Waste</h3>
            <div className="formgrid">
              <div className="field full"><label>Bahan</label><select className="input" value={adjust.inventory_item_id} onChange={(e) => setAdjust({ ...adjust, inventory_item_id: e.target.value })}><option value="">Pilih bahan</option>{displayItems.map((it: any) => (<option key={it.inventory_item_id} value={it.inventory_item_id}>{it.name} ({fmtQty(it.current_stock, it.unit)})</option>))}</select></div>
              <div className="field"><label>Tipe</label><select className="input" value={adjust.type} onChange={(e) => setAdjust({ ...adjust, type: e.target.value })}><option value="ADJUSTMENT">ADJUSTMENT (±)</option><option value="WASTE">WASTE (buang)</option></select></div>
              <div className="field"><label>Qty {adjust.type === "ADJUSTMENT" ? "(±)" : "(+ akan jadi -)"}</label><input className="input" type="number" step="0.001" value={adjust.quantity} onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })} placeholder={adjust.type === "WASTE" ? "2" : "-1 atau 2"} /></div>
              <div className="field full"><label>Catatan</label><input className="input" value={adjust.note} onChange={(e) => setAdjust({ ...adjust, note: e.target.value })} placeholder="Stock opname / rusak" /></div>
              <div className="full" style={{ display: "flex", gap: 8, marginTop: 6 }}><button className="btn accent" style={{ flex: 1 }} onClick={doAdjust}>Simpan</button><button className="btn" onClick={() => setShowAdjust(false)}>Batal</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function widths(n: number) {
  return n ? "#FEE2E2" : "#F5F5F5";
}
