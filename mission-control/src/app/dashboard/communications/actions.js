"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS, TIER_LABELS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendStaffEmail } from "@/lib/emailSender";
import {
  validateOutboundMessage,
  renderStaffEmailHtml,
} from "@/lib/staffCommunications.mjs";
import { notifyUser } from "@/lib/notifications";

export async function sendStaffReplyAction({
  recipientEmail,
  recipientUserId = null,
  recipientName = null,
  subject,
  message,
  templateKey = "general_staff_notice",
  targetTable = "contact_messages",
  targetId,
}) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const validation = validateOutboundMessage({ recipientEmail, subject, message });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const staffRoleLabel = `${TIER_LABELS[staff.tier] || "Staff"} · ScoutIt Operations`;
  const referenceId = targetId ? `REF-${String(targetId).slice(0, 12)}` : null;

  const html = renderStaffEmailHtml({
    recipientName: recipientName || recipientEmail.split("@")[0],
    subject,
    message,
    staffDisplayName: staff.display_name || staff.email,
    staffRole: staffRoleLabel,
    referenceId,
  });

  // Attempt transactional delivery
  const emailResult = await sendStaffEmail({
    to: recipientEmail.trim(),
    subject: subject.trim(),
    html,
  });

  const admin = createAdminClient();

  // Also dispatch in-app notification if userId is known
  if (recipientUserId) {
    try {
      await notifyUser(admin, {
        userId: recipientUserId,
        title: subject,
        desc: message.slice(0, 140),
        notificationType: "staff_communication",
      });
    } catch (_notifErr) {
      // Non-blocking
    }
  }

  // Immutable audit log
  await logActionStrict({
    staff,
    action: "STAFF_OUTBOUND_EMAIL",
    targetTable: targetTable || "contact_messages",
    targetId: targetId ? String(targetId) : staff.id,
    reason: `Sent outbound staff email: ${subject.slice(0, 80)}`,
    metadata: {
      recipient_email: recipientEmail,
      recipient_user_id: recipientUserId,
      template_key: templateKey,
      delivery_status: emailResult.sent ? "delivered" : emailResult.skipped || emailResult.error,
      email_id: emailResult.id || null,
      message_preview: message.slice(0, 200),
    },
  });

  return {
    success: true,
    delivered: Boolean(emailResult.sent),
    providerStatus: emailResult.skipped || emailResult.error || "sent",
  };
}
