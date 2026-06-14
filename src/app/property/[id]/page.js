// Case-sensitivity routing diagnostics trigger and async params fix
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/data/mockProperties";
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

export default async function PropertyRoute({ params }) {
  const resolvedParams = await params;
  const propertyData = getPropertyBySlug(resolvedParams.id);

  if (!propertyData) {
    // If not in mockDb, might be from Airtable on client side, 
    // but for ISR wrapper we fallback gracefully or just pass slug
  }

  // Determine Category string safely
  const rawCat = (propertyData?.spaceCategory || propertyData?.property_type || "default").toLowerCase();
  
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
