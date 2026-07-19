# Web theo dõi kết quả giám sát QT-QĐ — BVQY175

Web đọc dữ liệu **trực tiếp** từ Google Sheet (qua Google Sheets API), tự
động cập nhật mỗi 30 giây (polling), gồm 5 trang:

1. **Tổng quan** — 4 tỷ lệ tuân thủ chính + biểu đồ radar + biểu đồ chi tiết
   theo từng nội dung (lọc tháng/năm, mặc định tháng/năm hiện tại) + khối
   "Phân tích tổng quan": biểu đồ nhiệt Khoa×Tháng, Pareto lỗi vi phạm,
   phân bố khoa theo mức tuân thủ, tương quan cỡ mẫu×tỷ lệ, cơ cấu hình
   thức giám sát, biến động so với tháng trước — kèm khối **nhận xét tự
   động (rule-based, không dùng AI)** diễn giải lại đúng số liệu đang hiển thị.
2. **Kết quả giám sát** — bảng chi tiết theo khoa, có lọc tháng/năm, tiêu
   đề 2 tầng có màu theo từng nội dung, khung cuộn dọc dính tiêu đề.
3. **So sánh hình thức GS** — so sánh Giám sát chéo / Ngoại kiểm bằng biểu
   đồ dumbbell (không bao gồm Tự giám sát), kèm bảng chi tiết tự nhận diện
   cột nào là tỷ lệ (%) và cột nào là số lượng để không quy đổi % nhầm.
4. **Xu hướng** — biểu đồ đường theo tháng, hiển thị đồng thời cho mọi nội
   dung, lọc theo năm và theo khoa.
5. **Lỗi vi phạm** — bảng chú giải mã lỗi (Stt → tên loại vi phạm → số lượt
   ghi nhận) + bảng Khoa×Tháng hiển thị đúng mã lỗi (không phải số lượng),
   cột Tổng đếm số tháng có phát sinh lỗi.

## 1. Cấu hình kết nối Google Sheet

Mở file `src/config.js` và điền:

```js
export const SHEET_ID = "..."; // lấy từ URL sheet
export const API_KEY = "...";  // tạo tại Google Cloud Console
```

**Sheet phải để chế độ "Anyone with the link — Viewer"** để API key (không
OAuth) đọc được.

Web hiện đọc đúng 4 tab trong Sheet gốc (cấu hình trong `TABS`):

```
Kết quả full | So sánh | Biểu đồ | Các lỗi vi phạm
```

Tab **"Kết quả full"** là nguồn dữ liệu chính (bản ghi chi tiết từng lượt
giám sát, có sẵn Tháng GS/Năm GS/Loại dữ liệu) — mọi tính năng lọc
tháng/năm, biểu đồ phân tích, nhận xét tự động đều tính từ tab này theo
đúng công thức trong tab "Cách tính" của Sheet gốc: **kết quả cuối cùng =
trung bình cộng tỷ lệ Giám sát chéo và tỷ lệ Ngoại kiểm** (không tính Tự
giám sát). Nếu tên tab trong Sheet thật khác, sửa lại trong `TABS`.

## 2. Chạy thử local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## 3. Deploy qua GitHub + Cloudflare Pages

1. Đẩy code lên GitHub (repo mới hoặc cùng repo cũ).
2. Cloudflare dashboard → **Workers & Pages** → **Create application** →
   chọn **Pages** → **Connect to Git** (không chọn luồng Workers/Wrangler).
3. Build settings: Build command `npm run build`, Build output directory
   `dist`.
4. Deploy — mỗi lần push lên `main`, Cloudflare tự build lại.

**Bảo mật API key**: giới hạn theo domain thật (`*.pages.dev/*`) trong
Google Cloud Console → Credentials → API key → Website restrictions.

## 4. Cấu trúc dữ liệu web đang giả định (theo file mẫu đã cung cấp)

- **Kết quả full**: 2 dòng đầu là tiêu đề gộp. Cột 0-4 = Tháng GS/Năm
  GS/Loại dữ liệu/Đơn vị giám sát/Đơn vị được giám sát. Cột 5-37 = 4 khối
  nội dung QT-QĐ (nhận dạng, vòng tay, té ngã, ATPT), mỗi khối có cột đầu
  là "số lượng giám sát" (n) và cột cuối là "tỷ lệ đạt". Cột 38-49 = khối
  5S, có Tháng/Năm/Loại/đơn vị **riêng** (không dùng chung dòng với khối
  QT-QĐ). Vị trí cột cấu hình trong `src/utils/parsers.js`
  (`QTQD_CONTENT_GROUPS`, `S5_GROUP`).
- **So sánh**: dòng 1 = nhóm nội dung, dòng 2 = Tự GS/GS chéo/Ngoại
  kiểm/Tỷ lệ TB, dòng 3+ = dữ liệu. Web tự nhận diện cột nào là tỷ lệ (giá
  trị 0-1) để hiển thị đúng %, cột còn lại hiển thị nguyên dạng số lượng.
- **Biểu đồ**: 4 chỉ số KPI tổng quan đọc tại dòng 5 (nhãn) và dòng 11
  (giá trị) — cấu hình trong `OVERVIEW_KPI_POSITIONS`.
- **Các lỗi vi phạm**: cột A = Khoa, cột B-M = T1..T12 (mỗi ô là **mã lỗi**
  1-8, không phải số lượng), cột O/P = bảng chú giải Stt → Tên lỗi.

Nếu Google Sheet thật có sai lệch vị trí so với file Excel mẫu đã dùng để
dựng web này, chỉnh trong `src/utils/parsers.js` (đọc dữ liệu thô) hoặc
`src/utils/aggregate.js` (công thức tính tỷ lệ) — không cần sửa giao diện.

