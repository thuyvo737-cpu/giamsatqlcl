// =============================================================
// TỔNG HỢP DỮ LIỆU TỪ "KẾT QUẢ FULL"
// Áp dụng đúng theo tab "Cách tính" trong Sheet gốc:
//   - Phân loại: Tự giám sát / Giám sát chéo / Ngoại kiểm
//   - Kết quả cuối cùng = trung bình cộng rate(Giám sát chéo) và
//     rate(Ngoại kiểm) — KHÔNG tính Tự giám sát.
// =============================================================

export const LOAI = {
  TU_GS: "Tự giám sát",
  GS_CHEO: "Giám sát chéo",
  NGOAI_KIEM: "Ngoại kiểm",
};

export const CONTENT_KEYS = ["nhanDang", "vongTay", "teNga", "atpt", "s5"];

export const CONTENT_LABELS = {
  nhanDang: "Nhận dạng NB",
  vongTay: "Vòng tay NB",
  teNga: "Nguy cơ té ngã",
  atpt: "Bảng kiểm ATPT",
  s5: "Đánh giá 5S",
};

// Màu định danh theo nội dung — đồng bộ với biến CSS --c-* trong global.css
// và class .group-0..4 (thứ tự khớp với CONTENT_KEYS bên dưới).
export const CONTENT_COLORS = {
  nhanDang: "var(--c-nhandang)",
  vongTay: "var(--c-vongtay)",
  teNga: "var(--c-tenga)",
  atpt: "var(--c-atpt)",
  s5: "var(--c-5s)",
};

export function weightedAvg(items) {
  const valid = (items || []).filter(
    (x) => x && x.rate !== null && x.rate !== undefined
  );
  if (!valid.length) return null;
  const totalN = valid.reduce((s, x) => s + (x.n || 0), 0);
  if (!totalN) return valid.reduce((s, x) => s + x.rate, 0) / valid.length;
  return valid.reduce((s, x) => s + x.rate * (x.n || 0), 0) / totalN;
}

function pick(record, contentKey) {
  if (contentKey === "s5") return { n: record.n, rate: record.rate, sub: record.sub };
  return record.contents?.[contentKey] || { n: 0, rate: null, sub: [] };
}

/**
 * So khớp 1 giá trị với bộ lọc: bộ lọc có thể là null/undefined (không
 * lọc), 1 giá trị đơn, hoặc mảng nhiều giá trị (mảng rỗng = không lọc,
 * tương đương "Tất cả"). Dùng chung cho thang/nam/khoa ở mọi hàm tổng hợp
 * để đồng bộ hoá cách các trang hỗ trợ chọn nhiều tháng/năm/khoa.
 */
export function matchFilter(value, filter) {
  if (filter === null || filter === undefined) return true;
  if (Array.isArray(filter)) return filter.length === 0 || filter.includes(value);
  return value === filter;
}

export const QUARTERS = [
  { key: "q1", label: "Quý I", months: [1, 2, 3] },
  { key: "q2", label: "Quý II", months: [4, 5, 6] },
  { key: "q3", label: "Quý III", months: [7, 8, 9] },
  { key: "q4", label: "Quý IV", months: [10, 11, 12] },
];

export function getRecordsForContent(ketQuaFull, contentKey) {
  if (!ketQuaFull) return [];
  return contentKey === "s5" ? ketQuaFull.s5 || [] : ketQuaFull.qtqd || [];
}

export function getAvailableYears(ketQuaFull) {
  const years = new Set();
  (ketQuaFull?.qtqd || []).forEach((r) => r.nam && years.add(r.nam));
  (ketQuaFull?.s5 || []).forEach((r) => r.nam && years.add(r.nam));
  return Array.from(years).sort((a, b) => b - a);
}

export function listKhoa(records) {
  return Array.from(
    new Set((records || []).map((r) => r.donViDuocGiamSat).filter(Boolean))
  ).sort();
}

