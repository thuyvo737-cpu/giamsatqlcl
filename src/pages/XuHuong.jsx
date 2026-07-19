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
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";

const LINE_COLORS = ["#2a9d8f", "#e0a458", "#16293c", "#d1615a", "#8fd4c9"];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

export function XuHuong({ hook }) {
  const [year, setYear] = useState(null);
  const [selectedKhoa, setSelectedKhoa] = useState([]);

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);
  const effectiveYear = year ?? years[0];

  const allKhoa = useMemo(() => {
    if (!hook.data) return [];
    const set = new Set();
    CONTENT_KEYS.forEach((g) => {
      listKhoa(getRecordsForContent(hook.data, g).filter((r) => r.nam === effectiveYear)).forEach((k) =>
        set.add(k)
      );
    });
    return Array.from(set).sort();
  }, [hook.data, effectiveYear]);

  const activeKhoa = selectedKhoa.length > 0 ? selectedKhoa : allKhoa.slice(0, 5);

  const chartsBySection = useMemo(() => {
    if (!hook.data) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const data = MONTH_LABELS.map((label, idx) => {
        const point = { thang: label };
        activeKhoa.forEach((khoa) => {
          const { rate } = computeRate(records, { thang: idx + 1, nam: effectiveYear, khoa, contentKey: key });
          point[khoa] = rate !== null ? Math.round(rate * 1000) / 10 : null;
        });
        return point;
      });
      return { key, name: CONTENT_LABELS[key], data };
    });
  }, [hook.data, effectiveYear, activeKhoa]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Xu hướng</p>
        <h1 className="page-title">Xu hướng tuân thủ theo tháng</h1>
        <p className="page-desc">
          Diễn biến tỷ lệ tuân thủ theo từng tháng, hiển thị đồng thời cho tất cả nội dung giám sát — không cần
          chọn từng nội dung riêng lẻ.
        </p>
      </div>

      <div className="control-row">
        <select className="select" value={effectiveYear || ""} onChange={(e) => setYear(Number(e.target.value))}>
          {years.length === 0 && <option>—</option>}
          {years.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </select>
        <select
          className="select"
          multiple
          value={selectedKhoa}
          onChange={(e) => setSelectedKhoa(Array.from(e.target.selectedOptions, (o) => o.value))}
          style={{ minWidth: 160, height: 34 }}
        >
          {allKhoa.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <span className="badge-updated">Giữ Ctrl/Cmd để chọn nhiều khoa · mặc định 5 khoa đầu</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        {chartsBySection.map((sec) => (
          <div className="card" key={sec.key}>
            <h3 className="card-title">{sec.name}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={sec.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
                <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => (v === null ? "—" : `${v}%`)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
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
          </div>
        ))}
      </div>
    </div>
  );
}
