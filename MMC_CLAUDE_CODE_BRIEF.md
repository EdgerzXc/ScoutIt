# Master Mission Control — Single Brief for Claude Code

**This is the one file Claude Code should read for Master Mission Control work.** It consolidates and
supersedes the separate `HANDOFF_PROMPT_*` files (run-local, redesign, metrics+IP guard, access
setup, password-login). Work top-to-bottom by priority; each task is self-contained.

---

## The app
`./mission-control/` — a SEPARATE Next.js 15 (App Router) / React 19 / Tailwind v4 app, NOT the main
site. Internal staff console for ScoutIt (premium PH real-estate intelligence). Supabase magic-link
auth, gated by tier: 1 Agent / 2 Ops Manager / 3 Super Admin (+ finance flag). Reads/writes the LIVE
Supabase project `yyixsuaimdzyiocswcgc` server-side via a service-role admin client. Also talks to
Airtable (public CMS) via `AIRTABLE_API_KEY`. Deployed at `mission-control-sigma-one-89.vercel.app`.

## Standing rules (never break)
- **Do NOT `git add/commit/push` in the mission-control repo without the founder's explicit
  go-ahead.** (Owner rule; repo currently has no commit history — deploys go via Vercel CLI.)
- `SUPABASE_SERVICE_ROLE_KEY` / the admin client (`src/lib/supabase/admin.js`) stay server-only —
  never in a client bundle.
- Never pass a plain function from a Server Component to a Client Component (past crash). Server
  pages do Supabase reads; `"use client"` components handle interactivity; mutations use Server
  Actions. Pattern: `src/components/dashboard/BulkSelectManager.js`.
- Dual-CMS golden rule: Airtable = public content; Supabase = private state. A published property's
  `Slug` is an Airtable formula field — read it back, never write it.
- ScoutIt DNA styling: 95% black (#0d0d0d/#121212), gold #E8AE3C (primary) / #F7C64E (hover/CTA) /
  #6E531A (muted border); mono UPPERCASE small labels; dark-luxury but dense/scannable.
- Read `node_modules/next/dist/docs/` before writing Next code; heed deprecations.
- Anything touching the LIVE PUBLIC SITE (`./src/`) or live traffic is GATED — show the diff and
  wait for explicit go-ahead.

## Run + verify (port 3001)
`npm --prefix mission-control run dev -- --port 3001` → http://localhost:3001. `.env.local` has the
keys. Founder is Tier 3 (`jerzelguerra26@gmail.com`); local magic-link redirect is allow-listed.
After each task, verify every sidebar route loads for a Tier-3 user with no console/server errors.

## Current state — PRESERVE, do not revert
Already wired to the LIVE schema this session: Overview (`dashboard/page.js`, live data), Feature
Flags (`dashboard/features` → **`feature_flags`** table; do NOT reintroduce `feature_gates`/
`site_banners`), Notifications (`private_notifications`), Concierge Ingest (`dashboard/media` +
`src/lib/ingestSchema.js`). Live DB has: `admin_users` (tier-based), `mission_control_actions`,
`feature_flags` (7 seeded), `blocked_access`, `private_notifications`, and `security_access_logs`
(just created, empty, for the IP guard). No `loading.js`/`error.js` exist yet. `globals.css` still
has only default create-next-app tokens — add the gold token system there.

---

# BUILD QUEUE (priority order)

## T1 — Run locally + verify/debug navigation
Start the dev server; confirm the left-sidebar links navigate (Overview, CMS, User CRM, Metrics,
Feature Flags, Staff IAM, Concierge Ingest, Notifications). Check devtools console for hydration
errors and fix them. Confirm the top Overview stat cards are simply non-interactive (not a bug).
Report which routes load and any errors fixed.

## T2 — Access model: Vercel gate + magic-link + Google (code parts)
Founder handles the Vercel Deployment Protection gate + enabling Supabase Google provider in the
dashboard. Your code parts:
- `src/app/page.js`: offer BOTH "Sign in with Google" (`supabase.auth.signInWithOAuth({ provider:
  'google', options:{ redirectTo: <origin>/auth/callback }})`) and the existing magic-link
  (`signInWithOtp`). Ensure `src/lib/supabase.js` uses `@supabase/ssr` `createBrowserClient` so the
  session persists to cookies for SSR/middleware. Keep the "not authorized as staff" message.
- `src/app/auth/callback/route.js`: confirm it calls `exchangeCodeForSession` (already handles OAuth
  + magic-link).
- Staff IAM (`dashboard/staff`): add a Super-Admin "grant staff access by email" action — look up an
  existing auth user by email and insert their `admin_users` row at the chosen tier + `logAction`.
- Do NOT build the email+password flow (superseded — passwordless is the chosen model).

## T3 — Close the publishing loop (THE core gap) 🔴
Today the Property Review Queue (`dashboard/cms`) only approves the SUPABASE `properties` table,
which does NOT publish anything to the live public site. The live gate is the Airtable field
`Approved_For_ScoutIt` on `PROPERTIES_CMS`. Extend the approve flow so approving in Mission Control
ALSO publishes to Airtable:
- In `dashboard/cms/actions.js` `approveProperty`, after setting Supabase `moderation_status =
  'approved'`, sync the record to Airtable `PROPERTIES_CMS` and set `Approved_For_ScoutIt = true`,
  reusing the main app's proven pattern (`src/lib/airtable.js` `insertProperty` / the
  `/api/dashboard/publish` sync logic). Read the computed `Slug` back from Airtable and save it to
  the Supabase row (Airtable is slug source of truth — never write Slug). `logAction('property.
  publish', ...)`. On Airtable failure, do NOT mark Supabase approved — surface the error.
