# Handoff Prompt for Claude Code — Master Mission Control: Email + Password Login (admin-provisioned)

Paste everything below the line into Claude Code, running inside the ScoutIt repo.

---

You are changing **ScoutIt Master Mission Control** (`./mission-control/`, separate Next.js 15 /
App Router / React 19 / Supabase app) from magic-link sign-in to **email + password sign-in**, where
staff accounts are **provisioned by a Super Admin** (who sets a starting password and hands the
credentials to the person). Keep all existing routes, RBAC tiers, and DB wiring working. Live
Supabase project: `yyixsuaimdzyiocswcgc`. Tiers: 1 Agent / 2 Ops Manager / 3 Super Admin (+finance).

## Standing rules
- Do NOT `git commit/push` in the mission-control repo without the founder's explicit go-ahead.
- `SUPABASE_SERVICE_ROLE_KEY` / admin client stay server-only.
- ScoutIt DNA styling: 95% black (#0d0d0d/#121212), gold #E8AE3C / hover #F7C64E; mono uppercase
  small labels. Match the existing login page's look.
- Read `node_modules/next/dist/docs/` before writing Next code.

## Supabase dashboard prerequisites (do these / instruct the founder)
- Authentication → Providers → **Email**: enabled, with **password** sign-in on. "Confirm email"
  can stay on — accounts are created with `email_confirm: true` by the admin API so no email step is
  needed.
- Authentication → **disable public sign-ups** (this tool is invite/provision-only). Even if left
  on, a self-registered user has no `admin_users` row and is rejected — but disabling is cleaner.
- Enable **Leaked Password Protection** (Authentication → Policies).

## 1. Login page — `src/app/page.js`
- Replace the magic-link (`signInWithOtp`) form with an **email + password** form using
  `supabase.auth.signInWithPassword({ email, password })`.
- Use the SSR browser client (`@supabase/ssr` `createBrowserClient`) so the session is written to
  cookies and the middleware / server components see it. Verify `src/lib/supabase.js` uses
  `createBrowserClient` (not the plain `createClient`); fix if needed so the session persists for
  SSR.
- On success, redirect to `/dashboard` (middleware already sends authed users there).
- Error states, on-brand: wrong credentials → "Email or password is incorrect."; a valid Supabase
  user with no active `admin_users` row still gets the existing "not authorized as staff" message
  (the layout/`getCurrentStaff` already handle this — keep it).
- Optional: keep a small "email me a sign-in link instead" fallback that still uses `signInWithOtp`,
  but password is the primary path.

## 2. Staff IAM — provision accounts with a password (`src/app/dashboard/staff/`)
Super Admin only (Tier 3). Extend the existing invite flow (`actions.js`) with a
**create-with-password** action:
- Form fields: email, display_name, tier (1/2/3), is_finance (checkbox), starting password (with an
  "auto-generate strong password" helper the admin can copy).
- Server action (`"use server"`, service-role admin client):
  1. `getCurrentStaff()` + `assertTier(staff, 3)`.
  2. Create the auth user:
     `admin.auth.admin.createUser({ email, password, email_confirm: true })`.
  3. Insert the `admin_users` row: `{ id: newUser.id, email, display_name, tier, is_finance,
     active: true, invited_by: staff.id }`.
  4. If a `must_reset_password` column exists on `admin_users`, set it `true`.
  5. `logAction({ action: 'staff.create', targetTable: 'admin_users', targetId: newUser.id, ... })`.
  6. Return the email + password once to the screen so the admin can copy and hand them over (show
     it in the UI, do NOT log the password to the audit table or console).
- Keep the existing change-tier / deactivate / reactivate actions working. Deactivating still just
  flips `admin_users.active=false` (don't delete the auth user).

## 3. Force password change on first login (recommended)
- (DB column `admin_users.must_reset_password boolean default false` — the founder's Cowork
  assistant can add this additively; if it's not there yet, either ask for it or skip this step and
  ship §1–§2 first.)
- If the signed-in staff's `must_reset_password` is true, redirect them to a `/dashboard/account`
  (or a modal) that calls `supabase.auth.updateUser({ password })`, then set `must_reset_password`
  = false via a server action. Block other dashboard actions until they've reset.

## RUN + VERIFY (port 3001)
`npm --prefix mission-control run dev -- --port 3001`.
- As Super Admin (`jerzelguerra26@gmail.com`), open Staff IAM, create a test staff account with a
  password, confirm the credentials show once.
- Sign out, sign in with that new email+password → lands in `/dashboard` at the right tier.
- Wrong password → clean error. Deactivated account → rejected.
- Confirm the founder's own login still works and no route regressed.
Report files changed and verification results. Do not commit without go-ahead.