/**
 * Tính tỷ lệ tuân thủ + tổng số lượng giám sát cho 1 khoa / 1 nội dung,
 * theo đúng công thức trong tab "Cách tính": trung bình cộng của tỷ lệ
 * Giám sát chéo và tỷ lệ Ngoại kiểm (mỗi tỷ lệ đó là trung bình có
 * trọng số theo cỡ mẫu của các bản ghi cùng loại).
 */
export function computeRate(records, { thang, nam, khoa, contentKey }) {
  const filtered = (records || []).filter(
    (r) =>
      matchFilter(r.thang, thang) &&
      matchFilter(r.nam, nam) &&
      matchFilter(r.donViDuocGiamSat, khoa)
  );
  const cheo = filtered
    .filter((r) => r.loai === LOAI.GS_CHEO)
    .map((r) => pick(r, contentKey));
  const ngoai = filtered
    .filter((r) => r.loai === LOAI.NGOAI_KIEM)
    .map((r) => pick(r, contentKey));

  const rCheo = weightedAvg(cheo);
  const rNgoai = weightedAvg(ngoai);
  const parts = [rCheo, rNgoai].filter((v) => v !== null && v !== undefined);
  const rate = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
  // n chỉ cộng từ GS chéo + Ngoại kiểm — đúng bằng cỡ mẫu thực sự dùng để
  // tính "rate" ở trên, để không gây hiểu nhầm khi đối chiếu với tỷ lệ.
  const n =
    cheo.reduce((s, x) => s + (x.n || 0), 0) + ngoai.reduce((s, x) => s + (x.n || 0), 0);

  return { rate, n, rCheo, rNgoai };
}

/** Ma trận Khoa × Tháng cho 1 nội dung, trong 1 năm — dùng cho heatmap. */
export function buildHeatmapMatrix(ketQuaFull, contentKey, nam, khoaFilter = null) {
  const records = getRecordsForContent(ketQuaFull, contentKey);
  let khoas = listKhoa(records.filter((r) => r.nam === nam));
  if (khoaFilter && khoaFilter.length) khoas = khoas.filter((k) => khoaFilter.includes(k));
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return khoas.map((khoa) => ({
    khoa,
    cells: months.map(
      (thang) => computeRate(records, { thang, nam, khoa, contentKey }).rate
    ),
  }));
}

/** Tỷ lệ tuân thủ chung (trung bình các nội dung) theo từng khoa. */
export function aggregateAllKhoa(ketQuaFull, { thang, nam }) {
  const allKhoa = new Set();
  CONTENT_KEYS.forEach((g) => {
    listKhoa(getRecordsForContent(ketQuaFull, g)).forEach((k) => allKhoa.add(k));
  });

  return Array.from(allKhoa)
    .map((khoa) => {
      const perGroup = CONTENT_KEYS.map((g) =>
        computeRate(getRecordsForContent(ketQuaFull, g), {
          thang,
          nam,
          khoa,
          contentKey: g,
        })
      );
      const rates = perGroup.map((p) => p.rate).filter((v) => v !== null);
      const avgRate = rates.length
        ? rates.reduce((a, b) => a + b, 0) / rates.length
        : null;
      const totalN = perGroup.reduce((s, p) => s + (p.n || 0), 0);
      return { khoa, rate: avgRate, n: totalN };
    })
    .filter((x) => x.rate !== null);
}

/** Phân bố số khoa theo khoảng tỷ lệ tuân thủ. */
export function buildDistribution(khoaRates) {
  const buckets = [
    { label: "< 50%", min: 0, max: 0.5, count: 0 },
    { label: "50–70%", min: 0.5, max: 0.7, count: 0 },
    { label: "70–90%", min: 0.7, max: 0.9, count: 0 },
    { label: "≥ 90%", min: 0.9, max: 1.0001, count: 0 },
  ];
  (khoaRates || []).forEach(({ rate }) => {
    const b = buckets.find((b) => rate >= b.min && rate < b.max);
    if (b) b.count += 1;
  });
  return buckets;
}

