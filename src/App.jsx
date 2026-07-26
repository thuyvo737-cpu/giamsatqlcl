import { useState } from "react";
import { Nav } from "./components/Nav.jsx";
import { useSheetData } from "./hooks/useSheetData.js";
import { TABS } from "./config.js";
import { parseKetQuaFull, parseLoiViPham } from "./utils/parsers.js";
import { Overview } from "./pages/Overview.jsx";
import { KetQua } from "./pages/KetQua.jsx";
import { SoSanh } from "./pages/SoSanh.jsx";
import { XuHuong } from "./pages/XuHuong.jsx";
import { LoiViPham } from "./pages/LoiViPham.jsx";

export default function App() {
  const [page, setPage] = useState("overview");

  // Chỉ còn đọc 2 tab (đã bỏ tab "Biểu đồ" — KPI giờ tính trực tiếp từ
  // "Kết quả full" để luôn khớp với bộ lọc tháng/năm trên trang).
  const ketQuaFull = useSheetData(TABS.ketQuaFull, parseKetQuaFull);
  const loiViPham = useSheetData(TABS.loiViPham, parseLoiViPham);

  const activeHook = {
    overview: ketQuaFull,
    ketqua: ketQuaFull,
    sosanh: ketQuaFull,
    xuhuong: ketQuaFull,
    loivipham: loiViPham,
  }[page];
  const syncStatus = activeHook.error ? "error" : activeHook.loading ? "pending" : "ok";

  return (
    <div className="app-shell">
      <Nav active={page} onChange={setPage} syncStatus={syncStatus} />
      <main className="main">
        {page === "overview" && <Overview loiViPham={loiViPham} ketQuaFull={ketQuaFull} />}
        {page === "ketqua" && <KetQua hook={ketQuaFull} />}
        {page === "sosanh" && <SoSanh hook={ketQuaFull} />}
        {page === "xuhuong" && <XuHuong hook={ketQuaFull} />}
        {page === "loivipham" && <LoiViPham hook={loiViPham} />}
      </main>
    </div>
  );
}
