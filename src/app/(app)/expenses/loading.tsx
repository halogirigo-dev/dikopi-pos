export default function ExpensesLoading() {
  return (
    <div style={{ display: "grid", gap: 12, animation: "pulse 1.2s infinite" }}>
      <div className="card" style={{ height: 88 }} />
      <div style={{ height: 44, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ height: 96 }} />
      ))}
      <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.6}100%{opacity:1}}`}</style>
    </div>
  );
}
