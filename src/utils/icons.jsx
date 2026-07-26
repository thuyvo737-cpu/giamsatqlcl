// Icon SVG tối giản, không phụ thuộc thư viện ngoài (giữ bundle nhẹ).
const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconIdentify(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
    </svg>
  );
}
export function IconWristband(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="9" width="18" height="6" rx="3" />
      <path d="M8 9v6M16 9v6" />
    </svg>
  );
}
export function IconFall(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5" r="2.2" />
      <path d="M12 7.5v5l-4 3M12 12.5l4.5 1.5M8 15.5L6 20M13.5 20l2.5-4.5" />
    </svg>
  );
}
export function IconSurgery(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 4l6 6M12 10l6-6M9 13l-4 7 3 1 4-6" />
      <circle cx="17" cy="16" r="3" />
    </svg>
  );
}
export function Icon5S(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}
export function IconAlert(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l9.5 17H2.5L12 3z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconTrendUp(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
export function IconTrendDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </svg>
  );
}
export function IconTrendFlat(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16" />
    </svg>
  );
}
export function IconTarget(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconShield(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

export const CONTENT_ICONS = {
  nhanDang: IconIdentify,
  vongTay: IconWristband,
  teNga: IconFall,
  atpt: IconSurgery,
  s5: Icon5S,
};
