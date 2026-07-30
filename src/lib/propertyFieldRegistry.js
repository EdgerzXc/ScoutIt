// ═══════════════════════════════════════════════════════════════
// PROPERTY FIELD REGISTRY — the human layer over a terse Airtable
//
// WHY THIS EXISTS
// Airtable PROPERTIES_CMS is deliberately machine-shaped: 186 flat columns,
// terse prefixed names (CM_CAMC_Per_Sqm), no grouping, no friendly labels.
// That is CORRECT for the base — it is written to by the app and read by AI,
// and nobody is supposed to browse it by hand.
//
// But Master Mission Control is read by STAFF. This module is the translation
// layer: it turns `CM_CAMC_Per_Sqm` into
//   { label: "CAMC per sqm", group: "Commercial", visibility: "public" }
// so Mission Control can render grouped, labelled, human-legible panels
// WITHOUT Airtable having to carry any of that presentation weight.
//
// DESIGN DECISION — derive, don't enumerate.
// An earlier draft of this file was a 186-row hand-written table. That is a
// liability: every new Airtable field silently falls out of the UI until
// someone remembers to add a row. Instead:
//   • LABELS are DERIVED from the field name (prefix + abbreviation dictionary)
//   • VISIBILITY is CURATED, because it is a monetization/legal decision that
//     cannot be inferred from a name — it comes from the owner-signed-off
//     _SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md (2026-07-02)
// So adding a field to Airtable gets you a sensible label for free, and only
// a genuine visibility decision requires editing this file.
//
// ⚠️ VISIBILITY IS NOT ENFORCEMENT. This registry DESCRIBES intent so staff
// tooling can label things honestly. The actual paywall lives in
// src/lib/entitlements.js and the property components. Do not treat
// `visibility: "public"` here as authorisation to serve a field.
//
// Related: FIELD_VISIBILITY_MAP.md · VISIBILITY_MAP__*.md (6 per-category
// files) · src/lib/deepIntelSchema.js · src/lib/entitlements.js
// ═══════════════════════════════════════════════════════════════

import { resolveDetailKey } from "./detailKeyAliases";

/** Airtable field-name prefix → category key used across the codebase. */
export const CATEGORY_PREFIXES = {
  CM_: "commercial",
  RS_: "residential",
  STR_: "str",
  RST_: "restaurants",
  HOSP_: "hospitality",
  VEN_: "venues",
};

/**
 * Map a stored SpaceCategory value onto a registry category key.
 *
 * The stored value is free-ish text that has drifted over time ("Commercial",
 * "Commercial Office", "Short-Term Rental", "STR", "Culinary / Restaurant"), so
 * this matches on substrings rather than equality. Mirrors the same logic in
 * airtable.js `deepIntelCategoryFor` — kept here so the editor and the public
 * page can never disagree about which category a property is.
 *
 * Returns null when nothing matches, which callers must treat as "show shared
 * fields only" rather than guessing a category and hiding the right fields.
 */
export function categoryKeyFor(spaceCategory) {
  const c = String(spaceCategory || "").toLowerCase();
  if (!c) return null;
  if (c.includes("commercial") || c.includes("office")) return "commercial";
  // Check STR before "residential": a short-term rental is residential-ish and
  // a looser order would swallow it.
  if (c.includes("short") || /\bstr\b/.test(c) || c.includes("airbnb")) return "str";
  if (c.includes("hospitality") || c.includes("hotel")) return "hospitality";
  if (c.includes("restaurant") || c.includes("culinary") || c.includes("f&b")) return "restaurants";
  if (c.includes("venue") || c.includes("event")) return "venues";
  // `house` MUST be word-bounded: your live listing "The Foundry, Warehouse
  // District BGC" contains "house" inside "Warehouse" and a bare substring
  // match classified that industrial space as residential.
  if (c.includes("residential") || c.includes("condo") || /\bhouse\b/.test(c)) {
    return "residential";
  }
  return null;
}

/** Human names for the category keys, for panel headings. */
export const CATEGORY_LABELS = {
  commercial: "Commercial",
  residential: "Residential",
  str: "Short-Term Rental",
  restaurants: "Restaurant",
  hospitality: "Hospitality",
  venues: "Venue",
  shared: "Shared",
};

// Acronyms and units that must NOT be title-cased or split into words.
// Without this, "CM_CAMC_Per_Sqm" renders as "Camc Per Sqm" — which looks
// like a typo to a staff member and erodes trust in the whole panel.
const ABBREVIATIONS = new Map(
  Object.entries({
    CAMC: "CAMC",
    GLA: "GLA",
    GFA: "GFA",
    ADR: "ADR",
    REVPAR: "RevPAR",
    NOI: "NOI",
    PEZA: "PEZA",
    AC: "A/C",
    AV: "AV",
    FB: "F&B",
    CUSA: "CUSA",
    DOT: "DOT",
    LGU: "LGU",
    PWD: "PWD",
    PRC: "PRC",
    SQM: "sqm",
    JSON: "JSON",
    LD: "LD",
    SEO: "SEO",
    URL: "URL",
    ID: "ID",
    AI: "AI",
    WIFI: "WiFi",
    STR: "STR",
    BGC: "BGC",
    "3D": "3D",
  }),
);

