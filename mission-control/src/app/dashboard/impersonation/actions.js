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

  const secret = process.env.IMPERSONATION_SECRET;
  if (typeof secret !== "string" || !secret.trim()) {
    return { error: "Impersonation signing secret is not configured." };
  }

  const admin = createAdminClient();

  // Verify target user exists
  const { data: userProfile, error: profileError } = await admin
    .from("user_profiles")
    .select("id, display_name, role, primary_mode, subscription_tier")
    .eq("id", targetUserId.trim())
    .maybeSingle();

  if (profileError) {
    return { error: "Failed to verify target user profile." };
  }

  if (!userProfile) {
    return { error: "Target user not found in user_profiles registry." };
  }

  let targetEmail = null;
  if (typeof admin.auth?.admin?.getUserById === "function") {
    try {
      const { data: authRes } = await admin.auth.admin.getUserById(userProfile.id);
      targetEmail = authRes?.user?.email || null;
    } catch {
      targetEmail = null;
    }
  }

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
      target_user_email: targetEmail,
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
    targetUser: { ...userProfile, email: targetEmail },
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