/** Cơ cấu hình thức giám sát theo tổng số lượng giám sát (n), dùng cho donut. */
export function buildCoverageDonut(ketQuaFull, { thang, nam }) {
  const totals = { [LOAI.GS_CHEO]: 0, [LOAI.NGOAI_KIEM]: 0 };
  CONTENT_KEYS.forEach((g) => {
    const records = getRecordsForContent(ketQuaFull, g).filter(
      (r) => matchFilter(r.thang, thang) && matchFilter(r.nam, nam)
    );
    records.forEach((r) => {
      const n = pick(r, g)?.n || 0;
      if (totals[r.loai] !== undefined) totals[r.loai] += n;
    });
  });
  return Object.entries(totals).map(([name, value]) => ({ name, value }));
}

/**
 * Dòng "Tổng cộng" cho bảng theo khoa: Số lượng = cộng tất cả khoa,
 * Tỷ lệ = trung bình cộng tỷ lệ của các khoa (mỗi khoa đã tính đúng
 * công thức TB cộng GS chéo/Ngoại kiểm trước đó).
 */
export function computeTotalRow(tableRows) {
  const totals = {};
  CONTENT_KEYS.forEach((g) => {
    const items = tableRows.map((r) => r.values[g]).filter(Boolean);
    const totalN = items.reduce((s, x) => s + (x.n || 0), 0);
    const rates = items.map((x) => x.rate).filter((v) => v !== null && v !== undefined);
    const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
    totals[g] = { n: totalN, rate: avgRate };
  });
  return totals;
}

/** Biến động tỷ lệ tuân thủ chung theo khoa so với tháng liền trước. */
/** Biến động so với kỳ trước, TÁCH RIÊNG theo 1 nội dung cụ thể (không gộp trung bình các nội dung). */
export function buildMonthOverMonthByContent(ketQuaFull, { thang, nam, prevThang, prevNam, contentKey }) {
  let pThang = prevThang;
  let pNam = prevNam;
  if (pThang === undefined) {
    pThang = thang - 1;
    pNam = nam;
    if (pThang < 1) {
      pThang = 12;
      pNam = nam - 1;
    }
  }
  const records = getRecordsForContent(ketQuaFull, contentKey);
  const khoaList = listKhoa(records.filter((r) => matchFilter(r.thang, thang) && matchFilter(r.nam, nam)));

  return khoaList
    .map((khoa) => {
      const current = computeRate(records, { thang, nam, khoa, contentKey }).rate;
      const previous = computeRate(records, { thang: pThang, nam: pNam, khoa, contentKey }).rate;
      if (current === null || previous === null) return null;
      return { khoa, current, previous, delta: current - previous };
    })
    .filter(Boolean)
    .sort((a, b) => b.delta - a.delta);
}

