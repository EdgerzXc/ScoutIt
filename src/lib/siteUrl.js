// Canonical site URL resolution:
// 1. NEXT_PUBLIC_SITE_URL (custom domain override)
// 2. VERCEL_PROJECT_PRODUCTION_URL
// 3. VERCEL_URL (preview deployment)
// 4. https://www.scoutit.space fallback

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
  return "https://www.scoutit.space";
}

export const SITE_URL = resolveBase();

export function siteUrl(path = "") {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

const KNOWN_DOMAINS = [
  "www.scoutit.space",
  "scoutit.space",
  "scoutit.ph", // earlier candidate kept for redirect safety
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
