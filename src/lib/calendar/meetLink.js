import crypto from "crypto";

import { getValidGoogleAccessToken } from "./connectionStore";
import { insertEvent, patchEvent, deleteEvent } from "./googleClient";

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
 * Checks entryPoints as well as hangoutLink: `hangoutLink` is the classic
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
 * Builds the Google event body for a property viewing, including the
 * conference create-request.
 *
 * @param {{ propertyTitle?: string, location?: string, scheduledAt: string,
 *           durationMinutes?: number, notes?: string, attendeeEmails?: string[] }} input
 */
export function buildViewingEventBody({
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
        requestId: crypto.randomUUID(),
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

    const event = await insertEvent(accessToken, buildViewingEventBody(details), {
      conferenceDataVersion: 1,
    });

    return {
      meetLink: extractMeetLink(event),
      googleEventId: event?.id || null,
    };
  } catch (error) {
    // Expired refresh token, revoked access, Google outage, quota — none of
    // these should cost the user their booking.
    console.error("[meetLink] createViewingMeet failed:", error?.message);
    return { meetLink: null, googleEventId: null };
  }
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

export default createViewingMeet;
