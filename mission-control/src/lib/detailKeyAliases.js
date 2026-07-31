// ═══════════════════════════════════════════════════════════════
// DETAIL KEY ALIASES — one table, three naming conventions
//
// `properties.details` in Supabase has accumulated THREE conventions that all
// coexist in live rows today (verified against the database 2026-07-30):
//
//   Airtable-style   CM_AC_Charges, CM_Rent_Per_Sqm, PEZA
//   camelCase        acCharges, camc, availability
//   snake_case       ac_charges, hand_over_condition, published_rent
//
// They are the same facts written by different generations of the editor. Any
// code that wants to LABEL or GROUP a detail key has to collapse all three onto
// one canonical name first, or the same field appears two or three times under
// different headings — which is how a staff member ends up editing a stale copy.
//
// This module is the single place that knows the mapping. It was previously
// inline in airtable.js; it now lives here so airtable.js and
// propertyFieldRegistry.js cannot drift apart.
//
// ⚠️ THE CANONICAL NAME IS AMBIGUOUS WITHOUT A CATEGORY.
// Several camelCase keys are reused across categories:
//   parking   → Parking_Slots | RST_Parking | VEN_Parking
//   ceiling   → RST_Ceiling_Height | VEN_Ceiling_Height
//   capRate   → CM_Cap_Rate | HOSP_Cap_Rate
//   power     → RST_Power_Capacity | VEN_Power_Capacity
//   floorArea → RST_Floor_Area_Sqm | VEN_Floor_Area_Sqm
// So resolveDetailKey() takes the property's category and prefers the match
// belonging to it. Guessing without the category is how a venue ends up showing
// a restaurant's ceiling height.
// ═══════════════════════════════════════════════════════════════

/**
 * Airtable field name → the camelCase key `reverseMapCategoryFields` reads.
 * Moved out of airtable.js unchanged.
 */
export const EDITOR_DETAIL_ALIASES = {
  // Shared
  Beds: "beds", Baths: "baths", Floor_Area_Sqm: "floor_sqm", Lot_Area_Sqm: "lot_sqm",
  Parking_Slots: "parking", Furnishing: "furnishing", Amenities: "amenities", TitleStatus: "titleStatus",
  // Commercial
  CM_Rent_Per_Sqm: "rentPerSqm", CM_Total_GLA: "totalGLA", CM_Floor_Plate_Sqm: "floorPlate",
  CM_Building_Grade: "buildingGrade", CM_Hand_Over_Condition: "handOver", CM_Availability_Status: "availability",
  CM_Min_Lease_Term: "minLeaseTerm", CM_Certification: "certification", PEZA: "peza", Listed_Price: "listedPrice",
  CM_CAMC_Per_Sqm: "camc", CM_AC_Charges: "acCharges", CM_AC_System: "acSystem",
  CM_Reserved_Parking: "reservedParking", CM_Escalation_Rate: "escalation", CM_Fit_Out_Allowance: "fitOut",
  CM_Rent_Free_Period: "rentFree", CM_Parking_Ratio: "parkingRatio", CM_Backup_Power: "backupPower",
  CM_Floor_Loading: "floorLoading", CM_Internet_Providers: "internet", CM_Available_Units_Summary: "availableUnits",
  CM_Towers_Zones: "towersZones", CM_Cap_Rate: "capRate", CM_NOI: "noi",
  // Residential
  RS_Floor_Level: "floorLevel", RS_View: "view", RS_Turnover_Date: "turnoverDate", RS_Pet_Policy: "petPolicy",
  RS_Assoc_Dues: "assocDues", RS_Studio_Flag: "studio", RS_Price: "price", RS_Price_Per_Sqm: "pricePerSqm",
  RS_Payment_Terms: "paymentTerms",
  // STR
  STR_Nightly_Rate: "nightlyRate", STR_Max_Guests: "maxGuests", STR_Avg_Rating: "rating",
  STR_Bedrooms: "bedrooms", STR_Bathrooms: "bathrooms", STR_Min_Stay_Nights: "minStay",
  STR_Check_In_Out: "checkInOut", STR_Weekend_Rate: "weekendRate", STR_Bed_Config: "bedConfig",
  STR_Self_Check_In: "selfCheckIn", STR_House_Rules: "houseRules", STR_Cancellation_Policy: "cancellation",
  STR_Permit_Accreditation: "permit", STR_WiFi_Speed: "wifiSpeed", STR_Cleaning_Fee: "cleaningFee",
  // Hospitality
  HOSP_Room_Count: "rooms", HOSP_Star_Rating: "stars", HOSP_FB_Outlets: "fbOutlets",
  HOSP_Function_Rooms: "functionRooms", HOSP_Operator_Brand: "operator", HOSP_Room_Types: "roomTypes",
  HOSP_Year_Built_Renovated: "yearRenovated", HOSP_ADR: "adr", HOSP_Occupancy_Rate: "occupancy",
  HOSP_RevPAR: "revpar", HOSP_Cap_Rate: "capRate", HOSP_GFA: "gfa", HOSP_Land_Area: "landArea",
  // Restaurants
  RST_Seating_Capacity: "seating", RST_Floor_Area_Sqm: "floorArea", RST_Frontage_M: "frontage",
  RST_Hood_Exhaust: "hoodExhaust", RST_Grease_Trap: "greaseTrap", RST_Gas_Line: "gasLine",
  RST_Power_Capacity: "power", RST_Delivery_Access: "delivery", RST_Liquor_License: "liquor",
  RST_FB_Zoning_Permit: "zoning", RST_Ceiling_Height: "ceiling", RST_Turnover_Condition: "turnover",
  RST_Parking: "parking", RST_Rent_Per_Month: "rstRent", RST_Dues_CUSA: "rstDues",
  // Venues
  VEN_Capacity_Seated: "seated", VEN_Capacity_Standing: "standing", VEN_Floor_Area_Sqm: "floorArea",
  VEN_Min_Booking_Hours: "minHours", VEN_Indoor_Outdoor: "indoorOutdoor", VEN_Air_Conditioning: "aircon",
  VEN_Catering_Policy: "catering", VEN_Rental_Rate: "rentalRate", VEN_Layout_Configs: "layouts",
  VEN_Ceiling_Height: "ceiling", VEN_AV_Equipment: "av", VEN_Power_Capacity: "power",
  VEN_Parking: "parking", VEN_Accessibility: "accessibility", VEN_Noise_Curfew: "noiseCurfew",
  VEN_Rate_Basis: "venRateBasis",
};

