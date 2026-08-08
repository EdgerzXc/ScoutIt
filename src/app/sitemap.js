import { fetchProperties } from "@/lib/airtable";
import { siteUrl } from "@/lib/siteUrl";
import { LOCATION_HUB_SLUGS } from "@/lib/locationHubs";

export default async function sitemap() {
  const baseUrl = siteUrl();
  const currentDate = new Date().toISOString();

  // Core static public pages
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/discover`, lastModified: currentDate, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/brokers`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/enterprise`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/intel`, lastModified: currentDate, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/photographers`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/event-planners`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/researchers`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/badges`, lastModified: currentDate, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: currentDate, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: currentDate, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Location Hub routes (SEO-03) — RESTORED 2026-08-06 with W7.
  //
  // HISTORY, kept because the sequence is the lesson: these three slugs were
  // submitted to Google from 2026-08-05 while no `/hubs/[slug]` route existed.
  // All three returned 404, Google recorded soft-404s, and that suppressed
  // crawl budget for the pages that DO work — actively fighting §13's indexing
  // effort. W1 withheld them; W7 built `src/app/hubs/[slug]/page.js`; they are
  // now true rather than merely absent.
  //
  // ⚠️ RULE: a sitemap must never contain a URL that does not return 200.
  // Advertising a page you have not built costs more than not advertising it.
  //
  // The slugs are read from the SAME array that drives the page's
  // `generateStaticParams`, so the two cannot drift. Hardcoding them here is
  // what allowed the original mismatch — a literal list has no way to be wrong
  // out loud.
  const hubRoutes = LOCATION_HUB_SLUGS.map((slug) => ({
    url: `${baseUrl}/hubs/${slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic property pages from Airtable
  let propertyRoutes = [];
  try {
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (apiKey && baseId) {
      const properties = await fetchProperties(apiKey, baseId);
      propertyRoutes = properties
        // ── A4 · SAMPLES ARE NEVER SUBMITTED (2026-08-08) ──────────────
        // The property page also emits `noindex` for these, but a sitemap
        // entry and a noindex tag are a contradiction Google resolves by
        // crawling the URL anyway to read the tag — spending budget on a page
        // we have already said not to index.
        //
        // ⚠️ This file already carries the cost of getting that wrong once:
        // three /hubs slugs were submitted before the route existed, Google
        // recorded soft-404s, and crawl budget was suppressed. Never advertise
        // a URL we do not want fetched.
        .filter((p) => p.slug && !p.is_sample)
        .map((p) => ({
          url: `${baseUrl}/property/${p.slug}`,
          lastModified: currentDate,
          changeFrequency: "weekly",
          priority: 0.8,
        }));
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch property routes from Airtable", error);
  }

  return [...staticRoutes, ...hubRoutes, ...propertyRoutes];
}
