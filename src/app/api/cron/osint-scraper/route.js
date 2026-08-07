import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";

// ═══════════════════════════════════════════════════════════════════════
// OSINT INGEST — DISARMED 2026-08-06 (§59, full-system audit)
// ═══════════════════════════════════════════════════════════════════════
//
// ── WHAT THIS USED TO DO ───────────────────────────────────────────────
// It was called a "scraper" and it scraped nothing. It held a hardcoded array
// named `PUBLIC_FEEDS` containing three fabricated items and inserted them into
// `intel_sources` as though they had been fetched from real sources:
//
//   sourceName: "PSE EDGE Disclosure"   sourceUrl: https://edge.pse.com.ph
//   rawTitle:   "Megaworld Corporation Allocates ₱350M for BGC Commercial
//                District Expansion"
//   rawContent: "Megaworld Corporation today disclosed to the Philippine Stock
//                Exchange its capital expenditure plan for Q3/Q4, allocating
//                ₱350 million to..."
//
// Megaworld is a real listed company (PSE: MEG). That disclosure does not
// exist. The other two invented a DENR Environmental Compliance Certificate for
// a named Siargao project and a Makati City ordinance ("Resolution 2026-08"),
// each stamped with the genuine government domain.
//
// ── WHY THIS WAS DANGEROUS, NOT JUST UNTIDY ────────────────────────────
// `intel_sources` is the intake queue for `/api/admin/osint`, whose
// `publish_briefing` action writes to `intel_briefings` — which
// `lib/cmsCache.js` merges into `/api/cms` and renders on the PUBLIC /intel
// page. The path from "fabricated row" to "published article carrying ScoutIt's
// byline and a link to the PSE portal" was fully connected, with a human
// clicking Publish on content that looked like a scraper had found it.
//
// Inventing a material financial disclosure about a listed issuer is not a
// placeholder-content problem. And this endpoint had **no authentication at
// all** — no `CRON_SECRET`, no admin check — so any anonymous caller could
// trigger the seeding. It is also absent from `vercel.json`'s `crons`, so it was
// never actually scheduled: pure latent risk with no upside.
//
// ── WHAT IT DOES NOW ───────────────────────────────────────────────────
// 1. Requires staff auth. It is an ingest trigger, not a public endpoint.
// 2. Ingests only from `OSINT_FEEDS`, which is **empty**. No real feed parser
//    has ever been written, and the honest state of "no configured source" is
//    zero rows, not invented ones.
//
// To make this real, add genuine fetch+parse logic that records the actual
// upstream response. Do not repopulate the array by hand: a row in
// `intel_sources` asserts "a real source published this", and nothing further
// down the pipeline ever re-checks that claim.

/**
 * Real upstream OSINT feeds to poll.
 *
 * ⚠️ INTENTIONALLY EMPTY — see the header. Every entry must originate from an
 * actually-fetched document, never from a literal typed by a human or a model.
 *
 * @type {Array<{sourceName: string, sourceUrl: string, rawTitle: string,
 *   rawContent: string, city?: string, region?: string, lat?: number, lng?: number}>}
 */
const OSINT_FEEDS = [];

// GET /api/cron/osint-scraper — staff-triggered ingest
export async function GET(req) {
  try {
    // Not listed in vercel.json crons, so there is no platform caller to
    // exempt. If it is ever scheduled, add a CRON_SECRET branch here — and
    // ENFORCE it rather than skipping when unset, which is how the check in
    // /api/cron/check-stale-listings currently fails open (Rule 6).
    const gate = await requireAdmin(req, { label: "OSINT INGEST" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: "Database service unavailable" }, { status: 503 });
    }

    if (OSINT_FEEDS.length === 0) {
      return NextResponse.json({
        success: true,
        scrapedCount: 0,
        insertedCount: 0,
        note:
          "No OSINT feed source is configured. This endpoint previously seeded fabricated " +
          "filings attributed to real institutions; that data was removed 2026-08-06 (§59). " +
          "Implement real fetch+parse logic before expecting rows.",
        timestamp: new Date().toISOString(),
      });
    }

    let insertedCount = 0;
    for (const item of OSINT_FEEDS) {
      // De-dupe on the raw title so a repeated poll does not stack rows.
      const { data: existing } = await supabaseAdmin
        .from("intel_sources")
        .select("id")
        .eq("raw_title", item.rawTitle)
        .maybeSingle();

      if (existing) continue;

      const { error } = await supabaseAdmin.from("intel_sources").insert({
        source_name: item.sourceName,
        source_url: item.sourceUrl,
        raw_title: item.rawTitle,
        raw_content: item.rawContent,
        city: item.city ?? null,
        region: item.region ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
        status: "pending",
      });

      if (error) {
        // Report rather than swallow — a silent ingest failure looks exactly
        // like "there was no news today" (§58, Rule 18).
        console.error("[OSINT INGEST] Insert failed:", error.message);
        continue;
      }
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      scrapedCount: OSINT_FEEDS.length,
      insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[OSINT INGEST] GET failed:", err);
    return NextResponse.json({ success: false, error: "Ingest failed" }, { status: 500 });
  }
}
