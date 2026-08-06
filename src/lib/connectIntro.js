// ─────────────────────────────────────────────────────────────────────────
// CONNECT INTRO MESSAGE  (NEW_IDEAS.md §38.3, State 1)
//
// The intro is the short note a seeker writes when spending a Connect. It is
// the ONLY thing the recipient reads before deciding to accept or decline, so
// it is rendered on a request card rather than in a chat thread.
//
// The cap exists because of where it is displayed, not to be strict. An
// uncapped message either overflows the card or gets truncated on screen —
// and silently truncating the message someone paid a Connect to send is worse
// than asking them to shorten it while they can still see what they wrote.
//
// Shared module because the limit has to hold in three places at once: the
// composer (so the user sees the ceiling), the client guard (so a paste can't
// exceed it), and the server (because the first two are only suggestions to
// anyone using curl). A hardcoded 300 in three files drifts the first time
// someone changes their mind.
// ─────────────────────────────────────────────────────────────────────────

export const INTRO_MAX = 300;

/**
 * Validates an intro message. Returns the trimmed text, or an error to show.
 *
 * Trims before measuring: trailing whitespace pushing a message over the
 * limit is an infuriating rejection with no visible cause.
 *
 * @param {string} raw
 * @returns {{ ok: true, value: string } | { ok: false, error: string }}
 */
export function validateIntroMessage(raw) {
  const value = String(raw ?? "").trim();

  if (!value) {
    return { ok: false, error: "Write a short message so they know what you're asking about." };
  }
  if (value.length > INTRO_MAX) {
    return { ok: false, error: `Keep it under ${INTRO_MAX} characters.` };
  }
  return { ok: true, value };
}

export default validateIntroMessage;
