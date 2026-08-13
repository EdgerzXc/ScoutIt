import { isSamplePropertySlug } from "./sampleInventory";

const CATEGORY_HIERARCHIES = Object.freeze({
  residential: Object.freeze({ key: "residential", collectionLabel: "Units", childLabel: "Unit", dossierLabel: "Unit dossier" }),
  commercial: Object.freeze({ key: "commercial", collectionLabel: "Available Spaces", childLabel: "Space", dossierLabel: "Space dossier" }),
  hospitality: Object.freeze({ key: "hospitality", collectionLabel: "Rooms & Facilities", childLabel: "Room", dossierLabel: "Room / facility dossier" }),
  restaurant: Object.freeze({ key: "restaurant", collectionLabel: "Areas", childLabel: "Area", dossierLabel: "Area dossier" }),
  venue: Object.freeze({ key: "venue", collectionLabel: "Zones", childLabel: "Zone", dossierLabel: "Zone dossier" }),
  default: Object.freeze({ key: "default", collectionLabel: "Available Spaces", childLabel: "Space", dossierLabel: "Space dossier" }),
});

function categoryText(property) {
  return [property?.spaceCategory, property?.space_category, property?.property_type, property?.type, property?.category]
    .filter(Boolean).join(" ").toLowerCase();
}

export function getPropertyHierarchy(property) {
  const value = categoryText(property);
  if (/restaurant|culinary|cafe|dining/.test(value)) return CATEGORY_HIERARCHIES.restaurant;
  if (/venue|event|ballroom|function hall/.test(value)) return CATEGORY_HIERARCHIES.venue;
  if (/hospitality|hotel|resort|lodge|short.?term|\bstr\b/.test(value)) return CATEGORY_HIERARCHIES.hospitality;
  if (/commercial|office|retail|industrial|warehouse|cowork/.test(value)) return CATEGORY_HIERARCHIES.commercial;
  if (/residential|condo|apartment|house|villa|townhouse/.test(value)) return CATEGORY_HIERARCHIES.residential;
  return CATEGORY_HIERARCHIES.default;
}

// Sample inventory may use generic generated names such as "Unit 01" even
// when its parent is a venue or hotel. Correct only those generic sample names;
// owner-authored names are content and must never be silently rewritten.
export function childSpaceDisplayName(name, index, property) {
  const hierarchy = getPropertyHierarchy(property);
  const fallback = `${hierarchy.childLabel} ${String(index + 1).padStart(2, "0")}`;
  const clean = typeof name === "string" ? name.trim() : "";
  if (!clean) return fallback;
  const isSample = Boolean(property?.is_sample || isSamplePropertySlug(property?.slug));
  if (!isSample) return clean;
  const generic = clean.match(/^(?:test[-_\s]*)?(unit|space|room|area|zone)[-_\s#]*([a-z0-9]+)$/i);
  if (/^\d{7,}$/.test(clean)) return fallback;
  return generic ? `${hierarchy.childLabel} ${generic[2]}` : clean;
}

export const PROPERTY_LEVEL_LABEL = "Property level";
export const CHILD_SPACE_LEVEL_LABEL = "Child-space level";
