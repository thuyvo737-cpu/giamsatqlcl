import { useEffect, useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { MultiSelect } from "../components/MultiSelect.jsx";
import { RankingChart } from "../components/RankingChart.jsx";
import { PeriodCompareChart } from "../components/PeriodCompareChart.jsx";
import { MonthlyDetailCharts } from "../components/MonthlyDetailCharts.jsx";
import { Heatmap } from "../components/Heatmap.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
  buildHeatmapMatrix,
  buildPeriodCompare,
  buildContentSummary,
  resolvePeriod,
} from "../utils/aggregate.js";
import { generateContentInsights } from "../utils/insights.js";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

export function KetQua({ hook }) {
  const [selectedKhoa, setSelectedKhoa] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]); // rỗng = Cả năm
  const [selectedYears, setSelectedYears] = useState([]);
  const [rankContent, setRankContent] = useState(CONTENT_KEYS[0]);
  const [heatmapContent, setHeatmapContent] = useState(CONTENT_KEYS[0]);
  const [heatmapLimit, setHeatmapLimit] = useState("10");
  const [heatmapSearch, setHeatmapSearch] = useState("");

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);
  useEffect(() => {
    if (years.length && selectedYears.length === 0) setSelectedYears([years[0]]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const thangFilter = selectedMonths.length ? selectedMonths : null;
  const namFilter = selectedYears.length ? selectedYears : null;
  const khoaFilter = selectedKhoa.length ? selectedKhoa : null;
  const effectiveYear = selectedYears[0] || years[0];

  // Kỳ đang xem (tháng/quý/khoảng tuỳ ý) — dùng cho nhận xét + biểu đồ so sánh kỳ trước.
  const period = useMemo(
    () => resolvePeriod(selectedMonths.length ? selectedMonths : [new Date().getMonth() + 1], effectiveYear),
    [selectedMonths, effectiveYear]
  );

  const allKhoaFull = useMemo(() => {
    if (!hook.data) return [];
    const allKhoa = new Set();
    CONTENT_KEYS.forEach((g) => {
      listKhoa(getRecordsForContent(hook.data, g).filter((r) => (namFilter ? namFilter.includes(r.nam) : true))).forEach((k) =>
        allKhoa.add(k)
      );
    });
    return Array.from(allKhoa).sort();
  }, [hook.data, namFilter]);

  const displayKhoa = selectedKhoa.length ? allKhoaFull.filter((k) => selectedKhoa.includes(k)) : allKhoaFull;

  const rankingData = useMemo(() => {
    if (!hook.data) return [];
    return displayKhoa
      .map((khoa) => {
        const { rate } = computeRate(getRecordsForContent(hook.data, rankContent), {
          thang: thangFilter,
          nam: namFilter,
          khoa,
          contentKey: rankContent,
        });
        return rate !== null && rate !== undefined ? { khoa, value: Math.round(rate * 1000) / 10 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.value - a.value);
  }, [hook.data, displayKhoa, rankContent, thangFilter, namFilter]);

  const periodCompareData = useMemo(
    () =>
      hook.data
        ? buildPeriodCompare(hook.data, {
            khoa: khoaFilter,
            thang: period.thang,
            nam: effectiveYear,
            prevThang: period.prevThang,
            prevNam: period.prevNam,
          })
        : [],
    [hook.data, khoaFilter, period, effectiveYear]
  );

  const heatmapMatrix = useMemo(() => {
    if (!hook.data) return [];
    let rows = buildHeatmapMatrix(hook.data, heatmapContent, effectiveYear, khoaFilter);
    if (heatmapSearch.trim()) {
      const q = heatmapSearch.trim().toLowerCase();
      rows = rows.filter((r) => r.khoa.toLowerCase().includes(q));
    }
    if (heatmapLimit !== "all") {
      const n = Number(heatmapLimit);
      rows = [...rows]
        .map((r) => ({ ...r, _avg: r.cells.filter((v) => v !== null).reduce((s, v) => s + v, 0) / (r.cells.filter((v) => v !== null).length || 1) }))
        .sort((a, b) => a._avg - b._avg) // thấp nhất lên đầu — ưu tiên xem khoa cần chú ý
        .slice(0, n);
    }
    return rows;
  }, [hook.data, heatmapContent, effectiveYear, khoaFilter, heatmapSearch, heatmapLimit]);

  const focusLabel = selectedKhoa.length === 0 ? null : selectedKhoa.length === 1 ? selectedKhoa[0] : `${selectedKhoa.length} khoa đã chọn`;

  const contentSummaries = useMemo(
    () =>
      hook.data
        ? buildContentSummary(hook.data, {
            thang: period.thang,
            nam: effectiveYear,
            khoa: khoaFilter,
            prevThang: period.prevThang,
            prevNam: period.prevNam,
          })
        : [],
    [hook.data, period, effectiveYear, khoaFilter]
  );
  const insightLines = useMemo(
    () =>
      generateContentInsights({
        contentSummaries,
        currentLabel: period.currentLabel,
        previousLabel: period.previousLabel,
        khoaFocus: focusLabel,
      }),
    [contentSummaries, period, focusLabel]
  );

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Kết quả giám sát</p>
        <h1 className="page-title">Kết quả chi tiết</h1>
        <p className="page-desc">Xếp hạng khoa, so sánh với kỳ trước và bản đồ nhiệt theo tháng — lọc theo nhiều khoa/tháng/năm cùng lúc.</p>
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
      <p className="badge-updated" style={{ display: "block", marginBottom: 16 }}>
        {displayKhoa.length} / {allKhoaFull.length} khoa · {period.currentLabel}
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Xếp hạng khoa theo tỷ lệ tuân thủ</h3>
          <select className="select" value={rankContent} onChange={(e) => setRankContent(e.target.value)}>
            {CONTENT_KEYS.map((g) => (
              <option key={g} value={g}>{CONTENT_LABELS[g]}</option>
            ))}
          </select>
        </div>
        <p className="badge-updated" style={{ margin: "6px 0 12px", display: "block" }}>
          Kéo góc dưới-phải khung bên dưới để thu hẹp/mở rộng phạm vi hiển thị.
        </p>
        <div style={{ resize: "vertical", overflow: "auto", maxHeight: 480, minHeight: 200, border: "1px solid var(--line)", borderRadius: 10, padding: 10 }}>
          <RankingChart data={rankingData} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 4 }}>
          So sánh với {period.mode === "quarter" ? "quý trước" : "kỳ trước"}
          {focusLabel ? ` — ${focusLabel}` : ""}
        </h3>
        <p className="badge-updated" style={{ marginBottom: 12, display: "block" }}>
          {period.currentLabel} so với {period.previousLabel}
        </p>
        <PeriodCompareChart data={periodCompareData} currentLabel={period.currentLabel} previousLabel={period.previousLabel} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <h3 className="card-title" style={{ marginBottom: 0 }}>Biểu đồ nhiệt Khoa × Tháng — Năm {effectiveYear}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="select"
              placeholder="Tìm khoa..."
              value={heatmapSearch}
              onChange={(e) => setHeatmapSearch(e.target.value)}
              style={{ width: 140 }}
            />
            <select className="select" value={heatmapLimit} onChange={(e) => setHeatmapLimit(e.target.value)}>
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="all">Toàn bộ</option>
            </select>
            <select className="select" value={heatmapContent} onChange={(e) => setHeatmapContent(e.target.value)}>
              {CONTENT_KEYS.map((k) => (
                <option key={k} value={k}>{CONTENT_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="badge-updated" style={{ margin: "8px 0 0", display: "block" }}>
          {heatmapLimit !== "all" ? `Đang hiện ${heatmapMatrix.length} khoa có tỷ lệ trung bình thấp nhất (cần chú ý trước)` : `Hiện toàn bộ ${heatmapMatrix.length} khoa`}
        </p>
        <div style={{ marginTop: 16 }}>
          <Heatmap matrix={heatmapMatrix} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Biểu đồ chi tiết theo từng tiêu chí</h3>
        <MonthlyDetailCharts ketQuaFullData={hook.data} month={thangFilter} year={namFilter} khoa={khoaFilter} />
      </div>

      <h2 className="section-title">Nhận xét tự động</h2>
      <InsightBox lines={insightLines} title={`Nhận xét tự động — ${focusLabel || "toàn viện"}`} />
    </div>
  );
}
