"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, TIERS, logActionStrict } from "@/lib/rbac";

const ALLOWED_STATUSES = new Set(["new", "in_progress", "resolved", "spam"]);

/**
 * Move a contact message through triage.
 *
 * The status set is closed and checked here as well as by the table's CHECK
 * constraint. Two gates, because this is a server action reachable by any
 * signed-in staff session and the argument arrives from a form.
 */
export async function setContactStatus(formData) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return { ok: false, error: "Insufficient tier" };
  }
  try {
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch {
    return { ok: false, error: "Insufficient tier" };
  }

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");

  if (!id || !ALLOWED_STATUSES.has(status)) {
    return { ok: false, error: "Invalid triage request" };
  }

  const admin = createAdminClient();

  // handled_at/handled_by record who closed it. Left null while a message is
  // still open so "nobody has picked this up" stays distinguishable from
  // "someone picked it up and did nothing" — a null is not an assertion.
  const patch =
    status === "new"
      ? { status, handled_at: null, handled_by: null }
      : { status, handled_at: new Date().toISOString(), handled_by: staff.id };

  const { error } = await admin.from("contact_messages").update(patch).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await logActionStrict({
    staff,
    action: `contact_${status}`,
    targetTable: "contact_messages",
    targetId: id,
    reason: `Triaged to ${status}`,
  });

  revalidatePath("/dashboard/contact");
  return { ok: true };
}
