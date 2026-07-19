// =============================================================
// NHẬN XÉT TỰ ĐỘNG (RULE-BASED) — không gọi AI, chỉ diễn giải lại
// các số liệu đã tính, nên luôn khớp 100% với số hiển thị trên web.
// =============================================================

function fmtPct(v) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(v * 1000) / 10}%`;
}

export function generateInsights({
  khoaRates,
  distribution,
  monthOverMonth,
  violationLegend,
  thang,
  nam,
}) {
  const lines = [];

  if (khoaRates && khoaRates.length) {
    const sorted = [...khoaRates].sort((a, b) => b.rate - a.rate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (best) {
      lines.push(
        `Khoa dẫn đầu toàn viện tháng ${thang}/${nam} là ${best.khoa}, tỷ lệ tuân thủ chung đạt ${fmtPct(best.rate)}.`
      );
    }
    if (worst && worst.khoa !== best?.khoa) {
      lines.push(`Khoa cần lưu ý nhất là ${worst.khoa}, tỷ lệ chỉ đạt ${fmtPct(worst.rate)}.`);
    }
    const under70 = sorted.filter((k) => k.rate < 0.7);
    if (under70.length) {
      const names = under70
        .slice(0, 5)
        .map((k) => `${k.khoa} (${fmtPct(k.rate)})`)
        .join(", ");
      lines.push(
        `Có ${under70.length} khoa đang dưới ngưỡng 70%: ${names}${under70.length > 5 ? "…" : ""}.`
      );
    } else {
      lines.push("Không có khoa nào dưới ngưỡng 70% trong tháng này.");
    }
  }

  if (distribution && distribution.length) {
    const total = distribution.reduce((s, b) => s + b.count, 0);
    const good = distribution.find((b) => b.label === "≥ 90%")?.count || 0;
    if (total) {
      lines.push(
        `${good}/${total} khoa (${Math.round((good / total) * 100)}%) đạt tỷ lệ tuân thủ từ 90% trở lên.`
      );
    }
  }

  if (monthOverMonth && monthOverMonth.length) {
    const up = monthOverMonth[0];
    const down = monthOverMonth[monthOverMonth.length - 1];
    if (up && up.delta > 0.001) {
      lines.push(
        `${up.khoa} cải thiện nhiều nhất so với tháng trước, tăng ${fmtPct(up.delta)} điểm phần trăm.`
      );
    }
    if (down && down.delta < -0.001) {
      lines.push(
        `${down.khoa} giảm nhiều nhất so với tháng trước, giảm ${fmtPct(Math.abs(down.delta))} điểm phần trăm — cần kiểm tra lại nguyên nhân.`
      );
    }
  }

  if (violationLegend && violationLegend.length) {
    const top = violationLegend.filter((v) => v.count > 0)[0];
    if (top) {
      lines.push(`Loại lỗi vi phạm phổ biến nhất là "${top.name}" với ${top.count} lượt ghi nhận.`);
    }
  }

  if (!lines.length) {
    lines.push("Chưa đủ dữ liệu trong khoảng thời gian đang chọn để đưa ra nhận xét.");
  }

  return lines;
}
