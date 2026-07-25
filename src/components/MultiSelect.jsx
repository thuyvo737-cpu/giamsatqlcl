import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Component chọn nhiều giá trị dùng chung cho khoa / tháng / năm.
 * `options`: mảng string hoặc mảng {value, label}.
 * `value`: mảng rỗng = "Tất cả" (không lọc).
 * Có nút "Chọn tất cả" ở đầu panel để tick/bỏ tick toàn bộ tường minh.
 */
export function MultiSelect({ options, value, onChange, placeholder = "Chọn...", searchable = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const normOptions = useMemo(
    () => (options || []).map((o) => (typeof o === "object" ? o : { value: o, label: String(o) })),
    [options]
  );

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = searchable
    ? normOptions.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : normOptions;

  const allSelected = value.length > 0 && value.length === normOptions.length;

  function toggle(v) {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  }

  function toggleAll() {
    onChange(allSelected ? [] : normOptions.map((o) => o.value));
  }

  const labelOf = (v) => normOptions.find((o) => o.value === v)?.label ?? v;

  return (
    <div className="multiselect" ref={ref}>
      <div className="multiselect-trigger" onClick={() => setOpen((o) => !o)}>
        {value.length === 0 && <span className="multiselect-placeholder">{placeholder} · Tất cả</span>}
        {value.length > 0 && value.length <= 3 &&
          value.map((v) => (
            <span className="multiselect-chip" key={v}>
              {labelOf(v)}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(v);
                }}
                aria-label={`Bỏ chọn ${labelOf(v)}`}
              >
                ×
              </button>
            </span>
          ))}
        {value.length > 3 && <span className="multiselect-chip">{value.length} đã chọn</span>}
      </div>
      {open && (
        <div className="multiselect-panel">
          {searchable && (
            <input
              className="multiselect-search"
              placeholder="Tìm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}
          <label className="multiselect-option multiselect-option-all">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} />
            Chọn tất cả
          </label>
          {filtered.map((o) => (
            <label className="multiselect-option" key={o.value}>
              <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, color: "var(--ink-400)" }}>Không tìm thấy.</div>
          )}
        </div>
      )}
    </div>
  );
}
