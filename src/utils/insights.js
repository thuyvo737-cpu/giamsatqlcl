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

/**
 * Nhận xét tự động chi tiết theo từng nội dung — dùng cho cả trang Tổng
 * quan (toàn viện) và trang Kết quả chi tiết (khi có/không lọc khoa cụ
 * thể). Không còn kiểu nhận xét "vô tri" (ví dụ so khoa đang lọc với
 * chính nó) — khi có `khoaFocus`, mọi so sánh đều xoay quanh khoa đó so
 * với MỤC TIÊU và so với KỲ TRƯỚC, thay vì so với toàn viện.
 */
export function generateContentInsights({
  contentSummaries,
  currentLabel,
  previousLabel,
  khoaFocus = null,
  target = 0.8,
  repeatedViolations = null,
}) {
  const lines = [];
  const valid = (contentSummaries || []).filter((c) => c.rate !== null && c.rate !== undefined);
  if (!valid.length) {
    return [`Chưa đủ dữ liệu ${khoaFocus ? `của ${khoaFocus} ` : ""}trong ${currentLabel} để đưa ra nhận xét.`];
  }

  // 1) Tỷ lệ trung bình 5 nội dung + so với kỳ trước
  const avgRate = valid.reduce((s, c) => s + c.rate, 0) / valid.length;
  const withDelta = valid.filter((c) => c.delta !== null && c.delta !== undefined);
  const avgDelta = withDelta.length ? withDelta.reduce((s, c) => s + c.delta, 0) / withDelta.length : null;
  const deltaText = (d) => {
    if (d === null || d === undefined) return "chưa đủ dữ liệu để so sánh";
    if (Math.abs(d) < 0.001) return "không đổi";
    return `${d > 0 ? "tăng" : "giảm"} ${fmtPctPoint(d)}`;
  };

  if (khoaFocus) {
    const reached = avgRate >= target;
    lines.push(
      `${khoaFocus}: tỷ lệ tuân thủ trung bình 5 nội dung trong ${currentLabel} đạt ${fmtPct(avgRate)} — ${
        reached ? "đã đạt" : "chưa đạt"
      } mục tiêu ${Math.round(target * 100)}%, ${deltaText(avgDelta)} so với ${previousLabel}.`
    );
  } else {
    lines.push(
      `Tỷ lệ tuân thủ trung bình 5 nội dung toàn viện trong ${currentLabel} đạt ${fmtPct(avgRate)}, ${deltaText(
        avgDelta
      )} so với ${previousLabel}.`
    );
  }

  // 2) Chi tiết từng nội dung
  valid.forEach((c) => {
    const parts = [`${c.label}: ${fmtPct(c.rate)} (${deltaText(c.delta)} so với ${previousLabel})`];
    if (khoaFocus) {
      parts.push(c.rate >= target ? "đã đạt mục tiêu" : `chưa đạt mục tiêu ${Math.round(target * 100)}%`);
    } else if (c.topKhoa) {
      parts.push(`khoa cao nhất: ${c.topKhoa.khoa} (${fmtPct(c.topKhoa.rate)})`);
    }
    if (c.worstSub && c.worstSub.rate !== null) {
      parts.push(`cần cải thiện tiêu chí "${c.worstSub.label}" (${fmtPct(c.worstSub.rate)})`);
    }
    if (c.bestImprovedSub && c.bestImprovedSub.delta > 0.01) {
      parts.push(`cải thiện nổi bật ở "${c.bestImprovedSub.label}" (+${fmtPctPoint(c.bestImprovedSub.delta)})`);
    }
    lines.push(parts.join(" — ") + ".");
  });

  // 3) Lỗi vi phạm lặp lại trong kỳ
  if (repeatedViolations !== null) {
    if (repeatedViolations.length) {
      const top = repeatedViolations
        .slice(0, 3)
        .map((v) => `"${v.name}" (${v.count} lượt)`)
        .join(", ");
      lines.push(`Lỗi vi phạm lặp lại nhiều lần trong kỳ: ${top}.`);
    } else {
      lines.push("Không ghi nhận lỗi vi phạm lặp lại nổi bật trong kỳ này.");
    }
  }

  // 4) Đề xuất kiến nghị — dựa trên nội dung/tiêu chí thấp nhất và lỗi phổ biến nhất
  const worstContent = [...valid].sort((a, b) => a.rate - b.rate)[0];
  const recParts = [];
  if (worstContent) {
    recParts.push(`rà soát lại quy trình "${worstContent.label}" (đang thấp nhất, ${fmtPct(worstContent.rate)})`);
    if (worstContent.worstSub) {
      recParts.push(`đặc biệt tiêu chí "${worstContent.worstSub.label}"`);
    }
  }
  if (repeatedViolations && repeatedViolations.length) {
    recParts.push(`nhắc nhở khắc phục lỗi "${repeatedViolations[0].name}" đang lặp lại nhiều nhất`);
  }
  if (recParts.length) {
    lines.push(`Đề xuất: ${recParts.join("; ")}.`);
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
