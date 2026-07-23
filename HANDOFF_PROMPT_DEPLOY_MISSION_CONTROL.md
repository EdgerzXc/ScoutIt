# Handoff Prompt for Claude Code — Deploy Master Mission Control

Paste everything below the line into Claude Code, running inside the ScoutIt repo.

---

You are deploying **ScoutIt Master Mission Control** — the internal staff console — to Vercel as
its own isolated cloud deployment, then bootstrapping the founder's Super Admin account so it can
be used. The app already exists and is fully built at `mission-control/` (a separate Next.js 15 /
App Router / React 19 / Tailwind v4 app). Your job is deployment + first-account setup, NOT
rebuilding features.

## Context you need
- The app lives in `./mission-control/` — separate `package.json`, its own `.vercel/project.json`
  (links to project `prj_ihtbarGRHZiFGB5lPvfz3eN1HOkg`, which may be inaccessible — if so, create a
  NEW Vercel project named `scoutit-mission-control`).
- It has **no git remote and no commits** — so deploy the folder directly with the Vercel CLI
  (`vercel`), not via a GitHub import.
- Auth is Supabase magic-link at route `/`, callback at `/auth/callback`, then `/dashboard`.
- Supabase project ref: `yyixsuaimdzyiocswcgc`. Founder email: `jerzelguerra26@gmail.com`.

## Non-negotiable guardrails
1. **Secret isolation.** `SUPABASE_SERVICE_ROLE_KEY` goes ONLY into this Mission Control Vercel
   project's environment. Never add it to the public ScoutIt site's env, never commit it.
2. **Keep it a separate Vercel project** from the public site (blast-radius + secret isolation).
3. **Never commit `.env*`.** Confirm `.gitignore` covers it before any `git add`.
4. **Do not delete or mutate ScoutIt data.** Sample/example data is needed for human testing. The
   only DB write in this task is inserting ONE row into `admin_users` (the founder).
5. Verify the production build succeeds before declaring done.

## Already done in prior sessions (do NOT redo)
- Modules built and wired to the LIVE schema: Overview (`dashboard/page.js`), Feature Flags
  (`dashboard/features` → uses `feature_flags`), Notifications (`dashboard/notifications` →
  `private_notifications`), Concierge Ingest (`dashboard/media` + `lib/ingestSchema.js`).
- Live DB already has (from the main app's migration): `admin_users` (tier-based: 1 Agent / 2 Ops /
  3 Super Admin + `is_finance`), `mission_control_actions`, `feature_flags` (id/is_enabled/
  description — 7 flags seeded), `blocked_access`, `private_notifications`. The mission-control
  app's own `0002` tables (`feature_gates`/`site_banners`) were NEVER applied — don't rely on them.
- Security migrations already applied live: sensitive RPCs locked to service_role; property_photos
  bucket listing removed.

## Steps

### 1. Pre-flight
- `cd mission-control`
- Confirm `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`. These are the three the app needs to run.
- Run a local production build to catch errors before deploying: `npm install && npm run build`.
  Fix any build/import errors (this app was hand-edited; verify it compiles).

### 2. Deploy to Vercel
- Ensure the Vercel CLI is available (`npm i -g vercel` if needed).
- Run `vercel` and complete the interactive setup. If the pre-linked project isn't accessible under
  the founder's account, create a new project `scoutit-mission-control`. Root directory = the
  `mission-control` folder. Framework = Next.js.
- Set the three env vars for the Production environment (use `vercel env add` or the dashboard),
  values copied from `mission-control/.env.local`. Optionally set `NEXT_PUBLIC_APP_URL` to the
  final production URL so staff-invite emails link back correctly.
- Deploy production: `vercel --prod`. Capture the resulting URL (e.g.
  `https://scoutit-mission-control.vercel.app`).

### 3. Wire Supabase auth for the new domain
- In Supabase (project `yyixsuaimdzyiocswcgc`) → Authentication → URL Configuration: add
  `https://<prod-url>/auth/callback` to Redirect URLs. (This is a dashboard step — if you can't do
  it via API, instruct the founder exactly what to click.)
- If magic-link emails don't send, Supabase's default email may be rate-limited / unconfigured —
  flag that a production email provider (Resend/Brevo) is needed, but it is NOT required for the
  founder's first sign-in in most cases.

### 4. Bootstrap the founder's Super Admin account
- Have the founder open the prod URL and sign in once with `jerzelguerra26@gmail.com` via the magic
  link. This creates their `auth.users` row (they'll see a "not staff yet" message — expected).
- Then insert their Super Admin row. Run this SQL against the live Supabase project (it looks up the
  auth user by email so you don't hand-copy a UUID):

```sql
insert into public.admin_users (id, email, display_name, tier, is_finance, active)
select u.id, u.email, 'Jerzel Von Guerra', 3, true, true
from auth.users u
where lower(u.email) = 'jerzelguerra26@gmail.com'
on conflict (id) do update set tier = 3, active = true;
```

- Confirm the founder can now reach `/dashboard` and see all modules (they're Tier 3).

### 5. Verify + report
- Confirm: prod build is green, the site loads the sign-in page, the founder is bootstrapped and
  can open Overview / Feature Flags / Concierge Ingest / Audit / Staff IAM.
- Report the production URL, confirm the service-role key is set ONLY on this project, and list
  anything still open.

## Recommended immediately after (flag to founder, optional this pass)
- Turn on Vercel **Deployment Protection** (Vercel Authentication) or put the domain behind
  **Cloudflare Access / an IP allowlist** so the login page isn't openly reachable — the "second
  wall" from `MASTER_MISSION_CONTROL_HARDENING.md`.
- Add `X-Robots-Tag: noindex` / a non-obvious subdomain so the admin URL is never indexed.
