-- ============================================================================
-- 20260904000002 — O-019 stage 2
-- Closes U-016, U-018, and the spatial_ref_sys note inside U-019.
--
-- APPLIED to production 2026-09-04, owner-approved ("please fix whatever left").
-- Same pattern as stage 1 (20260904000001): the application code is correct;
-- the table grants underneath it are not.
--
-- ── HOW THE GRANT LISTS WERE DERIVED ───────────────────────────────────────
-- Every browser-side write to these tables was read before choosing. Findings:
--
--   broker_profiles / researcher_profiles
--     One client writer: src/lib/profileClient.js, `loadBrokerProfile` and
--     `loadResearcherProfile`, which insert `{ user_id }` — and nothing else —
--     to auto-create the row on first load. **There is no client UPDATE.**
--     So INSERT is re-granted on `user_id` alone and UPDATE is not re-granted
--     at all: every metric takes its default and only service_role can move it.
--
--   property_slug_history
--     **No client writer exists.** src/lib/propertyRedirects.js only SELECTs.
--     The staff slug migration runs as service_role. So write is revoked
--     outright and the permissive INSERT policy is dropped with it.
--
--   spatial_ref_sys
--     PostGIS reference data. No product path writes it.
--
-- ── PROVEN, BEFORE AND AFTER, AS ROLE `authenticated` ──────────────────────
--   U-016 before: `update broker_profiles set scout_rating=5.00,
--                  verified_closures=9999` → ACCEPTED, read back as 5.00/9999
--          after:  → 42501 permission denied for table broker_profiles
--   U-018 before: inserted a slug redirect for a property the caller does NOT
--                 own, with a forged replaced_by_staff_id → ACCEPTED
--          after:  → 42501 permission denied for table property_slug_history
--   CONTROL after: `insert into broker_profiles (user_id) values (…)` still
--                 succeeds and lands scout_rating 0.00 / verified_closures 0;
--                 the same insert naming scout_rating is refused.
-- Every probe ran inside an aborted transaction. No row was changed.
-- ============================================================================

begin;

-- ── U-016 — a broker or researcher cannot write their own trust metrics ────
revoke insert, update, delete on public.broker_profiles from authenticated;
revoke insert, update, delete on public.broker_profiles from anon;
revoke insert, update, delete on public.researcher_profiles from authenticated;
revoke insert, update, delete on public.researcher_profiles from anon;

grant insert (user_id) on public.broker_profiles to authenticated;
grant insert (user_id) on public.researcher_profiles to authenticated;

-- ── U-018 — property URL redirects cannot be forged ───────────────────────
-- Public SELECT is deliberately retained: redirect resolution depends on it,
-- and the defect was the write, not the read.
revoke insert, update, delete on public.property_slug_history from authenticated;
revoke insert, update, delete on public.property_slug_history from anon;

drop policy if exists "Authenticated insert property_slug_history" on public.property_slug_history;

-- ── U-019, the cheap half — PostGIS reference data is read-only ───────────
-- `anon` held DELETE and TRUNCATE over ~8,500 rows. Emptying that table breaks
-- every coordinate transform in the product.
revoke insert, update, delete, truncate on public.spatial_ref_sys from authenticated;
revoke insert, update, delete, truncate on public.spatial_ref_sys from anon;

commit;

-- ============================================================================
-- STILL OPEN after this migration — do not read it as closing O-019.
--
--   U-015  `properties`. Needs a CODE change first: DashboardContext.js inserts
--          a listing from the browser and explicitly names `verified`, so a
--          column grant that excludes it would break listing creation. Fix the
--          client first, then grant.
--   U-017  The retired composite is still publicly readable, and
--          `public_profiles` (SECURITY DEFINER) still returns `prc_license`,
--          `prc_expiry`, `dhsud_number` and `subscription_tier` to `anon`.
--          Needs the view rewritten and `profileClient`'s `select('*')` pinned
--          to explicit columns.
--   U-019  (a) `bounty_claims` — the client sets `status` and `payout_connects`
--          when raising a quest, so this needs the same code-then-grant order.
--          (b) `property_photos` storage — a bucket policy, not a table grant.
--
-- ROLLBACK: supabase/rollback-proposals/20260904000002_..._rollback.sql
-- ============================================================================
