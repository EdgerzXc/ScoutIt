import UnitMasterPage from "@/components/property/UnitMasterPage";

import { getCmsBundle } from "@/lib/cmsCache";
import { stripPremiumFields } from "@/lib/premiumFields";
import { siteUrl } from "@/lib/siteUrl";

// ═══════════════════════════════════════════════════════════════
// ONE CACHED LOAD FOR BOTH generateMetadata AND THE PAGE.
//
// 🔴 WAS `fetchProperties(apiKey, baseId)` — a RAW, UNCACHED Airtable table
// scan, run on every single request, purely to build a <title>.
//
// That slowness had a visible SEO cost. Next streams metadata it cannot
// resolve quickly: the deployed unit page was emitting only three <meta> tags
// in <head> and pushing title/description/og to the END OF THE BODY. The
// parent /property/[id] page, which is not doing an uncached scan, had its
// full head intact. Same framework, same metadata shape — the difference was
// how long generateMetadata took to return.
//
// `getCmsBundle()` is memory-cached for 60s and Redis-cached for 10 min, and
// Next dedupes it across generateMetadata and the page render — so this route
// went from THREE data loads per request (metadata scan + page load + the
// client's own /api/cms fetch) to one shared, cached read.
// ═══════════════════════════════════════════════════════════════
async function findProperty(idOrSlug) {
  try {
    const bundle = await getCmsBundle();
    return (
      (bundle?.properties || []).find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === String(idOrSlug).toLowerCase()) ||
          (p.id && p.id === idOrSlug)
      ) || null
    );
  } catch (err) {
    console.error("[unit page] CMS load failed:", err?.message);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;

  let seoTitle = `Unit Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Unit-level Space Intelligence Vector";
  let imageUrl = siteUrl("/og-default.jpg");
  let url = siteUrl(`/property/${resolvedParams.id}/unit/${resolvedParams.unitId}`);
  let isSample = false;

  {
    try {
      const match = await findProperty(resolvedParams.id);
      if (match) {
        isSample = Boolean(match.is_sample);
        const unit = (match.units_inventory || []).find(u => u.id === resolvedParams.unitId);
        if (unit) {
          seoTitle = `${unit.name} · ${match.title} | ScoutIt`;
          seoDescription = `Premium ${unit.size ? `${unit.size} sqm ` : ""}space at ${match.title}. Explore floor plans, 3D layouts, and pricing on ScoutIt.`;
          
          const photo = Array.isArray(unit.photos) && unit.photos.length > 0 
            ? unit.photos.find(Boolean) 
            : (unit.image || unit.photo);
            
          if (photo) {
            imageUrl = photo;
          } else {
            // Fallback to property photo if unit has no photo
            const propPhoto = Array.isArray(match.photos) ? match.photos.find(Boolean) : (match.photo || match.image);
            if (propPhoto) imageUrl = propPhoto;
          }
        }
        if (match.slug) url = siteUrl(`/property/${match.slug}/unit/${resolvedParams.unitId}`);
      }
    } catch {}
  }

  return {
    title: seoTitle,
    description: seoDescription,
    // ── A4 · A SAMPLE'S CHILDREN ARE SAMPLES TOO (2026-08-08) ─────────
    // Marking the parent `noindex` does nothing for its unit pages — they are
    // separate URLs with their own metadata. And unit pages are exactly where
    // this bites hardest: they are the long-tail surface ("5BR Ridgeline",
    // "Unit 3801"), so a fabricated parent would put invented, highly specific
    // listings into the index at the greatest volume.
    ...(isSample ? { robots: { index: false, follow: true } } : {}),
    // Declare our own canonical, otherwise src/app/property/layout.js's
    // "/property" canonical is inherited here too.
    alternates: { canonical: url },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: url,
      siteName: 'ScoutIt',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: seoTitle,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description: seoDescription,
      images: [imageUrl],
    },
  };
}

// ── SERVER-RENDER THE UNIT BODY (2026-08-08 · ACTION 01_NOW D2) ─────
// This body used to be "Loading Unit Intelligence…" for anyone without JS,
// while generateMetadata above produced a perfectly good <title> around it.
// Unit pages are the largest unrealised SEO asset on ScoutIt — each child Space
// is genuinely distinct content — so an empty body here was the original SEO
// thesis going unbanked.
//
// Uses the SAME `findProperty` as generateMetadata, so Next serves both from
// one cached read instead of scanning Airtable twice per request.
//
// ⚠️ PUBLIC, ANONYMOUS SURFACE. Server components serialise props into the
// HTML, so the record is stripped to the `starry` (public) tier before it
// reaches the client — same guard as /property and /hubs/[slug] (§45).
export default async function UnitRoute({ params }) {
  const resolvedParams = await params;
  const match = await findProperty(resolvedParams.id);
  const initialProperty = match ? stripPremiumFields(match, "starry") : null;

  return (
    <UnitMasterPage
      slug={resolvedParams.id}
      unitId={resolvedParams.unitId}
      initialProperty={initialProperty}
    />
  );
}
