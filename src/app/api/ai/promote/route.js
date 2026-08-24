import { NextResponse } from 'next/server';
import { extractFacts, factSpecs, buildPromoPack } from '@/lib/shareBriefing';
import { SITE_URL } from '@/lib/siteUrl';
import { GEMINI_MODEL } from '@/lib/geminiModel';
import { resolveUserId } from '@/lib/serverAuth';
import { isPreLaunchFreeMode } from '@/lib/featureFlags';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { tierRank } from '@/lib/entitlements';
import { createRateLimiter } from '@/lib/rateLimit';
import { clientIp } from '@/lib/clientIp';

// ── Tier is decided HERE, never by the caller ────────────────────────────────
// This route used to read `tier` straight out of the request body, so anyone —
// including a logged-out visitor — could send `tier: "universe"` and receive the
// premium formats for free. The paywall existed in the UI only.
//
// While `pre_launch_free_mode` is on (its default), everyone still gets every
// format exactly as they do today — that flag is the lever for the launch
// period. The moment it's switched off from Mission Control, the tier comes
// from the signed-in user's own profile row and anonymous callers drop to the
// free tier. No deploy needed to flip it either way.
async function resolveTier(request) {
  if (await isPreLaunchFreeMode()) {
    return { tier: 'universe', freeMode: true };
  }

  const userId = await resolveUserId(request);
  if (!userId || !supabaseAdmin) return { tier: 'starry', freeMode: false };

  const { data } = await supabaseAdmin
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .maybeSingle();

  return { tier: data?.subscription_tier || 'starry', freeMode: false };
}

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

// ── SPEND CEILING (A-012) ────────────────────────────────────────────────────
// This route is anonymous by design while `pre_launch_free_mode` is on, and
// every accepted call can spend Gemini tokens. Anonymous + billed + unmetered
// is the combination that turns a quiet week into an invoice.
//
// 10/minute is generous for the real interaction — a person opening the Promote
// modal and pressing regenerate a few times — and useless for a loop.
const PROMOTE_LIMIT_PER_MINUTE = 10;
const checkPromoteRate = createRateLimiter({
  limit: PROMOTE_LIMIT_PER_MINUTE,
  windowMs: 60_000,
  maxKeys: 20_000,
});

export async function POST(request) {
  // Metered before the body is read: a refusal must cost less than an accept.
  const rate = checkPromoteRate(clientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Too many promote requests', retryAfterSeconds: rate.retryAfterSeconds },
      {
        status: 429,
        headers: {
          'Cache-Control': 'private, no-store',
          'Retry-After': String(rate.retryAfterSeconds),
        },
      }
    );
  }

  let property, role, link;
  try {
    // `tier` is deliberately NOT read from the body — see resolveTier above.
    ({ property, role, link } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!property) {
    return NextResponse.json({ error: 'Missing property data' }, { status: 400 });
  }

  const safeLink = link || SITE_URL;
  // Premium tiers get all three formats; free tier gets the fast pitch only.
  const { tier } = await resolveTier(request);
  const generateAll = tierRank(tier) > tierRank('starry');

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
