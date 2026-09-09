export default function POSLoading() {
  return (
    <div>
      <div className="skeleton" style={{ height: 18, width: 60, marginBottom: 12 }} />
      <div className="skeleton" style={{ height: 48, marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 36, width: 80, borderRadius: 999 }} />
        ))}
      </div>
      <div className="products">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ minHeight: 160 }} />
        ))}
      </div>
    </div>
  );
}
