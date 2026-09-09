export default function FinanceLoading() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="skeleton" style={{ height: 36, borderRadius: 999 }} />
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 160 }} />
    </div>
  );
}
