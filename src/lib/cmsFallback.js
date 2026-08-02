export const DEFAULT_LIVE_CMS_URL = "https://scout-it.vercel.app/api/cms";

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
