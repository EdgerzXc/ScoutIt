"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import { publishPropertyToAirtable } from "@/lib/airtable";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

/**
 * Approve & Publish — the full publishing loop.
 *
 * The live public site only shows Airtable PROPERTIES_CMS records with
 * Approved_For_ScoutIt=true, so flipping Supabase alone (the old behavior)
 * approved a row that never actually went live. Order matters:
 *   1. Publish to Airtable (update-by-slug first, insert if new) and read
 *      back Airtable's COMPUTED Slug — the single source of slug truth.
 *   2. Only after Airtable succeeds, mark the Supabase row approved (both
 *      moderation_status — this console's queue — and pipeline_status — what
 *      the main app's dashboards read) and persist the canonical slug.
 * If Airtable fails, we throw and the row stays un-approved.
 *
 * @param {FormData} formData
 */
export async function approveProperty(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  if (!propertyId) throw new Error("Missing propertyId.");

  const admin = createAdminClient();

  // Full row — the Airtable payload needs title/location/type/details/media.
  const { data: property, error: fetchError } = await admin
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();
  if (fetchError || !property) {
    throw new Error(fetchError?.message || "Property not found.");
  }

  // 1. Live-site publish. Throws on failure — nothing below runs.
  //
  // A-063. Recorded either way. A publish that reached Airtable and then
  // failed to record approval in Supabase is the one state staff cannot
  // infer from the console, because the listing is live and the queue
  // still says it is not.
  let published;
  try {
    published = await publishPropertyToAirtable(property);
  } catch (err) {
    await recordSystemEvent({
      event: EVENTS.AIRTABLE_PUBLISH_FAILED,
      severity: "error",
      subjectTable: "properties",
      subjectId: propertyId,
      summary: `Publish to the public CMS failed: ${err.message}`,
      detail: { slug: property.slug || null, error: err.message },
    });
    throw err;
  }

  await recordSystemEvent({
    event: EVENTS.AIRTABLE_PUBLISH_OK,
    subjectTable: "properties",
    subjectId: propertyId,
    summary: `Published ${published.slug} to the public CMS (${published.mode})`,
    detail: { slug: published.slug, mode: published.mode, recordId: published.recordId },
  });

  // 2. Airtable succeeded — now mark approved in Supabase with the canonical slug.
  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: "approved",
      pipeline_status: "approved",
      slug: published.slug,
      rejection_reason: null,
    })
    .eq("id", propertyId);
  if (error) {
    // Airtable is live but Supabase didn't record it — surface loudly so
    // staff retries (the retry is idempotent: update-by-slug path).
    throw new Error(
      `Published to the live site (slug: ${published.slug}) but failed to record approval in Supabase: ${error.message}. Retry the approval.`
    );
  }

  await logAction({
    staff,
    action: "property.approve_publish",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { slug: published.slug, airtable: published.mode, recordId: published.recordId },
  });

  revalidatePath("/dashboard/cms");
}

/** @param {FormData} formData */
export async function rejectProperty(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  const reasonLabel = formData.get("reasonLabel")?.toString();
  const reasonNote = formData.get("reasonNote")?.toString().trim();
  if (!propertyId) throw new Error("Missing propertyId.");
  if (!reasonLabel) throw new Error("A rejection reason is required.");

  const reason = reasonNote ? `${reasonLabel} — ${reasonNote}` : reasonLabel;

  const admin = createAdminClient();
  const { error } = await admin
    .from("properties")
    .update({ moderation_status: "rejected", rejection_reason: reason })
    .eq("id", propertyId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "property.reject",
    targetTable: "properties",
    targetId: propertyId,
    reason,
  });

  revalidatePath("/dashboard/cms");
}

/**
 * Soft-delete / restore. Requires Tier 2 (Ops Manager) or higher.
 * @param {FormData} formData
 */
export async function setPropertyArchived(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const propertyId = formData.get("propertyId")?.toString();
  const nextValue = formData.get("nextValue") === "true";
  const reason = formData.get("reason")?.toString().trim() || null;
  if (!propertyId) throw new Error("Missing propertyId.");
  if (nextValue && !reason) throw new Error("A reason is required to archive a property.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: nextValue ? "archived" : "pending",
      archived_at: nextValue ? new Date().toISOString() : null,
      rejection_reason: nextValue ? reason : null,
    })
    .eq("id", propertyId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: nextValue ? "property.archive" : "property.unarchive",
    targetTable: "properties",
    targetId: propertyId,
    reason,
  });

  revalidatePath("/dashboard/cms");
}

export async function bulkArchiveProperties(propertyIds, reason) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!propertyIds || propertyIds.length === 0) throw new Error("No properties selected.");
  if (!reason) throw new Error("A reason is required to bulk archive properties.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: "archived",
      archived_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .in("id", propertyIds);
  
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "property.bulk_archive",
    targetTable: "properties",
    targetId: `Multiple (${propertyIds.length})`,
    reason,
    metadata: { propertyIds },
  });

  revalidatePath("/dashboard/cms");
}
