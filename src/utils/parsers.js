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

// -------------------------------------------------------------
// TAB "Kết quả": dòng 3 = nhóm nội dung, dòng 4 = tên cột con,
// dòng 5 trở đi = dữ liệu theo khoa.
// -------------------------------------------------------------
export function parseKetQua(rows) {
  if (!rows || rows.length < 5) return { headers: [], rows: [] };
  const categoryRow = rows[2] || [];
  const subRow = rows[3] || [];
  const headers = combineHeaders(categoryRow, subRow, { from: 0 });
  headers[0] = "Khoa";
  headers[1] = "Khoa giám sát";

  const dataRows = rows
    .slice(4)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const record = { khoa: r[0], khoaGiamSat: r[1] };
      const values = {};
      for (let i = 2; i < headers.length; i++) {
        if (headers[i]) values[headers[i]] = r[i] ?? null;
      }
      record.values = values;
      return record;
    });

  return { headers, rows: dataRows };
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
// TAB "Các lỗi vi phạm": dòng 1 = Khoa + T1..T12, dòng 2+ = dữ liệu.
// -------------------------------------------------------------
export function parseLoiViPham(rows) {
  if (!rows || rows.length < 2) return { months: [], rows: [] };
  const header = rows[0] || [];
  const months = header.slice(1, 13);

  const dataRows = rows
    .slice(1)
    .filter((r) => !isEmptyRow(r) && r[0])
    .map((r) => {
      const monthly = months.map((m, idx) => Number(r[idx + 1]) || 0);
      const total = monthly.reduce((a, b) => a + b, 0);
      return { khoa: r[0], monthly, total };
    })
    .sort((a, b) => b.total - a.total);

  return { months, rows: dataRows };
}
