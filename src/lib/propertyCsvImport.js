export const MAX_PROPERTY_CSV_ROWS = 100;
export const MAX_PROPERTY_CSV_COLUMNS = 100;
export const MAX_PROPERTY_CSV_BYTES = 512 * 1024;

const CSV_CATEGORY_ALIASES = new Map([
  ["restaurant", "restaurants"],
  ["restaurants", "restaurants"],
  ["f&b", "restaurants"],
  ["food & beverage", "restaurants"],
  ["food and beverage", "restaurants"],
  ["dining", "restaurants"],
  ["hospitality", "hospitality"],
  ["hotel", "hospitality"],
  ["hotels", "hospitality"],
  ["resort", "hospitality"],
  ["boutique hotel", "hospitality"],
  ["str", "str"],
  ["short-term rental", "str"],
  ["short term rental", "str"],
  ["vacation rental", "str"],
  ["airbnb", "str"],
  ["venue", "venues"],
  ["venues", "venues"],
  ["event", "venues"],
  ["event venue", "venues"],
  ["event space", "venues"],
  ["residential", "residential"],
  ["condo", "residential"],
  ["house", "residential"],
  ["commercial", "commercial"],
  ["office", "commercial"],
  ["retail", "commercial"],
  ["industrial", "commercial"],
  ["warehouse", "commercial"],
  ["developer", "commercial"],
]);

export function normalizeCsvCategory(rawType) {
  const cleaned = typeof rawType === "string" ? rawType.trim().toLowerCase().replace(/\s+/g, " ") : "";
  if (!cleaned) return "commercial";
  return CSV_CATEGORY_ALIASES.get(cleaned) || cleaned;
}

const COLUMN_ALIASES = {
  title: ["title", "name", "property", "property name", "project", "project name"],
  location: ["location", "address", "city", "loc", "property address"],
  type: ["type", "category", "class", "property type", "space category"],
  price: ["price", "asking", "asking price", "cost", "rent"],
  description: ["description", "notes", "details", "desc"],
  media_link: ["media link", "photo", "image", "url", "link", "photo url", "image url"],
  beds: ["beds", "bedrooms"],
  baths: ["baths", "bathrooms"],
  floor_sqm: ["floor sqm", "floor area", "size sqm", "size"],
  furnishing: ["furnishing", "furnished"],
  handOver: ["condition", "hand over", "handover"],
  layouts: ["layouts", "layout"],
  RST_Seating_Capacity: ["seating capacity", "seating", "seats", "covers", "rst seating capacity"],
  RST_Hood_Exhaust: ["kitchen exhaust", "hood exhaust", "exhaust", "hood", "rst hood exhaust"],
  RST_Liquor_License: ["liquor license", "liquor", "rst liquor license"],
  HOSP_Room_Count: ["room count", "rooms", "keys", "hosp room count"],
  HOSP_Star_Rating: ["star rating", "stars", "hosp star rating"],
  STR_Nightly_Rate: ["nightly rate", "adr", "rate per night", "str nightly rate"],
  STR_Max_Guests: ["max guests", "guests", "guest capacity", "str max guests"],
  VEN_Capacity_Seated: ["seated capacity", "banquet capacity", "ven capacity seated"],
  VEN_Capacity_Standing: ["standing capacity", "cocktail capacity", "ven capacity standing"],
  CM_Total_GLA: ["gla", "total gla", "leasable area", "cm total gla"],
  PEZA: ["peza", "peza status", "cm peza status"],
};

const byAlias = new Map(Object.entries(COLUMN_ALIASES).flatMap(([field, aliases]) => aliases.map((alias) => [alias, field])));
const detailsFields = new Set([
  "beds",
  "baths",
  "floor_sqm",
  "furnishing",
  "handOver",
  "layouts",
  "RST_Seating_Capacity",
  "RST_Hood_Exhaust",
  "RST_Liquor_License",
  "HOSP_Room_Count",
  "HOSP_Star_Rating",
  "STR_Nightly_Rate",
  "STR_Max_Guests",
  "VEN_Capacity_Seated",
  "VEN_Capacity_Standing",
  "CM_Total_GLA",
  "PEZA",
]);

export function mapPropertyCsvRows(headers, rows) {
  const fields = headers.map((header) => [
    header,
    byAlias.get(header.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()),
  ]);
  return rows.map((row) => {
    const listing = { type: "commercial", details: {} };
    const other = [];
    for (const [header, field] of fields) {
      const raw = row[header];
      const value =
        typeof raw === "string"
          ? raw.trim()
          : typeof raw === "number" && Number.isFinite(raw)
            ? String(raw)
            : "";
      if (!value) continue;
      if (!field) other.push(`${header} — ${value}`);
      else if (detailsFields.has(field)) listing.details[field] = value;
      else if (field === "type") listing.type = normalizeCsvCategory(value);
      else listing[field] = value;
    }
    if (other.length) listing.description = [listing.description, ...other].filter(Boolean).join("\n");
    return listing;
  });
}
