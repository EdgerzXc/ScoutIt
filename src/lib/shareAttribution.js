// ═══════════════════════════════════════════════════════════════
// Share Attribution — makes a shared link measurable.
//
// WHY THIS EXISTS
// Every share surface used to strip the URL down to origin+pathname
// (CommercialFlow.js `cleanUrl`), so a link forwarded into a Viber group and
// a link typed by hand were indistinguishable. In the 7 days to 2026-08-13 GA4
// recorded ~1.15K sessions with ~1.1K of them attributed to "Direct". That is
// not a traffic problem, it is a measurement problem, and this file is the fix.
//
// PRIVACY POSTURE (owner ruling 2026-08-13)
// The owner chose PERSON-level attribution over role-level, because crediting
// the individual broker who actually moves a listing is a business need.
//
// These links get pasted into public Facebook posts, so `ref` must never carry
// identity. It carries an OPAQUE, NON-REVERSIBLE code:
//   • signed-in  → "u" + SHA-256(user id) truncated to 12 base36-ish chars
//   • anonymous  → "v" + a random code minted once and kept in localStorage
//
// A reader of a public post learns two things and no more: that the sharer was
// an account holder or not, and that two links came from the same sharer. They
// cannot recover an id, an email, or a name. The owner resolves a code back to
// a person by hashing their own user table and matching — an operation only
// someone who already holds the user list can perform.
//
// ⚠️ NEVER put a username, email, phone, or raw user id in `ref`. `refLooksSafe()`
// below is the machine-checkable statement of that rule and is covered by tests.
// ═══════════════════════════════════════════════════════════════

// The channels a share can originate from. `utm_source` is validated against
// this list so a typo can't silently create a phantom traffic source in GA4.
export const SHARE_CHANNELS = [
  "viber",
  "messenger",
  "facebook",
  "linkedin",
  "x",
  "email",
  "copy",
  "native", // the OS share sheet — we can't know where it ended up
];

export const SHARE_MEDIUM = "share";
export const SHARE_CAMPAIGN = "property_share";

const REF_STORAGE_KEY = "scoutit_share_ref";
const REF_LENGTH = 12;

// A ref is safe iff it is a single identity-class prefix followed by lowercase
// alphanumerics. Anything containing "@", ".", "-", or uppercase is a sign that
// an email, a UUID, or a display name leaked in.
const SAFE_REF = /^[uv][0-9a-z]{6,24}$/;

export function refLooksSafe(ref) {
  return typeof ref === "string" && SAFE_REF.test(ref);
}

// Reduce arbitrary bytes to a short lowercase base36 string.
function toShortCode(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length && out.length < REF_LENGTH; i += 1) {
    out += bytes[i].toString(36);
  }
  return out.slice(0, REF_LENGTH);
}

// Deterministic non-cryptographic fallback for contexts where SubtleCrypto is
// unavailable (http:// origins, very old WebViews). Still non-reversible in the
// practical sense — it discards almost all input entropy — and still opaque.
function fnv1aCode(input) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let out = h.toString(36);
  // Mix a second pass so short ids still produce a full-length code.
  let h2 = h;
  while (out.length < REF_LENGTH) {
    h2 = Math.imul(h2 ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
    out += h2.toString(36);
  }
  return out.slice(0, REF_LENGTH);
}

/**
 * Opaque, stable code for a signed-in person. Non-reversible.
 * Exported so tests can assert the same user always yields the same code and
 * that the code never contains the input.
 */
export async function refForUserId(userId) {
  const id = String(userId || "").trim();
  if (!id) return "";
  try {
    if (typeof globalThis.crypto?.subtle?.digest === "function") {
      const data = new TextEncoder().encode(`scoutit:share:${id}`);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
      return `u${toShortCode(new Uint8Array(digest))}`;
    }
  } catch {
    /* fall through to the deterministic fallback */
  }
  return `u${fnv1aCode(`scoutit:share:${id}`)}`;
}

// A per-browser visitor code, minted once. Not tied to any account, and not
// recoverable to a person by anyone — it exists so the owner can still tell
// "one visitor shared six listings" apart from "six visitors shared one each".
function visitorRef() {
  try {
    const existing = window.localStorage.getItem(REF_STORAGE_KEY);
    if (refLooksSafe(existing)) return existing;
    const bytes = new Uint8Array(REF_LENGTH);
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      globalThis.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    }
    const code = `v${toShortCode(bytes)}`;
    window.localStorage.setItem(REF_STORAGE_KEY, code);
    return code;
  } catch {
    // Private mode / storage blocked: attribution degrades to channel-only.
    return "";
  }
}

/**
 * Resolve the ref for whoever is sharing right now.
 * `userId` is optional — pass the signed-in id when the caller has it.
 * Never throws; a failure here must not block a share.
 */
export async function resolveShareRef(userId) {
  if (userId) {
    const code = await refForUserId(userId);
    if (refLooksSafe(code)) return code;
  }
  if (typeof window === "undefined") return "";
  return visitorRef();
}

/**
 * Decorate a property URL with campaign parameters.
 *
 * Existing utm and ref params are stripped first, so a link that was already
 * shared once and is now being re-shared is attributed to the NEW channel
 * rather than accumulating a chain of stale sources.
 *
 * Returns the input unchanged if it isn't a parseable URL — a share with a
 * slightly less useful link beats a share that throws.
 */
export function buildShareUrl(baseUrl, { channel, ref } = {}) {
  const raw = String(baseUrl || "");
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }

  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"].forEach((k) =>
    url.searchParams.delete(k)
  );

  const source = SHARE_CHANNELS.includes(String(channel)) ? String(channel) : "copy";
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", SHARE_MEDIUM);
  url.searchParams.set("utm_campaign", SHARE_CAMPAIGN);
  if (refLooksSafe(ref)) url.searchParams.set("ref", ref);

  return url.toString();
}

/**
 * The canonical, parameter-free URL for a property page — what belongs in the
 * page's own canonical tag and in anything user-visible that is not a share.
 */
export function cleanPropertyUrl(href) {
  try {
    const url = new URL(String(href || ""));
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(href || "");
  }
}
