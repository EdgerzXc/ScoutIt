// Phase 3 core — canonical ↔ Google mapping + the content hash that makes sync
// loop-safe. Pure functions, no network, fully unit-testable without any live
// Google connection. The webhook/cron wiring that USES these lives in a later
// step (it needs a real OAuth connection to build against).
import crypto from "crypto";

// The fields that define "did this event meaningfully change". Anything outside
// this set (etags, ids, sync cursors) is deliberately excluded so provider
// round-trips that only touch metadata don't look like edits.
const HASH_FIELDS = ["title", "description", "location", "startsAt", "endsAt", "allDay", "status"];

/**
 * Stable content hash of an event. Same meaningful content => same hash on both
 * sides of a sync, which is what lets us drop echoes (see syncEngine).
 * @param {object} event canonical event shape
 * @returns {string} sha256 hex
 */
export function computeContentHash(event) {
  const normalized = {};
  for (const f of HASH_FIELDS) {
    let v = event?.[f];
    if (f === "startsAt" || f === "endsAt") {
      // Normalize timestamps to epoch ms so "+00:00" vs "Z" vs offset don't
      // produce different hashes for the same instant.
      v = v ? new Date(v).getTime() : null;
    }
    if (f === "description" || f === "location") v = v || ""; // null == empty
    normalized[f] = v ?? null;
  }
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

/** Google Calendar event -> canonical shape. Handles all-day (date) vs timed
 *  (dateTime) start/end. */
export function googleToCanonical(g) {
  const allDay = Boolean(g.start?.date && !g.start?.dateTime);
  const startsAt = g.start?.dateTime || (g.start?.date ? new Date(g.start.date).toISOString() : null);
  const endsAt = g.end?.dateTime || (g.end?.date ? new Date(g.end.date).toISOString() : null);
  return {
    title: g.summary || "(no title)",
    description: g.description || "",
    location: g.location || "",
    startsAt,
    endsAt,
    allDay,
    status: g.status === "cancelled" ? "cancelled" : g.status === "tentative" ? "tentative" : "confirmed",
    googleId: g.id || null,
    etag: g.etag || null,
  };
}

/** Canonical shape -> Google Calendar event body (for create/update calls). */
export function canonicalToGoogle(event) {
  const body = {
    summary: event.title,
    description: event.description || undefined,
    location: event.location || undefined,
    status: event.status === "cancelled" ? "cancelled" : "confirmed",
  };
  if (event.allDay) {
    // Google all-day events are date-only; end date is exclusive.
    body.start = { date: toDateOnly(event.startsAt) };
    body.end = { date: toDateOnly(event.endsAt) };
  } else {
    body.start = { dateTime: new Date(event.startsAt).toISOString() };
    body.end = { dateTime: new Date(event.endsAt).toISOString() };
  }
  return body;
}

function toDateOnly(iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
