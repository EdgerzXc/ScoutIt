import { generateWithFallback, GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from "./geminiModel.js";

export const MAX_RAW_TEXT_CHARS = 50_000;
export const MAX_PDF_PAGES = 30;
export const MAX_DESCRIPTION_CHARS = 5_000;
export const MAX_TITLE_CHARS = 200;
export const MAX_LOCATION_CHARS = 300;
export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_CATEGORIES = new Set([
  "residential",
  "commercial",
  "str",
  "hospitality",
  "restaurants",
  "venues",
]);

const ALLOWED_PRICE_STATUSES = new Set(["Published", "On Request"]);

const DISALLOWED_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const VALID_KEY_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export function sanitizeMediaLink(link) {
  if (typeof link !== "string" || !link.trim()) return null;
  const trimmed = link.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

export function sanitizePrice(price) {
  if (price == null) return null;
  let num = price;
  if (typeof price === "string") {
    const cleaned = price.replace(/[₱$Php,\s]/gi, "");
    num = Number(cleaned);
  }
  if (typeof num === "number" && Number.isFinite(num) && num >= 0 && num <= 100_000_000_000) {
    return Math.round(num);
  }
  return null;
}

export function sanitizeDescription(desc) {
  if (typeof desc !== "string") return "";
  const sanitized = desc
    .replace(/\0/g, "")
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .trim();
  return sanitized.slice(0, MAX_DESCRIPTION_CHARS);
}

export function sanitizeDetails(rawDetails) {
  if (!rawDetails || typeof rawDetails !== "object" || Array.isArray(rawDetails)) {
    return {};
  }
  const clean = {};
  let count = 0;
  for (const [key, val] of Object.entries(rawDetails)) {
    if (count >= 50) break;
    if (DISALLOWED_OBJECT_KEYS.has(key)) continue;
    if (!VALID_KEY_REGEX.test(key)) continue;

    if (val === null || val === undefined) {
      continue;
    } else if (typeof val === "string") {
      clean[key] = val.replace(/\0/g, "").slice(0, 500);
      count++;
    } else if (typeof val === "number" && Number.isFinite(val)) {
      clean[key] = val;
      count++;
    } else if (typeof val === "boolean") {
      clean[key] = val;
      count++;
    } else if (Array.isArray(val)) {
      const cleanArr = val
        .filter((item) => typeof item === "string" || (typeof item === "number" && Number.isFinite(item)) || typeof item === "boolean")
        .slice(0, 20)
        .map((item) => (typeof item === "string" ? item.slice(0, 200) : item));
      clean[key] = cleanArr;
      count++;
    }
  }
  return clean;
}

function sanitizeNumberRange(val, min = 0, max = 1_000_000) {
  if (val == null) return null;
  const num = Number(val);
  if (Number.isFinite(num) && num >= min && num <= max) {
    return Math.round(num * 100) / 100;
  }
  return null;
}

export function validateAndSanitizeAssimilated(raw, fallbackTitle = "Untitled Property") {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return naiveFallback([{ title: fallbackTitle }])[0];
  }

  const rawTitle = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : fallbackTitle;
  const title = rawTitle.slice(0, MAX_TITLE_CHARS);

  const location = typeof raw.location === "string" && raw.location.trim() ? raw.location.trim().slice(0, MAX_LOCATION_CHARS) : null;

  const space_category = typeof raw.space_category === "string" && ALLOWED_CATEGORIES.has(raw.space_category.toLowerCase().trim())
    ? raw.space_category.toLowerCase().trim()
    : null;

  const price = sanitizePrice(raw.price);
  const price_status = typeof raw.price_status === "string" && ALLOWED_PRICE_STATUSES.has(raw.price_status.trim())
    ? raw.price_status.trim()
    : (price != null ? "Published" : "On Request");

  const description = sanitizeDescription(raw.description);
  const media_link = sanitizeMediaLink(raw.media_link);

  const floor_sqm = sanitizeNumberRange(raw.floor_sqm, 0, 10_000_000);
  const lot_sqm = sanitizeNumberRange(raw.lot_sqm, 0, 100_000_000);
  const beds = sanitizeNumberRange(raw.beds, 0, 1000);
  const baths = sanitizeNumberRange(raw.baths, 0, 1000);
  const parking = sanitizeNumberRange(raw.parking, 0, 1000);
  const year_built = sanitizeNumberRange(raw.year_built, 1800, 2100);

  const furnishing = typeof raw.furnishing === "string" ? raw.furnishing.trim().slice(0, 100) : null;
  const tenure = typeof raw.tenure === "string" ? raw.tenure.trim().slice(0, 100) : null;
  const title_status = typeof raw.title_status === "string" ? raw.title_status.trim().slice(0, 100) : null;

  const details = sanitizeDetails(raw.details);

  const confidence = typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
    ? Math.max(0, Math.min(1, raw.confidence))
    : 0.5;

  const gaps = Array.isArray(raw.gaps)
    ? raw.gaps.filter((g) => typeof g === "string" && g.length <= 64).slice(0, 30)
    : [];

  return {
    title,
    location,
    space_category,
    price,
    price_status,
    description,
    media_link,
    floor_sqm,
    lot_sqm,
    beds,
    baths,
    parking,
    furnishing,
    tenure,
    year_built,
    title_status,
    details,
    confidence,
    gaps,
    pipeline_status: "pending",
    source: raw.source || "pdf_concierge",
  };
}

export const SCOUTIT_SCHEMA_PROMPT = `
You are an expert data extraction and Real Estate SEO assistant for ScoutIt, a Philippine real estate intelligence platform.

Your job: map raw, messy property data (from a CSV or extracted PDF text) into ScoutIt's exact internal schema.
This is Phase 1 (Ingest Extraction). You must follow these RULES strictly:

RULES (non-negotiable):
1. Only fill a field if the value is literally present in the source data.
2. If a fact is missing, LEAVE THE FIELD NULL.
3. NEVER invent, estimate, or guess details not present in the document.
4. For space_category, map ONLY to an existing choice: "residential", "commercial", "str", "hospitality", "restaurants", "venues". If unknown, leave null.
5. For price, extract as a NUMBER only (strip ₱, commas, "per sqm" etc — keep the raw number).
6. SEO OPTIMIZATION: When writing the "description", apply Generative Engine Optimization (GEO). Structure it with an unambiguous citable summary and use bullet points for specific features and specifications. Use grounded, precise architectural language. NEVER invent facts, hallucinate amenities, or use AI luxury clichés (e.g., 'bespoke', 'premier', 'breathtaking', 'oasis', 'opulent'). Do not keyword stuff.

7. Confidence: rate 0.0–1.0 how confident you are in the overall extraction based on the document quality.
8. gaps: list field names that are part of the schema but were missing in the source document.

ScoutIt Schema:
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

Put any extra details or facts found in the document that do not map to the top-level schema fields into the "details" object as key-value pairs.
`;

export function naiveFallback(payload) {
  return payload.map((item, index) => {
    const raw = {
      id: `draft-naive-${Date.now()}-${index}`,
      title: item.Name || item.Property || item.Title || item.title || item.filename || "Untitled Property",
      location: item.Address || item.Location || item.City || item.location || null,
      space_category: null,
      price: null,
      price_status: "On Request",
      description: item.Notes || item.Description || item.description || (typeof item.raw_text === "string" ? item.raw_text.slice(0, 300) : null),
      media_link: item.Link || item.URL || item.Photo || null,
      floor_sqm: null,
      details: typeof item === "object" && !Array.isArray(item) ? item : {},
      confidence: 0.3,
      gaps: ["space_category", "price", "floor_sqm"],
      pipeline_status: "pending",
      source: "fallback",
    };
    return validateAndSanitizeAssimilated(raw, raw.title);
  });
}

/**
 * Assimilates raw extracted text or payload item into structured property fields.
 * Uses Gemini structured output with fallback model; falls back to heuristic on error or missing key.
 */
export async function assimilatePropertyText(rawText, filename = "document.pdf") {
  // Truncate text before handing to prompt or naive fallback to guard against prompt injection / token budget blowout
  const safeRawText = typeof rawText === "string" ? rawText.slice(0, MAX_RAW_TEXT_CHARS) : "";
  const item = { raw_text: safeRawText, filename };

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[Assimilate] No GEMINI_API_KEY — using naive fallback");
    return naiveFallback([item])[0];
  }

  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `${SCOUTIT_SCHEMA_PROMPT}

Raw property data:
${JSON.stringify(item, null, 2)}

Return a single JSON object following the ScoutIt Schema exactly.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title:          { type: Type.STRING, nullable: true },
            location:       { type: Type.STRING, nullable: true },
            space_category: { type: Type.STRING, nullable: true },
            price:          { type: Type.NUMBER, nullable: true },
            price_status:   { type: Type.STRING, nullable: true },
            description:    { type: Type.STRING, nullable: true },
            media_link:     { type: Type.STRING, nullable: true },
            floor_sqm:      { type: Type.NUMBER, nullable: true },
            lot_sqm:        { type: Type.NUMBER, nullable: true },
            beds:           { type: Type.NUMBER, nullable: true },
            baths:          { type: Type.NUMBER, nullable: true },
            parking:        { type: Type.NUMBER, nullable: true },
            furnishing:     { type: Type.STRING, nullable: true },
            tenure:         { type: Type.STRING, nullable: true },
            year_built:     { type: Type.NUMBER, nullable: true },
            title_status:   { type: Type.STRING, nullable: true },
            details:        { type: Type.OBJECT, nullable: true },
            confidence:     { type: Type.NUMBER },
            gaps:           { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    let extracted;
    try {
      extracted = JSON.parse(response.text);
    } catch (parseErr) {
      console.warn("[Assimilate] Gemini response could not be parsed as JSON, falling back:", parseErr.message);
      return naiveFallback([item])[0];
    }

    return validateAndSanitizeAssimilated({
      ...extracted,
      source: "pdf_concierge",
    }, filename);
  } catch (err) {
    console.error("[Assimilate] Extraction failed, falling back:", err.message);
    return naiveFallback([item])[0];
  }
}
