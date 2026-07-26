import { IconTarget, IconTrendUp, IconTrendDown, IconAlert, IconShield } from "../utils/icons.jsx";

function fmtPct(v) {
  return v === null || v === undefined ? "—" : `${Math.round(v * 1000) / 10}%`;
}
function fmtPP(v) {
  return v === null || v === undefined ? "—" : `${Math.round(Math.abs(v) * 1000) / 10} điểm %`;
}

export function ExecutiveSummary({ summary, currentLabel }) {
  if (!summary) return null;
  const { avgRate, mostImproved, mostDeclined, topPriority, actions } = summary;

  return (
    <div className="exec-summary">
      <h2 className="exec-summary-title">📋 Tóm tắt điều hành — {currentLabel}</h2>
      <div className="exec-grid">
        <div className="exec-item">
          <div className="exec-item-label"><IconTarget width={15} height={15} /> Mức tuân thủ trung bình toàn viện</div>
          <div className="exec-item-body" style={{ fontSize: 22, fontWeight: 700, color: "var(--navy-950)" }}>
            🟢 {fmtPct(avgRate)}
          </div>
        </div>
        <div className="exec-item">
          <div className="exec-item-label"><IconTrendUp width={15} height={15} /> Cải thiện nhiều nhất</div>
          <div className="exec-item-body">
            {mostImproved && mostImproved.delta > 0 ? (
              <>📈 <b>{mostImproved.label}</b> ({fmtPP(mostImproved.delta)})</>
            ) : (
              "Chưa có nội dung nào cải thiện rõ rệt so với kỳ trước."
            )}
          </div>
        </div>
        <div className="exec-item">
          <div className="exec-item-label"><IconTrendDown width={15} height={15} /> Giảm nhiều nhất</div>
          <div className="exec-item-body">
            {mostDeclined && mostDeclined.delta < 0 ? (
              <>📉 <b>{mostDeclined.label}</b> (-{fmtPP(mostDeclined.delta)})</>
            ) : (
              "Không có nội dung nào giảm đáng kể so với kỳ trước."
            )}
          </div>
        </div>
        <div className="exec-item">
          <div className="exec-item-label"><IconAlert width={15} height={15} /> Khoa cần ưu tiên giám sát</div>
          <div className="exec-item-body">
            {topPriority && topPriority.length ? (
              <ul>
                {topPriority.map((k) => (
                  <li key={k.khoa}>⚠ {k.khoa} — {k.reason}</li>
                ))}
              </ul>
            ) : (
              "Không có khoa nào nổi bật cần ưu tiên trong kỳ này."
            )}
          </div>
        </div>
        <div className="exec-item exec-item-full">
          <div className="exec-item-label"><IconShield width={15} height={15} /> Hành động ưu tiên Ban QLCL cần triển khai</div>
          <div className="exec-item-body">
            <ul>
              {(actions || []).map((a, i) => (
                <li key={i}>🎯 {a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
