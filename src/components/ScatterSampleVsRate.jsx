import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

export function ScatterSampleVsRate({ data }) {
  const points = (data || []).filter((d) => d.n > 0);
  if (!points.length) return <div className="state-box">Chưa có dữ liệu.</div>;

  const avgN = points.reduce((s, p) => s + p.n, 0) / points.length;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
        <XAxis
          type="number"
          dataKey="n"
          name="Số lượng giám sát"
          tick={{ fontSize: 11 }}
          label={{ value: "Cỡ mẫu (số lượng giám sát)", position: "insideBottom", offset: -5, fontSize: 11, fill: "#8497a6" }}
        />
        <YAxis
          type="number"
          dataKey="ratePct"
          name="Tỷ lệ tuân thủ"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11 }}
        />
        <ZAxis range={[60, 60]} />
        <ReferenceLine y={70} stroke="#e0a458" strokeDasharray="4 4" />
        <ReferenceLine x={avgN} stroke="#dbe1e0" strokeDasharray="2 2" />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value, key) =>
            key === "ratePct" ? [`${value}%`, "Tỷ lệ tuân thủ"] : [value, "Số lượng giám sát"]
          }
          labelFormatter={() => ""}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload;
            return (
              <div className="card" style={{ padding: "8px 12px" }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{p.khoa}</div>
                <div style={{ fontSize: 11, color: "#4d6072" }}>
                  Cỡ mẫu: {p.n} · Tỷ lệ: {p.ratePct}%
                </div>
              </div>
            );
          }}
        />
        <Scatter
          data={points.map((p) => ({ ...p, ratePct: Math.round(p.rate * 1000) / 10 }))}
          fill="#2a9d8f"
          fillOpacity={0.75}
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
