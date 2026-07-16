import { NextResponse } from 'next/server';
import { GEMINI_MODEL } from '@/lib/geminiModel';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(request) {
  try {
    const { headers, sampleData } = await request.json();

    if (!headers || !sampleData || headers.length === 0) {
      return NextResponse.json({ error: "Missing headers or sample data" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is not set. Falling back to a naive local mapping.");
      return NextResponse.json(naiveMapping(headers));
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are an expert data migration assistant for a real estate platform called ScoutIt.
      Your task is to map a set of raw CSV headers to ScoutIt's internal core property schema.
      
      The Core ScoutIt Schema Keys are:
      - "title" (e.g. "Name", "Property", "Project")
      - "price" (e.g. "Asking", "Price", "Cost", "Rent")
      - "location" (e.g. "Address", "City", "Loc", "Area")
      - "type" (e.g. "Property Type", "Category", "Class")
      - "description" (e.g. "Notes", "Details", "Desc")
      - "media_link" (e.g. "Photo", "Image", "URL", "Link")

      If a CSV header DOES NOT map logically to one of the above 6 core keys, you MUST map it to the string "details". 
      The "details" key signifies that this column should be stuffed into the flexible JSONB column.

      Raw CSV Headers:
      ${JSON.stringify(headers)}

      Sample Data (First 3 rows to help you understand the context of the headers):
      ${JSON.stringify(sampleData, null, 2)}
      
      Return ONLY a JSON object mapping every raw CSV header (key) to either a Core Schema Key or "details" (value).
    `;

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                description: "Mapping of raw CSV headers to ScoutIt internal schema keys.",
                additionalProperties: {
                    type: Type.STRING,
                    description: "Must be one of: 'title', 'price', 'location', 'type', 'description', 'media_link', or 'details'."
                }
            }
        }
    });

    const mapping = JSON.parse(response.text);
    return NextResponse.json(mapping);

  } catch (err) {
    console.error("[BLUEPRINT API] Error generating mapping:", err);
    return NextResponse.json({ error: "Failed to generate blueprint mapping" }, { status: 500 });
  }
}

// Fallback in case there is no API key
function naiveMapping(headers) {
  const map = {};
  const lowerHeaders = headers.map(h => h.toLowerCase());
  
  headers.forEach((h, i) => {
    const low = lowerHeaders[i];
    if (low.includes('name') || low.includes('title')) map[h] = 'title';
    else if (low.includes('price') || low.includes('cost') || low.includes('rent')) map[h] = 'price';
    else if (low.includes('loc') || low.includes('add') || low.includes('city')) map[h] = 'location';
    else if (low.includes('type') || low.includes('cat')) map[h] = 'type';
    else if (low.includes('desc') || low.includes('note')) map[h] = 'description';
    else if (low.includes('link') || low.includes('url') || low.includes('img') || low.includes('photo')) map[h] = 'media_link';
    else map[h] = 'details';
  });

  return map;
}
