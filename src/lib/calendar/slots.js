// The bookable-slot engine — pure, deterministic, no I/O, no ambient clock.
//
// Ported in spirit from Cal.com's scheduling model (cal.diy), adapted to
// ScoutIt's Supabase tables. One rule decides everything:
//
//     bookable = weekly schedule
//                ∩ date overrides
//                − busy time (viewings AND calendar events)
//                − buffers
//                − minimum notice
//                − daily cap
//
// This module is the ONLY definition of "is that time bookable". The buyer's
// picker renders what it returns, and the server re-checks against it before
// writing a row, so a hand-crafted request cannot book 3am on a day the host
// marked unavailable. Anything that decides bookability outside this file is a
// bug by construction.

import {
  addDaysToDateKey,
  dateKeyRange,
  getZonedDateKey,
  getZonedParts,
  isValidTimeZone,
  minutesToTimeString,
  timeStringToMinutes,
  zonedWallTimeToUtc,
} from "./timezone";

const MINUTE_MS = 60 * 1000;

export const DEFAULT_TIMEZONE = "Asia/Manila";

/** Booking policy defaults. Mirrors the user_availability column defaults. */
export const AVAILABILITY_DEFAULTS = Object.freeze({
  timezone: DEFAULT_TIMEZONE,
  defaultDurationMinutes: 60,
  slotIntervalMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  minimumNoticeMinutes: 120,
  maxBookingsPerDay: null,
});

export const WEEKDAY_KEYS = Object.freeze([
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
]);

const clampInt = (value, { min, max, fallback }) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** The one duration normalizer used by slot responses and booking writes. */
export function normalizeDurationMinutes(
  value,
  fallback = AVAILABILITY_DEFAULTS.defaultDurationMinutes,
) {
  return clampInt(value, { min: 5, max: 8 * 60, fallback });
}

/**
 * Fill a stored user_availability row out to a complete, sane policy.
 * Every caller goes through this so a partially-configured host still gets
 * correct behavior instead of NaN windows.
 */
export function normalizeAvailability(config = {}) {
  const timezone = isValidTimeZone(config.timezone) ? config.timezone : DEFAULT_TIMEZONE;
  return {
    timezone,
    weeklySchedule: config.weeklySchedule || config.weekly_schedule || {},
    dateOverrides: config.dateOverrides || config.date_overrides || {},
    defaultDurationMinutes: clampInt(
      config.defaultDurationMinutes ?? config.default_duration_minutes,
      { min: 5, max: 8 * 60, fallback: AVAILABILITY_DEFAULTS.defaultDurationMinutes },
    ),
    slotIntervalMinutes: clampInt(
      config.slotIntervalMinutes ?? config.slot_interval_minutes,
      { min: 5, max: 4 * 60, fallback: AVAILABILITY_DEFAULTS.slotIntervalMinutes },
    ),
    bufferBeforeMinutes: clampInt(
      config.bufferBeforeMinutes ?? config.buffer_before_minutes,
      { min: 0, max: 4 * 60, fallback: AVAILABILITY_DEFAULTS.bufferBeforeMinutes },
    ),
    bufferAfterMinutes: clampInt(
      config.bufferAfterMinutes ?? config.buffer_after_minutes,
      { min: 0, max: 4 * 60, fallback: AVAILABILITY_DEFAULTS.bufferAfterMinutes },
    ),
    minimumNoticeMinutes: clampInt(
      config.minimumNoticeMinutes ?? config.minimum_notice_minutes,
      { min: 0, max: 60 * 24 * 30, fallback: AVAILABILITY_DEFAULTS.minimumNoticeMinutes },
    ),
    maxBookingsPerDay: config.maxBookingsPerDay ?? config.max_bookings_per_day ?? null
      ? clampInt(config.maxBookingsPerDay ?? config.max_bookings_per_day, {
        min: 1, max: 50, fallback: null,
      })
      : null,
  };
}

/**
 * The wall-clock windows a host is open on one calendar day.
 *
 * A date override always WINS over the weekly rule for that day — that is the
 * whole point of an override, and it is why an override may be `{active:false}`
 * (a blocked holiday) as well as a different set of hours.
 *
 * Accepted window shapes, in precedence order:
 *   { active:false }                -> closed all day
 *   { windows:[{start,end}, ...] }  -> several windows (split shift)
 *   { start:"09:00", end:"17:00" }  -> one window
 *
 * @returns {{start:number, end:number}[]} minutes past midnight, merged, sorted
 */
