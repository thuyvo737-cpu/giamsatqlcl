import {
  ComposedChart,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function DumbbellChart({ data, labelA, labelB, colorA = "#2a9d8f", colorB = "#16293c" }) {
  if (!data || !data.length) return <div className="state-box">Chưa có dữ liệu.</div>;

  const chartData = data.map((d) => ({
    khoa: d.khoa,
    [labelA]: d.a,
    [labelB]: d.b,
    base: Math.min(d.a ?? 0, d.b ?? 0),
    range: Math.abs((d.a ?? 0) - (d.b ?? 0)),
  }));

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, chartData.length * 30)}>
      <ComposedChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="khoa" width={70} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => (typeof v === "number" ? `${v}%` : v)} />
        <Legend />
        <Bar dataKey="base" stackId="range" fill="transparent" isAnimationActive={false} legendType="none" />
        <Bar dataKey="range" stackId="range" fill="#dbe1e0" barSize={3} isAnimationActive={false} legendType="none" />
        <Scatter dataKey={labelA} name={labelA} fill={colorA} legendType="circle" />
        <Scatter dataKey={labelB} name={labelB} fill={colorB} legendType="circle" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
