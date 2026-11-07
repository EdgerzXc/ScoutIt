// ─────────────────────────────────────────────────────────────────────────
// CONNECT BLOCKS (A-144 — Connect Rules v1 §15, invariant #6)
//
// Block enforcement: before charging/sending, check whether the receiver has
// blocked the sender. A blocked send must fail WITHOUT consuming a Connect.
//
// Table `connect_blocks(blocker_id, blocked_id, created_at)` is migration-
// gated under O-004 (see supabase/migrations/*_connect_blocks_* — prepared,
// not applied). Until it exists this module fails OPEN with a warning so a
// missing table never breaks all sends — the spend routes log the skip.
// Once the table exists the check enforces automatically, no caller changes.
// ─────────────────────────────────────────────────────────────────────────

let missingTableWarned = false;

export function _resetBlockWarningForTesting() {
  missingTableWarned = false;
}

function shouldFailClosed(options = {}) {
  return options.failClosed === true || process.env.CONNECT_BLOCKS_FAIL_CLOSED === "true";
}

/**
 * Check whether any recipient in `recipientIds` has blocked `senderId`.
 * Returns { ok: boolean, blocked: boolean, unavailable: boolean, reason?: string }
 *
 * Pre-migration default: fail open with a single operator-visible warning.
 * Post-O-004 / fail-closed posture (CONNECT_BLOCKS_FAIL_CLOSED="true" or options.failClosed=true):
 * fails closed on missing table or guard errors.
 */
export async function checkBlockGuard(supabaseAdmin, senderId, recipientIds = [], options = {}) {
  const failClosed = shouldFailClosed(options);
  const rawIds = Array.isArray(recipientIds) ? recipientIds : [recipientIds];
  const ids = [...new Set(rawIds.filter(Boolean))].filter((id) => id !== senderId);

  if (!supabaseAdmin || !senderId || ids.length === 0) {
    return { ok: true, blocked: false, unavailable: false };
  }

  try {
    const baseQuery = supabaseAdmin
      .from("connect_blocks")
      .select("blocker_id");

    let query;
    if (ids.length === 1 && typeof baseQuery.eq === "function") {
      query = baseQuery.eq("blocker_id", ids[0]);
    } else if (typeof baseQuery.in === "function") {
      query = baseQuery.in("blocker_id", ids);
    } else {
      for (const rid of ids) {
        const single = await checkBlockGuard(supabaseAdmin, senderId, [rid], options);
        if (single.blocked) return single;
        if (single.unavailable && failClosed) return single;
      }
      return { ok: true, blocked: false, unavailable: false };
    }

    const { data, error } = await query
      .eq("blocked_id", senderId)
      .limit(1);

    if (error) {
      // 42P01 = undefined_table — migration not applied yet.
      if (!missingTableWarned) {
        console.warn("[CONNECT BLOCKS] check skipped (table unavailable):", error.code || error.message);
        missingTableWarned = true;
      }
      if (failClosed) {
        return { ok: false, blocked: true, unavailable: true, reason: "guard_unavailable" };
      }
      return { ok: true, blocked: false, unavailable: true };
    }

    const blocked = Array.isArray(data) && data.length > 0;
    return { ok: true, blocked, unavailable: false };
  } catch (err) {
    if (!missingTableWarned) {
      console.warn("[CONNECT BLOCKS] check skipped (exception):", err?.message);
      missingTableWarned = true;
    }
    if (failClosed) {
      return { ok: false, blocked: true, unavailable: true, reason: "guard_unavailable" };
    }
    return { ok: true, blocked: false, unavailable: true };
  }
}

/**
 * True when `receiverId` has blocked `senderId`.
 * By default fails open before O-004 with a single operator warning.
 * When failClosed is enabled, fails closed on table unavailability.
 */
export async function isBlocked(supabaseAdmin, senderId, receiverId, options = {}) {
  if (!supabaseAdmin || !senderId || !receiverId || senderId === receiverId) return false;
  const res = await checkBlockGuard(supabaseAdmin, senderId, [receiverId], options);
  return res.blocked;
}

/**
 * True when ANY of `receiverIds` has blocked `senderId`.
 */
export async function anyBlocked(supabaseAdmin, senderId, receiverIds = [], options = {}) {
  const res = await checkBlockGuard(supabaseAdmin, senderId, receiverIds, options);
  return res.blocked;
}

/** Open Gate safety read: missing block state refuses the free send. */
export async function anyBlockedStrict(admin, senderId, recipientIds = []) {
  const ids = [...new Set((recipientIds || []).filter(Boolean))];
  if (!admin || !senderId || ids.length === 0) return { ok: false, blocked: false };
  try {
    const { data, error } = await admin.from("connect_blocks")
      .select("blocker_id").in("blocker_id", ids).eq("blocked_id", senderId).limit(1);
    if (error) return { ok: false, blocked: false };
    return { ok: true, blocked: Array.isArray(data) && data.length > 0 };
  } catch {
    return { ok: false, blocked: false };
  }
}

/**
 * Add a block entry for blockerId -> blockedId.
 * Idempotent: upsert on (blocker_id, blocked_id).
 */
export async function addBlock(supabaseAdmin, blockerId, blockedId) {
  if (!supabaseAdmin || !blockerId || !blockedId) return { ok: false, error: "Missing required parameters" };
  if (blockerId === blockedId) return { ok: false, error: "Cannot block yourself" };
  try {
    const { error } = await supabaseAdmin
      .from("connect_blocks")
      .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: "blocker_id,blocked_id" });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "Failed to block user" };
  }
}

/**
 * Remove a block entry for blockerId -> blockedId.
 */
export async function removeBlock(supabaseAdmin, blockerId, blockedId) {
  if (!supabaseAdmin || !blockerId || !blockedId) return { ok: false, error: "Missing required parameters" };
  try {
    const { error } = await supabaseAdmin
      .from("connect_blocks")
      .delete()
      .eq("blocker_id", blockerId)
      .eq("blocked_id", blockedId);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || "Failed to unblock user" };
  }
}

/**
 * List all users blocked by blockerId, enriched with profile metadata.
 */
export async function listBlocks(supabaseAdmin, blockerId) {
  if (!supabaseAdmin || !blockerId) return [];
  try {
    const { data: blocks, error } = await supabaseAdmin
      .from("connect_blocks")
      .select("blocked_id, created_at")
      .eq("blocker_id", blockerId)
      .order("created_at", { ascending: false });
    if (error || !Array.isArray(blocks)) return [];
    if (blocks.length === 0) return [];

    const blockedIds = blocks.map((b) => b.blocked_id);
    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, headline")
      .in("id", blockedIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    return blocks.map((b) => ({
      blocked_id: b.blocked_id,
      created_at: b.created_at,
      display_name: profileMap.get(b.blocked_id)?.display_name || "Anonymous Member",
      headline: profileMap.get(b.blocked_id)?.headline || null,
    }));
  } catch {
    return [];
  }
}

