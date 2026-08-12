import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const TIERS = {
  AGENT: 1,
  OPS_MANAGER: 2,
  SUPER_ADMIN: 3,
};

export const TIER_LABELS = {
  1: "Agent",
  2: "Ops Manager",
  3: "Super Admin",
};

/**
 * Resolves the logged-in Supabase Auth user (from the request's own
 * cookies) to their `admin_users` row. Returns null if there's no
 * session, no admin_users row, or the row is deactivated — all three
 * cases should be treated identically by callers (no staff access).
 */
export async function getCurrentStaff() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: staff, error } = await admin
    .from("admin_users")
    .select("id, email, display_name, tier, is_finance, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !staff || !staff.active) return null;

  return staff;
}

/** Throws if the current staff member doesn't meet the minimum tier. Use at the top of every Server Action that mutates data. */
export function assertTier(staff, minTier) {
  if (!staff || !staff.active) {
    throw new Error("Not authenticated as active Mission Control staff.");
  }
  if (staff.tier < minTier) {
    throw new Error(
      `This action requires ${TIER_LABELS[minTier]} (Tier ${minTier}) or higher. ` +
        `You are ${TIER_LABELS[staff.tier]} (Tier ${staff.tier}).`
    );
  }
}

/**
 * Writes one row to mission_control_actions. Call this in the same
 * Server Action as the mutation it describes, after the mutation
 * succeeds. `reason` should be required by the caller (not enforced
 * here) for destructive/moderation actions.
 */
export async function logAction({
  staff,
  action,
  targetTable,
  targetId,
  reason = null,
  metadata = {},
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("mission_control_actions").insert({
    actor_id: staff.id,
    actor_tier: staff.tier,
    action,
    target_table: targetTable,
    target_id: String(targetId),
    reason,
    metadata,
  });

  if (error) {
    // Don't let a logging failure silently hide that the mutation happened,
    // but don't block the response either — surface it loudly server-side.
    console.error("mission_control_actions insert failed:", error, {
      action,
      targetTable,
      targetId,
    });
  }
}

/** High-assurance audit write. Throws when the immutable record cannot be persisted. */
export async function logActionStrict({
  staff,
  action,
  targetTable,
  targetId,
  reason = null,
  metadata = {},
}) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mission_control_actions")
    .insert({
      actor_id: staff.id,
      actor_tier: staff.tier,
      action,
      target_table: targetTable,
      target_id: String(targetId),
      reason,
      metadata,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("The immutable Mission Control audit record could not be persisted.");
  }
  return data.id;
}