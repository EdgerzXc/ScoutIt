"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Edit2,
  Plus,
  ListChecks,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { crmFetch } from "@/lib/crmClient";
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar/calendarClient";
import { formatTime, toDateInputValue, fromDateTimeInputs } from "@/lib/calendar/calendarDates";
import ConnectCalendarPanel from "@/components/calendar/ConnectCalendarPanel";
import AvailabilityPanel from "@/components/calendar/AvailabilityPanel";
import EventEditorModal from "@/components/calendar/EventEditorModal";

const HOUR_MS = 60 * 60 * 1000;

// Merge the three time-based sources into one comparable shape. `when` is the
// Date the item sits at on the schedule; `kind` drives its styling + actions.
function buildScheduleItems({ appointments, events, tasks }) {
  const items = [];

  for (const a of appointments) {
    items.push({
      key: `appt-${a.id}`,
      kind: "viewing",
      when: new Date(a.scheduledAt),
      title: a.propertyTitle || "Property viewing",
      subtitle: a.contactName ? `With ${a.contactName}` : null,
      status: a.status,
      raw: a,
    });
  }

  for (const e of events) {
    items.push({
      key: `event-${e.id}`,
      kind: "event",
      when: new Date(e.startsAt),
      endsAt: e.endsAt ? new Date(e.endsAt) : null,
      title: e.title,
      subtitle: e.location || null,
      allDay: e.allDay,
      fromGoogle: e.source === "google",
      raw: e,
    });
  }

  // Only tasks that carry a due time land on the schedule (that's their
  // "time limit"). Untimed / completed tasks stay in the Tasks tab.
  for (const t of tasks) {
    if (!t.dueAt || t.completedAt) continue;
    items.push({
      key: `task-${t.id}`,
      kind: "task",
      when: new Date(t.dueAt),
      title: t.title,
      subtitle: t.dealTitle || null,
      raw: t,
    });
  }

  return items.sort((a, b) => a.when - b.when);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function groupByBucket(items) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart.getTime() + DAY_MS);
  const weekEnd = new Date(todayStart.getTime() + 7 * DAY_MS);

  const groups = { Today: [], "This Week": [], Later: [], Past: [] };
  for (const it of items) {
    if (it.when < todayStart) groups.Past.push(it);
    else if (it.when < tomorrowStart) groups.Today.push(it);
    else if (it.when < weekEnd) groups["This Week"].push(it);
    else groups.Later.push(it);
  }
  return groups;
}

/**
 * The unified scheduling hub (CRM Appointments tab): real calendar connect,
 * inline availability, and one day-by-day schedule merging viewings, calendar
 * events, and tasks that have a due time.
 */
