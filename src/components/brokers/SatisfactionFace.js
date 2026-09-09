const FACE_PATHS = {
  angry: "M7 15c2-2 8-2 10 0 M7 8l3 1 M17 8l-3 1",
  sad: "M8 15c2-2 6-2 8 0 M8 9h2 M14 9h2",
  smile: "M8 14c2 2 6 2 8 0 M8 9h2 M14 9h2",
  happy: "M7 13c2 4 8 4 10 0 M7 9l2-1 2 1 M13 9l2-1 2 1",
};

// `className` exists because this face is used on two surfaces with two
// stylesheets. The dossier styles it through broker-detail.css; the dashboard
// invitation panel does not load that file and sizes it with utilities
// instead. One face component, so the four levels can never diverge visually
// between where feedback is given and where it is read.
export default function SatisfactionFace({ level, label, className = "" }) {
  return (
    <svg
      className={`satisfaction-face satisfaction-face-${level} ${className}`.trim()}
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d={FACE_PATHS[level]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
