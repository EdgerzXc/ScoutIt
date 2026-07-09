// Shared writers for the CRM timeline (crm_activity_log) and task engine
// (crm_tasks). Every inquiry, deal-status change, note write, and viewing
// event flows through logActivity so the per-deal / per-property Timeline is
// one source of truth instead of each table living in its own silo.
// Callers pass a Supabase service-role client (RLS on these tables only
// grants reads to deal parties / property owners; writes are server-side).

// Best-effort: timeline logging must never break the primary mutation it
// rides along with, so failures are logged and swallowed.
export async function logActivity(serviceClient, { dealId = null, propertyId = null, activityType, actorId = null, metadata = {} }) {
  if (!activityType || (!dealId && !propertyId)) return null;
  const { error } = await serviceClient.from("crm_activity_log").insert([{
    deal_id: dealId,
    property_id: propertyId,
    activity_type: activityType,
    actor_id: actorId,
    metadata,
  }]);
  if (error) console.error("[crmActivity] Failed to log activity:", error);
  return error ? null : true;
}

// Debounced note saves fire once per typing pause, which would flood the
// timeline with note_added rows. Only log when the same actor hasn't logged
// a note on this deal within the window.
export async function logNoteActivityDeduped(serviceClient, { dealId, propertyId = null, actorId, windowMinutes = 30 }) {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { data, error } = await serviceClient
    .from("crm_activity_log")
    .select("id")
    .eq("deal_id", dealId)
    .eq("activity_type", "note_added")
    .eq("actor_id", actorId)
    .gte("created_at", since)
    .limit(1);
  if (error) {
    console.error("[crmActivity] Note dedupe lookup failed:", error);
    return null;
  }
  if (data && data.length > 0) return null; // already on the timeline
  return logActivity(serviceClient, { dealId, propertyId, activityType: "note_added", actorId });
}

export async function createTask(serviceClient, { ownerUserId, title, dueAt = null, dealId = null }) {
  if (!ownerUserId || !title) return null;
  const { data, error } = await serviceClient.from("crm_tasks").insert([{
    owner_user_id: ownerUserId,
    title,
    due_at: dueAt,
    deal_id: dealId,
  }]).select().single();
  if (error) {
    console.error("[crmActivity] Failed to create task:", error);
    return null;
  }
  return data;
}
