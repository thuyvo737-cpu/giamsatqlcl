import { useEffect, useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { StatCard } from "../components/StatCard.jsx";
import { MonthlyDetailCharts } from "../components/MonthlyDetailCharts.jsx";
import { MultiSelect } from "../components/MultiSelect.jsx";
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
  buildContentSummary,
  buildDistribution,
  buildMonthOverMonthByContent,
  buildQuarterComparisonByContent,
  findRepeatedViolations,
  getAvailableYears,
  resolvePeriod,
} from "../utils/aggregate.js";
import { generateContentInsights } from "../utils/insights.js";

const KPI_ORDER = ["nhanDang", "vongTay", "teNga", "atpt"];
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

export function Overview({ loiViPham, ketQuaFull }) {
  const now = new Date();
  const [selectedMonths, setSelectedMonths] = useState([now.getMonth() + 1]);
  const [year, setYear] = useState(null);

  const years = useMemo(() => getAvailableYears(ketQuaFull.data), [ketQuaFull.data]);
  useEffect(() => {
    if (years.length && year === null) setYear(years.includes(now.getFullYear()) ? now.getFullYear() : years[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);
  const effectiveYear = year ?? years[0] ?? now.getFullYear();

  const period = useMemo(() => resolvePeriod(selectedMonths, effectiveYear), [selectedMonths, effectiveYear]);

  const contentSummaries = useMemo(
    () =>
      ketQuaFull.data
        ? buildContentSummary(ketQuaFull.data, {
            thang: period.thang,
            nam: effectiveYear,
            khoa: null,
            prevThang: period.prevThang,
            prevNam: period.prevNam,
          })
        : [],
    [ketQuaFull.data, period, effectiveYear]
  );

  const khoaRates = useMemo(
    () => (ketQuaFull.data ? aggregateAllKhoa(ketQuaFull.data, { thang: period.thang, nam: effectiveYear }) : []),
    [ketQuaFull.data, period, effectiveYear]
  );
  const distribution = useMemo(() => buildDistribution(khoaRates), [khoaRates]);
  const donutData = useMemo(
    () => (ketQuaFull.data ? buildCoverageDonut(ketQuaFull.data, { thang: period.thang, nam: effectiveYear }) : []),
    [ketQuaFull.data, period, effectiveYear]
  );
  const quarterData = useMemo(
    () => (ketQuaFull.data ? buildQuarterComparisonByContent(ketQuaFull.data, { nam: effectiveYear }) : []),
    [ketQuaFull.data, effectiveYear]
  );

  const [momContent, setMomContent] = useState(CONTENT_KEYS[0]);
  const monthOverMonth = useMemo(
    () =>
      ketQuaFull.data
        ? buildMonthOverMonthByContent(ketQuaFull.data, {
            thang: period.thang,
            nam: effectiveYear,
            prevThang: period.prevThang,
            prevNam: period.prevNam,
            contentKey: momContent,
          })
        : [],
    [ketQuaFull.data, period, effectiveYear, momContent]
  );

  const repeatedViolations = useMemo(() => {
    const months = Array.isArray(period.thang) ? period.thang : period.thang ? [period.thang] : [];
    return findRepeatedViolations(loiViPham.data, months);
  }, [loiViPham.data, period]);

  const insightLines = useMemo(
    () =>
      generateContentInsights({
        contentSummaries,
        currentLabel: period.currentLabel,
        previousLabel: period.previousLabel,
        khoaFocus: null,
        repeatedViolations,
      }),
    [contentSummaries, period, repeatedViolations]
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

      {/* ---- Bộ lọc lên đầu tiên ---- */}
      <div className="card">
        <h3 className="card-title">Chọn khoảng thời gian xem</h3>
        <div className="control-row" style={{ marginBottom: 0 }}>
          <MultiSelect options={MONTH_OPTIONS} value={selectedMonths} onChange={setSelectedMonths} placeholder="Tháng" searchable={false} />
          <select className="select" value={effectiveYear} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
        <p className="badge-updated" style={{ marginTop: 10, display: "block" }}>
          Đang xem {period.currentLabel}
          {selectedMonths.length === 3 && period.mode !== "quarter" ? " (tổ hợp 3 tháng không khớp 1 quý chuẩn)" : ""}
          {" · "}
          {selectedMonths.length ? "chọn nhiều tháng liền 1 quý để xem so sánh theo quý" : "đang xem cả năm"}
        </p>
      </div>

      <div className="grid grid-4" style={{ marginTop: 20 }}>
        {KPI_ORDER.map((key) => {
          const c = contentSummaries.find((x) => x.key === key);
          return (
            <StatCard
              key={key}
              label={CONTENT_LABELS[key]}
              value={c?.rate ?? null}
              n={c?.n ?? null}
              delta={c?.delta ?? null}
              color={CONTENT_COLORS[key]}
            />
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <InsightBox lines={insightLines} title={`Nhận xét tự động — ${period.currentLabel}`} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">So sánh theo quý — Năm {effectiveYear}</h3>
        <QuarterCompareChart data={quarterData} />
      </div>

      <div className="grid grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h3 className="card-title">Phân bố khoa theo mức tuân thủ</h3>
          <DistributionChart buckets={distribution} />
        </div>
        <div className="card">
          <h3 className="card-title">Cơ cấu hình thức giám sát</h3>
          <p className="badge-updated" style={{ marginBottom: 10, display: "block" }}>
            Giám sát chéo và Ngoại kiểm (không tính Tự giám sát vào kết quả cuối)
          </p>
          <CoverageDonut data={donutData} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 4 }}>
              Biến động so với {period.mode === "quarter" ? "quý trước" : "kỳ trước"}
            </h3>
            <p className="badge-updated" style={{ display: "block" }}>
              Danh sách khoa cải thiện/giảm nhiều nhất, tính riêng cho từng nội dung — không gộp trung bình.
            </p>
          </div>
          <select className="select" value={momContent} onChange={(e) => setMomContent(e.target.value)}>
            {CONTENT_KEYS.map((k) => (
              <option key={k} value={k}>
                {CONTENT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 16 }}>
          <MonthOverMonthTable data={monthOverMonth} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Biểu đồ chi tiết theo từng tiêu chí</h3>
        <MonthlyDetailCharts ketQuaFullData={ketQuaFull.data} month={period.thang} year={effectiveYear} />
      </div>

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
