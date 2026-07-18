"use client";

import { useMemo } from "react";
import {
  formatDayHeading,
  formatShortRange,
  isToday,
} from "@/lib/calendar/calendarDates";
import { EVENT_COLOR_STYLES } from "./EventChip";

// A small solid dot carries the event's color without the thick side-border
// "AI card" tell. Viewings read as sky; free-form events use their token.
const DOT_COLOR = {
  gold: "bg-gold-accent",
  blue: "bg-sky-400",
  green: "bg-emerald-400",
  red: "bg-red-400",
  purple: "bg-purple-400",
};

function dotClass(ev) {
  if (ev.kind === "viewing") return "bg-sky-400";
  return DOT_COLOR[ev.color] || DOT_COLOR.gold;
}

// Group events by local day, sorted chronologically. Only future-or-ongoing +
// this window's events arrive here; we just bucket them.
function groupByDay(events) {
  const buckets = new Map();
  const sorted = [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  for (const ev of sorted) {
    const d = new Date(ev.startsAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!buckets.has(key)) buckets.set(key, { date: d, items: [] });
    buckets.get(key).items.push(ev);
  }
  return [...buckets.values()];
}

/**
 * @param {{
 *   events: object[],
 *   onSelectEvent: (event)=>void,
 *   onRespondViewing: (id, status)=>void,   // accept/decline host viewings
 *   respondingId: string|null,
 * }} props
 */
export default function AgendaView({ events, onSelectEvent, onRespondViewing, respondingId }) {
  const groups = useMemo(() => groupByDay(events), [events]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="text-4xl mb-3 opacity-40">🗓</div>
        <p className="text-text-secondary">Nothing scheduled in this range.</p>
        <p className="text-text-muted text-sm mt-1">Switch to Month or Week and tap a day to add an event.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full px-1 sm:px-2 py-2 space-y-6">
      {groups.map(({ date, items }) => (
        <section key={date.toISOString()}>
          <div className="flex items-baseline gap-2 mb-2 sticky top-0 bg-[#121212] py-1 z-10">
            <h3 className="font-working-title text-on-surface">{formatDayHeading(date)}</h3>
            {isToday(date) && (
              <span className="text-[10px] uppercase tracking-wider font-mono text-gold-accent">Today</span>
            )}
          </div>

          <div className="space-y-2">
            {items.map((ev) => {
              const canRespond = ev.kind === "viewing" && ev.status === "pending" && ev.isHost;
              return (
                <div
                  key={ev.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-surface-variant bg-background/60
                    hover:border-surface-variant/80 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass(ev)}`} />
                  <button
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      {ev.kind === "viewing" && <span>👁</span>}
                      <span className={`font-medium text-on-surface truncate ${ev.status === "cancelled" ? "line-through opacity-50" : ""}`}>
                        {ev.title}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {formatShortRange(ev.startsAt, ev.endsAt, ev.allDay)}
                      {ev.location ? ` • ${ev.location}` : ""}
                      {ev.kind === "viewing" && ev.contactName ? ` • ${ev.contactName}` : ""}
                    </div>
                  </button>

                  {canRespond ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRespondViewing(ev.id, "cancelled")}
                        disabled={respondingId === ev.id}
                        className="text-xs text-error border border-error/30 px-2.5 py-1.5 rounded hover:bg-error/10
                          uppercase tracking-wider font-mono disabled:opacity-50"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => onRespondViewing(ev.id, "confirmed")}
                        disabled={respondingId === ev.id}
                        className="text-xs text-background bg-gold-accent px-2.5 py-1.5 rounded hover:bg-gold-bright
                          uppercase tracking-wider font-mono disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  ) : (
                    ev.kind === "viewing" && (
                      <span className="text-[10px] uppercase tracking-wider font-mono text-text-muted shrink-0">
                        {ev.status === "pending" ? "Awaiting host" : ev.status}
                      </span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
