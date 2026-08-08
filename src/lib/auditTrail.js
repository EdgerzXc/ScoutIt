// ─────────────────────────────────────────────────────────────────────────
// APPLICATION AUDIT TRAIL — the one way to write `public.audit_logs`
// NEW_IDEAS_2.md §58 · C28
//
// ── WHY THIS MODULE EXISTS ───────────────────────────────────────────
// Three routes each hand-rolled an `audit_logs` insert, and ALL THREE were
// broken in the same way. Verified against the live database 2026-08-06:
//
//   audit_logs.table_name  NOT NULL, no default
//   audit_logs.record_id   NOT NULL, no default
//   audit_logs.action      NOT NULL, no default
//
// Every call site supplied `action` and omitted the other two, so every
// insert raised
//
//   null value in column "table_name" ... violates not-null constraint
//
// and every call site wrapped the write in `try {} catch {}` or
// `.catch(() => null)` because "audit logging is non-blocking". So the
// failure was invisible. Proof, not inference: `audit_logs` holds 692 rows
// and exactly three distinct actions — INSERT, UPDATE, DELETE — all written
// by the `audit_record_changes` database trigger. Not one row has ever come
// from application code.
//
// The routes that thought they were writing an audit trail:
//   /api/deals/[id]/close      'deal_close'
//   /api/property/verify       'PROPERTY_VERIFIED'
//   /api/user/delete-account   'ACCOUNT_DELETED_RIGHT_TO_ERASURE'  ← RA 10173
//
// The last one matters most: it is the evidence that a right-to-erasure
// request was honoured, and it has never been recorded.
//
// ── WHY A HELPER RATHER THAN THREE FIXES ─────────────────────────────
// Three copies drifted into the same bug independently, which is the signal
// that the shape — not the typing — was the problem. One function that
// cannot omit a NOT NULL column is the fix. Standing Rule 13's sibling:
// three call sites means three chances to get it wrong.
//
// ── FAILURES ARE STILL NON-BLOCKING, BUT NO LONGER SILENT ────────────
// An audit write must not fail a user's request. It must also never fail
// without saying so — that combination is what hid this for weeks. This
// returns `{ ok, error }` and logs to the server console, so a caller may
// ignore the result but a log reader cannot miss it.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Record an application-level audit event.
 *
 * @param {object} db          supabase client (normally supabaseAdmin)
 * @param {object} entry
 * @param {string} entry.action        what happened, e.g. 'PROPERTY_VERIFIED'
 * @param {string} entry.tableName     table the event concerns, e.g. 'properties'
 * @param {string} entry.recordId      affected row's id
 * @param {string} [entry.userId]      actor (text column, so an id or slug is fine)
 * @param {string} [entry.resourceType] defaults to 'tableName'
 * @param {string} [entry.resourceId]   defaults to 'recordId'
 * @param {object} [entry.metadata]     free-form context
 * @returns {Promise<{ok: boolean, error: object|null}>}
 */
export async function writeAuditLog(db, entry = {}) {
  const { action, tableName, recordId, userId, resourceType, resourceId, metadata } = entry;

  // Fail loudly at the boundary rather than sending a doomed insert. These
  // three are NOT NULL in the database; a caller that omits one has a bug,
  // and returning early makes it visible in the log instead of in Postgres.
  if (!db) return { ok: false, error: new Error("writeAuditLog: no database client") };
  const missing = ["action", "tableName", "recordId"].filter((k) => !entry[k]);
  if (missing.length > 0) {
    const error = new Error(`writeAuditLog: missing required field(s): ${missing.join(", ")}`);
    console.error("[AUDIT]", error.message);
    return { ok: false, error };
  }

  // An audit write must never be the reason a user's request fails, so a
  // thrown error (network, client misconfiguration) is caught here rather than
  // relying on every call site to remember a try/catch. That is what the old
  // sites did, and it is also how they hid the bug — the difference is that
  // this reports what it caught.
  try {
    const { error } = await db.from("audit_logs").insert({
      action,
      table_name: tableName,
      record_id: String(recordId),
      user_id: userId ? String(userId) : null,
      resource_type: resourceType || tableName,
      resource_id: String(resourceId || recordId),
      metadata: metadata || {},
    });

    if (error) {
      console.error(`[AUDIT] Failed to record "${action}" on ${tableName}:${recordId}:`, error.message);
      return { ok: false, error };
    }
    return { ok: true, error: null };
  } catch (err) {
    console.error(`[AUDIT] Threw while recording "${action}" on ${tableName}:${recordId}:`, err?.message);
    return { ok: false, error: err };
  }
}
