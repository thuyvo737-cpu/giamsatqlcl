# TÓM TẮT DỰ ÁN: Web theo dõi kết quả giám sát QT-QĐ — BVQY175

> Dán toàn bộ nội dung file này vào đầu cuộc trò chuyện mới (kèm file
> zip code đính kèm) để Claude nắm lại đầy đủ bối cảnh và tiếp tục hỗ trợ.

## 0. Cập nhật gần nhất (bản vá bố cục — không đổi logic tính toán)

- **Executive Summary**: `.exec-grid` đổi từ CSS Grid (`auto-fit`) sang
  Flexbox (`flex-wrap` + `flex: 1 1 240px`) — tránh lỗi để trống 1 hàng
  khi số ô (5 ô) không chia hết cho số cột grid tính tự động; giờ các ô
  luôn giãn lấp đầy hàng.
- **Trang Tổng quan**: chuyển khối "Nhận xét tự động", "Cảnh báo", "Khoa
  cần ưu tiên giám sát" xuống **cuối trang** (sau bảng Pareto/vi phạm),
  để phần đầu trang chỉ còn Executive Summary + KPI + biểu đồ, đỡ dày
  đặc chữ xen giữa biểu đồ.
- **Tất cả các trang khác** (Kết quả chi tiết, So sánh hình thức GS, Xu
  hướng, Lỗi vi phạm): khối "Nhận xét tự động" cũng chuyển xuống **cuối
  trang** tương tự, và văn phong đồng bộ với trang Tổng quan (dùng động
  từ mô tả xu hướng: "tiếp tục cải thiện", "sụt giảm đáng kể"...).
- Câu "Toàn viện/khoa đạt tỷ lệ tuân thủ trung bình..." (gộp cả 5 nội
  dung) đã được rà soát — không còn xuất hiện trong
  `generateContentInsights()`.
- Rà soát lại câu mô tả dưới tiêu đề (`page-desc`) của cả 5 trang cho
  khớp với tính năng hiện tại (VD: Kết quả chi tiết nhắc tới xếp hạng +
  bản đồ nhiệt; Lỗi vi phạm nhắc tới Pareto + khuyến nghị).

## 0.1 Cập nhật trước đó (bản vá nhỏ — Khoa cần ưu tiên giám sát)

- Sửa lỗi logic: trước đây `buildPriorityKhoa()` luôn cắt cứng Top 5
  khoa có điểm cao nhất, kể cả khi điểm đó rất thấp (Xanh — ổn định),
  gây mâu thuẫn hiển thị ("cần ưu tiên" nhưng lại "ổn định"). Giờ chỉ
  đưa vào danh sách khoa nào có **ít nhất 1 yếu tố đáng chú ý** (tỷ lệ
  tuân thủ <80%, đang giảm ≥3 điểm %, có tháng phát sinh lỗi, hoặc có
  lỗi tái diễn) — không giới hạn số dòng cố định, danh sách dài/ngắn
  tuỳ theo dữ liệu thực tế. Không cần tỷ lệ thấp mới được liệt kê: chỉ
  cần có lỗi vi phạm/tái diễn là đủ điều kiện xuất hiện.
