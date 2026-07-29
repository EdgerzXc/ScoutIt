"use client";

import { formatMonthYear } from "@/lib/calendar/calendarDates";

const VIEWS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "agenda", label: "Agenda" },
];

/**
 * @param {{
 *   view: string, onViewChange: (v)=>void,
 *   viewDate: Date, onPrev, onNext, onToday,
 *   onNewEvent: ()=>void,
 * }} props
 */
export default function CalendarToolbar({
  view,
  onViewChange,
  viewDate,
  onPrev,
  onNext,
  onToday,
  onNewEvent,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
      {/* Left: navigation + label */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous"
          className="w-8 h-8 flex items-center justify-center rounded border border-surface-variant text-text-secondary
            hover:text-on-surface hover:border-gold-accent/50 active:scale-[0.97] transition-all duration-160 ease-out"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next"
          className="w-8 h-8 flex items-center justify-center rounded border border-surface-variant text-text-secondary
            hover:text-on-surface hover:border-gold-accent/50 active:scale-[0.97] transition-all duration-160 ease-out"
        >
          ›
        </button>
        <button
          type="button"
          onClick={onToday}
          className="text-[11px] uppercase tracking-wider font-mono text-text-secondary border border-surface-variant
            px-3 h-8 rounded hover:text-on-surface hover:border-gold-accent/50 active:scale-[0.97] transition-all duration-160 ease-out"
        >
          Today
        </button>
        <h2 className="font-working-title text-lg sm:text-xl text-on-surface ml-1 font-medium">
          {formatMonthYear(viewDate)}
        </h2>
      </div>

      {/* Right: view switch + new event */}
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg border border-surface-variant overflow-hidden bg-surface/50 backdrop-blur-sm">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onViewChange(v.id)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-wider font-mono transition-all duration-160 ease-out active:scale-[0.97]
                ${view === v.id ? "bg-gold-accent text-background font-semibold" : "text-text-secondary hover:bg-surface-variant/40 hover:text-on-surface"}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNewEvent}
          className="text-sm text-background bg-gold-accent hover:bg-gold-bright active:scale-[0.97] px-3 sm:px-4 h-8 rounded
            font-working-title font-semibold whitespace-nowrap shadow-[0_0_12px_rgba(232,174,60,0.25)] transition-all duration-160 ease-out"
        >
          + New
        </button>
      </div>
    </div>
  );
}
