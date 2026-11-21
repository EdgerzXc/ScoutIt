"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, TIERS, logAction, logActionStrict } from "@/lib/rbac";
import { verificationDecisionForRevert } from "@/lib/auditRevertPolicy.mjs";

export async function revertAction(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const actionId = formData.get("actionId");
  if (typeof actionId !== "string" || !actionId) return { error: "Select an audit entry." };
  const admin = createAdminClient();
  const { data: target, error } = await admin
    .from("mission_control_actions")
    .select("action, target_table, target_id, actor_id, metadata")
    .eq("id", actionId)
    .maybeSingle();
  if (error) return { error: "Could not read the audit entry." };
  const decision = verificationDecisionForRevert(target);
  if (!decision) return { error: "This entry cannot be reverted from the audit log." };

  const audit = {
    staff, action: `revert.${target.action}`, targetTable: "verification_requests", targetId: decision.id,
    reason: "Reopen the recorded verification decision for review",
    metadata: { reverted_action_id: actionId, decision_at: decision.decidedAt },
  };
  let intentId;
  try {
    intentId = await logActionStrict({ ...audit, action: `${audit.action}.intent` });
  } catch {
    return { error: "Could not record the revert in the staff audit." };
  }
  const { data: saved, error: writeError } = await admin.from("verification_requests")
    .update({ status: "pending", reviewer_id: null, review_notes: null, decided_at: null, updated_at: new Date().toISOString() })
    .eq("id", decision.id)
    .eq("status", decision.status)
    .eq("reviewer_id", decision.reviewerId)
    .eq("decided_at", decision.decidedAt)
    .select("id")
    .maybeSingle();
  if (writeError || !saved) return { error: "The decision changed or has already been reopened. Refresh the audit log." };

  await logAction({ ...audit, metadata: { ...audit.metadata, intent_id: intentId } });
  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard/inbox");
  return { message: "Verification reopened for review." };
}
