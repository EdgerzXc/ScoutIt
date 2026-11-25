"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
// logAction lives in rbac.js alongside the tier checks, not in a separate
// auditLog module — it shares the service-role client and is meant to be
// called in the same Server Action as the mutation it records.
import { getCurrentStaff, assertTier, TIERS, logActionStrict } from "@/lib/rbac";
import { unpublishPropertyFromAirtable, updatePropertyInAirtable } from "@/lib/airtable";

const ALLOWED_RESTORE_STATUSES = new Set(["pending", "approved", "archived", "rejected"]);

export async function revertAction(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const actionId = formData.get("actionId")?.toString().trim();
  if (!actionId) throw new Error("Action ID is required");

  const admin = createAdminClient();
  const { data: targetAction, error } = await admin
    .from("mission_control_actions")
    .select("*")
    .eq("id", actionId)
    .single();

  if (error || !targetAction) throw new Error("Action not found or already reverted");

  const { target_table, target_id, action, metadata } = targetAction;
  if (typeof action === "string" && action.startsWith("revert.")) {
    throw new Error("Revert entries themselves are immutable and cannot be reverted.");
  }
  const prevState = metadata?.previous_state;

  // Revert target table state based on original action type
  if (target_table === "properties") {
    const rawRestore = String(prevState?.moderation_status || "pending").toLowerCase();
    const restoreStatus = ALLOWED_RESTORE_STATUSES.has(rawRestore) ? rawRestore : "pending";
    const pipelineStatus =
      restoreStatus === "approved"
        ? "approved"
        : restoreStatus === "archived"
        ? "archived"
        : restoreStatus === "rejected"
        ? "rejected"
        : "pending";
    const lifecycleState =
      restoreStatus === "approved"
        ? "live"
        : restoreStatus === "archived"
        ? "off_market"
        : restoreStatus === "rejected"
        ? "deleted"
        : "draft";

    const { data: prop } = await admin
      .from("properties")
      .select("slug, canonical_slug")
      .eq("id", target_id)
      .maybeSingle();

    const { error: propUpdErr } = await admin
      .from("properties")
      .update({
        moderation_status: restoreStatus,
        pipeline_status: pipelineStatus,
        lifecycle_state: lifecycleState,
      })
      .eq("id", target_id);

    if (propUpdErr) {
      throw new Error(`Could not revert property state: ${propUpdErr.message}`);
    }

    const slug = prop?.canonical_slug || prop?.slug;
    if (slug) {
      try {
        if (restoreStatus === "approved") {
          await updatePropertyInAirtable(slug, { Approved_For_ScoutIt: true });
        } else {
          await unpublishPropertyFromAirtable(slug);
        }
      } catch (err) {
        console.warn("[MMC REVERT] Airtable sync warning:", err.message);
      }
    }
  } else if (target_table === "blocked_access") {
    const { error: delErr } = await admin.from("blocked_access").delete().eq("id", target_id);
    if (delErr) throw new Error(`Could not revert block entry: ${delErr.message}`);
  } else if (target_table === "verification_requests") {
    const { error: verErr } = await admin
      .from("verification_requests")
      .update({ status: "pending", decided_at: null })
      .eq("id", target_id);
    if (verErr) throw new Error(`Could not revert verification request: ${verErr.message}`);
  } else {
    throw new Error(`Reverting actions on "${target_table}" is not supported.`);
  }

  // Record strict immutable audit log of the revert action
  await logActionStrict({
    staff,
    action: `revert.${action}`,
    targetTable: target_table,
    targetId: target_id,
    reason: `Reverted previous action #${actionId}`,
    metadata: { reverted_action_id: actionId },
  });

  revalidatePath("/dashboard/audit");
  revalidatePath("/dashboard/cms");
  revalidatePath("/dashboard/security");
}
