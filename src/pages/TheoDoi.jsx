import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";

const LINE_COLORS = ["#2a9d8f", "#e0a458", "#1f3750", "#d1615a", "#8fd4c9"];

export function TheoDoi({ hook }) {
  const sections = hook.data?.sections || [];
  const rows = hook.data?.rows || [];
  const [section, setSection] = useState(null);
  const [selectedKhoa, setSelectedKhoa] = useState([]);

  const currentSection = section || sections[0];
  const allKhoa = rows.map((r) => r.khoa);

  const activeKhoa =
    selectedKhoa.length > 0 ? selectedKhoa : allKhoa.slice(0, 5);

  const chartData = useMemo(() => {
    if (!currentSection) return [];
    const months = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
    return months.map((m, idx) => {
      const point = { thang: m };
      rows
        .filter((r) => activeKhoa.includes(r.khoa))
        .forEach((r) => {
          const monthly = r.values[currentSection] || [];
          const v = monthly[idx]?.value;
          point[r.khoa] = typeof v === "number" ? Math.round(v * 1000) / 10 : null;
        });
      return point;
    });
  }, [rows, currentSection, activeKhoa]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Xu hướng</p>
        <h1 className="page-title">Theo dõi kết quả theo tháng</h1>
        <p className="page-desc">
          Diễn biến tỷ lệ tuân thủ theo từng tháng trong năm, so sánh giữa
          các khoa được chọn.
        </p>
      </div>

      <div className="control-row">
        <select
          className="select"
          value={currentSection || ""}
          onChange={(e) => setSection(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="select"
          multiple
          value={selectedKhoa}
          onChange={(e) =>
            setSelectedKhoa(Array.from(e.target.selectedOptions, (o) => o.value))
          }
          style={{ minWidth: 160, height: 34 }}
        >
          {allKhoa.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <span className="badge-updated">
          Giữ Ctrl/Cmd để chọn nhiều khoa · mặc định 5 khoa đầu
        </span>
      </div>

      <div className="card">
        <h3 className="card-title">{currentSection}</h3>
        {chartData.length === 0 ? (
          <div className="state-box">Chưa có dữ liệu.</div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
              <XAxis dataKey="thang" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => (v === null ? "—" : `${v}%`)} />
              <Legend />
              {activeKhoa.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
