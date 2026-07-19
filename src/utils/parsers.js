// =============================================================
// PARSER CHO TỪNG TAB
// Google Sheets API chỉ trả về giá trị thô dạng lưới (không biết
// ô nào bị merge). Các tab dùng "tiêu đề gộp" (1 dòng nội dung lớn
// + 1 dòng tên cột con) nên ta dùng kỹ thuật "forward-fill": ô nào
// trống thì lấy giá trị của ô liền trước cùng hàng — đúng với cách
// Excel/Sheets merge cell hiển thị dữ liệu.
// =============================================================

function forwardFill(row = []) {
  let last = null;
  return row.map((v) => {
    if (v !== null && v !== undefined && v !== "") {
      last = v;
      return v;
    }
    return last;
  });
}

function combineHeaders(categoryRow, subRow, { from = 0 } = {}) {
  const cats = forwardFill(categoryRow);
  const headers = [];
  for (let i = 0; i < subRow.length; i++) {
    if (i < from) {
      headers.push(subRow[i] ?? null);
      continue;
    }
    const cat = cats[i];
    const sub = subRow[i];
    if (!sub && !cat) headers.push(null);
    else if (!sub) headers.push(String(cat));
    else if (!cat) headers.push(String(sub));
    else if (cat === sub) headers.push(String(cat));
    else headers.push(`${cat} — ${sub}`);
  }
  return headers;
}

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
// TAB "Kết quả": dòng 3 = nhóm nội dung, dòng 4 = tên cột con,
// dòng 5 trở đi = dữ liệu theo khoa.
// -------------------------------------------------------------
export function parseKetQua(rows) {
  if (!rows || rows.length < 5) return { groups: [], rows: [] };
  const categoryRow = rows[2] || [];
  const subRow = rows[3] || [];
  const sectionNames = forwardFill(categoryRow);

  const groups = [];
  const seen = new Set();
  for (let i = 2; i < subRow.length; i++) {
    const name = sectionNames[i];
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const cols = [];
    for (let j = i; j < subRow.length && sectionNames[j] === name; j++) {
      if (subRow[j]) cols.push({ index: j, label: subRow[j] });
    }
    groups.push({ name, cols });
  }

  const dataRows = rows
    .slice(4)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const values = {};
      groups.forEach((g) => {
        values[g.name] = {};
        g.cols.forEach((c) => {
          values[g.name][c.label] = r[c.index] ?? null;
        });
      });
      return { khoa: r[0], khoaGiamSat: r[1], values };
    });

  return { groups, rows: dataRows };
}

// -------------------------------------------------------------
// TAB "So sánh": dòng 1 = nhóm nội dung (Thực hành nhận dạng,
// Kiểm tra vòng tay, Đánh giá nguy cơ té ngã...), dòng 2 = tên
// cột con (Tự GS / GS chéo / Ngoại kiểm / Tỷ lệ TB), dòng 3+ = dữ
// liệu theo khoa. Theo yêu cầu, cột "Tự GS" bị lược bỏ khỏi kết quả.
// -------------------------------------------------------------
export function parseSoSanh(rows) {
  if (!rows || rows.length < 3) return { sections: [], rows: [] };
  const categoryRow = rows[0] || [];
  const subRow = rows[1] || [];
  const headers = combineHeaders(categoryRow, subRow, { from: 2 });
  headers[0] = "Khoa";
  headers[1] = "Khoa GS chéo";

  // Xác định các cột cần loại bỏ (Tự GS)
  const excludedCols = new Set();
  subRow.forEach((v, i) => {
    if (i >= 2 && String(v).trim() === "Tự GS") excludedCols.add(i);
  });

  // Nhóm các cột theo nội dung giám sát (nhận dạng / vòng tay / té ngã...)
  const sectionNames = forwardFill(categoryRow);
  const sections = [];
  const seen = new Set();
  for (let i = 2; i < subRow.length; i++) {
    const name = sectionNames[i];
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const cols = [];
    for (let j = i; j < subRow.length && sectionNames[j] === name; j++) {
      if (!excludedCols.has(j) && subRow[j]) {
        cols.push({ index: j, label: subRow[j] });
      }
    }
    sections.push({ name, cols });
  }

  const dataRows = rows
    .slice(2)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const record = { khoa: r[0], khoaGsCheo: r[1], values: {} };
      sections.forEach((sec) => {
        record.values[sec.name] = {};
        sec.cols.forEach((c) => {
          record.values[sec.name][c.label] = r[c.index] ?? null;
        });
      });
      return record;
    });

  return { sections, rows: dataRows };
}

// -------------------------------------------------------------
// TAB "Theo dõi kết quả": 5 khối nội dung lặp lại theo mẫu cố định
// (Khoa + 12 tháng + 4 quý + Tổng, cách nhau 1 cột trống). Vị trí
// cột (0-based) được xác định từ cấu trúc mẫu thực tế của file.
// Nếu Sheet thật có thêm/bớt cột, chỉ cần chỉnh lại mảng SECTIONS.
// -------------------------------------------------------------
const THEO_DOI_FIELD_LABELS = [
  "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12",
  "Quý I", "Quý II", "Quý III", "Quý IV", "Tổng",
];

const THEO_DOI_SECTIONS = [
  { name: "Thực hành nhận dạng NB", start: 1 },
  { name: "Kiểm tra vòng tay nhận dạng", start: 19 },
  { name: "Đánh giá nguy cơ té ngã", start: 37 },
  { name: "Đánh giá bảng kiểm an toàn phẫu thuật", start: 55 },
  { name: "Đánh giá 5S", start: 73 },
];

export function parseTheoDoi(rows) {
  if (!rows || rows.length < 3) return { sections: [], rows: [] };
  const dataRows = rows
    .slice(2)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const record = { khoa: r[0], values: {} };
      THEO_DOI_SECTIONS.forEach((sec) => {
        const monthly = THEO_DOI_FIELD_LABELS.map((label, idx) => ({
          label,
          value: r[sec.start + idx] ?? null,
        }));
        record.values[sec.name] = monthly;
      });
      return record;
    });

  return { sections: THEO_DOI_SECTIONS.map((s) => s.name), rows: dataRows };
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
