const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function MonthYearFilter({ month, year, years, isAuto, onMonthChange, onYearChange, onReset }) {
  return (
    <div className="control-row" style={{ marginBottom: 0 }}>
      <select className="select" value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
        {MONTHS.map((m) => (
          <option key={m} value={m}>
            Tháng {m}
          </option>
        ))}
      </select>
      <select className="select" value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
        {years.length === 0 && <option value={year}>Năm {year}</option>}
        {years.map((y) => (
          <option key={y} value={y}>
            Năm {y}
          </option>
        ))}
      </select>
      {!isAuto && (
        <button
          className="nav-item"
          style={{ background: "#eceeeb", color: "#4d6072", width: "auto", padding: "8px 12px", borderRadius: 8 }}
          onClick={onReset}
        >
          Về hiện tại
        </button>
      )}
    </div>
  );
}
