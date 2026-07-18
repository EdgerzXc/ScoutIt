// Calendar date helpers — pure functions over the native Date, zero deps.
//
// All math runs in the browser's LOCAL timezone (the current dashboard already
// renders appointment times with toLocaleString, so this stays consistent).
// The Philippines (Asia/Manila) has no daylight-saving, so local-time day/week
// bucketing is unambiguous. Timezone-pinning belongs to the external-sync
// phases, not here.

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const HOURS_IN_DAY = 24;

/** Midnight (local) of the given date, as a new Date. */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add `n` days (can be negative) — returns a new Date, never mutates. */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Add `n` months, clamping the day so e.g. Jan 31 + 1mo => Feb 28/29. */
export function addMonths(date, n) {
  const d = new Date(date);
  const targetDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, lastDay));
  return d;
}

/** Sunday-start week containing `date` (PH calendars conventionally start Sun). */
export function startOfWeek(date) {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

/** First day of the month containing `date`. */
export function startOfMonth(date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function isSameMonth(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth();
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

/**
 * A stable 6-row month grid (42 days) starting on the Sunday on/before the 1st.
 * Six rows means the grid never changes height month to month.
 * @returns {Date[]} 42 Date objects at local midnight.
 */
export function getMonthGrid(date) {
  const firstCell = startOfWeek(startOfMonth(date));
  return Array.from({ length: 42 }, (_, i) => addDays(firstCell, i));
}

/** The seven days (Sun→Sat) of the week containing `date`. */
export function getWeekDays(date) {
  const first = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

// ── Formatting ───────────────────────────────────────────────────────────────

export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDayHeading(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortRange(startsAt, endsAt, allDay) {
  if (allDay) return "All day";
  const start = formatTime(startsAt);
  if (!endsAt) return start;
  return `${start} – ${formatTime(endsAt)}`;
}

// ── <input> bridging (yyyy-mm-dd + HH:mm, local) ─────────────────────────────

/** Local date -> "yyyy-mm-dd" for <input type="date">. */
export function toDateInputValue(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Local date -> "HH:mm" for <input type="time">. */
export function toTimeInputValue(date) {
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Combine a "yyyy-mm-dd" date input and an "HH:mm" time input into a Date in
 * local time. Parses the parts explicitly so we never hit the "yyyy-mm-dd is
 * treated as UTC midnight" footgun of `new Date("2026-07-18")`.
 */
export function fromDateTimeInputs(dateStr, timeStr = "00:00") {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}
