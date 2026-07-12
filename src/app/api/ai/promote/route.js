import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { spendConnects } from '@/lib/connectsWallet'; 

const PROMOTE_SYSTEM_PROMPT = `
You are an elite real estate copywriter for ScoutIt, a premium commercial and residential real estate directory (the "Bloomberg for Space").

Your task is to generate 3 variations of social media promotional copy based on the provided property/unit details.

RULES (Strictly enforced):
1. TONE: "Bloomberg for Space". Confident, premium, editorial, data-dense, strategic.
2. NO EMOJIS. None. Ever. Do not use emojis anywhere.
3. NO FLUFF. Avoid cheap marketing terms like "dream home", "act fast", "next-generation", "stunning".
4. BRANDING: You MUST organically include "ScoutIt" in every copy variation to build brand intrigue.
5. LINKS: You MUST append the direct link provided to the end of every copy variation.
6. DATA DENSE: Highlight the hard facts (sqm, price, capacity, location) provided.

VARIATIONS:
- fastPitch: A short, punchy, numbers-driven summary (perfect for X/Twitter/WhatsApp). Max 280 characters.
- executiveSummary: A data-dense pitch focusing on hard intelligence like yield, capacity, or location anchors (perfect for LinkedIn/Email).
- editorialHook: A narrative-driven caption focusing on the property's "Space Story" and vibe (perfect for Facebook/Instagram).
`;

export async function POST(request) {
  try {
    const { property, role, tier, link } = await request.json();

    if (!property) {
      return NextResponse.json({ error: 'Missing property data' }, { status: 400 });
    }

    // Process entitlements: Premium tiers get this feature included
    let generateAll = false;
    if (tier && tier !== 'starry') {
      generateAll = true;
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `${PROMOTE_SYSTEM_PROMPT}

Target Link to Append: ${link || "https://scoutit.com/"}

Property/Unit Details:
${JSON.stringify(property, null, 2)}

Return a JSON object containing the three string fields: fastPitch, executiveSummary, editorialHook.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fastPitch: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            editorialHook: { type: Type.STRING }
          }
        }
      }
    });

    const output = JSON.parse(response.text);

    // If the user hasn't unlocked the premium hooks, redact them
    if (!generateAll) {
      output.executiveSummary = null;
      output.editorialHook = null;
    }

    return NextResponse.json({ success: true, data: output });

  } catch (error) {
    console.error('[Promote AI] Error:', error);
    return NextResponse.json({ error: 'Failed to generate copy' }, { status: 500 });
  }
}
