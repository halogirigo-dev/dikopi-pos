export default function AppLoading() {
  return (
    <div style={{ display: "grid", gap: 12, animation: "pulse 1.2s ease-in-out infinite" }}>
      <div className="card" style={{ height: 88, background: "var(--surface)", opacity: 0.9 }} />
      <div className="grid-kpi">
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
        <div className="card" style={{ height: 96 }} />
      </div>
      <div className="card" style={{ height: 140 }} />
      <div className="card" style={{ height: 180 }} />
      <style>{`@keyframes pulse { 0%{opacity:1} 50%{opacity:.6} 100%{opacity:1} }`}</style>
    </div>
  );
}
