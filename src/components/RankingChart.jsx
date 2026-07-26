import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList, ResponsiveContainer } from "recharts";
import { TOOLTIP_STYLE } from "../utils/chartTheme.js";

function barColor(pct) {
  if (pct >= 90) return "#5fb3a3";
  if (pct >= 70) return "#e3ab68";
  return "#d9897f";
}

/** data: [{khoa, value}] đã sắp xếp giảm dần theo value (0-100). */
export function RankingChart({ data }) {
  if (!data || !data.length) return <div className="state-box">Chưa có dữ liệu.</div>;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 26)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="khoa" width={70} tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => `${v}%`} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
          {data.map((d, i) => (
            <Cell key={i} fill={barColor(d.value)} />
          ))}
          <LabelList dataKey="value" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 10.5, fontWeight: 700, fill: "var(--navy-900)" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
