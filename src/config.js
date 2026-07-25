// =============================================================
// CẤU HÌNH KẾT NỐI GOOGLE SHEET
// =============================================================
// 1. Dán Sheet ID lấy từ URL của Google Sheet:
//    https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
// 2. Dán API Key tạo từ Google Cloud Console (đã giới hạn theo
//    domain deploy + giới hạn chỉ dùng Google Sheets API).
// 3. Nếu tên tab trong Sheet thật khác với tên bên dưới, sửa lại
//    cho khớp (phải khớp chính xác từng dấu, khoảng trắng).
// =============================================================

export const SHEET_ID = "1sk5kB-Truf5WVxaTcsoIkYo7Vv7VR0-hiJlRlbT3jUE";
export const API_KEY = "DÁN_API_KEY_VÀO_ĐÂY";

export const TABS = {
  ketQuaFull: "Kết quả full",
  bieuDo: "Biểu đồ",
  loiViPham: "Các lỗi vi phạm",
};

// Khoảng thời gian tự động lấy lại dữ liệu (mili giây).
// 30000 = 30 giây. Không nên đặt quá thấp (Google giới hạn
// 60 request/phút/người dùng).
export const POLLING_INTERVAL_MS = 30000;
