-- ============================================================================
-- 20260904000003 — O-019 stage 3 · U-017 (partial)
-- APPLIED to production 2026-09-04, owner-approved.
--
-- Two changes, both chosen because they alter NOTHING a visitor currently sees:
--   1. `dhsud_number` leaves the view. O-013 records it as deliberately
--      unpublished, 0 profiles have one, and no consumer renders it.
--   2. `prc_license` / `prc_expiry` are gated on `prc_verified` AND a
--      non-lapsed expiry. The app already gates on `prc_verified`
--      (profile/page.js:185, profile/[username]/page.js:152); this pushes the
--      same rule into the view so a direct read cannot bypass it.
--
-- Verified before: as `anon`, 3 PRC licences readable through the view and the
-- retired composite readable at max 4.90 across 3 broker rows.
-- Verified after: 0 licences readable, `broker_profiles` metric read refused,
-- and **12 public profiles still visible** — the directory is unchanged.
-- All three licence-holders are example accounts with prc_verified = false, so
-- no rendered output changed. /brokers, /photographers, /researchers,
-- /event-planners and a public profile page all return 200 and render real
-- provider cards with no error text.
--
-- ── TWO DELIBERATE NON-CHANGES ─────────────────────────────────────────────
-- `subscription_tier` is RETAINED although U-017's acceptance asks for it to be
-- unreadable: `ProfileBaseLayer.js:34` renders a tier visual from it on the
-- public profile. Removing it is a product decision about whether a paid tier
-- is public information, not a security fix. Left to the owner.
--
-- SECURITY DEFINER is RETAINED although the Supabase advisor flags it. It is
-- the reason the view works: `user_profiles` policies are own-row only, so an
-- invoker-rights view returns nothing to an anonymous visitor and every public
-- profile goes blank.
-- ============================================================================

drop view if exists public.public_profiles;

create view public.public_profiles
with (security_invoker = false) as
select
  id, display_name, avatar_url, location, headline, bio, firm, service,
  member_since, subscription_tier, active_roles, provider_type,
  provider_availability, is_profile_public, is_example_account,
  case when prc_verified is true
        and (prc_expiry is null or prc_expiry >= current_date)
       then prc_license end as prc_license,
  prc_verified,
  case when prc_verified is true
        and (prc_expiry is null or prc_expiry >= current_date)
       then prc_expiry end as prc_expiry
from public.user_profiles
where is_profile_public = true
  and coalesce(is_shadowbanned, false) = false
  and archived_at is null;

grant select on public.public_profiles to anon;
grant select on public.public_profiles to authenticated;
grant select on public.public_profiles to service_role;

-- The retired composite is no longer anonymously readable. A-023 phase 1
-- retired it and phase 2 removed it from /api/cms — both above the database,
-- leaving `Allow public read on broker_profiles USING (true)` to serve it to
-- anyone who asked directly.
revoke select on public.broker_profiles from anon;
grant select (user_id, specializations) on public.broker_profiles to anon;

revoke select on public.researcher_profiles from anon;
grant select (user_id) on public.researcher_profiles to anon;

-- ── STILL OPEN on U-017 ────────────────────────────────────────────────────
-- An `authenticated` caller can still read the retired composite for ANY
-- broker, because the policy is `USING (true)` and the column grant was only
-- revoked from `anon`. Closing that needs a code change first:
-- `profileClient.loadBrokerProfile` does `select('*')`, which breaks the moment
-- a column it names is ungranted. Same code-then-grant order as U-015.
-- ============================================================================
