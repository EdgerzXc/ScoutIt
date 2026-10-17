"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";

export async function sendNotification(formData) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  const userId = formData.get("userId");
  const title = formData.get("title");
  const message = formData.get("message");
  const targetUrl = formData.get("targetUrl")?.toString().trim() || null;

  if (!userId || !title || !message) {
    throw new Error("Missing required fields");
  }

  const admin = createAdminClient();

  // Validate that user exists in auth.users by trying to find them?
  // We can just try to insert, and it'll fail FK constraint if they don't exist.
  const { data: notification, error } = await admin
    .from("private_notifications")
    .insert({
      user_id: userId,
      title,
      message,
      target_url: targetUrl,
      created_by: staff.id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to insert notification:", error);
    throw new Error(`Could not send notification: ${error.message}`);
  }

  // GAP-73: Mirror into canonical `user_notifications` table so the main app's
  // notification bell (`GET /api/notifications`) surfaces staff notices.
  try {
    await admin.from("user_notifications").insert({
      user_id: userId,
      title,
      desc: message,
      icon: "📣",
      notification_type: "staff_notice",
    });
  } catch (mirrorErr) {
    console.warn("Could not mirror staff notification to user_notifications:", mirrorErr?.message);
  }

  await logAction({
    staff,
    action: "SEND_PRIVATE_NOTIFICATION",
    targetTable: "private_notifications",
    targetId: notification.id,
    reason: `Sent "${title}" to user ${userId}`,
  });

  revalidatePath("/dashboard/notifications");
}
