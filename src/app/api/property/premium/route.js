import { NextResponse } from "next/server";
import { fetchProperties } from "@/lib/airtable";
import { resolveServerTier } from "@/lib/serverAuth";
import { pickPremiumFields } from "@/lib/premiumFields";
import { sanitizeError } from "@/lib/sanitizeError";

// ═══════════════════════════════════════════════════════════════
// PREMIUM PROPERTY FIELDS — the tier gate that actually holds
// NEW_IDEAS.md §25.1 / §45
// ═══════════════════════════════════════════════════════════════
//
// `/property/[id]` is ISR: one document, every visitor, no session. So the
// static payload now ships with premium fields stripped (see
// lib/premiumFields.js) and entitled users come here for the real values.
//
// The tier is resolved SERVER-SIDE from the session by `resolveServerTier` —
// the §24.4 pattern proven on /api/ai/promote. It is never read from the
// request body, a header, or anything else the caller controls. That was the
// whole §25.1 finding: `getCurrentTier()` reads localStorage, so a browser
// console could award itself Universe.
//
// Dynamic and uncached on purpose: the response varies per user, and an edge
// or CDN cache keyed only on the URL would serve one subscriber's unlocked
// payload to the next anonymous visitor — reintroducing the exact leak this
// route exists to close.

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    // Resolves to 'universe' while pre_launch_free_mode is on, otherwise from
    // user_profiles.subscription_tier; anonymous callers fall to 'starry'.
    const { tier, freeMode } = await resolveServerTier(request);

    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (!apiKey || !baseId) {
      return NextResponse.json({ error: "Catalog unavailable" }, { status: 503 });
    }

    const properties = await fetchProperties(apiKey, baseId);
    const property = (properties || []).find((p) => p.slug === slug);

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Returns ONLY what this tier is entitled to. A starry viewer gets `{}` —
    // not a 403, because "you can't see this" is already communicated by the
    // locked teaser the page rendered. An error here would just be noise in
    // the console for the majority of visitors.
    const fields = pickPremiumFields(property, tier);

    return NextResponse.json(
      { tier, freeMode, fields },
      {
        headers: {
          // Belt and braces alongside `force-dynamic`: this response is
          // per-user and must never be held by a shared cache.
          "Cache-Control": "no-store, private",
        },
      },
    );
  } catch (err) {
    console.error("[PREMIUM FIELDS] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
