// ═══════════════════════════════════════════════════════════════
// PROPERTY CLAIM (OWN-01 · §37 · WORK ORDER W8)
//
// The Owner Sovereignty promise, made actionable: a broker's listing is
// PROVISIONAL until the real title holder asserts. This is where they assert.
//
// ⚠️ VOCABULARY UNIFIED 2026-08-06 (§55). This route used to hardcode
// 'direct_owner' / 'authorized_manager' / 'authorized_broker' while
// `properties.lister_relationship` and `src/lib/listerRelationship.js` used
// 'owner' / 'property_manager' / 'authorized_broker'. Only the third matched.
// A claim asserting ownership would have been stored under a different word
// than the listing's own declaration, and the comparison a RESA dispute turns
// on — "does this claim contradict what the lister declared?" — would have
// silently found nothing.
//
// Requires migration `20260806000006_unify_claim_relationship_vocabulary.sql`.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { findProperty } from "@/lib/propertyLookup";
import {
  canonicalRelationship,
  isClaimable,
  DISCLAIMER_VERSION,
} from "@/lib/listerRelationship";
import { sanitizeError } from "@/lib/sanitizeError";
import { notifyUser } from "@/lib/notifications";

/** Statuses that mean a claim is still in play. */
const OPEN_STATUSES = [
  "draft",
  "submitted",
  "technical_review",
  "needs_information",
  "human_review",
  "disputed",
];

// ─────────────────────────────────────────────────────────────────────────
// GET /api/property/claim?propertyId=<slug_or_uuid>
//
// "Can I claim this, and have I already?" The UI needs both answers before it
// can decide what to render, and without this endpoint it would have to guess
// — which in practice means showing "Claim This Property" to someone whose
// claim is already under review.
// ─────────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "Missing propertyId" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    const { property, error: lookupErr } = await findProperty(supabaseAdmin, propertyId, [
      "id",
      "slug",
      "canonical_slug",
      "title",
      "owner_id",
      "verified",
      "lister_relationship",
    ]);
    if (lookupErr) {
      console.error("[PROPERTY CLAIM] Lookup failed:", lookupErr);
      return NextResponse.json(
        { error: sanitizeError(lookupErr, "Could not look up that property.") },
        { status: 500 }
      );
    }
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const userId = await resolveUserId(request);

    // `owner_verified` is the field isClaimable() reads; the column is
    // `verified`. Mapped here rather than renaming a column that a dozen other
    // places already read.
    const claimable = isClaimable({
      lister_relationship: property.lister_relationship,
      owner_verified: property.verified === true,
    });

    // Anonymous callers learn the claimability of the LISTING and nothing about
    // any person. Whether somebody else has a claim open is not public — that
    // would leak "this property is contested" to anyone who asks.
    if (!userId) {
      return NextResponse.json({
        success: true,
        claimable,
        signedIn: false,
        isOwnListing: false,
        myClaim: null,
      });
    }

    const isOwnListing = !!property.owner_id && String(property.owner_id) === String(userId);

    const { data: myClaim } = await supabaseAdmin
      .from("property_claims")
      .select("id, status, claimed_relationship, created_at")
      .eq("property_id", property.id)
      .eq("claimant_user_id", userId)
      .in("status", OPEN_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      claimable,
      signedIn: true,
      isOwnListing,
      propertyId: property.id,
      propertyTitle: property.title,
      myClaim: myClaim || null,
    });
  } catch (err) {
    console.error("[PROPERTY CLAIM] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load claim status.") },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to submit a property claim" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, claimedRelationship, agreed } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json({ error: "Missing or invalid propertyId" }, { status: 400 });
    }

    // Accepts canonical values, and maps the legacy spellings so a stale client
    // can't 400 during the changeover. Anything else is rejected outright —
    // never defaulted. A default here would manufacture a claim of ownership
    // out of a typo (§47.2, §50).
    const relationship = canonicalRelationship(claimedRelationship);
    if (!relationship) {
      return NextResponse.json(
        { error: "Select how you are related to this property." },
        { status: 400 }
      );
    }

    // `=== true` only. The claim is a legal assertion; a truthy value is not an
    // acknowledgement, and the publish gate validates the identical way.
    if (agreed !== true) {
      return NextResponse.json(
        { error: "You must acknowledge the claim terms to continue." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    // ── The property must exist, and must actually be claimable ──────
    // The original route inserted against a bare `propertyId` string with no
    // lookup at all, so a claim could be filed against a property that does not
    // exist, or against one whose owner is already verified. Both produce a
    // review-queue item a human then has to work out and close.
    const { property, error: lookupErr } = await findProperty(supabaseAdmin, propertyId, [
      "id",
      "title",
      "owner_id",
      "verified",
      "lister_relationship",
    ]);
    if (lookupErr) {
      console.error("[PROPERTY CLAIM] Lookup failed:", lookupErr);
      return NextResponse.json(
        { error: sanitizeError(lookupErr, "Could not look up that property.") },
        { status: 500 }
      );
    }
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (property.owner_id && String(property.owner_id) === String(userId)) {
      return NextResponse.json(
        { error: "This listing is already yours — there is nothing to claim." },
        { status: 409 }
      );
    }

    if (
      !isClaimable({
        lister_relationship: property.lister_relationship,
        owner_verified: property.verified === true,
      })
    ) {
      return NextResponse.json(
        {
          error:
            "This listing's owner is already verified. Ownership disputes go through " +
            "support rather than the claim flow.",
        },
        { status: 409 }
      );
    }

    // Duplicate active claim by the same user. Also enforced by a partial
    // unique index in migration 20260806000006 — the check here produces a
    // decent message, the index guarantees the invariant under a race.
    const { data: existing } = await supabaseAdmin
      .from("property_claims")
      .select("id, status")
      .eq("property_id", property.id)
      .eq("claimant_user_id", userId)
      .in("status", OPEN_STATUSES)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: "You already have an active claim for this property",
          claimId: existing.id,
          status: existing.status,
        },
        { status: 409 }
      );
    }

    const { data: claim, error: insertErr } = await supabaseAdmin
      .from("property_claims")
      .insert({
        // The resolved uuid, not the caller's slug. The column is TEXT, so a
        // slug would have inserted happily and then never joined to anything.
        property_id: property.id,
        claimant_user_id: userId,
        claimed_relationship: relationship,
        status: "submitted",
        declaration_version: DISCLAIMER_VERSION,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("[PROPERTY CLAIM] Insert failed:", insertErr);
      return NextResponse.json(
        { error: sanitizeError(insertErr, "Could not submit property claim.") },
        { status: 500 }
      );
    }

    // GAP-21 & GAP-39: Notify claimant and property owner of submitted claim with immediate email
    await notifyUser(supabaseAdmin, {
      userId,
      title: "Property claim submitted",
      desc: `Your ownership claim for "${property.title}" has been submitted for review.`,
      propertyId: property.id,
      notificationType: "claim_submitted",
      forceEmail: true,
    });

    if (property.owner_id) {
      await notifyUser(supabaseAdmin, {
        userId: property.owner_id,
        title: "Ownership claim filed",
        desc: `An ownership claim has been submitted for "${property.title}" and is currently under review.`,
        propertyId: property.id,
        notificationType: "claim_filed",
        forceEmail: true,
      });
    }

    // Audit trail. Never allowed to fail the request — but no longer swallowed
    // silently either: a claim with no event row is a gap in a legal record, and
    // somebody needs to be able to find out why.
    const { error: eventErr } = await supabaseAdmin.from("property_claim_events").insert({
      claim_id: claim.id,
      actor_id: userId,
      event_type: "CLAIM_SUBMITTED",
      payload: {
        relationship,
        declaration_version: DISCLAIMER_VERSION,
        // What the listing said at the moment of the claim. In a dispute, the
        // contradiction between these two is the whole question.
        property_lister_relationship: property.lister_relationship ?? null,
      },
    });
    if (eventErr) {
      console.error("[PROPERTY CLAIM] Audit event failed for claim", claim.id, eventErr);
    }

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      message: "Property claim submitted for verification.",
    });
  } catch (err) {
    console.error("[PROPERTY CLAIM] Failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not submit property claim.") },
      { status: 500 }
    );
  }
}

