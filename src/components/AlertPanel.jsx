import { IconAlert } from "../utils/icons.jsx";

export function AlertPanel({ alerts }) {
  if (!alerts || !alerts.length) {
    return (
      <div className="no-alert-box">
        <IconAlert width={16} height={16} />
        Không có cảnh báo nổi bật nào trong kỳ này.
      </div>
    );
  }
  return (
    <div className="alert-grid">
      {alerts.map((a, i) => (
        <div className={`alert-card ${a.level === "danger" ? "danger" : ""}`} key={i}>
          <span className="alert-icon"><IconAlert width={17} height={17} /></span>
          <span className="alert-text" dangerouslySetInnerHTML={{ __html: a.text.replace(/"([^"]+)"/g, "<b>$1</b>") }} />
        </div>
      ))}
    </div>
  );
}
