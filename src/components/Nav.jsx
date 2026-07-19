const PAGES = [
  { key: "overview", label: "Tổng quan" },
  { key: "ketqua", label: "Kết quả giám sát" },
  { key: "sosanh", label: "So sánh hình thức GS" },
  { key: "theodoi", label: "Xu hướng theo tháng" },
  { key: "loivipham", label: "Lỗi vi phạm" },
];

export function Nav({ active, onChange, syncStatus }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        Giám sát QT-QĐ
        <small>BVQY175 · Phòng QLCL</small>
      </div>
      <ul className="nav-list">
        {PAGES.map((p, i) => (
          <li key={p.key}>
            <button
              className={`nav-item ${active === p.key ? "active" : ""}`}
              onClick={() => onChange(p.key)}
            >
              <span className="nav-index">{String(i + 1).padStart(2, "0")}</span>
              {p.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">
        <span
          className={`sync-dot ${
            syncStatus === "ok" ? "ok" : syncStatus === "error" ? "err" : "pending"
          }`}
        />
        {syncStatus === "ok"
          ? "Đồng bộ realtime"
          : syncStatus === "error"
          ? "Lỗi kết nối Sheet"
          : "Đang đồng bộ..."}
      </div>
    </aside>
  );
}
