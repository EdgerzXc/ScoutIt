"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Trash2, Plus } from "lucide-react";
import { crmFetch } from "@/lib/crmClient";
import { AVAILABILITY_DEFAULTS } from "@/lib/calendar/slots";

// The host's booking policy: the hours buyers may request a live viewing in,
// the days they may not, and the rules around each booking.
//
// Two things this screen used to get wrong:
//
//  1. It POSTed only `weekly_schedule`. The API upserted
//     `date_overrides: date_overrides || {}`, so every save silently ERASED the
//     host's blocked dates and reset their timezone to Asia/Manila. It now
//     sends the whole config, and the API does a read-modify-write besides.
//  2. Nothing it saved had any effect on what buyers could book — the booking
//     picker used four hardcoded times. These hours are now the real source for
//     /api/deals/[id]/slots.

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DEFAULT_SCHEDULE = Object.fromEntries(
  DAY_ORDER.map((day) => [day, {
    active: !["saturday", "sunday"].includes(day),
    start: "09:00",
    end: "17:00",
  }]),
);

const DEFAULT_POLICY = {
  timezone: AVAILABILITY_DEFAULTS.timezone,
  default_duration_minutes: AVAILABILITY_DEFAULTS.defaultDurationMinutes,
  slot_interval_minutes: AVAILABILITY_DEFAULTS.slotIntervalMinutes,
  buffer_before_minutes: AVAILABILITY_DEFAULTS.bufferBeforeMinutes,
  buffer_after_minutes: AVAILABILITY_DEFAULTS.bufferAfterMinutes,
  minimum_notice_minutes: AVAILABILITY_DEFAULTS.minimumNoticeMinutes,
  max_bookings_per_day: AVAILABILITY_DEFAULTS.maxBookingsPerDay,
};

const DURATION_CHOICES = [30, 45, 60, 90, 120];
const INTERVAL_CHOICES = [15, 30, 60];
const NOTICE_CHOICES = [
  { value: 0, label: "No minimum" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "1 day" },
  { value: 2880, label: "2 days" },
];
const BUFFER_CHOICES = [0, 15, 30, 60];

const fieldClass =
  "bg-background border border-surface-variant rounded px-2 py-2 text-sm text-on-surface " +
  "focus:outline-none focus:border-gold-accent";

/**
 * Weekly availability editor.
 * @param {{ userId: string, addToast?: (msg, icon)=>void }} props
 */
