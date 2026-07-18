// Signed, short-lived OAuth "state" token.
//
// The OAuth start endpoint is authenticated (bearer token), but the Google
// callback is a top-level browser redirect that carries no Authorization
// header. To bind the callback back to the user who initiated it, we embed the
// userId in a HMAC-signed state param that Google echoes back. The callback
// verifies the signature and expiry before trusting the userId — this also
// doubles as CSRF protection on the callback.
import crypto from "crypto";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete the consent flow

function getSecret() {
  // Reuse the token-encryption key as the HMAC secret (server-only, high entropy).
  const s = process.env.CALENDAR_TOKEN_KEY;
  if (!s) throw new Error("CALENDAR_TOKEN_KEY not set — cannot sign OAuth state.");
  return s;
}

function b64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Create a signed state string binding this userId + provider to the flow. */
export function signState({ userId, provider }) {
  const payload = { u: userId, p: provider, t: Date.now(), n: crypto.randomBytes(8).toString("hex") };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("hex");
  return `${body}.${sig}`;
}

/**
 * Verify a state string. Returns { userId, provider } on success, or null if the
 * signature is invalid or the state has expired.
 */
export function verifyState(state) {
  if (!state || typeof state !== "string" || !state.includes(".")) return null;
  const [body, sig] = state.split(".");
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("hex");
  // Constant-time compare to avoid timing leaks.
  const a = Buffer.from(sig || "", "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload?.u || Date.now() - payload.t > STATE_TTL_MS) return null;
  return { userId: payload.u, provider: payload.p };
}
