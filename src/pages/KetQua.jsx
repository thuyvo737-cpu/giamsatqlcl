import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";

export function KetQua({ hook }) {
  const [query, setQuery] = useState("");

  const headers = hook.data?.headers || [];
  const valueHeaders = headers.slice(2).filter(Boolean);
  const rows = hook.data?.rows || [];

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => r.khoa?.toString().toLowerCase().includes(q));
  }, [rows, query]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Kết quả giám sát</p>
        <h1 className="page-title">Kết quả chi tiết theo khoa</h1>
        <p className="page-desc">
          Toàn bộ chỉ số giám sát: nhận dạng người bệnh, vòng tay nhận dạng,
          nguy cơ té ngã, bảng kiểm an toàn phẫu thuật và 5S.
        </p>
      </div>

      <div className="control-row">
        <input
          className="select"
          placeholder="Tìm theo mã khoa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <span className="badge-updated">
          {filtered.length} / {rows.length} khoa
          {hook.lastUpdated
            ? ` · cập nhật ${hook.lastUpdated.toLocaleTimeString("vi-VN")}`
            : ""}
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 2 }}>Khoa</th>
              {valueHeaders.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={valueHeaders.length + 1} style={{ color: "#8497a6" }}>
                  Chưa có dữ liệu.
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.khoa}>
                <td className="khoa-cell">{r.khoa}</td>
                {valueHeaders.map((h) => (
                  <td key={h}>{formatCell(r.values[h])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number" && v > 0 && v <= 1) {
    return `${Math.round(v * 1000) / 10}%`;
  }
  return v;
}
