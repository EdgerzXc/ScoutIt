// ---------------------------------------------------------------------------
// ONE WAY TO NAME A CALLER — A-012
//
// Before this file there were three hand-rolled copies of the same header walk:
// one private to /api/telemetry/device, one added by U-010 to /api/reactions,
// and clientIpFrom() in turnstile.js. Three copies of a rate-limit key is three
// chances for them to disagree about who is being metered.
//
// -- WHY THE FALLBACK IS A STRING AND NOT null -----------------------------
// A limiter keyed on null (or on undefined) puts every unidentifiable caller in
// ONE bucket. That is not a neutral default: it means a handful of header-less
// requests can exhaust the shared budget and start returning 429 to unrelated
// people. Returning a constant makes that behaviour explicit rather than
// accidental -- callers we cannot tell apart are metered together, on purpose,
// and the constant is greppable when that turns out to matter.
//
// On Vercel x-forwarded-for is always present, so UNKNOWN_CALLER is an edge
// case rather than a normal path.
// ---------------------------------------------------------------------------

export const UNKNOWN_CALLER = "unknown";

/**
 * The metering identity for a request.
 *
 * x-forwarded-for is a comma-separated chain and the FIRST entry is the client;
 * later entries are proxies. Taking the last one would meter our own edge.
 *
 * @param {Request} request
 * @returns {string} never empty -- see UNKNOWN_CALLER above
 */
export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    UNKNOWN_CALLER
  );
}

export default clientIp;
