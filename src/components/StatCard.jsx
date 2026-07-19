export function StatCard({ label, value }) {
  const pct = Math.round((value || 0) * 1000) / 10; // value is 0..1 ratio
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{pct}%</div>
      <div className="kpi-bar-track">
        <div
          className="kpi-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function pillClassForRate(ratio) {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio))
    return "pill";
  if (ratio >= 0.9) return "pill pill-good";
  if (ratio >= 0.7) return "pill pill-warn";
  return "pill pill-bad";
}
