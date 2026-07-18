// Google Calendar REST client — plain fetch, zero SDK. Operates on the user's
// primary calendar. All calls take an already-valid access token (see
// connectionStore.getValidGoogleAccessToken).
const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

async function gfetch(url, accessToken, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
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

/** List events in [timeMin, timeMax] (ISO). singleEvents expands recurring. */
export function listEvents(accessToken, { timeMin, timeMax, maxResults = 250 }) {
  const qs = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(maxResults),
    showDeleted: "true", // so remote deletions can be mirrored
  });
  return gfetch(`${CAL_BASE}?${qs}`, accessToken);
}

export function insertEvent(accessToken, body) {
  return gfetch(CAL_BASE, accessToken, { method: "POST", body: JSON.stringify(body) });
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
