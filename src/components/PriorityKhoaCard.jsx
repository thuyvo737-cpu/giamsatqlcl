import { riskColor, riskLabel } from "../utils/chartTheme.js";

export function PriorityKhoaCard({ data }) {
  if (!data || !data.length) {
    return <div className="state-box">Chưa có đủ dữ liệu để tính điểm ưu tiên giám sát.</div>;
  }
  return (
    <div>
      <div className="priority-list">
        {data.map((k, i) => (
          <div className="priority-row" key={k.khoa}>
            <div className="priority-rank">{i + 1}</div>
            <div>
              <div className="priority-khoa-name">{k.khoa}</div>
              <div className="priority-reason">{k.reason}</div>
            </div>
            <div className="priority-score-bar">
              <div className="priority-score-fill" style={{ width: `${k.score}%`, background: riskColor(k.score) }} />
            </div>
            <span className="risk-badge" style={{ background: riskColor(k.score) }}>
              {riskLabel(k.score)}
            </span>
          </div>
        ))}
      </div>
      <p className="disclaimer-note">
        * Điểm ưu tiên là chỉ số tham khảo do hệ thống tự tính từ tỷ lệ tuân thủ, xu hướng giảm, số lỗi và số lần tái diễn — không phải chỉ số chính thức đã được Ban QLCL phê duyệt.
      </p>
    </div>
  );
}
