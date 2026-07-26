const ICONS = {
  overview: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  ketqua: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10" />
    </svg>
  ),
  sosanh: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3v18M17 3v18" /><circle cx="7" cy="8" r="2" /><circle cx="17" cy="16" r="2" />
    </svg>
  ),
  xuhuong: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" />
    </svg>
  ),
  loivipham: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9.5 17H2.5L12 3z" /><path d="M12 10v4" /><circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const PAGES = [
  { key: "overview", label: "Tổng quan" },
  { key: "ketqua", label: "Kết quả chi tiết" },
  { key: "sosanh", label: "So sánh hình thức GS" },
  { key: "xuhuong", label: "Xu hướng" },
  { key: "loivipham", label: "Lỗi vi phạm" },
];

export function Nav({ active, onChange, syncStatus, alertCount = 0 }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        Giám sát QT-QĐ
        <small>BVQY175 · Ban QLCL</small>
      </div>
      <ul className="nav-list">
        {PAGES.map((p) => (
          <li key={p.key}>
            <button
              className={`nav-item ${active === p.key ? "active" : ""}`}
              onClick={() => onChange(p.key)}
            >
              {ICONS[p.key]}
              {p.label}
              {p.key === "overview" && alertCount > 0 && <span className="nav-badge">{alertCount}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="sidebar-foot">
        <div>
          <span
            className={`sync-dot ${
              syncStatus === "ok" ? "ok" : syncStatus === "error" ? "err" : "pending"
            }`}
          />
          {syncStatus === "ok"
            ? "Đã đồng bộ"
            : syncStatus === "error"
            ? "Lỗi kết nối Sheet"
            : "Đang đồng bộ..."}
        </div>
        <div className="sidebar-foot-sub">Dành cho BQLCL</div>
      </div>
    </aside>
  );
}