export default function AvailabilityPanel({ userId, addToast }) {
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [overrides, setOverrides] = useState({});
  const [newOverrideDate, setNewOverrideDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Offer the browser's own zone alongside Manila, so a host working from
  // elsewhere is not forced to pretend they are in Manila.
  const browserTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const timezoneChoices = useMemo(() => {
    const set = new Set(["Asia/Manila", browserTimezone, policy.timezone].filter(Boolean));
    return [...set];
  }, [browserTimezone, policy.timezone]);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await crmFetch("/api/availability", { mockUserId: userId });
      const config = res?.config || {};
      if (config.weekly_schedule && Object.keys(config.weekly_schedule).length > 0) {
        setSchedule({ ...DEFAULT_SCHEDULE, ...config.weekly_schedule });
      }
      setOverrides(config.date_overrides || {});
      setPolicy({
        timezone: config.timezone || DEFAULT_POLICY.timezone,
        default_duration_minutes: config.default_duration_minutes ?? DEFAULT_POLICY.default_duration_minutes,
        slot_interval_minutes: config.slot_interval_minutes ?? DEFAULT_POLICY.slot_interval_minutes,
        buffer_before_minutes: config.buffer_before_minutes ?? DEFAULT_POLICY.buffer_before_minutes,
        buffer_after_minutes: config.buffer_after_minutes ?? DEFAULT_POLICY.buffer_after_minutes,
        minimum_notice_minutes: config.minimum_notice_minutes ?? DEFAULT_POLICY.minimum_notice_minutes,
        max_bookings_per_day: config.max_bookings_per_day ?? DEFAULT_POLICY.max_bookings_per_day,
      });
    } catch {
      /* no saved availability yet — keep defaults */
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const setDay = (day, patch) =>
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const setPolicyField = (key, value) =>
    setPolicy((prev) => ({ ...prev, [key]: value }));

  const addOverride = () => {
    if (!newOverrideDate || overrides[newOverrideDate]) return;
    // A new override blocks the day. Bespoke hours on a single date are a
    // rarer need than "I am away that day", so that is the default.
    setOverrides((prev) => ({ ...prev, [newOverrideDate]: { active: false } }));
    setNewOverrideDate("");
  };

  const removeOverride = (dateKey) =>
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      // The WHOLE config, every time. Sending a partial payload is what erased
      // people's blocked dates before.
      await crmFetch("/api/availability", {
        method: "POST",
        body: {
          weekly_schedule: schedule,
          date_overrides: overrides,
          ...policy,
          max_bookings_per_day: policy.max_bookings_per_day || null,
        },
        mockUserId: userId,
      });
      addToast?.("Availability saved!", "✅");
    } catch {
      addToast?.("Couldn't save availability — please try again.", "❌");
    } finally {
      setSaving(false);
    }
  };

  const overrideDates = Object.keys(overrides).sort();

  return (
    <section className="bg-[#121212] border border-surface-variant rounded-lg p-4 sm:p-6">
      <h2 className="font-working-title text-xl text-on-surface mb-2">Weekly Availability</h2>
      <p className="text-sm text-text-secondary mb-6">
        Set the standard hours you are available for live property viewings. Buyers can only
        request times within these windows.
      </p>

      {loading ? (
        <p className="text-sm text-text-muted animate-pulse py-6">Loading your availability…</p>
      ) : (
        <div className="space-y-8 max-w-xl">
          <div className="space-y-4">
            {DAY_ORDER.map((day) => {
              const config = schedule[day] || DEFAULT_SCHEDULE[day];
              return (
                <div
                  key={day}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 p-3 border border-surface-variant/50 rounded bg-[#1a1a1a]"
                >
                  <label className="flex items-center gap-2 w-full sm:w-32 shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(config.active)}
                      onChange={(e) => setDay(day, { active: e.target.checked })}
                      className="accent-gold-accent w-4 h-4"
                    />
                    <span className="capitalize text-sm text-on-surface">{day}</span>
                  </label>

                  {config.active ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="time"
                        aria-label={`${day} availability start time`}
                        value={config.start}
                        onChange={(e) => setDay(day, { start: e.target.value })}
                        className={`${fieldClass} flex-1 sm:flex-none min-w-0 sm:py-1`}
                      />
                      <span className="text-text-muted shrink-0">-</span>
                      <input
                        type="time"
                        aria-label={`${day} availability end time`}
                        value={config.end}
                        onChange={(e) => setDay(day, { end: e.target.value })}
                        className={`${fieldClass} flex-1 sm:flex-none min-w-0 sm:py-1`}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted italic">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-surface-variant">
            <h3 className="font-working-title text-base text-on-surface mb-1">Booking rules</h3>
            <p className="text-sm text-text-secondary mb-4">
              How viewings are spaced and how much warning you need.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Timezone
                </span>
                <select
                  className={fieldClass}
                  value={policy.timezone}
                  onChange={(e) => setPolicyField("timezone", e.target.value)}
                >
                  {timezoneChoices.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <span className="text-xs text-text-muted">
                  Your hours above are read in this zone. Buyers see their own.
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Viewing length
                </span>
                <select
                  className={fieldClass}
                  value={policy.default_duration_minutes}
                  onChange={(e) => setPolicyField("default_duration_minutes", Number(e.target.value))}
                >
                  {DURATION_CHOICES.map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Start times every
                </span>
                <select
                  className={fieldClass}
                  value={policy.slot_interval_minutes}
                  onChange={(e) => setPolicyField("slot_interval_minutes", Number(e.target.value))}
                >
                  {INTERVAL_CHOICES.map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Minimum notice
                </span>
                <select
                  className={fieldClass}
                  value={policy.minimum_notice_minutes}
                  onChange={(e) => setPolicyField("minimum_notice_minutes", Number(e.target.value))}
                >
                  {NOTICE_CHOICES.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Gap before
                </span>
                <select
                  className={fieldClass}
                  value={policy.buffer_before_minutes}
                  onChange={(e) => setPolicyField("buffer_before_minutes", Number(e.target.value))}
                >
                  {BUFFER_CHOICES.map((m) => (
                    <option key={m} value={m}>{m === 0 ? "None" : `${m} minutes`}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Gap after
                </span>
                <select
                  className={fieldClass}
                  value={policy.buffer_after_minutes}
                  onChange={(e) => setPolicyField("buffer_after_minutes", Number(e.target.value))}
                >
                  {BUFFER_CHOICES.map((m) => (
                    <option key={m} value={m}>{m === 0 ? "None" : `${m} minutes`}</option>
                  ))}
                </select>
                <span className="text-xs text-text-muted">Travel time between viewings.</span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary">
                  Max viewings per day
                </span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  placeholder="No limit"
                  className={fieldClass}
                  value={policy.max_bookings_per_day ?? ""}
                  onChange={(e) => setPolicyField(
                    "max_bookings_per_day",
                    e.target.value === "" ? null : Number(e.target.value),
                  )}
                />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-variant">
            <h3 className="font-working-title text-base text-on-surface mb-1">Days off</h3>
            <p className="text-sm text-text-secondary mb-4">
              Block a specific date — a holiday, or a day you are away. This overrides your
              weekly hours for that day only.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="date"
                aria-label="Date to block"
                className={`${fieldClass} flex-1 min-w-0`}
                value={newOverrideDate}
                onChange={(e) => setNewOverrideDate(e.target.value)}
              />
              <button
                type="button"
                onClick={addOverride}
                disabled={!newOverrideDate}
                className="shrink-0 bg-surface-variant hover:bg-surface-variant/80 text-on-surface px-4 py-2 rounded text-sm font-working-title transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Plus size={14} /> Block
              </button>
            </div>

            {overrideDates.length === 0 ? (
              <p className="text-sm text-text-muted italic">No days blocked.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {overrideDates.map((dateKey) => (
                  <li
                    key={dateKey}
                    className="flex items-center justify-between gap-3 p-2.5 border border-surface-variant/50 rounded bg-[#1a1a1a]"
                  >
                    <span className="text-sm text-on-surface font-data-tabular">
                      {new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "short", year: "numeric", month: "long", day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-text-muted ml-auto">
                      {overrides[dateKey]?.active === false ? "Unavailable" : "Custom hours"}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOverride(dateKey)}
                      aria-label={`Unblock ${dateKey}`}
                      className="text-text-muted hover:text-error transition shrink-0 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-4 border-t border-surface-variant">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-surface-variant hover:bg-surface-variant/80 text-on-surface px-6 py-2 rounded text-sm font-working-title transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
