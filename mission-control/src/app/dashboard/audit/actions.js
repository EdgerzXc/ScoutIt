"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
// logAction lives in rbac.js alongside the tier checks, not in a separate
// auditLog module — it shares the service-role client and is meant to be
// called in the same Server Action as the mutation it records.
import { getCurrentStaff, assertTier, TIERS, logAction } from "@/lib/rbac";
import { unpublishPropertyFromAirtable, updatePropertyInAirtable } from "@/lib/airtable";

export async function revertAction(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const actionId = formData.get("actionId");
  if (!actionId) throw new Error("Action ID is required");

  const admin = createAdminClient();
  const { data: targetAction, error } = await admin
    .from("mission_control_actions")
    .select("*")
    .eq("id", actionId)
    .single();

  if (error || !targetAction) throw new Error("Action not found or already reverted");

  const { target_table, target_id, action, metadata } = targetAction;
  const prevState = metadata?.previous_state;

  // Revert target table state based on original action type
  if (target_table === "properties") {
    const restoreStatus = prevState?.moderation_status || "pending";
    const pipelineStatus = restoreStatus === "approved" ? "approved" : restoreStatus === "archived" ? "archived" : "pending";
    const lifecycleState = restoreStatus === "approved" ? "live" : restoreStatus === "archived" ? "off_market" : "draft";

    const { data: prop } = await admin
      .from("properties")
      .select("slug, canonical_slug")
      .eq("id", target_id)
      .maybeSingle();

    await admin
      .from("properties")
      .update({
        moderation_status: restoreStatus,
        pipeline_status: pipelineStatus,
        lifecycle_state: lifecycleState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", target_id);

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
    await admin.from("blocked_access").delete().eq("id", target_id);
  } else if (target_table === "verification_requests") {
    await admin
      .from("verification_requests")
      .update({ status: "pending", decided_at: null })
      .eq("id", target_id);
  }

  // Record audit log of the revert action
  await logAction({
    staff,
    action: `revert.${action}`,
    targetTable: target_table,
    targetId: target_id,
    reason: `Reverted previous action #${actionId}`,
    metadata: { reverted_action_id: actionId }
  });

  revalidatePath("/dashboard/audit");
  revalidatePath("/dashboard/cms");
  revalidatePath("/dashboard/security");
}
