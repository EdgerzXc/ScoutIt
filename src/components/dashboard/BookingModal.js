"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { crmFetch } from "../../lib/crmClient";

// Request a live viewing.
//
// The time list is REAL. It used to be four hardcoded strings under a
// `// Mock available times for the demo` comment, combined with the chosen date
// via `new Date("2026-09-01 2:00 PM")` — a non-standard format parsed in the
// browser's timezone, so a buyer abroad booked a different instant than the
// label they clicked, on a day the host may never have been available.
//
// Now: GET /api/deals/[id]/slots returns exact UTC instants computed from the
// host's schedule, and this component only ever sends one of them back. The
// server re-derives the same list before writing, so the two cannot drift.

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS = 14;

function toDateKey(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function BookingModal({
  isOpen,
  onClose,
  brokerName,
  dealId,
  onSchedule,
  mode = "create",
  appointmentId = null,
  durationMinutes = null,
}) {
  const { addToast } = useDashboard();
  const [slots, setSlots] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(null);
  const [hostTimezone, setHostTimezone] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const viewerTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const isReschedule = mode === "reschedule";

  const loadSlots = useCallback(async () => {
    if (!dealId) return;
    setSlots(null);
    setLoadError(null);
    try {
      const from = toDateKey(new Date());
      const to = toDateKey(new Date(Date.now() + RANGE_DAYS * DAY_MS));
      const data = await crmFetch(`/api/deals/${dealId}/slots?from=${from}&to=${to}`);
      setSlots(data.slots || []);
      setHostTimezone(data.timezone || null);
    } catch (err) {
      console.error("Failed to load viewing times", err);
      setSlots([]);
      setLoadError("Couldn't load available times. Please try again.");
    }
  }, [dealId]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate("");
    setSelectedSlot(null);
    loadSlots();
  }, [isOpen, loadSlots]);

  // Group the flat slot list into the days the VIEWER sees them on. A host in
  // another zone can legitimately offer times that land on a different local
  // date for the buyer, and the buyer should pick from their own calendar.
  const slotsByDay = useMemo(() => {
    const grouped = new Map();
    for (const slot of slots || []) {
      const key = toDateKey(new Date(slot.startsAt));
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(slot);
    }
    return grouped;
  }, [slots]);

  const availableDays = useMemo(() => [...slotsByDay.keys()].sort(), [slotsByDay]);
  const daySlots = selectedDate ? slotsByDay.get(selectedDate) || [] : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      // The exact instant the server offered — no local re-parsing of a label.
      const data = await crmFetch(
        isReschedule
          ? `/api/viewing-appointments/${appointmentId}`
          : "/api/viewing-appointments",
        {
        method: isReschedule ? "PATCH" : "POST",
        body: {
          ...(!isReschedule ? { dealId } : {}),
          scheduledAt: selectedSlot.startsAt,
          timezone: viewerTimezone,
          ...(durationMinutes ? { durationMinutes } : {}),
        },
      });
      onSchedule?.(data.appointment);
    } catch (err) {
      console.error(err);
      // A 409 means the slot went while the modal was open. Reloading is more
      // useful than a dead-end error, so the buyer can pick again immediately.
      addToast?.(
        err?.message || "Couldn't book that time. It may have just been taken.",
        "❌",
      );
      loadSlots();
      setSelectedSlot(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-background/85 p-0 backdrop-blur-md sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-labelledby="viewing-picker-title" className="relative w-full max-w-md rounded-t-2xl border border-gold-accent/20 bg-surface/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.58),0_0_42px_rgba(var(--accent-rgb),0.08)] backdrop-blur-xl sm:rounded-xl sm:p-6">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-transparent font-mono text-text-muted transition-all duration-300 ease-out hover:border-surface-variant hover:bg-surface-variant/50 hover:text-on-surface">
          ✕
        </button>

        <div className="mb-6">
          <span className="rounded border border-gold-accent/25 bg-gold-accent/10 px-2 py-1 font-mono text-[12px] font-bold uppercase tracking-widest text-gold-accent">Live availability</span>
          <h2 id="viewing-picker-title" className="font-headline-editorial text-2xl text-on-surface mt-3">
            {isReschedule ? "Move the viewing" : `Schedule with ${brokerName}`}
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Every option below comes from the host&apos;s current ScoutIt availability.
            Times are shown in your timezone
            {hostTimezone && hostTimezone !== viewerTimezone ? `; the host uses ${hostTimezone}` : ""}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {slots === null && (
            <p className="text-sm text-text-muted animate-pulse py-6 text-center">
              Checking availability…
            </p>
          )}

          {loadError && (
            <p className="text-sm text-text-secondary py-4 text-center">{loadError}</p>
          )}

          {slots !== null && !loadError && availableDays.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm text-on-surface font-working-title">No open times right now.</p>
              <p className="text-xs text-text-secondary mt-1">
                {brokerName} has nothing free in the next {RANGE_DAYS} days. Send a message
                and ask for a time that works.
              </p>
            </div>
          )}

          {availableDays.length > 0 && (
            <div>
              <label htmlFor="viewing-date" className="block text-[12px] text-text-secondary mb-2 font-mono font-bold uppercase tracking-widest">
                01 · Select date
              </label>
              <select
                id="viewing-date"
                required
                className="min-h-11 w-full rounded border border-surface-variant bg-background px-4 py-2 text-sm text-on-surface transition-colors duration-300 ease-out focus:border-gold-accent focus:outline-none"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
              >
                <option value="">Choose a day…</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    {new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
                      weekday: "long", month: "long", day: "numeric",
                    })}
                    {` — ${slotsByDay.get(day).length} time${slotsByDay.get(day).length === 1 ? "" : "s"}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {daySlots.length > 0 && (
            <div>
              <span className="block text-[12px] text-text-secondary mb-2 font-mono font-bold uppercase tracking-widest">02 · Select time</span>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {daySlots.map((slot) => {
                  const isSelected = selectedSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSlot(slot)}
                      className={`min-h-11 rounded border py-2 font-data-tabular text-sm transition-all duration-300 ease-out ${
                        isSelected
                          ? "bg-gold-accent text-background border-gold-accent font-medium"
                          : "bg-background border-surface-variant text-text-secondary hover:border-gold-accent/50"
                      }`}
                    >
                      {new Date(slot.startsAt).toLocaleTimeString(undefined, {
                        hour: "numeric", minute: "2-digit",
                      })}
                    </button>
                  );
                })}
              </div>
              {selectedSlot && (
                <p className="text-xs text-text-muted mt-2 font-data-tabular">
                  Ends {new Date(selectedSlot.endsAt).toLocaleTimeString(undefined, {
                    hour: "numeric", minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-surface-variant">
            <button
              type="submit"
              disabled={!selectedSlot || isSubmitting}
              className="min-h-11 w-full rounded bg-gold-accent py-3 font-mono text-[12px] font-bold uppercase tracking-widest text-background transition-all duration-300 ease-out hover:bg-gold-bright disabled:opacity-50"
            >
              {isSubmitting
                ? (isReschedule ? "Moving viewing…" : "Requesting…")
                : (isReschedule ? "Propose this time" : "Request live viewing")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
