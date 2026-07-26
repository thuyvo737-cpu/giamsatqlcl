import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { TOOLTIP_STYLE } from "../utils/chartTheme.js";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  CONTENT_COLORS,
  computeSubCriteriaRates,
  getRecordsForContent,
} from "../utils/aggregate.js";

function barColor(pct) {
  if (pct >= 90) return "#5fb3a3";
  if (pct >= 70) return "#e3ab68";
  return "#d9897f";
}

/**
 * Biểu đồ chi tiết theo TỪNG TIÊU CHÍ CON của mỗi nội dung (không còn
 * tách theo khoa) — ví dụ Nhận dạng NB sẽ hiện tỷ lệ của "Sử dụng câu
 * hỏi mở", "Nhận dạng họ tên NB", "Có đối chiếu MSYT"... `khoa` (mảng
 * hoặc null) cho phép giới hạn vào 1/nhiều khoa cụ thể khi tái sử dụng
 * ở trang Kết quả giám sát.
 */
export function MonthlyDetailCharts({ ketQuaFullData, month, year, khoa = null }) {
  const chartsBySection = useMemo(() => {
    if (!ketQuaFullData) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(ketQuaFullData, key);
      const subRates = computeSubCriteriaRates(records, { thang: month, nam: year, khoa, contentKey: key });
      const data = subRates.map((s) => ({
        label: s.label,
        value: s.rate !== null ? Math.round(s.rate * 1000) / 10 : null,
      }));
      return { key, name: CONTENT_LABELS[key], data };
    });
  }, [ketQuaFullData, month, year, khoa]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 20 }}>
      {chartsBySection.map((sec) => (
        <div key={sec.key}>
          <h4
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--navy-900)",
              margin: "0 0 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: CONTENT_COLORS[sec.key],
                display: "inline-block",
              }}
            />
            {sec.name}
          </h4>
          {sec.data.length === 0 ? (
            <div className="state-box">Chưa có dữ liệu.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sec.data} margin={{ left: 8, right: 8, top: 20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11.5 }} interval={0} angle={-40} textAnchor="end" height={110} />
                <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={44} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v) => (v === null ? "—" : `${v}%`)} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {sec.data.map((d, i) => (
                    <Cell key={i} fill={d.value === null ? "#dbe1e0" : barColor(d.value)} />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="top"
                    formatter={(v) => (v === null || v === undefined ? "" : `${v}%`)}
                    style={{ fontSize: 10, fontWeight: 700, fill: "var(--navy-900)" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ))}
    </div>
  );
}
