import crypto from "crypto";

import { getValidGoogleAccessToken } from "./connectionStore";
import { insertEvent, patchEvent, deleteEvent } from "./googleClient";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

// ═══════════════════════════════════════════════════════════════
// AUTOMATED GOOGLE MEET GENERATION  (NEW_IDEAS.md §20.1)
//
// When a seeker books a viewing, Google mints a Meet room on the HOST's
// calendar and ScoutIt stores the link on the appointment. Nobody has to
// send a URL by hand, and neither party has to reveal a personal number to
// get on a call.
//
// COST: ₱0. This is the standard Google Calendar API on quotas the calendar
// sync already uses. No Daily.co, no Twilio, no new vendor.
//
// ── BEST EFFORT, ALWAYS ─────────────────────────────────────────────
// Every function here returns null on failure instead of throwing. A
// viewing booking must NEVER fail because a video link couldn't be made —
// the host might not have connected Google, their token might have expired,
// or Google might just be down. The appointment is the product; the Meet
// room is a convenience on top.
//
// ── THE SILENT-FAILURE TRAP ─────────────────────────────────────────
// `conferenceDataVersion=1` is required on the request. Without it Google
// accepts the call, ignores conferenceData entirely, and returns a normal
// event with NO Meet link and NO error. So a missing link is indistinguishable
// from success unless you check for hangoutLink explicitly — which is what
// extractMeetLink does.
// ═══════════════════════════════════════════════════════════════

/**
 * Pulls the Meet URL out of a Google event response.
 *
 * Checks entryPoints as well as hangoutLink: 'hangoutLink' is the classic
 * field and is usually present, but the video entry point is the documented
 * source of truth and survives Google's own field deprecations.
 *
 * @param {object} event - Google Calendar event resource
 * @returns {string|null}
 */
export function extractMeetLink(event) {
  if (!event) return null;

  const entry = (event.conferenceData?.entryPoints || []).find(
    (e) => e?.entryPointType === "video" && e?.uri,
  );
  if (entry?.uri) return entry.uri;

  return event.hangoutLink || null;
}

/**
 * Deterministic Google Calendar event ID (base32hex subset a-v0-9) for a
 * viewing appointment so retries converge on a single provider event.
 */
export function viewingGoogleEventId(hostUserId, appointmentId) {
  return crypto
    .createHash("sha256")
    .update(`scoutit-viewing:${hostUserId}:${appointmentId}`)
    .digest("hex");
}

/**
 * Builds the Google event body for a property viewing, including the
 * conference create-request.
 *
 * @param {{ appointmentId?: string, propertyTitle?: string, location?: string,
 *           scheduledAt: string, durationMinutes?: number, notes?: string,
 *           attendeeEmails?: string[] }} input
 */