/**
 * Split a field name into display words, honouring both snake_case and the
 * CamelCase names that predate the prefix convention (e.g. `OutdoorDescription`).
 */
function tokenize(name) {
  return name
    .split("_")
    .flatMap((part) => {
      // Check the WHOLE underscore-part against the dictionary before doing any
      // camel-splitting. Mixed-case acronyms like "RevPAR" and "WiFi" contain a
      // lowercase→uppercase boundary, so splitting first would shred them into
      // "Rev PAR" / "Wi Fi" and no later lookup could put them back together.
      if (ABBREVIATIONS.has(part.toUpperCase())) return [part];
      // Otherwise insert a break between a lowercase/digit and an uppercase
      // letter, keeping runs of capitals together so "JSON"/"GLA" survive.
      return part.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/\s+/);
    })
    .filter(Boolean);
}

/** Strip the category prefix, if any. Returns [categoryKey, remainder]. */
export function splitPrefix(name) {
  for (const [prefix, key] of Object.entries(CATEGORY_PREFIXES)) {
    if (name.startsWith(prefix)) return [key, name.slice(prefix.length)];
  }
  return ["shared", name];
}

/**
 * Turn an Airtable field name into a label a staff member can read.
 *   CM_CAMC_Per_Sqm      → "CAMC per sqm"
 *   HOSP_RevPAR          → "RevPAR"
 *   RS_Price_Per_Sqm     → "Price per sqm"
 *   OutdoorDescription   → "Outdoor description"
 *   SEO_JSON_LD          → "SEO JSON LD"
 */
