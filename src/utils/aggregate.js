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

function weightedAvg(items) {
  const valid = (items || []).filter(
    (x) => x && x.rate !== null && x.rate !== undefined
  );
  if (!valid.length) return null;
  const totalN = valid.reduce((s, x) => s + (x.n || 0), 0);
  if (!totalN) return valid.reduce((s, x) => s + x.rate, 0) / valid.length;
  return valid.reduce((s, x) => s + x.rate * (x.n || 0), 0) / totalN;
}

function pick(record, contentKey) {
  if (contentKey === "s5") return { n: record.n, rate: record.rate };
  return record.contents?.[contentKey] || { n: 0, rate: null };
}

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
      (!thang || r.thang === thang) &&
      (!nam || r.nam === nam) &&
      (!khoa || r.donViDuocGiamSat === khoa)
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
      (r) => (!thang || r.thang === thang) && (!nam || r.nam === nam)
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
