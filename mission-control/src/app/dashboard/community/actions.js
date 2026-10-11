"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import {
  evaluateSignalDecision,
  signalModerationPatch,
  targetStatusForAction,
} from "@/lib/signalModerationPolicy.mjs";

// ═══════════════════════════════════════════════════════════════
// A-145 P2a — Staff moderation actions for Stratosphere Community Signals.
//
// Key architectural rules:
// 1. Ops Manager (Tier 2)+ required. Never Agent tier.
// 2. The row is re-read at decision time from Supabase service-role client.
// 3. Optimistic guard on previous status to prevent race conditions.
// 4. No deletions: records and history are preserved immutably (spec §17/§18).
// 5. Strict audit log written via logActionStrict to mission_control_actions.
// ═══════════════════════════════════════════════════════════════

/**
 * Moderate one Stratosphere community signal. Ops Manager (Tier 2)+.
 *
 * @param {FormData} formData
 */
export async function decideSignal(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const signalId = formData.get("signalId")?.toString().trim();
  const action = formData.get("action")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim() || "";

  if (!signalId) throw new Error("A signal ID is required.");
  if (!action) throw new Error("A moderation action is required.");

  const admin = createAdminClient();

  // Re-read at decision time.
  const { data: row, error: readError } = await admin
    .from("stratosphere_signals")
    .select(
      "id, author_account_id, scout_id_snapshot, signal_type, commercial_flag, status, title, body, created_at, updated_at"
    )
    .eq("id", signalId)
    .single();

  if (readError || !row) {
    throw new Error("That community signal could not be read.");
  }

  const verdict = evaluateSignalDecision(row, action, { reason });
  if (!verdict.allowed) {
    throw new Error(verdict.reason);
  }

  const now = new Date().toISOString();
  const patch = signalModerationPatch({ action, now });

  const { error: updateError } = await admin
    .from("stratosphere_signals")
    .update(patch)
    .eq("id", signalId)
    // Optimistic guard: if the status moved under us, fail cleanly
    .eq("status", row.status);

  if (updateError) {
    throw new Error(`Could not record the moderation decision: ${updateError.message}`);
  }

  const targetStatus = targetStatusForAction(action);

  await logActionStrict({
    staff,
    action: `signal.${targetStatus}`,
    targetTable: "stratosphere_signals",
    targetId: signalId,
    reason: reason || null,
    metadata: {
      moderation_action: action,
      previous_status: row.status,
      new_status: targetStatus,
      scout_id: row.scout_id_snapshot,
      signal_type: row.signal_type,
      commercial_flag: row.commercial_flag,
    },
  });

  revalidatePath("/dashboard/community");
}
