export function StatCard({ label, value, n, delta, target = 0.8, color }) {
  const pct = Math.round((value || 0) * 1000) / 10; // value is 0..1 ratio
  const hasTarget = value !== null && value !== undefined;
  const reachedTarget = hasTarget && value >= target;
  const hasDelta = delta !== null && delta !== undefined;
  const deltaPct = hasDelta ? Math.round(Math.abs(delta) * 1000) / 10 : null;
  const deltaDir = hasDelta ? (delta > 0.0005 ? "up" : delta < -0.0005 ? "down" : "flat") : null;

  return (
    <div className="kpi-card" style={color ? { "--kpi-color": color } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{pct}%</div>
      <div className="kpi-bar-track">
        <div className="kpi-bar-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <div className="kpi-meta-row">
        {hasTarget && (
          <span className={`kpi-target-badge ${reachedTarget ? "good" : "bad"}`}>
            {reachedTarget ? "Đạt mục tiêu" : "Chưa đạt MT"}
          </span>
        )}
        {hasDelta && deltaDir !== "flat" && (
          <span className={`kpi-delta ${deltaDir === "up" ? "up" : "down"}`}>
            {deltaDir === "up" ? "▲" : "▼"} {deltaPct}%
          </span>
        )}
        {hasDelta && deltaDir === "flat" && <span className="kpi-delta flat">— không đổi</span>}
      </div>
      {n !== null && n !== undefined && <div className="kpi-n">{n} lượt giám sát</div>}
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
