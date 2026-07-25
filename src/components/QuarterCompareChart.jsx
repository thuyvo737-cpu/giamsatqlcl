import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { CONTENT_KEYS, CONTENT_LABELS, CONTENT_COLORS } from "../utils/aggregate.js";

export function QuarterCompareChart({ data }) {
  const hasData = (data || []).some((d) => CONTENT_KEYS.some((k) => d[k] !== null && d[k] !== undefined));
  if (!hasData) return <div className="state-box">Chưa có dữ liệu để so sánh theo quý.</div>;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
        <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={40} />
        <Tooltip formatter={(v) => (v === null ? "—" : `${v}%`)} />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(k) => CONTENT_LABELS[k]} />
        {CONTENT_KEYS.map((k) => (
          <Bar key={k} dataKey={k} fill={CONTENT_COLORS[k]} radius={[3, 3, 0, 0]} name={k}>
            <LabelList
              dataKey={k}
              position="top"
              formatter={(v) => (v === null || v === undefined ? "" : `${v}%`)}
              style={{ fontSize: 8.5, fontWeight: 700, fill: "var(--navy-900)" }}
            />
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
