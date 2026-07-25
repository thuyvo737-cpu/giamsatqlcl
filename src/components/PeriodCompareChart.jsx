import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";

const SERIES = [
  { key: "current", label: "Tháng hiện tại", color: "#5fb3a3" },
  { key: "prevMonth", label: "Tháng trước", color: "#a8b0d1" },
  { key: "currentQuarter", label: "Quý hiện tại", color: "#e3ab68" },
  { key: "prevQuarter", label: "Quý trước", color: "#d9c9a8" },
];

export function PeriodCompareChart({ data }) {
  const hasData = (data || []).some((d) => SERIES.some((s) => d[s.key] !== null && d[s.key] !== undefined));
  if (!hasData) return <div className="state-box">Chưa đủ dữ liệu để so sánh kỳ trước.</div>;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={40} />
        <Tooltip formatter={(v) => (v === null || v === undefined ? "—" : `${v}%`)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {SERIES.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey={s.key}
              position="top"
              formatter={(v) => (v === null || v === undefined ? "" : `${v}%`)}
              style={{ fontSize: 8, fontWeight: 700, fill: "var(--navy-900)" }}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
