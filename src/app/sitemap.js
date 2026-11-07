import { getCmsBundle } from "@/lib/cmsCache";
import { siteUrl } from "@/lib/siteUrl";
import { LOCATION_HUB_SLUGS } from "@/lib/locationHubs";

// Next caches metadata routes by default. Dynamic inventory must follow a
// publish/takedown purge instead of freezing at the last deployment build.
export const dynamic = "force-dynamic";

/** Safe ISO date normalizer with fallback for sitemap entries (D-10) */
export function safeIsoDate(candidate, fallback) {
  if (!candidate) return fallback;
  const d = new Date(candidate);
  return Number.isFinite(d.getTime()) ? d.toISOString() : fallback;
}

export const STATIC_SITEMAP_DATE = process.env.VERCEL_GIT_COMMIT_DATE
  ? safeIsoDate(process.env.VERCEL_GIT_COMMIT_DATE, "2026-11-01T00:00:00.000Z")
  : "2026-11-01T00:00:00.000Z";

export default async function sitemap() {
  const baseUrl = siteUrl();

  // Core static public pages (stamped with stable baseline instead of dynamic fetch time)
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/discover`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/property`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/brokers`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/pricing`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/enterprise`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/intel`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/photographers`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/event-planners`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/researchers`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/badges`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/showcase`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/stratosphere`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/community`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/pricing/owner`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/pricing/broker`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/pricing/seeker`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/pricing/creator`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/pricing/bundles`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/platform-tour`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/tutorials/owner-publish`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/transit`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/about-you`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/terms`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: STATIC_SITEMAP_DATE, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Location Hub routes (SEO-03) — RESTORED 2026-08-06 with W7.
  const hubRoutes = LOCATION_HUB_SLUGS.map((slug) => ({
    url: `${baseUrl}/hubs/${slug}`,
    lastModified: STATIC_SITEMAP_DATE,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // All dynamic URLs use the same public catalogue snapshot. A crawler must
  // not trigger three independent Airtable table reads on every sitemap hit.
  let bundle = null;
  try {
    const candidate = await getCmsBundle();
    if (candidate.source !== "empty_fallback_on_error") bundle = candidate;
  } catch (error) {
    console.error("Sitemap: Failed to load public catalogue", error);
  }
  if (!bundle) {
    // A cold upstream outage is not evidence that every published URL vanished.
    // Let crawlers retry instead of returning a misleading static-only sitemap.
    throw new Error("Sitemap: public catalogue temporarily unavailable");
  }

  // Dynamic property pages and child space units from the published catalogue (GAP-10)
  let propertyRoutes = [];
  let unitRoutes = [];
  try {
    if (bundle) {
      const publicProperties = bundle.properties
        // ── A4 · SAMPLES ARE NEVER SUBMITTED (2026-08-08) ──────────────
        // The property page also emits `noindex` for these, but a sitemap
        // entry and a noindex tag are a contradiction Google resolves by
        // crawling the URL anyway to read the tag — spending budget on a page
        // we have already said not to index.
        .filter((p) => p.slug && !p.is_sample);

      propertyRoutes = publicProperties.map((p) => ({
        url: `${baseUrl}/property/${p.slug}`,
        lastModified: safeIsoDate(p.last_verified_date || p.updated_at || p.created_at, STATIC_SITEMAP_DATE),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

      unitRoutes = publicProperties.flatMap((p) => {
        if (!Array.isArray(p.units_inventory)) return [];
        return p.units_inventory
          .map((u) => u?.id || u?.unit_id || u?.unitId)
          .filter(Boolean)
          .map((unitId) => {
            const unitObj = p.units_inventory.find(
              (u) => (u?.id || u?.unit_id || u?.unitId) === unitId
            );
            return {
              url: `${baseUrl}/property/${p.slug}/unit/${unitId}`,
              lastModified: safeIsoDate(
                unitObj?.last_verified_date || unitObj?.updated_at || p.last_verified_date || p.updated_at,
                STATIC_SITEMAP_DATE
              ),
              changeFrequency: "weekly",
              priority: 0.7,
            };
          });
      });
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch property routes from Airtable", error);
  }

  // Published intel articles.
  let intelRoutes = [];
  try {
    if (bundle) {
      intelRoutes = bundle.intel
        .filter((a) => a.slug)
        .map((a) => ({
          url: `${baseUrl}/intel/${a.slug}`,
          lastModified: safeIsoDate(a.date || a.published_at || a.created_at, STATIC_SITEMAP_DATE),
          changeFrequency: "monthly",
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch intel routes from Airtable", error);
  }

  // Public broker dossiers, addressed by record id the way the page resolves them.
  let brokerRoutes = [];
  try {
    if (bundle) {
      brokerRoutes = bundle.brokers
        .filter((b) => b.id && b.isExample !== true)
        .map((b) => ({
          url: `${baseUrl}/brokers/${b.id}`,
          lastModified: safeIsoDate(b.last_verified_date || b.updated_at || b.created_at, STATIC_SITEMAP_DATE),
          changeFrequency: "weekly",
          priority: 0.7,
        }));
    }
  } catch (error) {
    console.error("Sitemap: Failed to fetch broker routes from Airtable", error);
  }

  return [...staticRoutes, ...hubRoutes, ...propertyRoutes, ...unitRoutes, ...intelRoutes, ...brokerRoutes];
}
