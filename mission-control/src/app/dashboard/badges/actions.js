"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

/** @param {FormData} formData */
export async function createBadge(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const id = formData.get("id")?.toString().trim();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const rarity = formData.get("rarity")?.toString();
  const category = formData.get("category")?.toString();
  const maxSlotsRaw = formData.get("maxSlots")?.toString().trim();
  const color = formData.get("color")?.toString().trim() || null;

  // Extract perks configuration from form
  const queuePriority = formData.get("perk_queue_priority") === "on";
  const discountPct = Number(formData.get("perk_discount_pct") || 0);
  const prioritySupport = formData.get("perk_priority_support") === "on";
  const monthlyConnects = Number(formData.get("perk_monthly_connects") || 0);
  const whiteLabelPdf = formData.get("perk_white_label_pdf") === "on";
  const charterSeal = formData.get("perk_charter_seal") === "on";
  const alphaNotes = formData.get("perk_alpha_notes") === "on";
  const isTransferable = formData.get("perk_is_transferable") === "on";

  const perks = {
    ...(queuePriority ? { queue_priority: true } : {}),
    ...(discountPct > 0 ? { discount_pct: discountPct } : {}),
    ...(prioritySupport ? { priority_support: true } : {}),
    ...(monthlyConnects > 0 ? { monthly_connects: monthlyConnects } : {}),
    ...(whiteLabelPdf ? { white_label_pdf: true } : {}),
    ...(charterSeal ? { charter_seal: true } : {}),
    ...(alphaNotes ? { alpha_notes: true } : {}),
    ...(isTransferable ? { is_transferable: true } : {}),
  };

  if (!id || !/^[a-zA-Z0-9_]+$/.test(id)) {
    throw new Error("Badge id is required and can only contain letters, numbers, underscores.");
  }
  if (!name) throw new Error("Badge name is required.");

  const admin = createAdminClient();
  const { error } = await admin.from("badge_definitions").insert({
    id,
    name,
    description,
    rarity,
    category,
    max_slots: maxSlotsRaw ? Number(maxSlotsRaw) : null,
    color,
    perks,
    created_by: staff.id,
    updated_by: staff.id,
  });
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "badge.create",
    targetTable: "badge_definitions",
    targetId: id,
    metadata: { name, rarity, category, max_slots: maxSlotsRaw || null, perks },
  });

  revalidatePath("/dashboard/badges");
}

/** @param {FormData} formData */
export async function setBadgeActive(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const id = formData.get("id")?.toString();
  const nextActive = formData.get("nextActive") === "true";
  if (!id) throw new Error("Missing badge id.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("badge_definitions")
    .update({ is_active: nextActive, updated_at: new Date().toISOString(), updated_by: staff.id })
    .eq("id", id);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: nextActive ? "badge.reactivate" : "badge.deactivate",
    targetTable: "badge_definitions",
    targetId: id,
  });

  revalidatePath("/dashboard/badges");
}

/**
 * Award an existing badge to a real Supabase Auth end user, found by
 * email. Routine action — Tier 1+, same footing as a shadowban.
 * @param {FormData} formData
 */
export async function awardBadge(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const email = formData.get("email")?.toString().trim();
  const badgeId = formData.get("badgeId")?.toString();
  if (!email) throw new Error("Email is required.");
  if (!badgeId) throw new Error("Choose a badge to award.");

  const admin = createAdminClient();

  const { data: badge, error: badgeError } = await admin
    .from("badge_definitions")
    .select("id, name, max_slots, is_active")
    .eq("id", badgeId)
    .single();
  if (badgeError || !badge) throw new Error("That badge doesn't exist.");
  if (!badge.is_active) throw new Error("That badge is deactivated and can't be awarded.");

  const authUser = await findAuthUserByEmail(email);
  if (!authUser) {
    throw new Error(
      `No Supabase Auth account found for ${email}. Badges are granted against real auth accounts, not user_profiles — the user needs to have signed in via Supabase Auth at least once.`
    );
  }

  const isPioneer = badgeId.startsWith("PIONEER_") || badgeId === "FOUNDING_SEEKER";

  // Strict "One Pioneer Per Account" check
  if (isPioneer) {
    const { data: existingUserBadges } = await admin
      .from("user_badges")
      .select("badge_id")
      .eq("user_id", authUser.id);
    const hasPioneer = (existingUserBadges || []).some(
      (b) => b.badge_id.startsWith("PIONEER_") || b.badge_id === "FOUNDING_SEEKER"
    );
    if (hasPioneer) {
      throw new Error(`${email} already holds a Pioneer Charter. Limit is strictly one Pioneer seat per account.`);
    }
  }

  let assignedSeat = null;
  if (badge.max_slots != null) {
    const { count, error: countError } = await admin
      .from("user_badges")
      .select("id", { count: "exact", head: true })
      .eq("badge_id", badgeId);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) >= badge.max_slots) {
      throw new Error(`"${badge.name}" is sold out (${count}/${badge.max_slots} claimed).`);
    }
    assignedSeat = (count ?? 0) + 1;
  }

  const { error: insertError } = await admin.from("user_badges").insert({
    user_id: authUser.id,
    badge_id: badgeId,
    granted_by: `staff:${staff.email}`,
    seat_number: assignedSeat,
    is_transferable: isPioneer,
    transfer_locked_until: isPioneer ? new Date(Date.now() + 180 * 86400 * 1000).toISOString() : null,
  });
  if (insertError) {
    if (insertError.code === "23505") throw new Error(`${email} already has this badge.`);
    throw new Error(insertError.message);
  }

  await logAction({
    staff,
    action: "badge.award",
    targetTable: "user_badges",
    targetId: authUser.id,
    metadata: { badgeId, email },
  });

  // GAP-74: Notify recipient in-app when a badge is awarded
  try {
    await admin.from("user_notifications").insert({
      user_id: authUser.id,
      title: `Badge awarded: ${badge.name}`,
      desc: `You have been awarded the "${badge.name}" badge on ScoutIt.`,
      icon: "🏅",
      notification_type: "badge_awarded",
    });
  } catch (notifyErr) {
    console.warn("[badges/awardBadge] Could not insert user_notifications:", notifyErr?.message);
  }

  revalidatePath("/dashboard/badges");
}

/**
 * Revoke a badge from a user. Requires Tier 2+ — undoing something a
 * user was granted is closer to the archive/ban tier of action.
 * @param {FormData} formData
 */
export async function revokeBadge(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const userId = formData.get("userId")?.toString();
  const badgeId = formData.get("badgeId")?.toString();
  if (!userId || !badgeId) throw new Error("Missing userId or badgeId.");

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_badges")
    .delete()
    .eq("user_id", userId)
    .eq("badge_id", badgeId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "badge.revoke",
    targetTable: "user_badges",
    targetId: userId,
    metadata: { badgeId },
  });

  // GAP-74: Notify user when a badge is revoked
  try {
    await admin.from("user_notifications").insert({
      user_id: userId,
      title: "Badge revoked",
      desc: `Your "${badgeId}" badge has been revoked by Trust & Safety.`,
      icon: "🛡️",
      notification_type: "badge_revoked",
    });
  } catch (notifyErr) {
    console.warn("[badges/revokeBadge] Could not insert user_notifications:", notifyErr?.message);
  }

  revalidatePath("/dashboard/badges");
}
