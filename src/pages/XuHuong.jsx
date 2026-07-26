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
import { MultiSelect } from "../components/MultiSelect.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  forecastNextMonth,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";
import { generateTrendInsights } from "../utils/insights.js";
import { TOOLTIP_STYLE } from "../utils/chartTheme.js";

const LINE_COLORS = ["#5fb3a3", "#e3ab68", "#4a5578", "#d9897f", "#a373ac", "#6f93c2", "#7aab5e"];
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

  // Rỗng => mặc định hiện 5 khoa đầu (tránh rối biểu đồ). Bấm "Chọn tất
  // cả" trong ô lọc sẽ hiện toàn bộ khoa một cách tường minh.
  const activeKhoa = selectedKhoa.length > 0 ? selectedKhoa : allKhoa.slice(0, 5);

  const chartsBySection = useMemo(() => {
    if (!hook.data) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const overallRates = MONTH_LABELS.map((_, idx) => computeRate(records, { thang: idx + 1, nam: effectiveYear, khoa: null, contentKey: key }).rate);
      const data = MONTH_LABELS.map((label, idx) => {
        const point = { thang: label, "Toàn viện": overallRates[idx] !== null ? Math.round(overallRates[idx] * 1000) / 10 : null };
        activeKhoa.forEach((khoa) => {
          const { rate } = computeRate(records, { thang: idx + 1, nam: effectiveYear, khoa, contentKey: key });
          point[khoa] = rate !== null ? Math.round(rate * 1000) / 10 : null;
        });
        return point;
      });

      const forecast = forecastNextMonth(overallRates);
      if (forecast) {
        // Điểm cuối thực tế mang cả giá trị dự báo để 2 đoạn nối liền nhau trên biểu đồ.
        data[forecast.lastIndex]["Toàn viện (dự báo)"] = Math.round(forecast.lastValue * 1000) / 10;
        data.push({
          thang: `${MONTH_LABELS[forecast.forecastIndex]}*`,
          "Toàn viện (dự báo)": Math.round(forecast.forecastValue * 1000) / 10,
        });
      }

      return { key, name: CONTENT_LABELS[key], data, hasForecast: !!forecast };
    });
  }, [hook.data, effectiveYear, activeKhoa]);

  const insightLines = useMemo(() => generateTrendInsights(chartsBySection), [chartsBySection]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Xu hướng</p>
        <h1 className="page-title">Xu hướng tuân thủ theo tháng</h1>
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
        <MultiSelect options={allKhoa} value={selectedKhoa} onChange={setSelectedKhoa} placeholder="Mặc định 5 khoa đầu" />
      </div>

      <InsightBox lines={insightLines} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20, marginTop: 20 }}>
        {chartsBySection.map((sec) => (
          <div className="card" key={sec.key}>
            <h3 className="card-title" style={{ marginBottom: 4 }}>{sec.name}</h3>
            {sec.hasForecast && (
              <p className="badge-updated" style={{ marginBottom: 10, display: "block" }}>
                Đường nét đứt là dự báo tháng kế tiếp (hồi quy tuyến tính đơn giản trên số liệu gần nhất) — chỉ mang tính ước tính.
              </p>
            )}
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={sec.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
                <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => (v === null ? "—" : `${v}%`)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {activeKhoa.map((k, i) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={LINE_COLORS[i % LINE_COLORS.length]}
                    strokeWidth={1.5}
                    strokeOpacity={0.55}
                    dot={{ r: 1.5 }}
                    connectNulls
                  />
                ))}
                <Line type="monotone" dataKey="Toàn viện" stroke="var(--navy-950)" strokeWidth={2.5} dot={{ r: 2.5 }} connectNulls />
                {sec.hasForecast && (
                  <Line
                    type="monotone"
                    dataKey="Toàn viện (dự báo)"
                    stroke="var(--navy-950)"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3 }}
                    connectNulls
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
