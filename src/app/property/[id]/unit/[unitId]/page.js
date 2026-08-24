import UnitMasterPage from "@/components/property/UnitMasterPage";
import { notFound } from "next/navigation";

import { loadPublicProperty, resolvePublicChildSpace } from "@/lib/publicPropertyRouteData";
import { stripPremiumFields } from "@/lib/premiumFields";
import { siteUrl } from "@/lib/siteUrl";
import { childSpaceDisplayName, getPropertyHierarchy } from "@/lib/propertyHierarchy";

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
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const match = await loadPublicProperty(resolvedParams.id);
  if (!match) notFound();
  const unit = resolvePublicChildSpace(match, resolvedParams.unitId);
  if (!unit) notFound();

  let imageUrl = siteUrl("/og-default.jpg");
  const isSample = Boolean(match.is_sample);
  const unitIndex = match.units_inventory.indexOf(unit);
  const hierarchy = getPropertyHierarchy(match);
  const displayName = childSpaceDisplayName(unit.name, unitIndex, match);
  const seoTitle = `${displayName} · ${match.title} | ScoutIt`;
  const seoDescription = `${hierarchy.childLabel} at ${match.title}${unit.size ? `, ${unit.size} sqm` : ""}. Explore its floor plan, layout, and listing context on ScoutIt.`;
  const url = siteUrl(`/property/${match.slug || resolvedParams.id}/unit/${resolvedParams.unitId}`);
  const photo = Array.isArray(unit.photos) && unit.photos.length > 0
    ? unit.photos.find(Boolean)
    : (unit.image || unit.photo);

  if (photo) {
    imageUrl = photo;
  } else {
    const propPhoto = Array.isArray(match.photos) ? match.photos.find(Boolean) : (match.photo || match.image);
    if (propPhoto) imageUrl = propPhoto;
  }

  return {
    title: seoTitle,
    description: seoDescription,
    // A sample's children are samples too and must stay out of indexing.
    ...(isSample ? { robots: { index: false, follow: true } } : {}),
    alternates: { canonical: url },
    ...(isSample ? {} : {
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url,
        siteName: "ScoutIt",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: seoTitle }],
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: seoTitle,
        description: seoDescription,
        images: [imageUrl],
      },
    }),
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
  const match = await loadPublicProperty(resolvedParams.id);
  if (!match || !resolvePublicChildSpace(match, resolvedParams.unitId)) notFound();
  const initialProperty = stripPremiumFields(match, "starry");

  return (
    <UnitMasterPage
      slug={resolvedParams.id}
      unitId={resolvedParams.unitId}
      initialProperty={initialProperty}
    />
  );
}
