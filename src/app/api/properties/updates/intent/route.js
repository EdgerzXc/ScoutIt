import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { GoogleGenAI } from "@google/genai";
import { generateWithFallback } from "@/lib/geminiModel";
import { parseHeuristicUpdates, FIELD_LABELS, formatPhp } from "@/lib/propertyUpdateParser";
import { sanitizeError } from "@/lib/sanitizeError";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Please sign in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { text, properties = [] } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Missing text payload" }, { status: 400 });
    }

    let updates = [];

    // Attempt Gemini extraction if API key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
You are an expert real estate data parser for ScoutIt (Philippine property intelligence).
An owner provided the following notes, message, or update instructions.

Owner's available properties:
${JSON.stringify(properties.map(p => ({ id: p.id, title: p.title })), null, 2)}

User text:
"""
${text}
"""

Your task:
Extract all requested updates into a strict JSON array of objects.
Each object must have:
- propertyTitle: string | null (matched property title or best guess)
- unitIdentifier: string | null (e.g. "1201", "3B", or null for property-wide)
- field: "price_php" | "status" | "parking_slots" | "contact_number" | "sqm"
- newValue: number | string (number for price_php, parking_slots, sqm; "available" | "occupied" | "pending" for status; string for contact_number)
- rawLine: string (the snippet or line this was extracted from)

RULES:
1. Return ONLY a valid JSON array. No markdown fences, no conversational prose.
2. If status is mentioned (e.g. "vacant", "bakante"), normalize newValue to "available". If "rented" or "occupied", normalize to "occupied".
3. If price is mentioned (e.g. "45k", "₱45,000"), normalize newValue to raw number (45000).
4. Never invent units or properties not referenced in the text.
`;

        const response = await generateWithFallback(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });

        const rawJson = response?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawJson) {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            updates = parsed.map(u => {
              const matchedProp = properties.find(p => 
                p.title && u.propertyTitle && p.title.toLowerCase().includes(u.propertyTitle.toLowerCase())
              ) || (properties.length === 1 ? properties[0] : null);

              const fieldKey = u.field || "price_php";
              return {
                id: "up_" + Math.random().toString(36).slice(2, 8),
                propertyId: matchedProp?.id || null,
                propertyTitle: matchedProp?.title || u.propertyTitle || "All Properties",
                unitIdentifier: u.unitIdentifier || null,
                field: fieldKey,
                fieldLabel: FIELD_LABELS[fieldKey] || fieldKey,
                newValue: u.newValue,
                displayValue: fieldKey === "price_php" ? formatPhp(u.newValue) : String(u.newValue).toUpperCase(),
                confidence: 0.95,
                rawLine: u.rawLine || ""
              };
            });
          }
        }
      } catch (geminiErr) {
        console.warn("[PropertyUpdateIntent] Gemini parse failed, falling back to heuristic:", geminiErr.message);
      }
    }

    // Deterministic fallback if Gemini produced 0 updates or failed/absent
    if (!updates || updates.length === 0) {
      updates = parseHeuristicUpdates(text, properties);
    }

    // Disambiguation check: if a unit is mentioned but owner has multiple properties and no property is pinned
    if (properties.length > 1) {
      updates = updates.map(up => {
        if (up.unitIdentifier && !up.propertyId) {
          return {
            ...up,
            isAmbiguous: true,
            candidateProperties: properties.map(p => ({ id: p.id, title: p.title }))
          };
        }
        return up;
      });
    }

    return NextResponse.json({
      success: true,
      updates,
      count: updates.length
    });
  } catch (error) {
    console.error("[PropertyUpdateIntent] Error:", error);
    return NextResponse.json(
      { error: sanitizeError(error, "Failed to parse property updates") },
      { status: 500 }
    );
  }
}
