import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function trackAnalyticsEvent({
  eventType,
  propertyId,
  viewerKey,
  userId = null,
  brokerId = null,
  chapterId = null,
  dwellSeconds = 0,
  metadata = {}
}) {
  if (!supabaseAdmin || !eventType || !viewerKey) return false;

  try {
    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: eventType,
        property_id: propertyId || null,
        viewer_key: viewerKey,
        user_id: userId,
        broker_id: brokerId,
        chapter_id: chapterId,
        dwell_seconds: dwellSeconds,
        metadata
      });

    if (error) {
      console.error("[analytics] Event tracking failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[analytics] Event tracking exception:", err);
    return false;
  }
}

export function formatPeriodMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function deduplicateUniqueEyes(events = []) {
  const set = new Set();
  events.forEach((ev) => {
    if (ev.viewer_key && ev.event_type === 'property_view') {
      set.add(ev.viewer_key);
    }
  });
  return set.size;
}

/**
 * Returns previous calendar month formatted as 'YYYY-MM'.
 * Anchors to the 1st of current UTC month before subtracting to prevent day overflow.
 */
export function getPreviousPeriodMonth(now = new Date()) {
  const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  firstOfThisMonth.setUTCMonth(firstOfThisMonth.getUTCMonth() - 1);
  return firstOfThisMonth.toISOString().slice(0, 7);
}

