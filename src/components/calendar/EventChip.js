"use client";

import { formatTime } from "@/lib/calendar/calendarDates";

// Event accent styles. Gold is the house default (design DNA); the others are
// desaturated jewel tones so a multi-color calendar still reads dark-luxury,
// not primary-color confetti. Keyed by the `color` token stored on the event.
export const EVENT_COLOR_STYLES = {
  gold: "border-gold-accent/50 bg-gold-accent/10 text-gold-accent",
  blue: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  green: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  red: "border-red-500/40 bg-red-500/10 text-red-300",
  purple: "border-purple-500/40 bg-purple-500/10 text-purple-300",
};

// Viewing appointments get their own read-only treatment + a badge so they're
// visually distinct from free-form events (they're managed via accept/decline).
const VIEWING_STYLE = "border-sky-400/40 bg-sky-400/10 text-sky-200";

export function eventStyle(event) {
  if (event.kind === "viewing") return VIEWING_STYLE;
  return EVENT_COLOR_STYLES[event.color] || EVENT_COLOR_STYLES.gold;
}

/**
 * Compact event block used inside month cells and week columns.
 * @param {{ event: object, onClick?: (e:MouseEvent)=>void, showTime?: boolean }} props
 */
export default function EventChip({ event, onClick, showTime = true }) {
  const cancelled = event.status === "cancelled";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      title={event.title}
      className={`w-full text-left px-1.5 py-0.5 rounded border text-[11px] leading-tight truncate
        transition-colors hover:brightness-125 focus:outline-none focus:ring-1 focus:ring-gold-accent
        ${eventStyle(event)} ${cancelled ? "line-through opacity-50" : ""}`}
    >
      {event.kind === "viewing" && <span className="mr-1">👁</span>}
      {showTime && !event.allDay && (
        <span className="font-mono tabular-nums opacity-80 mr-1">{formatTime(event.startsAt)}</span>
      )}
      <span className="font-medium">{event.title}</span>
    </button>
  );
}
