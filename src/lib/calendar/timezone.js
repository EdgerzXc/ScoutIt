// IANA timezone helpers — pure, dependency-free, no Date mutation.
//
// Why this exists: availability is authored as WALL-CLOCK time in the host's
// zone ("Mondays 09:00-17:00, Asia/Manila"), but every instant we store and
// compare is a UTC timestamptz. Converting between the two is the single most
// common source of off-by-hours booking bugs, so it lives in one tested place.
//
// The previous booking path did `new Date("2026-09-01 2:00 PM")`, which parses
// in the BROWSER's zone — a buyer abroad booked a different real instant than
// the label they clicked. Nothing here reads the local zone; the zone is always
// passed in explicitly.

const MINUTE_MS = 60 * 1000;

// Intl.DateTimeFormat construction is not free and the same handful of zones
// are asked for thousands of times while building a month of slots.
const formatterCache = new Map();

function partsFormatter(timeZone) {
  let fmt = formatterCache.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      weekday: "long",
    });
    formatterCache.set(timeZone, fmt);
  }
  return fmt;
}

/** True when the runtime accepts this IANA zone id. */
export function isValidTimeZone(timeZone) {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The wall-clock reading of `instant` in `timeZone`.
 * @returns {{year:number, month:number, day:number, hour:number, minute:number,
 *            second:number, weekday:string, dateKey:string}}
 *          `weekday` is lowercase ("monday") to match the weekly_schedule keys;
 *          `dateKey` is "yyyy-mm-dd" to match date_overrides keys.
 */
export function getZonedParts(instant, timeZone) {
  const date = instant instanceof Date ? instant : new Date(instant);
  const parts = partsFormatter(timeZone).formatToParts(date);
  const bag = {};
  for (const part of parts) bag[part.type] = part.value;

  // "24" appears at midnight in some ICU versions; normalise it to 0.
  const hour = Number(bag.hour) === 24 ? 0 : Number(bag.hour);

  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: String(bag.weekday || "").toLowerCase(),
    dateKey: `${bag.year}-${bag.month}-${bag.day}`,
  };
}

/** "yyyy-mm-dd" for the calendar day `instant` falls on in `timeZone`. */
export function getZonedDateKey(instant, timeZone) {
  return getZonedParts(instant, timeZone).dateKey;
}

/** Lowercase weekday name ("monday") for `instant` in `timeZone`. */
export function getZonedWeekday(instant, timeZone) {
  return getZonedParts(instant, timeZone).weekday;
}

/**
 * Offset of `timeZone` from UTC at `instant`, in minutes.
 * Positive east of UTC (Asia/Manila => +480).
 */
export function getTimeZoneOffsetMinutes(instant, timeZone) {
  return offsetAt(instant, timeZone);
}

/**
 * Convert a wall-clock time in `timeZone` to the UTC instant it denotes.
 *
 * @param {string} dateKey "yyyy-mm-dd" in the target zone
 * @param {string} timeStr "HH:mm" (24h) in the target zone
 * @param {string} timeZone IANA id
 * @returns {Date} the UTC instant
 *
 * DST note: the offset depends on the instant, and the instant is what we are
 * solving for, so this converges rather than assuming. One correction pass is
 * enough for every real zone (offsets change by at most a couple of hours, and
 * never twice within the same wall-clock day).
 */
export function zonedWallTimeToUtc(dateKey, timeStr, timeZone) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const [hh, mm] = String(timeStr).split(":").map(Number);
  const wallAsUtc = Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);

  // First guess: treat the wall clock as UTC, then shift by the offset in
  // effect at that guess.
  let offset = offsetAt(new Date(wallAsUtc), timeZone);
  let instant = new Date(wallAsUtc - offset * MINUTE_MS);

  // Correct once using the offset actually in effect at the guessed instant.
  const corrected = offsetAt(instant, timeZone);
  if (corrected !== offset) {
    offset = corrected;
    instant = new Date(wallAsUtc - offset * MINUTE_MS);
  }

  // A wall time inside a spring-forward gap does not exist. Offset arithmetic
  // alone silently turns (for example) 02:30 into 03:30, which would offer a
  // different time from the one the host configured. Reject it by requiring a
  // round trip back to the exact wall-clock fields that were requested.
  const roundTrip = getZonedParts(instant, timeZone);
  if (
    roundTrip.year !== y ||
    roundTrip.month !== m ||
    roundTrip.day !== d ||
    roundTrip.hour !== hh ||
    roundTrip.minute !== mm
  ) {
    return new Date(NaN);
  }
  return instant;
}

/** Offset in minutes east of UTC for `timeZone` at `instant`. */
export function offsetAt(instant, timeZone) {
  const date = instant instanceof Date ? instant : new Date(instant);
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  // `date` may carry milliseconds the formatter dropped; floor both to seconds.
  const flooredInstant = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUtc - flooredInstant) / MINUTE_MS);
}

/** Advance a "yyyy-mm-dd" key by `n` calendar days (zone-independent). */
export function addDaysToDateKey(dateKey, n) {
  const [y, m, d] = String(dateKey).split("-").map(Number);
  const shifted = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  shifted.setUTCDate(shifted.getUTCDate() + n);
  const yyyy = shifted.getUTCFullYear();
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Every "yyyy-mm-dd" key from `fromKey` to `toKey` inclusive. */
export function dateKeyRange(fromKey, toKey, maxDays = 120) {
  if (!isValidDateKey(fromKey) || !isValidDateKey(toKey) || fromKey > toKey) {
    return [];
  }
  const keys = [];
  let cursor = fromKey;
  for (let i = 0; i <= maxDays; i += 1) {
    keys.push(cursor);
    if (cursor === toKey) break;
    cursor = addDaysToDateKey(cursor, 1);
  }
  return keys;
}

/** True only for a real Gregorian calendar key in canonical yyyy-mm-dd form. */
export function isValidDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ""));
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
}

/** "HH:mm" -> minutes past midnight. Returns null when unparseable. */
export function timeStringToMinutes(timeStr) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr || "").trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59 || (hours === 24 && minutes !== 0)) return null;
  return hours * 60 + minutes;
}

/** minutes past midnight -> "HH:mm". */
export function minutesToTimeString(minutes) {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
