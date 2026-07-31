"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

/**
 * A7 Phase 1 — block a masked IP hash. Ops Manager (Tier 2)+.
 * Values are the PRIVACY-PRESERVING hashes from security_access_logs
 * (`ip_anon_…`), never raw IPs. Enforcement happens in the main app's
 * middleware (Phase 2, gated) — this manages the ban list it reads.
 * @param {FormData} formData
 */
export async function blockHash(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const maskedIp = formData.get("maskedIp")?.toString().trim();
  const reason = formData.get("reason")?.toString().trim();
  if (!maskedIp) throw new Error("Missing masked IP hash.");
  if (!reason) throw new Error("A reason is required to block.");

  const admin = createAdminClient();
  const { error } = await admin.from("blocked_access").insert({
    type: "ip",
    value: maskedIp,
    reason,
    blocked_by: staff.id,
  });
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "security.block_ip",
    targetTable: "blocked_access",
    targetId: maskedIp,
    reason,
  });

  revalidatePath("/dashboard/security");
}

/**
 * Unblock a previously blocked masked IP hash. Ops Manager (Tier 2)+.
 * Removes the ban entry (an access-control lift, not data deletion — the
 * traffic history in security_access_logs is untouched).
 * @param {FormData} formData
 */
export async function unblockHash(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const blockId = formData.get("blockId")?.toString();
  const maskedIp = formData.get("maskedIp")?.toString();
  if (!blockId) throw new Error("Missing block id.");

  const admin = createAdminClient();
  const { error } = await admin.from("blocked_access").delete().eq("id", blockId).eq("type", "ip");
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "security.unblock_ip",
    targetTable: "blocked_access",
    targetId: maskedIp || blockId,
    reason: "Ban lifted by staff",
  });

  revalidatePath("/dashboard/security");
}