export function InsightBox({ lines, title = "Nhận xét tự động" }) {
  if (!lines || !lines.length) return null;
  return (
    <div className="insight-box">
      <p className="insight-title">{title}</p>
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}
