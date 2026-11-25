// Phase 3 orchestration: move events between ScoutIt and Google, using the
// unit-tested loop guard (syncEngine) so an edit propagates exactly once and
// echoes are dropped. Uses the pure mappers (eventNormalize) + REST client.
//
// Outbound (ScoutIt -> Google) fires from the event CRUD routes. Inbound
// (Google -> ScoutIt) runs on demand via /api/calendar/sync. Both are wrapped
// so a sync failure never breaks the user's calendar action.
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidGoogleAccessToken, markConnectionStatus } from "./connectionStore";
import { listEvents, insertEvent, patchEvent, deleteEvent } from "./googleClient";
import { computeContentHash, googleToCanonical, canonicalToGoogle } from "./eventNormalize";
import { decideOutbound, decideInbound, OUTBOUND, INBOUND } from "./syncEngine";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

/** DB row (snake_case) -> canonical event shape used by mappers/hash. */
function rowToCanonical(row) {
  return {
    title: row.title,
    description: row.description || "",
    location: row.location || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    status: row.status,
  };
}

function scoutItGoogleEventId(userId, eventId) {
  return createHash("sha256").update(`scoutit-calendar:${userId}:${eventId}`).digest("hex");
}

/**
 * Push a single local event to Google after a create/update/delete. Best-effort:
 * returns a small status object and never throws to the caller.
 * @param {string} userId
 * @param {string} eventId
 * @param {"create"|"update"|"delete"} op
 */
export async function syncOutbound(userId, eventId, op) {
  try {
    if (!supabaseAdmin) return { skipped: "no_db" };

    const token = await getValidGoogleAccessToken(userId);
    if (!token) return { skipped: "not_connected" };

    const { data: row, error: readError } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("id", eventId)
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (readError) throw readError;
    if (!row) return { skipped: "no_row" };

    // Delete: mirror the tombstone to Google, if it was ever pushed.
    if (op === "delete") {
      const id = row.google_event_id || (row.source === "scoutit" ? scoutItGoogleEventId(userId, eventId) : null);
      if (id) await deleteEvent(token, id);
      return { ok: true, op: "delete" };
    }

    const canonical = rowToCanonical(row);
    const decision = decideOutbound({ local: canonical, lastSyncedHash: row.last_synced_hash });
    if (decision.action === OUTBOUND.SKIP) return { skipped: "unchanged" };

    const body = canonicalToGoogle(canonical);
    let g;
    if (row.google_event_id) {
      g = await patchEvent(token, row.google_event_id, body);
    } else {
      const id = scoutItGoogleEventId(userId, eventId);
      try {
        g = await insertEvent(token, { ...body, id });
      } catch (error) {
        if (error?.status !== 409) throw error;
        g = await patchEvent(token, id, body);
      }
    }
    const googleEventId = g?.id || row.google_event_id;
    if (!googleEventId) throw new Error("Google did not return a calendar event ID");

    const { data: saved, error: saveError } = await supabaseAdmin
      .from("calendar_events")
      .update({
        google_event_id: googleEventId,
        last_synced_hash: decision.hash,
        content_hash: decision.hash,
      })
      .eq("id", eventId)
      .eq("owner_user_id", userId)
      .select("id")
      .maybeSingle();
    if (saveError) throw saveError;
    if (!saved) throw new Error("Calendar event binding was not saved");

    return { ok: true, op: row.google_event_id ? "update" : "create", googleId: googleEventId };
  } catch (err) {
    if (err?.status === 401) {
      await markConnectionStatus(userId, "google", "error").catch(() => {});
    }
    const errorCode = err?.code || err?.status || "sync_failed";
    console.error("[calendar syncOutbound]", op, errorCode);
    await recordSystemEvent({
      event: EVENTS.CALENDAR_SYNC_FAILED,
      severity: "error",
      subjectTable: "calendar_events",
      subjectId: eventId,
      summary: "A ScoutIt calendar change could not be synced with Google.",
      detail: { operation: op, errorCode },
    });
    return { error: "Google Calendar sync failed." };
  }
}

