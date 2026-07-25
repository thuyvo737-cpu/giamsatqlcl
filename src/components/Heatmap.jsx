function heatColor(rate) {
  if (rate === null || rate === undefined) return "#eeecf5";
  if (rate < 0.5) return "#eec3bd"; // đỏ nhạt
  if (rate < 0.7) return "#f5dcb3"; // vàng nhạt
  if (rate < 0.9) return "#c9e9d9"; // xanh teal nhạt
  return "#7ec4b6"; // xanh teal đậm
}

const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

export function Heatmap({ matrix }) {
  if (!matrix || matrix.length === 0) {
    return <div className="state-box">Chưa có dữ liệu cho năm đang chọn.</div>;
  }
  return (
    <div>
      <div className="table-scroll" style={{ maxHeight: 420, overflowX: "auto" }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11 }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "2px 8px",
                  fontSize: 10.5,
                  background: "#fff",
                  color: "var(--ink-400)",
                  position: "sticky",
                  top: 0,
                  left: 0,
                  zIndex: 3,
                }}
              >
                Khoa
              </th>
              {MONTH_LABELS.map((m) => (
                <th
                  key={m}
                  style={{
                    padding: "2px 4px",
                    fontSize: 10.5,
                    color: "var(--ink-400)",
                    fontWeight: 600,
                    background: "#fff",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
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
                    fontWeight: 700,
                    padding: "3px 8px",
                    color: "var(--navy-900)",
                    whiteSpace: "nowrap",
                    background: "#fff",
                    position: "sticky",
                    left: 0,
                  }}
                >
                  {row.khoa}
                </td>
                {row.cells.map((v, i) => (
                  <td key={i} title={v !== null ? `${Math.round(v * 1000) / 10}%` : "Không có dữ liệu"}>
                    <div style={{ width: 24, height: 20, borderRadius: 4, background: heatColor(v) }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 12, fontSize: 11, color: "var(--ink-400)" }}>
        <LegendDot color="#eec3bd" label="< 50%" />
        <LegendDot color="#f5dcb3" label="50–70%" />
        <LegendDot color="#c9e9d9" label="70–90%" />
        <LegendDot color="#7ec4b6" label="≥ 90%" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: "inline-block" }} />
      {label}
    </span>
  );
}
