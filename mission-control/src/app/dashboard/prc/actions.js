"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { purgePublicCatalogueCache } from "@/lib/publicCatalogueCache";

export async function loadPrcProfiles() {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_profiles")
    .select("id, display_name, email, firm, prc_license, dhsud_number, prc_expiry, prc_verified, prc_verified_at, updated_at")
    .not("prc_license", "is", null)
    .neq("prc_license", "")
    .order("prc_verified", { ascending: true })
    .order("updated_at", { ascending: false });

  if (error) {
    return { error: error.message || "Failed to load PRC license queue." };
  }

  return { profiles: data || [] };
}

export async function updatePrcVerificationAction({ userId, verified, prcExpiry = null, reason = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!userId || typeof verified !== "boolean") {
    return { error: "Missing required userId or verified state." };
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  const updatePayload = {
    prc_verified: verified,
    prc_verified_at: verified ? nowIso : null,
    updated_at: nowIso,
  };

  if (typeof prcExpiry === "string") {
    const cleanExpiry = prcExpiry.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanExpiry)) {
      updatePayload.prc_expiry = cleanExpiry;
    } else if (cleanExpiry === "") {
      updatePayload.prc_expiry = null;
    }
  } else if (prcExpiry === null) {
    updatePayload.prc_expiry = null;
  }

  const { error } = await admin
    .from("user_profiles")
    .update(updatePayload)
    .eq("id", userId);

  if (error) {
    return { error: error.message || "Failed to update PRC verification." };
  }

  // Purge public catalogue cache to propagate badge immediately
  await purgePublicCatalogueCache();

  // Audit
  await logActionStrict({
    staff,
    action: verified ? "STAFF_PRC_LICENSE_VERIFIED" : "STAFF_PRC_LICENSE_REVOKED",
    targetTable: "user_profiles",
    targetId: userId,
    reason: reason || (verified ? "PRC license verified against regulatory registry" : "PRC license verification revoked"),
    metadata: {
      prc_expiry: updatePayload.prc_expiry,
      verified,
    },
  });

  return { success: true };
}
