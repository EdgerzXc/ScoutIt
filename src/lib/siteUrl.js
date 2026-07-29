// ═══════════════════════════════════════════════════════════════
// Canonical site URL — the ONE place absolute URLs come from.
//
// Previously OG images and share links were hardcoded to scoutit.com,
// a domain we don't own, so every social preview card 404'd. This
// resolves the real deployment URL instead:
//   1. NEXT_PUBLIC_SITE_URL   — set this once a custom domain exists
//   2. Vercel's production URL for the current project
//   3. Vercel's per-deployment URL (previews)
//   4. the main live site as a last resort
// ═══════════════════════════════════════════════════════════════

function resolveBase() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://scout-it.vercel.app";
}

export const SITE_URL = resolveBase();

export function siteUrl(path = "") {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

// ═══════════════════════════════════════════════════════════════
// OWN DOMAINS — the single list of hosts that count as "us"
//
// Anything checking "is this link ours?" MUST read this, never hardcode a
// hostname. The domain moved from scoutit.ph to scoutit.space on 2026-07-29,
// and the reason this exists is that the hostname was hardcoded in the
// contact-leak filter's external-link rule — so after the move, a user
// pasting a legitimate scoutit.space link into a FAQ answer would have been
// rejected as "external". Silent, and it would have looked like the filter
// being flaky rather than a stale constant.
//
// Both domains stay listed: scoutit.ph may still redirect, and links already
// shared in older content shouldn't suddenly become "external".
// ═══════════════════════════════════════════════════════════════
// ⚠️ NEITHER DOMAIN IS OWNED YET (as of 2026-07-29). scoutit.space is the
// INTENDED domain — chosen for brand fit and cost, to be purchased before
// launch. Both are listed now so the switch needs no code change: whichever
// is bought, links to it are already trusted.
//
// Live traffic currently runs on the Vercel host, which currentHost() adds
// automatically. See NEW_IDEAS_TO_CLAUDE_CODE.md "PENDING CHANGES REGISTER".
const KNOWN_DOMAINS = [
  "scoutit.space", // INTENDED primary — not yet purchased
  "scoutit.ph",    // earlier candidate — kept in case it's used or redirects
];

/** Bare hostname of SITE_URL, so preview/vercel URLs count as ours too. */
function currentHost() {
  try {
    return new URL(SITE_URL).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export const OWN_DOMAINS = [...new Set([...KNOWN_DOMAINS, currentHost()].filter(Boolean))];

/**
 * Regex-escaped alternation of our domains, for building patterns.
 * e.g. "scoutit\.space|scoutit\.ph|scout-it\.vercel\.app"
 */
export function ownDomainsPattern() {
  return OWN_DOMAINS.map((d) => d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

/**
 * Is this URL or hostname one of ours?
 * @param {string} value - a full URL or a bare hostname
 */
export function isOwnDomain(value) {
  if (!value) return false;
  let host = String(value).trim().toLowerCase();
  try {
    host = new URL(host.includes("://") ? host : `https://${host}`).hostname;
  } catch {
    return false;
  }
  host = host.replace(/^www\./, "");
  return OWN_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}
