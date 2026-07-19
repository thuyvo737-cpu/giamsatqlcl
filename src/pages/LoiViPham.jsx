import { LoadingState, ErrorState } from "../components/LoadingState.jsx";

export function LoiViPham({ hook }) {
  const months = hook.data?.months || [];
  const rows = hook.data?.rows || [];

  if (hook.loading) return <LoadingState />;
  if (hook.error) return <ErrorState message={hook.error} />;

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Lỗi vi phạm</p>
        <h1 className="page-title">Các lỗi vi phạm trong giám sát</h1>
        <p className="page-desc">
          Số lượt lỗi ghi nhận theo khoa, theo từng tháng trong năm — sắp
          xếp theo tổng số lỗi giảm dần.
        </p>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ position: "sticky", left: 0, zIndex: 2 }}>Khoa</th>
              {months.map((m) => (
                <th key={m}>{m}</th>
              ))}
              <th>Tổng</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={months.length + 2} style={{ color: "#8497a6" }}>
                  Chưa có dữ liệu lỗi vi phạm.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.khoa}>
                <td className="khoa-cell">{r.khoa}</td>
                {r.monthly.map((v, i) => (
                  <td key={i}>{v || "—"}</td>
                ))}
                <td>
                  <span
                    className={
                      r.total === 0
                        ? "pill pill-good"
                        : r.total <= 5
                        ? "pill pill-warn"
                        : "pill pill-bad"
                    }
                  >
                    {r.total}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
