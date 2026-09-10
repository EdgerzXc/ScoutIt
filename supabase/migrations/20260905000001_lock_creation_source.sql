-- A-076 — close the creation_source bypass on the PDF verification gate.
--
-- ⚠️ PREPARED, NOT APPLIED. This file does not authorize a live database change.
-- Apply it through the owner's migration gate (W-003 / O-004: backup, read-back,
-- rollback, one at a time).
--
-- ── WHAT IT FIXES ────────────────────────────────────────────────────
-- /api/dashboard/publish/route.js:69 refuses to publish when
--   creation_source = 'pdf_assisted' AND pdf_verified = false
--
-- U-015 correctly made `pdf_verified` server-only, and that holds: an
-- authenticated UPDATE on it fails with 42501. But the SAME gate reads a
-- SECOND column, and that one was never locked.
--
-- Proven live 2026-09-05 inside a rolled-back transaction, as `authenticated`
-- with a real owner's JWT claim:
--
--   UPDATE properties SET creation_source='pdf_assisted' WHERE id=<own row>;  -- succeeded
--   UPDATE properties SET creation_source='manual'       WHERE id=<own row>;  -- succeeded
--
-- Control test in the same style, proving RLS was enforcing throughout:
--   the same UPDATE against a row the user does NOT own changed 0 rows.
--
-- So an owner can flip their own PDF-assisted draft back to 'manual' and the
-- 422 never fires. Locking `pdf_verified` alone was not enough, because the
-- guard is a two-column condition and only one column was defended.
--
-- ── WHY A REVOKE AND NOT A POLICY ────────────────────────────────────
-- The properties UPDATE policy constrains WHICH ROW (`owner_id = auth.uid()`)
-- and never WHICH COLUMN. That is the platform-wide pattern behind U-015..U-019
-- and O-019. A column the browser must never assert is removed at the grant,
-- which is the mechanism that already works for `pdf_verified` and `verified`.
--
-- ── INSERT IS DELIBERATELY LEFT ALONE ────────────────────────────────
-- The owner's own client must still be able to SAY how a draft was created at
-- INSERT time — that is exactly what A-076's producer fix does
-- (DashboardContext.addListing sends creation_source). Declaring the origin
-- once, at creation, is legitimate. Silently REWRITING it afterwards to escape
-- a review is not. Revoking UPDATE keeps the honest path and closes the
-- dishonest one.
--
-- ── AFTER APPLYING ───────────────────────────────────────────────────
-- Re-run the probe above and confirm the UPDATE now fails with 42501, then
-- confirm a new PDF draft still reaches the queue (INSERT unaffected).

REVOKE UPDATE (creation_source) ON public.properties FROM authenticated;
REVOKE UPDATE (creation_source) ON public.properties FROM anon;

-- ── PART 2: repair verify_pdf_draft, which has never worked ──────────
--
-- Verified live 2026-09-05 by calling it:
--
--   ERROR 42703: column "updated_at" of relation "properties" does not exist
--   CONTEXT: PL/pgSQL function verify_pdf_draft(uuid,text) line 3
--
-- `properties` carries created_at, published_at, archived_at, withdrawn_at,
-- permanently_removed_at and canonical_slug_locked_at — but no `updated_at`.
-- The function has therefore thrown on every invocation since it was created
-- on 2026-08-02. It was never noticed because nothing ever called it: A-076
-- recorded "any caller of it: ZERO". Standing Rule 15, exactly — the endpoint
-- nobody ran was broken.
--
-- /api/admin/pdf-verify does this work directly through the service client
-- instead, so the product does not depend on this function. It is repaired
-- rather than dropped because it is granted to service_role and would
-- otherwise stay a loaded gun for the next caller who trusts its name.

CREATE OR REPLACE FUNCTION public.verify_pdf_draft(
  p_property_id UUID,
  p_verifier_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- `updated_at` removed: the column does not exist on this table.
  UPDATE public.properties
  SET pdf_verified = TRUE
  WHERE id = p_property_id AND creation_source = 'pdf_assisted';

  RETURN FOUND;
END;
$$;

-- CREATE OR REPLACE resets grants, so restate them (Standing Rule 8).
REVOKE ALL ON FUNCTION public.verify_pdf_draft(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_pdf_draft(UUID, TEXT) TO service_role;
