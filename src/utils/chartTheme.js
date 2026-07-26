// Theme dùng chung cho mọi biểu đồ recharts — để đồng bộ tooltip, grid,
// bo góc, khoảng trắng theo phong cách Power BI / Stripe Dashboard.

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#fff",
    border: "1px solid var(--line)",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(58,53,80,0.12)",
    fontSize: 12.5,
    fontFamily: "var(--font-body)",
    padding: "8px 12px",
  },
  labelStyle: { fontWeight: 600, color: "var(--navy-950)", marginBottom: 4 },
  itemStyle: { fontSize: 12.5 },
  cursor: { fill: "rgba(95,179,163,0.08)" },
};

export const GRID_PROPS = { strokeDasharray: "3 3", stroke: "#eef0ee", vertical: false };
export const AXIS_TICK = { fontSize: 11, fill: "var(--ink-600)" };
export const BAR_RADIUS = [6, 6, 0, 0];
export const ANIMATION = { animationDuration: 500, animationEasing: "ease-out" };

export const STATUS_COLORS = {
  good: "#2f9e6e",
  warn: "#e0973f",
  bad: "#d9564a",
  neutral: "#8a93a6",
};

export function rateColor(pct) {
  if (pct >= 90) return STATUS_COLORS.good;
  if (pct >= 70) return STATUS_COLORS.warn;
  return STATUS_COLORS.bad;
}

export function riskColor(score) {
  if (score >= 70) return STATUS_COLORS.bad;
  if (score >= 50) return "#e07a3f";
  if (score >= 30) return STATUS_COLORS.warn;
  return STATUS_COLORS.good;
}

export function riskLabel(score) {
  if (score >= 70) return "Đỏ — rất cần ưu tiên";
  if (score >= 50) return "Cam — cần lưu ý";
  if (score >= 30) return "Vàng — theo dõi";
  return "Xanh — ổn định";
}
