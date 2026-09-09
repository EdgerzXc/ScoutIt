-- ============================================================================
-- 20260904000005 — O-019 stages 5 and 6 · closes U-019 (a) and (b)
-- APPLIED to production 2026-09-04, owner-approved.
-- ============================================================================

-- ── (a) The bounty money path is server-only ───────────────────────────────
-- `bounty_claims` INSERT/UPDATE were scoped only to `researcher_user_id` while
-- the row carries `status`, `payout_connects` and `owner_approved` — so a
-- researcher could create a claim already marked verified, owner-approved, and
-- worth any number of Connects. Latent (0 rows, programme not running), but a
-- money path, which is why U-019 sat in Urgent rather than Future.
--
-- Write is revoked outright rather than column-scoped, because there is no
-- working client writer to preserve — see the finding recorded in the Inbox as
-- 2026-09-04_RAISE_QUEST_WRITES_NOTHING. SELECT is retained: a researcher may
-- read their own claims.
--
-- Proven after, as role `authenticated`: an insert naming status='verified',
-- payout_connects=99999, owner_approved=true → 42501 permission denied.

begin;

revoke insert, update, delete on public.bounty_claims from authenticated;
revoke insert, update, delete on public.bounty_claims from anon;

-- ── (b) The public photo bucket has bounds ─────────────────────────────────
-- `property_photos` is PUBLIC with no size limit and no MIME restriction, and
-- its only policy lets any authenticated user INSERT. `/api/storage/upload` is
-- well built — caps, allowlists, magic-byte verification — but none of it binds
-- a caller who uploads straight to Supabase Storage with their own session.
-- The result was arbitrary-content hosting on a public ScoutIt URL.
--
-- These bounds are enforced by Storage itself, so they bind every caller
-- including a raw client. Values taken from what the product actually uploads:
-- `src/lib/storage.js` MAX_SIZES allows image/jpeg, image/png, application/pdf
-- and video/mp4, at 10MB (50MB for mp4). The bucket limit is the largest of
-- those; the per-type caps stay in the app, which Storage cannot express.
--
-- The concierge video path uses the separate `property-videos-temp` bucket and
-- is untouched.

update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = array['image/jpeg','image/png','application/pdf','video/mp4']
 where id = 'property_photos';

commit;

-- ROLLBACK:
--   grant insert, update, delete on public.bounty_claims to authenticated, anon;
--   update storage.buckets set file_size_limit = null, allowed_mime_types = null
--    where id = 'property_photos';
-- ⚠️ Restores a self-approvable payout path and unbounded public file hosting.
--
-- ── STILL OPEN ─────────────────────────────────────────────────────────────
-- The bucket remains PUBLIC and its INSERT policy still admits any
-- authenticated user — now only within type and size bounds. Narrowing *who*
-- may upload (to the owner of the listing) needs a path convention the current
-- flat `${timestamp}_${name}` filename does not support, and is a design change
-- rather than a grant. Recorded, not attempted.
-- ============================================================================