export function buildMonthOverMonth(ketQuaFull, { thang, nam }) {
  let prevThang = thang - 1;
  let prevNam = nam;
  if (prevThang < 1) {
    prevThang = 12;
    prevNam = nam - 1;
  }
  const current = aggregateAllKhoa(ketQuaFull, { thang, nam });
  const prevList = aggregateAllKhoa(ketQuaFull, { thang: prevThang, nam: prevNam });
  const prevMap = new Map(prevList.map((x) => [x.khoa, x.rate]));

  return current
    .map((c) => {
      const prevRate = prevMap.get(c.khoa);
      if (prevRate === null || prevRate === undefined) return null;
      return {
        khoa: c.khoa,
        current: c.rate,
        previous: prevRate,
        delta: c.rate - prevRate,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.delta - a.delta);
}

/**
 * Tỷ lệ + số lượng tiêu chí con (chiều thuận) cho 1 nội dung, gộp toàn
 * viện (hoặc theo khoa nếu truyền `khoa`), theo đúng công thức TB cộng
 * Giám sát chéo / Ngoại kiểm như computeRate.
 */
export function computeSubCriteriaRates(records, { thang, nam, khoa, contentKey }) {
  const filtered = (records || []).filter(
    (r) =>
      matchFilter(r.thang, thang) &&
      matchFilter(r.nam, nam) &&
      matchFilter(r.donViDuocGiamSat, khoa)
  );
  const cheo = filtered.filter((r) => r.loai === LOAI.GS_CHEO);
  const ngoai = filtered.filter((r) => r.loai === LOAI.NGOAI_KIEM);

  const sample = filtered.find((r) => (pick(r, contentKey)?.sub || []).length);
  const subLabels = (sample ? pick(sample, contentKey).sub : []).map((s) => s.label);

  return subLabels.map((label, idx) => {
    const cheoItems = cheo
      .map((r) => ({ rate: pick(r, contentKey)?.sub?.[idx]?.rate, n: pick(r, contentKey)?.n }))
      .filter((x) => x.rate !== null && x.rate !== undefined);
    const ngoaiItems = ngoai
      .map((r) => ({ rate: pick(r, contentKey)?.sub?.[idx]?.rate, n: pick(r, contentKey)?.n }))
      .filter((x) => x.rate !== null && x.rate !== undefined);
    const rCheo = weightedAvg(cheoItems);
    const rNgoai = weightedAvg(ngoaiItems);
    const parts = [rCheo, rNgoai].filter((v) => v !== null && v !== undefined);
    const rate = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
    return { label, rate };
  });
}

/**
 * Xác định đang xem theo THÁNG / QUÝ / hay khoảng tuỳ ý dựa trên các
 * tháng đang chọn, và tính ra kỳ liền trước tương ứng để so sánh —
 * dùng chung cho trang Tổng quan và Kết quả chi tiết.
 */
export function resolvePeriod(selectedMonths, nam) {
  if (selectedMonths.length === 1) {
    const m = selectedMonths[0];
    const prevThang = m === 1 ? 12 : m - 1;
    const prevNam = m === 1 ? nam - 1 : nam;
    return {
      mode: "month",
      thang: m,
      prevThang,
      prevNam,
      currentLabel: `Tháng ${m}/${nam}`,
      previousLabel: `Tháng ${prevThang}/${prevNam}`,
    };
  }
  const q = QUARTERS.find(
    (q) => q.months.length === selectedMonths.length && q.months.every((m) => selectedMonths.includes(m))
  );
  if (q) {
    const idx = QUARTERS.indexOf(q);
    const prevQ = idx === 0 ? QUARTERS[3] : QUARTERS[idx - 1];
    const prevNam = idx === 0 ? nam - 1 : nam;
    return {
      mode: "quarter",
      thang: q.months,
      prevThang: prevQ.months,
      prevNam,
      currentLabel: `${q.label}/${nam}`,
      previousLabel: `${prevQ.label}/${prevNam}`,
    };
  }
  const thang = selectedMonths.length ? selectedMonths : null;
  return {
    mode: "custom",
    thang,
    prevThang: thang,
    prevNam: nam - 1,
    currentLabel: selectedMonths.length ? `Các tháng ${selectedMonths.join(", ")}/${nam}` : `Cả năm ${nam}`,
    previousLabel: selectedMonths.length ? `Các tháng ${selectedMonths.join(", ")}/${nam - 1}` : `Cả năm ${nam - 1}`,
  };
}

/** So sánh 1 khoa (hoặc null=toàn viện) theo đúng kỳ đang xem (tháng hoặc quý) với kỳ liền trước, cho từng nội dung — dùng đúng resolvePeriod để linh động tháng/quý. */
export function buildPeriodCompare(ketQuaFull, { khoa, thang, nam, prevThang, prevNam }) {
  const round = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 10);
  return CONTENT_KEYS.map((key) => {
    const records = getRecordsForContent(ketQuaFull, key);
    const current = computeRate(records, { thang, nam, khoa, contentKey: key }).rate;
    const previous = computeRate(records, { thang: prevThang, nam: prevNam, khoa, contentKey: key }).rate;
    return { name: CONTENT_LABELS[key], current: round(current), previous: round(previous) };
  });
}

/**
 * Tổng hợp đầy đủ theo TỪNG NỘI DUNG cho 1 kỳ (tháng hoặc quý), dùng làm
 * "nguyên liệu" cho nhận xét tự động: tỷ lệ hiện tại, so với kỳ trước,
 * khoa cao nhất (khi không giới hạn 1 khoa cụ thể), tiêu chí con thấp
 * nhất cần cải thiện, tiêu chí con cải thiện tốt nhất so với kỳ trước.
 */
export function buildContentSummary(ketQuaFull, { thang, nam, khoa, prevThang, prevNam }) {
  return CONTENT_KEYS.map((key) => {
    const records = getRecordsForContent(ketQuaFull, key);
    const { rate, n } = computeRate(records, { thang, nam, khoa, contentKey: key });
    const prev = computeRate(records, { thang: prevThang, nam: prevNam, khoa, contentKey: key });
    const delta = rate !== null && prev.rate !== null ? rate - prev.rate : null;

    let topKhoa = null;
    if (!khoa) {
      const scoped = records.filter((r) => matchFilter(r.thang, thang) && matchFilter(r.nam, nam));
      const khoaList = listKhoa(scoped);
      let best = null;
      khoaList.forEach((k) => {
        const kr = computeRate(records, { thang, nam, khoa: k, contentKey: key }).rate;
        if (kr !== null && (!best || kr > best.rate)) best = { khoa: k, rate: kr };
      });
      topKhoa = best;
    }

    const subRates = computeSubCriteriaRates(records, { thang, nam, khoa, contentKey: key });
    const prevSubRates = computeSubCriteriaRates(records, { thang: prevThang, nam: prevNam, khoa, contentKey: key });
    const validSub = subRates.filter((s) => s.rate !== null && s.rate !== undefined);
    const worstSub = validSub.length ? validSub.reduce((a, b) => (a.rate <= b.rate ? a : b)) : null;

    let bestImprovedSub = null;
    subRates.forEach((s, idx) => {
      const prevS = prevSubRates[idx];
      if (s.rate !== null && s.rate !== undefined && prevS && prevS.rate !== null && prevS.rate !== undefined) {
        const d = s.rate - prevS.rate;
        if (!bestImprovedSub || d > bestImprovedSub.delta) bestImprovedSub = { label: s.label, delta: d };
      }
    });

    return {
      key,
      label: CONTENT_LABELS[key],
      rate,
      n,
      prevRate: prev.rate,
      delta,
      topKhoa,
      worstSub,
      bestImprovedSub,
    };
  });
}

/** Tìm các mã lỗi lặp lại (xuất hiện từ 2 lượt trở lên) trong các tháng thuộc kỳ đang xem. */
export function findRepeatedViolations(loiViPhamData, months) {
  if (!loiViPhamData || !months || !months.length) return [];
  const monthIdxSet = new Set(months.map((m) => m - 1));
  const countByCode = {};
  (loiViPhamData.rows || []).forEach((r) => {
    (r.monthly || []).forEach((cell, idx) => {
      if (monthIdxSet.has(idx) && cell.code !== null && cell.code !== undefined) {
        countByCode[cell.code] = (countByCode[cell.code] || 0) + 1;
      }
    });
  });
  const legendMap = {};
  (loiViPhamData.legend || []).forEach((l) => {
    legendMap[l.code] = l.name;
  });
  return Object.entries(countByCode)
    .map(([code, count]) => ({ code, name: legendMap[code] || `Mã ${code}`, count }))
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.count - a.count);
}

/** So sánh tỷ lệ tuân thủ theo 4 quý trong 1 năm, gộp toàn viện, cho từng nội dung — trục theo NỘI DUNG (mỗi nội dung 1 nhóm 4 cột quý). */
export function buildQuarterComparisonByContent(ketQuaFull, { nam }) {
  return CONTENT_KEYS.map((key) => {
    const records = getRecordsForContent(ketQuaFull, key);
    const point = { name: CONTENT_LABELS[key] };
    QUARTERS.forEach((q) => {
      const { rate } = computeRate(records, { thang: q.months, nam, khoa: null, contentKey: key });
      point[q.key] = rate !== null ? Math.round(rate * 1000) / 10 : null;
    });
    return point;
  });
}
