// A-151 — cookie-consent state. One key, two values, fail-closed.
//
// "denied" is the default for every state that is not an explicit grant:
// nothing stored, storage unreadable, or a stored value nobody wrote. An
// unknown stored value must never read as permission (Standing Rule 6 — a
// negative check fails open; this only ever passes "granted").

export const COOKIE_CONSENT_KEY = "scoutit_cookie_consent";
export const COOKIE_CONSENT_GRANTED = "granted";
export const COOKIE_CONSENT_DENIED = "denied";

export function getCookieConsent(storage) {
  try {
    const ls =
      storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    return ls?.getItem(COOKIE_CONSENT_KEY) === COOKIE_CONSENT_GRANTED
      ? COOKIE_CONSENT_GRANTED
      : COOKIE_CONSENT_DENIED;
  } catch {
    return COOKIE_CONSENT_DENIED;
  }
}

export function setCookieConsent(value, storage) {
  const next =
    value === COOKIE_CONSENT_GRANTED
      ? COOKIE_CONSENT_GRANTED
      : COOKIE_CONSENT_DENIED;
  try {
    const ls =
      storage ?? (typeof localStorage !== "undefined" ? localStorage : null);
    ls?.setItem(COOKIE_CONSENT_KEY, next);
  } catch {
    // Storage full or blocked — the in-memory answer stays denied-safe
    // because getCookieConsent reads the same store.
  }
  return next;
}
