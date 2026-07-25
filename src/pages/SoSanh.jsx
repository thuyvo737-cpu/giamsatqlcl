import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { DumbbellChart } from "../components/DumbbellChart.jsx";
import { MonthYearFilter } from "../components/MonthYearFilter.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";

export function SoSanh({ hook }) {
  const now = new Date();
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);
  const effectiveMonth = month ?? now.getMonth() + 1;
  const effectiveYear =
    year ?? (years.includes(now.getFullYear()) ? now.getFullYear() : years[0] || now.getFullYear());
  const isAuto = month === null && year === null;

  const sections = useMemo(() => {
    if (!hook.data) return [];
    return CONTENT_KEYS.map((key) => {
      const records = getRecordsForContent(hook.data, key);
      const khoas = listKhoa(records.filter((r) => r.nam === effectiveYear));
      const rows = khoas
        .map((khoa) => {
          const { rCheo, rNgoai, rate } = computeRate(records, {
            thang: effectiveMonth,
            nam: effectiveYear,
            khoa,
            contentKey: key,
          });
          if (rCheo === null && rNgoai === null) return null; // ẩn dòng không có dữ liệu
          return {
            khoa,
            a: rCheo !== null ? Math.round(rCheo * 1000) / 10 : 0,
            b: rNgoai !== null ? Math.round(rNgoai * 1000) / 10 : 0,
            tb: rate !== null ? Math.round(rate * 1000) / 10 : null,
          };
        })
        .filter(Boolean);
      return { key, name: CONTENT_LABELS[key], rows };
    });
  }, [hook.data, effectiveMonth, effectiveYear]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">So sánh</p>
        <h1 className="page-title">So sánh hình thức giám sát</h1>
      </div>

      <div className="control-row">
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
        <span className="badge-updated">
          {isAuto ? `Tự động — Tháng ${effectiveMonth}/${effectiveYear}` : `Tháng ${effectiveMonth}/${effectiveYear}`}
        </span>
      </div>

      {sections.map((sec) => (
        <div className="card" key={sec.key} style={{ marginTop: 20 }}>
          <h3 className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: `var(--c-${colorSlug(sec.key)})`,
                display: "inline-block",
              }}
            />
            {sec.name}
          </h3>
          {sec.rows.length === 0 ? (
            <div className="state-box">Chưa có dữ liệu Giám sát chéo/Ngoại kiểm cho khoảng thời gian này.</div>
          ) : (
            <DumbbellChart data={sec.rows} labelA="Giám sát chéo" labelB="Ngoại kiểm" colorA="#5fb3a3" colorB="#4a5578" />
          )}
        </div>
      ))}
    </div>
  );
}

function colorSlug(key) {
  return { nhanDang: "nhandang", vongTay: "vongtay", teNga: "tenga", atpt: "atpt", s5: "5s" }[key];
}
