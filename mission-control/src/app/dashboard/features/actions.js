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
