export default function FinanceLoading() {
  return (
    <div style={{ display: "grid", gap: 12, animation: "pulse 1.2s infinite" }}>
      <div style={{ height: 36, background: "var(--surface)", borderRadius: 999 }} />
      <div className="card" style={{ height: 120 }} />
      <div className="card" style={{ height: 160 }} />
      <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}`}</style>
    </div>
  );
}
