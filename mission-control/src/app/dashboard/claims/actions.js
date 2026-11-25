"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logActionStrict, TIERS } from "@/lib/rbac";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import {
  OPEN_CLAIM_STATUSES,
  REVIEW_TRANSITIONS,
  validateDecision,
} from "@/lib/propertyClaimPolicy.mjs";
import { notifyUser } from "@/lib/notifications";
import { unpublishPropertyFromAirtable } from "@/lib/airtable";

/**
 * Ownership claim review.
 *
 * `property_claims` carried `reviewer_id` and `decision_reason_code` from the
 * day it was created and nothing ever wrote to them. A person could assert
 * ownership of a property somebody else had listed, and there was no surface
 * anywhere — in either app — that could answer them. They were stuck.
 *
 * Approving a claim moves the listing. That is the whole point of the feature
 * and also the reason every guard below exists.
 */

async function addClaimEvent(admin, { claimId, actorId, eventType, payload }) {
  // actor_id is a FK to auth.users. Mission Control staff are auth users, so
  // this is the same person — but a lookup failure must not lose the event, so
  // it is written null-tolerant rather than skipped.
  const { error } = await admin.from("property_claim_events").insert({
    claim_id: claimId,
    actor_id: actorId || null,
    event_type: eventType,
    payload: payload || {},
  });
  if (error) throw new Error(`Could not record the review step: ${error.message}`);
}

/** The claims queue, with everything a reviewer needs to judge one. Ops Manager+. */
export async function loadClaimQueue() {
  const staff = await getCurrentStaff();
  if (!staff) return { claims: [], error: "Not authorised" };
  try {
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch {
    return { claims: [], error: "Not authorised" };
  }

  const admin = createAdminClient();

  const { data: claims, error } = await admin
    .from("property_claims")
    .select(
      "id, property_id, claimant_user_id, claimed_relationship, status, declaration_version, triage_summary, reviewer_id, decision_reason_code, created_at, updated_at"
    )
    .in("status", OPEN_CLAIM_STATUSES)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) return { claims: [], error: "Could not load ownership claims queue." };
  if (!claims?.length) return { claims: [], error: null };

  const claimIds = claims.map((c) => c.id);
  const propertyIds = [...new Set(claims.map((c) => c.property_id))];
  const claimantUserIds = [...new Set(claims.map((c) => c.claimant_user_id).filter(Boolean))];

  // The listing the claim is about, what its lister declared, and claimant profile
  const [properties, documents, events, profiles] = await Promise.all([
    admin
      .from("properties")
      .select("id, slug, canonical_slug, title, location, owner_id, lister_relationship, pipeline_status")
      .in("id", propertyIds),
    admin
      .from("property_claim_documents")
      .select("id, claim_id, document_type, original_filename, private_storage_path, mime_type, file_size_bytes, malware_scan_status, ocr_status, upload_timestamp")
      .in("claim_id", claimIds),
    admin
      .from("property_claim_events")
      .select("id, claim_id, actor_id, event_type, payload, created_at")
      .in("claim_id", claimIds)
      .order("created_at", { ascending: true }),
    claimantUserIds.length > 0
      ? admin
          .from("user_profiles")
          .select("id, display_name, role, active_roles, subscription_tier")
          .in("id", claimantUserIds)
      : Promise.resolve({ data: [] }),
  ]);

  const mainSiteBase = "https://www.scoutit.space";

  const propertyById = Object.fromEntries(
    (properties.data || []).map((p) => [
      p.id,
      {
        ...p,
        publicUrl: p.canonical_slug || p.slug ? `${mainSiteBase}/property/${p.canonical_slug || p.slug}` : null,
      },
    ])
  );

  // Resolve emails cleanly from Supabase Auth when available (user_profiles has no email/full_name column)
  const emailByUserId = {};
  if (typeof admin.auth?.admin?.getUserById === "function" && claimantUserIds.length > 0) {
    await Promise.all(
      claimantUserIds.map(async (uid) => {
        try {
          const { data: authUser } = await admin.auth.admin.getUserById(uid);
          if (authUser?.user?.email) emailByUserId[uid] = authUser.user.email;
        } catch {
          // Non-fatal in unit test or local preview
        }
      })
    );
  }
  const profileById = Object.fromEntries(
    (profiles.data || []).map((prof) => [
      prof.id,
      {
        ...prof,
        full_name: prof.display_name || null,
        email: emailByUserId[prof.id] || null,
      },
    ])
  );

  // Never pre-sign unscanned documents in bulk; generate short-lived links on demand after scan verification.
  const docsWithSignedUrls = (documents.data || []).map((doc) => ({
    ...doc,
    previewUrl: null,
  }));

  const docsByClaim = {};
  for (const d of docsWithSignedUrls) (docsByClaim[d.claim_id] ||= []).push(d);
  const eventsByClaim = {};
  for (const e of events.data || []) (eventsByClaim[e.claim_id] ||= []).push(e);

  return {
    claims: claims.map((c) => ({
      ...c,
      property: propertyById[c.property_id] || null,
      claimant: profileById[c.claimant_user_id] || null,
      documents: docsByClaim[c.id] || [],
      events: eventsByClaim[c.id] || [],
    })),
    error: null,
  };
}

