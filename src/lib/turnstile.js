// ═══════════════════════════════════════════════════════════════
// CLOUDFLARE TURNSTILE — canonical server-side siteverify
//
// The ONE place ScoutIt verifies a Turnstile token. Every protected endpoint
// calls verifyTurnstile() rather than hand-rolling the fetch, so the
// fail-closed behaviour and the error mapping stay consistent.
//
// Widget: ScoutIT (0x4AAAAAAEBKY_THgx04YAyO) — existing, not recreated.
//
// ── SECRET ──────────────────────────────────────────────────────────
// Read from TURNSTILE_SECRET, falling back to the legacy
// TURNSTILE_SECRET_KEY name already present in .env.local so nothing
// breaks during the rename. NEVER inlined, never sent to the browser.
//
// ── FAIL CLOSED IN PRODUCTION ───────────────────────────────────────
// The previous implementation defaulted to Cloudflare's TEST secret
// (1x0000000000000000000000000000000AA), which makes siteverify return
// success for ANY token — including no token at all. That meant if the env
// var was ever unset in production, bot protection silently evaporated
// while still looking configured.
//
// Now: a missing secret in production is a hard failure. In development the
// test key is still allowed, because local work shouldn't need real creds.
//
// ── TOKENS ARE SINGLE-USE ───────────────────────────────────────────
// A token is redeemed exactly once at siteverify. If verification fails,
// the browser still holds the spent token in the DOM — a naive retry sends
// the same one and Cloudflare rejects it as `timeout-or-duplicate`. The
// frontend MUST call turnstile.reset() before allowing a retry. See
// <TurnstileGate /> which handles this.
// ═══════════════════════════════════════════════════════════════

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CF_TEST_SECRET = "1x0000000000000000000000000000000AA";
const TIMEOUT_MS = 8000;

/** Human-readable mapping for Cloudflare's error-codes. */
const ERROR_MESSAGES = {
  "missing-input-secret": "Captcha is not configured on the server.",
  "invalid-input-secret": "Captcha is misconfigured on the server.",
  "missing-input-response": "Please complete the captcha.",
  "invalid-input-response": "Captcha check failed. Please try again.",
  "timeout-or-duplicate": "That captcha was already used. Please try again.",
  "bad-request": "Captcha check failed. Please try again.",
  "internal-error": "Captcha service had a problem. Please try again.",
};

/**
 * Resolves the secret, or null when unavailable.
 * In production the test secret is refused outright — it would turn
 * verification into a no-op that still reports success.
 */
function resolveSecret() {
  const secret = process.env.TURNSTILE_SECRET || process.env.TURNSTILE_SECRET_KEY || null;
  const isProd = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProd) return null;
    return CF_TEST_SECRET; // dev convenience only
  }

  if (isProd && secret === CF_TEST_SECRET) {
    console.error(
      "[turnstile] TURNSTILE_SECRET is Cloudflare's TEST secret in production — " +
      "siteverify would pass every request. Refusing to verify.",
    );
    return null;
  }

  return secret;
}

/**
 * Verifies a Turnstile token server-side.
 *
 * Fails CLOSED: any network error, non-2xx, non-JSON body, missing secret or
 * unsuccessful result yields ok:false. A captcha that can't be checked is a
 * captcha that didn't pass.
 *
 * @param {string} token - the 'cf-turnstile-response' value from the client
 * @param {{ remoteIp?: string|null }} [options]
 * @returns {Promise<{ ok: boolean, message: string|null, codes: string[] }>}
 */
export async function verifyTurnstile(token, { remoteIp = null } = {}) {
  if (!token || typeof token !== "string") {
    return { ok: false, message: ERROR_MESSAGES["missing-input-response"], codes: ["missing-input-response"] };
  }

  const secret = resolveSecret();
  if (!secret) {
    return { ok: false, message: ERROR_MESSAGES["missing-input-secret"], codes: ["missing-input-secret"] };
  }

  const body = new URLSearchParams({ secret, response: token });
  // remoteip is optional but tightens the check. Only send a single usable
  // address — X-Forwarded-For can be a comma-separated chain and Cloudflare
  // rejects the whole header verbatim.
  if (remoteIp) body.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`siteverify ${res.status}`);

    const data = await res.json();
    const codes = Array.isArray(data?.["error-codes"]) ? data["error-codes"] : [];

    if (data?.success === true) return { ok: true, message: null, codes: [] };

    const message = ERROR_MESSAGES[codes[0]] || ERROR_MESSAGES["invalid-input-response"];
    // Server-side misconfiguration deserves a loud log; a bot failing does not.
    if (codes.includes("invalid-input-secret") || codes.includes("missing-input-secret")) {
      console.error("[turnstile] secret rejected by Cloudflare:", codes);
    }
    return { ok: false, message, codes };
  } catch (error) {
    clearTimeout(timer);
    console.error("[turnstile] siteverify unreachable:", error?.message);
    return { ok: false, message: ERROR_MESSAGES["internal-error"], codes: ["internal-error"] };
  }
}

/**
 * Best usable client IP for 'remoteip'.
 *
 * X-Forwarded-For may be "client, proxy1, proxy2" — the FIRST entry is the
 * original client. Passing the raw header makes Cloudflare reject it.
 *
 * @param {Request} request
 * @returns {string|null}
 */
export function clientIpFrom(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || null;
}

/**
 * Route guard. Returns null when the token is valid, or a ready-to-return
 * 403 Response when it isn't.
 *
 * @param {Request} request
 * @param {string} token
 * @returns {Promise<Response|null>}
 */
export async function turnstileGuard(request, token) {
  const result = await verifyTurnstile(token, { remoteIp: clientIpFrom(request) });
  if (result.ok) return null;

  return Response.json(
    { ok: false, success: false, error: result.message, message: result.message },
    { status: 403 },
  );
}

export default verifyTurnstile;
