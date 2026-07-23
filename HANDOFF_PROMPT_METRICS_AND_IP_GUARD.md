# Handoff Prompt for Claude Code — Metrics Redesign + Masked IP Anomaly Guard

Paste everything below the line into Claude Code, running inside the ScoutIt repo. Two features,
phased so nothing touches the LIVE public site until the founder explicitly approves Phase 2.

---

You are adding two things to **ScoutIt Master Mission Control** (`./mission-control/`, a separate
Next.js 15 / App Router / React 19 / Tailwind v4 app) and, in a gated phase, the **main public
site**. Keep all existing routes, forms, auth checks, and DB wiring working. Live Supabase project:
`yyixsuaimdzyiocswcgc`. Staff tiers: 1 Agent / 2 Ops Manager / 3 Super Admin (+ finance).

## Standing rules (do not break)
- Do NOT `git add/commit/push` in the mission-control repo without the founder's explicit go-ahead.
- `SUPABASE_SERVICE_ROLE_KEY` / admin client stay server-only.
- Follow ScoutIt DNA: 95% black (#0d0d0d/#121212), gold #E8AE3C (primary) / #F7C64E (hover/CTA) /
  #6E531A (muted borders); mono uppercase small labels; dark-luxury but dense/scannable.
- Read `node_modules/next/dist/docs/` before writing Next code.
- Never pass a plain function from a Server Component to a Client Component (past crash). Server
  pages do Supabase reads; client components (`"use client"`) handle interactivity; mutations go
  through Server Actions. Reference `src/components/dashboard/BulkSelectManager.js`.

---

# FEATURE 1 — Metrics redesign (bar charts + time-range toggle)

Current `mission-control/src/app/dashboard/metrics/page.js` renders thin CSS bars and looks weak.
Redesign it into a real analytics view.

- Add a charting lib to the mission-control app (`recharts` preferred for React 19; if install/peer
  issues, fall back to Chart.js or keep pure-SVG bars — but the deliverable is real bar charts).
- Add a **time-range toggle: Daily / Weekly / Monthly** (client control via `usePathname`/
  `useSearchParams` or a small client wrapper that re-requests). Default: Monthly.
- Turn the existing metric groups into **bar charts over time** where a date exists, plus keep the
  categorical breakdowns as bars:
  - Supply: properties created per period (by `created_at`), and current status mix
    (pending/approved/rejected/archived) as bars.
  - Monetization: connects volume per period (`connect_transactions.created_at`, sum `amount` by
    `kind`).
  - Ops health: staff actions per period (`mission_control_actions.created_at`) and by action type.
  - Demand: users by active role, subscriptions by status.
- Keep it server-rendered with the service-role client; add a `loading.js` skeleton and `error.js`
  boundary for this route. Keep queries lean and the existing 5,000-row cap.
- Tier gate stays: Ops Manager (2)+.

---

# FEATURE 2 — Masked IP Anomaly Guard (Security Center)

Goal: detect and block bots/scrapers by counting requests per **hashed** (not raw) IP, flagging
high-velocity offenders, and letting staff one-click ban them. Privacy-safe (RA 10173): store only
a salted SHA-256 hash, never the raw IP.

## Phase 1 — SAFE (build now: DB table + Mission Control HUD, no public-site change)

### 1a. New table (additive migration against project `yyixsuaimdzyiocswcgc`)
```sql
create table if not exists public.security_access_logs (
  id uuid primary key default gen_random_uuid(),
  masked_ip text not null,
  route_accessed text not null,
  request_count int not null default 1,
  is_flagged boolean not null default false,
  flag_reason text,
  first_seen_at timestamptz not null default now(),
  last_request_at timestamptz not null default now(),
  window_start timestamptz not null default now()
);
create index if not exists idx_sec_logs_masked_ip on public.security_access_logs(masked_ip);
create index if not exists idx_sec_logs_flagged on public.security_access_logs(is_flagged) where is_flagged;
alter table public.security_access_logs enable row level security;
create policy "no client access" on public.security_access_logs for all using (false) with check (false);
```
The ban list already exists: `blocked_access (id, type ['ip'|'user_id'|'fingerprint'], value, reason,
blocked_by, created_at)`. For IP bans use `type='ip'`, `value = masked_ip`.

### 1b. Mission Control "Security" page — `mission-control/src/app/dashboard/security/`
- Add "Security" to the sidebar in `dashboard/layout.js` (icon e.g. ShieldAlert), min tier: Ops
  Manager (2) — Super Admin can also ban.
- `page.js` (server): show (a) flagged/high-velocity masked IPs from `security_access_logs` ordered
  by `request_count` desc, with route, rate, last seen; (b) currently blocked entries from
  `blocked_access` where `type='ip'`. On-brand HUD table, mono, dense.
- `actions.js` (`"use server"`): `blockHash(formData)` → insert into `blocked_access`
  (type='ip', value=masked_ip, reason, blocked_by=staff.id), `logAction('ip.block', ...)`;
  `unblockHash(formData)` → delete/deactivate that ban, `logAction('ip.unblock', ...)`. Gate at
  Tier 2+, require a reason to block. Follow the crm/actions.js pattern (getCurrentStaff → assertTier
  → mutate → logAction → revalidatePath).
- Add `loading.js` + `error.js` for the route.

## Phase 2 — GATED (DO NOT DO until the founder explicitly says go — it changes the LIVE public site)

Wire the actual watching/blocking into the **main app** (`./src/middleware.js`), which already runs
Upstash rate limiting on `/api/*`:
- Compute `masked_ip = 'ip_anon_' + sha256((x-forwarded-for or remoteAddr) + process.env.IP_SALT)`.
- On each request to public/API routes: upsert-increment a `security_access_logs` row for
  (masked_ip, route) within a rolling window; if count in window exceeds a threshold (e.g. 120/min),
  set `is_flagged=true, flag_reason='velocity'`.
- Check `blocked_access` (type='ip', value=masked_ip) — if present, return 403 immediately.
- Add `IP_SALT` to the main app's env (Vercel). Keep it fast: do the block-list check cheaply
  (cache in Upstash/memory for a few seconds) so this doesn't add latency; fail-open on error like
  the existing limiter. Do NOT log raw IPs anywhere.

Flag this phase back to the founder with the exact middleware diff before applying, since it sits in
the live request path.

---

## RUN + VERIFY (port 3001)
`npm --prefix mission-control run dev -- --port 3001` → http://localhost:3001 (Tier-3 founder
`jerzelguerra26@gmail.com`). Verify: Metrics shows real bar charts with a working Daily/Weekly/
Monthly toggle and loads instantly (skeleton, no freeze); the new Security page lists flagged IPs
and blocked entries and the block/unblock actions write to `blocked_access` + the audit log; every
other route still works with no console errors. Report files added/changed and per-route results.
Do Phase 2 only after explicit go-ahead.
