import { useEffect, useRef, useState } from "react";

export function MultiSelectKhoa({ options, value, onChange, placeholder = "Chọn khoa..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  function toggle(khoa) {
    if (value.includes(khoa)) onChange(value.filter((k) => k !== khoa));
    else onChange([...value, khoa]);
  }

  return (
    <div className="multiselect" ref={ref}>
      <div className="multiselect-trigger" onClick={() => setOpen((o) => !o)}>
        {value.length === 0 && <span style={{ color: "var(--ink-400)" }}>{placeholder}</span>}
        {value.map((k) => (
          <span className="multiselect-chip" key={k}>
            {k}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle(k);
              }}
              aria-label={`Bỏ chọn ${k}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {open && (
        <div className="multiselect-panel">
          <input
            className="multiselect-search"
            placeholder="Tìm khoa..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {filtered.map((k) => (
            <label className="multiselect-option" key={k}>
              <input type="checkbox" checked={value.includes(k)} onChange={() => toggle(k)} />
              {k}
            </label>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, color: "var(--ink-400)" }}>Không tìm thấy khoa.</div>
          )}
        </div>
      )}
    </div>
  );
}
