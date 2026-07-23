# Handoff Prompt for Claude Code — Run Master Mission Control Locally (live dev)

Paste everything below the line into Claude Code, running inside the ScoutIt repo. Goal: get the
`mission-control` app running on a local dev server with hot-reload so the founder sees changes
instantly, confirm login + navigation work, and diagnose a "can't click anything" report.

---

You are setting up a local development server for **ScoutIt Master Mission Control** (the internal
staff console at `./mission-control/`, a separate Next.js 15 / App Router / React 19 / Tailwind v4
app). It is already built and also deployed to Vercel; now the founder wants to run it locally to
see edits live. Do NOT rebuild features — just get it running, verify it works, and fix the
click/navigation issue.

## Non-negotiable guardrails
1. **Do NOT run `git add` / `git commit` / `git push` in the `mission-control` repo** without the
   founder's explicit go-ahead. This is a standing owner instruction (2026-07-09) recorded in
   `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/MISSION_CONTROL_REAL_BUILD_STATUS.md`. The repo has no
   commit history and deploys go up via the Vercel CLI directly from the working tree.
2. `SUPABASE_SERVICE_ROLE_KEY` stays server-side only — never expose it to the client bundle.
3. Do not delete or mutate ScoutIt data (sample/example data is needed for human testing).

## Context — already done, do NOT redo
- Modules built + wired to the LIVE schema: Overview (`dashboard/page.js`), Feature Flags
  (`dashboard/features` → `feature_flags` table), Notifications (`dashboard/notifications` →
  `private_notifications`), Concierge Ingest (`dashboard/media` + `src/lib/ingestSchema.js`).
- Live Supabase (project ref `yyixsuaimdzyiocswcgc`) already has: `admin_users` (tier-based:
  1 Agent / 2 Ops / 3 Super Admin + `is_finance`), `mission_control_actions`, `feature_flags`
  (7 flags seeded), `blocked_access`, `private_notifications`. The app's own `feature_gates`/
  `site_banners` tables were never applied — ignore them.
- Founder is already bootstrapped: `admin_users` row for `jerzelguerra26@gmail.com`, Tier 3, active
  (auth user id `57a67739-a919-4141-a706-d943c82ac75c`). Same Supabase project for local + cloud, so
  this login works locally too.
- Cloud deployment exists at `mission-control-sigma-one-89.vercel.app`.

## Steps

### 1. Start the local dev server
- `cd mission-control`
- Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`.
- `npm install`
- Run on port 3001 so it never clashes with the main site (which uses 3000):
  `npm run dev -- --port 3001`
- The local URL is `http://localhost:3001`.

### 2. Make magic-link login work locally
- In Supabase → Authentication → URL Configuration, add `http://localhost:3001/auth/callback` to
  Redirect URLs (and `http://localhost:3001` as an allowed Site URL / additional redirect). This is
  a dashboard step — if you can't do it via API, tell the founder exactly what to click.
- Founder signs in at `http://localhost:3001` with `jerzelguerra26@gmail.com` → magic link →
  `/dashboard`. They already have Tier 3, so full access loads.

### 3. Diagnose the "can't click anything" report
The founder reports nothing is clickable. Likely they were clicking the read-only stat cards on the
Overview, not the left-sidebar links — but VERIFY it's not a real bug:
- With the dev server running, open the browser devtools console on `/dashboard` and check for
  hydration mismatches or runtime errors. Report any you find.
- Confirm the left sidebar `<Link>` items actually navigate: click "User CRM", "Concierge Ingest",
  "Feature Flags", "Metrics" — each should load its page with no server error.
- Load each dashboard subpage directly (`/dashboard/crm`, `/dashboard/cms`, `/dashboard/media`,
  `/dashboard/features`, `/dashboard/audit`, `/dashboard/metrics`, `/dashboard/staff`,
  `/dashboard/badges`, `/dashboard/notifications`) and confirm none throw. Fix any that error.
- If everything navigates fine, report that the app is working and the top cards are simply
  non-interactive by design.

### 4. Keep it running for live iteration
- Leave the dev server running so edits hot-reload. Tell the founder the local URL and that saved
  code changes appear instantly on refresh.

### 5. Report back
- Confirm: dev server up on `http://localhost:3001`, login works, which pages load, any console
  errors found/fixed, and whether the "can't click" issue was a real bug or the read-only cards.
