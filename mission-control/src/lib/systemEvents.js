import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildSystemEvent, SOURCES } from "./systemEventPolicy.mjs";

/**
 * A-063 — record something the system did on its own, from Mission Control.
 *
 * NEVER throws and never returns a rejected promise. An event is a by-product
 * of real work that has usually already happened; a recorder that could fail
 * the caller would mean the log's own unavailability breaks a publish, a purge
 * or a cron. The failure is written to stderr instead, where the platform's own
 * logs still catch it.
 *
 * @returns {Promise<boolean>} whether the event was stored.
 */
export async function recordSystemEvent(input) {
  try {
    const row = buildSystemEvent({ source: SOURCES.MISSION_CONTROL, ...input });
    const { error } = await createAdminClient().from("system_events").insert(row);
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
