"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";

export async function setOpenGateEntitlement(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);
  const accountId = String(formData.get("accountId") || "").trim();
  const role = String(formData.get("role") || "broker").trim();
  const enabled = formData.get("enabled") === "true";
  const reason = String(formData.get("reason") || "").trim();
  const expiresAt = String(formData.get("expiresAt") || "").trim();
  const expiryUtc = expiresAt ? new Date(`${expiresAt}Z`) : null;
  if (!accountId || !["broker", "owner", "operator"].includes(role) || !reason
    || (enabled && (!expiryUtc || Number.isNaN(expiryUtc.getTime()) || expiryUtc.getTime() <= Date.now()))) {
    throw new Error("Account, eligible role, reason, and future expiry are required.");
  }
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("user_profiles")
    .select("id, role, active_roles").eq("id", accountId).maybeSingle();
  if (profileError || !profile || !(profile.role === role || profile.active_roles?.includes(role))) {
    throw new Error("This account does not have the selected role.");
  }
  const table = role === "broker" ? "open_gate_entitlements" : "open_gate_role_entitlements";
  const identity = role === "broker" ? { broker_id: accountId } : { account_id: accountId, role };
  const { error } = await admin.from(table).upsert({
    ...identity, enabled, expires_at: enabled ? expiryUtc.toISOString() : null,
    granted_by: staff.id, reason, updated_at: new Date().toISOString(),
  }, { onConflict: role === "broker" ? "broker_id" : "account_id,role" });
  if (error) throw new Error("Could not save the Open Gate entitlement.");
  await logActionStrict({
    staff, action: enabled ? "open_gate.entitlement_granted" : "open_gate.entitlement_revoked",
    targetTable: table, targetId: accountId, reason,
    metadata: { role, enabled, expires_at: enabled ? expiryUtc.toISOString() : null },
  });
  revalidatePath("/dashboard/open-gate");
}
