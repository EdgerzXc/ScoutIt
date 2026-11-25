// Shared ingest schema + mapping for the Concierge Ingest module.
// Pure JS only (no server-only imports) so both the server action and the
// client paste-back panel can import it.
//
// The prompt below is kept IDENTICAL to the main app's /api/ai/assimilate
// extraction instructions, so a staff member pasting it into Claude/ChatGPT
// gets output in exactly the shape saveSynthesis() expects.

export const SCOUTIT_SCHEMA_PROMPT = `You are an expert data extraction and Real Estate SEO assistant for ScoutIt, a Philippine real estate intelligence platform.

Your job: map raw, messy property data (from a CSV, PDF deck, or listing brochure) into ScoutIt's exact internal schema.
This is Phase 1 (Concierge Ingest). You must follow these RULES strictly:

RULES (non-negotiable):
1. Only fill a field if the value is literally present in the source data.
2. If a fact is missing, LEAVE THE FIELD NULL. This is the "Honest Blank" rule.
3. NEVER invent, estimate, or guess details not present in the document.
4. For space_category, map ONLY to an existing choice: "residential", "commercial", "str", "hospitality", "restaurants", "venues". If unknown, leave null.
5. For price, extract as a NUMBER only (strip the currency symbol, commas, "per sqm" etc — keep the raw number).
6. SEO OPTIMIZATION: When writing the "description", apply Generative Engine Optimization (GEO). Structure it with a citable summary and use bullet points for features. Apply ScoutIt's "White-Glove Luxury" brand voice (cinematic, authoritative, concise — e.g. 'bespoke', 'premier'). Do not keyword stuff.
7. Confidence: rate 0.0-1.0 how confident you are in the overall extraction based on the document quality.
8. gaps: list field names that are part of the schema but were missing in the source document.

Return ONLY valid JSON in exactly this shape (no prose before or after):
{
  "title": string | null,
  "location": string | null,
  "space_category": "residential" | "commercial" | "str" | "hospitality" | "restaurants" | "venues" | null,
  "price": number | null,
  "price_status": "Published" | "On Request" | null,
  "description": string | null,
  "media_link": string | null,
  "floor_sqm": number | null,
  "lot_sqm": number | null,
  "beds": number | null,
  "baths": number | null,
  "parking": number | null,
  "furnishing": string | null,
  "tenure": string | null,
  "year_built": number | null,
  "title_status": string | null,
  "details": object,
  "confidence": number,
  "gaps": string[]
}

Put any extra facts found in the document that do not map to the top-level fields into the "details" object as key-value pairs.`;

// Core columns that live directly on the properties row.
const CORE_COLUMNS = ["title", "location", "space_category", "price", "description", "media_link"];

// Fields that belong inside the properties.details jsonb blob.
const DETAIL_FIELDS = [
  "price_status",
  "floor_sqm",
  "lot_sqm",
  "beds",
  "baths",
  "parking",
  "furnishing",
  "tenure",
  "year_built",
  "title_status",
];

const VALID_CATEGORIES = ["residential", "commercial", "str", "hospitality", "restaurants", "venues"];

const FORBIDDEN_PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// Keep synchronized with INTERNAL_FIELDS in propertyFieldRegistry.js (without bundler-only imports
// so pure Node tests can import ingestSchema.js directly).
const INTERNAL_DETAIL_KEYS = new Set([
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
  "Deep_Intel_Gate",
  "Owner_Ref",
]);

function isSafeHttpUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Parse a staff-pasted AI JSON string and map it onto a properties update.
 * Returns { patch, detailsPatch, confidence, gaps, warnings }.
 * Throws with a friendly message if the JSON can't be parsed.
 */
export function parseSynthesis(rawText) {
  if (!rawText || !rawText.trim()) {
    throw new Error("Paste the AI's JSON output first.");
  }

  // Tolerate ```json fences and stray prose around the object.
  let text = rawText.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error("That doesn't look like valid JSON. Paste exactly what the AI returned.");
  }
  if (typeof obj !== "object" || Array.isArray(obj) || obj === null) {
    throw new Error("Expected a single JSON object with the ScoutIt schema fields.");
  }

  const warnings = [];
  const patch = {};
  for (const key of CORE_COLUMNS) {
    const val = Object.hasOwn(obj, key) ? obj[key] : undefined;
    if (val === undefined || val === null || val === "") continue;
    if (key === "price") {
      const num = Number(String(val).replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(num) && Number.isFinite(num)) patch.price = num;
      continue;
    }
    if (key === "space_category") {
      const cat = String(val).toLowerCase();
      if (VALID_CATEGORIES.includes(cat)) patch.space_category = cat;
      else warnings.push(`Ignored unknown space_category "${val}".`);
      continue;
    }
    if (key === "media_link") {
      if (isSafeHttpUrl(val)) {
        patch.media_link = String(val).trim();
      } else {
        warnings.push("Ignored unsafe or malformed media_link URL.");
      }
      continue;
    }
    patch[key] = val;
  }

  // Assemble the details patch from the flat detail fields + safe extra details object.
  const detailsPatch = {};
  for (const key of DETAIL_FIELDS) {
    if (FORBIDDEN_PROTO_KEYS.has(key) || INTERNAL_DETAIL_KEYS.has(key)) continue;
    const val = Object.hasOwn(obj, key) ? obj[key] : undefined;
    if (val === undefined || val === null || val === "") continue;
    detailsPatch[key] = val;
  }
  if (obj.details && typeof obj.details === "object" && !Array.isArray(obj.details)) {
    for (const [key, val] of Object.entries(obj.details)) {
      if (FORBIDDEN_PROTO_KEYS.has(key) || INTERNAL_DETAIL_KEYS.has(key)) {
        warnings.push(`Stripped disallowed details key "${key}".`);
        continue;
      }
      Object.defineProperty(detailsPatch, key, {
        value: val,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }

  const confidence =
    typeof obj.confidence === "number" ? Math.max(0, Math.min(1, obj.confidence)) : null;
  const gaps = Array.isArray(obj.gaps) ? obj.gaps.filter((g) => typeof g === "string") : [];

  if (Object.keys(patch).length === 0 && Object.keys(detailsPatch).length === 0) {
    throw new Error("No usable fields found in that JSON.");
  }

  return { patch, detailsPatch, confidence, gaps, warnings };
}

/**
 * Rough completeness score (0-100) from the core fields present after a merge.
 * Mirrors the spirit of the main app's completeness_score.
 */
export function scoreCompleteness(row, detailsPatch = {}) {
  const merged = { ...(row.details || {}), ...detailsPatch };
  const checks = [
    !!row.title,
    !!row.location,
    !!row.space_category,
    row.price != null,
    !!row.description,
    !!row.media_link,
    merged.floor_sqm != null || merged.lot_sqm != null,
    merged.beds != null || merged.baths != null || merged.year_built != null,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
