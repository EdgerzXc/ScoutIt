import { generateWithFallback, GEMINI_MODEL, GEMINI_FALLBACK_MODEL } from "@/lib/geminiModel";
import { GoogleGenAI, Type } from "@google/genai";

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
  return payload.map((item, index) => ({
    id: `draft-naive-${Date.now()}-${index}`,
    title: item.Name || item.Property || item.Title || item.title || item.filename || 'Untitled Property',
    location: item.Address || item.Location || item.City || item.location || null,
    space_category: null,
    price: null,
    price_status: 'On Request',
    description: item.Notes || item.Description || item.description || (typeof item.raw_text === 'string' ? item.raw_text.slice(0, 300) : null),
    media_link: item.Link || item.URL || item.Photo || null,
    floor_sqm: null,
    details: item,
    confidence: 0.3,
    gaps: ['space_category', 'price', 'floor_sqm'],
    pipeline_status: 'pending',
    source: 'fallback'
  }));
}

/**
 * Assimilates raw extracted text or payload item into structured property fields.
 * Uses Gemini structured output with fallback model; falls back to heuristic on error or missing key.
 */
export async function assimilatePropertyText(rawText, filename = "document.pdf") {
  const item = { raw_text: rawText, filename };

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Assimilate] No GEMINI_API_KEY — using naive fallback');
    return naiveFallback([item])[0];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `${SCOUTIT_SCHEMA_PROMPT}

Raw property data:
${JSON.stringify(item, null, 2)}

Return a single JSON object following the ScoutIt Schema exactly.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
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

    const extracted = JSON.parse(response.text);
    return {
      ...extracted,
      pipeline_status: 'pending',
      source: 'pdf_concierge'
    };
  } catch (err) {
    console.error('[Assimilate] Extraction failed, falling back:', err.message);
    return naiveFallback([item])[0];
  }
}
