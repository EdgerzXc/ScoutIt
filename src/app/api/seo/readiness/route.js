// ═══════════════════════════════════════════════════════════════
// PROPERTY SEO READINESS AUDIT API (SEO-01 / Wave 2)
//
// GET /api/seo/readiness?propertyId=<slug_or_uuid>
//
// ⚠️ REWRITTEN 2026-08-06 (§55). The original shipped as "code complete" and
// had never been called. When W11 went to build its UI, it turned out to be
// reading SIX columns that do not exist on `public.properties`:
//
//     prop.address · prop.photos · prop.category
//     prop.property_type · prop.metadata · prop.status
//
// Every check therefore evaluated against `undefined` and returned false, and
// `isIndexEligible` compared `prop.status === "LIVE"` — a missing column
// against a value that isn't even the right case (`lifecycle_state` is
// lowercase 'live'). The endpoint reported EVERY listing as un-indexable, with
// total confidence and a precise-looking score.
//
// Building the dashboard panel on top of that would have told all 13 owners
// their listings were broken. Verified against the live database, not against
// a document (§49).
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { computeListingStrength } from "@/lib/listingStrength";
import { findProperty } from "@/lib/propertyLookup";
import { resolveUserId } from "@/lib/serverAuth";
import { normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { buildReadinessReport } from "@/lib/seoReadiness";
import { sanitizeError } from "@/lib/sanitizeError";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing required propertyId parameter" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // ── AUTHENTICATION (added 2026-08-06) ────────────────────────────
    // The original route was fully public. It is an OWNER diagnostic — it
    // enumerates exactly what is missing from a listing, which is a map of
    // that listing's weaknesses handed to anyone who asks for it by slug.
    // Nothing about it needs to be anonymous, so it isn't.
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: sign in to audit a listing" },
        { status: 401 }
      );
    }

    const { property: prop, error: lookupErr } = await findProperty(supabaseAdmin, propertyId);

    // "Query failed" and "no such row" are reported separately. Collapsing them
    // into one 404 is precisely what hid the broken `.or()` filter for weeks.
    if (lookupErr) {
      console.error("[SEO READINESS API] Lookup failed:", lookupErr);
      return NextResponse.json(
        { error: sanitizeError(lookupErr, "Could not look up that property.") },
        { status: 500 }
      );
    }
    if (!prop) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Owner or staff only.
    if (prop.owner_id && String(prop.owner_id) !== String(userId)) {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("active_roles")
        .eq("id", userId)
        .maybeSingle();
      const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
      // `=== good`, never `!== bad` — a negative gate fails OPEN, which is
      // exactly how the age gate broke (§47.2).
      const isStaff = roles.includes("admin") || roles.includes("staff");
      if (!isStaff) {
        return NextResponse.json(
          { error: "Forbidden: you do not own this listing" },
          { status: 403 }
        );
      }
    }

    const lifecycle = normalizeLifecycleState(prop);
    const report = buildReadinessReport(prop, {
      strength: computeListingStrength,
      lifecycle,
      liveState: PROPERTY_LIFECYCLE_STATES.LIVE,
    });

    return NextResponse.json({
      success: true,
      propertyId: prop.id,
      slug: prop.canonical_slug || prop.slug,
      lifecycleState: lifecycle,
      ...report,
    });
  } catch (err) {
    console.error("[SEO READINESS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not audit SEO readiness.") },
      { status: 500 }
    );
  }
}
