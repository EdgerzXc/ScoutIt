// ═══════════════════════════════════════════════════════════════
// DEV-ONLY fallback. Read this before "fixing" it again.
//
// This is NOT an SEO/canonical URL and never reaches a crawler. Its only
// caller is `fetchDevelopmentLiveCms()` in cmsCache.js, which returns null
// unless NODE_ENV === "development" (cmsCache.js:48). It exists so a local
// dev machine with no Airtable keys can borrow the live site's CMS bundle.
//
// Changed 2026-08-08 from "https://scout-it.vercel.app/api/cms" to the real
// domain — not for SEO, but because the Vercel-generated host is outside our
// control and silently breaks local dev the day the project is renamed or
// redeployed under a different slug. Override per-machine with
// SCOUTIT_LIVE_CMS_URL.
// ═══════════════════════════════════════════════════════════════
export const DEFAULT_LIVE_CMS_URL = "https://www.scoutit.space/api/cms";

const AIRTABLE_BACKED_SOURCE = /^(airtable|upstash_redis)(?:_|$)/;

export function normalizeLiveCmsBundle(bundle) {
  if (!bundle || !Array.isArray(bundle.properties) || !Array.isArray(bundle.brokers)) {
    throw new Error("Live Vercel CMS returned an invalid bundle");
  }

  const source = String(bundle.source || "");
  if (!AIRTABLE_BACKED_SOURCE.test(source)) {
    throw new Error(`Live Vercel CMS is not Airtable-backed (source: ${source || "missing"})`);
  }

  return {
    ...bundle,
    intel: Array.isArray(bundle.intel) ? bundle.intel : [],
    homepage: bundle.homepage || null,
    source: `${source}_via_live_vercel`,
  };
}
