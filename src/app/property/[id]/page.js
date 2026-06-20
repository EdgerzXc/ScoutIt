// Case-sensitivity routing diagnostics trigger and async params fix
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/data/mockProperties";
import { fetchProperties } from "@/lib/airtable";
import ResidentialFlow from "@/components/property/ResidentialFlow";
import CommercialFlow from "@/components/property/CommercialFlow";

// ----------------------------------------------------------------------
// INCREMENTAL STATIC REGENERATION (ISR)
// ----------------------------------------------------------------------
export const revalidate = 3600; 

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return {
    title: `Property Intel — ${resolvedParams.id} — ScoutIt`,
    description: "Property Intelligence Vector"
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
      const match = properties.find(
        (p) => p.slug && p.slug.toLowerCase() === slug.toLowerCase()
      );
      if (match) return (match.spaceCategory || match.property_type || "").toLowerCase();
    } catch {
      /* CMS unavailable — fall through to mock-derived category */
    }
  }
  const mock = getPropertyBySlug(slug);
  return (mock?.spaceCategory || mock?.property_type || "default").toLowerCase();
}

export default async function PropertyRoute({ params }) {
  const resolvedParams = await params;

  // Determine Category string safely (real CMS record wins over mock fallback)
  const rawCat = await resolveCategory(resolvedParams.id);
  
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
    <article className="chameleon-content-wrapper">
      {/* We pass the slug so the client component can fetch dynamic data via API if needed */}
      <InjectedLayout slug={resolvedParams.id} />
    </article>
  );
}
