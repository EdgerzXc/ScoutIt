"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

/**
 * Toggle a live feature flag on/off.
 * @param {FormData} formData
 */
export async function toggleFeatureFlag(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const id = formData.get("id")?.toString();
  const nextEnabled = formData.get("nextEnabled") === "true";
  if (!id) throw new Error("Missing feature flag key.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("feature_flags")
    .update({ is_enabled: nextEnabled, updated_at: new Date().toISOString(), updated_by: staff.id })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "feature_flag.toggle",
    targetTable: "feature_flags",
    targetId: id,
    metadata: { is_enabled: nextEnabled },
  });

  revalidatePath("/dashboard/features");
}

/**
 * 1-Click Master Paywall Gate toggle (pilot_zero_paywall <-> production_enforced).
 * Atomically syncs both `monetization_enforced` and `pre_launch_free_mode`.
 * @param {FormData} formData
 */
export async function togglePaywallGate(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const enforcePaywall = formData.get("enforcePaywall") === "true";
  const nowIso = new Date().toISOString();
  const admin = createAdminClient();

  const { error } = await admin.from("feature_flags").upsert(
    [
      {
        id: "monetization_enforced",
        is_enabled: enforcePaywall,
        description:
          "MASTER PAYWALL GATE: Enforce Universe tier subscriptions (₱2,499/mo), active listing quotas (1/5/20/∞), and paid Connects spend.",
        updated_at: nowIso,
        updated_by: staff.id,
      },
      {
        id: "pre_launch_free_mode",
        is_enabled: !enforcePaywall,
        description: "Unlock all premium features while seeding the first 200 listings.",
        updated_at: nowIso,
        updated_by: staff.id,
      },
    ],
    { onConflict: "id" }
  );

  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "paywall_gate.toggle",
    targetTable: "feature_flags",
    targetId: "monetization_enforced",
    metadata: {
      monetization_enforced: enforcePaywall,
      pre_launch_free_mode: !enforcePaywall,
      phase: enforcePaywall ? "production_enforced" : "pilot_zero_paywall",
    },
  });

  revalidatePath("/dashboard/features");
}

/**
 * Create a new feature flag (starts disabled).
 * @param {FormData} formData
 */
export async function createFeatureFlag(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const id = formData.get("id")?.toString().trim().toLowerCase();
  const description = formData.get("description")?.toString().trim() || null;
  if (!id) throw new Error("A flag key is required.");
  if (!/^[a-z0-9_]+$/.test(id)) {
    throw new Error("Flag key must be lowercase letters, numbers, and underscores only.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("feature_flags")
    .insert({ id, description, is_enabled: false, updated_by: staff.id });
  if (error) {
    if (error.code === "23505") throw new Error(`A flag named "${id}" already exists.`);
    throw new Error(error.message);
  }

  await logAction({
    staff,
    action: "feature_flag.create",
    targetTable: "feature_flags",
    targetId: id,
    metadata: { description },
  });

  revalidatePath("/dashboard/features");
}
