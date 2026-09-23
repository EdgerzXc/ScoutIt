// ─────────────────────────────────────────────────────────────────────────
// CONNECT IDEMPOTENCY + RECEIVER GATES (A-144)
//
// Two guards that sit BEFORE the Connect spend:
//
// 1. Double-tap guard. A retried submit (double-click, replayed request)
//    must not spend twice. If this sender already has a `pending` deal for
//    the same property within IDEMPOTENCY_WINDOW_MINUTES, the caller reuses
//    that deal instead of creating + spending again.
//
// 2. Receiver gates (Connect Rules v1 §8). Control belongs to the receiver:
//    - Pause new Connects (opt-out flag, migration-gated column
//      `user_profiles.accepting_connects`, default true).
//    - Optional pending cap (`user_profiles.max_pending_connects`, NULL =
//      no cap).
//    Both columns are migration-gated (O-004). Until they exist every read
//    falls back to allow, so a missing column never breaks sends.
// ─────────────────────────────────────────────────────────────────────────

export const IDEMPOTENCY_WINDOW_MINUTES = 10;

let receiverGateWarned = false;
function warnOnce(msg, detail) {
  if (!receiverGateWarned) {
    console.warn(msg, detail || "");
    receiverGateWarned = true;
  }
}

/**
 * Find a recent pending deal from this sender for this property.
 * Returns the deal id or null. Never throws.
 *
 * A-144 §10.10: pitch rows carry the sender in `broker_id`, not `buyer_id`,
 * so both columns are searched — otherwise a broker double-tap never matches
 * and spends twice. Ordered oldest-first so a lookup run AFTER the current
 * send's own row was created still returns the earlier row instead of
 * self-matching (a newest-first search returns the just-created row and the
 * `!== dealId` guard then lets the duplicate through).
 */
export async function findRecentPendingDeal(supabaseAdmin, senderId, propertyId) {
  if (!supabaseAdmin || !senderId || !propertyId) return null;
  try {
    const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("deals")
      .select("id, created_at")
      .or(`buyer_id.eq.${senderId},broker_id.eq.${senderId}`)
      .eq("property_id", propertyId)
      .eq("status", "pending")
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0].id;
  } catch {
    return null;
  }
}

/**
 * Check receiver gates for one recipient.
 * Returns { ok: true } or { ok: false, reason, message }.
 * Missing columns/tables => { ok: true } (fail open with warn).
 */
export async function checkReceiverGate(supabaseAdmin, recipientId, propertyId = null, currentDealId = null) {
  if (!supabaseAdmin || !recipientId) return { ok: true };
  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, accepting_connects, max_pending_connects")
      .eq("id", recipientId)
      .maybeSingle();
    if (error) {
      // 42703 = undefined_column — migration not applied yet.
      warnOnce("[CONNECT GATES] receiver check skipped (profile columns unavailable):", error.code || error.message);
      return { ok: true };
    }
    if (data && data.accepting_connects === false) {
      return { ok: false, reason: "paused", message: "This account has paused new Connects for now." };
    }
    // A-144 §10.10: NULL/undefined/empty means unlimited — never coerce it to
    // 0 via Number(NULL). Only a real non-negative number is a cap.
    const rawCap = data?.max_pending_connects;
    const cap = rawCap === null || rawCap === undefined || rawCap === "" ? null : Number(rawCap);
    if (cap !== null && Number.isFinite(cap) && cap >= 0) {
      // Receiver-scoped: count only waiting requests addressed to THIS
      // recipient — inbound broker rows plus deals on their properties —
      // never the global pending total and never the recipient's own sends.
      const { data: pendingRows, error: pendingError } = await supabaseAdmin
        .from("deals")
        .select("id, broker_id, buyer_id, properties(owner_id)")
        .in("status", ["pending", "invited"]);
      if (!pendingError && Array.isArray(pendingRows)) {
        let inbound = 0;
        for (const row of pendingRows) {
          // Initiate and pitch create the candidate row before checking gates.
          // A cap limits existing requests, not the candidate being evaluated.
          if (currentDealId && row?.id === currentDealId) continue;
          if (row?.buyer_id === recipientId) continue;
          if (row?.broker_id === recipientId || row?.properties?.owner_id === recipientId) inbound += 1;
        }
        if (inbound >= cap) {
          return { ok: false, reason: "capped", message: "This account is at its pending-request limit right now." };
        }
      }
    }
    return { ok: true };
  } catch (err) {
    warnOnce("[CONNECT GATES] receiver check skipped (exception):", err?.message);
    return { ok: true };
  }
}


