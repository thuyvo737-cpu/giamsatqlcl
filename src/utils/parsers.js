// =============================================================
// PARSER CHO TỪNG TAB
// Google Sheets API chỉ trả về giá trị thô dạng lưới (không biết
// ô nào bị merge). Các tab dùng "tiêu đề gộp" (1 dòng nội dung lớn
// + 1 dòng tên cột con) nên ta dùng kỹ thuật "forward-fill": ô nào
// trống thì lấy giá trị của ô liền trước cùng hàng — đúng với cách
// Excel/Sheets merge cell hiển thị dữ liệu.
// =============================================================

function isEmptyRow(row) {
  return !row || row.every((v) => v === null || v === undefined || v === "");
}

function toNumberOrNull(v) {
  if (
    v === null ||
    v === undefined ||
    v === "" ||
    (typeof v === "string" && v.trim().startsWith("#"))
  ) {
    return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s.startsWith("#")) return null;
  return s;
}

// -------------------------------------------------------------
// TAB "Kết quả full": dữ liệu chi tiết TỪNG bản ghi giám sát (không
// gộp theo khoa), có sẵn Tháng GS / Năm GS / Loại dữ liệu — đây là
// nguồn duy nhất cho phép lọc theo tháng/năm/hình thức giám sát cụ
// thể. Vị trí cột (0-based) khớp với cấu trúc mẫu thực tế của file:
// cột 0-37 = khối QT-QĐ (Tháng/Năm/Loại/2 đơn vị + 4 nội dung),
// cột 38-49 = khối 5S (có Tháng/Năm/Loại/đơn vị riêng, tách biệt).
// Cột "số lượng giám sát" (n) của mỗi nội dung ứng với F/N/V/AD/AR
// trong Sheet gốc — là cột đầu tiên của mỗi nhóm bên dưới.
// -------------------------------------------------------------
export const QTQD_CONTENT_GROUPS = [
  {
    key: "nhanDang",
    name: "Nhận dạng người bệnh",
    start: 5,
    fieldCount: 8,
    nField: "Số TH đã nhận dạng",
    rateLabel: "Nhận dạng đạt yêu cầu",
  },
  {
    key: "vongTay",
    name: "Vòng tay nhận dạng",
    start: 13,
    fieldCount: 8,
    nField: "Số NB được GS",
    rateLabel: "Tỷ lệ vòng tay đạt yêu cầu",
  },
  {
    key: "teNga",
    name: "Đánh giá nguy cơ té ngã",
    start: 21,
    fieldCount: 8,
    nField: "Tổng phiếu đánh giá",
    rateLabel: "Tỷ lệ đạt chung đánh giá té ngã",
  },
  {
    key: "atpt",
    name: "Bảng kiểm an toàn phẫu thuật",
    start: 29,
    fieldCount: 9,
    nField: "Số hồ sơ được kiểm tra",
    rateLabel: "Tỷ lệ đạt thực hiện BK",
  },
];

export const S5_GROUP = {
  key: "s5",
  name: "Đánh giá 5S",
  nField: "Số khu vực được kiểm tra",
  rateLabel: "Tỷ lệ đạt trung bình",
};

export const ALL_CONTENT_GROUPS = [
  ...QTQD_CONTENT_GROUPS,
  { key: S5_GROUP.key, name: S5_GROUP.name },
];

export function parseKetQuaFull(rows) {
  if (!rows || rows.length < 3) {
    return { qtqd: [], s5: [], contentGroups: QTQD_CONTENT_GROUPS };
  }
  const dataRows = rows.slice(2); // 2 dòng đầu là tiêu đề gộp

  const qtqd = [];
  const s5 = [];

  dataRows.forEach((r) => {
    if (!r) return;

    // Khối QT-QĐ (cột 0-37)
    const thang = toNumberOrNull(r[0]);
    const nam = toNumberOrNull(r[1]);
    const loai = cleanStr(r[2]);
    const donViGiamSat = cleanStr(r[3]);
    const donViDuocGiamSat = cleanStr(r[4]);
    if (thang && nam && donViDuocGiamSat) {
      const contents = {};
      QTQD_CONTENT_GROUPS.forEach((g) => {
        const n = toNumberOrNull(r[g.start]);
        const rateIdx = g.start + g.fieldCount - 1;
        const rate = toNumberOrNull(r[rateIdx]);
        contents[g.key] = { n: n ?? 0, rate };
      });
      qtqd.push({ thang, nam, loai, donViGiamSat, donViDuocGiamSat, contents });
    }

    // Khối 5S (cột 38-49) — có Tháng/Năm/Loại/đơn vị riêng
    const thang5s = toNumberOrNull(r[38]);
    const nam5s = toNumberOrNull(r[39]);
    const loai5s = cleanStr(r[40]);
    const donViDuocDanhGia = cleanStr(r[41]);
    const donViDanhGia = cleanStr(r[42]);
    const n5s = toNumberOrNull(r[43]);
    const rate5s = toNumberOrNull(r[49]);
    if (thang5s && nam5s && donViDuocDanhGia) {
      s5.push({
        thang: thang5s,
        nam: nam5s,
        loai: loai5s,
        donViGiamSat: donViDanhGia,
        donViDuocGiamSat: donViDuocDanhGia,
        n: n5s ?? 0,
        rate: rate5s,
      });
    }
  });

  return { qtqd, s5, contentGroups: QTQD_CONTENT_GROUPS };
}

