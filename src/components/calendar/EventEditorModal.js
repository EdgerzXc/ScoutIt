"use client";

import { useEffect, useState } from "react";
import {
  toDateInputValue,
  toTimeInputValue,
  fromDateTimeInputs,
  addDays,
} from "@/lib/calendar/calendarDates";
import { EVENT_COLOR_STYLES } from "./EventChip";

const COLOR_KEYS = Object.keys(EVENT_COLOR_STYLES);

// Build the editable form state from either an existing event or a seed
// ({ startsAt }) for a fresh create on a clicked day/slot.
function toFormState(seed) {
  const start = seed?.startsAt ? new Date(seed.startsAt) : new Date();
  const end = seed?.endsAt ? new Date(seed.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);
  return {
    title: seed?.title || "",
    description: seed?.description || "",
    location: seed?.location || "",
    date: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
    allDay: seed?.allDay || false,
    color: seed?.color || "gold",
  };
}

/**
 * Create/edit/delete modal for a free-form calendar event.
 * @param {{
 *   seed: object|null,          // null = closed; {id?, startsAt,...} = open
 *   onSave: (payload)=>Promise, // payload is API shape (camelCase)
 *   onDelete?: (id)=>Promise,
 *   onClose: ()=>void,
 *   saving?: boolean,
 * }} props
 */
export default function EventEditorModal({ seed, onSave, onDelete, onClose, saving }) {
  const [form, setForm] = useState(() => toFormState(seed));
  const [error, setError] = useState("");
  const isEdit = Boolean(seed?.id);

  // Re-seed whenever a different event/slot opens the modal.
  useEffect(() => {
    if (seed) {
      setForm(toFormState(seed));
      setError("");
    }
  }, [seed]);

  // Close on Escape.
  useEffect(() => {
    if (!seed) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seed, onClose]);

  if (!seed) return null;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Give the event a title.");
      return;
    }

    let startsAt;
    let endsAt;
    if (form.allDay) {
      // All-day: span local midnight → next midnight so it lands on the right day.
      const start = fromDateTimeInputs(form.date, "00:00");
      startsAt = start;
      endsAt = addDays(start, 1);
    } else {
      startsAt = fromDateTimeInputs(form.date, form.startTime);
      endsAt = fromDateTimeInputs(form.date, form.endTime);
      if (endsAt.getTime() < startsAt.getTime()) {
        setError("End time can't be before the start time.");
        return;
      }
    }

    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        allDay: form.allDay,
        color: form.color,
      });
    } catch (err) {
      setError(err.message || "Couldn't save the event.");
    }
  };

  const inputCls =
    "w-full bg-background border border-surface-variant rounded px-3 py-2 text-sm text-on-surface " +
    "focus:outline-none focus:border-gold-accent";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#121212] border border-surface-variant rounded-t-2xl sm:rounded-lg
          shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant">
          <h2 className="font-working-title text-lg text-on-surface">
            {isEdit ? "Edit event" : "New event"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-on-surface text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Event title"
            className={inputCls}
          />

          <div className="flex items-center gap-2">
            <input
              id="allDay"
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => set({ allDay: e.target.checked })}
              className="accent-gold-accent w-4 h-4"
            />
            <label htmlFor="allDay" className="text-sm text-text-secondary">
              All day
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={form.allDay ? "sm:col-span-3" : ""}>
              <label className="block text-[11px] uppercase tracking-wider font-mono text-text-muted mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className={inputCls}
              />
            </div>
            {!form.allDay && (
              <>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-text-muted mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set({ startTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-text-muted mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set({ endTime: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </>
            )}
          </div>

          <input
            value={form.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder="Location (optional)"
            className={inputCls}
          />

          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Notes (optional)"
            rows={3}
            className={inputCls + " resize-none"}
          />

          <div>
            <label className="block text-[11px] uppercase tracking-wider font-mono text-text-muted mb-2">
              Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set({ color: c })}
                  aria-label={c}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${EVENT_COLOR_STYLES[c]}
                    ${form.color === c ? "scale-110 ring-2 ring-offset-2 ring-offset-[#121212] ring-gold-accent" : "opacity-70"}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-variant">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(seed.id)}
                disabled={saving}
                className="text-xs text-error border border-error/30 px-3 py-2 rounded hover:bg-error/10
                  uppercase tracking-wider font-mono disabled:opacity-50"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-text-secondary px-4 py-2 rounded hover:bg-surface-variant"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="text-sm text-background bg-gold-accent hover:bg-gold-bright px-5 py-2 rounded
                  font-working-title disabled:opacity-50"
              >
                {saving ? "Saving…" : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
