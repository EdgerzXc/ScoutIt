# Master Mission Control — Access Setup (Vercel gate + magic-link + Google)

Chosen model: **Wall 1** a Vercel gate so the public can't even reach the login; **Wall 2** two
passwordless identity options — email magic-link AND Google sign-in; **Wall 3** the existing
Agent / Ops Manager / Super Admin tiers. No passwords to hand out or leak.

This supersedes the earlier email+password plan (`HANDOFF_PROMPT_MMC_PASSWORD_LOGIN.md`) — don't run
that one.

---

## PART A — Founder dashboard steps (you click these)

### A1. Vercel gate (Wall 1) — on the `mission-control` project
Vercel → the mission-control project → **Settings → Deployment Protection**. Pick ONE:
- **Vercel Authentication** — only members of your Vercel team can load the site. Best if your
  staff are (or can be) added to your Vercel team as "Viewer."
- **Password Protection** (Pro) — a single shared password to load the site. Best if staff are NOT
  on your Vercel team. They enter the gate password once, then still sign in individually with
  Google/magic-link (so identity is still per-person).
Also good: give the project a non-obvious domain and leave it unindexed.

### A2. Supabase — enable both identity methods (Wall 2)
Supabase project `yyixsuaimdzyiocswcgc` → **Authentication → Providers**:
- **Email**: keep enabled (this powers magic-link — already working).
- **Google**: enable it. You'll need a Google OAuth client (Google Cloud Console → Credentials →
  OAuth client ID, type "Web application"). Put Supabase's callback
  (`https://<project>.supabase.co/auth/v1/callback`) in the Google client's Authorized redirect
  URIs, then paste the Google Client ID + Secret into Supabase's Google provider.
- **Authentication → URL Configuration → Redirect URLs**: make sure both the production Mission
  Control URL `/auth/callback` and `http://localhost:3001/auth/callback` are listed.
- **Disable public sign-ups** (Authentication settings) and **enable Leaked Password Protection**
  (harmless even without passwords).

---

## PART B — Claude Code (code changes; paste this block into Claude Code)

You are updating **ScoutIt Master Mission Control** (`./mission-control/`) so staff sign in with
EITHER Google OAuth OR an email magic-link (no passwords). Keep all routes, RBAC tiers, and DB
wiring working. Standing rules: no `git commit/push` without the founder's go-ahead; service-role
client stays server-only; match the existing ScoutIt dark-gold login styling; read
`node_modules/next/dist/docs/` before writing Next code.

1. **Login page `src/app/page.js`:** offer two buttons — "Sign in with Google"
   (`supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/callback } })`)
   and the existing "Email me a sign-in link" (`signInWithOtp`). Use the `@supabase/ssr`
   `createBrowserClient` so sessions persist to cookies for SSR/middleware (verify `src/lib/
   supabase.js`; fix if it uses plain `createClient`). Keep the "not authorized as staff" message
   for a valid Supabase user with no `admin_users` row.
2. **Auth callback `src/app/auth/callback/route.js`:** confirm it calls `exchangeCodeForSession`
   for the `?code=` param — this already handles both OAuth and magic-link (PKCE). No change needed
   unless it's missing.
3. **Staff IAM `src/app/dashboard/staff/`:** add a Super-Admin-only "Grant staff access by email"
   action — look up an existing Supabase auth user by email
   (`admin.auth.admin.listUsers()` / filter, or `getUserByEmail` if available), and if found insert
   their `admin_users` row at the chosen tier (`{ id: user.id, email, display_name, tier,
   is_finance, active:true, invited_by: staff.id }`), then `logAction('staff.grant', ...)`. If the
   email hasn't signed in yet, show "Ask them to sign in once (Google or link), then grant access."
   Keep existing change-tier / deactivate / reactivate.
4. Verify on `npm --prefix mission-control run dev -- --port 3001`: Google button and magic-link
   both reach `/dashboard` for a Tier-3 user; a signed-in non-staff user gets the not-authorized
   message; founder login still works. Report files changed.

---

## PART C — Cowork (Claude) lane — what I handle

- **Adding staff without building UI, if you prefer:** once a person has signed in once (Google or
  link), I can grant them staff access directly — look up their auth user by email and insert their
  `admin_users` row at the tier you name. (Same way I created your Super Admin row.)
- Verify `admin_users`, confirm the gate/redirect config lines up with the DB, run security
  advisors on request.
- The `must_reset_password` column is NOT needed in this model (no passwords) — skipping it.

---

## The staff onboarding flow (end state)
1. You add the person's email past the Vercel gate (team Viewer, or give them the gate password).
2. They open Mission Control → sign in with Google or an email link.
3. First time they'll see "not authorized as staff" — expected.
4. You (or I, via SQL) grant them a tier in Staff IAM. They refresh → they're in, scoped to that tier.
5. Remove access instantly by deactivating them in Staff IAM (and removing them from the gate).
