"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, logActionStrict, TIERS } from "@/lib/rbac";
import { editBoundProperty, unpublishBoundProperty } from "@/lib/airtable";
import { notifyUser } from "@/lib/notifications";
import { changePropertyArchiveState } from "@/lib/propertyArchive.mjs";
import { getPropertyBinding, isLiveProperty, isProtectedProperty, matchPropertySnapshot } from "@/lib/propertyPublication.mjs";
import { approveStaffProperty } from "@/lib/staffPropertyApproval";

export async function approveProperty(_previousState, formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const propertyId = formData.get("propertyId")?.toString();
  if (!PROPERTY_ID.test(propertyId || "")) return { message: "Select a valid property draft." };
  const result = await approveStaffProperty({
    admin: createAdminClient(), staff, propertyId, action: "property.approve_publish",
    reason: "Approved a listing from the CMS queue",
  });
  if (!result.success) return { message: result.error };
  return {
    saved: true,
    message: result.publicCachePending ? "Listing approved. Check the public page before sharing it." : "Listing published.",
  };
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
    .select("*")
    .eq("id", propertyId)
    .single();

  if (fetchError || !property) {
    throw new Error(fetchError?.message || "Property not found.");
  }
  if (isProtectedProperty(property)) throw new Error("This listing must use the protected review workflow.");

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

  const live = isLiveProperty(property);
  const binding = live ? getPropertyBinding(property) : null;
  if (live && !binding) throw new Error("This listing requires publication identity reconciliation.");
  const query = admin.from("properties").update(updates).eq("id", propertyId);
  const { data: saved, error } = await matchPropertySnapshot(query, property).select("*").maybeSingle();
  if (error || !saved) throw new Error("Could not confirm the edit. Refresh the property and retry.");
  let publicSyncPending = false;
  if (binding) {
    try {
      const cache = await editBoundProperty(binding, { property: saved });
      publicSyncPending = !cache.purged;
    } catch {
      publicSyncPending = true;
    }
  }

  await logAction({
    staff,
    action: "property.update_metadata",
    targetTable: "properties",
    targetId: propertyId,
    metadata: { ...updates, publicSyncPending },
  });

  revalidatePath("/dashboard/cms");
  if (publicSyncPending) throw new Error("Saved privately. Check the public listing before relying on the change.");
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
    .select("*")
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
      unpublish: unpublishBoundProperty,
      save: async (updates) => {
        const query = admin.from("properties").update(updates).eq("id", id);
        const { data, error } = await matchPropertySnapshot(query, property).select("id").maybeSingle();
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