/** Generate a short-lived signed URL on demand only for clean claim documents. Ops Manager+. */
export async function getClaimDocumentUrlAction(docId) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const cleanDocId = typeof docId === "string" ? docId.trim() : "";
  if (!cleanDocId) return { ok: false, error: "Invalid document ID." };

  const admin = createAdminClient();
  const { data: doc, error } = await admin
    .from("property_claim_documents")
    .select("id, claim_id, private_storage_path, malware_scan_status, original_filename")
    .eq("id", cleanDocId)
    .maybeSingle();

  if (error || !doc) return { ok: false, error: "Document record not found." };
  if (doc.malware_scan_status !== "clean") {
    return { ok: false, error: "Blocked: Document has not passed malware verification." };
  }
  if (!doc.private_storage_path) return { ok: false, error: "Storage path missing." };

  const { data: signed, error: signErr } = await admin.storage
    .from("claim-documents")
    .createSignedUrl(doc.private_storage_path, 120);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: "Could not generate signed URL." };
  }

  await logActionStrict({
    staff,
    action: "CLAIM_DOCUMENT_VIEWED",
    targetTable: "property_claim_documents",
    targetId: doc.id,
    reason: "Ops Manager inspected verified claim document",
    metadata: { claim_id: doc.claim_id, filename: doc.original_filename || null },
  });

  return { ok: true, url: signed.signedUrl };
}

/**
 * Decide a claim.
 *
 * One action for all four transitions so the guard, the audit entry and the
 * event are written the same way every time. The alternative — a function per
 * button — is how one of them ends up not recording who did it.
 *
 * Approve is Super Admin. The other three are Ops Manager. Taking a listing
 * off the person holding it is a different weight of decision from asking a
 * claimant for a clearer photograph.
 */