- Add a clear "Approve & Publish to live site" button distinct from a Supabase-only "Approve".
- This completes Concierge Ingest end-to-end (upload → synthesize → approve → LIVE).

## T4 — Make feature flags actually affect the public site
The public site doesn't read `feature_flags` yet, so toggles do nothing publicly. In the MAIN app
(`./src/`, GATED — show diff first): add a small server-side reader that fetches `feature_flags`
(public-readable) and gate a couple of real features on it (e.g. `ai_search`, `deep_intel`) + honor
`pre_launch_free_mode`. Cache the read (ISR/Upstash) so it doesn't add latency.

## T5 — Visual redesign + instant navigation
Right now clicking a sidebar link freezes ~1-2s (each page server-renders several live queries with
no loading state). Fix + reskin:
- Add `loading.js` skeletons (dashboard + cms, crm, metrics, media, audit, notifications) and
  `error.js` boundaries per route.
- Extract the sidebar into a `"use client"` component using `usePathname()` for instant active-state
  (layout stays a Server Component doing the tier gating).
- Wrap slow data sections in `<Suspense>` so the shell renders instantly and data streams.
- Define the gold token system in `globals.css`; refactor pages off scattered hex. Dense,
  Linear/Vercel-in-gold aesthetic. Keep all Server Action forms working — restyle, don't remove.

## T6 — Metrics redesign
Replace the thin CSS bars in `dashboard/metrics` with real bar charts (add `recharts`; fall back to
Chart.js/SVG if peer issues) and a **Daily / Weekly / Monthly** toggle: properties created per
period, connects volume per period, staff actions per period, plus status/role breakdowns. Add
`loading.js`/`error.js`. Keep the 5,000-row cap and Ops-Manager (2)+ gate.

## T7 — Security Center / Masked IP Anomaly Guard
Table `security_access_logs` already exists (masked_ip, route_accessed, request_count, is_flagged,
flag_reason, first_seen_at, last_request_at, window_start). Bans live in `blocked_access`
(type='ip', value=masked_ip).
- **Phase 1 (safe, build now):** new `dashboard/security/` page (Ops Manager 2+) — HUD listing
  flagged/high-velocity masked IPs from `security_access_logs` + currently-blocked entries; server
  actions `blockHash`/`unblockHash` (require a reason, `logAction`). Add "Security" to the sidebar.
  Add `loading.js`/`error.js`.
- **Phase 2 (GATED — main site middleware, wait for explicit go-ahead):** in `./src/middleware.js`,
  hash the IP (`'ip_anon_' + sha256(ip + IP_SALT)`), upsert-increment `security_access_logs` per
  (masked_ip, route) in a rolling window, flag > ~120/min, and 403 any masked_ip present in
  `blocked_access`. Add `IP_SALT` to the main app's Vercel env. Fail-open on error; never log raw
  IPs. Show the diff first.

---

## Report back after each task
Files added/changed, per-route verification results, and anything that needs a founder decision or a
dashboard step. Do gated/public-site items only after explicit go-ahead.
