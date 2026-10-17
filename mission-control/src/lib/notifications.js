/**
 * Mission Control user notification dispatcher.
 * Inserts in-app notifications into public.user_notifications using the admin client.
 */
export async function notifyUser(adminClient, { userId, title, desc, icon = "🔔", propertyId = null, notificationType }) {
  if (!adminClient || !userId) return null;
  try {
    const { error } = await adminClient.from("user_notifications").insert([{
      user_id: userId,
      title,
      desc,
      icon,
      property_id: propertyId,
      notification_type: notificationType,
    }]);
    if (error) {
      console.error("[MMC notifications] Failed to insert notification:", error);
      return null;
    }
    return true;
  } catch (err) {
    console.error("[MMC notifications] Unexpected notification error:", err);
    return null;
  }
}