- Bỏ nhãn mô tả màu ("Xanh — ổn định", "Vàng — theo dõi"...) ở
  `PriorityKhoaCard.jsx` — giờ chỉ hiện điểm số kèm màu (badge "XX
  điểm"), không còn dòng chữ diễn giải màu gây rối.

## 0.1 Nâng cấp UI/UX ver3 (Power BI/Stripe/Notion)

> Đợt này CHỈ đổi giao diện/trình bày, KHÔNG đổi database/API/công thức
> tính toán — đúng yêu cầu gốc của người dùng.

- Thang typography chuẩn hoá theo Inter: page-title 36px/700, section-
  title 24px/700, card-title 18px/600, kpi-value 40px/700.
- `src/utils/icons.jsx` (mới): bộ icon SVG tối giản tự viết, KHÔNG thêm
  dependency ngoài (giữ nguyên 3 deps: react/react-dom/recharts).
- `src/utils/chartTheme.js` (mới): `TOOLTIP_STYLE`, `rateColor()`,
  `riskColor()`, `riskLabel()` dùng chung cho mọi biểu đồ — đã áp dụng
  tooltip đồng bộ (bo góc, shadow, font) cho hầu hết biểu đồ recharts.
- KPI Card (`StatCard.jsx`) viết lại hoàn toàn: nền trắng + viền màu
  trái (kiểu Stripe/Power BI thay vì khối màu đặc cũ), icon, mũi vươn
  ▲▼▬ có màu xanh/đỏ/xám, thanh tiến trình, badge mục tiêu, hover nhẹ.
- **Executive Summary** (`ExecutiveSummary.jsx`, mới) — đặt ngay đầu
  trang Tổng quan, sinh từ `generateExecutiveSummary()` trong
  `insights.js`: tuân thủ trung bình toàn viện, nội dung cải thiện/giảm
  nhiều nhất, top 3 khoa ưu tiên, 3 hành động ưu tiên.
- **Cảnh báo tự động** (`buildAlerts()` trong `aggregate.js` +
  `AlertPanel.jsx`): 5S giảm liên tục 3 tháng, khoa giảm mạnh (≥10 điểm
  % so tháng trước), nội dung dưới 90%, loại lỗi phổ biến nhất trong
  năm. Số lượng cảnh báo hiện thành badge đỏ trên mục "Tổng quan" ở
  sidebar (tính ở `App.jsx`).
- **Khoa cần ưu tiên giám sát** (`buildPriorityKhoa()` +
  `PriorityKhoaCard.jsx`): điểm rủi ro 0-100 = trọng số của (1) khoảng
  cách tới 100% tuân thủ 35%, (2) xu hướng giảm so tháng trước 25%, (3)
  số tháng có lỗi vi phạm 20%, (4) số lỗi tái diễn (xuất hiện ≥2 lần)
  20%. Màu Đỏ/Cam/Vàng/Xanh theo ngưỡng 70/50/30. **Đây là điểm THAM
  KHẢO hệ thống tự tính, không phải chỉ số chính thức đã được QLCL phê
  duyệt** — đã ghi chú rõ dưới card.
- Nhận xét tự động (`generateContentInsights`) viết lại theo văn phong
  chuyên gia QLCL: câu liền mạch, có động từ mô tả xu hướng ("tiếp tục
  cải thiện", "sụt giảm đáng kể"...), kèm khuyến nghị hành động.
- Trang Kết quả chi tiết: Heatmap Khoa×Tháng có thêm bộ lọc Top 10/Top
  20/Toàn bộ (mặc định hiện các khoa có tỷ lệ TB thấp nhất trước) + ô
  tìm khoa theo tên.
- Trang So sánh hình thức GS: thêm hiển thị sai lệch (+X%/-X%) giữa
  Giám sát chéo và Ngoại kiểm ngay dưới biểu đồ tổng hợp.
- Trang Xu hướng: thêm đường "Toàn viện" (nét liền, đại diện xu hướng
  chung) + đoạn dự báo tháng kế tiếp (nét đứt) bằng hồi quy tuyến tính
  đơn giản trên tối đa 6 điểm gần nhất — hàm `forecastNextMonth()`
  trong `aggregate.js`. Không dùng Machine Learning, chỉ least-squares
  cơ bản; có ghi chú rõ đây là ước tính.
- Trang Lỗi vi phạm: thêm biểu đồ Pareto (trước đây chỉ có ở Tổng quan)
  và card "Khuyến nghị cải tiến" sinh tự động ngay sau đó
  (`generateRecommendations()` — map từ khoá trong tên lỗi sang gợi ý
  đào tạo/checklist/kiểm tra hồ sơ/hướng dẫn bổ sung).
- Sidebar: icon riêng cho từng mục, badge số cảnh báo trên "Tổng quan".
- CSS: card có shadow nhẹ + hover, transition 0.2s, scroll mượt toàn
  trang, class dùng chung mới: `.exec-summary`, `.alert-card`,
  `.priority-row`, `.recommend-item`, `.deviation-pill`, `.nav-badge`.

## 0.1 Cập nhật lớn trước đó (chỉnh sửa web ver2)

- Đổi font toàn site sang **Inter** (thay Nunito/Nunito Sans).
- Trang Tổng quan: bộ lọc tháng/năm chuyển lên **đầu tiên**, tháng giờ
  là multi-select (`selectedMonths`) — chọn đúng 3 tháng khớp 1 quý
  chuẩn sẽ tự chuyển sang "chế độ quý" (`resolvePeriod()` trong
  `aggregate.js`), chỉ chọn 1 tháng thì "chế độ tháng"; các trường hợp
  khác (chọn 0 hoặc >1 tháng không khớp quý) so với **cùng kỳ năm
  trước** để tránh trộn 2 năm khác nhau trong cùng 1 filter mảng.
- Nhận xét tự động viết lại hoàn toàn: `generateContentInsights()` (thay
  `generateInsights()` cũ) — tính theo `buildContentSummary()`, cho ra
  tỷ lệ trung bình + so kỳ trước, từng nội dung kèm khoa cao nhất/tiêu
  chí cần cải thiện/tiêu chí cải thiện tốt nhất, lỗi vi phạm lặp lại
  trong kỳ (`findRepeatedViolations()`), và dòng đề xuất kiến nghị. Khi
  dùng ở trang Kết quả chi tiết với `khoaFocus` (tên khoa hoặc "N khoa
  đã chọn"), mọi câu so sánh xoay quanh khoa đó so với mục tiêu 80% và
  kỳ trước — không còn kiểu so khoa đang lọc với chính nó.
- Biểu đồ so quý (`QuarterCompareChart`) đổi trục hoành sang **nội
  dung**, mỗi nội dung 1 nhóm 4 cột quý — dùng
  `buildQuarterComparisonByContent()`.
- Cơ cấu hình thức giám sát (donut) bỏ "Tự giám sát", chỉ còn Giám sát
  chéo / Ngoại kiểm.
- Biến động so kỳ trước tách riêng theo từng nội dung
  (`buildMonthOverMonthByContent()`), có dropdown chọn nội dung, không
  gộp trung bình vô nghĩa như bản cũ.
- `MonthlyDetailCharts` (biểu đồ tiêu chí con): sửa lỗi margin âm gây
  clip số "100%" thành "00%" ở trục tung, tăng cỡ chữ nhãn tiêu chí con,
  bỏ dòng chú "gộp toàn viện".
- Trang "Kết quả giám sát" đổi tên thành **"Kết quả chi tiết"**: nhận
  xét tự động đưa lên ngay sau bộ lọc; biểu đồ xếp hạng khoa đặt trong
  khung `resize: vertical` (kéo góc dưới-phải để thu hẹp/mở rộng); biểu
  đồ so kỳ trước dùng chung `resolvePeriod()` nên tự linh động
  tháng/quý; **đã bỏ bảng số liệu thô 4 nội dung, thay bằng Heatmap Khoa
  × Tháng** (`buildHeatmapMatrix()` giờ nhận thêm tham số lọc khoa).
- Trang So sánh hình thức GS: viết lại câu mô tả dưới tiêu đề cho gọn,
  tránh ngắt dòng xấu.
- `resolvePeriod()`, `buildContentSummary()`, `buildPeriodCompare()`
  (bản mới, 2 chuỗi hiện tại/kỳ trước thay vì 4 chuỗi cố định),
  `findRepeatedViolations()`, `buildQuarterComparisonByContent()`,
  `buildMonthOverMonthByContent()` đều nằm trong `src/utils/aggregate.js`
  — đọc kỹ trước khi sửa vì nhiều trang đang dùng chung.

## 0.1 Cập nhật lớn trước đó (chỉnh sửa web ver1)

- Đã bỏ hoàn toàn tab "Biểu đồ" khỏi luồng dữ liệu — 4 KPI đầu trang
  Tổng quan giờ tính trực tiếp từ "Kết quả full" (gộp toàn viện) để
  luôn khớp với bộ lọc tháng/năm, thay vì đọc số tĩnh từ tab riêng.
  `App.jsx` giờ chỉ fetch 2 tab: `ketQuaFull`, `loiViPham`.
- Đã bổ sung trích xuất **dữ liệu tiêu chí con** (sub-criteria) cho cả
  5 nội dung trong `parsers.js` (`QTQD_CONTENT_GROUPS[].subOffsets`,
  `S5_SUB_OFFSETS`) — dùng cho biểu đồ "chi tiết theo từng tiêu chí".
- `aggregate.js` có `matchFilter()` cho phép mọi hàm tổng hợp
  (`computeRate`, `buildCoverageDonut`...) nhận bộ lọc thang/nam/khoa là
  **mảng nhiều giá trị** (mảng rỗng = không lọc/"Tất cả"), phục vụ các
  ô lọc multi-select mới ở trang Kết quả giám sát / So sánh / Xu hướng.
- Component `MultiSelect.jsx` (mới) thay cho `MultiSelectKhoa.jsx` cũ
  (đã xoá) — dùng chung cho khoa/tháng/năm, có nút "Chọn tất cả".
- Toàn bộ 5 trang đã được viết lại đáng kể — xem chi tiết yêu cầu gốc ở
  lịch sử hội thoại nếu cần đối chiếu lại từng điểm.

## 1. Bối cảnh & mục tiêu

Người dùng là nhân viên **Ban QLCL** tại **Bệnh viện Quân y 175 (BVQY175)**,
phụ trách tổng hợp kết quả giám sát tuân thủ quy trình – quy định (QT-QĐ)
và 5S do mạng lưới QLCL các khoa thực hiện. Dữ liệu gốc lưu trên **1 Google
Sheet** (đã publish "Anyone with the link — Viewer"), gồm nhiều tab: dữ
liệu thô Google Form (`Dữ liệu 5S`, `Dữ liệu QT-QĐ`), tab xử lý trung gian
(`Xử lý 5S`, `Xử lý QT-QĐ`), tab kết quả tổng hợp (`Kết quả`, `Kết quả
full`, `So sánh`, `Theo dõi kết quả`, `Biểu đồ`, `Các lỗi vi phạm`), và tab
giải thích công thức (`Cách tính`).

Mục tiêu: xây 1 **web nội bộ** đọc dữ liệu **trực tiếp từ Google Sheet**
(qua Google Sheets API, polling 30 giây — không dùng OAuth, không có
backend riêng), deploy miễn phí qua **GitHub + Cloudflare Pages**, người
dùng thao tác hoàn toàn qua giao diện web (không dùng dòng lệnh / Node.js
trên máy cá nhân).

## 2. Quyết định kiến trúc quan trọng

- **Nguồn dữ liệu chính duy nhất: tab "Kết quả full"** — đây là bảng chi
  tiết từng bản ghi giám sát (không gộp theo khoa), có sẵn cột Tháng
  GS/Năm GS/Loại dữ liệu/Đơn vị giám sát/Đơn vị được giám sát ở mỗi dòng.
  Nhờ vậy mọi tính năng lọc theo tháng/năm, biểu đồ phân tích, nhận xét tự
  động đều **tính trực tiếp trên trình duyệt** từ tab này, không cần đọc
  thêm các tab tổng hợp sẵn khác (đã bỏ hẳn việc đọc tab "Kết quả", "So
  sánh", "Theo dõi kết quả" để giảm số lượt gọi API).
- **Web KHÔNG tự tính lại từ dữ liệu thô Google Form** (tab `Dữ liệu
  QT-QĐ` 2.535+ dòng dạng text tích chọn) — quá rủi ro sai lệch so với
  Excel. Chỉ dùng số đã được Excel tính sẵn trong "Kết quả full".
- **Công thức tính tỷ lệ cuối cùng** (theo đúng tab "Cách tính" trong
  Sheet gốc): với mỗi khoa/nội dung/tháng — **kết quả = trung bình cộng
  của tỷ lệ Giám sát chéo và tỷ lệ Ngoại kiểm** (mỗi tỷ lệ đó là trung
  bình có trọng số theo cỡ mẫu của các bản ghi cùng loại). **Không tính Tự
  giám sát** vào kết quả cuối. Giá trị `loai` khớp chính xác 3 chuỗi:
  `"Tự giám sát"`, `"Giám sát chéo"`, `"Ngoại kiểm"` (lấy từ công thức
  gốc trong Sheet, xem `src/utils/aggregate.js`).
- **Nhận xét tự động = rule-based, KHÔNG dùng AI/LLM** — chỉ diễn giải lại
  số liệu đã tính (so sánh khoa cao/thấp nhất, đếm khoa dưới ngưỡng, biến
  động so với tháng trước, lỗi vi phạm phổ biến nhất...). Quyết định này
  nhằm tránh chi phí API, tránh cần thêm backend giấu API key, và đảm bảo
  số liệu nhận xét luôn khớp 100% với số hiển thị.
- **5 nội dung giám sát** (dùng xuyên suốt, key nội bộ):
  `nhanDang` (Nhận dạng NB), `vongTay` (Vòng tay NB), `teNga` (Nguy cơ té
  ngã), `atpt` (Bảng kiểm ATPT), `s5` (Đánh giá 5S) — mỗi nội dung có 1
  màu định danh riêng dùng đồng bộ toàn site (định nghĩa ở
  `CONTENT_COLORS` trong `aggregate.js` + class `.group-0..4` trong
  `global.css`).
- **Thiết kế**: font "Nunito"/"Nunito Sans" (nét tròn, chuyên nghiệp),
  tông màu **pastel** toàn site (định nghĩa ở đầu `global.css`), sidebar
  màu indigo pastel đậm (không dùng navy đen như bản đầu).

## 3. Cấu trúc cột "Kết quả full" (0-based index) — QUAN TRỌNG khi debug

2 dòng đầu là tiêu đề gộp, dữ liệu bắt đầu từ dòng 3 (index 2).

**Khối QT-QĐ (cột 0-37):**
- 0: Tháng GS, 1: Năm GS, 2: Loại dữ liệu, 3: Đơn vị giám sát, 4: Đơn vị
  được giám sát (= mã khoa, ví dụ "A2.b", "B12")
- 5-12: Nhận dạng NB (8 cột, cột 5 = số lượng giám sát (n), cột 12 = tỷ
  lệ đạt)
- 13-20: Vòng tay NB (8 cột, cột 13 = n, cột 20 = tỷ lệ đạt)
- 21-28: Nguy cơ té ngã (8 cột, cột 21 = n, cột 28 = tỷ lệ đạt)
- 29-37: Bảng kiểm ATPT (9 cột, cột 29 = n, cột 37 = tỷ lệ đạt)

**Khối 5S (cột 38-49) — có Tháng/Năm/Loại/đơn vị RIÊNG, không dùng chung
dòng với khối QT-QĐ:**
- 38: Tháng GS, 39: Năm GS, 40: Loại dữ liệu, 41: Đơn vị được đánh giá,
  42: Đơn vị đánh giá, 43: Số khu vực được kiểm tra (n), 44-48: Tỷ lệ đạt
  S1-S5, 49: Tỷ lệ đạt trung bình (rate dùng để tính)

Vị trí cột cấu hình tại `QTQD_CONTENT_GROUPS` và khối 5S (hard-code) trong
`src/utils/parsers.js`, hàm `parseKetQuaFull()`.

## 4. Cấu trúc các tab khác đang dùng

- **"Biểu đồ"**: 4 KPI tổng quan đọc tại dòng 5 (nhãn, cột A/D/G/J) và
  dòng 11 (giá trị, cột B/E/H/K) — cấu hình `OVERVIEW_KPI_POSITIONS`
  trong `parsers.js`, hàm `parseBieuDo()`.
- **"Các lỗi vi phạm"**: cột A = Khoa, cột B-M = T1..T12. **Mỗi ô KHÔNG
  PHẢI số lượng lỗi mà là MÃ SỐ (Stt 1-8)** tra theo bảng chú giải cột
  O/P (0-based 14/15) nằm bên phải cùng tab. Cột "Tổng" = đếm số THÁNG có
  phát sinh lỗi (không cộng dồn mã số). Hàm `parseLoiViPham()` tự quét
  toàn tab để dựng bảng chú giải + tự đếm số lượt mỗi loại lỗi (không phụ
  thuộc bảng COUNTA phụ có sẵn trong Sheet).

## 5. Cấu trúc trang web (5 trang)

1. **Tổng quan** (`Overview.jsx`): 4 KPI (nhãn ngắn + màu nội dung) → biểu
   đồ radar → khối **nhận xét tự động** (đặt sớm, đóng vai trò tóm tắt) →
   bộ lọc tháng/năm dùng chung → Phân bố khoa theo mức tuân thủ + Cơ cấu
   hình thức giám sát (song song) → Biến động so với tháng trước →
   Heatmap Khoa×Tháng (khung cuộn dính tiêu đề, màu chia mốc rời rạc) →
   Biểu đồ chi tiết theo từng nội dung (5 biểu đồ cột) → Pareto lỗi vi
   phạm (cột ngang, đủ tên) + bảng khoa nhiều lỗi nhất.
2. **Kết quả giám sát** (`KetQua.jsx`): bảng theo khoa, lọc tháng/năm
   (mặc định "Cả năm"), tiêu đề 2 tầng có màu theo nội dung, số liệu căn
   giữa, khung cuộn dính tiêu đề, dòng "Tổng cộng" (số lượng cộng dồn, tỷ
   lệ lấy trung bình các khoa).
3. **So sánh hình thức GS** (`SoSanh.jsx`): hiện đồng thời cả 5 nội dung
   (không cần chọn), lọc tháng/năm, biểu đồ dumbbell (GS chéo vs Ngoại
   kiểm) mỗi nội dung, tự ẩn khoa không có dữ liệu.
4. **Xu hướng** (`XuHuong.jsx`, đổi tên từ "Xu hướng theo tháng"): biểu đồ
   đường theo tháng cho cả 5 nội dung cùng lúc, lọc năm, chọn khoa bằng
   component chip+checkbox tự viết (`MultiSelectKhoa.jsx`), mặc định 5
   khoa đầu.
5. **Lỗi vi phạm** (`LoiViPham.jsx`): bảng chú giải mã lỗi (Stt/Tên/Số
   lượt), bảng Khoa×Tháng hiện huy hiệu mã lỗi (không phải số lượng), cả
   2 bảng đều có khung cuộn dính tiêu đề.

## 6. Danh sách file mã nguồn (đính kèm trong zip)

```
qlcl-giam-sat-web/
├── README.md                          — hướng dẫn cấu hình & deploy
├── index.html                         — load font Nunito
├── package.json / vite.config.js
├── src/
│   ├── config.js                      — SHEET_ID, API_KEY (cần điền lại!), TABS, polling interval
│   ├── App.jsx                        — điều hướng trang, khai báo 3 hook fetch (ketQuaFull, bieuDo, loiViPham)
│   ├── main.jsx
│   ├── api/googleSheets.js            — gọi Google Sheets API (range mặc định A1:CZ30000)
│   ├── hooks/useSheetData.js          — hook fetch + polling 30s
│   ├── utils/
│   │   ├── parsers.js                 — parseKetQuaFull, parseBieuDo, parseLoiViPham
│   │   ├── aggregate.js               — computeRate, CONTENT_LABELS/COLORS, heatmap, distribution, donut, month-over-month, computeTotalRow (LOGIC TÍNH TOÁN CHÍNH — đọc kỹ trước khi sửa)
│   │   └── insights.js                — sinh nhận xét tự động rule-based
│   ├── components/                    — Nav, StatCard, LoadingState, MonthYearFilter, MultiSelectKhoa,
│   │                                     Heatmap, ParetoChart, DistributionChart, CoverageDonut,
│   │                                     MonthOverMonthTable, DumbbellChart, MonthlyDetailCharts, InsightBox
│   ├── pages/                         — Overview, KetQua, SoSanh, XuHuong, LoiViPham
│   └── styles/global.css              — design tokens pastel, font Nunito, class dùng chung
```

## 7. Quy trình làm việc đã thống nhất với người dùng

- Người dùng **không dùng Git/dòng lệnh** — mọi cập nhật code thực hiện
  qua **giao diện web GitHub** (Add file → Upload files, kéo-thả đè thư
  mục `src`) hoặc **GitHub Desktop** (đã hướng dẫn cài, giúp tự nhận diện
  file đổi/xóa mà không cần thao tác thủ công).
- **Chỉ cần xóa file cũ thủ công khi đổi tên/xóa file** (ví dụ lúc đổi
  `TheoDoi.jsx` → `XuHuong.jsx`). Sửa nội dung file có tên/đường dẫn giữ
  nguyên thì chỉ cần upload đè, Git tự lưu phiên bản cũ trong lịch sử.
- Deploy qua **Cloudflare Pages** (project `giamsatqlcl`, domain
  `giamsatqlcl.pages.dev`) — build command `npm run build`, output
  `dist`. **Lưu ý khi tạo project mới trên Cloudflare: phải chọn đúng
  luồng "Pages" / "Import an existing Git repository"**, không chọn
  "Workers" (dễ nhầm vì giao diện Cloudflare gộp chung menu "Workers &
  Pages") — nếu chọn nhầm sẽ dùng `wrangler deploy` và báo lỗi build sai
  bản chất (`Rollup failed to resolve import "/src/main.jsx"`).
- **Muốn chuyển đổi nhanh giữa các phiên bản đã deploy**: dùng tính năng
  **Rollback** có sẵn của Cloudflare Pages (Deployments → "..." → "Rollback
  to this deployment") — không cần đụng vào GitHub.
- **API Key Google Sheets**: tạo tại Google Cloud Console → giới hạn
  "Application restrictions" = Websites (domain `giamsatqlcl.pages.dev/*`
  và `*.giamsatqlcl.pages.dev/*`) + "API restrictions" = chỉ Google Sheets
  API. File `src/config.js` trong mọi bản zip Claude gửi **luôn để trống
  API_KEY** (placeholder `"DÁN_API_KEY_VÀO_ĐÂY"`) vì Claude không lưu/xem
  được key thật — **người dùng phải tự điền lại key vào file này mỗi lần
  nhận code mới trước khi upload**, đây là nguyên nhân đã từng gây lỗi
  "400 API key not valid" một lần.

## 8. Sự cố đã gặp và cách xử lý (tham khảo nếu lặp lại)

- **Lỗi "API key not valid"**: do quên điền lại API key vào `config.js`
  bản mới trước khi upload đè.
- **Một số biểu đồ trống dữ liệu dù Sheet có dữ liệu thật**: do
  `fetchTabValues` giới hạn phạm vi tải (`range`) chỉ 1000 dòng ban đầu,
  trong khi tab "Kết quả full" đã vượt 1700+ dòng — dữ liệu các tháng gần
  nhất nằm ngoài phạm vi tải. Đã tăng lên `A1:CZ30000`. Nếu tái diễn ở
  tương lai xa, tăng thêm con số này trong `src/api/googleSheets.js`.
- **Build Cloudflare lỗi "Rollup failed to resolve import"**: do chọn
  nhầm luồng "Workers" thay vì "Pages" lúc tạo project trên Cloudflare,
  hoặc do cấu trúc thư mục trên GitHub bị lồng thừa 1 cấp khi kéo-thả
  upload sai cách.

## 9. Việc còn có thể làm tiếp (chưa yêu cầu, chỉ ghi chú)

- Tối ưu bundle size (hiện >500KB, Vite cảnh báo) bằng code-splitting nếu
  cần — chưa cấp thiết ở quy mô dữ liệu hiện tại.
- Nếu dữ liệu "Kết quả full" tăng lên hàng chục nghìn dòng trong tương
  lai xa, cân nhắc giảm tần suất polling hoặc chuyển sang đồng bộ định kỳ
  về Supabase (phương án đã cân nhắc nhưng không chọn ở giai đoạn đầu).
