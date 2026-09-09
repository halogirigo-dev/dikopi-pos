export default function AppLoading() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="skeleton" style={{ height: 88 }} />
      <div className="grid-kpi">
        <div className="skeleton" style={{ height: 96 }} />
        <div className="skeleton" style={{ height: 96 }} />
        <div className="skeleton" style={{ height: 96 }} />
        <div className="skeleton" style={{ height: 96 }} />
      </div>
      <div className="skeleton" style={{ height: 140 }} />
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );
}
