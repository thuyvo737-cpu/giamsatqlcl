import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ParetoChart({ legend }) {
  const sorted = [...(legend || [])]
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  if (!sorted.length) {
    return <div className="state-box">Chưa có lượt vi phạm nào được ghi nhận.</div>;
  }

  const total = sorted.reduce((s, x) => s + x.count, 0);
  let cumulative = 0;
  const data = sorted.map((x) => {
    cumulative += x.count;
    return {
      name: x.name.length > 24 ? x.name.slice(0, 24) + "…" : x.name,
      fullName: x.name,
      count: x.count,
      cumPct: Math.round((cumulative / total) * 1000) / 10,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data} margin={{ left: -10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} height={70} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          formatter={(value, key) =>
            key === "cumPct" ? [`${value}%`, "Tích lũy"] : [value, "Số lượt"]
          }
          labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ""}
        />
        <Bar yAxisId="left" dataKey="count" fill="#d1615a" radius={[3, 3, 0, 0]} barSize={28} />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumPct"
          stroke="#16293c"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
