// ═══════════════════════════════════════════════════════════════
// A-126 — the right to erasure has a button
//
// One source for the confirmation phrase (the route checks it, the screen asks
// for it), for the plain-language names of what the route erases, and for
// reading the route's answer — so a partial erasure can never render as a
// completed one. The route's own honesty (A-075) is only half the job: the
// screen must not turn a truthful 500 back into "done".
// ═══════════════════════════════════════════════════════════════

export const ERASURE_CONFIRMATION = "DELETE MY ACCOUNT";

// Keyed by the table `/api/user/delete-account` erases. A contract test fails if
// the route erases a table this list does not name, or this list names one the
// route does not erase — the screen may only claim what the route does.
export const ERASED_DATA_LABELS = Object.freeze({
  saved_intel: "Properties you saved to Your Board",
  analytics_events: "Your viewing and search history",
  privacy_settings: "Your privacy choices",
  user_notifications: "Your notifications",
  private_notifications: "Your private notifications",
  user_availability: "Your viewing availability",
  calendar_events: "Your calendar events",
  calendar_connections: "Your connected calendars, including their access keys",
});

/**
 * @param {{ ok?: boolean, status?: number, body?: object|null }} response
 * @returns {{ state: "deleted"|"partial"|"failed", message: string, warning?: string }}
 */
export function interpretErasureResponse({ ok = false, status = 0, body = null } = {}) {
  const payload = body && typeof body === "object" ? body : {};

  // All three, or it is not "deleted": a 200 that drops `accountAccessRevoked`
  // must not read as a closed sign-in.
  if (ok && payload.success === true && payload.accountAccessRevoked === true) {
    return {
      state: "deleted",
      message: payload.message || "Your account and private data have been deleted.",
      ...(payload.warning ? { warning: payload.warning } : {}),
    };
  }

  const erasedSomething = Array.isArray(payload.erased) && payload.erased.length > 0;
  if (payload.accountAccessRevoked === false || erasedSomething) {
    return {
      state: "partial",
      message:
        payload.error ||
        "Your account was only partly deleted. Please contact us so it can be finished.",
    };
  }

  let fallback = "The deletion did not go through. Please try again, or contact us.";
  if (status === 401) fallback = "Your session has expired. Sign in again, then try once more.";
  if (status === 0) fallback = "We couldn't confirm whether your account was deleted. Check again in a moment, or contact us.";
  return { state: "failed", message: payload.error || fallback };
}
