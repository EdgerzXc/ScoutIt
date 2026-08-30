"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, TIERS } from "@/lib/rbac";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import {
  OPEN_CLAIM_STATUSES,
  REVIEW_TRANSITIONS,
  validateDecision,
} from "@/lib/propertyClaimPolicy.mjs";

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

  if (error) return { claims: [], error: error.message };
  if (!claims?.length) return { claims: [], error: null };

  const claimIds = claims.map((c) => c.id);
  const propertyIds = [...new Set(claims.map((c) => c.property_id))];

  // The listing the claim is about, and what its lister declared — the
  // comparison the whole decision turns on.
  const [properties, documents, events] = await Promise.all([
    admin
      .from("properties")
      .select("id, slug, title, location, owner_id, lister_relationship, pipeline_status")
      .in("id", propertyIds),
    admin
      .from("property_claim_documents")
      .select("id, claim_id, document_type, original_filename, malware_scan_status, ocr_status, upload_timestamp")
      .in("claim_id", claimIds),
    admin
      .from("property_claim_events")
      .select("id, claim_id, actor_id, event_type, payload, created_at")
      .in("claim_id", claimIds)
      .order("created_at", { ascending: true }),
  ]);

  const propertyById = Object.fromEntries((properties.data || []).map((p) => [p.id, p]));
  const docsByClaim = {};
  for (const d of documents.data || []) (docsByClaim[d.claim_id] ||= []).push(d);
  const eventsByClaim = {};
  for (const e of events.data || []) (eventsByClaim[e.claim_id] ||= []).push(e);

  return {
    claims: claims.map((c) => ({
      ...c,
      property: propertyById[c.property_id] || null,
      documents: docsByClaim[c.id] || [],
      events: eventsByClaim[c.id] || [],
    })),
    error: null,
  };
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
  const rule = REVIEW_TRANSITIONS[transition];
  if (!rule) return { ok: false, message: "Unknown decision." };

  try {
    assertTier(staff, rule.transfersListing ? TIERS.SUPER_ADMIN : TIERS.OPS_MANAGER);
  } catch (err) {
    return { ok: false, message: err.message };
  }

  const claimId = (formData.get("claimId") || "").toString();
  const reasonCode = (formData.get("reasonCode") || "").toString();
  const note = (formData.get("note") || "").toString();
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

  if (verdict.transfersListing) {
    const { data: property, error: propErr } = await admin
      .from("properties")
      .select("id, slug, title, owner_id, lister_relationship")
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

    // The previous holder is recorded BEFORE the write, on the claim event and
    // in the audit entry. An approval is close to irreversible for the person
    // who loses the listing, so who they were must survive the transfer.
    transfer = {
      from_owner_id: property.owner_id ?? null,
      from_lister_relationship: property.lister_relationship ?? null,
      to_owner_id: claim.claimant_user_id,
      to_lister_relationship: claim.claimed_relationship,
      slug: property.slug,
    };

    const { error: transferErr } = await admin
      .from("properties")
      .update({
        owner_id: claim.claimant_user_id,
        lister_relationship: claim.claimed_relationship,
      })
      .eq("id", property.id);

    if (transferErr) {
      // Nothing is marked approved if the transfer did not happen. An
      // "approved" claim over a listing that never moved is the worst of both:
      // the claimant is told they won and still cannot touch it.
      return { ok: false, message: `The listing could not be transferred: ${transferErr.message}` };
    }
  }

  const { error: updateErr } = await admin
    .from("property_claims")
    .update({
      status: verdict.status,
      reviewer_id: staff.id,
      decision_reason_code: rule.requiresReason ? reasonCode : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId);

  if (updateErr) return { ok: false, message: updateErr.message };

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

  await logAction({
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
  }

  revalidatePath("/dashboard/claims");

  return {
    ok: true,
    message: transfer
      ? "Claim approved. The listing now belongs to the claimant."
      : `Claim moved to ${verdict.status.replace(/_/g, " ")}.`,
  };
}