// -------------------------------------------------------------
// TAB "Biểu đồ": lấy 4 chỉ số tỷ lệ tuân thủ tổng quan hiển thị
// dạng KPI/gauge ở trang chủ. Vị trí ô (0-based) khớp với cấu trúc
// mẫu: nhãn ở dòng 5, giá trị ở dòng 11.
// -------------------------------------------------------------
const OVERVIEW_KPI_POSITIONS = [
  { labelCol: 0, valueCol: 1 }, // Nhận dạng NB
  { labelCol: 3, valueCol: 4 }, // Vòng tay nhận dạng
  { labelCol: 6, valueCol: 7 }, // Nguy cơ té ngã
  { labelCol: 9, valueCol: 10 }, // Bảng kiểm ATPT
];
const OVERVIEW_LABEL_ROW = 4; // dòng 5 (1-based) => index 4
const OVERVIEW_VALUE_ROW = 10; // dòng 11 (1-based) => index 10

export function parseBieuDo(rows) {
  if (!rows || rows.length < OVERVIEW_VALUE_ROW + 1) return { title: "", kpis: [] };
  const labelRow = rows[OVERVIEW_LABEL_ROW] || [];
  const valueRow = rows[OVERVIEW_VALUE_ROW] || [];
  const kpis = OVERVIEW_KPI_POSITIONS.map((pos) => ({
    label: (labelRow[pos.labelCol] || "").toString().replace(/\n/g, " "),
    value: Number(valueRow[pos.valueCol]) || 0,
  }));
  const overall =
    kpis.reduce((sum, k) => sum + k.value, 0) / (kpis.length || 1);

  return {
    title: rows[0]?.[0] || "Báo cáo kết quả giám sát",
    kpis,
    overall,
  };
}

// -------------------------------------------------------------
// TAB "Các lỗi vi phạm": cột A = Khoa, cột B-M = T1..T12. MỖI Ô
// KHÔNG PHẢI LÀ SỐ LƯỢNG LỖI — mà là MÃ SỐ (Stt 1-8) tra theo bảng
// chú giải nằm bên phải (cột O = Stt, cột P = Tên lỗi vi phạm).
// "Tổng" của mỗi khoa = số THÁNG có phát sinh lỗi (đếm ô có mã),
// không phải tổng cộng các mã số lại với nhau.
// -------------------------------------------------------------
export function parseLoiViPham(rows) {
  if (!rows || rows.length < 2) return { months: [], rows: [], legend: [] };
  const header = rows[0] || [];
  const months = header.slice(1, 13);

  // Quét toàn tab để dựng bảng chú giải Stt -> Tên lỗi (cột O/P, 0-based 14/15)
  const legendMap = new Map();
  rows.forEach((r) => {
    if (!r) return;
    const stt = r[14];
    const name = r[15];
    if (
      typeof stt === "number" &&
      Number.isInteger(stt) &&
      stt >= 1 &&
      stt <= 50 &&
      typeof name === "string" &&
      name.trim()
    ) {
      legendMap.set(stt, name.trim());
    }
  });

  const dataRows = rows
    .slice(1)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const monthly = months.map((_, idx) => {
        const raw = r[idx + 1];
        const code = typeof raw === "number" ? raw : null;
        return { code, label: code !== null ? legendMap.get(code) || `Mã ${code}` : null };
      });
      const total = monthly.filter((m) => m.code !== null).length;
      return { khoa: r[0], monthly, total };
    })
    .sort((a, b) => b.total - a.total);

  // Đếm số lượt theo từng loại lỗi — đếm trực tiếp trên bảng Khoa×Tháng
  // để luôn khớp dữ liệu thật, không phụ thuộc bảng COUNTA phụ trong Sheet.
  const countByCode = new Map();
  dataRows.forEach((row) => {
    row.monthly.forEach((m) => {
      if (m.code !== null) countByCode.set(m.code, (countByCode.get(m.code) || 0) + 1);
    });
  });

  const legend = Array.from(legendMap.entries())
    .map(([code, name]) => ({ code, name, count: countByCode.get(code) || 0 }))
    .sort((a, b) => b.count - a.count);

  return { months, rows: dataRows, legend };
}
