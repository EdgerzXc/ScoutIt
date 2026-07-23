# Handoff Prompt for Claude Code — ScoutIt Human-Testing Readiness

Paste everything below the line into Claude Code, running inside the ScoutIt repo.

---

You are working on **ScoutIt**, a live Next.js (App Router) real-estate/space-intelligence
platform deployed on Vercel (`scout-it.vercel.app`). Read `AGENTS.md` and
`PRODUCTION_READINESS.md` at the repo root FIRST — they define the design DNA, the dual-CMS rule,
and the current readiness state. Also read `mission-control/MISSION_CONTROL_SPEC.md` for the staff
console context. Per `AGENTS.md`, this Next.js version has breaking changes — read the relevant
guide in `node_modules/next/dist/docs/` before writing Next code.

## Mission
Get ScoutIt ready for human testing by finishing the auth work, building the "connect my Personal
Ledger to my account" feature, and clearing the remaining security flags — WITHOUT locking the
founder out and WITHOUT deleting any sample/example data (it's needed for human testing).

## Non-negotiable guardrails
1. **Do not delete sample or example data.** There is an `is_example_account` flag
   (migration `20260709000002_add_is_example_account_flag.sql`). Example accounts, sample
   properties, and seeded brokers must survive. Human testing uses them.
2. **Do not lock the founder out.** The founder is Jerzel (Supabase Auth). The `service_role`
   key must keep full server-side access. Do not revoke or narrow anything that server routes
   (`supabaseAdmin`) depend on. Mission Control's `admin_users` rows must stay intact.
3. **Dual-CMS golden rule (from AGENTS.md):** Airtable = public read-only content; Supabase =
   private user/dashboard data. Never mix them. Published properties get their slug from
   Airtable's formula field — never invent an app-side slug.
4. **Database changes are additive only.** New columns/tables via new migration files. Never
   rename or drop live columns. Supabase project ref: `yyixsuaimdzyiocswcgc`.
5. **Design DNA:** dark 95% near-black / 5% amber-gold, always via CSS variables (`--accent`,
   `--accent-bright`, `--accent-muted`), mono uppercase for small labels. No white/blue defaults.
6. Verify after every change (build, lint, tests, and a manual reasoning pass). Do not mark a task
   done if tests or the build fail.

## Already done in a prior session (do NOT redo — build on it)
- **DB migration applied** `lock_sensitive_functions_to_service_role`: `REVOKE EXECUTE ... FROM
  PUBLIC, anon, authenticated` then `GRANT ... TO service_role` on `spend_connects`,
  `increment_broker_profile_views`, `audit_record_changes`, `handle_new_auth_user`. (Closed an
  anon wallet-manipulation hole.)
- **DB migration applied** `harden_anon_rpc_exec_and_storage_listing`: dropped `storage.objects`
  policy `"Public Access"` on the public `property_photos` bucket (stopped bulk file enumeration;
  `getPublicUrl` still works).
- **CI added** at `.github/workflows/ci.yml` (lint + Vitest + build check, placeholder env, no
  deploy). Make sure your changes keep it green.
- Docs added: `PRODUCTION_READINESS.md`, `MASTER_MISSION_CONTROL_HARDENING.md`.

## Work to do (in priority order)

### 1. Make end-user auth real (the keystone task)
Today the public site identifies users via a localStorage note; `user_id` is text like `usr-...`,
not a verified Supabase `auth.uid()`. This makes identity spoofable and prevents RLS from
enforcing on end-user tables.
- Migrate end-user identity to **real Supabase Auth sessions**, additively, preserving all
  existing users and sample data. Map/backfill existing `usr-...` IDs — do not orphan current
  rows. Provide a migration path, don't hard-cut.
- Update API routes that currently trust a client-supplied `user_id` to derive identity from the
  verified session token instead (mirror the existing `resolveUserId` / `serverAuth.js` and the
  `/api/dashboard/publish` verified-token pattern).
- Acceptance: a logged-in user's identity is server-verified on every mutating route; no route
  trusts a raw client `user_id`; existing + sample accounts still work; founder still gets in.

### 2. Personal Ledger → account "Connect" feature
The Personal Ledger is a device-only wishlist in localStorage (key `scoutit_reactions`) — this is
intentional ("no account required, never gated"). Sharing already exists (`/api/wishlist/share`,
`wishlistCrypto.js`, `wishlist/shared/[token]`). What's MISSING: pulling the local Ledger into a
user's account on login.
- Add a server-side saved-items store (additive Supabase table + API) keyed to the real
  authenticated user from task 1.
- On login, detect local `scoutit_reactions` that aren't yet in the account and show a clear,
  on-brand button (e.g. "Bring your N saved spaces into your account").
- On tap: **merge** local into account (union, never overwrite existing saves), idempotent (safe
  to run twice, no duplicates). Decide + implement whether local copy is cleared or kept in sync;
  document the choice.
- Acceptance: log out, save several spaces, log in, tap the button → saves appear in the account
  and persist across devices; pre-existing account saves are preserved; re-tapping creates no
  duplicates.

### 3. Close the anonymous-upload hole (depends on task 1)
`storage.objects` still has an INSERT policy `"Allow public uploads"` letting anonymous clients
upload to `property_photos`. Once real auth (task 1) exists, restrict uploads to authenticated
users (the existing `"Allow Uploads"` policy already checks `auth.role() = 'authenticated'`).
Remove `"Allow public uploads"` only AFTER confirming the upload flow uses an authenticated
session, so legitimate uploads don't break.
- Acceptance: authenticated users can still upload property photos; anonymous upload is rejected.

### 4. Apply real RLS on end-user tables (depends on task 1)
Once `auth.uid()` is real, apply/adapt `supabase_rls_hardening.sql` so `owner_id = auth.uid()`
policies actually enforce on `properties`, `deals`, `saved_intel`, etc. Confirm via the Supabase
security advisors that no end-user table is world-writable.

### 5. Enable leaked-password protection
Supabase Dashboard → Authentication → Policies → enable "Leaked password protection". (Config
toggle; note it in the PR description if you can't set it from code.)

### 6. Keep CI green + expand it
Ensure `.github/workflows/ci.yml` passes. If you add tests for the new merge feature and auth,
wire them in. Consider adding the Playwright `e2e_tests/` suite as an optional CI job.

## When done
Update `PRODUCTION_READINESS.md` to move completed items to the Done section, run the Supabase
security advisors again, and summarize what changed, what's verified, and anything still open.
