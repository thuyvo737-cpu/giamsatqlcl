import { useMemo, useState } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { DumbbellChart } from "../components/DumbbellChart.jsx";

// Tự nhận diện cột nào là TỶ LỆ (giá trị luôn trong khoảng 0-1) và cột
// nào là SỐ LƯỢNG (giá trị nguyên >1) — tránh lặp lại lỗi quy đổi %
// nhầm cho cột số lượng giám sát.
function classifyColumns(rows, sectionName, labels) {
  const rateKeys = [];
  const countKeys = [];
  labels.forEach((label) => {
    const vals = rows
      .map((r) => r.values[sectionName]?.[label])
      .filter((v) => typeof v === "number");
    if (!vals.length) return;
    const isRate = vals.every((v) => v >= 0 && v <= 1.0001);
    (isRate ? rateKeys : countKeys).push(label);
  });
  return { rateKeys, countKeys };
}

function formatValue(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") {
    return v > 0 && v <= 1 ? `${Math.round(v * 1000) / 10}%` : v;
  }
  return v;
}

export function SoSanh({ hook }) {
  const sections = hook.data?.sections || [];
  const rows = hook.data?.rows || [];
  const [activeSection, setActiveSection] = useState(null);

  const currentSection = activeSection || sections[0]?.name;
  const labels = useMemo(() => {
    const sec = sections.find((s) => s.name === currentSection);
    return sec ? sec.cols.map((c) => c.label) : [];
  }, [sections, currentSection]);

  const { rateKeys, countKeys } = useMemo(
    () => classifyColumns(rows, currentSection, labels),
    [rows, currentSection, labels]
  );

  const dumbbellData = useMemo(() => {
    if (rateKeys.length < 2) return [];
    const [keyA, keyB] = rateKeys;
    return rows
      .map((r) => {
        const a = r.values[currentSection]?.[keyA];
        const b = r.values[currentSection]?.[keyB];
        if (typeof a !== "number" || typeof b !== "number") return null;
        return { khoa: r.khoa, a: Math.round(a * 1000) / 10, b: Math.round(b * 1000) / 10 };
      })
      .filter(Boolean);
  }, [rows, currentSection, rateKeys]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">So sánh</p>
        <h1 className="page-title">So sánh hình thức giám sát</h1>
        <p className="page-desc">
          Đối chiếu tỷ lệ tuân thủ giữa Giám sát chéo và Ngoại kiểm theo từng nội dung (không bao gồm Tự giám
          sát). Cột số lượng giám sát hiển thị đúng dạng số, không quy đổi %.
        </p>
      </div>

      <div className="control-row">
        <select className="select" value={currentSection || ""} onChange={(e) => setActiveSection(e.target.value)}>
          {sections.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3 className="card-title">{currentSection} — Giám sát chéo và Ngoại kiểm</h3>
        {dumbbellData.length === 0 ? (
          <div className="state-box">
            Không đủ dữ liệu dạng tỷ lệ để vẽ biểu đồ so sánh cho nội dung này.
          </div>
        ) : (
          <DumbbellChart
            data={dumbbellData}
            labelA={rateKeys[0]}
            labelB={rateKeys[1]}
            colorA="#2a9d8f"
            colorB="#16293c"
          />
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Bảng chi tiết — {currentSection}</h3>
        <div className="table-wrap table-scroll">
          <table>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, top: 0, zIndex: 3 }}>Khoa</th>
                {labels.map((l) => (
                  <th key={l}>
                    {l}
                    {countKeys.includes(l) ? " (số lượng)" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={labels.length + 1} style={{ color: "#8497a6" }}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.khoa}>
                  <td className="khoa-cell">{r.khoa}</td>
                  {labels.map((l) => (
                    <td key={l}>{formatValue(r.values[currentSection]?.[l])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
