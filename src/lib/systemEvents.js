import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildSystemEvent, SOURCES } from "@/lib/systemEventPolicy.mjs";

/**
 * A-063 — record something the system did on its own, from the main site.
 *
 * The twin of Mission Control's `src/lib/systemEvents.js`, writing to the same
 * `system_events` table with the same vocabulary. The two apps are separate
 * deployments and cannot share a module, so the shared half lives in
 * `systemEventPolicy.mjs`, which is byte-identical in both trees and guarded by
 * a test.
 *
 * NEVER throws. Crons, cache purges and CMS rebuilds call this; the log being
 * unavailable must not take down the work it was describing.
 *
 * @returns {Promise<boolean>} whether the event was stored.
 */
export async function recordSystemEvent(input) {
  try {
    if (!supabaseAdmin) {
      console.error("[system_events] no service-role client; event dropped");
      return false;
    }
    const row = buildSystemEvent({ source: SOURCES.MAIN_SITE, ...input });
    const { error } = await supabaseAdmin.from("system_events").insert(row);
    if (error) {
      console.error("[system_events] could not record %s: %s", row.event, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[system_events] could not record an event: %s", err.message);
    return false;
  }
}
