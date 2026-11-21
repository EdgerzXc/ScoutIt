"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, logActionStrict, TIERS } from "@/lib/rbac";
import { publishPropertyToAirtable, unpublishPropertyFromAirtable } from "@/lib/airtable";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import { notifyUser } from "@/lib/notifications";
import { getPdfPublicationBlock } from "@/lib/propertyPdfReview";
import { changePropertyArchiveState } from "@/lib/propertyArchive.mjs";

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
  if (getPdfPublicationBlock(property)) throw new Error("Only a verified PDF-assisted draft can be published.");

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
    severity: published.cache?.purged ? "info" : "warning",
    subjectTable: "properties",
    subjectId: propertyId,
    summary: published.cache?.purged
      ? `Published ${published.slug} to the public CMS (${published.mode})`
      : `Published ${published.slug} to Airtable, but the public cache purge needs attention`,
    detail: { slug: published.slug, mode: published.mode, recordId: published.recordId, cache: published.cache },
  });

  // 2. Airtable succeeded — now mark approved in Supabase with the canonical slug.
  // GAP-33: Once canonical_slug is locked on first publication, never overwrite slug
  // with a newly recomputed formula slug.
  const nowIso = new Date().toISOString();
  const lockedCanonicalSlug = property.canonical_slug || published.slug;
  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: "approved",
      pipeline_status: "approved",
      lifecycle_state: "live",
      slug: lockedCanonicalSlug,
      canonical_slug: lockedCanonicalSlug,
      canonical_slug_locked_at: property.canonical_slug_locked_at || nowIso,
      published_at: property.published_at || nowIso,
      rejection_reason: null,
    })
    .eq("id", propertyId);
  if (error) {
    // Airtable is live but Supabase didn't record it — surface loudly so
    // staff retries (the retry is idempotent: update-by-slug path).
    throw new Error(
      `Published to the live site (slug: ${lockedCanonicalSlug}) but failed to record approval in Supabase: ${error.message}. Retry the approval.`
    );
  }

  await logAction({
    staff,
    action: "property.approve_publish",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { slug: lockedCanonicalSlug, airtable: published.mode, recordId: published.recordId },
  });

  revalidatePath("/dashboard/cms");
}

const LOCKED_TITLE_LIFECYCLE_STATES = new Set([
  "live",
  "off_market",
  "staff_suspended",
  "permanently_removed",
]);

function canStaffChangeDisplayTitle(property = {}) {
  if (property.canonical_slug || property.canonical_slug_locked_at) return false;
  const pipeline = String(property.pipeline_status || "").trim().toLowerCase();
  if (pipeline === "approved" || pipeline === "archived" || pipeline === "off_market") return false;
  const lifecycle = String(property.lifecycle_state || "").trim().toLowerCase();
  return !LOCKED_TITLE_LIFECYCLE_STATES.has(lifecycle);
}

/**
 * Updates editable property metadata in Mission Control while enforcing
 * Dual-CMS Rule #3 (live display titles cannot be mutated once canonical_slug is locked).
 * @param {FormData} formData
 */
