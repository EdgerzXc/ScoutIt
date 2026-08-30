/**
 * A-063 — the shared vocabulary of the system event log.
 *
 * Two separate deployments write to `system_events`: this console and the main
 * site. They cannot import from each other, so this module is duplicated into
 * the main app at `src/lib/systemEventPolicy.mjs` and a test asserts the two
 * copies stay byte-identical. A log whose event names drift between its writers
 * is a log you cannot filter — which is the same as not having one.
 *
 * Pure and dependency-free so both copies are testable without a database.
 */

/** Which deployment emitted an event. */
export const SOURCES = Object.freeze({
  MISSION_CONTROL: "mission-control",
  MAIN_SITE: "main-site",
});

export const SEVERITIES = Object.freeze(["info", "warning", "error"]);

/**
 * The event names in use, grouped by the machinery that emits them.
 *
 * Dotted so a whole family can be filtered by prefix. Adding a name here is the
 * cheap half; the expensive half is emitting it at the point the work actually
 * happens, so an entry with no emitter is worse than no entry — it implies a
 * silence means "did not happen" when it means "was never wired".
 */
export const EVENTS = Object.freeze({
  // Airtable, the public CMS
  AIRTABLE_SYNC_OK: "airtable.sync.ok",
  AIRTABLE_SYNC_FAILED: "airtable.sync.failed",
  AIRTABLE_PUBLISH_OK: "airtable.publish.ok",
  AIRTABLE_PUBLISH_FAILED: "airtable.publish.failed",

  // The public catalogue cache in front of it
  CACHE_PURGED: "cache.catalogue.purged",
  CACHE_PURGE_FAILED: "cache.catalogue.purge_failed",
  CMS_BUNDLE_REBUILT: "cms.bundle.rebuilt",

  // Position — a correction that was saved but had nowhere public to go
  COORDINATES_VERIFIED: "coordinates.verified",

  // Scheduled work
  CRON_COMPLETED: "cron.completed",
  CRON_FAILED: "cron.failed",
});

const EVENT_NAMES = Object.freeze(Object.values(EVENTS));

/** Is this a name the log knows about? Used to catch typos at the call site. */
export function isKnownEvent(event) {
  return EVENT_NAMES.includes(event);
}

/**
 * Normalise one event into the exact row shape `system_events` accepts.
 *
 * Throws only on a programming error the caller can fix (no event name, an
 * unknown severity). Everything else is coerced, because an event is a
 * by-product of real work: a recorder that rejects a slightly malformed detail
 * object would turn "we could not describe what happened" into "the thing that
 * happened failed".
 */
export function buildSystemEvent({
  event,
  source,
  severity = "info",
  subjectTable = null,
  subjectId = null,
  summary = null,
  detail = {},
  occurredAt = null,
} = {}) {
  if (typeof event !== "string" || !event.trim()) {
    throw new Error("A system event needs an event name.");
  }
  if (!SEVERITIES.includes(severity)) {
    throw new Error(`Unknown severity '${severity}'. Use one of: ${SEVERITIES.join(", ")}.`);
  }
  if (typeof source !== "string" || !source.trim()) {
    throw new Error("A system event needs a source.");
  }

  return {
    event: event.trim(),
    source: source.trim(),
    severity,
    subject_table: subjectTable ? String(subjectTable) : null,
    subject_id: subjectId === null || subjectId === undefined ? null : String(subjectId),
    summary: summary ? String(summary).slice(0, 500) : null,
    detail: detail && typeof detail === "object" && !Array.isArray(detail) ? detail : { value: detail },
    occurred_at: occurredAt || new Date().toISOString(),
  };
}

/**
 * The severity an outcome implies, so callers stop deciding it case by case and
 * a failure can never be filed as `info`.
 */
export function severityForOutcome(ok) {
  return ok ? "info" : "error";
}
