import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList, ResponsiveContainer } from "recharts";
import { QUARTERS } from "../utils/aggregate.js";

const QUARTER_COLORS = { q1: "#5fb3a3", q2: "#e3ab68", q3: "#4a5578", q4: "#d9897f" };

// data: [{name: "Nhận dạng người bệnh", q1, q2, q3, q4}, ...] — trục
// hoành theo TỪNG NỘI DUNG, mỗi nội dung 1 nhóm 4 cột (4 quý) để dễ so
// sánh giữa các quý ngay trong cùng 1 nội dung.
export function QuarterCompareChart({ data }) {
  const hasData = (data || []).some((d) => QUARTERS.some((q) => d[q.key] !== null && d[q.key] !== undefined));
  if (!hasData) return <div className="state-box">Chưa có dữ liệu để so sánh theo quý.</div>;

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={data} margin={{ top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10.5 }} interval={0} angle={-15} textAnchor="end" height={56} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={40} />
        <Tooltip formatter={(v) => (v === null ? "—" : `${v}%`)} />
        <Legend wrapperStyle={{ fontSize: 11 }} formatter={(k) => QUARTERS.find((q) => q.key === k)?.label || k} />
        {QUARTERS.map((q) => (
          <Bar key={q.key} dataKey={q.key} name={q.key} fill={QUARTER_COLORS[q.key]} radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey={q.key}
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
