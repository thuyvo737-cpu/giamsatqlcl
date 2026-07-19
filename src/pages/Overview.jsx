import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { LoadingState, ErrorState } from "../components/LoadingState.jsx";
import { StatCard } from "../components/StatCard.jsx";

export function Overview({ bieuDo, loiViPham }) {
  if (bieuDo.loading) return <LoadingState />;
  if (bieuDo.error) return <ErrorState message={bieuDo.error} />;

  const kpis = bieuDo.data?.kpis || [];
  const overall = bieuDo.data?.overall || 0;

  const radarData = kpis.map((k) => ({
    name: k.label.length > 22 ? k.label.slice(0, 22) + "…" : k.label,
    "Tỷ lệ tuân thủ": Math.round(k.value * 1000) / 10,
  }));

  const topViolations = (loiViPham.data?.rows || []).slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <p className="page-eyebrow">Tổng quan · Cập nhật realtime</p>
        <h1 className="page-title">
          {bieuDo.data?.title || "Kết quả giám sát tuân thủ QT-QĐ"}
        </h1>
        <p className="page-desc">
          Tỷ lệ tuân thủ chung toàn viện:{" "}
          <strong>{Math.round(overall * 1000) / 10}%</strong> — tổng hợp từ 4
          nội dung giám sát cốt lõi bên dưới.
        </p>
      </div>

      <div className="grid grid-4">
        {kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} />
        ))}
      </div>

      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3 className="card-title">Biểu đồ tổng hợp tỷ lệ tuân thủ</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} outerRadius={95}>
              <PolarGrid stroke="#dbe1e0" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#4d6072" }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#8497a6" }}
              />
              <Radar
                name="Tỷ lệ tuân thủ"
                dataKey="Tỷ lệ tuân thủ"
                stroke="#2a9d8f"
                fill="#2a9d8f"
                fillOpacity={0.35}
              />
              <Tooltip formatter={(v) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">Khoa có nhiều lỗi vi phạm nhất (lũy kế năm)</h3>
          {loiViPham.loading && <LoadingState />}
          {loiViPham.error && <ErrorState message={loiViPham.error} />}
          {!loiViPham.loading && !loiViPham.error && (
            <div className="table-wrap" style={{ border: "none" }}>
              <table>
                <thead>
                  <tr>
                    <th>Khoa</th>
                    <th>Tổng số lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {topViolations.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ color: "#8497a6" }}>
                        Chưa có dữ liệu lỗi vi phạm.
                      </td>
                    </tr>
                  )}
                  {topViolations.map((r) => (
                    <tr key={r.khoa}>
                      <td className="khoa-cell">{r.khoa}</td>
                      <td>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
