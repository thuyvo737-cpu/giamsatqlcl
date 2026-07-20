import { SHEET_ID, API_KEY } from "../config.js";

/**
 * Lấy dữ liệu thô (dạng lưới 2 chiều) của 1 tab trong Google Sheet.
 * Trả về mảng các dòng, mỗi dòng là mảng các ô (giá trị hiển thị).
 * range mặc định A1:CZ30000 — đủ rộng cho tab "Kết quả full" vốn tăng
 * dần theo thời gian (mỗi lượt giám sát thêm 1 dòng). Đặt dư ra để
 * tránh lặp lại lỗi mất dữ liệu các tháng gần đây khi số dòng tăng lên.
 */
export async function fetchTabValues(tabName, range = "A1:CZ30000") {
  if (!SHEET_ID || SHEET_ID.startsWith("DÁN_")) {
    throw new Error(
      "Chưa cấu hình SHEET_ID / API_KEY trong src/config.js"
    );
  }

  const encodedRange = encodeURIComponent(`${tabName}!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodedRange}?key=${API_KEY}&valueRenderOption=UNFORMATTED_VALUE`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Lỗi tải tab "${tabName}": ${res.status} ${
        body?.error?.message || res.statusText
      }`
    );
  }
  const data = await res.json();
  return data.values || [];
}
