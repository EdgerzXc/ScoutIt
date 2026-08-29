import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { getFreshness } from "@/lib/freshness";
import { stampAirtableFreshness } from "@/lib/airtableFreshness";

// ─────────────────────────────────────────────────────────────────────────
// RE-VERIFICATION GATE  (NEW_IDEAS.md §21)
//
//   GET  /api/dashboard/verify-freshness
//        -> the caller's portfolio with a freshness tier on each listing
//
//   POST /api/dashboard/verify-freshness { propertyIds: [...] }
//        -> "No changes — confirm freshness". Stamps last_verified_date = now
//           on Supabase AND Airtable's Last_Verified_Date.
//
// This closes a loop that has been open in production: the daily cron has
// been telling owners "Re-confirm its details to keep it trustworthy" while
// no re-confirm path existed anywhere in the app.
//
// WHAT CONFIRMING MEANS: the owner is asserting the listing is still
// accurate. It is a claim they are making, not a button that improves a
// score — so it's owner-only, per-listing, and never bulk-applied to
// anything they don't own. The wording in the UI has to match that.
//
// AIRTABLE: writes ONLY Last_Verified_Date. Never Slug (formula field,
// AGENTS.md §2). A published listing whose Airtable write fails still gets
// its Supabase timestamp, and the response reports the partial outcome
// rather than pretending everything worked.
// ─────────────────────────────────────────────────────────────────────────

const schema = z.object({
  propertyIds: z.array(z.string().uuid()).min(1).max(50),
});

function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

// ── GET: portfolio freshness ─────────────────────────────────────────────
export async function GET(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    const { data: properties, error } = await supabaseAdmin
      .from("properties")
      .select("id, slug, title, location, last_verified_date, pipeline_status")
      .eq("owner_id", userId)
      .is("archived_at", null)
      .neq("pipeline_status", "archived");

    if (error) throw error;

    const items = (properties || []).map((p) => {
      const freshness = getFreshness(p.last_verified_date);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        location: p.location,
        lastVerifiedDate: p.last_verified_date,
        pipelineStatus: p.pipeline_status,
        freshness: {
          id: freshness.id,
          label: freshness.label,
          badge: freshness.badge,
          color: freshness.color,
          days: freshness.days,
          ownerNote: freshness.ownerNote,
        },
      };
    });

    return NextResponse.json(
      {
        success: true,
        items,
        needsAttentionCount: items.filter((i) => i.freshness.id !== "fresh").length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/dashboard/verify-freshness] GET failed:", error);
    return fail(sanitizeError(error, "Couldn't load your portfolio freshness."), 500);
  }
}

// ── POST: confirm freshness ──────────────────────────────────────────────
export async function POST(req) {
  try {
    if (!supabaseAdmin) return fail("Server error: missing service role configuration", 500);

    const userId = await resolveUserId(req);
    if (!userId) return fail("Sign in to continue.", 401);

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("Invalid payload");

    // Scope to what the caller actually owns. Never trust the id list — a
    // client could otherwise stamp "verified" on someone else's listing.
    const { data: owned, error: ownError } = await supabaseAdmin
      .from("properties")
      .select("id, slug")
      .eq("owner_id", userId)
      .in("id", parsed.data.propertyIds);

    if (ownError) throw ownError;
    if (!owned?.length) return fail("No matching listings you own.", 403);

    const now = new Date();
    const iso = now.toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("properties")
      .update({ last_verified_date: iso })
      .eq("owner_id", userId)
      .in("id", owned.map((p) => p.id));

    if (updateError) throw updateError;

    // Mirror to Airtable for anything published. Sequential rather than
    // parallel: Airtable rate-limits at 5 req/s per base and blowing that
    // takes the public site's CMS proxy down with it (see cmsCache.js).
    const airtableResults = [];
    for (const property of owned) {
      if (!property.slug) continue;
      const result = await stampAirtableFreshness({ slug: property.slug, isoDate: iso });
      airtableResults.push({ slug: property.slug, synced: result.ok });
    }

    const failedSync = airtableResults.filter((r) => !r.synced).map((r) => r.slug);

    return NextResponse.json(
      {
        success: true,
        verifiedCount: owned.length,
        verifiedAt: iso,
        // Honest about partial success — the owner's confirmation is saved
        // either way, but a failed CMS sync means the PUBLIC badge is stale.
        ...(failedSync.length ? { cmsSyncPending: failedSync } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[api/dashboard/verify-freshness] POST failed:", error);
    return fail(sanitizeError(error, "Couldn't confirm freshness."), 500);
  }
}
