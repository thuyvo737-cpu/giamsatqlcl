import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";

function barColor(pct) {
  if (pct >= 90) return "#2a9d8f";
  if (pct >= 70) return "#e0a458";
  return "#d1615a";
}

export function MonthlyDetailCharts({ ketQuaFullData, month, year }) {
  const chartsBySection = useMemo(() => {
    if (!ketQuaFullData) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(ketQuaFullData, key);
      const khoas = listKhoa(records.filter((r) => r.nam === year));
      const data = khoas.map((khoa) => {
        const { rate } = computeRate(records, { thang: month, nam: year, khoa, contentKey: key });
        return { khoa, value: rate !== null ? Math.round(rate * 1000) / 10 : 0 };
      });
      return { key, name: CONTENT_LABELS[key], data };
    });
  }, [ketQuaFullData, month, year]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 20 }}>
      {chartsBySection.map((sec) => (
        <div key={sec.key}>
          <h4
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--navy-900)",
              margin: "0 0 10px",
            }}
          >
            {sec.name}
          </h4>
          {sec.data.length === 0 ? (
            <div className="state-box">Chưa có dữ liệu.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sec.data} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" vertical={false} />
                <XAxis dataKey="khoa" tick={{ fontSize: 10 }} interval={0} angle={-40} textAnchor="end" height={50} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} width={40} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {sec.data.map((d, i) => (
                    <Cell key={i} fill={barColor(d.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ))}
    </div>
  );
}
