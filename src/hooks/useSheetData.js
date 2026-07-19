import { useEffect, useRef, useState, useCallback } from "react";
import { fetchTabValues } from "../api/googleSheets.js";
import { POLLING_INTERVAL_MS } from "../config.js";

/**
 * Lấy dữ liệu 1 tab, tự động cập nhật lại theo chu kỳ POLLING_INTERVAL_MS.
 * parser: hàm nhận vào mảng lưới thô (rows x cols) và trả về dữ liệu
 * đã xử lý cho từng trang.
 */
export function useSheetData(tabName, parser) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const parserRef = useRef(parser);
  parserRef.current = parser;

  const load = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const raw = await fetchTabValues(tabName);
        const parsed = parserRef.current ? parserRef.current(raw) : raw;
        setData(parsed);
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [tabName]
  );

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { data, error, loading, lastUpdated, reload: () => load(false) };
}
