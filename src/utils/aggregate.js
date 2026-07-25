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
export function buildHeatmapMatrix(ketQuaFull, contentKey, nam) {
  const records = getRecordsForContent(ketQuaFull, contentKey);
  const khoas = listKhoa(records.filter((r) => r.nam === nam));
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
  const totals = { [LOAI.TU_GS]: 0, [LOAI.GS_CHEO]: 0, [LOAI.NGOAI_KIEM]: 0 };
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
 * Tổng hợp 4 KPI đầu trang Tổng quan, tính trực tiếp từ "Kết quả full"
 * (gộp toàn viện, không theo khoa) — kèm số lượt giám sát (n) và biến
 * động so với tháng liền trước, để KPI card thể hiện nhiều thông tin
 * hơn ngoài con số tỷ lệ.
 */
export function computeKpiSummary(ketQuaFull, { thang, nam }) {
  let prevThang = thang - 1;
  let prevNam = nam;
  if (prevThang < 1) {
    prevThang = 12;
    prevNam = nam - 1;
  }
  return CONTENT_KEYS.map((key) => {
    const records = getRecordsForContent(ketQuaFull, key);
    const { rate, n } = computeRate(records, { thang, nam, khoa: null, contentKey: key });
    const prev = computeRate(records, { thang: prevThang, nam: prevNam, khoa: null, contentKey: key });
    const delta = rate !== null && prev.rate !== null ? rate - prev.rate : null;
    return { key, rate, n, delta };
  });
}

/**
 * So sánh 1 khoa: tháng hiện tại / tháng trước / quý hiện tại / quý
 * trước, cho từng nội dung — dùng cho biểu đồ so sánh kỳ ở trang
 * "Chi tiết từng khoa".
 */
export function buildPeriodCompare(ketQuaFull, { khoa, thang, nam }) {
  let prevThang = thang - 1;
  let prevNam = nam;
  if (prevThang < 1) {
    prevThang = 12;
    prevNam = nam - 1;
  }
  const curQuarter = QUARTERS.find((q) => q.months.includes(thang)) || QUARTERS[0];
  const curQIdx = QUARTERS.indexOf(curQuarter);
  let prevQuarter, prevQNam;
  if (curQIdx === 0) {
    prevQuarter = QUARTERS[3];
    prevQNam = nam - 1;
  } else {
    prevQuarter = QUARTERS[curQIdx - 1];
    prevQNam = nam;
  }

  const round = (v) => (v === null || v === undefined ? null : Math.round(v * 1000) / 10);

  return CONTENT_KEYS.map((key) => {
    const records = getRecordsForContent(ketQuaFull, key);
    const current = computeRate(records, { thang, nam, khoa, contentKey: key }).rate;
    const prevMonth = computeRate(records, { thang: prevThang, nam: prevNam, khoa, contentKey: key }).rate;
    const currentQuarter = computeRate(records, { thang: curQuarter.months, nam, khoa, contentKey: key }).rate;
    const prevQuarterRate = computeRate(records, { thang: prevQuarter.months, nam: prevQNam, khoa, contentKey: key }).rate;
    return {
      name: CONTENT_LABELS[key],
      current: round(current),
      prevMonth: round(prevMonth),
      currentQuarter: round(currentQuarter),
      prevQuarter: round(prevQuarterRate),
    };
  });
}

/** So sánh tỷ lệ tuân thủ theo 4 quý trong 1 năm, gộp toàn viện, cho từng nội dung. */
export function buildQuarterComparison(ketQuaFull, { nam }) {
  return QUARTERS.map((q) => {
    const point = { quarter: q.label };
    CONTENT_KEYS.forEach((key) => {
      const records = getRecordsForContent(ketQuaFull, key);
      const { rate } = computeRate(records, { thang: q.months, nam, khoa: null, contentKey: key });
      point[key] = rate !== null ? Math.round(rate * 1000) / 10 : null;
    });
    return point;
  });
}
