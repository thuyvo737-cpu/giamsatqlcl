import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  "Tự giám sát": "#8497a6",
  "Giám sát chéo": "#2a9d8f",
  "Ngoại kiểm": "#16293c",
};

export function CoverageDonut({ data }) {
  const total = (data || []).reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="state-box">Chưa có dữ liệu.</div>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name] || "#dbe1e0"} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `${value} (${Math.round((value / total) * 1000) / 10}%)`,
            name,
          ]}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
