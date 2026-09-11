-- ═════════════════════════════════════════════════════════════════════════════
-- U-031 — public_profiles is read-only for browsers, again
-- Applied to the live database 2026-09-11 on owner consent.
--
-- 20260813000001 closed this write path. 20260904000003 (U-017) then did
-- DROP VIEW + CREATE VIEW to contain unverified PRC licences, and a freshly
-- created view in `public` inherits Supabase's default browser grants —
-- INSERT, UPDATE, DELETE for `anon` and `authenticated`. Its GRANT SELECT lines
-- only ADDED to those; nothing revoked them. The August fix was undone silently.
--
-- Why that is a hole and not just untidiness: the view is SECURITY DEFINER
-- (security_invoker=false — deliberately, so anonymous visitors can READ public
-- profiles) and it is a simple single-table projection, so Postgres makes it
-- auto-updatable. A browser write through it runs as the view owner and bypasses
-- user_profiles' RLS. Proven live 2026-09-11 in a rolled-back transaction:
-- `set local role anon; update public_profiles set id = id where id = (...)`
-- → 1 row. 12 of 15 profiles were reachable.
--
-- Do NOT fix this with security_invoker = true: the only SELECT policy on
-- user_profiles is `id = auth.uid()`, so every public profile page would go blank.
--
-- ANY future DROP/CREATE of this view must end with the two lines below.
-- ═════════════════════════════════════════════════════════════════════════════

REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
