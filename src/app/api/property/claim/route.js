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
import { getActiveListingCap } from "@/lib/propertyLifecycle";
import { sanitizeError } from "@/lib/sanitizeError";
import { notifyUser } from "@/lib/notifications";
import {
  claimDocumentFilename, CLAIM_DOCUMENT_BUCKET, CLAIM_DOCUMENT_MAX_BYTES,
  CLAIM_DOCUMENT_MIMES, CLAIM_DOCUMENT_TYPES,
} from "@/lib/claimDocumentPath.mjs";

async function lookupClaimDocuments(documents, userId, property) {
  if (documents == null || (Array.isArray(documents) && documents.length === 0)) return [];
  if (!Array.isArray(documents) || documents.length > 4) return null;
  const propertyIds = [property.id, property.slug, property.canonical_slug];
  const filenames = documents.map((item) => claimDocumentFilename(item?.storagePath, userId, propertyIds));
  if (filenames.some((name) => !name) ||
      new Set(documents.map((item) => item.storagePath)).size !== documents.length ||
      documents.some((item) => !CLAIM_DOCUMENT_TYPES.has(item.documentType))) return null;

  const storage = supabaseAdmin.storage;
  const { data: bucketDetails, error: bucketError } = await storage.getBucket(CLAIM_DOCUMENT_BUCKET);
  if (bucketError || bucketDetails?.public !== false) {
    throw new Error("The private claim bucket is unavailable");
  }
  const bucket = storage.from(CLAIM_DOCUMENT_BUCKET);
  const verified = await Promise.all(documents.map(async (item, index) => {
    const filename = filenames[index];
    const mimeType = CLAIM_DOCUMENT_MIMES[filename.split(".").at(-1).toLowerCase()];
    const { data, error } = await bucket.info(item.storagePath);
    if (error) {
      if (Number(error.statusCode || error.status) === 404) return null;
      throw error;
    }
    if (data?.contentType !== mimeType || !Number.isInteger(data.size) ||
        data.size <= 0 || data.size > CLAIM_DOCUMENT_MAX_BYTES) return null;
    return {
      document_type: item.documentType,
      private_storage_path: item.storagePath,
      original_filename: filename,
      mime_type: mimeType,
      file_size_bytes: data.size,
      malware_scan_status: "pending",
      ocr_status: "pending",
    };
  }));
  return verified.includes(null) ? null : verified;
}

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

    let userTier = "starry";
    let userRoles = [];
    let isOwner = false;
    let activeLiveCount = 0;
    let listingCap = 1;
    let atListingCap = false;

    try {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("id, role, active_roles, subscription_tier")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        userTier = profile.subscription_tier || "starry";
        const role = profile.role || "owner";
        userRoles = Array.isArray(profile.active_roles) ? profile.active_roles : (profile.role ? [profile.role] : []);
        isOwner = userRoles.includes("owner");
        listingCap = getActiveListingCap({ tier: userTier, role });
      }

      const { data: liveRows } = await supabaseAdmin
        .from("properties")
        .select("id")
        .eq("owner_id", userId)
        .eq("pipeline_status", "approved");

      activeLiveCount = (liveRows || []).filter((p) => p.id !== property.id).length;
      atListingCap = activeLiveCount >= listingCap;
    } catch {
      // Graceful fallback for mock or isolated test environments
    }

    return NextResponse.json({
      success: true,
      claimable,
      signedIn: true,
      isOwnListing,
      propertyId: property.id,
      propertyTitle: property.title,
      userTier,
      userRoles,
      isOwner,
      activeLiveCount,
      listingCap,
      atListingCap,
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid claim form." }, { status: 400 });
    }
    const { propertyId, claimedRelationship, agreed, documents } = body;

    if (typeof propertyId !== "string" || !propertyId.trim() || propertyId.length > 200) {
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

    const verifiedDocuments = await lookupClaimDocuments(documents, userId, property);
    if (!verifiedDocuments) {
      return NextResponse.json({ error: "One or more attachments are unavailable. Upload them again for this listing." }, { status: 422 });
    }

    const { data: claim, error: insertErr } = await supabaseAdmin
      .from("property_claims")
      .insert({
        // The resolved uuid, not the caller's slug. The column is TEXT, so a
        // slug would have inserted happily and then never joined to anything.
        property_id: property.id,
        claimant_user_id: userId,
        claimed_relationship: relationship,
        status: verifiedDocuments.length ? "draft" : "submitted",
        declaration_version: DISCLAIMER_VERSION,
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") return NextResponse.json({ error: "You already have an active claim for this property." }, { status: 409 });
      console.error("[PROPERTY CLAIM] Insert failed:", insertErr);
      return NextResponse.json(
        { error: sanitizeError(insertErr, "Could not submit property claim.") },
        { status: 500 }
      );
    }

    if (verifiedDocuments.length) {
      const { error: docsErr } = await supabaseAdmin
        .from("property_claim_documents")
        .insert(verifiedDocuments.map((document) => ({ claim_id: claim.id, ...document })));
      if (!docsErr) {
        const { data: submitted, error } = await supabaseAdmin
          .from("property_claims").update({ status: "submitted" })
          .eq("id", claim.id).eq("claimant_user_id", userId).eq("status", "draft")
          .select("id").maybeSingle();
        if (!error && submitted?.id === claim.id) claim.status = "submitted";
      }
      if (claim.status === "draft") {
        const { data: deleted, error } = await supabaseAdmin.from("property_claims")
          .delete().eq("id", claim.id).eq("claimant_user_id", userId).eq("status", "draft")
          .select("id").maybeSingle();
        if (!error && deleted?.id === claim.id) {
          return NextResponse.json({ error: "Could not save the attachments. Try submitting again." }, { status: 503 });
        }
        console.error("[PROPERTY CLAIM] Could not confirm attachment submission:", claim.id);
        return NextResponse.json({ error: "Could not confirm this claim submission. Check the listing’s claim status before retrying." }, { status: 503 });
      }
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
        documents_count: verifiedDocuments.length,
        document_types: verifiedDocuments.map((d) => d.document_type),
      },
    });
    if (eventErr) {
      console.error("[PROPERTY CLAIM] Audit event failed for claim", claim.id, eventErr);
    }

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      autoVerified: false,
      routedToStaff: true,
      staffReviewReason: "Staff will review the claim and any attached documents.",
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
