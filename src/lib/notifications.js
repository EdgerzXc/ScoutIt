// Shared notification-write helpers (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md). All writes go through
// user_notifications so the dashboard bell dropdown, the stale-listing cron,
// and broker-on-change alerts stay one source of truth. Callers pass a
// Supabase service-role client (RLS on this table mirrors the existing
// dev_all_* convention — see the migration comment).

import { isEmailConfigured, sendEmail, renderEmail } from "./email";

// How long a user must have been away before email is worth sending.
// §38.6 says "24h+ inactive". Emailing someone who is looking at the app is
// noise that trains them to filter ScoutIt into spam — which then loses the
// messages that actually matter.
const EMAIL_AFTER_INACTIVE_HOURS = 24;

// Notification types important enough to chase by email. Everything else stays
// in-app only.
//
// The test is not "is this interesting" but "does silence cost the user
// something they cannot recover?" A new inquiry can expire unanswered
// (§40.15); an archived request is 23 days from deletion. A viewing reminder
// is merely nice to have, so it is absent here.
const EMAIL_WORTHY = new Set([
  "new_inquiry",
  "operator_request",
  "request_archived",
  "request_deleted",
]);

export async function notifyUser(serviceClient, { userId, title, desc, icon = "🔔", propertyId = null, notificationType }) {
  if (!userId) return null;
  const { error } = await serviceClient.from("user_notifications").insert([{
    user_id: userId,
    title,
    desc,
    icon,
    property_id: propertyId,
    notification_type: notificationType,
  }]);
  if (error) console.error("[notifications] Failed to insert:", error);

  // Email is a FALLBACK, not a second channel. It fires only after the in-app
  // notification is safely written, and its failure is never propagated — the
  // notification is the system of record and the caller's action must not
  // depend on a mail server.
  if (!error) {
    maybeEmailFallback(serviceClient, { userId, title, desc, notificationType })
      .catch((e) => console.error("[notifications] Email fallback failed:", e?.message));
  }

  return error ? null : true;
}

/**
 * Sends the email fallback if — and only if — the user has been away long
 * enough for the in-app notification to have gone unseen.
 *
 * Every gate here exits quietly. Never throws.
 */
async function maybeEmailFallback(serviceClient, { userId, title, desc, notificationType }) {
  if (!isEmailConfigured()) return;            // no provider yet — the current state
  if (!EMAIL_WORTHY.has(notificationType)) return;

  // `email` is not a column on user_profiles (§19.1) — the address lives in
  // auth.users, reachable only with the service role. Fetching it here rather
  // than storing a copy avoids a second address that can drift out of date.
  const { data: authUser, error: authErr } = await serviceClient.auth.admin.getUserById(userId);
  if (authErr || !authUser?.user?.email) return;

  const lastSeen = authUser.user.last_sign_in_at;
  if (lastSeen) {
    const hoursAway = (Date.now() - new Date(lastSeen).getTime()) / 3_600_000;
    if (hoursAway < EMAIL_AFTER_INACTIVE_HOURS) return; // they're around; in-app is enough
  }

  await sendEmail({
    to: authUser.user.email,
    subject: title,
    html: renderEmail({
      heading: title,
      body: `<p style="margin:0">${escapeText(desc)}</p>`,
      ctaLabel: "Open your inbox",
      ctaPath: "/dashboard/inbox",
      footnote: "We only email when you haven't opened ScoutIt in a while.",
    }),
  });
}

function escapeText(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Notifies every broker with an accepted (confirmed) property-level handshake
// on this property — i.e. currently "attached", not just pitching or invited.
// Excludes excludeUserId so the person who made the change doesn't get
// notified about their own edit if they happen to also be a broker on it.
export async function notifyAttachedBrokers(serviceClient, { propertyId, title, desc, icon = "📋", notificationType, excludeUserId = null }) {
  const { data: deals, error } = await serviceClient
    .from("deals")
    .select("broker_id")
    .eq("property_id", propertyId)
    .eq("status", "accepted")
    .is("unit_id", null) // property-level handshakes only, not unit delegations
    .not("broker_id", "is", null);

  if (error) {
    console.error("[notifications] Failed to load attached brokers:", error);
    return;
  }

  const brokerIds = [...new Set((deals || []).map((d) => d.broker_id))]
    .filter((id) => id && id !== excludeUserId);

  for (const brokerId of brokerIds) {
    await notifyUser(serviceClient, { userId: brokerId, title, desc, icon, propertyId, notificationType });
  }
}
