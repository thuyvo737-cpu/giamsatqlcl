import { useState } from "react";
import { Nav } from "./components/Nav.jsx";
import { useSheetData } from "./hooks/useSheetData.js";
import { TABS } from "./config.js";
import {
  parseKetQua,
  parseSoSanh,
  parseTheoDoi,
  parseBieuDo,
  parseLoiViPham,
} from "./utils/parsers.js";
import { Overview } from "./pages/Overview.jsx";
import { KetQua } from "./pages/KetQua.jsx";
import { SoSanh } from "./pages/SoSanh.jsx";
import { TheoDoi } from "./pages/TheoDoi.jsx";
import { LoiViPham } from "./pages/LoiViPham.jsx";

export default function App() {
  const [page, setPage] = useState("overview");

  const ketQua = useSheetData(TABS.ketQua, parseKetQua);
  const soSanh = useSheetData(TABS.soSanh, parseSoSanh);
  const theoDoi = useSheetData(TABS.theoDoi, parseTheoDoi);
  const bieuDo = useSheetData(TABS.bieuDo, parseBieuDo);
  const loiViPham = useSheetData(TABS.loiViPham, parseLoiViPham);

  const activeHook = { overview: bieuDo, ketqua: ketQua, sosanh: soSanh, theodoi: theoDoi, loivipham: loiViPham }[page];
  const syncStatus = activeHook.error ? "error" : activeHook.loading ? "pending" : "ok";

  return (
    <div className="app-shell">
      <Nav active={page} onChange={setPage} syncStatus={syncStatus} />
      <main className="main">
        {page === "overview" && <Overview bieuDo={bieuDo} loiViPham={loiViPham} />}
        {page === "ketqua" && <KetQua hook={ketQua} />}
        {page === "sosanh" && <SoSanh hook={soSanh} />}
        {page === "theodoi" && <TheoDoi hook={theoDoi} />}
        {page === "loivipham" && <LoiViPham hook={loiViPham} />}
      </main>
    </div>
  );
}
