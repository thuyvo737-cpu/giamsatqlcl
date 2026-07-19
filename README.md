# Web theo dõi kết quả giám sát QT-QĐ — BVQY175

Web đọc dữ liệu **trực tiếp** từ Google Sheet (qua Google Sheets API), tự
động cập nhật mỗi 30 giây (polling), gồm 5 trang:

1. **Tổng quan** — 4 tỷ lệ tuân thủ chính (nhận dạng NB, vòng tay, té ngã,
   ATPT) + biểu đồ radar tổng hợp + top khoa nhiều lỗi vi phạm.
2. **Kết quả giám sát** — bảng chi tiết toàn bộ chỉ số theo khoa.
3. **So sánh hình thức GS** — so sánh GS chéo / Ngoại kiểm / Tỷ lệ TB theo
   từng nội dung (đã lược bỏ cột Tự giám sát theo yêu cầu).
4. **Xu hướng theo tháng** — biểu đồ đường theo dõi diễn biến 12 tháng,
   chọn khoa để so sánh.
5. **Lỗi vi phạm** — bảng số lỗi theo khoa/theo tháng, sắp xếp giảm dần.

## 1. Cấu hình kết nối Google Sheet

Mở file `src/config.js` và điền:

```js
export const SHEET_ID = "..."; // lấy từ URL sheet
export const API_KEY = "...";  // tạo tại Google Cloud Console
```

Xem lại hướng dẫn tạo API Key (Google Cloud Console → Enable Google Sheets
API → Credentials → Create API key → giới hạn theo domain + theo Sheets
API) đã trao đổi trong hội thoại trước.

**Sheet phải để chế độ "Anyone with the link — Viewer"** để API key (không
OAuth) đọc được.

Nếu tên tab trong Google Sheet thật không trùng khớp 100% với:

```
Kết quả | So sánh | Theo dõi kết quả | Biểu đồ | Các lỗi vi phạm
```

thì sửa lại trong `TABS` ở cùng file `config.js`.

## 2. Chạy thử local

```bash
npm install
npm run dev
```

Mở http://localhost:5173

## 3. Deploy qua GitHub + Cloudflare Pages

1. Đẩy code lên GitHub (repo mới hoặc cùng repo `QLCL-BVQY175-2026` ở
   nhánh/thư mục khác đều được):
   ```bash
   git init
   git add .
   git commit -m "Init web giám sát QT-QĐ"
   git remote add origin https://github.com/thuyvo737-cpu/<ten-repo>.git
   git push -u origin main
   ```
2. Vào https://dash.cloudflare.com/ → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git** → chọn repo vừa tạo.
3. Cấu hình build:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Deploy. Mỗi lần push lên `main`, Cloudflare tự build lại.

**Lưu ý bảo mật:** vì `API_KEY` nằm trong code frontend (ai cũng xem được
qua DevTools), bắt buộc phải giới hạn API key theo:
- API restrictions → chỉ cho phép Google Sheets API
- Website restrictions → chỉ cho phép domain `*.pages.dev` (và domain
  riêng nếu có) — vào lại Google Cloud Console sau khi có domain
  Cloudflare thật để cập nhật danh sách domain được phép.

## 4. Cấu trúc dữ liệu web đang giả định (theo file mẫu đã cung cấp)

- **Kết quả**: dòng 3 = nhóm nội dung, dòng 4 = tên cột con, dòng 5 trở đi
  = dữ liệu theo khoa (cột A = mã khoa).
- **So sánh**: dòng 1 = nhóm nội dung, dòng 2 = Tự GS/GS chéo/Ngoại
  kiểm/Tỷ lệ TB, dòng 3 trở đi = dữ liệu. Web tự động ẩn cột "Tự GS".
- **Theo dõi kết quả**: 5 khối lặp lại (Khoa + T1–T12 + 4 Quý + Tổng),
  cách nhau 1 cột trống — vị trí cột được cấu hình cứng trong
  `src/utils/parsers.js` (biến `THEO_DOI_SECTIONS`). Nếu sheet thật lệch
  cột so với file mẫu, chỉnh lại mảng này.
- **Biểu đồ**: 4 chỉ số KPI tổng quan đọc tại dòng 5 (nhãn) và dòng 11
  (giá trị), cột B/E/H/K — cấu hình trong `OVERVIEW_KPI_POSITIONS`.
- **Các lỗi vi phạm**: dòng 1 = Khoa + T1..T12, dòng 2 trở đi = dữ liệu.

Nếu Google Sheet thật có sai lệch vị trí so với file Excel mẫu đã dùng để
dựng web này, chỉ cần chỉnh trong `src/utils/parsers.js` — không cần sửa
giao diện.
