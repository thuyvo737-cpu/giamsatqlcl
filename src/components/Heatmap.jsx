function heatColor(rate) {
  if (rate === null || rate === undefined) return "#f1f2f0";
  const pct = Math.max(0, Math.min(1, rate));
  // nội suy từ đỏ (kém) -> vàng -> xanh teal (tốt)
  if (pct < 0.5) {
    const t = pct / 0.5;
    return mix("#d1615a", "#e0a458", t);
  }
  const t = (pct - 0.5) / 0.5;
  return mix("#e0a458", "#2a9d8f", t);
}

function mix(hex1, hex2, t) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

export function Heatmap({ matrix }) {
  if (!matrix || matrix.length === 0) {
    return <div className="state-box">Chưa có dữ liệu cho năm đang chọn.</div>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "2px 8px", fontSize: 10.5, color: "var(--ink-400)" }}>
              Khoa
            </th>
            {MONTH_LABELS.map((m) => (
              <th
                key={m}
                style={{
                  padding: "2px 4px",
                  fontSize: 10.5,
                  color: "var(--ink-400)",
                  fontWeight: 500,
                }}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row) => (
            <tr key={row.khoa}>
              <td
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  padding: "3px 8px",
                  color: "var(--navy-900)",
                  whiteSpace: "nowrap",
                }}
              >
                {row.khoa}
              </td>
              {row.cells.map((v, i) => (
                <td key={i} title={v !== null ? `${Math.round(v * 1000) / 10}%` : "Không có dữ liệu"}>
                  <div
                    style={{
                      width: 24,
                      height: 20,
                      borderRadius: 4,
                      background: heatColor(v),
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 11, color: "var(--ink-400)" }}>
        <span>Thấp</span>
        <div style={{ width: 100, height: 8, borderRadius: 4, background: "linear-gradient(90deg,#d1615a,#e0a458,#2a9d8f)" }} />
        <span>Cao</span>
      </div>
    </div>
  );
}
