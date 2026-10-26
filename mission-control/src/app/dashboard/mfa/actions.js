"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";

export async function getStaffMfaPosture() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  return {
    email: staff.email,
    displayName: staff.display_name,
    tier: staff.tier,
    isFinance: staff.is_finance,
    aal: staff.aal || "aal1",
    nextAal: staff.nextAal || "aal1",
    mfaRequired: Boolean(staff.mfaRequired),
    enrolledMfa: Boolean(staff.enrolledMfa),
  };
}

export async function recordMfaAuditEvent({ action, factorId = null, reason = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  // Audited event logging for security posture changes
  await logActionStrict({
    staff,
    action: `STAFF_MFA_${action.toUpperCase()}`,
    targetTable: "auth.mfa_factors",
    targetId: factorId || staff.id,
    reason: reason || "Staff self-service MFA action",
    metadata: {
      staff_email: staff.email,
      staff_tier: staff.tier,
      prior_aal: staff.aal,
    },
  });

  return { success: true };
}
