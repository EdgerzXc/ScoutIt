-- ============================================================================
-- ROLLBACK for 20260904000001_user_profiles_column_privileges.sql
-- O-019 stage 1 · U-022
--
-- WRITTEN 2026-09-04 alongside the forward migration, per the W-003 discipline:
-- backup, exact-plan review, rollback review, live read-back.
--
-- ⚠️ READ THIS BEFORE RUNNING IT.
-- This restores the previous state exactly — which means it **restores the
-- privilege-escalation defect**. Any signed-in user will again be able to set
-- their own `role` to 'admin', their own `subscription_tier` to the top tier,
-- and their own `connects_balance` to any number, through the public API.
--
-- It exists so a mistake can be undone in seconds, not because reverting is
-- ever a desirable end state. If the forward migration broke something, prefer
-- widening the column grant list (§2 below) over running this whole file.
-- ============================================================================

begin;

-- ── Undo the active_roles escalation guard ─────────────────────────────────
drop trigger if exists trg_guard_user_profile_role_escalation on public.user_profiles;
drop function if exists public.guard_user_profile_role_escalation();

-- ── Undo the column-scoped grant ───────────────────────────────────────────
revoke update (
  display_name,
  active_roles,
  primary_mode,
  headline,
  bio,
  location,
  firm,
  service,
  provider_availability,
  updated_at
) on public.user_profiles from authenticated;

-- ── Restore the blanket grants (this is the part that reopens the defect) ──
grant insert, update, delete on public.user_profiles to authenticated;
grant insert, update, delete on public.user_profiles to anon;

commit;

-- ============================================================================
-- PARTIAL ALTERNATIVE — prefer this to a full rollback.
--
-- If the forward migration broke a legitimate write, the cause is almost
-- certainly a column missing from the grant list, not the approach. Adding one
-- column is a two-line change and keeps the escalation closed:
--
--   grant update (<the_missing_column>) on public.user_profiles to authenticated;
--
-- The ten granted columns were derived by reading every browser-side write in
-- the repository on 2026-09-04 — `src/app/settings/page.js` and
-- `src/components/profile/panels/PhotographerPanel.js`. A column outside that
-- list means either a new client write was added since, or a server route is
-- wrongly using the anon key instead of `service_role`. Check which before
-- widening the grant: the second case is a bug to fix, not a grant to add.
-- ============================================================================
