import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const BUCKET_COLORS = ["#d1615a", "#e0a458", "#8fd4c9", "#2a9d8f"];

export function DistributionChart({ buckets }) {
  const total = (buckets || []).reduce((s, b) => s + b.count, 0);
  if (!total) return <div className="state-box">Chưa có dữ liệu.</div>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={buckets} margin={{ left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: "Số khoa", angle: -90, position: "insideLeft", fontSize: 11, fill: "#8497a6" }} />
        <Tooltip formatter={(v) => [`${v} khoa`, "Số lượng"]} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={48}>
          {(buckets || []).map((b, i) => (
            <Cell key={b.label} fill={BUCKET_COLORS[i % BUCKET_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