export async function decideClaim(formData) {
  const staff = await getCurrentStaff();
  if (!staff) return { ok: false, message: "Not authorised" };

  const transition = (formData.get("transition") || "").toString();
  if (!Object.hasOwn(REVIEW_TRANSITIONS, transition)) {
    return { ok: false, message: "Unknown decision." };
  }
  const rule = REVIEW_TRANSITIONS[transition];

  try {
    assertTier(staff, rule.transfersListing ? TIERS.SUPER_ADMIN : TIERS.OPS_MANAGER);
  } catch (err) {
    return { ok: false, message: err.message };
  }

  const claimId = (formData.get("claimId") || "").toString().trim();
  const reasonCode = (formData.get("reasonCode") || "").toString().trim();
  const note = (formData.get("note") || "").toString().trim();
  if (!claimId) return { ok: false, message: "Missing claim." };

  const admin = createAdminClient();

  const { data: claim, error: readErr } = await admin
    .from("property_claims")
    .select("id, property_id, claimant_user_id, claimed_relationship, status")
    .eq("id", claimId)
    .single();
  if (readErr || !claim) return { ok: false, message: "That claim no longer exists." };

  // Re-checked against the row as it is NOW, not as the page rendered it.
  // Two reviewers with the queue open is the ordinary case, not the edge one.
  const verdict = validateDecision({
    transition,
    fromStatus: claim.status,
    reasonCode,
    note,
  });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  let transfer = null;
  let willExceedCap = false;
  let claimantTier = "starry";
  let listingCap = 1;
  let previousPropertySnapshot = null;
  let slugToUnpublishAfterCommit = null;

  if (verdict.transfersListing) {
    const { data: property, error: propErr } = await admin
      .from("properties")
      .select("id, slug, canonical_slug, title, owner_id, lister_relationship, pipeline_status, lifecycle_state, verified, withdrawn_at, quietly_open_to_offers")
      .eq("id", claim.property_id)
      .single();
    if (propErr || !property) {
      return { ok: false, message: "The property this claim is about no longer exists." };
    }
    if (!claim.claimant_user_id) {
      return {
        ok: false,
        message:
          "This claim has no signed-in claimant, so there is nobody to transfer the listing to. Reject it or ask them to sign in.",
      };
    }

    // Check claimant's tier and active listing count
    const { data: claimantProfile } = await admin
      .from("user_profiles")
      .select("subscription_tier, role")
      .eq("id", claim.claimant_user_id)
      .maybeSingle();

    claimantTier = String(claimantProfile?.subscription_tier || "starry").toLowerCase();
    const claimantRole = String(claimantProfile?.role || "owner").toLowerCase();
    const limits = claimantRole === "broker"
      ? { starry: 3, solar: 15, cluster: 50, universe: Infinity }
      : { starry: 1, solar: 5, cluster: 20, universe: Infinity };
    listingCap = limits[claimantTier] ?? 1;

    const { data: claimantLiveProps } = await admin
      .from("properties")
      .select("id")
      .eq("owner_id", claim.claimant_user_id)
      .eq("pipeline_status", "approved");

    const liveCount = (claimantLiveProps || []).filter((p) => p.id !== property.id).length;
    willExceedCap = liveCount >= listingCap;

    // The previous holder is recorded BEFORE the write, on the claim event and
    // in the audit entry. An approval is close to irreversible for the person
    // who loses the listing, so who they were must survive the transfer.
    previousPropertySnapshot = {
      owner_id: property.owner_id ?? null,
      lister_relationship: property.lister_relationship ?? null,
      pipeline_status: property.pipeline_status ?? null,
      lifecycle_state: property.lifecycle_state ?? null,
      verified: property.verified ?? false,
      withdrawn_at: property.withdrawn_at ?? null,
      quietly_open_to_offers: property.quietly_open_to_offers ?? false,
    };

    transfer = {
      from_owner_id: property.owner_id ?? null,
      from_lister_relationship: property.lister_relationship ?? null,
      to_owner_id: claim.claimant_user_id,
      to_lister_relationship: claim.claimed_relationship,
      slug: property.canonical_slug || property.slug,
      defaultedToOffMarket: willExceedCap,
    };

    const transferPayload = {
      owner_id: claim.claimant_user_id,
      lister_relationship: claim.claimed_relationship,
      verified: true,
    };

    if (willExceedCap) {
      transferPayload.pipeline_status = "off_market";
      transferPayload.lifecycle_state = "off_market";
      transferPayload.withdrawn_at = new Date().toISOString();
      transferPayload.quietly_open_to_offers = false;
      slugToUnpublishAfterCommit = property.canonical_slug || property.slug || null;
    }

    const { error: transferErr } = await admin
      .from("properties")
      .update(transferPayload)
      .eq("id", property.id);

    if (transferErr) {
      // Nothing is marked approved if the transfer did not happen. An
      // "approved" claim over a listing that never moved is the worst of both:
      // the claimant is told they won and still cannot touch it.
      return { ok: false, message: "The listing could not be transferred." };
    }
  }

  const { data: updatedClaim, error: updateErr } = await admin
    .from("property_claims")
    .update({
      status: verdict.status,
      reviewer_id: staff.id,
      decision_reason_code: rule.requiresReason ? reasonCode : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .eq("status", claim.status)
    .select("id")
    .maybeSingle();

  if (updateErr || !updatedClaim) {
    // Compensate if we already transferred the property row
    if (previousPropertySnapshot) {
      const { error: rollbackErr } = await admin
        .from("properties")
        .update(previousPropertySnapshot)
        .eq("id", claim.property_id);
      if (rollbackErr) {
        await recordSystemEvent({
          event: EVENTS.AIRTABLE_SYNC_FAILED,
          severity: "error",
          subjectTable: "properties",
          subjectId: claim.property_id,
          summary: "Claim optimistic update failed and property ownership rollback also failed.",
          detail: { claimId, error: rollbackErr.message },
        });
      }
    }
    return {
      ok: false,
      message: updateErr
        ? "Could not update claim status."
        : "This claim was already updated by another reviewer. Refresh the queue.",
    };
  }

  // Unpublish from Airtable ONLY after Supabase claim & transfer commit succeeds.
  if (slugToUnpublishAfterCommit) {
    try {
      await unpublishPropertyFromAirtable(slugToUnpublishAfterCommit);
    } catch (unpublishErr) {
      await recordSystemEvent({
        event: EVENTS.AIRTABLE_SYNC_FAILED,
        severity: "error",
        subjectTable: "properties",
        subjectId: claim.property_id,
        summary: "Claim transferred listing to off_market, but Airtable unpublish failed; reconciliation required.",
        detail: { claimId, slug: slugToUnpublishAfterCommit, error: unpublishErr?.message || "unpublish error" },
      });
    }
  }

  await addClaimEvent(admin, {
    claimId,
    actorId: staff.id,
    eventType: `CLAIM_${verdict.status.toUpperCase()}`,
    payload: {
      by: staff.email,
      reason_code: rule.requiresReason ? reasonCode : null,
      note: note || null,
      from_status: claim.status,
      transfer,
    },
  });

  await logActionStrict({
    staff,
    action: `claim.${transition}`,
    targetTable: "property_claims",
    targetId: claimId,
    reason: note || null,
    metadata: {
      from_status: claim.status,
      to_status: verdict.status,
      reason_code: rule.requiresReason ? reasonCode : null,
      property_id: claim.property_id,
      transfer,
    },
  });

  if (transfer) {
    await recordSystemEvent({
      event: EVENTS.LISTING_OWNERSHIP_TRANSFERRED,
      severity: "warning",
      subjectTable: "properties",
      subjectId: claim.property_id,
      summary: `Listing '${transfer.slug}' transferred to an approved claimant`,
      detail: transfer,
    });

    await notifyUser(admin, {
      userId: claim.claimant_user_id,
      title: "Property claim approved",
      desc: willExceedCap
        ? `Your ownership claim for the listing has been approved. Because your ${claimantTier.toUpperCase()} plan is at its active live listing limit (${listingCap}), this property has been safely transferred into your private Off-Market cloud. You can swap it to live or upgrade your plan anytime in your Dashboard.`
        : "Your ownership claim for the listing has been approved. The property has been transferred to your account.",
      icon: "🎉",
      propertyId: claim.property_id,
      notificationType: "claim_approved",
    });

    if (transfer.from_owner_id) {
      await notifyUser(admin, {
        userId: transfer.from_owner_id,
        title: "Listing ownership transferred",
        desc: "Ownership of the listing was transferred following an approved claim review.",
        icon: "ℹ️",
        propertyId: claim.property_id,
        notificationType: "claim_transferred",
      });
    }
  } else if (verdict.status === "rejected") {
    await notifyUser(admin, {
      userId: claim.claimant_user_id,
      title: "Property claim not approved",
      desc: "Your ownership claim could not be approved at this time.",
      icon: "ℹ️",
      propertyId: claim.property_id,
      notificationType: "claim_rejected",
    });
  } else if (verdict.status === "needs_information") {
    await notifyUser(admin, {
      userId: claim.claimant_user_id,
      title: "Property claim needs information",
      desc: "Reviewers have requested additional details on your property claim.",
      icon: "📋",
      propertyId: claim.property_id,
      notificationType: "claim_needs_info",
    });
  }

  revalidatePath("/dashboard/claims");

  return {
    ok: true,
    message: transfer
      ? "Claim approved. The listing now belongs to the claimant."
      : `Claim moved to ${verdict.status.replace(/_/g, " ")}.`,
  };
}
