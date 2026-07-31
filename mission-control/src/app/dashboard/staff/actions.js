"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

/**
 * Invites a new staff member via Supabase Auth's admin API (sends them a
 * real invite email) and creates their admin_users row at the chosen tier.
 * @param {FormData} formData
 */
export async function inviteStaff(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const tier = Number(formData.get("tier"));
  if (!email) throw new Error("Email is required.");
  if (![TIERS.AGENT, TIERS.OPS_MANAGER, TIERS.SUPER_ADMIN].includes(tier)) {
    throw new Error("Invalid tier.");
  }

  const admin = createAdminClient();

  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    : undefined;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });
  if (inviteError) throw new Error(inviteError.message);

  const { error: insertError } = await admin.from("admin_users").insert({
    id: invited.user.id,
    email,
    tier,
    invited_by: staff.id,
  });
  if (insertError) throw new Error(insertError.message);

  await logAction({
    staff,
    action: "staff.invite",
    targetTable: "admin_users",
    targetId: invited.user.id,
    metadata: { email, tier },
  });

  revalidatePath("/dashboard/staff");
}

/**
 * Grant staff access to an EXISTING auth user by email (A2). Unlike
 * inviteStaff (which emails an invite to a brand-new address and fails if the
 * account exists), this looks up the already-registered auth user — e.g.
 * someone who signed in with Google — and upserts their admin_users row.
 * @param {FormData} formData
 */
export async function grantStaffByEmail(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const email = formData.get("email")?.toString().trim().toLowerCase();
  const tier = Number(formData.get("tier"));
  const displayName = formData.get("displayName")?.toString().trim() || null;
  if (!email) throw new Error("Email is required.");
  if (![TIERS.AGENT, TIERS.OPS_MANAGER, TIERS.SUPER_ADMIN].includes(tier)) {
    throw new Error("Invalid tier.");
  }

  const admin = createAdminClient();

  // Find the auth user by email (paged scan via the admin API — user counts
  // are small; revisit if auth.users ever grows past a few thousand).
  let authUser = null;
  for (let page = 1; page <= 10 && !authUser; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    authUser = (data?.users || []).find((u) => u.email?.toLowerCase() === email) || null;
    if ((data?.users || []).length < 200) break;
  }
  if (!authUser) {
    throw new Error(
      `No existing account found for ${email}. Ask them to sign in once (Google or magic link), or use "Invite" instead.`
    );
  }

  const { error: upsertError } = await admin.from("admin_users").upsert(
    {
      id: authUser.id,
      email,
      display_name: displayName,
      tier,
      active: true,
      invited_by: staff.id,
    },
    { onConflict: "id" }
  );
  if (upsertError) throw new Error(upsertError.message);

  await logAction({
    staff,
    action: "staff.grant_by_email",
    targetTable: "admin_users",
    targetId: authUser.id,
    metadata: { email, tier },
  });

  revalidatePath("/dashboard/staff");
}

/** @param {FormData} formData */
export async function changeStaffTier(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const staffId = formData.get("staffId")?.toString();
  const tier = Number(formData.get("tier"));
  if (!staffId) throw new Error("Missing staffId.");
  if (![TIERS.AGENT, TIERS.OPS_MANAGER, TIERS.SUPER_ADMIN].includes(tier)) {
    throw new Error("Invalid tier.");
  }
  if (staffId === staff.id) {
    throw new Error("You can't change your own tier — ask another Super Admin.");
  }

  const admin = createAdminClient();
  // NB: admin_users has no updated_at column — change history lives in the
  // mission_control_actions audit log instead.
  const { error } = await admin.from("admin_users").update({ tier }).eq("id", staffId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "staff.tier_change",
    targetTable: "admin_users",
    targetId: staffId,
    metadata: { tier },
  });

  revalidatePath("/dashboard/staff");
}

/** @param {FormData} formData */
export async function setStaffActive(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const staffId = formData.get("staffId")?.toString();
  const nextActive = formData.get("nextActive") === "true";
  if (!staffId) throw new Error("Missing staffId.");
  if (staffId === staff.id) {
    throw new Error("You can't deactivate your own account — ask another Super Admin.");
  }

  const admin = createAdminClient();
  const { error } = await admin.from("admin_users").update({ active: nextActive }).eq("id", staffId);
  if (error) throw new Error(error.message);

  await logAction({
    staff,
    action: "staff.deactivate",
    targetTable: "admin_users",
    targetId: staffId,
    metadata: { active: nextActive },
  });

  revalidatePath("/dashboard/staff");
}
