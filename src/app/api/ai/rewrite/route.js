import { NextResponse } from 'next/server';
import { GEMINI_MODEL } from '@/lib/geminiModel';
import { GoogleGenAI } from '@google/genai';
import { resolveUserId } from '@/lib/serverAuth';

const SEO_OPTIMIZE_PROMPT = `
You are an expert Philippine Real Estate and Generative Engine Optimization (GEO) editor for ScoutIt. Your job is to rewrite the provided property description into clear, truthful, and highly citable architectural prose.

Follow these strict rules:

### 1. Factual Precision (Grounding)
- Strictly preserve facts, dimensions, specs, and features provided in the input text.
- NEVER invent, hallucinate, or estimate amenities, views, materials, or features not stated in the source.
- If a detail is missing or uncertain, do not guess.

### 2. Truthful ScoutIt Voice (No AI Luxury Clichés)
- **Tone:** Grounded, architectural, confident, and professional.
- **BANNED AI CLICHÉS:** You MUST NEVER use generic luxury buzzwords or AI writing clichés, including:
  - "bespoke", "curated", "panoramic", "seamless", "prestige", "uncompromising"
  - "oasis", "nestled", "boasts", "breathtaking", "epitome", "haven", "tapestry", "embark", "testament"
  - "premier", "opulent", "masterpiece", "jewel in the crown", "paradise"
- **Style:** Use precise architectural and spatial terminology (e.g., orientation, floor-to-ceiling clearance, natural cross-ventilation, structural footprint, setback, layout efficiency).
- **Direct & Concise:** Every sentence must convey concrete property facts without fluff or manufactured urgency.

### 3. GEO-First Formatting (AI & Search Citability)
- **Lead Sentence:** Begin with an unambiguous, declarative summary stating property type, specific location/neighborhood, and primary structural specifications.
- **Structured Specifications:** Use concise bullet points for dimensions, room configurations, zoning, and documented amenities.
- **Natural Keywords:** Naturally integrate neighborhood and property category keywords without keyword stuffing.

### 4. Output Constraints
- Return only the rewritten description text.
- Do not include conversational filler, meta-announcements, quotation marks around the whole output, or markdown formatting explanations.
`;


export async function POST(request) {
  try {
    // Dashboard-only tool that spends Gemini quota on caller-supplied text.
    // Left unauthenticated it was a free AI proxy billed to ScoutIt.
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, location, category } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Rewrite] No GEMINI_API_KEY found');
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const contextPrompt = `
Property Category: ${category || 'Unknown'}
Location Context: ${location || 'Unknown'}

Raw Description:
${text}
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${SEO_OPTIMIZE_PROMPT}\n${contextPrompt}`,
    });

    return NextResponse.json({ success: true, text: response.text.trim() });
  } catch (error) {
    console.error('[Rewrite] Error:', error);
    return NextResponse.json({ error: 'Failed to rewrite description' }, { status: 500 });
  }
}
