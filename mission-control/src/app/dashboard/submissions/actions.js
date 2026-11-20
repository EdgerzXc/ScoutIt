"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishPropertyToAirtable, updatePropertyInAirtable } from "@/lib/airtable";
import { resolveQueueDocument } from "@/lib/propertyQueueStorage";
import { loadPropertyPdfReview, verifyPropertyPdfDraft } from "@/lib/propertyPdfReview";

export async function loadSubmissionsQueue() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const admin = createAdminClient();

  const [submissionsRes, pdfDraftsRes] = await Promise.all([
    admin
      .from("properties")
      .select("id, title, location, city, type, space_category, price, rental_rate, owner_id, pipeline_status, lifecycle_state, created_at, slug, canonical_slug")
      .in("pipeline_status", ["submitted", "pending"])
      .order("created_at", { ascending: true })
      .limit(50),
    staff.tier >= TIERS.OPS_MANAGER ? admin
      .from("properties")
      .select("id, title, location, type, owner_id, created_at, pdf_source_url, pdf_verified, pipeline_status")
      .eq("creation_source", "pdf_assisted")
      .or("and(pdf_verified.eq.false,pipeline_status.eq.pending),and(pdf_verified.eq.true,pdf_source_url.not.is.null)")
      .order("created_at", { ascending: true })
      .limit(50) : Promise.resolve({ data: [] }),
  ]);

  return {
    submissions: submissionsRes.data || [],
    pdfDrafts: (pdfDraftsRes.data || []).map(({ pdf_source_url, owner_id, pdf_verified, ...draft }) => ({
      ...draft,
      sourceAttached: Boolean(resolveQueueDocument({ pdf_source_url, owner_id })),
      cleanupPending: pdf_verified,
    })),
    pdfQueueError: pdfDraftsRes.error ? "Could not load the PDF review queue." : null,
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
  return { success: true, cleanupPending: result.cleanupPending };
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

  // Rule: AGENTS.md §2.4: PDF-assisted drafts must be verified before publish
  if (property.creation_source === "pdf_assisted" && !property.pdf_verified) {
    return {
      error: "Publication blocked: PDF-assisted draft has not been verified against its source document yet.",
    };
  }

  let airtableResult;
  try {
    airtableResult = await publishPropertyToAirtable(property);
  } catch (publishErr) {
    return { error: `Airtable sync failed: ${publishErr.message}` };
  }

  const nowIso = new Date().toISOString();
  const adoptedSlug = airtableResult.slug || property.canonical_slug || property.slug;

  const { error: updErr } = await admin
    .from("properties")
    .update({
      pipeline_status: "approved",
      lifecycle_state: "live",
      published_at: property.published_at || nowIso,
      slug: adoptedSlug,
      canonical_slug: property.canonical_slug || adoptedSlug,
      canonical_slug_locked_at: property.canonical_slug_locked_at || nowIso,
      updated_at: nowIso,
    })
    .eq("id", propertyId);

  if (updErr) {
    return {
      warning: "Synced to Airtable, but failed to update Supabase row status.",
      airtableSlug: adoptedSlug,
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
    .select("id, title, location, city, space_category, floor_sqm, price, rental_rate, slug, canonical_slug")
    .eq("id", propertyId)
    .single();

  if (fetchErr || !prop) {
    return { error: "Property not found." };
  }

  const targetSlug = prop.canonical_slug || prop.slug;
  if (!targetSlug) {
    return { error: "Property has no slug for Airtable record lookup." };
  }

  const generatedTitle = `${prop.title} | Luxury ${prop.space_category || "Commercial Space"} in ${prop.city || "Taguig"}`.slice(0, 60);
  const generatedDesc = `Discover ${prop.title}, a premium ${prop.floor_sqm || "spacious"}sqm property located in ${prop.location || prop.city}. View full details on ScoutIt.`.slice(0, 160);

  try {
    await updatePropertyInAirtable(targetSlug, {
      seo_title: generatedTitle,
      seo_description: generatedDesc,
    });
  } catch (airtableErr) {
    return { error: `Failed to update SEO fields in Airtable: ${airtableErr.message}` };
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