export function buildViewingEventBody({
  appointmentId,
  propertyTitle,
  location,
  scheduledAt,
  durationMinutes = 45,
  notes,
  attendeeEmails = [],
}) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const descriptionLines = [
    `Property viewing arranged through ScoutIt.`,
    propertyTitle ? `Property: ${propertyTitle}` : null,
    location ? `Location: ${location}` : null,
    notes ? `\nNotes: ${notes}` : null,
    `\nJoin the video room from the link on this event, or meet on site.`,
  ].filter(Boolean);

  const requestId = appointmentId
    ? `viewing-meet-${appointmentId}`
    : typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `req_${Math.random().toString(36).substring(2)}_${Date.now()}`;

  const body = {
    summary: propertyTitle ? `Viewing — ${propertyTitle}` : "Property viewing (ScoutIt)",
    description: descriptionLines.join("\n"),
    location: location || undefined,
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    conferenceData: {
      createRequest: {
        // Must be unique per request. Google dedupes on it, so a retry with
        // the same id returns the SAME conference rather than a second room.
        requestId,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  // Only attach attendees we actually have. Google rejects an attendee
  // object with no email, and inviting a blank address is worse than not
  // inviting at all.
  const valid = attendeeEmails.filter((e) => typeof e === "string" && e.includes("@"));
  if (valid.length) body.attendees = valid.map((email) => ({ email }));

  return body;
}

/**
 * Creates a viewing event with a Meet room on the host's calendar.
 *
 * @param {string} hostUserId
 * @param {object} details - see buildViewingEventBody
 * @returns {Promise<{ meetLink: string|null, googleEventId: string|null }>}
 *          Both null when the host has no usable Google connection.
 */
export async function createViewingMeet(hostUserId, details) {
  if (!hostUserId || !details?.scheduledAt) return { meetLink: null, googleEventId: null };

  try {
    const accessToken = await getValidGoogleAccessToken(hostUserId);
    // No connection is the normal case, not an error — most hosts won't have
    // linked Google. Return quietly.
    if (!accessToken) return { meetLink: null, googleEventId: null };

    const body = buildViewingEventBody(details);
    const deterministicId = details.googleEventId
      || (details.appointmentId ? viewingGoogleEventId(hostUserId, details.appointmentId) : null);

    let event;
    if (deterministicId) {
      try {
        event = await insertEvent(accessToken, { ...body, id: deterministicId }, {
          conferenceDataVersion: 1,
        });
      } catch (err) {
        if (err?.status !== 409) throw err;
        event = await patchEvent(accessToken, deterministicId, body, {
          conferenceDataVersion: 1,
        });
      }
    } else {
      event = await insertEvent(accessToken, body, {
        conferenceDataVersion: 1,
      });
    }

    return {
      meetLink: extractMeetLink(event),
      googleEventId: event?.id || deterministicId || null,
    };
  } catch (error) {
    // Expired refresh token, revoked access, Google outage, quota — none of
    // these should cost the user their booking.
    console.error("[meetLink] createViewingMeet failed:", error?.message);
    return { meetLink: null, googleEventId: null, syncFailed: true, error: error?.message || "calendar_sync_failed" };
  }
}

/**
 * GAP-36: Enqueues a retry record when Google Calendar event creation,
 * reschedule, or cancellation fails so external calendar state can be
 * reconciled asynchronously without failing the primary booking request.
 */
export async function enqueueCalendarSyncRetry(
  serviceClient,
  { appointmentId, hostUserId, googleEventId = null, operation, payload = {}, errorReason = null }
) {
  if (!serviceClient || !appointmentId || !operation) return false;
  let errorCode = "queue_write_failed";
  try {
    const { error } = await serviceClient.from("calendar_sync_queue").insert({
      appointment_id: appointmentId,
      host_user_id: hostUserId || null,
      google_event_id: googleEventId,
      operation,
      payload,
      error_reason: errorReason,
      status: "pending",
      created_at: new Date().toISOString(),
    });
    if (!error) return true;
    errorCode = error.code || errorCode;
  } catch (error) {
    errorCode = error?.code || errorCode;
  }
  console.error("[calendar sync retry] Could not persist retry:", operation, errorCode);
  await recordSystemEvent({
    event: EVENTS.CALENDAR_SYNC_FAILED,
    severity: "error",
    subjectTable: "viewing_appointments",
    subjectId: appointmentId,
    summary: "A viewing calendar change could not be queued for retry.",
    detail: { operation, errorCode },
  });
  return false;
}

/**
 * Moves an existing viewing event when an appointment is rescheduled, so the
 * Meet link stays the same and both calendars stay correct.
 *
 * @returns {Promise<boolean>} true when the patch landed
 */
export async function rescheduleViewingMeet(hostUserId, googleEventId, { scheduledAt, durationMinutes = 45 }) {
  if (!hostUserId || !googleEventId || !scheduledAt) return false;

  try {
    const accessToken = await getValidGoogleAccessToken(hostUserId);
    if (!accessToken) return false;

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    await patchEvent(accessToken, googleEventId, {
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    });
    return true;
  } catch (error) {
    console.error("[meetLink] rescheduleViewingMeet failed:", error?.message);
    return false;
  }
}

/**
 * Removes the calendar event when a viewing is cancelled. Without this a
 * cancelled viewing leaves a live Meet room and a stale entry sitting in the
 * host's calendar, which is how someone ends up waiting in an empty call.
 *
 * @returns {Promise<boolean>}
 */
export async function cancelViewingMeet(hostUserId, googleEventId) {
  if (!hostUserId || !googleEventId) return false;

  try {
    const accessToken = await getValidGoogleAccessToken(hostUserId);
    if (!accessToken) return false;
    await deleteEvent(accessToken, googleEventId);
    return true;
  } catch (error) {
    console.error("[meetLink] cancelViewingMeet failed:", error?.message);
    return false;
  }
}

export const MAX_CALENDAR_SYNC_ATTEMPTS = 5;

export function computeRetryBackoffMs(attemptCount) {
  const step = Math.max(1, Number(attemptCount) || 1);
  return Math.min(60 * 60 * 1000, 30_000 * Math.pow(2, step - 1));
}

/**
 * A-361: Processes due rows in `calendar_sync_queue` with bounded retries and
 * deterministic provider event deduplication so failed create, reschedule, and
 * cancel operations converge cleanly without duplicate Google events or stale
 * Meet links.
 */
export async function processCalendarSyncQueue(
  serviceClient,
  { limit = 20, now = Date.now(), hostUserId = null } = {}
) {
  const summary = {
    processed: 0,
    completed: 0,
    retried: 0,
    failedPermanent: 0,
    superseded: 0,
    errors: [],
  };

  if (!serviceClient) return summary;

  let query = serviceClient
    .from("calendar_sync_queue")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date(now).toISOString())
    .order("created_at", { ascending: true });

  if (hostUserId) {
    query = query.eq("host_user_id", hostUserId);
  }

  const { data: pendingRows, error: fetchError } = await query.limit(limit);
  if (fetchError || !Array.isArray(pendingRows) || pendingRows.length === 0) {
    return summary;
  }

  // Group by appointment_id so older create/reschedule rows are superseded
  // when a later cancel or newer reschedule exists in the batch.
  const latestByAppointment = new Map();
  for (const row of pendingRows) {
    latestByAppointment.set(row.appointment_id, row);
  }

  for (const row of pendingRows) {
    summary.processed += 1;
    const latestForAppt = latestByAppointment.get(row.appointment_id);

    // If a later operation for the same appointment is a cancel (or newer reschedule),
    // supersede earlier non-cancel rows so we never execute stale operations.
    if (
      latestForAppt &&
      latestForAppt.id !== row.id &&
      (latestForAppt.operation === "cancel" || latestForAppt.operation === row.operation)
    ) {
      await serviceClient
        .from("calendar_sync_queue")
        .update({
          status: "superseded",
          completed_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", row.id);
      summary.superseded += 1;
      continue;
    }

    const { data: appt } = await serviceClient
      .from("viewing_appointments")
      .select("id, host_id, status, scheduled_at, duration_minutes, notes, google_event_id, meet_link, deals(properties(title, location))")
      .eq("id", row.appointment_id)
      .maybeSingle();

    const hostId = appt?.host_id || row.host_user_id;
    const maxAttempts = Number(row.max_attempts) || MAX_CALENDAR_SYNC_ATTEMPTS;

    // If the appointment was deleted or cancelled, never execute a queued create/reschedule.
    const effectiveOp =
      !appt || appt.status === "cancelled"
        ? "cancel"
        : row.operation;

    let succeeded = false;
    let failureReason = null;

    try {
      if (effectiveOp === "cancel") {
        const eventIdToDelete =
          row.google_event_id ||
          appt?.google_event_id ||
          (hostId && row.appointment_id ? viewingGoogleEventId(hostId, row.appointment_id) : null);

        if (!eventIdToDelete || !hostId) {
          succeeded = true;
        } else {
          succeeded = await cancelViewingMeet(hostId, eventIdToDelete);
        }

        if (succeeded && appt) {
          await serviceClient
            .from("viewing_appointments")
            .update({ meet_link: null, google_event_id: null })
            .eq("id", appt.id)
            .maybeSingle();
        }
      } else if (effectiveOp === "create") {
        // If already bound and has a Meet link, no provider call is needed
        if (appt.google_event_id && appt.meet_link) {
          succeeded = true;
        } else {
          const propertyTitle =
            appt.deals?.properties?.title || row.payload?.propertyTitle || null;
          const location =
            appt.deals?.properties?.location || row.payload?.location || null;

          const meet = await createViewingMeet(hostId, {
            appointmentId: appt.id,
            googleEventId: row.google_event_id || appt.google_event_id || null,
            propertyTitle,
            location,
            scheduledAt: appt.scheduled_at || row.payload?.scheduledAt,
            durationMinutes: appt.duration_minutes || row.payload?.durationMinutes || 45,
            notes: appt.notes || "",
          });

          if (!meet?.syncFailed && (meet?.googleEventId || meet?.meetLink)) {
            const { error: bindErr } = await serviceClient
              .from("viewing_appointments")
              .update({
                google_event_id: meet.googleEventId,
                meet_link: meet.meetLink,
              })
              .eq("id", appt.id)
              .maybeSingle();

            if (!bindErr) {
              succeeded = true;
            } else {
              failureReason = bindErr.message || "meet_binding_failed";
            }
          } else {
            failureReason = meet?.error || "meet_creation_failed";
          }
        }
      } else if (effectiveOp === "reschedule") {
        const targetEventId =
          appt.google_event_id ||
          row.google_event_id ||
          (hostId ? viewingGoogleEventId(hostId, appt.id) : null);

        const moved = await rescheduleViewingMeet(hostId, targetEventId, {
          scheduledAt: appt.scheduled_at || row.payload?.scheduledAt,
          durationMinutes: appt.duration_minutes || row.payload?.durationMinutes || 45,
        });

        if (moved) {
          succeeded = true;
        } else {
          failureReason = "google_event_not_moved";
        }
      }
    } catch (err) {
      failureReason = err?.message || "retry_exception";
    }

    if (succeeded) {
      await serviceClient
        .from("calendar_sync_queue")
        .update({
          status: "completed",
          completed_at: new Date(now).toISOString(),
          last_attempted_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", row.id);
      summary.completed += 1;
      continue;
    }

    const nextAttemptCount = (Number(row.attempt_count) || 0) + 1;
    if (nextAttemptCount >= maxAttempts) {
      await serviceClient
        .from("calendar_sync_queue")
        .update({
          status: "failed_permanent",
          attempt_count: nextAttemptCount,
          error_reason: failureReason || row.error_reason || "max_attempts_exceeded",
          last_attempted_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", row.id);
      summary.failedPermanent += 1;

      await recordSystemEvent({
        event: EVENTS.CALENDAR_SYNC_FAILED,
        severity: "error",
        subjectTable: "viewing_appointments",
        subjectId: row.appointment_id,
        summary: "Viewing calendar sync retry exhausted its maximum attempts.",
        detail: {
          operation: row.operation,
          attemptCount: nextAttemptCount,
          errorCode: failureReason || "max_attempts_exceeded",
        },
      });
    } else {
      const backoffMs = computeRetryBackoffMs(nextAttemptCount);
      await serviceClient
        .from("calendar_sync_queue")
        .update({
          status: "pending",
          attempt_count: nextAttemptCount,
          error_reason: failureReason || row.error_reason,
          last_attempted_at: new Date(now).toISOString(),
          next_attempt_at: new Date(now + backoffMs).toISOString(),
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", row.id);
      summary.retried += 1;
    }
  }

  return summary;
}

export default createViewingMeet;
