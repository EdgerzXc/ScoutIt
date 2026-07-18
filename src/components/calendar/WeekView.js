"use client";

import { useMemo } from "react";
import {
  getWeekDays,
  WEEKDAY_LABELS,
  isToday,
  isSameDay,
  formatTime,
  fromDateTimeInputs,
  toDateInputValue,
} from "@/lib/calendar/calendarDates";
import { eventStyle } from "./EventChip";

const HOUR_HEIGHT = 48; // px per hour
const DAY_START_HOUR = 6; // scroll the grid to a sensible starting hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Split a day's events into all-day (multi-day/all-day) vs timed.
function splitDayEvents(events, day) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const overlapping = events.filter((e) => {
    const s = new Date(e.startsAt).getTime();
    const en = new Date(e.endsAt || e.startsAt).getTime();
    return s <= dayEnd.getTime() && en >= dayStart.getTime();
  });

  const allDay = overlapping.filter(
    (e) => e.allDay || !isSameDay(e.startsAt, e.endsAt || e.startsAt)
  );
  const timed = overlapping.filter((e) => !allDay.includes(e));
  return { allDay, timed };
}

// Assign overlapping timed events to side-by-side lanes so they don't stack.
function assignLanes(events) {
  const sorted = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  const laneEnds = []; // end time (ms) of last event in each lane
  const placed = sorted.map((ev) => {
    const start = new Date(ev.startsAt).getTime();
    const end = new Date(ev.endsAt || ev.startsAt).getTime();
    let lane = laneEnds.findIndex((e) => e <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(end);
    } else {
      laneEnds[lane] = end;
    }
    return { ev, lane, start, end };
  });
  return { placed, laneCount: Math.max(laneEnds.length, 1) };
}

/**
 * @param {{ viewDate: Date, events: object[], onSelectEvent, onSelectSlot }} props
 * onSelectSlot receives a Date (local) for the clicked day+hour.
 */
export default function WeekView({ viewDate, events, onSelectEvent, onSelectSlot }) {
  const days = useMemo(() => getWeekDays(viewDate), [viewDate]);
  const now = new Date();

  return (
    <div className="flex flex-col h-full">
      {/* Day header row */}
      <div className="grid border-b border-surface-variant" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
        <div />
        {days.map((day) => (
          <div key={day.toISOString()} className="px-1 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wider font-mono text-text-muted">
              {WEEKDAY_LABELS[day.getDay()]}
            </div>
            <div
              className={`text-sm font-mono mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full
                ${isToday(day) ? "bg-gold-accent text-background font-bold" : "text-text-secondary"}`}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* All-day strip */}
      <div
        className="grid border-b border-surface-variant bg-background/40"
        style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}
      >
        <div className="text-[9px] uppercase font-mono text-text-muted flex items-center justify-end pr-1 py-1">
          all-day
        </div>
        {days.map((day) => {
          const { allDay } = splitDayEvents(events, day);
          return (
            <div key={day.toISOString()} className="p-0.5 space-y-0.5 min-h-[26px] border-l border-surface-variant/40">
              {allDay.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`w-full truncate text-left px-1 rounded border text-[10px] ${eventStyle(ev)}`}
                >
                  {ev.kind === "viewing" ? "👁 " : ""}
                  {ev.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        ref={(el) => {
          if (el && el.dataset.scrolled !== "1") {
            el.scrollTop = DAY_START_HOUR * HOUR_HEIGHT;
            el.dataset.scrolled = "1";
          }
        }}
      >
        <div className="grid relative" style={{ gridTemplateColumns: "3.5rem repeat(7, 1fr)" }}>
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="text-[10px] font-mono text-text-muted text-right pr-1 -translate-y-2"
              >
                {h === 0 ? "" : formatTime(new Date(2000, 0, 1, h))}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const { timed } = splitDayEvents(events, day);
            const { placed, laneCount } = assignLanes(timed);
            const showNow = isToday(day);
            const nowTop = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-surface-variant/40"
                style={{ height: HOUR_HEIGHT * 24 }}
              >
                {/* Hour lines / click targets */}
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => onSelectSlot(fromDateTimeInputs(toDateInputValue(day), `${String(h).padStart(2, "0")}:00`))}
                    style={{ height: HOUR_HEIGHT }}
                    className="block w-full border-b border-surface-variant/20 hover:bg-surface-variant/20"
                  />
                ))}

                {/* Now indicator */}
                {showNow && (
                  <div
                    className="absolute left-0 right-0 h-px bg-gold-bright z-20 pointer-events-none"
                    style={{ top: nowTop }}
                  >
                    <span className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-gold-bright" />
                  </div>
                )}

                {/* Timed events */}
                {placed.map(({ ev, lane, start, end }) => {
                  const dayMidnight = new Date(day);
                  dayMidnight.setHours(0, 0, 0, 0);
                  const minsFromMidnight = Math.max(0, (start - dayMidnight.getTime()) / 60000);
                  const durationMins = Math.max(30, (end - start) / 60000);
                  const width = 100 / laneCount;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className={`absolute rounded border px-1 py-0.5 text-[10px] leading-tight overflow-hidden
                        text-left z-10 ${eventStyle(ev)} ${ev.status === "cancelled" ? "line-through opacity-50" : ""}`}
                      style={{
                        top: (minsFromMidnight / 60) * HOUR_HEIGHT,
                        height: (durationMins / 60) * HOUR_HEIGHT - 2,
                        left: `${lane * width}%`,
                        width: `calc(${width}% - 2px)`,
                      }}
                    >
                      <span className="font-mono opacity-80">{formatTime(ev.startsAt)}</span>{" "}
                      <span className="font-medium">{ev.title}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
