"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateImpersonationRequest,
  generateImpersonationToken,
} from "@/lib/impersonationPolicy.mjs";

export async function createImpersonationSessionAction({
  targetUserId,
  reason,
  durationMinutes = 15,
}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const validation = validateImpersonationRequest({ targetUserId, reason, durationMinutes });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const admin = createAdminClient();

  // Verify target user exists
  const { data: userProfile } = await admin
    .from("user_profiles")
    .select("id, display_name, email, role, primary_mode, subscription_tier")
    .eq("id", targetUserId.trim())
    .maybeSingle();

  if (!userProfile) {
    return { error: "Target user not found in user_profiles registry." };
  }

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "scoutit_impersonation_fallback_secret";
  const { token, exp } = generateImpersonationToken({
    staffId: staff.id,
    staffEmail: staff.email,
    staffTier: staff.tier,
    targetUserId: userProfile.id,
    reason: reason.trim(),
    durationMinutes: Number(durationMinutes),
    secret,
  });

  // Strictly log audit trail
  await logActionStrict({
    staff,
    action: "STAFF_IMPERSONATION_STARTED",
    targetTable: "user_profiles",
    targetId: userProfile.id,
    reason: reason.trim(),
    metadata: {
      target_user_email: userProfile.email,
      target_user_name: userProfile.display_name,
      duration_minutes: durationMinutes,
      expires_at: new Date(exp).toISOString(),
      read_only: true,
    },
  });

  return {
    success: true,
    token,
    exp,
    targetUser: userProfile,
  };
}

export async function terminateImpersonationAction({ targetUserId, reason = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  await logActionStrict({
    staff,
    action: "STAFF_IMPERSONATION_TERMINATED",
    targetTable: "user_profiles",
    targetId: targetUserId || staff.id,
    reason: reason || "Manual early termination by Super Admin",
    metadata: {
      terminated_by: staff.email,
      timestamp: new Date().toISOString(),
    },
  });

  return { success: true };
}
