// Phase 3 orchestration: move events between ScoutIt and Google, using the
// unit-tested loop guard (syncEngine) so an edit propagates exactly once and
// echoes are dropped. Uses the pure mappers (eventNormalize) + REST client.
//
// Outbound (ScoutIt -> Google) fires from the event CRUD routes. Inbound
// (Google -> ScoutIt) runs on demand via /api/calendar/sync. Both are wrapped
// so a sync failure never breaks the user's calendar action.
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getValidGoogleAccessToken, markConnectionStatus } from "./connectionStore";
import { listEvents, insertEvent, patchEvent, deleteEvent } from "./googleClient";
import { computeContentHash, googleToCanonical, canonicalToGoogle } from "./eventNormalize";
import { decideOutbound, decideInbound, OUTBOUND, INBOUND } from "./syncEngine";

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

    let token;
    try {
      token = await getValidGoogleAccessToken(userId);
    } catch {
      return { skipped: "token_error" };
    }
    if (!token) return { skipped: "not_connected" };

    const { data: row } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("id", eventId)
      .eq("owner_user_id", userId)
      .maybeSingle();
    if (!row) return { skipped: "no_row" };

    // Delete: mirror the tombstone to Google, if it was ever pushed.
    if (op === "delete") {
      if (row.google_event_id) await deleteEvent(token, row.google_event_id);
      return { ok: true, op: "delete" };
    }

    const canonical = rowToCanonical(row);
    const decision = decideOutbound({ local: canonical, lastSyncedHash: row.last_synced_hash });
    if (decision.action === OUTBOUND.SKIP) return { skipped: "unchanged" };

    const body = canonicalToGoogle(canonical);
    const g = row.google_event_id
      ? await patchEvent(token, row.google_event_id, body)
      : await insertEvent(token, body);

    await supabaseAdmin
      .from("calendar_events")
      .update({
        google_event_id: g?.id || row.google_event_id,
        last_synced_hash: decision.hash,
        content_hash: decision.hash,
      })
      .eq("id", eventId);

    return { ok: true, op: row.google_event_id ? "update" : "create", googleId: g?.id };
  } catch (err) {
    if (err.status === 401) await markConnectionStatus(userId, "google", "error");
    console.error("[calendar syncOutbound]", op, err.message);
    return { error: err.message };
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

  const data = await listEvents(token, { timeMin: from, timeMax: to });
  const items = Array.isArray(data?.items) ? data.items : [];
  const counts = { created: 0, updated: 0, deleted: 0, skipped: 0, conflicts: 0 };

  for (const g of items) {
    if (!g.id) continue;
    const { data: local } = await supabaseAdmin
      .from("calendar_events")
      .select("*")
      .eq("owner_user_id", userId)
      .eq("google_event_id", g.id)
      .maybeSingle();

    // Remote deletion -> tombstone locally.
    if (g.status === "cancelled") {
      if (local && !local.is_deleted) {
        await supabaseAdmin
          .from("calendar_events")
          .update({ is_deleted: true, status: "cancelled" })
          .eq("id", local.id);
        counts.deleted++;
      }
      continue;
    }

    const canonical = googleToCanonical(g);
    if (!canonical.startsAt || !canonical.endsAt) continue; // skip malformed
    const remoteHash = computeContentHash(canonical);

    if (!local) {
      await supabaseAdmin.from("calendar_events").insert({
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

    await supabaseAdmin
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
    counts.updated++;
  }

  return counts;
}
