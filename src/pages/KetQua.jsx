import { Fragment, useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import {
  CONTENT_KEYS,
  CONTENT_LABELS,
  computeRate,
  getAvailableYears,
  getRecordsForContent,
  listKhoa,
} from "../utils/aggregate.js";

const SHORT_LABEL = {
  nhanDang: "Nhận dạng NB",
  vongTay: "Vòng tay NB",
  teNga: "Nguy cơ té ngã",
  atpt: "Bảng kiểm ATPT",
  s5: "Đánh giá 5S",
};

export function KetQua({ hook }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(0); // 0 = cả năm
  const [year, setYear] = useState(null);

  const years = useMemo(() => getAvailableYears(hook.data), [hook.data]);
  const effectiveYear = year ?? years[0];
  const thang = month === 0 ? null : month;

  const tableRows = useMemo(() => {
    if (!hook.data) return [];
    const allKhoa = new Set();
    CONTENT_KEYS.forEach((g) => {
      listKhoa(getRecordsForContent(hook.data, g).filter((r) => r.nam === effectiveYear)).forEach((k) =>
        allKhoa.add(k)
      );
    });
    return Array.from(allKhoa)
      .sort()
      .map((khoa) => {
        const values = {};
        CONTENT_KEYS.forEach((g) => {
          values[g] = computeRate(getRecordsForContent(hook.data, g), {
            thang,
            nam: effectiveYear,
            khoa,
            contentKey: g,
          });
        });
        return { khoa, values };
      });
  }, [hook.data, thang, effectiveYear]);

  const filtered = useMemo(() => {
    if (!query) return tableRows;
    const q = query.trim().toLowerCase();
    return tableRows.filter((r) => r.khoa.toLowerCase().includes(q));
  }, [tableRows, query]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Kết quả giám sát</p>
        <h1 className="page-title">Kết quả chi tiết theo khoa</h1>
        <p className="page-desc">
          Số lượng giám sát và tỷ lệ tuân thủ theo từng nội dung, tính theo đúng công thức: trung bình cộng tỷ lệ
          Giám sát chéo và Ngoại kiểm.
        </p>
      </div>

      <div className="control-row">
        <input
          className="select"
          placeholder="Tìm theo mã khoa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          <option value={0}>Cả năm</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              Tháng {m}
            </option>
          ))}
        </select>
        <select className="select" value={effectiveYear || ""} onChange={(e) => setYear(Number(e.target.value))}>
          {years.length === 0 && <option>—</option>}
          {years.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </select>
      </div>
      <p className="badge-updated" style={{ display: "block", marginBottom: 12 }}>
        {filtered.length} / {tableRows.length} khoa
        {hook.lastUpdated ? ` · cập nhật ${hook.lastUpdated.toLocaleTimeString("vi-VN")}` : ""}
      </p>

      <div className="table-wrap table-scroll">
        <table>
          <thead>
            <tr>
              <th rowSpan={2} style={{ position: "sticky", left: 0, top: 0, zIndex: 3, background: "var(--navy-950)" }}>
                Khoa
              </th>
              {CONTENT_KEYS.map((g, i) => (
                <th
                  key={g}
                  colSpan={2}
                  className={`group-${i}`}
                  style={{ textAlign: "center", position: "sticky", top: 0, zIndex: 2 }}
                >
                  {SHORT_LABEL[g]}
                </th>
              ))}
            </tr>
            <tr>
              {CONTENT_KEYS.map((g, i) => (
                <Fragment key={g}>
                  <th className={`group-${i}`} style={{ position: "sticky", top: 33, zIndex: 2, fontSize: 10.5 }}>
                    Số lượng
                  </th>
                  <th className={`group-${i}`} style={{ position: "sticky", top: 33, zIndex: 2, fontSize: 10.5 }}>
                    Tỷ lệ
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={1 + CONTENT_KEYS.length * 2} style={{ color: "#8497a6" }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.khoa}>
                <td className="khoa-cell">{r.khoa}</td>
                {CONTENT_KEYS.map((g) => {
                  const { n, rate } = r.values[g];
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function pillClass(rate) {
  if (rate >= 0.9) return "pill pill-good";
  if (rate >= 0.7) return "pill pill-warn";
  return "pill pill-bad";
}
