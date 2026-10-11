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

/**
 * True when `receiverId` has blocked `senderId`.
 * Never throws — unknown DB state means "not blocked" + warn, never a 500.
 */
export async function isBlocked(supabaseAdmin, senderId, receiverId) {
  if (!supabaseAdmin || !senderId || !receiverId) return false;
  if (senderId === receiverId) return false;
  try {
    const { data, error } = await supabaseAdmin
      .from("connect_blocks")
      .select("blocker_id")
      .eq("blocker_id", receiverId)
      .eq("blocked_id", senderId)
      .limit(1);
    if (error) {
      // 42P01 = undefined_table — migration not applied yet. Any other error
      // is also non-fatal here; the spend must not hinge on a safety read.
      if (!missingTableWarned) {
        console.warn("[CONNECT BLOCKS] check skipped (table unavailable):", error.code || error.message);
        missingTableWarned = true;
      }
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    if (!missingTableWarned) {
      console.warn("[CONNECT BLOCKS] check skipped (exception):", err?.message);
      missingTableWarned = true;
    }
    return false;
  }
}

/**
 * True when ANY of `receiverIds` has blocked `senderId`.
 */
export async function anyBlocked(supabaseAdmin, senderId, receiverIds = []) {
  const ids = (receiverIds || []).filter(Boolean);
  for (const rid of ids) {
    if (await isBlocked(supabaseAdmin, senderId, rid)) return true;
  }
  return false;
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