export async function updatePropertyMetadata(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  const nextTitle = formData.get("title")?.toString().trim();
  const nextLocation = formData.get("location")?.toString().trim();
  if (!propertyId) throw new Error("Missing propertyId.");

  const admin = createAdminClient();
  const { data: property, error: fetchError } = await admin
    .from("properties")
    .select("id, title, slug, canonical_slug, canonical_slug_locked_at, lifecycle_state, pipeline_status")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    throw new Error(fetchError?.message || "Property not found.");
  }

  const updates = {};
  if (nextTitle && nextTitle !== property.title) {
    if (!canStaffChangeDisplayTitle(property)) {
      throw new Error(
        "Display title is locked after first publication because Airtable's Slug formula derives from Title (Dual-CMS Rule #3 / GAP-33)."
      );
    }
    updates.title = nextTitle;
  }
  if (typeof nextLocation === "string" && nextLocation.length > 0) {
    updates.location = nextLocation;
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await admin.from("properties").update(updates).eq("id", propertyId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "property.update_metadata",
    targetTable: "properties",
    targetId: propertyId,
    metadata: updates,
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
  const { data: updated, error } = await admin
    .from("properties")
    .update({ moderation_status: "rejected", rejection_reason: reason })
    .eq("id", propertyId)
    .select("id, owner_id, title");
  if (error) throw new Error(error.message);

  // GAP-111: Notify the property owner when a listing is rejected so remediation is not a dead end
  if (updated?.[0]?.owner_id) {
    await notifyUser(admin, {
      userId: updated[0].owner_id,
      title: "Listing Needs Attention",
      desc: `Your listing "${updated[0].title || "Property"}" was not approved: ${reason}`,
      icon: "⚠️",
      propertyId,
      notificationType: "property_rejected",
    });
  }

  await logAction({
    staff,
    action: "property.reject",
    targetTable: "properties",
    targetId: propertyId,
    reason,
  });

  revalidatePath("/dashboard/cms");
}

const ARCHIVE_STATE_COLUMNS = ["updated_at", "moderation_status", "pipeline_status", "lifecycle_state"];
const PROPERTY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ARCHIVE_FEEDBACK = {
  archived: "Property archived.",
  restored: "Property restored to Pending.",
  cache: "Review status saved. Check the public listing before relying on the cache update.",
  invalid: "Refresh the queue and select a valid property.",
  protected: "Use the suspension or retained-removal workflow for this property.",
  changed: "This property is no longer archived. Refresh the queue.",
  reference: "Check the Airtable listing reference before retrying.",
  airtable: "Airtable could not confirm removal. Try again.",
  supabase: "Could not save the review status. Refresh the queue and try again.",
  "supabase-after-unpublish": "Airtable confirmed removal. Refresh the queue and retry the review status update.",
};

async function changeArchiveState({ staff, propertyIds, archive, reason, bulk = false }) {
  if (!Array.isArray(propertyIds) || !propertyIds.length || propertyIds.length > 50 ||
      propertyIds.some((id) => typeof id !== "string" || !PROPERTY_ID.test(id)) ||
      (archive && (!reason || reason.length > 500))) {
    return { code: "invalid", message: "Choose up to 50 properties and enter a reason of 500 characters or fewer." };
  }

  const ids = [...new Set(propertyIds.map((id) => id.toLowerCase()))];
  const admin = createAdminClient();
  const { data: properties, error } = await admin.from("properties")
    .select("id, slug, canonical_slug, published_at, permanently_removed_at, updated_at, moderation_status, pipeline_status, lifecycle_state, quietly_open_to_offers")
    .in("id", ids);
  if (error || properties?.length !== ids.length) {
    return { code: "unavailable", message: "Could not verify every selected property. Refresh the queue and try again." };
  }

  const action = bulk ? "property.bulk_archive" : archive ? "property.archive" : "property.unarchive";
  const targetId = bulk ? `Multiple (${ids.length})` : ids[0];
  const audit = { staff, action, targetTable: "properties", targetId, reason };
  let intentId;
  try {
    intentId = await logActionStrict({
      ...audit,
      action: `${action}.intent`,
      metadata: { propertyIds: ids },
    });
  } catch {
    return { code: "audit", message: "Could not record the archive action. Try again." };
  }

  const now = new Date().toISOString();
  const outcomes = [];
  const byId = new Map(properties.map((property) => [property.id, property]));
  for (const id of ids) {
    const property = byId.get(id);
    const result = await changePropertyArchiveState({
      property, archive, reason, now,
      unpublish: unpublishPropertyFromAirtable,
      save: async (updates) => {
        let query = admin.from("properties").update(updates).eq("id", id);
        for (const column of ARCHIVE_STATE_COLUMNS) {
          query = property[column] == null ? query.is(column, null) : query.eq(column, property[column]);
        }
        const { data, error } = await query.select("id").maybeSingle();
        return !error && data?.id === id;
      },
    });
    outcomes.push({ id, ...result });
  }

  await logAction({
    ...audit,
    metadata: { intent_id: intentId, propertyIds: ids, outcomes },
  });
  if (bulk) revalidatePath("/dashboard/cms");

  const saved = outcomes.filter(({ stage }) => stage === "saved");
  const failures = outcomes.filter(({ stage }) => stage !== "saved");
  const cachePending = saved.filter((outcome) => outcome.cachePending).length;
  const reconciliation = failures.filter((outcome) => outcome.publicChanged).length;
  if (!bulk) {
    const code = reconciliation ? "supabase-after-unpublish" : failures[0]?.stage || (cachePending ? "cache" : archive ? "archived" : "restored");
    return { message: ARCHIVE_FEEDBACK[code], saved: saved.length > 0 };
  }

  const messages = [];
  if (saved.length) messages.push(`Archived ${saved.length} of ${ids.length} selected properties.`);
  for (const [stage, message] of [
    ["airtable", "Airtable could not confirm removal. Retry the selected properties."],
    ["reference", "Check the Airtable listing reference before retrying."],
    ["protected", "Use the suspension or retained-removal workflow for protected listings."],
    ["supabase", "Could not save the review status. Refresh and retry."],
  ]) {
    const count = failures.filter((outcome) => outcome.stage === stage).length;
    if (count) messages.push(`${count} ${count === 1 ? "property needs" : "properties need"} attention. ${message}`);
  }
  if (reconciliation) messages.push(`Airtable confirmed removal for ${reconciliation}, but the queue update needs a retry.`);
  if (cachePending) messages.push(`Public cache verification is pending for ${cachePending}.`);
  return { message: messages.join(" "), retryIds: failures.map(({ id }) => id), savedIds: saved.map(({ id }) => id) };
}

export async function setPropertyArchived(_previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const propertyId = formData.get("propertyId")?.toString();
  const requested = formData.get("nextValue");
  const reason = formData.get("reason")?.toString().trim() || null;
  if (requested !== "true" && requested !== "false") return { message: ARCHIVE_FEEDBACK.invalid };
  return changeArchiveState({ staff, propertyIds: [propertyId], archive: requested === "true", reason });
}

export async function bulkArchiveProperties(propertyIds, reason) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);
  return changeArchiveState({
    staff, propertyIds, archive: true, bulk: true,
    reason: typeof reason === "string" ? reason.trim() : null,
  });
}