export function deriveLabel(name) {
  const [, rest] = splitPrefix(name);
  const words = tokenize(rest).map((word) => {
    const known = ABBREVIATIONS.get(word.toUpperCase());
    if (known) return known;
    // Small connectives read better lowercase inside a label.
    if (/^(per|of|and|to|for|in|from|by)$/i.test(word)) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  if (!words.length) return name;
  // Capitalise the first word even if it was a connective.
  const [first, ...tail] = words;
  const head = ABBREVIATIONS.get(first.toUpperCase())
    ? first
    : first.charAt(0).toUpperCase() + first.slice(1);
  return [head, ...tail].join(" ");
}

// ═══════════════════════════════════════════════════════════════
// VISIBILITY — curated. Source: FIELD_VISIBILITY_MAP.md (signed off
// by the owner 2026-07-02). Anything not listed defaults to "public".
// ═══════════════════════════════════════════════════════════════

/**
 * INTERNAL — never served to any visitor at any tier.
 * Drafts, staff notes, pipeline/verification state, internal price working,
 * and control flags. The public CMS proxy (src/lib/airtable.js) correctly
 * does not read these; that is by design, not an integration gap.
 */
export const INTERNAL_FIELDS = new Set([
  "PriceRange_Internal",
  "Vision_Uploads",
  "AI_Architectural_Style",
  "AI_Extracted_Features",
  "AI_Marketing_Copy",
  "AI_Condition_Estimate",
  "AI_Draft_Notes",
  "Broker_Input_Notes",
  "Photos_Status",
  "Source_Citations",
  "Pipeline_Status",
  "Listing_Visibility",
  // Labeling only — FIELD_VISIBILITY_MAP.md records that no code reads this
  // and that enforcement lives in the components (verified 2026-07-02).
  "Deep_Intel_Gate",
  // Holds the Supabase owner_accounts id for the Make.com sync. Server-side
  // join key, never a display value.
  "Owner_Ref",
]);

/** VAULT — Cluster+ tier. Spatial media, rendered in the Vault chapter. */
export const VAULT_FIELDS = new Set([
  "Virtual_Tour_URL",
  "Video_URL",
  "Floor_Plans",
  "Luma_3D_Map_URL",
  "Drone_Heatmap_URL",
  "Enhanced_Photos",
]);

/** DEEP INTEL — Solar+ tier. Investor/operator-grade derived figures. */
export const DEEP_INTEL_FIELDS = new Set([
  "CM_Cap_Rate",
  "CM_NOI",
  "HOSP_ADR",
  "HOSP_Occupancy_Rate",
  "HOSP_RevPAR",
  "HOSP_Cap_Rate",
  "CM_Internet_Providers",
  "CM_Floor_Loading",
  "VEN_Power_Capacity",
  "HOSP_GFA",
  "HOSP_Land_Area",
  "DeepIntel_JSON",
]);

/**
 * Fields that exist to serve machines, not people. Mission Control should
 * render these as collapsed/raw rather than as a normal labelled row.
 */
export const MACHINE_FIELDS = new Set([
  "Units_JSON",
  "DeepIntel_JSON",
  "WhereTo",
  "SEO_JSON_LD",
  "Slug",
  "Gradient",
]);

export const VISIBILITY = {
  INTERNAL: "internal",
  VAULT: "vault",
  DEEP_INTEL: "deep_intel",
  PUBLIC: "public",
};

/** Where a field sits on the monetization/visibility ladder. */
export function visibilityOf(name) {
  if (INTERNAL_FIELDS.has(name)) return VISIBILITY.INTERNAL;
  if (VAULT_FIELDS.has(name)) return VISIBILITY.VAULT;
  if (DEEP_INTEL_FIELDS.has(name)) return VISIBILITY.DEEP_INTEL;
  return VISIBILITY.PUBLIC;
}

/** True when a field must never leave the server. */
export function isInternal(name) {
  return visibilityOf(name) === VISIBILITY.INTERNAL;
}

/** True when a field is gated behind a paid tier. */
export function isGated(name) {
  const v = visibilityOf(name);
  return v === VISIBILITY.VAULT || v === VISIBILITY.DEEP_INTEL;
}

/**
 * Everything Mission Control needs to render one row.
 *
 * `name` may arrive in ANY of the three conventions found in
 * properties.details (`CM_AC_Charges`, `acCharges`, `ac_charges`) — see
 * detailKeyAliases.js. It is resolved to the canonical Airtable name first, so
 * the same fact always lands in the same section with the same label instead of
 * appearing two or three times under different headings.
 *
 * `key` is the ORIGINAL key and is what a save payload must use; `name` is the
 * canonical name used for labelling, grouping and visibility.
 *
 * @param {string} name
 * @param {string|null} [category] - disambiguates keys several categories share
 * @returns {{key:string,name:string,label:string,category:string,
 *            categoryLabel:string,visibility:string,isMachine:boolean,gated:boolean}}
 */
export function fieldMeta(name, category = null) {
  const canonical = resolveDetailKey(name, category);
  const [group] = splitPrefix(canonical);
  return {
    key: name,
    name: canonical,
    label: deriveLabel(canonical),
    category: group,
    categoryLabel: CATEGORY_LABELS[group] ?? CATEGORY_LABELS.shared,
    visibility: visibilityOf(canonical),
    isMachine: MACHINE_FIELDS.has(canonical),
    gated: isGated(canonical),
  };
}

/**
 * Group a set of field names into the panels Mission Control renders.
 * Internal fields are returned in their own bucket so staff tooling can put
 * them behind a "staff only" heading instead of mixing them with public copy.
 *
 * @param {string[]} names
 * @param {{category?: string}} [opts] - when set, category-specific fields for
 *        OTHER categories are dropped (a restaurant page shouldn't show CM_*).
 */
export function groupFields(names, opts = {}) {
  const { category } = opts;
  const groups = {};

  // A record can hold the SAME fact under two conventions (e.g. both
  // `CM_AC_Charges` and `ac_charges`). Render it ONCE — two editable copies of
  // one value means whichever the staff member saves last silently wins.
  //
  // When there IS a collision, prefer the key that already uses the canonical
  // Airtable name. Taking "whichever came first" would depend on JSON key
  // order, so the same record could render differently between requests.
  const byCanonical = new Map();
  for (const name of names || []) {
    const meta = fieldMeta(name, category);
    const existing = byCanonical.get(meta.name);
    if (!existing) {
      byCanonical.set(meta.name, meta);
    } else if (meta.key === meta.name && existing.key !== existing.name) {
      byCanonical.set(meta.name, meta);
    }
  }

  for (const meta of byCanonical.values()) {
    if (category && meta.category !== "shared" && meta.category !== category) {
      continue;
    }
    const bucket =
      meta.visibility === VISIBILITY.INTERNAL ? "internal" : meta.categoryLabel;
    (groups[bucket] ??= []).push(meta);
  }
  for (const list of Object.values(groups)) {
    list.sort((a, b) => a.label.localeCompare(b.label));
  }
  return groups;
}

/**
 * Strip every internal field out of an object before it crosses a network
 * boundary. Belt-and-braces for staff endpoints that spread a whole record.
 */
export function omitInternal(record) {
  if (!record || typeof record !== "object") return record;
  const out = {};
  for (const [key, value] of Object.entries(record)) {
    if (!isInternal(key)) out[key] = value;
  }
  return out;
}
