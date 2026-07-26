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

  // 1) Chuẩn bị hàm hỗ trợ diễn giải chênh lệch — dùng lại ở phần chi tiết từng nội dung bên dưới.
  const deltaText = (d) => {
    if (d === null || d === undefined) return "chưa đủ dữ liệu để so sánh";
    if (Math.abs(d) < 0.001) return "không đổi";
    return `${d > 0 ? "tăng" : "giảm"} ${fmtPctPoint(d)}`;
  };

  // 2) Chi tiết từng nội dung — văn phong chuyên gia QLCL, câu liền mạch
  valid.forEach((c) => {
    const trendVerb = (() => {
      if (c.delta === null || c.delta === undefined) return null;
      if (Math.abs(c.delta) < 0.005) return "duy trì ổn định";
      if (c.delta > 0.05) return "cải thiện rõ rệt";
      if (c.delta > 0) return "tiếp tục cải thiện";
      if (c.delta < -0.05) return "sụt giảm đáng kể";
      return "giảm nhẹ";
    })();

    let sentence1;
    if (khoaFocus) {
      const targetPhrase = c.rate >= target ? `đã vượt mục tiêu ${Math.round(target * 100)}%` : `vẫn chưa đạt mục tiêu ${Math.round(target * 100)}%`;
      sentence1 = trendVerb
        ? `${c.label} tại ${khoaFocus} ${trendVerb} trong ${currentLabel}, đạt ${fmtPct(c.rate)} (${deltaText(c.delta)} so với ${previousLabel}) và ${targetPhrase}.`
        : `${c.label} tại ${khoaFocus} đạt ${fmtPct(c.rate)} trong ${currentLabel} và ${targetPhrase}.`;
    } else {
      sentence1 = trendVerb
        ? `${c.label} ${trendVerb} trong ${currentLabel}, đạt ${fmtPct(c.rate)} toàn viện (${deltaText(c.delta)} so với ${previousLabel})${
            c.topKhoa ? `; khoa dẫn đầu là ${c.topKhoa.khoa} (${fmtPct(c.topKhoa.rate)})` : ""
          }.`
        : `${c.label} đạt ${fmtPct(c.rate)} toàn viện trong ${currentLabel}${c.topKhoa ? `, khoa dẫn đầu là ${c.topKhoa.khoa} (${fmtPct(c.topKhoa.rate)})` : ""}.`;
    }

    let sentence2 = "";
    if (c.worstSub && c.worstSub.rate !== null) {
      sentence2 = ` Tuy nhiên tiêu chí "${c.worstSub.label}" vẫn thấp nhất (${fmtPct(c.worstSub.rate)}) và cần được ưu tiên cải tiến.`;
    }
    let sentence3 = "";
    if (c.bestImprovedSub && c.bestImprovedSub.delta > 0.01) {
      sentence3 = ` Điểm sáng là tiêu chí "${c.bestImprovedSub.label}" đã cải thiện đáng kể (+${fmtPctPoint(c.bestImprovedSub.delta)}).`;
    }

    lines.push(sentence1 + sentence2 + sentence3);
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
    lines.push(`Đề xuất Ban QLCL: nên ${recParts.join("; ")}.`);
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

  const withDiff = valid
    .filter((s) => s.rCheo !== null && s.rNgoai !== null)
    .map((s) => ({ ...s, diff: s.rCheo - s.rNgoai }));

  withDiff.forEach((s) => {
    if (Math.abs(s.diff) < 0.02) {
      lines.push(`${s.name}: hai hình thức giám sát cho kết quả tương đồng (${fmtPct(s.rCheo)} so với ${fmtPct(s.rNgoai)}).`);
      return;
    }
    const higher = s.diff > 0 ? "Giám sát chéo" : "Ngoại kiểm";
    const lower = s.diff > 0 ? "Ngoại kiểm" : "Giám sát chéo";
    lines.push(
      `${s.name}: ${higher} ghi nhận tỷ lệ cao hơn ${lower} khoảng ${fmtPctPoint(s.diff)} (${fmtPct(s.rCheo)} so với ${fmtPct(s.rNgoai)}), cho thấy có khác biệt trong cách đánh giá giữa 2 hình thức ở nội dung này.`
    );
  });

  const sortedDiff = [...withDiff].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  if (sortedDiff.length && Math.abs(sortedDiff[0].diff) >= 0.02) {
    const top = sortedDiff[0];
    lines.push(
      `Đề xuất Ban QLCL: nên đối chiếu lại tiêu chí đánh giá của "${top.name}" giữa 2 hình thức giám sát để thống nhất cách chấm điểm, do đây là nội dung có chênh lệch lớn nhất (${fmtPctPoint(top.diff)}).`
    );
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
    const trendVerb =
      Math.abs(diff) < 1
        ? "duy trì ổn định"
        : diff > 5
        ? "cải thiện rõ rệt"
        : diff > 0
        ? "tiếp tục cải thiện"
        : diff < -5
        ? "sụt giảm đáng kể"
        : "giảm nhẹ";
    lines.push(
      `${sec.name} ${trendVerb} từ ${points[0].thang} đến ${points[points.length - 1].thang}${
        Math.abs(diff) < 1 ? "" : `, ${diff > 0 ? "tăng" : "giảm"} khoảng ${Math.round(Math.abs(diff) * 10) / 10} điểm %`
      }.`
    );
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

/**
 * Executive Summary cho đầu trang Tổng quan — tóm tắt điều hành ngắn
 * gọn cho Ban Giám đốc: mức tuân thủ chung, nội dung cải thiện/giảm
 * nhiều nhất, khoa cần ưu tiên, và hành động ưu tiên nên triển khai.
 */
export function generateExecutiveSummary({ contentSummaries, priorityKhoa, currentLabel, previousLabel }) {
  const valid = (contentSummaries || []).filter((c) => c.rate !== null);
  const avgRate = valid.length ? valid.reduce((s, c) => s + c.rate, 0) / valid.length : null;

  const withDelta = valid.filter((c) => c.delta !== null && c.delta !== undefined);
  const mostImproved = withDelta.length ? [...withDelta].sort((a, b) => b.delta - a.delta)[0] : null;
  const mostDeclined = withDelta.length ? [...withDelta].sort((a, b) => a.delta - b.delta)[0] : null;

  const topPriority = (priorityKhoa || []).slice(0, 3);

  const actions = [];
  const worstContent = valid.length ? [...valid].sort((a, b) => a.rate - b.rate)[0] : null;
  if (worstContent) {
    actions.push(
      `Chỉ đạo rà soát quy trình "${worstContent.label}" (${fmtPct(worstContent.rate)}, thấp nhất toàn viện)${
        worstContent.worstSub ? `, tập trung vào tiêu chí "${worstContent.worstSub.label}"` : ""
      }.`
    );
  }
  if (topPriority.length) {
    actions.push(
      `Tăng cường giám sát/hỗ trợ ${topPriority.length} khoa có điểm rủi ro cao nhất: ${topPriority
        .map((k) => k.khoa)
        .join(", ")}.`
    );
  }
  if (mostDeclined && mostDeclined.delta < -0.01) {
    actions.push(`Tìm hiểu nguyên nhân "${mostDeclined.label}" giảm ${fmtPctPoint(mostDeclined.delta)} so với ${previousLabel} và có biện pháp khắc phục kịp thời.`);
  } else {
    actions.push(`Duy trì các biện pháp đang triển khai để giữ vững đà cải thiện trong ${currentLabel}.`);
  }

  return {
    avgRate,
    mostImproved,
    mostDeclined,
    topPriority,
    actions: actions.slice(0, 3),
  };
}

// Từ khoá → khuyến nghị cải tiến gợi ý, dùng để sinh tự động ở trang Lỗi vi phạm.
const RECOMMEND_RULES = [
  { keywords: ["chữ ký", "ký"], text: "Tổ chức đào tạo/nhắc nhở nhân viên ký xác nhận đầy đủ theo quy định." },
  { keywords: ["minh chứng", "chứng từ", "hồ sơ"], text: "Tăng cường kiểm tra hồ sơ, bổ sung minh chứng còn thiếu." },
  { keywords: ["thông tin", "đầy đủ", "điền"], text: "Cập nhật lại checklist thao tác để đảm bảo điền đầy đủ thông tin." },
  { keywords: ["thời gian", "trễ", "chậm"], text: "Rà soát quy trình để đảm bảo thực hiện đúng thời gian quy định." },
];

function recommendFor(name) {
  const lower = (name || "").toLowerCase();
  const rule = RECOMMEND_RULES.find((r) => r.keywords.some((k) => lower.includes(k)));
  return rule ? rule.text : "Hướng dẫn bổ sung, nhắc nhở khoa/phòng thực hiện đúng quy trình đã ban hành.";
}

/** Sinh khuyến nghị cải tiến tự động cho top loại lỗi phổ biến nhất — dùng ở trang Lỗi vi phạm, sau Pareto. */
export function generateRecommendations(legend) {
  return (legend || [])
    .filter((v) => v.count > 0)
    .slice(0, 5)
    .map((v) => ({ name: v.name, count: v.count, recommendation: recommendFor(v.name) }));
}
