// ---------------------------------------------------------------------------
// WHAT PROMOTE SHOWS WHEN THE AI CALL DOES NOT LAND — A-014
//
// PromoteModal used to collapse every non-OK response into one string and stop:
// the user opened "1-Click AI Promote", waited, and got
// "Couldn't promote this listing." with nowhere to go.
//
// That was a choice, not a limit. buildPromoPack() in src/lib/shareBriefing.js
// produces the same three formats from the listing's own recorded facts, with no
// AI call, no network and no tier resolution — and ShareModal already calls it
// client-side. The complete answer was one function away the entire time.
//
// -- THE RULE THIS FILE ENCODES --------------------------------------------
// Degrade, then explain, and never misrepresent which version the user is
// looking at. Handing someone deterministic template copy while the header
// still says "AI-drafted" would be the same class of untruth as an endpoint
// returning ok:true after a failed write.
// ---------------------------------------------------------------------------

// Every 429 from this app sets Retry-After, but a proxy or an edge cache can
// strip it. A number the UI invented would be a guess presented as fact, so
// this constant exists to be rendered as words instead of digits.
export const RETRY_UNKNOWN = -1;

const RATE_LIMITED = 429;

function retryPhrase(seconds) {
  if (seconds === RETRY_UNKNOWN) return "in a moment";
  if (seconds < 60) return `in ${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return `in about ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * @param {{ status: number, retryAfterSeconds?: number|null }} response
 * @returns {{
 *   kind: "rate-limited"|"unavailable",
 *   message: string,
 *   retryAfterSeconds: number|null,
 *   canUseLocalPack: true,
 *   localPackLabel: string,
 * }|null} null when nothing failed
 */
export function promoteFailureState({ status, retryAfterSeconds } = {}) {
  if (status >= 200 && status < 300) return null;

  // The local pack never depends on the network, so it is available on every
  // failure path without exception. This is deliberately not conditional.
  const shared = {
    canUseLocalPack: true,
    localPackLabel: "Written from this listing's recorded facts",
  };

  if (status === RATE_LIMITED) {
    const parsed = Number(retryAfterSeconds);
    const seconds = Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : RETRY_UNKNOWN;

    return {
      ...shared,
      kind: "rate-limited",
      retryAfterSeconds: seconds,
      message: `AI drafting is busy. Try again ${retryPhrase(seconds)}.`,
    };
  }

  return {
    ...shared,
    kind: "unavailable",
    // No Retry-After exists for a 500, and inventing one would train people to
    // retry on a schedule we made up.
    retryAfterSeconds: null,
    message: "AI drafting is unavailable right now.",
  };
}

export default promoteFailureState;
