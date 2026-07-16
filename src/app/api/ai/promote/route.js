import { NextResponse } from 'next/server';
import { extractFacts, factSpecs, buildPromoPack } from '@/lib/shareBriefing';
import { SITE_URL } from '@/lib/siteUrl';
import { GEMINI_MODEL } from '@/lib/geminiModel';

const PROMOTE_SYSTEM_PROMPT = `
You are an elite real estate copywriter for ScoutIt, a premium commercial and residential real estate directory (the "Bloomberg for Space").

Your task is to generate 3 variations of social media promotional copy based on the provided FACT SHEET.

RULES (Strictly enforced):
1. TONE: "Bloomberg for Space". Confident, premium, editorial, data-dense, strategic.
2. NO EMOJIS. None. Ever. Do not use emojis anywhere.
3. NO FLUFF. Avoid cheap marketing terms like "dream home", "act fast", "next-generation", "stunning".
4. FACTUAL ONLY: You may ONLY state facts that appear in the FACT SHEET below. Never invent amenities, views, awards, yields, prices, or neighborhood claims that are not listed. If a detail is absent, omit it — do not guess.
5. NO MONEY: Never mention prices, rents, or any monetary figure, even if implied.
6. BRANDING: You MUST organically include "ScoutIt" in every copy variation.
7. LINKS: You MUST append the direct link provided to the end of every copy variation.
8. DATA DENSE: Lead with the hard facts (sqm, capacity, grade, location) from the fact sheet.

VARIATIONS:
- fastPitch: A short, punchy, numbers-driven summary (perfect for X/Twitter/WhatsApp). Max 280 characters.
- executiveSummary: A data-dense pitch built strictly from the fact sheet (perfect for LinkedIn/Email).
- editorialHook: A narrative caption about the space's documented character (perfect for Facebook/Instagram) — still zero invented claims.
`;

// Render the whitelisted facts as a compact sheet. Only these lines reach the
// model — never the raw property object — so the copy can't leak private
// fields or hallucinate around junk data.
function renderFactSheet(property) {
  const f = extractFacts(property);
  const specs = factSpecs(f);
  const lines = [
    `Title: ${f.title}`,
    `Category: ${f.category}`,
  ];
  if (f.location) lines.push(`Location: ${f.location}`);
  specs.forEach((s) => lines.push(`Spec: ${s}`));
  if (f.aestheticTag) lines.push(`Design character: ${f.aestheticTag}`);
  return lines.join('\n');
}

export async function POST(request) {
  let property, role, tier, link;
  try {
    ({ property, role, tier, link } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!property) {
    return NextResponse.json({ error: 'Missing property data' }, { status: 400 });
  }

  const safeLink = link || SITE_URL;
  // Premium tiers get all three formats; free tier gets the fast pitch only.
  const generateAll = Boolean(tier && tier !== 'starry');

  // The deterministic pack is both the fallback AND the guarantee that this
  // endpoint always answers with factual copy — even with no AI key at all.
  const factualPack = buildPromoPack(property, safeLink);

  let output = null;
  let source = 'factsheet';

  // E2E determinism: tests send x-skip-ai to exercise the guaranteed
  // fact-sheet path instead of a live (rate-limited, slow) AI call.
  const skipAi = request.headers.get('x-skip-ai') === '1';

  if (!skipAi && process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const prompt = `${PROMOTE_SYSTEM_PROMPT}

Target Link to Append: ${safeLink}

FACT SHEET (the only permitted source of claims):
${renderFactSheet(property)}

Return a JSON object containing the three string fields: fastPitch, executiveSummary, editorialHook.`;

      // A slow/hung AI call must never stall the modal — past ~20s we serve
      // the deterministic factual pack instead.
      const AI_TIMEOUT_MS = 20000;
      const response = await Promise.race([
        ai.models.generateContent({
          model: GEMINI_MODEL,
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
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`AI response exceeded ${AI_TIMEOUT_MS}ms`)), AI_TIMEOUT_MS)
        ),
      ]);

      const parsed = JSON.parse(response.text);
      // Only accept a complete pack; anything partial falls back to facts.
      if (parsed?.fastPitch && parsed?.executiveSummary && parsed?.editorialHook) {
        output = parsed;
        source = 'ai';
      }
    } catch (error) {
      console.error('[Promote AI] Falling back to fact sheet copy:', error?.message || error);
    }
  }

  if (!output) output = { ...factualPack };

  // Free tier: redact the premium formats.
  if (!generateAll) {
    output.executiveSummary = null;
    output.editorialHook = null;
  }

  return NextResponse.json({ success: true, data: output, source });
}
