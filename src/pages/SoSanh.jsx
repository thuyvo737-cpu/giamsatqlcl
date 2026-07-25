import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { DumbbellChart } from "../components/DumbbellChart.jsx";
import { MultiSelect } from "../components/MultiSelect.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";
import { generateComparisonInsights } from "../utils/insights.js";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
const round1 = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 10);

function colorSlug(key) {
  return { nhanDang: "nhandang", vongTay: "vongtay", teNga: "tenga", atpt: "atpt", s5: "5s" }[key];
}

export function SoSanh({ hook }) {
  const now = new Date();
  const [selectedKhoa, setSelectedKhoa] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([now.getMonth() + 1]);
  const [selectedYears, setSelectedYears] = useState([]);

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);
  useEffect(() => {
    if (years.length && selectedYears.length === 0) {
      const cy = now.getFullYear();
      setSelectedYears([years.includes(cy) ? cy : years[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const thang = selectedMonths.length ? selectedMonths : null;
  const nam = selectedYears.length ? selectedYears : null;
  const khoaFilter = selectedKhoa.length ? selectedKhoa : null;
  const trendYear = selectedYears[0] || years[0];

  const allKhoa = useMemo(() => {
    if (!hook.data) return [];
    const set = new Set();
    CONTENT_KEYS.forEach((g) => {
      listKhoa(getRecordsForContent(hook.data, g).filter((r) => (nam ? nam.includes(r.nam) : true))).forEach((k) => set.add(k));
    });
    return Array.from(set).sort();
  }, [hook.data, nam]);

  // Tổng hợp toàn viện (hoặc gộp các khoa đang chọn) — mặc định KHÔNG
  // chia theo khoa, chỉ so sánh 2 hình thức GS chéo/Ngoại kiểm theo từng
  // nội dung.
  const aggSections = useMemo(() => {
    if (!hook.data) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const { rCheo, rNgoai, rate } = computeRate(records, { thang, nam, khoa: khoaFilter, contentKey: key });
      return { key, name: CONTENT_LABELS[key], rCheo, rNgoai, rate };
    });
  }, [hook.data, thang, nam, khoaFilter]);

  const summaryRows = aggSections
    .filter((s) => s.rCheo !== null || s.rNgoai !== null)
    .map((s) => ({ khoa: s.name, a: round1(s.rCheo) ?? 0, b: round1(s.rNgoai) ?? 0 }));

  // Chi tiết riêng từng khoa đã chọn (chỉ hiện khi có chọn khoa cụ thể).
  const detailSections = useMemo(() => {
    if (!hook.data || !selectedKhoa.length) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const rows = selectedKhoa
        .map((khoa) => {
          const { rCheo, rNgoai } = computeRate(records, { thang, nam, khoa, contentKey: key });
          if (rCheo === null && rNgoai === null) return null;
          return { khoa, a: round1(rCheo) ?? 0, b: round1(rNgoai) ?? 0 };
        })
        .filter(Boolean);
      return { key, name: CONTENT_LABELS[key], rows };
    });
  }, [hook.data, selectedKhoa, thang, nam]);

  const trendSections = useMemo(() => {
    if (!hook.data || !trendYear) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const data = MONTH_LABELS.map((label, idx) => {
        const { rCheo, rNgoai } = computeRate(records, { thang: idx + 1, nam: trendYear, khoa: khoaFilter, contentKey: key });
        return { thang: label, "Giám sát chéo": round1(rCheo), "Ngoại kiểm": round1(rNgoai) };
      });
      return { key, name: CONTENT_LABELS[key], data };
    });
  }, [hook.data, trendYear, khoaFilter]);

  const insightLines = useMemo(() => generateComparisonInsights(aggSections), [aggSections]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">So sánh</p>
        <h1 className="page-title">So sánh hình thức giám sát</h1>
        <p className="page-desc">Mặc định so sánh Giám sát chéo với Ngoại kiểm gộp toàn viện theo từng nội dung. Chọn khoa cụ thể để xem chi tiết riêng.</p>
      </div>

      <div className="control-row">
        <MultiSelect options={allKhoa} value={selectedKhoa} onChange={setSelectedKhoa} placeholder="Khoa (tuỳ chọn)" />
        <MultiSelect options={MONTH_OPTIONS} value={selectedMonths} onChange={setSelectedMonths} placeholder="Tháng" searchable={false} />
        <MultiSelect
          options={years.map((y) => ({ value: y, label: `Năm ${y}` }))}
          value={selectedYears}
          onChange={setSelectedYears}
          placeholder="Năm"
          searchable={false}
        />
      </div>

      <div className="card">
        <h3 className="card-title">
          {selectedKhoa.length ? `Tổng hợp ${selectedKhoa.length} khoa đã chọn` : "Tổng hợp toàn viện"} — theo từng nội dung
        </h3>
        {summaryRows.length === 0 ? (
          <div className="state-box">Chưa có dữ liệu Giám sát chéo/Ngoại kiểm cho khoảng thời gian này.</div>
        ) : (
          <DumbbellChart data={summaryRows} labelA="Giám sát chéo" labelB="Ngoại kiểm" colorA="#5fb3a3" colorB="#4a5578" />
        )}
      </div>

      <div style={{ marginTop: 20 }}>
        <InsightBox lines={insightLines} />
      </div>

      {selectedKhoa.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginTop: 28 }}>Chi tiết theo từng khoa đã chọn</h2>
          {detailSections.map((sec) => (
            <div className="card" key={sec.key} style={{ marginTop: 16 }}>
              <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: `var(--c-${colorSlug(sec.key)})`, display: "inline-block" }} />
                {sec.name}
              </h3>
              {sec.rows.length === 0 ? (
                <div className="state-box">Chưa có dữ liệu cho các khoa đã chọn.</div>
              ) : (
                <DumbbellChart data={sec.rows} labelA="Giám sát chéo" labelB="Ngoại kiểm" colorA="#5fb3a3" colorB="#4a5578" />
              )}
            </div>
          ))}
        </>
      )}

      <h2 className="section-title" style={{ marginTop: 28 }}>Xu hướng theo tháng — Năm {trendYear}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
        {trendSections.map((sec) => (
          <TrendCard key={sec.key} sec={sec} />
        ))}
      </div>
    </div>
  );
}

function TrendCard({ sec }) {
  return (
    <div className="card">
      <h3 className="card-title">{sec.name}</h3>
      <TrendChart data={sec.data} />
    </div>
  );
}

function TrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eceeeb" />
        <XAxis dataKey="thang" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(v) => (v === null ? "—" : `${v}%`)} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="Giám sát chéo" stroke="#5fb3a3" strokeWidth={2} dot={{ r: 2 }} connectNulls />
        <Line type="monotone" dataKey="Ngoại kiểm" stroke="#4a5578" strokeWidth={2} dot={{ r: 2 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
