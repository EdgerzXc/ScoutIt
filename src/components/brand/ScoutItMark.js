import { MARK_PATH, MARK_VIEWBOX } from "@/components/brand/markPath";

/**
 * The ScoutIt SIT mark on its own, with no wordmark beside it.
 * Takes its colour from `currentColor`, so it follows the surface it sits on
 * (display gold on dark, the text-safe bronze on light).
 */
export default function ScoutItMark({ size = 32, className = "", title = "ScoutIt" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path fill="currentColor" fillRule="evenodd" d={MARK_PATH} />
    </svg>
  );
}
