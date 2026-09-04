export default function DashboardLoading() {
  return (
    <div style={{ display: "grid", gap: 12, animation: "pulse 1.2s infinite" }}>
      <div className="card" style={{ padding: 16, height: 120 }} />
      <div className="grid-kpi">
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
      </div>
      <div className="card" style={{ height: 140 }} />
      <div className="card" style={{ height: 180 }} />
      <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}`}</style>
    </div>
  );
}
