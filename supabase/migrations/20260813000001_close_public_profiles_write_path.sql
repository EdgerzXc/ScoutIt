-- PREPARED, NOT APPLIED. Applying to production needs owner approval.
-- Audit: Task 4A, 2026-08-13. Written from live introspection of project
-- yyixsuaimdzyiocswcgc, not from this directory's history (supabase/migrations
-- is known to have drifted from the live database).
--
-- FINDING
-- public.public_profiles is a view over user_profiles with
-- reloptions {security_invoker=false}, i.e. SECURITY DEFINER. It is a simple
-- single-table projection, so Postgres makes it AUTO-UPDATABLE
-- (information_schema.views.is_updatable = YES). anon and authenticated hold
-- INSERT/UPDATE/DELETE on it. A write therefore executes as the view owner
-- (postgres) and BYPASSES user_profiles' RLS completely.
--
-- Proven on the live database inside a rolled-back transaction:
--   set local role anon;
--   update public_profiles set display_name = display_name
--     where id in (select id from public_profiles limit 1);   -- 1 row
-- Anyone holding the publishable anon key can rewrite or delete any public
-- profile.
--
-- WHY NOT security_invoker = true
-- Do not "fix" this by flipping the view to SECURITY INVOKER. The only SELECT
-- policy on user_profiles is `id = auth.uid()`, so an invoker-rights view would
-- return zero rows to anonymous visitors and every public profile page and
-- ecosystem directory would go blank. SECURITY DEFINER on READ is deliberate
-- and load-bearing (src/lib/profileClient.js reads this view with the anon
-- client). Only the write path is accidental.

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Verification after applying:
--   begin; set local role anon;
--   update public_profiles set display_name = display_name where true;
--   -- expect: ERROR permission denied for view public_profiles
--   rollback;
--   -- and reads must still work:
--   begin; set local role anon; select count(*) from public_profiles; rollback;
