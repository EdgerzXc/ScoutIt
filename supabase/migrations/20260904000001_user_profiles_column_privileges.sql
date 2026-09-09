-- ============================================================================
-- 20260904000001 — user_profiles column privileges  (O-019 stage 1 · closes U-022)
--
-- WRITTEN 2026-09-04. NOT APPLIED. Owner-gated under O-004.
--
-- ── THE DEFECT ─────────────────────────────────────────────────────────────
-- `user_profiles` UPDATE policy, read live from pg_policy on 2026-09-04:
--
--     "Users can update their own profile"   cmd=UPDATE
--       USING       (id = (SELECT auth.uid())::text)
--       WITH CHECK   NULL
--       roles        PUBLIC
--
-- It constrains WHICH ROW and never WHICH COLUMN, and `authenticated` holds
-- table-level UPDATE (confirmed: 58 tables grant anon+authenticated the full
-- INSERT/UPDATE/DELETE set). So a signed-in user may set any column on their
-- own row — including `role`, which `src/lib/adminGuard.js` reads to answer
-- "is this person staff?". One UPDATE through the public API and every
-- /api/admin/* route opens; the same write also grants `subscription_tier`
-- and any `connects_balance`.
--
-- RLS policies cannot restrict columns. Column privileges can. That is what
-- this migration does.
--
-- ── SCOPE: user_profiles ONLY ──────────────────────────────────────────────
-- O-019 covers 58 tables. This is deliberately stage one, because U-022 is the
-- only one of the six that hands out staff, and the entry says so: "if the
-- repair is staged, user_profiles is stage one." The other 57 follow in their
-- own reviewed migrations.
--
-- ── WHY THIS IS SAFE, CHECKED RATHER THAN ASSUMED ──────────────────────────
-- Every browser-side write to user_profiles in the repository was read before
-- choosing the grant list. There are exactly two:
--
--   src/app/settings/page.js:124
--     display_name, active_roles, primary_mode, headline, bio, location,
--     firm, service, updated_at
--   src/components/profile/panels/PhotographerPanel.js:23
--     provider_availability, updated_at
--
-- Those ten columns are re-granted below and nothing else is. There is no
-- client-side INSERT and no client-side DELETE anywhere: the row is created by
-- /api/auth/complete-onboarding through `supabaseAdmin` (service_role), and
-- deletion runs through /api/user/delete-account, also service_role.
--
-- `service_role` is untouched by everything here — it bypasses RLS and keeps
-- its own grants — so every server route continues to work unchanged.
--
-- ── THE ONE COLUMN THAT NEEDS MORE THAN A GRANT ────────────────────────────
-- `active_roles` MUST stay writable, because the Settings page saves it. But
-- adminGuard accepts staff membership from EITHER `role` OR `active_roles`
-- (its own header says so, and warns not to "simplify" it to one column). So
-- revoking `role` alone would leave the escalation open through the array.
-- The trigger below closes that without breaking Settings: a caller that is
-- not service_role may not add 'admin' or 'staff' to their own active_roles.
-- ============================================================================

begin;

-- ── 1. Remove the blanket write grants ─────────────────────────────────────
revoke insert, update, delete on public.user_profiles from authenticated;
revoke insert, update, delete on public.user_profiles from anon;

-- ── 2. Re-grant UPDATE on exactly the columns the product writes ───────────
-- anon is intentionally granted nothing: an anonymous caller has no profile,
-- and the RLS policy would deny it anyway. Two locks, not one.
grant update (
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
) on public.user_profiles to authenticated;

-- ── 3. Stop self-assignment of a staff role through active_roles ───────────
create or replace function public.guard_user_profile_role_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  added_staff boolean;
begin
  -- Server code runs as service_role and is the legitimate way to grant staff.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if new.active_roles is distinct from old.active_roles then
    select exists (
      select 1
      from unnest(coalesce(new.active_roles, array[]::text[])) as r
      where lower(r) in ('admin', 'staff')
    ) and not exists (
      select 1
      from unnest(coalesce(old.active_roles, array[]::text[])) as r
      where lower(r) in ('admin', 'staff')
    )
    into added_staff;

    if added_staff then
      raise exception
        'active_roles cannot be self-assigned a staff role'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

-- Not SECURITY DEFINER: it only inspects the row being written, so it needs no
-- elevated rights. Standing Rule 8's REVOKE requirement applies to definer
-- functions and does not arise here.

drop trigger if exists trg_guard_user_profile_role_escalation on public.user_profiles;
create trigger trg_guard_user_profile_role_escalation
  before update on public.user_profiles
  for each row
  execute function public.guard_user_profile_role_escalation();

commit;

-- ============================================================================
-- VERIFICATION — run as an ordinary signed-in user, inside an aborted
-- transaction, exactly as the 2026-09-01 and 09-03 audits did.
--
--   begin;
--   set local role authenticated;
--   set local request.jwt.claims = '{"sub":"<a real non-example user id>"}';
--
--   -- each of these must now FAIL:
--   update public.user_profiles set role = 'admin'            where id = '<id>';
--   update public.user_profiles set subscription_tier = 'universe' where id = '<id>';
--   update public.user_profiles set connects_balance = 999999  where id = '<id>';
--   update public.user_profiles set prc_verified = true       where id = '<id>';
--   update public.user_profiles set active_roles = array['admin'] where id = '<id>';
--
--   -- and this must still SUCCEED (the Settings page save):
--   update public.user_profiles
--      set display_name = 'probe', active_roles = array['buyer'],
--          primary_mode = 'buyer', updated_at = now()
--    where id = '<id>';
--
--   rollback;
--
-- The last statement is the control: if it fails too, the grant list is wrong
-- and Settings would break in production.
-- ============================================================================

-- ============================================================================
-- ROLLBACK — restores the previous state exactly.
--
--   begin;
--   drop trigger if exists trg_guard_user_profile_role_escalation on public.user_profiles;
--   drop function if exists public.guard_user_profile_role_escalation();
--   revoke update (
--     display_name, active_roles, primary_mode, headline, bio, location,
--     firm, service, provider_availability, updated_at
--   ) on public.user_profiles from authenticated;
--   grant insert, update, delete on public.user_profiles to authenticated;
--   grant insert, update, delete on public.user_profiles to anon;
--   commit;
--
-- Note what the rollback restores: the vulnerability. It exists so a mistake
-- can be undone quickly, not because reverting is ever the desired end state.
-- ============================================================================
