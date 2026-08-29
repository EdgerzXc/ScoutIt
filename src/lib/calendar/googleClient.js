// Google Calendar REST client — plain fetch, zero SDK. Operates on the user's
// primary calendar. All calls take an already-valid access token (see
// connectionStore.getValidGoogleAccessToken).
import { fetchWithRetry } from "../fetchWithRetry";

const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

async function gfetch(url, accessToken, init = {}) {
  const method = (init.method || "GET").toUpperCase();
  const idempotentWrite = method === "PATCH" || method === "DELETE";
  const res = await fetchWithRetry(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  }, {
    retries: method === "GET" || idempotentWrite ? 2 : 0,
    budgetMs: 7000,
    attemptTimeoutMs: 4000,
    circuit: "google-calendar",
    idempotent: idempotentWrite,
  });
  if (res.status === 204) return null; // delete returns no content
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error?.message || `Google API ${res.status}`);
    err.status = res.status;
    err.googleReason = data.error?.errors?.[0]?.reason;
    throw err;
  }
  return data;
}

/** List one events page in [timeMin, timeMax]. singleEvents expands recurring. */
export function listEvents(accessToken, {
  timeMin,
  timeMax,
  maxResults = 2500,
  pageToken = null,
}) {
  const qs = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(maxResults),
    showDeleted: "true", // so remote deletions can be mirrored
  });
  if (pageToken) qs.set("pageToken", pageToken);
  return gfetch(`${CAL_BASE}?${qs}`, accessToken);
}

/**
 * Create an event.
 *
 * 'conferenceDataVersion: 1' is REQUIRED for Google to act on a
 * conferenceData.createRequest — without the query param Google silently
 * drops the request and returns an event with no Meet link and no error.
 * That silent-drop is why this is an explicit option rather than always-on.
 */
export function insertEvent(accessToken, body, { conferenceDataVersion } = {}) {
  const qs = conferenceDataVersion ? `?conferenceDataVersion=${conferenceDataVersion}` : "";
  return gfetch(`${CAL_BASE}${qs}`, accessToken, { method: "POST", body: JSON.stringify(body) });
}

export function patchEvent(accessToken, googleId, body) {
  return gfetch(`${CAL_BASE}/${encodeURIComponent(googleId)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteEvent(accessToken, googleId) {
  return gfetch(`${CAL_BASE}/${encodeURIComponent(googleId)}`, accessToken, { method: "DELETE" }).catch(
    (err) => {
      // Already gone on Google's side is fine for a delete.
      if (err.status === 404 || err.status === 410) return null;
      throw err;
    }
  );
}