export function getDayWindows({ dateKey, weekday, weeklySchedule = {}, dateOverrides = {} }) {
  const override = dateOverrides?.[dateKey];
  const source = override !== undefined && override !== null ? override : weeklySchedule?.[weekday];
  if (!source) return [];
  if (source.active === false) return [];

  const rawWindows = Array.isArray(source.windows) && source.windows.length > 0
    ? source.windows
    : [source];

  const windows = [];
  for (const win of rawWindows) {
    const start = timeStringToMinutes(win?.start);
    const end = timeStringToMinutes(win?.end);
    // A window that does not parse, or that ends at/before it starts, is not a
    // window. Dropping it is correct: the alternative is inventing hours the
    // host never entered.
    if (start === null || end === null || end <= start) continue;
    windows.push({ start, end });
  }
  return mergeIntervals(windows);
}

/** Merge overlapping/adjacent {start,end} numeric intervals. */
export function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }
  return merged;
}

function toMs(value) {
  if (value === null || value === undefined) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Turn stored rows into busy {start,end} instant intervals (epoch ms).
 *
 * Both sources count. Before this, availability only looked at
 * viewing_appointments, so a Google-synced calendar event never blocked a
 * viewing — the host got double-booked against their own calendar.
 *
 * @param {object} args
 * @param {Array}  args.appointments viewing_appointments rows
 * @param {Array}  args.events       calendar_events rows
 * @param {number} args.defaultDurationMinutes fallback when a row has no end
 */
export function buildBusyIntervals({
  appointments = [],
  events = [],
  defaultDurationMinutes = AVAILABILITY_DEFAULTS.defaultDurationMinutes,
} = {}) {
  const busy = [];

  for (const appt of appointments) {
    // A cancelled or declined viewing does not hold time.
    const status = appt.status || appt.state;
    if (status && !["pending", "confirmed"].includes(status)) continue;
    const start = toMs(appt.scheduled_at ?? appt.scheduledAt);
    if (start === null) continue;
    const explicitEnd = toMs(appt.ends_at ?? appt.endsAt);
    const minutes = Number(appt.duration_minutes ?? appt.durationMinutes);
    const end = explicitEnd !== null
      ? explicitEnd
      : start + (Number.isFinite(minutes) && minutes > 0 ? minutes : defaultDurationMinutes) * MINUTE_MS;
    busy.push({ start, end });
  }

  for (const event of events) {
    if (event.is_deleted || event.isDeleted) continue;
    if (event.status === "cancelled") continue;
    const start = toMs(event.starts_at ?? event.startsAt);
    const end = toMs(event.ends_at ?? event.endsAt);
    if (start === null || end === null || end <= start) continue;
    busy.push({ start, end });
  }

  return mergeIntervals(busy);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Every bookable slot in a date range.
 *
 * @param {object}   args
 * @param {string}   args.fromDateKey  "yyyy-mm-dd" in the HOST's zone, inclusive
 * @param {string}   args.toDateKey    "yyyy-mm-dd" in the HOST's zone, inclusive
 * @param {object}   args.availability raw or normalized user_availability
 * @param {Array}    args.busy         intervals from buildBusyIntervals
 * @param {Array}    [args.bookingStarts] existing viewing start instants; used
 *                                      only for max-bookings-per-day
 * @param {number}   [args.durationMinutes] override the host's default
 * @param {Date|number} [args.now]     injected clock — never read ambiently, so
 *                                     minimum-notice behavior is testable
 * @returns {{startsAt:string, endsAt:string}[]} ISO instants, ascending
 */
export function computeSlots({
  fromDateKey,
  toDateKey,
  availability,
  busy = [],
  bookingStarts = [],
  durationMinutes,
  now = Date.now(),
  maxDays = 62,
} = {}) {
  const policy = normalizeAvailability(availability);
  const duration = normalizeDurationMinutes(durationMinutes, policy.defaultDurationMinutes);
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const earliestStart = nowMs + policy.minimumNoticeMinutes * MINUTE_MS;
  const busyMerged = mergeIntervals(busy);

  // How many bookings already sit on each host-local day, for the daily cap.
  const bookedPerDay = new Map();
  if (policy.maxBookingsPerDay) {
    for (const startsAt of bookingStarts) {
      const instant = toMs(startsAt);
      if (instant === null) continue;
      const key = getZonedDateKey(new Date(instant), policy.timezone);
      bookedPerDay.set(key, (bookedPerDay.get(key) || 0) + 1);
    }
  }

  const slots = [];
  for (const dateKey of dateKeyRange(fromDateKey, toDateKey, maxDays)) {
    if (policy.maxBookingsPerDay && (bookedPerDay.get(dateKey) || 0) >= policy.maxBookingsPerDay) {
      continue;
    }

    // The weekday must be read in the HOST's zone, not the server's. Asking
    // "what day is 2026-09-01?" only has an answer relative to a zone.
    const noonInstant = zonedWallTimeToUtc(dateKey, "12:00", policy.timezone);
    const weekday = getZonedParts(noonInstant, policy.timezone).weekday;

    const windows = getDayWindows({
      dateKey,
      weekday,
      weeklySchedule: policy.weeklySchedule,
      dateOverrides: policy.dateOverrides,
    });

    for (const window of windows) {
      for (
        let minute = window.start;
        minute + duration <= window.end;
        minute += policy.slotIntervalMinutes
      ) {
        const startsAt = zonedWallTimeToUtc(dateKey, minutesToTimeString(minute), policy.timezone);
        const startMs = startsAt.getTime();
        // Spring-forward gaps contain wall times that do not map to a real
        // instant. The timezone helper returns Invalid Date for those.
        if (!Number.isFinite(startMs)) continue;
        const endMs = startMs + duration * MINUTE_MS;

        // Minimum notice: no same-minute bookings, no bookings in the past.
        if (startMs < earliestStart) continue;

        // Buffers pad the CANDIDATE, so a slot adjacent to a booking is
        // rejected without needing to rewrite the stored busy intervals.
        const guardedStart = startMs - policy.bufferBeforeMinutes * MINUTE_MS;
        const guardedEnd = endMs + policy.bufferAfterMinutes * MINUTE_MS;
        const blocked = busyMerged.some((b) => overlaps(guardedStart, guardedEnd, b.start, b.end));
        if (blocked) continue;

        slots.push({
          startsAt: new Date(startMs).toISOString(),
          endsAt: new Date(endMs).toISOString(),
        });
      }
    }
  }

  return slots.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

/**
 * Server-side gate: was this exact instant one of the slots we offered?
 *
 * Deliberately re-derives the slots rather than trusting anything the client
 * sent. The buyer's picker and this check therefore cannot drift — they run the
 * same function over the same inputs.
 *
 * @returns {{ok:true, endsAt:string} | {ok:false, reason:string}}
 */
export function validateSlot({
  startsAt,
  availability,
  busy = [],
  durationMinutes,
  now = Date.now(),
} = {}) {
  const startMs = toMs(startsAt);
  if (startMs === null) return { ok: false, reason: "invalid_time" };

  const policy = normalizeAvailability(availability);
  const nowMs = now instanceof Date ? now.getTime() : Number(now);

  if (startMs < nowMs) return { ok: false, reason: "in_the_past" };
  if (startMs < nowMs + policy.minimumNoticeMinutes * MINUTE_MS) {
    return { ok: false, reason: "too_soon" };
  }

  // Look only at the host-local day the request lands on, plus its neighbours:
  // a window may legitimately straddle a UTC date boundary.
  const dateKey = getZonedDateKey(new Date(startMs), policy.timezone);
  const candidates = computeSlots({
    fromDateKey: addDaysToDateKey(dateKey, -1),
    toDateKey: addDaysToDateKey(dateKey, 1),
    availability: policy,
    busy,
    durationMinutes,
    now,
  });

  const match = candidates.find((slot) => new Date(slot.startsAt).getTime() === startMs);
  if (!match) return { ok: false, reason: "not_available" };
  return { ok: true, endsAt: match.endsAt };
}

/** Human-readable reason strings for the API and the UI to share. */
export const SLOT_REJECTION_MESSAGES = Object.freeze({
  invalid_time: "That is not a valid date and time.",
  in_the_past: "That time has already passed.",
  too_soon: "That time is too soon — the host needs more notice.",
  not_available: "The host is not available at that time.",
});