/**
 * Legacy snake_case keys whose camelCase form does NOT match the alias table,
 * so the generic snake→camel conversion cannot find them.
 *
 * Found by grouping the real detail keys in the live database (2026-07-30):
 * `hand_over_condition` becomes `handOverCondition`, but the alias table uses
 * `handOver`. Without these overrides the same fact rendered TWICE — once under
 * "Shared" and once under "Commercial" — giving staff two editable copies of one
 * value where the last save silently wins.
 *
 * Deliberately NOT included: `published_rent` and `source`. Their meaning is
 * ambiguous (is `published_rent` the same fact as CM_Rent_Per_Sqm, or the
 * Listing Engine's separate scraped figure?) and mapping them wrongly would
 * MERGE two different facts and hide one. They stay unmapped, which shows them
 * under "Shared" — visibly ungrouped, still editable, nothing lost. An honest
 * "I don't know" beats a confident wrong answer.
 */
const LEGACY_SNAKE_ALIASES = {
  hand_over_condition: "CM_Hand_Over_Condition",
  camc_from: "CM_CAMC_From",
  ac_charge_from: "CM_AC_Charge_From",
  rent_from: "CM_Rent_From",
  floor_plate_from: "CM_Floor_Plate_From",
  // The Airtable column is CM_PEZA; the alias table only knew the bare `PEZA`.
  PEZA: "CM_PEZA",
  peza: "CM_PEZA",
  // The units blob — canonicalising it marks it machine-shaped so the editor
  // renders it as a collapsed JSON textarea rather than a broken text input.
  units_inventory: "Units_JSON",
};

const PREFIX_FOR_CATEGORY = {
  commercial: "CM_",
  residential: "RS_",
  str: "STR_",
  restaurants: "RST_",
  hospitality: "HOSP_",
  venues: "VEN_",
};

/** camelCase key → every Airtable field name that aliases to it. */
const REVERSE = (() => {
  const out = new Map();
  for (const [airtableName, camel] of Object.entries(EDITOR_DETAIL_ALIASES)) {
    if (!out.has(camel)) out.set(camel, []);
    out.get(camel).push(airtableName);
  }
  return out;
})();

/** Every Airtable name this table knows, for fast "is it already canonical?". */
const KNOWN_AIRTABLE_NAMES = new Set(Object.keys(EDITOR_DETAIL_ALIASES));

/** snake_case / SCREAMING_SNAKE → camelCase. `ac_charges` → `acCharges`. */
export function snakeToCamel(key) {
  if (!key.includes("_")) return key;
  const parts = key.split("_").filter(Boolean);
  if (!parts.length) return key;
  return (
    parts[0].toLowerCase() +
    parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("")
  );
}

/**
 * Collapse any detail key onto its canonical Airtable field name.
 *
 * @param {string} key - a key from properties.details, in any of the three conventions
 * @param {string|null} [category] - registry category key, used to disambiguate
 *        camelCase keys that several categories share
 * @returns {string} the canonical Airtable field name, or `key` unchanged when
 *          nothing is known about it (so unknown keys stay visible and editable
 *          rather than being silently dropped from the UI)
 */
export function resolveDetailKey(key, category = null) {
  if (!key) return key;

  // Explicit legacy overrides win: these exist precisely because the generic
  // conversion below gets them wrong.
  if (LEGACY_SNAKE_ALIASES[key]) return LEGACY_SNAKE_ALIASES[key];

  // Already canonical — but note this is checked against the alias table only.
  // Airtable fields with no camelCase alias (most of them) fall through to the
  // prefix test below and are returned unchanged, which is correct.
  if (KNOWN_AIRTABLE_NAMES.has(key)) return key;

  const candidates = REVERSE.get(key) || REVERSE.get(snakeToCamel(key));
  if (!candidates || !candidates.length) return key;
  if (candidates.length === 1) return candidates[0];

  // Ambiguous. Prefer the candidate belonging to this property's category.
  const prefix = PREFIX_FOR_CATEGORY[category];
  if (prefix) {
    const scoped = candidates.find((c) => c.startsWith(prefix));
    if (scoped) return scoped;
  }
  // No category, or none matched: prefer an unprefixed (shared) field over
  // arbitrarily picking one category's version.
  const shared = candidates.find(
    (c) => !Object.values(PREFIX_FOR_CATEGORY).some((p) => c.startsWith(p)),
  );
  return shared || candidates[0];
}