/**
 * Pull Google events in a window into ScoutIt. On demand (Sync now / cron).
 * @returns counts of what changed.
 */
export async function pullInbound(userId, { from, to }) {
  if (!supabaseAdmin) return { skipped: "no_db" };
  let token;
  try {
    token = await getValidGoogleAccessToken(userId);
  } catch {
    return { skipped: "token_error" };
  }
  if (!token) return { skipped: "not_connected" };

  // Google Calendar paginates expanded recurring instances. Reading only the
  // first page silently omitted busy time for active calendars.
  const items = [];
  let pageToken = null;
  for (let page = 0; page < 20; page += 1) {
    const data = await listEvents(token, { timeMin: from, timeMax: to, pageToken });
    if (Array.isArray(data?.items)) items.push(...data.items);
    pageToken = data?.nextPageToken || null;
    if (!pageToken) break;
  }
  if (pageToken) {
    throw new Error("Google Calendar sync exceeded the 20-page safety limit");
  }
  const counts = { created: 0, updated: 0, deleted: 0, skipped: 0, conflicts: 0 };

  for (const g of items) {
    if (!g.id) continue;
    const { data: local, error: lookupError } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("google_event_id", g.id)
      .maybeSingle();
    if (lookupError && lookupError.code !== "PGRST116") {
      throw new Error(`Calendar event lookup failed: ${lookupError.message}`);
    }

    // Remote deletion -> tombstone locally.
    if (g.status === "cancelled") {
      if (local && !local.is_deleted) {
        const { error: deleteError } = await supabaseAdmin
          .from("calendar_events")
          .update({ is_deleted: true, status: "cancelled" })
          .eq("id", local.id);
        if (deleteError) {
          throw new Error(`Calendar deletion sync failed: ${deleteError.message}`);
        }
        counts.deleted++;
      }
      continue;
    }

    const canonical = googleToCanonical(g);
    if (!canonical.startsAt || !canonical.endsAt) continue; // skip malformed
    const remoteHash = computeContentHash(canonical);

    if (!local) {
      const { error: insertError } = await supabaseAdmin.from("calendar_events").insert({
        owner_user_id: userId,
        title: canonical.title,
        description: canonical.description || null,
        location: canonical.location || null,
        starts_at: canonical.startsAt,
        ends_at: canonical.endsAt,
        all_day: canonical.allDay,
        status: canonical.status,
        color: "blue",
        source: "google",
        google_event_id: g.id,
        content_hash: remoteHash,
        last_synced_hash: remoteHash,
      });
      if (insertError) {
        throw new Error(`Calendar event insert failed: ${insertError.message}`);
      }
      counts.created++;
      continue;
    }

    const decision = decideInbound({
      remote: canonical,
      local: rowToCanonical(local),
      lastSyncedHash: local.last_synced_hash,
    });

    if (decision.action === INBOUND.SKIP) {
      counts.skipped++;
      continue;
    }
    if (decision.action === INBOUND.CONFLICT) {
      // Last-write-wins by updated_at; if ours is newer, keep it (outbound will
      // re-push). Only overwrite when Google's copy is strictly newer.
      const remoteNewer = g.updated && new Date(g.updated) > new Date(local.updated_at);
      counts.conflicts++;
      if (!remoteNewer) continue;
    }

    const { error: updateError } = await supabaseAdmin
      .from("calendar_events")
      .update({
        title: canonical.title,
        description: canonical.description || null,
        location: canonical.location || null,
        starts_at: canonical.startsAt,
        ends_at: canonical.endsAt,
        all_day: canonical.allDay,
        status: canonical.status,
        is_deleted: false,
        content_hash: remoteHash,
        last_synced_hash: remoteHash,
      })
      .eq("id", local.id);
    if (updateError) {
      throw new Error(`Calendar event update failed: ${updateError.message}`);
    }
    counts.updated++;
  }

  return counts;
}
