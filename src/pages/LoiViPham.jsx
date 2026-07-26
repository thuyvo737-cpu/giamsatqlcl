import { useMemo } from "react";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { InsightBox } from "../components/InsightBox.jsx";
import { ParetoChart } from "../components/ParetoChart.jsx";
import { generateViolationInsights, generateRecommendations } from "../utils/insights.js";

export function LoiViPham({ hook }) {
  const months = hook.data?.months || [];
  const rows = hook.data?.rows || [];
  const legend = hook.data?.legend || [];

  const insightLines = useMemo(() => generateViolationInsights({ legend, rows }), [legend, rows]);
  const recommendations = useMemo(() => generateRecommendations(legend), [legend]);

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Lỗi vi phạm</p>
        <h1 className="page-title">Các lỗi vi phạm trong giám sát</h1>
        <p className="page-desc">
          Thống kê lỗi vi phạm theo Pareto kèm khuyến nghị cải tiến tự động, và chi tiết theo Khoa × Tháng.
          <br />
          Mỗi ô trong bảng Khoa × Tháng là mã số loại lỗi phát sinh tháng đó, tra theo bảng chú giải; cột "Tổng" đếm số tháng có phát sinh lỗi.
        </p>
      </div>

      <div className="card">
        <h3 className="card-title">Pareto lỗi vi phạm (lũy kế năm)</h3>
        <ParetoChart legend={legend} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Khuyến nghị cải tiến</h3>
        {recommendations.length === 0 ? (
          <div className="state-box">Chưa có dữ liệu để sinh khuyến nghị.</div>
        ) : (
          <div className="recommend-list">
            {recommendations.map((r) => (
              <div className="recommend-item" key={r.name}>
                <span className="recommend-arrow">↓</span>
                <div className="recommend-body">
                  Lỗi: <b>{r.name}</b> ({r.count} lượt) → Khuyến nghị: <b>{r.recommendation}</b>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="disclaimer-note">* Khuyến nghị được hệ thống sinh tự động dựa trên loại lỗi phổ biến, chỉ mang tính gợi ý tham khảo.</p>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Bảng chú giải các loại vi phạm</h3>
        <div className="table-wrap table-scroll" style={{ maxHeight: 320 }}>
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên loại vi phạm</th>
                <th>Số lượt ghi nhận</th>
              </tr>
            </thead>
            <tbody>
              {legend.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ color: "#8497a6" }}>
                    Chưa có dữ liệu chú giải.
                  </td>
                </tr>
              )}
              {legend.map((l) => (
                <tr key={l.code}>
                  <td><span className="code-badge">{l.code}</span></td>
                  <td>{l.name}</td>
                  <td>{l.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title">Bảng Khoa × Tháng</h3>
        <div className="table-wrap table-scroll">
          <table className="align-center">
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, top: 0, zIndex: 3, background: "var(--navy-950)", textAlign: "left" }}>
                  Khoa
                </th>
                {months.map((m, i) => (
                  <th key={i}>{m}</th>
                ))}
                <th>Tổng</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={months.length + 2} style={{ color: "#8497a6" }}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.khoa}>
                  <td className="khoa-cell">{r.khoa}</td>
                  {r.monthly.map((m, i) => (
                    <td key={i}>{m.code !== null ? <span className="code-badge" title={m.label}>{m.code}</span> : "—"}</td>
                  ))}
                  <td style={{ fontWeight: 700 }}>{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="section-title" style={{ marginTop: 28 }}>Nhận xét tự động</h2>
      <InsightBox lines={insightLines} />
    </div>
  );
}
