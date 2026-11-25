"use server";

import { getCurrentStaff, logActionStrict } from "@/lib/rbac";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_MFA_ACTIONS = new Set([
  "enroll_initiated",
  "enroll_completed",
  "session_stepup",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_REASON_LENGTH = 500;

export async function getStaffMfaPosture() {
  const staff = await getCurrentStaff();
  if (!staff || !staff.active) {
    throw new Error("Not authenticated as active Mission Control staff.");
  }

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
  if (!staff || !staff.active) {
    throw new Error("Not authenticated as active Mission Control staff.");
  }

  const normalizedAction = typeof action === "string" ? action.trim().toLowerCase() : "";
  if (!ALLOWED_MFA_ACTIONS.has(normalizedAction)) {
    throw new Error("Unsupported MFA audit action.");
  }

  let cleanFactorId = null;
  if (factorId !== null && factorId !== undefined && factorId !== "") {
    if (typeof factorId !== "string" || !UUID_RE.test(factorId.trim())) {
      throw new Error("Invalid MFA factor ID format.");
    }
    cleanFactorId = factorId.trim();
  } else if (normalizedAction !== "enroll_initiated") {
    throw new Error("MFA factor ID is required for verification events.");
  }

  const cleanReason =
    typeof reason === "string" && reason.trim()
      ? reason.trim().slice(0, MAX_REASON_LENGTH)
      : "Staff self-service MFA action";

  // Verify factor ownership & state via Supabase Auth MFA API
  const supabase = await createSupabaseServerClient();
  if (supabase.auth?.mfa?.listFactors) {
    const { data: factorsData, error: factorsErr } = await supabase.auth.mfa.listFactors();
    if (factorsErr || !factorsData) {
      throw new Error("Unable to verify MFA factor state.");
    }
    const allFactors = [...(factorsData.all || []), ...(factorsData.totp || [])];
    if (cleanFactorId) {
      const matched = allFactors.find((f) => f && f.id === cleanFactorId);
      if (!matched) {
        throw new Error("MFA factor does not belong to the authenticated staff session.");
      }
      if (normalizedAction !== "enroll_initiated" && matched.status !== "verified") {
        throw new Error("MFA factor is not verified.");
      }
    }
  }

  if (normalizedAction !== "enroll_initiated" && staff.aal !== "aal2") {
    throw new Error("Session must be at AAL2 to record completed MFA verification.");
  }

  // Audited event logging for security posture changes
  await logActionStrict({
    staff,
    action: `STAFF_MFA_${normalizedAction.toUpperCase()}`,
    targetTable: "auth.mfa_factors",
    targetId: cleanFactorId || staff.id,
    reason: cleanReason,
    metadata: {
      staff_email: staff.email,
      staff_tier: staff.tier,
      prior_aal: staff.aal,
    },
  });

  return { success: true };
}
