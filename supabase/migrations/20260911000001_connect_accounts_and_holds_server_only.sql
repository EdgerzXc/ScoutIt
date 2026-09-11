-- ═════════════════════════════════════════════════════════════════════════════
-- Connect accounts and reconciliation holds are server-only
--
-- Companion to 20260814000002_connect_wallets_role_scope_unification.sql, applied
-- in the same approval on 2026-09-11.
--
-- That migration creates `user_connect_accounts` and `connect_backfill_holds` and
-- enables RLS, but never revokes Supabase's default browser grants. A table
-- created in `public` inherits INSERT, UPDATE, DELETE and TRUNCATE for `anon` and
-- `authenticated`. RLS (no policy = deny) already blocks browser INSERT/UPDATE/
-- DELETE, and TRUNCATE — which does bypass RLS — is not an operation Supabase's
-- public API offers. So this is defense in depth: the day a policy is loosened,
-- no browser grant is waiting behind it. The same gap was found on
-- `user_connect_wallets` / `connect_wallet_ledger` on 2026-09-10 and closed by
-- `revoke_browser_grants_on_connect_wallets`.
--
-- No browser code reads or writes either table: every reference is a server
-- route using the service role (`complete-onboarding`, `admin/connects-refund`).
-- So both become service-role only. The "view own" SELECT policies stay in place
-- and are inert until a grant is deliberately added for a real browser reader.
-- ═════════════════════════════════════════════════════════════════════════════

REVOKE ALL ON TABLE public.user_connect_accounts FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.connect_backfill_holds FROM PUBLIC, anon, authenticated;
