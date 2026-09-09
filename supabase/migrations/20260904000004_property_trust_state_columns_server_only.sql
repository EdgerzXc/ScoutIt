-- ============================================================================
-- 20260904000004 — O-019 stage 4 · closes U-015
-- APPLIED to production 2026-09-04, owner-approved.
--
-- ── THE CODE CHANGE HAD TO LAND FIRST ──────────────────────────────────────
-- A column-level grant rejects an INSERT that NAMES a forbidden column, even
-- when the value is harmless — and `DashboardContext.js` named `verified` on
-- every listing creation. Granting first would have broken listing creation for
-- every owner. So the client stopped sending it (same commit as this file's
-- test, `propertyStateColumnsServerOnly.test.js`) and only then was this
-- applied. Removing it changed no behaviour: the column defaults to `false` and
-- the wizard only ever sent `false`.
--
-- ── GRANT LIST DERIVED BY READING, NOT GUESSING ────────────────────────────
-- Two browser INSERTs exist (the wizard and the PDF draft, both in
-- DashboardContext.js) and **no client UPDATE or DELETE**. UPDATE is re-granted
-- on the same column set anyway, so an owner-edit path that grep did not reach
-- keeps working while still being unable to touch the four state columns.
-- SELECT is untouched — DashboardContext reads `select('*')`.
--
-- ── PROVEN, BEFORE AND AFTER, AS ROLE `authenticated` ──────────────────────
--   before: insert naming lifecycle_state/verified/moderation_status/
--           pdf_verified → ACCEPTED, read back verified=true,
--           moderation_status='approved', pdf_verified=true
--   after:  the same insert → 42501 permission denied for table properties
--   CONTROL after: a wizard-shaped insert (13 legitimate columns) SUCCEEDS and
--           lands lifecycle_state='draft', verified=false,
--           moderation_status='pending', pdf_verified=false — all defaults.
-- Every probe ran inside an aborted transaction. No row was created.
--
-- Note observed while probing: `lifecycle_state` was already being forced back
-- to 'draft' on insert by something upstream of the grant, so that quarter of
-- the defect was covered. The other three were not.
-- ============================================================================

begin;

revoke insert, update on public.properties from authenticated;
revoke insert, update on public.properties from anon;

grant insert (
  id, created_at, owner_id, title, type, location, price, description,
  media_link, completeness_score, coordinates, space_category, details,
  pipeline_status, slug, rejection_reason, archived_at, last_verified_date,
  canonical_slug, canonical_slug_locked_at, published_at, withdrawn_at,
  quietly_open_to_offers, permanently_removed_at, permanently_removed_by,
  permanently_removed_reason, creation_source, pdf_source_url,
  lister_relationship, owner_claim_agreed
) on public.properties to authenticated;

grant update (
  title, type, location, price, description, media_link, completeness_score,
  coordinates, space_category, details, pipeline_status, slug,
  rejection_reason, archived_at, last_verified_date, canonical_slug,
  canonical_slug_locked_at, published_at, withdrawn_at,
  quietly_open_to_offers, permanently_removed_at, permanently_removed_by,
  permanently_removed_reason, creation_source, pdf_source_url,
  lister_relationship, owner_claim_agreed
) on public.properties to authenticated;

commit;

-- ROLLBACK: grant insert, update on public.properties to authenticated, anon;
-- and revert DashboardContext.js. Restoring the grant alone is enough to undo
-- the lock; the client change is harmless either way.
-- ⚠️ Rolling back restores the ability to self-publish a verified, approved
-- listing straight through the public API.
-- ============================================================================
