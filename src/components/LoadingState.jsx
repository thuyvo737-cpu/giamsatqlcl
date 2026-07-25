export function LoadingState({ label = "Đang tải dữ liệu..." }) {
  return <div className="state-box">{label}</div>;
}

export function ErrorState({ message }) {
  return (
    <div className="state-box error">
      Không tải được dữ liệu: {message}
      <br />
      Kiểm tra lại SHEET_ID / API_KEY trong <code>src/config.js</code> và
      quyền chia sẻ của Google Sheet.
    </div>
  );
}