export default function AppointmentsSheet({ appointments = [], onStatusUpdate, userId, addToast }) {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [editorSeed, setEditorSeed] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const loadExtras = useCallback(async () => {
    const now = Date.now();
    const from = new Date(now - 14 * DAY_MS).toISOString();
    const to = new Date(now + 60 * DAY_MS).toISOString();
    const [evRes, tkRes] = await Promise.allSettled([
      crmFetch(`/api/calendar/events?from=${from}&to=${to}`, { mockUserId: userId }),
      crmFetch("/api/crm/tasks", { mockUserId: userId }),
    ]);
    setEvents(evRes.status === "fulfilled" && Array.isArray(evRes.value.events) ? evRes.value.events : []);
    setTasks(tkRes.status === "fulfilled" && Array.isArray(tkRes.value.tasks) ? tkRes.value.tasks : []);
  }, [userId]);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  // "Sync now" in the connect panel dispatches this — refetch Google events.
  useEffect(() => {
    const onRefresh = () => loadExtras();
    window.addEventListener("calendar:refresh", onRefresh);
    return () => window.removeEventListener("calendar:refresh", onRefresh);
  }, [loadExtras]);

  const handleViewingUpdate = async (id, status) => {
    setUpdatingId(id);
    if (onStatusUpdate) await onStatusUpdate(id, status);
    setUpdatingId(null);
  };

  const handleSaveEvent = async (payload) => {
    setSavingEvent(true);
    try {
      if (editorSeed?.id) {
        const updated = await updateCalendarEvent(editorSeed.id, payload, userId);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        addToast?.("Event updated", "✅");
      } else {
        const created = await createCalendarEvent(payload, userId);
        setEvents((prev) => [...prev, created]);
        addToast?.("Added to schedule", "✅");
      }
      setEditorSeed(null);
    } catch (e) {
      addToast?.(e.message || "Couldn't save the event.", "❌");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    setSavingEvent(true);
    try {
      await deleteCalendarEvent(id, userId);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast?.("Event removed", "🗑");
      setEditorSeed(null);
    } catch {
      addToast?.("Couldn't remove the event.", "❌");
    } finally {
      setSavingEvent(false);
    }
  };

  const openNewEvent = () => {
    const start = fromDateTimeInputs(toDateInputValue(new Date()), "09:00");
    setEditorSeed({
      startsAt: start.toISOString(),
      endsAt: new Date(start.getTime() + HOUR_MS).toISOString(),
    });
  };

  const items = buildScheduleItems({ appointments, events, tasks });
  const groups = groupByBucket(items);
  const hasAny = items.length > 0;

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-10 custom-scrollbar pr-2">
      {/* Real calendar connect (replaces the old mock card) */}
      <ConnectCalendarPanel userId={userId} addToast={addToast} />

      {/* Availability — folded into this tab, collapsed by default */}
      <div>
        <button
          type="button"
          onClick={() => setShowAvailability((v) => !v)}
          className="w-full flex items-center justify-between bg-[#121212] border border-surface-variant rounded-lg px-4 py-3 hover:border-gold-accent/40 transition-colors"
        >
          <span className="flex items-center gap-2 font-working-title text-on-surface">
            <Clock size={16} className="text-gold-accent" /> Weekly Availability
          </span>
          <ChevronDown size={16} className={`text-text-muted transition-transform ${showAvailability ? "rotate-180" : ""}`} />
        </button>
        {showAvailability && (
          <div className="mt-3">
            <AvailabilityPanel userId={userId} addToast={addToast} />
          </div>
        )}
      </div>

      {/* Schedule header + add */}
      <div className="flex items-center justify-between">
        <h3 className="font-working-title text-lg text-on-surface">Schedule</h3>
        <button
          type="button"
          onClick={openNewEvent}
          className="flex items-center gap-2 px-3 py-1.5 bg-gold-accent/10 hover:bg-gold-accent/20 text-gold-accent border border-gold-accent/30 rounded text-xs uppercase tracking-wider font-bold transition-colors"
        >
          <Plus size={14} /> Add to schedule
        </button>
      </div>

      {!hasAny && (
        <div className="flex flex-col items-center justify-center h-40 text-text-muted">
          <Calendar size={40} className="mb-3 opacity-20" />
          <p className="font-working-title">Nothing scheduled yet.</p>
          <p className="text-xs mt-1">Viewings, events, and tasks with a due time appear here.</p>
        </div>
      )}

      {["Today", "This Week", "Later", "Past"].map((label) => {
        const bucket = groups[label];
        if (!bucket || bucket.length === 0) return null;
        return (
          <div key={label}>
            <div className="flex items-center gap-4 mb-3">
              <h4 className="font-label-caps text-xs tracking-widest uppercase text-text-secondary">{label}</h4>
              <div className="flex-1 h-px bg-surface-variant" />
            </div>
            <div className="flex flex-col gap-2">
              {bucket.map((it) => (
                <ScheduleRow
                  key={it.key}
                  item={it}
                  updatingId={updatingId}
                  onViewingUpdate={handleViewingUpdate}
                  onEditEvent={(ev) => setEditorSeed(ev)}
                />
              ))}
            </div>
          </div>
        );
      })}

      <EventEditorModal
        seed={editorSeed}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onClose={() => setEditorSeed(null)}
        saving={savingEvent}
      />
    </div>
  );
}

// A single schedule row — viewing / event / task, each with its own affordances.
function ScheduleRow({ item, updatingId, onViewingUpdate, onEditEvent }) {
  const now = new Date();
  const timeLabel = item.allDay ? "All day" : formatTime(item.when);
  const dateLabel = item.when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  // Left accent + icon per kind.
  const meta = {
    viewing: { dot: "bg-sky-400", icon: <MapPin size={13} className="text-sky-300" />, tag: "Viewing" },
    event: { dot: item.fromGoogle ? "bg-emerald-400" : "bg-gold-accent", icon: <Calendar size={13} className="text-text-muted" />, tag: item.fromGoogle ? "Google" : "Event" },
    task: { dot: "bg-purple-400", icon: <ListChecks size={13} className="text-purple-300" />, tag: "Task" },
  }[item.kind];

  const overdue = item.kind === "task" && item.when < now;
  const canRespond = item.kind === "viewing" && item.status === "pending" && item.raw.isHost;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-surface-variant bg-surface-alt hover:border-gold-accent/30 transition-colors">
      <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest font-mono text-text-muted">{meta.tag}</span>
          <span className="font-working-title text-sm text-on-surface truncate">{item.title}</span>
          {overdue && (
            <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-error">
              <AlertTriangle size={11} /> Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
          <span className="flex items-center gap-1">{meta.icon}{dateLabel}</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-text-muted" />{timeLabel}</span>
          {item.subtitle && <span className="truncate text-text-muted">{item.subtitle}</span>}
        </div>
      </div>

      {canRespond ? (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onViewingUpdate(item.raw.id, "cancelled")}
            disabled={updatingId === item.raw.id}
            className="px-2.5 py-1.5 rounded border border-error/30 text-error hover:bg-error/10 text-xs font-working-title flex items-center gap-1 disabled:opacity-50"
          >
            <XCircle size={13} /> Decline
          </button>
          <button
            onClick={() => onViewingUpdate(item.raw.id, "confirmed")}
            disabled={updatingId === item.raw.id}
            className="px-2.5 py-1.5 rounded border border-success/30 text-success hover:bg-success/10 text-xs font-working-title flex items-center gap-1 disabled:opacity-50"
          >
            <CheckCircle size={13} /> Confirm
          </button>
        </div>
      ) : item.kind === "event" ? (
        <button
          onClick={() => onEditEvent(item.raw)}
          className="px-2.5 py-1.5 rounded border border-white/10 text-white/70 hover:bg-white/5 text-xs font-working-title flex items-center gap-1 shrink-0"
        >
          <Edit2 size={12} /> Edit
        </button>
      ) : null}
    </div>
  );
}
