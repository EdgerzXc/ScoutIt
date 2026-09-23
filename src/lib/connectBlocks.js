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