/**
 * GAP-38: Approves a property claim, transfers `properties.owner_id`, and
 * promotes the claimant's `user_profiles.active_roles` to include `'owner'`
 * so the claimant can immediately access Owner Mode in the dashboard.
 */
export async function approvePropertyClaim(serviceClient, { claimId, reviewerId = null }) {
  if (!serviceClient || !claimId) {
    return { ok: false, error: "Missing serviceClient or claimId" };
  }

  const { data: claim, error: claimErr } = await serviceClient
    .from("property_claims")
    .select("id, property_id, claimant_user_id, claimed_relationship, status")
    .eq("id", claimId)
    .maybeSingle();

  if (claimErr || !claim) {
    return { ok: false, error: claimErr?.message || "Claim not found" };
  }

  const nowIso = new Date().toISOString();

  const { error: updateClaimErr } = await serviceClient
    .from("property_claims")
    .update({ status: "approved", updated_at: nowIso })
    .eq("id", claimId);
  if (updateClaimErr) {
    return { ok: false, error: updateClaimErr.message };
  }

  await serviceClient
    .from("properties")
    .update({
      owner_id: claim.claimant_user_id,
      verified: true,
      lister_relationship: claim.claimed_relationship || "owner",
      updated_at: nowIso,
    })
    .eq("id", claim.property_id);

  // Promote claimant user_profiles to include 'owner' in active_roles
  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("id, role, active_roles")
    .eq("id", claim.claimant_user_id)
    .maybeSingle();

  const existingRoles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  const nextRoles = Array.from(new Set([...existingRoles, "owner"]));

  await serviceClient
    .from("user_profiles")
    .update({
      role: profile?.role && profile.role !== "seeker" ? profile.role : "owner",
      active_roles: nextRoles,
      updated_at: nowIso,
    })
    .eq("id", claim.claimant_user_id);

  try {
    await serviceClient.from("property_claim_events").insert({
      claim_id: claim.id,
      actor_id: reviewerId || claim.claimant_user_id,
      event_type: "CLAIM_APPROVED",
      payload: {
        owner_id: claim.claimant_user_id,
        granted_roles: nextRoles,
      },
    });
  } catch (err) {
    console.warn("[PROPERTY CLAIM] Could not write approval event:", err?.message);
  }

  await notifyUser(serviceClient, {
    userId: claim.claimant_user_id,
    title: "Property claim approved",
    desc: "Your property ownership claim has been verified and Owner Mode is now active on your account.",
    propertyId: claim.property_id,
    notificationType: "claim_approved",
    forceEmail: true,
  });

  return { ok: true, claimId: claim.id, ownerId: claim.claimant_user_id, activeRoles: nextRoles };
}
