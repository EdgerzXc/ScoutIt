"use server";

import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { editBoundProperty } from "@/lib/airtable";
import { listPropertyPdfReviews, loadPropertyPdfReview, verifyPropertyPdfDraft } from "@/lib/propertyPdfReview";
import { getPropertyBinding, isLiveProperty, isProtectedProperty, isStaffEditableDraft, matchPropertySnapshot } from "@/lib/propertyPublication.mjs";
import { approveStaffProperty } from "@/lib/staffPropertyApproval";
import { stripPropertyTags } from "@/lib/propertyText.mjs";

const PROPERTY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadSubmissionsQueue() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const admin = createAdminClient();

  const [submissionsRes, pdfReviewQueue] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, location, type, space_category, pipeline_status, created_at")
      .in("pipeline_status", ["submitted", "pending", "draft_ready_for_review"])
      .order("created_at", { ascending: true })
      .limit(50),
    staff.tier >= TIERS.OPS_MANAGER ? listPropertyPdfReviews(admin, 50) : { drafts: [] },
  ]);

  return {
    submissions: submissionsRes.data || [],
    submissionQueueError: submissionsRes.error ? "Could not load the submissions queue." : null,
    pdfDrafts: pdfReviewQueue.drafts,
    pdfQueueError: pdfReviewQueue.error || null,
  };
}

export async function loadPdfReviewAction(propertyId) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (typeof propertyId !== "string" || !propertyId.trim()) return { error: "A property ID is required." };
  return loadPropertyPdfReview(createAdminClient(), propertyId.trim());
}

export async function verifyPdfDraftAction(input) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const result = await verifyPropertyPdfDraft(createAdminClient(), input, staff.id);
  if (result.error) return { error: result.error, status: result.status };
  return { success: true, cleanupPending: result.cleanupPending, discarded: Boolean(result.discarded) };
}

export async function approveSubmissionAction({ propertyId, reason = null } = {}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (typeof propertyId !== "string" || !PROPERTY_ID.test(propertyId)) {
    return { error: "A valid property ID is required." };
  }
  return approveStaffProperty({
    admin: createAdminClient(), staff, propertyId, action: "STAFF_PROPERTY_SUBMISSION_APPROVED",
    reason: typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 500) : "Approved a listing from the submissions queue",
  });
}

export async function generatePropertySeoAction({ propertyId } = {}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (typeof propertyId !== "string" || !PROPERTY_ID.test(propertyId)) {
    return { error: "A valid property ID is required." };
  }

  const admin = createAdminClient();
  const { data: prop, error: fetchErr } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (fetchErr || !prop) {
    return { error: "Property not found." };
  }

  if (isProtectedProperty(prop) || prop.archived_at) {
    return { error: "This listing must use the protected review workflow." };
  }

  const name = stripPropertyTags(prop.title || "") || "ScoutIt listing";
  const location = stripPropertyTags(prop.location || "");
  const generatedTitle = `${name} | ScoutIt`.slice(0, 60).trim();
  const generatedDesc = [name, location ? `in ${location}` : "", "on ScoutIt."].filter(Boolean).join(" ").slice(0, 160).trim();
  const live = isLiveProperty(prop);
  let publicCachePending = false;
  if (live) {
    const binding = getPropertyBinding(prop);
    if (!binding) return { error: "This listing requires publication identity reconciliation." };
    try {
      const cache = await editBoundProperty(binding, { seoTitle: generatedTitle, seoDescription: generatedDesc });
      publicCachePending = !cache.purged;
    } catch {
      return { error: "Could not confirm the public metadata update." };
    }
  } else {
    if (!isStaffEditableDraft(prop)) return { error: "This draft is no longer editable." };
    const query = admin.from("properties").update({
      details: { ...prop.details, seo_title: generatedTitle, seo_description: generatedDesc },
    }).eq("id", propertyId);
    const { data: recorded, error } = await matchPropertySnapshot(query, prop).select("id").maybeSingle();
    if (error || !recorded) return { error: "The draft changed while saving its metadata. Reload it and retry." };
  }

  await logAction({
    staff,
    action: "STAFF_PROPERTY_SEO_GENERATED",
    targetTable: "properties",
    targetId: propertyId,
    reason: live ? "Generated metadata for a public listing" : "Prepared metadata for a listing draft",
    metadata: {
      slug: live ? prop.canonical_slug : null,
      seo_title: generatedTitle,
    },
  });

  return { success: true, title: generatedTitle, description: generatedDesc, publicationPending: !live, publicCachePending };
}
