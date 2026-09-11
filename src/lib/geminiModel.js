// One place for the Gemini model id. The hardcoded "gemini-2.5-flash" broke
// every AI route in July 2026 when Google retired it for new API keys — the
// "-latest" alias tracks whatever flash model is current, so it can't rot.
// Override per-deploy with GEMINI_MODEL if a specific pin is ever needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

// A-124 fix 2 (main site) — the free backup. Measured 2026-09-11: the model above
// answered 503 "high demand" 3 of 3 times while this one answered on the same
// key. Same free key, so nothing new to pay for. Floats for the same reason.
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";

// Busy (429 / 5xx) or retired (404) → try the backup. 400 / 401 / 403 → a bad
// request or key fails the same way on every model, so stop there.
const HAND_OVER_STATUSES = new Set([404, 429, 500, 502, 503, 504]);

function shouldHandOver(error) {
  const status = error?.status;
  // No status means the request never got an answer (a dropped connection).
  return typeof status !== "number" || HAND_OVER_STATUSES.has(status);
}

/**
 * `ai.models.generateContent` with the free backup model: the same request and
 * config, only the model changes. Throws the last error when both fail, so each
 * route's own fallback (fact sheet, naive mapping, error message) still runs.
 */
export async function generateWithFallback(ai, request) {
  let lastError;
  for (const model of new Set([GEMINI_MODEL, GEMINI_FALLBACK_MODEL])) {
    try {
      return await ai.models.generateContent({ ...request, model });
    } catch (error) {
      lastError = error;
      if (!shouldHandOver(error)) throw error;
    }
  }
  throw lastError;
}
