// Shared notification-write helpers (Track 1,
// PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md). All writes go through
// user_notifications so the dashboard bell dropdown, the stale-listing cron,
// and broker-on-change alerts stay one source of truth. Callers pass a
// Supabase service-role client (RLS on this table mirrors the existing
// dev_all_* convention — see the migration comment).

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
  return error ? null : true;
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
