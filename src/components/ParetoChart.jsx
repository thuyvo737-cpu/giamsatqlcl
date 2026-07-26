import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "../utils/chartTheme.js";

export function ParetoChart({ legend }) {
  const sorted = [...(legend || [])].filter((x) => x.count > 0).sort((a, b) => b.count - a.count);

  if (!sorted.length) {
    return <div className="state-box">Chưa có lượt vi phạm nào được ghi nhận.</div>;
  }

  const total = sorted.reduce((s, x) => s + x.count, 0);
  let cumulative = 0;
  const data = sorted.map((x) => {
    cumulative += x.count;
    return { name: x.name, count: x.count, cumPct: Math.round((cumulative / total) * 1000) / 10 };
  });

  return (
    <ResponsiveContainer width="100%" height={Math.max(260, data.length * 46)}>
      <ComposedChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={230} tick={{ fontSize: 11 }} />
        <Tooltip {...TOOLTIP_STYLE}
          formatter={(value, key) => (key === "cumPct" ? [`${value}%`, "Tích lũy"] : [value, "Số lượt"])}
        />
        <Bar dataKey="count" fill="var(--red-500, #d9897f)" radius={[0, 4, 4, 0]} barSize={20}>
          <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "var(--navy-900)" }} />
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
