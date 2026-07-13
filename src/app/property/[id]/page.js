// Case-sensitivity routing diagnostics trigger and async params fix
import { notFound } from "next/navigation";

import { fetchProperties } from "@/lib/airtable";
import ResidentialFlow from "@/components/property/ResidentialFlow";
import CommercialFlow from "@/components/property/CommercialFlow";

// ----------------------------------------------------------------------
// INCREMENTAL STATIC REGENERATION (ISR)
// ----------------------------------------------------------------------
export const revalidate = 3600; 

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  let seoTitle = `Property Intel — ${resolvedParams.id} — ScoutIt`;
  let seoDescription = "Property Intelligence Vector";
  let imageUrl = "https://scoutit.com/og-default.jpg";
  let url = `https://scoutit.com/property/${resolvedParams.id}`;

  if (apiKey && baseId) {
    try {
      const properties = await fetchProperties(apiKey, baseId);
      const match = properties.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
          (p.id && p.id === resolvedParams.id)
      );
      if (match) {
        const title = match.title || "Premium Space";
        const cat = match.spaceCategory || match.category || "Commercial Space";
        const details = typeof match.details === 'string' ? JSON.parse(match.details || '{}') : (match.details || {});
        const sqm = details.Floor_Area_Sqm || details.CM_Total_GLA || details.RST_Floor_Area_Sqm || details.VEN_Floor_Area_Sqm || details.HOSP_GFA || "";

        if (match.seo_title) seoTitle = match.seo_title;
        else seoTitle = `${title} | ${sqm ? sqm + ' sqm ' : ''}${cat}`;
        
        if (match.seo_description) seoDescription = match.seo_description;
        else seoDescription = `A premium architectural asset in ${match.location || "the Philippines"}. Explore the full market briefing and operational context on ScoutIt.`;

        // Find the highest resolution photo (usually the first one)
        const photo = Array.isArray(match.photos) ? match.photos.find(Boolean) : (match.photo || match.image);
        
        const ogParams = new URLSearchParams();
        ogParams.set('title', title);
        ogParams.set('category', cat);
        if (sqm) ogParams.set('sqm', sqm);
        if (photo) ogParams.set('image', photo);

        imageUrl = `https://scoutit.com/api/og?${ogParams.toString()}`;
        
        if (match.slug) url = `https://scoutit.com/property/${match.slug}`;
      }
    } catch {}
  }

  return {
    title: seoTitle,
    description: seoDescription,
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

// ----------------------------------------------------------------------
// MAP, DON'T MATCH: Strict Configuration Object
// ----------------------------------------------------------------------
const CATEGORY_TO_LAYOUT_MAP = {
  "residential": ResidentialFlow,
  "commercial": CommercialFlow,
  "str": CommercialFlow,           // Hospitality acts like commercial flow for now
  "hospitality": CommercialFlow,
  "restaurants": CommercialFlow,
  "venues": CommercialFlow,
  "default": ResidentialFlow
};

// Resolve the category that picks the layout flow. Approved Airtable records are
// the source of truth (their slug won't exist in the mock detail store, so the
// mock fallback can't tell us the real category). Fall back to mock for local-only
// slugs and when the CMS is unavailable.
async function resolveCategory(slug) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (apiKey && baseId) {
    try {
      const properties = await fetchProperties(apiKey, baseId);
      // Public links pass a slug; dashboard links pass a record id — match either.
      const match = properties.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === slug.toLowerCase()) ||
          (p.id && p.id === slug)
      );
      if (match) return (match.spaceCategory || match.property_type || "").toLowerCase();
    } catch {
      /* CMS unavailable — fall through to mock-derived category */
    }
  }
  const mock = null;
  return (mock?.spaceCategory || mock?.property_type || "default").toLowerCase();
}

export default async function PropertyRoute({ params }) {
  const resolvedParams = await params;

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  let match = null;

  if (apiKey && baseId) {
    try {
      const properties = await fetchProperties(apiKey, baseId);
      match = properties.find(
        (p) =>
          (p.slug && p.slug.toLowerCase() === resolvedParams.id.toLowerCase()) ||
          (p.id && p.id === resolvedParams.id)
      );
    } catch {}
  }

  const rawCat = match ? (match.spaceCategory || match.property_type || "default").toLowerCase() : "default";
  // Find mapped layout or fallback to default
  let layoutKey = "default";
  for (const key of Object.keys(CATEGORY_TO_LAYOUT_MAP)) {
    if (rawCat.includes(key)) {
      layoutKey = key;
      break;
    }
  }

  // The Chameleon Injection
  const InjectedLayout = CATEGORY_TO_LAYOUT_MAP[layoutKey] || CATEGORY_TO_LAYOUT_MAP["default"];

  return (
    <>
      {match?.seo_json_ld && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: match.seo_json_ld }}
        />
      )}
      <article className="chameleon-content-wrapper">
        {/* We pass the slug so the client component can fetch dynamic data via API if needed */}
        <InjectedLayout slug={resolvedParams.id} />
      </article>
    </>
  );
}
