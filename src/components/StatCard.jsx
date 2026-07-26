import { IconTrendUp, IconTrendDown, IconTrendFlat } from "../utils/icons.jsx";

export function StatCard({ label, value, n, delta, target = 0.8, color, colorBg, icon: Icon }) {
  const pct = Math.round((value || 0) * 1000) / 10;
  const hasTarget = value !== null && value !== undefined;
  const reachedTarget = hasTarget && value >= target;
  const hasDelta = delta !== null && delta !== undefined;
  const deltaPct = hasDelta ? Math.round(Math.abs(delta) * 1000) / 10 : null;
  const deltaDir = hasDelta ? (delta > 0.0005 ? "up" : delta < -0.0005 ? "down" : "flat") : null;
  const DeltaIcon = deltaDir === "up" ? IconTrendUp : deltaDir === "down" ? IconTrendDown : IconTrendFlat;

  return (
    <div
      className="kpi-card"
      style={{ "--kpi-color": color || "var(--teal-500)", "--kpi-color-bg": colorBg || "var(--paper-dim)" }}
    >
      <div className="kpi-head">
        {Icon && (
          <div className="kpi-icon">
            <Icon width={18} height={18} />
          </div>
        )}
        <div className="kpi-label">{label}</div>
      </div>
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
        {hasDelta && (
          <span className={`kpi-delta ${deltaDir}`}>
            <DeltaIcon width={13} height={13} />
            {deltaDir === "flat" ? "không đổi" : `${deltaPct}%`}
          </span>
        )}
      </div>
      {n !== null && n !== undefined && <div className="kpi-n">{n} lượt giám sát</div>}
    </div>
  );
}
