import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const SCOUTIT_SCHEMA_PROMPT = `
You are an expert data extraction assistant for ScoutIt, a Philippine real estate intelligence platform.

Your job: map raw, messy property data (from a CSV or PDF) into ScoutIt's exact internal schema.

RULES (non-negotiable):
- Only fill a field if the value is actually in the source data. If not present, leave it null.
- Never invent, estimate, or guess a value.
- For space_category, infer from context clues (beds/baths = residential, GLA/CAMC = commercial, nightly rate = str, rooms/star rating = hospitality, seating/kitchen = restaurants, capacity/layout = venues).
- For price, extract as a number only (strip ₱, commas, "per sqm" etc — keep the raw number).
- Confidence: rate 0.0–1.0 how confident you are in the overall extraction.
- gaps: list field names that seem important but were not found in the source.

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

Put any extra fields that don't map to the above into "details" as key-value pairs.
`;

export async function POST(request) {
  try {
    const { source, payload } = await request.json();

    console.log(`[Assimilate] source=${source} items=${payload?.length ?? 0}`);

    if (!payload || payload.length === 0) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Assimilate] No GEMINI_API_KEY — using naive fallback');
      return NextResponse.json({ success: true, drafts: naiveFallback(payload) });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const drafts = await Promise.all(payload.map(async (item, index) => {
      try {
        const prompt = `${SCOUTIT_SCHEMA_PROMPT}

Raw property data:
${JSON.stringify(item, null, 2)}

Return a single JSON object following the ScoutIt Schema exactly.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
          id: `draft-${Date.now()}-${index}`,
          ...extracted,
          pipeline_status: 'ai_drafting',
          source
        };
      } catch (itemErr) {
        console.error(`[Assimilate] Item ${index} failed:`, itemErr.message);
        return naiveFallback([item])[0];
      }
    }));

    return NextResponse.json({ success: true, drafts });

  } catch (error) {
    console.error('[Assimilate] Error:', error);
    return NextResponse.json({ error: 'Assimilation failed' }, { status: 500 });
  }
}

function naiveFallback(payload) {
  return payload.map((item, index) => ({
    id: `draft-naive-${Date.now()}-${index}`,
    title: item.Name || item.Property || item.Title || item.title || 'Untitled Property',
    location: item.Address || item.Location || item.City || item.location || null,
    space_category: null,
    price: null,
    price_status: 'On Request',
    description: item.Notes || item.Description || item.description || null,
    media_link: item.Link || item.URL || item.Photo || null,
    floor_sqm: null,
    details: item,
    confidence: 0.3,
    gaps: ['space_category', 'price', 'floor_sqm'],
    pipeline_status: 'ai_drafting',
    source: 'fallback'
  }));
}
