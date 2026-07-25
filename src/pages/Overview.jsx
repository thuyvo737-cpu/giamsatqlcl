import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { MonthlyDetailCharts } from "../components/MonthlyDetailCharts.jsx";
import { MonthYearFilter } from "../components/MonthYearFilter.jsx";
import { Heatmap } from "../components/Heatmap.jsx";
import { ParetoChart } from "../components/ParetoChart.jsx";
import { DistributionChart } from "../components/DistributionChart.jsx";
import { CoverageDonut } from "../components/CoverageDonut.jsx";
import { MonthOverMonthTable } from "../components/MonthOverMonthTable.jsx";
import { QuarterCompareChart } from "../components/QuarterCompareChart.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  CONTENT_COLORS,
  aggregateAllKhoa,
  buildCoverageDonut,
  buildDistribution,
  buildHeatmapMatrix,
  buildMonthOverMonth,
  buildQuarterComparison,
  computeKpiSummary,
  getAvailableYears,
} from "../utils/aggregate.js";
import { generateInsights } from "../utils/insights.js";

// 4 KPI đầu trang luôn theo đúng thứ tự nhận dạng/vòng tay/té ngã/ATPT
const KPI_ORDER = ["nhanDang", "vongTay", "teNga", "atpt"];

export function Overview({ loiViPham, ketQuaFull }) {
  const now = new Date();
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [heatmapContent, setHeatmapContent] = useState(CONTENT_KEYS[0]);

  const years = useMemo(() => getAvailableYears(ketQuaFull.data), [ketQuaFull.data]);
  const effectiveMonth = month ?? now.getMonth() + 1;
  const effectiveYear =
    year ?? (years.includes(now.getFullYear()) ? now.getFullYear() : years[0] || now.getFullYear());
  const isAuto = month === null && year === null;

  const kpis = useMemo(
    () =>
      ketQuaFull.data
        ? computeKpiSummary(ketQuaFull.data, { thang: effectiveMonth, nam: effectiveYear })
        : [],
    [ketQuaFull.data, effectiveMonth, effectiveYear]
  );

  const khoaRates = useMemo(
    () => (ketQuaFull.data ? aggregateAllKhoa(ketQuaFull.data, { thang: effectiveMonth, nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveMonth, effectiveYear]
  );
  const distribution = useMemo(() => buildDistribution(khoaRates), [khoaRates]);
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
  const quarterData = useMemo(
    () => (ketQuaFull.data ? buildQuarterComparison(ketQuaFull.data, { nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveYear]
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

  if (ketQuaFull.loading) return <LoadingState />;
  if (ketQuaFull.error) return <ErrorState message={ketQuaFull.error} />;

  const topViolations = (loiViPham.data?.rows || []).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Tổng quan</p>
        <h1 className="page-title">Kết quả giám sát tuân thủ QT-QĐ</h1>
      </div>

      <div className="grid grid-4">
        {KPI_ORDER.map((key) => {
          const k = kpis.find((x) => x.key === key);
          return (
            <StatCard
              key={key}
              label={CONTENT_LABELS[key]}
              value={k?.rate ?? null}
              n={k?.n ?? null}
              delta={k?.delta ?? null}
              color={CONTENT_COLORS[key]}
            />
          );
        })}
      </div>

      {/* ---- Bộ lọc bên trái + Nhận xét tự động bên phải ---- */}
      <div className="grid grid-2" style={{ marginTop: 24, alignItems: "stretch" }}>
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3 className="card-title">Chọn khoảng thời gian xem</h3>
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
          <span className="badge-updated" style={{ marginTop: 8, display: "block" }}>
            {isAuto ? `Tự động — Tháng ${effectiveMonth}/${effectiveYear} (hiện tại)` : `Đang xem Tháng ${effectiveMonth}/${effectiveYear}`}
          </span>
        </div>
        <InsightBox lines={insightLines} title={`Nhận xét tự động — Tháng ${effectiveMonth}/${effectiveYear}`} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">So sánh theo quý — Năm {effectiveYear}</h3>
        {ketQuaFull.loading ? <LoadingState /> : <QuarterCompareChart data={quarterData} />}
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 className="card-title">Phân bố khoa theo mức tuân thủ</h3>
          {ketQuaFull.loading ? <LoadingState /> : <DistributionChart buckets={distribution} />}
        </div>
        <div className="card">
          <h3 className="card-title">Cơ cấu hình thức giám sát</h3>
          {ketQuaFull.loading ? <LoadingState /> : <CoverageDonut data={donutData} />}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Biến động so với tháng trước</h3>
        {ketQuaFull.loading ? <LoadingState /> : <MonthOverMonthTable data={monthOverMonth} />}
      </div>

      {/* ---- Biểu đồ chi tiết theo tiêu chí con — đưa lên trước Heatmap ---- */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 4 }}>
          Biểu đồ chi tiết theo từng tiêu chí
        </h3>
        <p className="badge-updated" style={{ marginBottom: 18, display: "block" }}>
          Tháng {effectiveMonth}/{effectiveYear} · gộp toàn viện
        </p>
        {ketQuaFull.loading && <LoadingState />}
        {ketQuaFull.error && <ErrorState message={ketQuaFull.error} />}
        {!ketQuaFull.loading && !ketQuaFull.error && (
          <MonthlyDetailCharts ketQuaFullData={ketQuaFull.data} month={effectiveMonth} year={effectiveYear} />
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
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

      {/* ---- Lỗi vi phạm — cuối cùng ---- */}
      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 className="card-title">Pareto lỗi vi phạm (lũy kế năm)</h3>
          {loiViPham.loading ? <LoadingState /> : <ParetoChart legend={loiViPham.data?.legend} />}
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
                      <td colSpan={2} style={{ color: "#9a92ac" }}>
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
    </div>
  );
}
