import UnitMasterPage from "@/components/property/UnitMasterPage";

import { fetchProperties } from "@/lib/airtable";
import { siteUrl } from "@/lib/siteUrl";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  let seoTitle = `Unit Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Unit-level Space Intelligence Vector";
  let imageUrl = siteUrl("/og-default.jpg");
  let url = siteUrl(`/property/${resolvedParams.id}/unit/${resolvedParams.unitId}`);

  if (apiKey && baseId) {
    try {
      const properties = await fetchProperties(apiKey, baseId);
      const match = properties.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
          (p.id && p.id === resolvedParams.id)
      );
      if (match) {
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
// This route's generateMetadata was already correct, so crawlers received a
// good <title> around a body that said only "Loading Unit Intelligence…".
// Unit pages are the largest unrealised SEO asset on ScoutIt — each child Space
// is genuinely distinct content, not a spun variant — so an empty body here is
// the original SEO thesis going unbanked.
//
// ⚠️ PUBLIC, ANONYMOUS SURFACE. Server components serialise props into the
// HTML, so the record is stripped to the `starry` (public) tier before it is
// handed to the client — same guard as /property and /hubs/[slug] (§45).
async function loadUnitProperty(idOrSlug) {
  try {
    const { getCmsBundle } = await import("@/lib/cmsCache");
    const { stripPremiumFields } = await import("@/lib/premiumFields");
    const bundle = await getCmsBundle();
    const match = (bundle?.properties || []).find(
      (p) =>
        (p.slug && p.slug.toLowerCase() === String(idOrSlug).toLowerCase()) ||
        (p.id && p.id === idOrSlug)
    );
    return match ? stripPremiumFields(match, "starry") : null;
  } catch (err) {
    // Degrade to the client fetch rather than 500 the page.
    console.error("[unit page] server CMS load failed:", err?.message);
    return null;
  }
}

export default async function UnitRoute({ params }) {
  const resolvedParams = await params;
  const initialProperty = await loadUnitProperty(resolvedParams.id);

  return (
    <UnitMasterPage
      slug={resolvedParams.id}
      unitId={resolvedParams.unitId}
      initialProperty={initialProperty}
    />
  );
}
