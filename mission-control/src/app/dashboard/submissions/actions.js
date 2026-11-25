"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  publishPropertyToAirtable,
  unpublishPropertyFromAirtable,
  updatePropertyInAirtable,
} from "@/lib/airtable";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

const BLOCKED_LIFECYCLE_STATES = new Set([
  "permanently_removed",
  "staff_suspended",
  "archived",
]);

export async function loadSubmissionsQueue() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const admin = createAdminClient();

  const [submissionsRes, pdfDraftsRes] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, location, type, space_category, price, owner_id, pipeline_status, lifecycle_state, created_at, slug, canonical_slug, details")
      .in("pipeline_status", ["submitted", "pending"])
      .order("created_at", { ascending: true })
      .limit(50),
    admin
      .from("properties")
      .select("id, title, location, type, owner_id, created_at, pdf_source_url, pdf_verified, pipeline_status")
      .eq("creation_source", "pdf_assisted")
      .eq("pdf_verified", false)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  return {
    submissions: submissionsRes.data || [],
    pdfDrafts: pdfDraftsRes.data || [],
  };
}

export async function verifyPdfDraftAction({ propertyId, reason = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!propertyId) {
    return { error: "Missing property ID." };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  // Try DB RPC first
  let verified = false;
  try {
    const { data, error } = await admin.rpc("verify_pdf_draft", {
      p_property_id: propertyId,
      p_verifier_id: staff.id,
    });
    if (!error && data) {
      verified = true;
    }
  } catch (_rpcErr) {
    // Fallback if RPC migration not applied
  }

  if (!verified) {
    const { data: updatedRow, error: updErr } = await admin
      .from("properties")
      .update({
        pdf_verified: true,
      })
      .eq("id", propertyId)
      .eq("creation_source", "pdf_assisted")
      .select("id")
      .maybeSingle();

    if (updErr) {
      return { error: "Failed to update PDF verification status." };
    }
    if (!updatedRow) {
      return { error: "PDF-assisted draft not found or ineligible for verification." };
    }
  }

  // Immutable audit log
  await logActionStrict({
    staff,
    action: "STAFF_PDF_DRAFT_VERIFIED",
    targetTable: "properties",
    targetId: propertyId,
    reason: reason || "Verified listing data against uploaded owner PDF source document",
    metadata: {
      verified_by: staff.email,
      timestamp: nowIso,
    },
  });

  return { success: true };
}

export async function approveSubmissionAction({ propertyId, reason = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!propertyId) {
    return { error: "Missing property ID." };
  }

  const admin = createAdminClient();
  const { data: property, error: fetchErr } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (fetchErr || !property) {
    return { error: "Property submission not found in database." };
  }

  const lifecycle = String(property.lifecycle_state || "").trim().toLowerCase();
  if (BLOCKED_LIFECYCLE_STATES.has(lifecycle)) {
    return {
      error: `Publication blocked: property lifecycle state "${lifecycle}" cannot be approved from the submissions queue.`,
    };
  }

  // Rule: AGENTS.md §2.4: PDF-assisted drafts must be verified before publish
  if (property.creation_source === "pdf_assisted" && !property.pdf_verified) {
    return {
      error: "Publication blocked: PDF-assisted draft has not been verified against its source document yet.",
    };
  }

  let airtableResult;
  try {
    airtableResult = await publishPropertyToAirtable(property);
  } catch (_publishErr) {
    return { error: "Airtable publish sync failed. Please check Airtable configuration and try again." };
  }

  const nowIso = new Date().toISOString();
  const adoptedSlug = property.canonical_slug || airtableResult.slug || property.slug;

  const { data: updatedRow, error: updErr } = await admin
    .from("properties")
    .update({
      pipeline_status: "approved",
      moderation_status: "approved",
      lifecycle_state: "live",
      published_at: property.published_at || nowIso,
      slug: adoptedSlug,
      canonical_slug: property.canonical_slug || adoptedSlug,
      canonical_slug_locked_at: property.canonical_slug_locked_at || nowIso,
    })
    .eq("id", propertyId)
    .select("id")
    .maybeSingle();

  if (updErr || !updatedRow) {
    let rollbackFailed = false;
    if (adoptedSlug) {
      try {
        await unpublishPropertyFromAirtable(adoptedSlug);
      } catch (rollbackErr) {
        rollbackFailed = true;
        await recordSystemEvent({
          event: EVENTS.AIRTABLE_SYNC_FAILED,
          severity: "error",
          subjectTable: "properties",
          subjectId: propertyId,
          summary: "Supabase update failed after Airtable publish and compensating unpublish also failed.",
          detail: { slug: adoptedSlug, error: rollbackErr?.message || "rollback error" },
        });
      }
    }
    return {
      error: rollbackFailed
        ? "Failed to update Supabase row status after Airtable publish, and compensating unpublish failed; reconciliation queued."
        : "Failed to update Supabase row status; Airtable publication was rolled back.",
    };
  }

  // Audit
  await logActionStrict({
    staff,
    action: "STAFF_PROPERTY_SUBMISSION_APPROVED",
    targetTable: "properties",
    targetId: propertyId,
    reason: reason || "Approved submission to live public catalogue",
    metadata: {
      airtable_record_id: airtableResult.recordId,
      published_slug: adoptedSlug,
    },
  });

  return { success: true, slug: adoptedSlug, recordId: airtableResult.recordId };
}

export async function generatePropertySeoAction({ propertyId }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!propertyId) {
    return { error: "Missing property ID." };
  }

  const admin = createAdminClient();
  const { data: prop, error: fetchErr } = await admin
    .from("properties")
    .select("id, title, location, space_category, price, slug, canonical_slug, details")
    .eq("id", propertyId)
    .single();

  if (fetchErr || !prop) {
    return { error: "Property not found." };
  }

  const targetSlug = prop.canonical_slug || prop.slug;
  if (!targetSlug) {
    return { error: "Property has no slug for Airtable record lookup." };
  }

  const propCity = prop.details?.city || prop.location || "Taguig";
  const propFloorSqm =
    prop.details?.floor_sqm ||
    prop.details?.floorArea ||
    prop.details?.FloorSqm ||
    "spacious";

  const generatedTitle = `${prop.title} | Luxury ${prop.space_category || "Commercial Space"} in ${propCity}`.slice(0, 60);
  const generatedDesc = `Discover ${prop.title}, a premium ${propFloorSqm}sqm property located in ${prop.location || propCity}. View full details on ScoutIt.`.slice(0, 160);

  let airtableRes;
  try {
    airtableRes = await updatePropertyInAirtable(targetSlug, {
      SEO_Title: generatedTitle,
      SEO_Description: generatedDesc,
    });
  } catch (_airtableErr) {
    return { error: "Failed to update SEO fields in Airtable." };
  }

  if (!airtableRes?.recordId) {
    return { error: "Airtable record was not found for this property slug; SEO fields were not updated." };
  }

  // Audit
  await logActionStrict({
    staff,
    action: "STAFF_PROPERTY_SEO_GENERATED",
    targetTable: "properties",
    targetId: propertyId,
    reason: "Generated SEO title and meta description for public search optimization",
    metadata: {
      slug: targetSlug,
      seo_title: generatedTitle,
    },
  });

  return { success: true, title: generatedTitle, description: generatedDesc };
}
