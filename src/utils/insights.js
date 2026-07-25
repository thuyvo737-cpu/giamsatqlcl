// =============================================================
// NHẬN XÉT TỰ ĐỘNG (RULE-BASED) — không gọi AI, chỉ diễn giải lại
// các số liệu đã tính, nên luôn khớp 100% với số hiển thị trên web.
// =============================================================

function fmtPct(v) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(v * 1000) / 10}%`;
}

function fmtPctPoint(v) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(Math.abs(v) * 1000) / 10} điểm %`;
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

/** Nhận xét tự động cho trang "So sánh hình thức giám sát". */
export function generateComparisonInsights(sections) {
  const lines = [];
  const valid = (sections || []).filter((s) => s.rCheo !== null || s.rNgoai !== null);
  if (!valid.length) {
    return ["Chưa đủ dữ liệu Giám sát chéo/Ngoại kiểm trong khoảng thời gian đang chọn."];
  }

  valid.forEach((s) => {
    if (s.rCheo === null || s.rNgoai === null) return;
    const diff = s.rCheo - s.rNgoai;
    if (Math.abs(diff) < 0.02) return;
    const higher = diff > 0 ? "Giám sát chéo" : "Ngoại kiểm";
    lines.push(
      `${s.name}: ${higher} ghi nhận tỷ lệ cao hơn, chênh lệch ${fmtPctPoint(diff)} (${fmtPct(s.rCheo)} so với ${fmtPct(s.rNgoai)}).`
    );
  });

  const withDiff = valid
    .filter((s) => s.rCheo !== null && s.rNgoai !== null)
    .map((s) => ({ ...s, diff: Math.abs(s.rCheo - s.rNgoai) }))
    .sort((a, b) => b.diff - a.diff);
  if (withDiff.length) {
    const top = withDiff[0];
    lines.push(`Nội dung có chênh lệch lớn nhất giữa 2 hình thức giám sát là "${top.name}" (${fmtPctPoint(top.diff)}).`);
  }

  if (!lines.length) {
    lines.push("Tỷ lệ Giám sát chéo và Ngoại kiểm khá tương đồng ở tất cả các nội dung.");
  }
  return lines;
}

/** Nhận xét tự động cho trang "Xu hướng" — so đầu kỳ với cuối kỳ đang có dữ liệu. */
export function generateTrendInsights(sections) {
  const lines = [];
  (sections || []).forEach((sec) => {
    const points = (sec.data || []).filter((p) => {
      const vals = Object.keys(p).filter((k) => k !== "thang");
      return vals.some((k) => p[k] !== null && p[k] !== undefined);
    });
    if (points.length < 2) return;
    // Tính trung bình các khoa đang hiển thị ở từng điểm tháng để có 1
    // đường xu hướng đại diện cho cả nội dung.
    const avgOf = (p) => {
      const vals = Object.keys(p)
        .filter((k) => k !== "thang" && p[k] !== null && p[k] !== undefined)
        .map((k) => p[k]);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    const first = avgOf(points[0]);
    const last = avgOf(points[points.length - 1]);
    if (first === null || last === null) return;
    const diff = last - first;
    if (Math.abs(diff) < 1) {
      lines.push(`${sec.name}: tỷ lệ tuân thủ nhìn chung ổn định từ ${points[0].thang} đến ${points[points.length - 1].thang}.`);
    } else {
      lines.push(
        `${sec.name}: tỷ lệ tuân thủ ${diff > 0 ? "tăng" : "giảm"} khoảng ${Math.round(Math.abs(diff) * 10) / 10} điểm % từ ${points[0].thang} đến ${points[points.length - 1].thang}.`
      );
    }
  });
  if (!lines.length) lines.push("Chưa đủ dữ liệu nhiều tháng để nhận định xu hướng.");
  return lines;
}

/** Nhận xét tự động cho trang "Lỗi vi phạm". */
export function generateViolationInsights({ legend, rows }) {
  const lines = [];
  const activeLegend = (legend || []).filter((v) => v.count > 0);
  if (!activeLegend.length) {
    return ["Chưa ghi nhận lỗi vi phạm nào trong dữ liệu hiện có."];
  }
  const top = [...activeLegend].sort((a, b) => b.count - a.count)[0];
  lines.push(`Loại lỗi phổ biến nhất là "${top.name}" với ${top.count} lượt ghi nhận.`);
  lines.push(`Có ${activeLegend.length} loại lỗi vi phạm khác nhau đã từng phát sinh.`);

  const sortedRows = [...(rows || [])].sort((a, b) => b.total - a.total).filter((r) => r.total > 0);
  if (sortedRows.length) {
    const worst = sortedRows[0];
    lines.push(`Khoa có nhiều tháng phát sinh lỗi nhất là ${worst.khoa}, với ${worst.total} tháng có ghi nhận vi phạm.`);
  }
  return lines;
}
