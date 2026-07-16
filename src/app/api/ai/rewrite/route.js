import { NextResponse } from 'next/server';
import { GEMINI_MODEL } from '@/lib/geminiModel';
import { GoogleGenAI } from '@google/genai';

const SEO_OPTIMIZE_PROMPT = `
You are an elite Real Estate SEO and Generative Engine Optimization (GEO) expert. Your job is to rewrite the provided property description so it ranks #1 on traditional search engines AND is highly citable by AI overviews (ChatGPT, Perplexity, Google AI).

Follow these strict rules:

### 1. GEO-First Formatting (AI Citability)
- Structure the content logically with clear, declarative statements.
- Ensure the first paragraph is a highly citable, meta-friendly summary of the property.
- Use bullet points for specific amenities, sizes, and specs—AI engines prioritize extracting structured lists.
- Naturally embed keywords related to the location, property type, and target audience (do not keyword stuff).

### 2. "White-Glove Luxury" Brand Voice
- **Tone:** Exclusive, high-end, and professional yet approachable.
- **Vocabulary:** Cinematic & evocative (e.g., bespoke, curated, panoramic, seamless, prestige, uncompromising).
- **Style:** Authoritative and trustworthy. Avoid tentative language ("might be", "we think").
- **Concise:** Every word must add value. Avoid fluff.

### 3. Output Constraints
- Only return the rewritten text.
- Do not include conversational filler, pleasantries, or explanations.
`;

export async function POST(request) {
  try {
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
