/**
 * Deterministic Monotonic Queue Position Calculation
 * Solves concurrency races by imposing a total ordering on (created_at ASC, id ASC).
 * Supports Pioneer/VIP line-jump where items with details.queue_priority === true
 * are evaluated ahead of standard items while preserving internal FIFO ordering.
 */
export async function calculateQueuePosition(client, propertyId) {
  if (!client || !propertyId) return 1;

  try {
    const { data: items, error } = await client
      .from("properties")
      .select("id, details")
      .eq("pipeline_status", "ai_drafting")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error || !Array.isArray(items)) return 1;

    // Prioritize drafts marked with queue_priority: true (Pioneer Charter privilege)
    const priorityItems = items.filter((item) => item.details?.queue_priority === true);
    const standardItems = items.filter((item) => item.details?.queue_priority !== true);
    const ordered = [...priorityItems, ...standardItems];

    const index = ordered.findIndex((item) => String(item.id) === String(propertyId));
    return index >= 0 ? index + 1 : 1;
  } catch (err) {
    console.error("[queuePosition] calculation error:", err);
    return 1;
  }
}
