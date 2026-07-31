"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

/**
 * @param {FormData} formData
 */
export async function updateUserProfile(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const userId = formData.get("userId")?.toString();
  if (!userId) throw new Error("Missing userId.");

  const patch = {
    display_name: emptyToNull(formData.get("display_name")),
    headline: emptyToNull(formData.get("headline")),
    location: emptyToNull(formData.get("location")),
    bio: emptyToNull(formData.get("bio")),
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const { error } = await admin.from("user_profiles").update(patch).eq("id", userId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "user.edit",
    targetTable: "user_profiles",
    targetId: userId,
    metadata: patch,
  });

  revalidatePath("/dashboard/crm");
}

export async function setShadowban(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const userId = formData.get("userId")?.toString();
  const nextValue = formData.get("nextValue") === "true";
  const reason = emptyToNull(formData.get("reason"));
  if (!userId) throw new Error("Missing userId.");
  if (nextValue && !reason) throw new Error("A reason is required to shadowban a user.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_profiles")
    .update({
      is_shadowbanned: nextValue,
      moderation_note: nextValue ? reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: nextValue ? "user.block" : "user.unblock",
    targetTable: "user_profiles",
    targetId: userId,
    reason,
  });

  revalidatePath("/dashboard/crm");
}

export async function setArchived(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const userId = formData.get("userId")?.toString();
  const nextValue = formData.get("nextValue") === "true";
  const reason = emptyToNull(formData.get("reason"));
  if (!userId) throw new Error("Missing userId.");
  if (nextValue && !reason) throw new Error("A reason is required to archive a user.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_profiles")
    .update({
      archived_at: nextValue ? new Date().toISOString() : null,
      moderation_note: nextValue ? reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: nextValue ? "user.archive" : "user.unarchive",
    targetTable: "user_profiles",
    targetId: userId,
    reason,
  });

  revalidatePath("/dashboard/crm");
}

export async function bulkArchiveUsers(userIds, reason) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!userIds || userIds.length === 0) throw new Error("No users selected.");
  if (!reason) throw new Error("A reason is required to bulk archive users.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_profiles")
    .update({
      archived_at: new Date().toISOString(),
      moderation_note: reason,
      updated_at: new Date().toISOString(),
    })
    .in("id", userIds);
  
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "user.bulk_archive",
    targetTable: "user_profiles",
    targetId: `Multiple (${userIds.length})`,
    reason,
    metadata: { userIds },
  });

  revalidatePath("/dashboard/crm");
}

function emptyToNull(value) {
  const str = value?.toString().trim();
  return str ? str : null;
}
