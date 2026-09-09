export default function ExpensesLoading() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="skeleton" style={{ height: 88 }} />
      <div className="skeleton" style={{ height: 44 }} />
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton" style={{ height: 96 }} />
      ))}
    </div>
  );
}
