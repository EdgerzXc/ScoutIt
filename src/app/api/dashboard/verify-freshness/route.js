import { NextResponse } from "next/server";
import { z } from "zod";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { getFreshness } from "@/lib/freshness";

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

const AIRTABLE_BASE_URL = "https://api.airtable.com/v0";

const schema = z.object({
  propertyIds: z.array(z.string().uuid()).min(1).max(50),
});

function fail(message, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

/**
 * Stamps Last_Verified_Date on an Airtable PROPERTIES_CMS record.
 * Returns true on success. Never throws — a CMS hiccup must not lose the
 * owner's confirmation, which is already safe in Supabase.
 */
async function stampAirtable(slug, isoDate) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId || !slug) return false;

  try {
    const params = `filterByFormula=${encodeURIComponent(`{Slug}='${slug}'`)}&maxRecords=1`;
    const findRes = await fetch(`${AIRTABLE_BASE_URL}/${baseId}/PROPERTIES_CMS?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!findRes.ok) return false;

    const found = await findRes.json();
    const recordId = found?.records?.[0]?.id;
    if (!recordId) return false; // not published to Airtable yet — fine

    const patchRes = await fetch(`${AIRTABLE_BASE_URL}/${baseId}/PROPERTIES_CMS/${recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Last_Verified_Date ONLY. Never Slug — it's a formula field.
      body: JSON.stringify({ fields: { Last_Verified_Date: isoDate }, typecast: true }),
    });

    return patchRes.ok;
  } catch (error) {
    console.error("[verify-freshness] Airtable stamp failed:", error.message);
    return false;
  }
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
      const ok = await stampAirtable(property.slug, iso);
      airtableResults.push({ slug: property.slug, synced: ok });
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
