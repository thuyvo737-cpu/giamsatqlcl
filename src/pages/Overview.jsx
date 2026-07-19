import { useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { MonthlyDetailCharts } from "../components/MonthlyDetailCharts.jsx";
import { MonthYearFilter } from "../components/MonthYearFilter.jsx";
import { Heatmap } from "../components/Heatmap.jsx";
import { ParetoChart } from "../components/ParetoChart.jsx";
import { DistributionChart } from "../components/DistributionChart.jsx";
import { ScatterSampleVsRate } from "../components/ScatterSampleVsRate.jsx";
import { CoverageDonut } from "../components/CoverageDonut.jsx";
import { MonthOverMonthTable } from "../components/MonthOverMonthTable.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  aggregateAllKhoa,
  buildCoverageDonut,
  buildDistribution,
  buildHeatmapMatrix,
  buildMonthOverMonth,
  getAvailableYears,
} from "../utils/aggregate.js";
import { generateInsights } from "../utils/insights.js";

export function Overview({ bieuDo, loiViPham, ketQuaFull }) {
  const now = new Date();
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [heatmapContent, setHeatmapContent] = useState(CONTENT_KEYS[0]);

  const years = useMemo(() => getAvailableYears(ketQuaFull.data), [ketQuaFull.data]);
  const effectiveMonth = month ?? now.getMonth() + 1;
  const effectiveYear = year ?? (years.includes(now.getFullYear()) ? now.getFullYear() : years[0] || now.getFullYear());
  const isAuto = month === null && year === null;

  const khoaRates = useMemo(
    () => (ketQuaFull.data ? aggregateAllKhoa(ketQuaFull.data, { thang: effectiveMonth, nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveMonth, effectiveYear]
  );
  const distribution = useMemo(() => buildDistribution(khoaRates), [khoaRates]);
  const scatterData = khoaRates;
  const donutData = useMemo(
    () => (ketQuaFull.data ? buildCoverageDonut(ketQuaFull.data, { thang: effectiveMonth, nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveMonth, effectiveYear]
  );
  const monthOverMonth = useMemo(
    () => (ketQuaFull.data ? buildMonthOverMonth(ketQuaFull.data, { thang: effectiveMonth, nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveMonth, effectiveYear]
  );
  const heatmapMatrix = useMemo(
    () => (ketQuaFull.data ? buildHeatmapMatrix(ketQuaFull.data, heatmapContent, effectiveYear) : []),
    [ketQuaFull.data, heatmapContent, effectiveYear]
  );
  const insightLines = useMemo(
    () =>
      generateInsights({
        khoaRates,
        distribution,
        monthOverMonth,
        violationLegend: loiViPham.data?.legend,
        thang: effectiveMonth,
        nam: effectiveYear,
      }),
    [khoaRates, distribution, monthOverMonth, loiViPham.data, effectiveMonth, effectiveYear]
  );

  if (bieuDo.loading) return <LoadingState />;
  if (bieuDo.error) return <ErrorState message={bieuDo.error} />;

  const kpis = bieuDo.data?.kpis || [];
  const overall = bieuDo.data?.overall || 0;

  const radarData = kpis.map((k) => ({
    name: k.label.length > 22 ? k.label.slice(0, 22) + "…" : k.label,
    "Tỷ lệ tuân thủ": Math.round(k.value * 1000) / 10,
  }));

  const topViolations = (loiViPham.data?.rows || []).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Tổng quan · Cập nhật realtime</p>
        <h1 className="page-title">{bieuDo.data?.title || "Kết quả giám sát tuân thủ QT-QĐ"}</h1>
        <p className="page-desc">
          Tỷ lệ tuân thủ chung toàn viện: <strong>{Math.round(overall * 1000) / 10}%</strong> — tổng hợp từ 4 nội
          dung giám sát cốt lõi bên dưới.
        </p>
      </div>

      <div className="grid grid-4">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3 className="card-title">Biểu đồ tổng hợp tỷ lệ tuân thủ</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius={95}>
              <PolarGrid stroke="#dbe1e0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "#4d6072" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#8497a6" }} />
              <Radar name="Tỷ lệ tuân thủ" dataKey="Tỷ lệ tuân thủ" stroke="#2a9d8f" fill="#2a9d8f" fillOpacity={0.35} />
              <Tooltip formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">Khoa có nhiều lỗi vi phạm nhất (lũy kế năm)</h3>
          {loiViPham.loading && <LoadingState />}
          {loiViPham.error && <ErrorState message={loiViPham.error} />}
          {!loiViPham.loading && !loiViPham.error && (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Khoa</th>
                    <th>Số tháng có lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {topViolations.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ color: "#8497a6" }}>
                        Chưa có dữ liệu lỗi vi phạm.
                      </td>
                    </tr>
                  )}
                  {topViolations.map((r) => (
                    <tr key={r.khoa}>
                      <td className="khoa-cell">{r.khoa}</td>
                      <td>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ---- Bộ lọc dùng chung cho toàn bộ phần phân tích bên dưới ---- */}
      <div className="card" style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            Biểu đồ chi tiết theo từng nội dung
          </h3>
          <MonthYearFilter
            month={effectiveMonth}
            year={effectiveYear}
            years={years}
            isAuto={isAuto}
            onMonthChange={setMonth}
            onYearChange={setYear}
            onReset={() => {
              setMonth(null);
              setYear(null);
            }}
          />
        </div>
        <p className="badge-updated" style={{ marginBottom: 18, display: "block" }}>
          {isAuto
            ? `Đang hiển thị tự động — Tháng ${effectiveMonth}/${effectiveYear} (tháng hiện tại)`
            : `Đang xem Tháng ${effectiveMonth}/${effectiveYear}`}
        </p>

        {ketQuaFull.loading && <LoadingState />}
        {ketQuaFull.error && <ErrorState message={ketQuaFull.error} />}
        {!ketQuaFull.loading && !ketQuaFull.error && (
          <MonthlyDetailCharts ketQuaFullData={ketQuaFull.data} month={effectiveMonth} year={effectiveYear} />
        )}
      </div>

      {/* ---- Nhận xét tự động ---- */}
      <div style={{ marginTop: 24 }}>
        <InsightBox lines={insightLines} title={`Nhận xét tự động — Tháng ${effectiveMonth}/${effectiveYear}`} />
      </div>

      {/* ---- Phân tích tổng quan trực quan ---- */}
      <p className="section-title" style={{ marginTop: 32 }}>
        Phân tích tổng quan
      </p>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>
            Biểu đồ nhiệt Khoa × Tháng — Năm {effectiveYear}
          </h3>
          <select className="select" value={heatmapContent} onChange={(e) => setHeatmapContent(e.target.value)}>
            {CONTENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {CONTENT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 16 }}>
          {ketQuaFull.loading ? <LoadingState /> : <Heatmap matrix={heatmapMatrix} />}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 className="card-title">Pareto lỗi vi phạm (lũy kế năm)</h3>
          {loiViPham.loading ? <LoadingState /> : <ParetoChart legend={loiViPham.data?.legend} />}
        </div>
        <div className="card">
          <h3 className="card-title">Phân bố khoa theo mức tuân thủ — Tháng {effectiveMonth}/{effectiveYear}</h3>
          {ketQuaFull.loading ? <LoadingState /> : <DistributionChart buckets={distribution} />}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 className="card-title">Cỡ mẫu × Tỷ lệ tuân thủ — Tháng {effectiveMonth}/{effectiveYear}</h3>
          {ketQuaFull.loading ? <LoadingState /> : <ScatterSampleVsRate data={scatterData} />}
        </div>
        <div className="card">
          <h3 className="card-title">Cơ cấu hình thức giám sát — Tháng {effectiveMonth}/{effectiveYear}</h3>
          {ketQuaFull.loading ? <LoadingState /> : <CoverageDonut data={donutData} />}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">
          Biến động so với tháng trước — Tháng {effectiveMonth}/{effectiveYear}
        </h3>
        {ketQuaFull.loading ? <LoadingState /> : <MonthOverMonthTable data={monthOverMonth} />}
      </div>
    </div>
  );
}
