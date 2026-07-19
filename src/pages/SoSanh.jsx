import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";

const SERIES_COLORS = {
  "GS chéo": "#2a9d8f",
  "Ngoại kiểm": "#e0a458",
  "Tỷ lệ TB": "#1f3750",
};

export function SoSanh({ hook }) {
  const sections = hook.data?.sections || [];
  const rows = hook.data?.rows || [];
  const [activeSection, setActiveSection] = useState(null);

  const currentSection = activeSection || sections[0]?.name;

  const chartData = useMemo(() => {
    if (!currentSection) return [];
    return rows.map((r) => {
      const vals = r.values[currentSection] || {};
      const point = { khoa: r.khoa };
      Object.entries(vals).forEach(([label, v]) => {
        point[label] = typeof v === "number" ? Math.round(v * 1000) / 10 : 0;
      });
      return point;
    });
  }, [rows, currentSection]);

  const seriesKeys = useMemo(() => {
    const sec = sections.find((s) => s.name === currentSection);
    return sec ? sec.cols.map((c) => c.label) : [];
  }, [sections, currentSection]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">So sánh</p>
        <h1 className="page-title">So sánh hình thức giám sát</h1>
        <p className="page-desc">
          Đối chiếu tỷ lệ tuân thủ giữa Giám sát chéo, Ngoại kiểm và Tỷ lệ
          trung bình theo từng nội dung (không bao gồm Tự giám sát).
        </p>
      </div>

      <div className="control-row">
        <select
          className="select"
          value={currentSection || ""}
          onChange={(e) => setActiveSection(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3 className="card-title">{currentSection}</h3>
        {chartData.length === 0 ? (
          <div className="state-box">Chưa có dữ liệu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(320, chartData.length * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="khoa" width={70} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend />
              {seriesKeys.map((k) => (
                <Bar key={k} dataKey={k} fill={SERIES_COLORS[k] || "#2a9d8f"} radius={[0, 3, 3, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
