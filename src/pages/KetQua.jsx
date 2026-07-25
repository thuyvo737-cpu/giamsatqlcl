import { Fragment, useEffect, useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { MultiSelect } from "../components/MultiSelect.jsx";
import { RankingChart } from "../components/RankingChart.jsx";
import { PeriodCompareChart } from "../components/PeriodCompareChart.jsx";
import { MonthlyDetailCharts } from "../components/MonthlyDetailCharts.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  computeTotalRow,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
  buildMonthOverMonth,
  buildPeriodCompare,
} from "../utils/aggregate.js";
import { generateInsights } from "../utils/insights.js";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

export function KetQua({ hook, loiViPham }) {
  const now = new Date();
  const [selectedKhoa, setSelectedKhoa] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]); // rỗng = Cả năm
  const [selectedYears, setSelectedYears] = useState([]);
  const [sort, setSort] = useState({ key: null, dir: "desc" });
  const [rankContent, setRankContent] = useState(CONTENT_KEYS[0]);
  const [focusKhoa, setFocusKhoa] = useState(null);

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);

  // Mặc định chọn năm gần nhất khi dữ liệu vừa tải xong.
  useEffect(() => {
    if (years.length && selectedYears.length === 0) setSelectedYears([years[0]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const thang = selectedMonths.length ? selectedMonths : null;
  const nam = selectedYears.length ? selectedYears : null;

  const allKhoaFull = useMemo(() => {
    if (!hook.data) return [];
    const allKhoa = new Set();
    CONTENT_KEYS.forEach((g) => {
      listKhoa(getRecordsForContent(hook.data, g).filter((r) => (nam ? nam.includes(r.nam) : true))).forEach((k) =>
        allKhoa.add(k)
      );
    });
    return Array.from(allKhoa).sort();
  }, [hook.data, nam]);

  const displayKhoa = selectedKhoa.length ? allKhoaFull.filter((k) => selectedKhoa.includes(k)) : allKhoaFull;

  const tableRows = useMemo(() => {
    if (!hook.data) return [];
    return displayKhoa.map((khoa) => {
      const values = {};
      CONTENT_KEYS.forEach((g) => {
        values[g] = computeRate(getRecordsForContent(hook.data, g), { thang, nam, khoa, contentKey: g });
      });
      return { khoa, values };
    });
  }, [hook.data, displayKhoa, thang, nam]);

  // Giá trị lớn nhất/nhỏ nhất mỗi cột — để tô nổi trong bảng, giúp thấy
  // ngay khoa cao nhất/thấp nhất mà không cần dò từng dòng.
  const extremes = useMemo(() => {
    const result = {};
    CONTENT_KEYS.forEach((g) => {
      const rates = tableRows.map((r) => r.values[g].rate).filter((v) => v !== null && v !== undefined);
      result[g] = rates.length > 1 ? { max: Math.max(...rates), min: Math.min(...rates) } : { max: null, min: null };
    });
    return result;
  }, [tableRows]);

  const sortedRows = useMemo(() => {
    if (!sort.key) return tableRows;
    const rows = [...tableRows];
    rows.sort((a, b) => {
      const va = a.values[sort.key].rate ?? -1;
      const vb = b.values[sort.key].rate ?? -1;
      return sort.dir === "asc" ? va - vb : vb - va;
    });
    return rows;
  }, [tableRows, sort]);

  const totalRow = useMemo(() => computeTotalRow(tableRows), [tableRows]);

  const rankingData = useMemo(
    () =>
      [...tableRows]
        .filter((r) => r.values[rankContent].rate !== null && r.values[rankContent].rate !== undefined)
        .map((r) => ({ khoa: r.khoa, value: Math.round(r.values[rankContent].rate * 1000) / 10 }))
        .sort((a, b) => b.value - a.value),
    [tableRows, rankContent]
  );

  useEffect(() => {
    if (!focusKhoa && displayKhoa.length) setFocusKhoa(displayKhoa[0]);
    if (focusKhoa && !displayKhoa.includes(focusKhoa) && displayKhoa.length) setFocusKhoa(displayKhoa[0]);
  }, [displayKhoa, focusKhoa]);

  // Chỉ có ý nghĩa khi đang xem đúng 1 tháng + 1 năm cụ thể (không phải "Cả năm" / nhiều kỳ).
  const singlePeriod = selectedMonths.length === 1 && selectedYears.length === 1;
  const focusMonth = singlePeriod ? selectedMonths[0] : now.getMonth() + 1;
  const focusYear = singlePeriod ? selectedYears[0] : selectedYears[0] || years[0] || now.getFullYear();

  const periodCompareData = useMemo(
    () => (hook.data && focusKhoa ? buildPeriodCompare(hook.data, { khoa: focusKhoa, thang: focusMonth, nam: focusYear }) : []),
    [hook.data, focusKhoa, focusMonth, focusYear]
  );

  const khoaRatesForInsight = useMemo(
    () =>
      tableRows
        .map((r) => {
          const rates = CONTENT_KEYS.map((g) => r.values[g].rate).filter((v) => v !== null && v !== undefined);
          const n = CONTENT_KEYS.reduce((s, g) => s + (r.values[g].n || 0), 0);
          if (!rates.length) return null;
          return { khoa: r.khoa, rate: rates.reduce((a, b) => a + b, 0) / rates.length, n };
        })
        .filter(Boolean),
    [tableRows]
  );
  const monthOverMonth = useMemo(
    () => (hook.data && singlePeriod ? buildMonthOverMonth(hook.data, { thang: focusMonth, nam: focusYear }) : []),
    [hook.data, singlePeriod, focusMonth, focusYear]
  );
  const insightLines = useMemo(
    () =>
      generateInsights({
        khoaRates: khoaRatesForInsight,
        distribution: [],
        monthOverMonth,
        violationLegend: loiViPham?.data?.legend,
        thang: focusMonth,
        nam: focusYear,
      }),
    [khoaRatesForInsight, monthOverMonth, loiViPham?.data, focusMonth, focusYear]
  );

  function toggleSort(g) {
    setSort((s) => (s.key === g ? { key: g, dir: s.dir === "desc" ? "asc" : "desc" } : { key: g, dir: "desc" }));
  }

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Kết quả giám sát</p>
        <h1 className="page-title">Chi tiết từng khoa</h1>
        <p className="page-desc">Số lượng giám sát và tỷ lệ tuân thủ theo từng nội dung, có thể lọc theo nhiều khoa/tháng/năm cùng lúc.</p>
      </div>

      <div className="control-row">
        <MultiSelect options={allKhoaFull} value={selectedKhoa} onChange={setSelectedKhoa} placeholder="Khoa" />
        <MultiSelect options={MONTH_OPTIONS} value={selectedMonths} onChange={setSelectedMonths} placeholder="Tháng" searchable={false} />
        <MultiSelect
          options={years.map((y) => ({ value: y, label: `Năm ${y}` }))}
          value={selectedYears}
          onChange={setSelectedYears}
          placeholder="Năm"
          searchable={false}
        />
      </div>
      <p className="badge-updated" style={{ display: "block", marginBottom: 12 }}>
        {displayKhoa.length} / {allKhoaFull.length} khoa
        {hook.lastUpdated ? ` · cập nhật ${hook.lastUpdated.toLocaleTimeString("vi-VN")}` : ""}
      </p>

      <div className="table-wrap table-scroll">
        <table className="align-center">
          <thead>
            <tr>
              <th rowSpan={2} style={{ position: "sticky", left: 0, top: 0, zIndex: 3, background: "var(--navy-950)", textAlign: "left" }}>
                Khoa
              </th>
              {CONTENT_KEYS.map((g, i) => (
                <th key={g} colSpan={2} className={`group-${i}`} style={{ position: "sticky", top: 0, zIndex: 2 }}>
                  {CONTENT_LABELS[g]}
                </th>
              ))}
            </tr>
            <tr>
              {CONTENT_KEYS.map((g, i) => (
                <Fragment key={g}>
                  <th className={`group-${i}`} style={{ position: "sticky", top: 33, zIndex: 2, fontSize: 10.5 }}>
                    Số lượng
                  </th>
                  <th
                    className={`group-${i} sortable-th`}
                    style={{ position: "sticky", top: 33, zIndex: 2, fontSize: 10.5 }}
                    onClick={() => toggleSort(g)}
                    title="Bấm để sắp xếp"
                  >
                    Tỷ lệ {sort.key === g ? (sort.dir === "desc" ? "▼" : "▲") : ""}
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={1 + CONTENT_KEYS.length * 2} style={{ color: "#8497a6" }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
            {sortedRows.map((r) => (
              <tr key={r.khoa}>
                <td className="khoa-cell">{r.khoa}</td>
                {CONTENT_KEYS.map((g) => {
                  const { n, rate } = r.values[g];
                  const isMax = extremes[g].max !== null && rate === extremes[g].max;
                  const isMin = extremes[g].min !== null && rate === extremes[g].min;
                  return (
                    <Fragment key={g}>
                      <td>{n || "—"}</td>
                      <td className={isMax ? "cell-max" : isMin ? "cell-min" : ""}>
                        {rate === null || rate === undefined ? (
                          <span className="na-badge">—</span>
                        ) : (
                          <span className={pillClass(rate)}>{Math.round(rate * 1000) / 10}%</span>
                        )}
                        {isMax && <span className="extreme-tag good"> cao nhất</span>}
                        {isMin && <span className="extreme-tag bad"> thấp nhất</span>}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
            {sortedRows.length > 0 && (
              <tr className="total-row">
                <td className="khoa-cell">Tổng cộng</td>
                {CONTENT_KEYS.map((g) => {
                  const { n, rate } = totalRow[g] || {};
                  return (
                    <Fragment key={g}>
                      <td>{n || "—"}</td>
                      <td>
                        {rate === null || rate === undefined ? (
                          <span className="na-badge">—</span>
                        ) : (
                          <span className={pillClass(rate)}>{Math.round(rate * 1000) / 10}%</span>
                        )}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <InsightBox lines={insightLines} title="Nhận xét tự động" />

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Xếp hạng khoa theo tỷ lệ tuân thủ</h3>
          <select className="select" value={rankContent} onChange={(e) => setRankContent(e.target.value)}>
            {CONTENT_KEYS.map((g) => (
              <option key={g} value={g}>{CONTENT_LABELS[g]}</option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 16 }}>
          <RankingChart data={rankingData} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>So sánh với tháng trước / quý trước</h3>
          <select className="select" value={focusKhoa || ""} onChange={(e) => setFocusKhoa(e.target.value)}>
            {displayKhoa.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <p className="badge-updated" style={{ marginBottom: 12, display: "block" }}>
          Mốc so sánh: Tháng {focusMonth}/{focusYear}
        </p>
        <PeriodCompareChart data={periodCompareData} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 4 }}>Biểu đồ chi tiết theo từng tiêu chí</h3>
        <p className="badge-updated" style={{ marginBottom: 18, display: "block" }}>
          {selectedKhoa.length ? `${selectedKhoa.length} khoa đã chọn` : "Tất cả khoa"} ·{" "}
          {thang ? `Tháng ${selectedMonths.join(", ")}` : "Cả năm"} · {nam ? `Năm ${selectedYears.join(", ")}` : "Mọi năm"}
        </p>
        <MonthlyDetailCharts
          ketQuaFullData={hook.data}
          month={thang}
          year={nam}
          khoa={selectedKhoa.length ? selectedKhoa : null}
        />
      </div>
    </div>
  );
}

function pillClass(rate) {
  if (rate >= 0.9) return "pill pill-good";
  if (rate >= 0.7) return "pill pill-warn";
  return "pill pill-bad";
}
