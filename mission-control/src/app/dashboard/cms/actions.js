"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { publishPropertyToAirtable, unpublishPropertyFromAirtable } from "@/lib/airtable";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import { notifyUser } from "@/lib/notifications";

const BLOCKED_MODERATION_STATES = new Set(["permanently_removed", "staff_suspended"]);
const ARCHIVED_OR_OFF_MARKET = new Set(["archived", "off_market"]);
const MAX_BULK_ARCHIVE_IDS = 100;

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
    throw new Error("Property not found.");
  }

  // Enforce source-state checks: suspended/removed listings cannot be approved;
  // Tier 1 cannot un-archive or override Tier 2 archived/off-market rows.
  const lifecycle = String(property.lifecycle_state || "").trim().toLowerCase();
  const moderation = String(property.moderation_status || "").trim().toLowerCase();
  const pipeline = String(property.pipeline_status || "").trim().toLowerCase();

  if (BLOCKED_MODERATION_STATES.has(lifecycle) || BLOCKED_MODERATION_STATES.has(moderation)) {
    throw new Error(`Approval blocked: listing is in "${lifecycle || moderation}" state.`);
  }
  if (
    staff.tier < TIERS.OPS_MANAGER &&
    (ARCHIVED_OR_OFF_MARKET.has(lifecycle) ||
      ARCHIVED_OR_OFF_MARKET.has(moderation) ||
      ARCHIVED_OR_OFF_MARKET.has(pipeline))
  ) {
    throw new Error("Approval blocked: Ops Manager (Tier 2)+ is required to restore an archived or off-market listing.");
  }

  // Dual-CMS §2.4: PDF-assisted drafts must be verified against source document first.
  if (property.creation_source === "pdf_assisted" && !property.pdf_verified) {
    throw new Error("Publication blocked: PDF-assisted draft has not been verified against its source document.");
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
      summary: "Publish to the public CMS failed.",
      detail: { slug: property.slug || null, error: err?.message || "publish error" },
    });
    throw new Error("Publish to the public CMS failed.");
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
    throw new Error(
      `Published to the live site (slug: ${lockedCanonicalSlug}) but failed to record approval in Supabase. Retry the approval.`
    );
  }

  await logActionStrict({
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
    throw new Error("Property not found.");
  }

  const updates = {};
  if (nextTitle && nextTitle !== property.title) {
    if (!canStaffChangeDisplayTitle(property)) {
      throw new Error(
        "Display title is locked after first publication because Airtable's Slug formula derives from Title (Dual-CMS Rule #3 / GAP-33)."
      );
    }
    updates.title = nextTitle.slice(0, 300);
  }
  if (typeof nextLocation === "string" && nextLocation.length > 0) {
    updates.location = nextLocation.slice(0, 500);
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await admin.from("properties").update(updates).eq("id", propertyId);
  if (error) throw new Error("Failed to update property metadata.");

  await logActionStrict({
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

  const propertyId = formData.get("propertyId")?.toString().trim();
  const reasonLabel = formData.get("reasonLabel")?.toString().trim();
  const reasonNote = formData.get("reasonNote")?.toString().trim();
  if (!propertyId) throw new Error("Missing propertyId.");
  if (!reasonLabel) throw new Error("A rejection reason is required.");

  const reason = (reasonNote ? `${reasonLabel} — ${reasonNote}` : reasonLabel).slice(0, 1000);

  const admin = createAdminClient();
  const { data: current, error: loadErr } = await admin
    .from("properties")
    .select("id, owner_id, title, moderation_status, pipeline_status, lifecycle_state, slug, canonical_slug")
    .eq("id", propertyId)
    .maybeSingle();

  if (loadErr || !current) {
    throw new Error("Property not found.");
  }

  const curLifecycle = String(current.lifecycle_state || "").trim().toLowerCase();
  const curMod = String(current.moderation_status || "").trim().toLowerCase();
  const curPipe = String(current.pipeline_status || "").trim().toLowerCase();

  if (BLOCKED_MODERATION_STATES.has(curLifecycle) || BLOCKED_MODERATION_STATES.has(curMod)) {
    throw new Error("Cannot reject a suspended or permanently removed listing.");
  }
  if (
    staff.tier < TIERS.OPS_MANAGER &&
    (ARCHIVED_OR_OFF_MARKET.has(curLifecycle) || ARCHIVED_OR_OFF_MARKET.has(curMod) || ARCHIVED_OR_OFF_MARKET.has(curPipe))
  ) {
    throw new Error("Ops Manager (Tier 2)+ is required to modify an archived or off-market listing.");
  }

  const wasLive = curLifecycle === "live" || curPipe === "approved";
  if (wasLive && staff.tier < TIERS.OPS_MANAGER) {
    throw new Error("Ops Manager (Tier 2)+ is required to reject and unpublish a live listing.");
  }

  const patch = {
    moderation_status: "rejected",
    rejection_reason: reason,
    ...(wasLive ? { pipeline_status: "rejected", lifecycle_state: "draft" } : {}),
  };

  const { data: updated, error } = await admin
    .from("properties")
    .update(patch)
    .eq("id", propertyId)
    .select("id, owner_id, title")
    .maybeSingle();
  if (error || !updated) throw new Error("Failed to reject property.");

  if (wasLive) {
    const slug = current.canonical_slug || current.slug;
    if (slug) {
      try {
        await unpublishPropertyFromAirtable(slug);
      } catch (err) {
        await recordSystemEvent({
          event: EVENTS.AIRTABLE_SYNC_FAILED,
          severity: "error",
          subjectTable: "properties",
          subjectId: propertyId,
          summary: "Rejected a live property in Supabase, but Airtable unpublish failed.",
          detail: { slug, error: err?.message || "unpublish failed" },
        });
      }
    }
  }

  // GAP-111: Notify the property owner when a listing is rejected so remediation is not a dead end
  if (updated.owner_id) {
    await notifyUser(admin, {
      userId: updated.owner_id,
      title: "Listing Needs Attention",
      desc: `Your listing "${updated.title || "Property"}" was not approved: ${reason}`,
      icon: "⚠️",
      propertyId,
      notificationType: "property_rejected",
    });
  }

  await logActionStrict({
    staff,
    action: "property.reject",
    targetTable: "properties",
    targetId: propertyId,
    reason,
    metadata: { was_live: wasLive },
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

  const propertyId = formData.get("propertyId")?.toString().trim();
  const nextValue = formData.get("nextValue") === "true";
  const reason = formData.get("reason")?.toString().trim().slice(0, 1000) || null;
  if (!propertyId) throw new Error("Missing propertyId.");
  if (nextValue && !reason) throw new Error("A reason is required to archive a property.");

  const admin = createAdminClient();
  const { data: prop, error: loadErr } = await admin
    .from("properties")
    .select("slug, canonical_slug, lifecycle_state, moderation_status")
    .eq("id", propertyId)
    .maybeSingle();
  if (loadErr || !prop) throw new Error("Property not found.");

  const curLifecycle = String(prop.lifecycle_state || "").trim().toLowerCase();
  if (!nextValue && BLOCKED_MODERATION_STATES.has(curLifecycle)) {
    throw new Error(`Cannot un-archive a property in "${curLifecycle}" state.`);
  }

  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: nextValue ? "archived" : "pending",
      pipeline_status: nextValue ? "archived" : "pending",
      lifecycle_state: nextValue ? "off_market" : "draft",
      archived_at: nextValue ? new Date().toISOString() : null,
      rejection_reason: nextValue ? reason : null,
    })
    .eq("id", propertyId);
  if (error) throw new Error("Failed to update archive status.");

  if (nextValue && prop) {
    const slug = prop.canonical_slug || prop.slug;
    if (slug) {
      try {
        await unpublishPropertyFromAirtable(slug);
      } catch (err) {
        await recordSystemEvent({
          event: EVENTS.AIRTABLE_SYNC_FAILED,
          severity: "error",
          subjectTable: "properties",
          subjectId: propertyId,
          summary: "Archived property in Supabase, but Airtable unpublish failed.",
          detail: { slug, error: err?.message || "unpublish failed" },
        });
      }
    }
  }

  await logActionStrict({
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

  if (!Array.isArray(propertyIds) || propertyIds.length === 0) {
    throw new Error("No properties selected.");
  }
  const cleanIds = [...new Set(
    propertyIds
      .filter((id) => typeof id === "string" && id.trim())
      .map((id) => id.trim())
  )];
  if (cleanIds.length === 0) {
    throw new Error("No valid property IDs selected.");
  }
  if (cleanIds.length > MAX_BULK_ARCHIVE_IDS) {
    throw new Error(`Bulk archive is limited to ${MAX_BULK_ARCHIVE_IDS} properties per batch.`);
  }
  const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 1000) : "";
  if (!cleanReason) throw new Error("A reason is required to bulk archive properties.");

  const admin = createAdminClient();
  const { data: props, error: fetchErr } = await admin
    .from("properties")
    .select("id, slug, canonical_slug")
    .in("id", cleanIds);
  if (fetchErr) throw new Error("Failed to load properties for bulk archive.");

  const { error } = await admin
    .from("properties")
    .update({
      moderation_status: "archived",
      pipeline_status: "archived",
      lifecycle_state: "off_market",
      archived_at: new Date().toISOString(),
      rejection_reason: cleanReason,
    })
    .in("id", cleanIds);

  if (error) throw new Error("Bulk archive update failed.");

  if (props && props.length > 0) {
    for (const p of props) {
      const slug = p.canonical_slug || p.slug;
      if (slug) {
        try {
          await unpublishPropertyFromAirtable(slug);
        } catch (err) {
          await recordSystemEvent({
            event: EVENTS.AIRTABLE_SYNC_FAILED,
            severity: "error",
            subjectTable: "properties",
            subjectId: p.id,
            summary: "Bulk-archived property in Supabase, but Airtable unpublish failed.",
            detail: { slug, error: err?.message || "unpublish failed" },
          });
        }
      }
    }
  }

  await logActionStrict({
    staff,
    action: "property.bulk_archive",
    targetTable: "properties",
    targetId: `Multiple (${cleanIds.length})`,
    reason: cleanReason,
    metadata: { propertyIds: cleanIds },
  });

  revalidatePath("/dashboard/cms");
}
