"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { crmFetch } from "@/lib/crmClient";
import {
  fetchCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar/calendarClient";
import {
  startOfWeek,
  startOfMonth,
  startOfDay,
  addDays,
  addMonths,
  fromDateTimeInputs,
  toDateInputValue,
} from "@/lib/calendar/calendarDates";
import CalendarToolbar from "./CalendarToolbar";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import AgendaView from "./AgendaView";
import EventEditorModal from "./EventEditorModal";
import ViewingDetailModal from "./ViewingDetailModal";
import AvailabilityPanel from "./AvailabilityPanel";
import ConnectCalendarPanel from "./ConnectCalendarPanel";

const VIEWING_DURATION_MS = 60 * 60 * 1000;
const VALID_VIEWS = ["month", "week", "agenda"];

// Fetch window for the active view. Month/agenda use the visible 6-week grid;
// week uses its 7 days. Buffered so events touching the edges still appear.
function getRange(view, viewDate) {
  if (view === "week") {
    const from = startOfWeek(viewDate);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfWeek(startOfMonth(viewDate));
  return { from, to: addDays(from, 42) };
}

// Turn a viewing appointment into the calendar's normalized event shape.
function normalizeViewing(appt) {
  const start = new Date(appt.scheduledAt);
  return {
    id: appt.id,
    kind: "viewing",
    title: appt.propertyTitle || "Property viewing",
    description: appt.notes || "",
    location: "",
    startsAt: appt.scheduledAt,
    endsAt: new Date(start.getTime() + VIEWING_DURATION_MS).toISOString(),
    allDay: false,
    status: appt.status,
    color: "blue",
    isHost: appt.isHost,
    contactName: appt.contactName,
  };
}

export default function CalendarShell() {
  const { addToast, currentUser } = useDashboard();
  const userId = currentUser?.id;

  // Deterministic first render (month / today) so SSR and hydration agree; the
  // URL is read once after mount below, avoiding a hydration mismatch and the
  // useSearchParams Suspense-boundary requirement.
  const [view, setView] = useState("month");
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlView = params.get("view");
    if (VALID_VIEWS.includes(urlView)) setView(urlView);
    const dateStr = params.get("date");
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) setViewDate(fromDateTimeInputs(dateStr));
  }, []);

  const [events, setEvents] = useState([]); // free-form calendar_events
  const [viewings, setViewings] = useState([]); // read-only appointments
  const [loading, setLoading] = useState(true);

  const [editorSeed, setEditorSeed] = useState(null); // null=closed
  const [detailViewing, setDetailViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState(null);

  // Keep the URL shareable (view + date) via replaceState — no re-render churn.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("view", view);
    params.set("date", toDateInputValue(viewDate));
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  }, [view, viewDate]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getRange(view, viewDate);

    const [eventsRes, viewingsRes] = await Promise.allSettled([
      fetchCalendarEvents({ from: from.toISOString(), to: to.toISOString(), userId }),
      crmFetch("/api/viewing-appointments", { mockUserId: userId }),
    ]);

    setEvents(eventsRes.status === "fulfilled" ? eventsRes.value : []);
    const appts =
      viewingsRes.status === "fulfilled" && Array.isArray(viewingsRes.value.appointments)
        ? viewingsRes.value.appointments
        : [];
    setViewings(appts.map(normalizeViewing));
    setLoading(false);
  }, [view, viewDate, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge + clamp to the active window so agenda/week don't show stray items.
  const visibleEvents = useMemo(() => {
    const { from, to } = getRange(view, viewDate);
    const fromMs = from.getTime();
    const toMs = to.getTime();
    return [...events, ...viewings].filter((e) => {
      const s = new Date(e.startsAt).getTime();
      const en = new Date(e.endsAt || e.startsAt).getTime();
      return s < toMs && en >= fromMs;
    });
  }, [events, viewings, view, viewDate]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const step = view === "week" ? (n) => addDays(viewDate, n * 7) : (n) => addMonths(viewDate, n);
  const goPrev = () => setViewDate(step(-1));
  const goNext = () => setViewDate(step(1));
  const goToday = () => setViewDate(new Date());

  // ── Event selection ──────────────────────────────────────────────────────
  const handleSelectEvent = (ev) => {
    if (ev.kind === "viewing") setDetailViewing(ev);
    else setEditorSeed(ev);
  };

  // Clicking an empty day (month) seeds a 9am–10am event on that day.
  const handleSelectDay = (day) => {
    const start = fromDateTimeInputs(toDateInputValue(day), "09:00");
    setEditorSeed({ startsAt: start.toISOString(), endsAt: new Date(start.getTime() + VIEWING_DURATION_MS).toISOString() });
  };

  // Clicking a week time-slot seeds a 1h event at that hour.
  const handleSelectSlot = (slotDate) => {
    setEditorSeed({
      startsAt: slotDate.toISOString(),
      endsAt: new Date(slotDate.getTime() + VIEWING_DURATION_MS).toISOString(),
    });
  };

  const handleNewEvent = () => {
    const base = startOfDay(viewDate).getTime() === startOfDay(new Date()).getTime() ? new Date() : viewDate;
    const start = fromDateTimeInputs(toDateInputValue(base), "09:00");
    setEditorSeed({ startsAt: start.toISOString(), endsAt: new Date(start.getTime() + VIEWING_DURATION_MS).toISOString() });
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editorSeed?.id) {
        const updated = await updateCalendarEvent(editorSeed.id, payload, userId);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast?.("Event updated", "✅");
      } else {
        const created = await createCalendarEvent(payload, userId);
        setEvents((prev) => [...prev, created]);
        addToast?.("Event created", "✅");
      }
      setEditorSeed(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await deleteCalendarEvent(id, userId);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast?.("Event deleted", "🗑");
      setEditorSeed(null);
    } catch {
      addToast?.("Couldn't delete the event.", "❌");
    } finally {
      setSaving(false);
    }
  };

  const handleRespondViewing = async (id, status) => {
    setRespondingId(id);
    try {
      await crmFetch(`/api/viewing-appointments/${id}`, { method: "PATCH", body: { status }, mockUserId: userId });
      setViewings((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
      setDetailViewing((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      addToast?.(status === "confirmed" ? "Viewing confirmed" : "Viewing declined", status === "confirmed" ? "✅" : "🚫");
    } catch {
      addToast?.("Couldn't update the viewing.", "❌");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CalendarToolbar
        view={view}
        onViewChange={setView}
        viewDate={viewDate}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onNewEvent={handleNewEvent}
      />

      {/* Calendar surface */}
      <div className="flex-1 min-h-0 bg-[#121212] border border-surface-variant rounded-lg overflow-hidden relative">
        {loading && (
          <div className="absolute top-2 right-3 text-[10px] uppercase tracking-wider font-mono text-text-muted animate-pulse z-30">
            Loading…
          </div>
        )}
        {view === "month" && (
          <MonthView
            viewDate={viewDate}
            events={visibleEvents}
            onSelectEvent={handleSelectEvent}
            onSelectDay={handleSelectDay}
          />
        )}
        {view === "week" && (
          <WeekView
            viewDate={viewDate}
            events={visibleEvents}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
          />
        )}
        {view === "agenda" && (
          <AgendaView
            events={visibleEvents}
            onSelectEvent={handleSelectEvent}
            onRespondViewing={handleRespondViewing}
            respondingId={respondingId}
          />
        )}
      </div>

      {/* Connected calendars (self-hides until Google OAuth is configured) */}
      <div className="mt-6">
        <ConnectCalendarPanel userId={userId} addToast={addToast} />
      </div>

      {/* Availability editor kept below the calendar (preserved feature) */}
      <div className="mt-6">
        <AvailabilityPanel userId={userId} addToast={addToast} />
      </div>

      <EventEditorModal
        seed={editorSeed}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setEditorSeed(null)}
        saving={saving}
      />
      <ViewingDetailModal
        viewing={detailViewing}
        onRespond={handleRespondViewing}
        respondingId={respondingId}
        onClose={() => setDetailViewing(null)}
      />
    </div>
  );
}
