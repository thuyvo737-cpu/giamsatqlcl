import { pillClassForRate } from "./StatCard.jsx";

function fmtDelta(v) {
  const pct = Math.round(v * 1000) / 10;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

export function MonthOverMonthTable({ data }) {
  if (!data || !data.length) {
    return <div className="state-box">Chưa đủ dữ liệu 2 tháng liên tiếp để so sánh.</div>;
  }

  const improved = data.filter((d) => d.delta > 0).slice(0, 5);
  const declined = [...data].filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 5);

  const renderList = (list, positive) => (
    <div className="table-wrap" style={{ border: "none" }}>
      <table>
        <thead>
          <tr>
            <th>Khoa</th>
            <th>Tháng trước</th>
            <th>Tháng này</th>
            <th>Chênh lệch</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: "#8497a6" }}>
                Không có khoa nào {positive ? "cải thiện" : "giảm"} đáng kể.
              </td>
            </tr>
          )}
          {list.map((d) => (
            <tr key={d.khoa}>
              <td className="khoa-cell">{d.khoa}</td>
              <td>{Math.round(d.previous * 1000) / 10}%</td>
              <td>{Math.round(d.current * 1000) / 10}%</td>
              <td>
                <span className={positive ? "pill pill-good" : "pill pill-bad"}>
                  {fmtDelta(d.delta)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="grid grid-2">
      <div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
          Cải thiện nhiều nhất
        </h4>
        {renderList(improved, true)}
      </div>
      <div>
        <h4 style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}>
          Giảm nhiều nhất
        </h4>
        {renderList(declined, false)}
      </div>
    </div>
  );
}
