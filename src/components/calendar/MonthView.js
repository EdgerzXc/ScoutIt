"use client";

import {
  getMonthGrid,
  WEEKDAY_LABELS,
  isSameDay,
  isSameMonth,
  isToday,
} from "@/lib/calendar/calendarDates";
import EventChip from "./EventChip";

const MAX_CHIPS_PER_DAY = 3;

// Events overlapping a given day (start ≤ end-of-day AND end ≥ start-of-day).
function eventsOnDay(events, day) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);
  return events
    .filter((e) => {
      const s = new Date(e.startsAt).getTime();
      const en = new Date(e.endsAt || e.startsAt).getTime();
      return s <= dayEnd.getTime() && en >= dayStart.getTime();
    })
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

/**
 * @param {{
 *   viewDate: Date,
 *   events: object[],
 *   onSelectEvent: (event)=>void,
 *   onSelectDay: (Date)=>void,   // click empty space in a cell → create
 * }} props
 */
export default function MonthView({ viewDate, events, onSelectEvent, onSelectDay }) {
  const grid = getMonthGrid(viewDate);

  return (
    <div className="flex flex-col h-full">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-surface-variant">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-[11px] uppercase tracking-wider font-mono text-text-muted text-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 6-row grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {grid.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const inMonth = isSameMonth(day, viewDate);
          const today = isToday(day);
          const shown = dayEvents.slice(0, MAX_CHIPS_PER_DAY);
          const overflow = dayEvents.length - shown.length;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`relative text-left border-b border-r border-surface-variant/60 p-1 overflow-hidden
                flex flex-col gap-0.5 min-h-[72px] transition-colors hover:bg-surface-variant/20
                ${inMonth ? "bg-transparent" : "bg-background/40"}`}
            >
              <span
                className={`self-end text-xs font-mono w-6 h-6 flex items-center justify-center rounded-full
                  ${today ? "bg-gold-accent text-background font-bold" : inMonth ? "text-text-secondary" : "text-text-muted/50"}`}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-0.5 min-h-0">
                {shown.map((ev) => (
                  <EventChip key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] font-mono text-text-muted pl-1">+{overflow} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
