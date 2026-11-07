/**
 * Deterministic Monotonic Queue Position Calculation
 * Solves concurrency races by imposing a total ordering on (created_at ASC, id ASC).
 */
export async function calculateQueuePosition(client, propertyId) {
  if (!client || !propertyId) return 1;

  try {
    const { data: items, error } = await client
      .from("properties")
      .select("id")
      .eq("pipeline_status", "ai_drafting")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error || !Array.isArray(items)) return 1;

    const index = items.findIndex((item) => String(item.id) === String(propertyId));
    return index >= 0 ? index + 1 : 1;
  } catch (err) {
    console.error("[queuePosition] calculation error:", err);
    return 1;
  }
}
