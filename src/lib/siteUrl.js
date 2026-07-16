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
