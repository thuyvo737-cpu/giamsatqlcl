import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { TOOLTIP_STYLE } from "../utils/chartTheme.js";

/** data: [{name, current, previous}] — nhãn kỳ linh động theo tháng/quý đang xem. */
export function PeriodCompareChart({ data, currentLabel = "Kỳ hiện tại", previousLabel = "Kỳ trước" }) {
  const hasData = (data || []).some((d) => d.current !== null || d.previous !== null);
  if (!hasData) return <div className="state-box">Chưa đủ dữ liệu để so sánh kỳ trước.</div>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={42} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => (v === null || v === undefined ? "—" : `${v}%`)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="previous" name={previousLabel} fill="#a8b0d1" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="previous" position="top" formatter={(v) => (v == null ? "" : `${v}%`)} style={{ fontSize: 9.5, fontWeight: 700, fill: "var(--navy-900)" }} />
        </Bar>
        <Bar dataKey="current" name={currentLabel} fill="#5fb3a3" radius={[3, 3, 0, 0]}>
          <LabelList dataKey="current" position="top" formatter={(v) => (v == null ? "" : `${v}%`)} style={{ fontSize: 9.5, fontWeight: 700, fill: "var(--navy-900)" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
