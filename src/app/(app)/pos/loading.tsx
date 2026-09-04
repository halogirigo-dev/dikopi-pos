export default function POSLoading() {
  return (
    <div style={{ animation: "pulse 1.2s ease-in-out infinite" }}>
      <div style={{ height: 18, width: 60, background: "var(--border)", borderRadius: 8, marginBottom: 12 }} />
      <div style={{ height: 48, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 36, width: 80, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 999 }} />
        ))}
      </div>
      <div className="products">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="product" style={{ minHeight: 160, background: "var(--surface)" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%{opacity:1} 50%{opacity:.6} 100%{opacity:1} }`}</style>
    </div>
  );
}
