"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, TIERS } from "@/lib/rbac";
import {
  OPEN_CLAIM_STATUSES,
  REVIEW_TRANSITIONS,
  validateDecision,
} from "@/lib/propertyClaimPolicy.mjs";
import { notifyUser } from "@/lib/notifications";
import { unpublishBoundProperty } from "@/lib/airtable";
import { reviewPropertyClaim } from "@/lib/claimReview.mjs";
import { hasVerifiedClaimScan } from "@/lib/claimDocumentPath.mjs";

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

/** The claims queue, with everything a reviewer needs to judge one. Ops Manager+. */
async function loadClaimDocuments(admin, claimIds) {
  const columns = "id, claim_id, document_type, original_filename, private_storage_path, file_size_bytes, checksum, malware_scan_status";
  const result = await admin.from("property_claim_documents")
    .select(columns + ", malware_scan_engine, malware_scan_object_version").in("claim_id", claimIds);
  if (["42703", "PGRST204"].includes(result.error?.code)) {
    return admin.from("property_claim_documents").select(columns).in("claim_id", claimIds);
  }
  return result;
}

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
  const claimantUserIds = [...new Set(claims.map((c) => c.claimant_user_id).filter(Boolean))];

  // The listing the claim is about, what its lister declared, and claimant profile
  const [properties, documents, events, profiles] = await Promise.all([
    admin
      .from("properties")
      .select("id, slug, canonical_slug, title, location, owner_id, lister_relationship, pipeline_status")
      .in("id", propertyIds),
    loadClaimDocuments(admin, claimIds),
    admin
      .from("property_claim_events")
      .select("id, claim_id, actor_id, event_type, payload, created_at")
      .in("claim_id", claimIds)
      .order("created_at", { ascending: true }),
    claimantUserIds.length > 0
      ? admin
          .from("user_profiles")
          .select("id, full_name, email, role, active_roles, subscription_tier")
          .in("id", claimantUserIds)
      : Promise.resolve({ data: [] }),
  ]);
  if (properties.error || documents.error || events.error || profiles.error) {
    return { claims: [], error: "Could not load the full claim record. Try again." };
  }

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
  const profileById = Object.fromEntries((profiles.data || []).map((prof) => [prof.id, prof]));

  const claimsById = new Map(claims.map((claim) => [claim.id, claim]));
  const reviewedDocuments = (documents.data || []).map((doc) => {
    const claim = claimsById.get(doc.claim_id);
    const property = propertyById[claim?.property_id];
    const scanConfirmed = property && hasVerifiedClaimScan(
      doc, claim.claimant_user_id, [property.id, property.slug, property.canonical_slug],
    );
    return {
      id: doc.id, claim_id: doc.claim_id, document_type: doc.document_type,
      original_filename: doc.original_filename, file_size_bytes: doc.file_size_bytes,
      malware_scan_status: scanConfirmed ? "clean" : doc.malware_scan_status === "blocked" ? "blocked" : "pending",
      downloadHref: scanConfirmed ? `/api/claims/documents/${doc.id}` : null,
    };
  });

  const docsByClaim = {};
  for (const d of reviewedDocuments) (docsByClaim[d.claim_id] ||= []).push(d);
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

  const claimId = String(formData.get("claimId") || "");
  const expectedUpdatedAt = String(formData.get("revision") || "") || null;
  const reason = String(formData.get("reasonCode") || "");
  const note = String(formData.get("note") || "").trim();
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(claimId) ||
      (expectedUpdatedAt && (expectedUpdatedAt.length > 50 || !Number.isFinite(Date.parse(expectedUpdatedAt)))) ||
      note.length > 2000) {
    return { ok: false, message: "Check the claim and review note before trying again." };
  }

  const admin = createAdminClient();
  const { data: claim, error } = await admin
    .from("property_claims")
    .select("id, property_id, claimant_user_id, status, updated_at")
    .eq("id", claimId)
    .maybeSingle();
  if (error || !claim) return { ok: false, message: "Could not load this claim. Refresh the queue." };
  const verdict = validateDecision({ transition, fromStatus: claim.status, reasonCode: reason, note });
  if (!verdict.ok) return { ok: false, message: verdict.message };

  const result = await reviewPropertyClaim({
    admin, claimId, staffId: staff.id, transition, expectedUpdatedAt,
    reason: rule.requiresReason ? reason : null,
    note: note || null,
    unpublish: unpublishBoundProperty,
  });
  if (!result.ok) return result;

  const { transfer, status, updatedAt } = result;
  const notify = (message) => notifyUser(admin, { propertyId: claim.property_id, ...message });
  if (transfer && claim.claimant_user_id) {
    await notify({
      userId: claim.claimant_user_id,
      title: "Property claim approved",
      desc: transfer.defaultedToOffMarket
        ? "The listing has transferred to your account and moved off market because your active listing limit is full."
        : "The listing has transferred to your account.",
      notificationType: "claim_approved",
    });
    if (transfer.from_owner_id) {
      await notify({
        userId: transfer.from_owner_id,
        title: "Listing ownership transferred",
        desc: "Ownership of the listing was transferred following an approved claim review.",
        notificationType: "claim_transferred",
      });
    }
  } else if (status === "rejected" && claim.claimant_user_id) {
    await notify({
      userId: claim.claimant_user_id,
      title: "Property claim not approved",
      desc: "Your ownership claim could not be approved at this time.",
      notificationType: "claim_rejected",
    });
  } else if (status === "needs_information" && claim.claimant_user_id) {
    await notify({
      userId: claim.claimant_user_id,
      title: "Property claim needs information",
      desc: "Reviewers have requested additional details on your property claim.",
      notificationType: "claim_needs_info",
    });
  }

  return {
    ok: true, status, updatedAt,
    message: transfer?.defaultedToOffMarket
      ? "Claim approved. The listing transferred and is off market."
      : transfer ? "Claim approved. The listing transferred to the claimant."
      : status === "human_review" ? "Claim opened for staff review."
      : status === "needs_information" ? "Claim marked as needing more information."
      : "Claim rejected.",
  };
}
