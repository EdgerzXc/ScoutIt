# Handoff Prompt for Claude Code — Master Mission Control Visual Redesign + Instant Navigation

Paste everything below the line into Claude Code, running inside the ScoutIt repo.

---

You are redesigning **ScoutIt Master Mission Control**, the internal staff console at
`./mission-control/` (a separate Next.js 15 App Router / React 19 / Tailwind v4 app — NOT the main
site). It already works and is deployed. Your job is a **VISUAL REDESIGN + NAVIGATION-SPEED
overhaul, NOT a feature rebuild.** Every existing route, form, auth check, and database wiring must
keep working exactly as-is.

## WHAT THIS APP IS
Internal, staff-only ops console for ScoutIt (premium PH real-estate intelligence platform). Access
is Supabase magic-link, gated by tier: 1 = Agent, 2 = Ops Manager, 3 = Super Admin (+ finance flag).
Reads/writes live Supabase project `yyixsuaimdzyiocswcgc` server-side via a service-role admin
client.

## CURRENT CODEBASE REALITY (verified — read before starting)
- **No `loading.js` or `error.js` files exist anywhere yet** — you are adding them.
- **`src/app/globals.css` only has default create-next-app tokens** (`--background`/`--foreground`,
  white/near-black). The ScoutIt gold system is NOT defined there yet — add it as CSS variables /
  Tailwind v4 `@theme` tokens here, then refactor pages to use the tokens instead of scattered hex.
- **Correct client-component pattern to copy:** `src/components/dashboard/BulkSelectManager.js`.
- **These pages were just rewritten this session — RESTYLE them, do NOT revert or re-point them:**
  - `dashboard/page.js` (Overview) — reads LIVE data via a `safe()` wrapper; keep the queries.
  - `dashboard/features` (Feature Flags) — uses the live **`feature_flags`** table (id/is_enabled/
    description). Do NOT reintroduce `feature_gates`/`site_banners` — those tables don't exist live.
  - `dashboard/notifications` — uses `private_notifications`.
  - `dashboard/media` (Concierge Ingest) — uses `properties` + `src/lib/ingestSchema.js`; includes a
    client `IngestPanel.js` (clipboard + paste-back). Keep its behavior.
- All routes below already exist under `src/app/dashboard/`: `audit, badges, cms, cms/import, crm,
  features, media, metrics, notifications, staff`, plus `page.js` and `layout.js`. Sign-in is
  `src/app/page.js`.

## ROUTES THAT MUST KEEP WORKING (don't remove/rename)
Overview `/dashboard` · CMS/Content `/dashboard/cms` (+ `/dashboard/cms/import`) · User CRM
`/dashboard/crm` · Badges `/dashboard/badges` · Metrics `/dashboard/metrics` · Audit Log
`/dashboard/audit` · Feature Flags `/dashboard/features` · Staff IAM `/dashboard/staff` · Concierge
Ingest `/dashboard/media` · Notifications `/dashboard/notifications`. Shell + sidebar live in
`src/app/dashboard/layout.js`.

## DESIGN DIRECTION — ScoutIt DNA (dark luxury, but FUNCTIONAL)
- 95% deep black (`#0d0d0d` / `#121212`), 5% glowing gold: primary `#E8AE3C`, interactive/hover/CTA
  `#F7C64E`, muted borders `#6E531A`, glow rgb `232,174,60`. Define these as CSS variables in
  `globals.css`; do not scatter raw hex across components.
- Mono, UPPERCASE, letter-spaced small labels / metrics.
- Glassmorphism (subtle backdrop-blur), refined micro-interactions, cinematic depth. NO generic
  white/blue Bootstrap UI.
- BUT this is a DENSE data/ops console: optimize for scannability, clear hierarchy, information
  density — "Linear/Vercel dashboard reskinned in ScoutIt gold-on-black." Designed hover/focus/
  active states; treat data viz as part of the system.

## PERFORMANCE — make navigation feel INSTANT (required)
Right now clicking a sidebar link freezes ~1–2s because each page server-renders several live
Supabase queries with NO loading state.
1. Add a `loading.js` skeleton for the dashboard and each slow route (start with `dashboard/`,
   `cms`, `crm`, `metrics`, `media`, `audit`, `notifications`) so an on-brand skeleton appears
   instantly instead of the old page freezing. Consider a shared `<Skeleton>` component.
2. Sidebar active-route highlight must be client-side/instant — extract the sidebar nav into a
   `"use client"` component using `usePathname()` (the layout stays a Server Component that does the
   tier gating and passes the resolved nav items / staff info as props/elements).
3. Wrap slow data sections in `<Suspense>` so the shell + sidebar render instantly and data streams.
4. Add `error.js` boundaries per route (graceful in-panel error, not a full-screen crash).
5. Keep queries lean (select only needed columns; limits already exist).

## HARD CONSTRAINTS — do not break
- **NEVER pass a plain function (render prop/callback) from a Server Component to a Client
  Component** — this crashed before ("Functions cannot be passed directly to Client Components").
  Pass pre-rendered elements or use Server Actions. Client components need `"use client"`; server
  pages do the Supabase reads. See `src/components/dashboard/BulkSelectManager.js`.
- `SUPABASE_SERVICE_ROLE_KEY` stays server-only — never import the admin client
  (`src/lib/supabase/admin.js`) into any client bundle.
- Preserve the Server Action forms (approve/reject/shadowban/archive/flag toggles, synthesis
  paste-back, notification send) — restyle, don't remove. They live in each route's `actions.js`.
- Keep tier-based auth gating in `dashboard/layout.js` intact (`getCurrentStaff` + tier filter).
- This Next.js has breaking changes vs your training data — read `node_modules/next/dist/docs/`
  before writing Next code; heed deprecations.
- **Do NOT `git add` / `git commit` / `git push` in the mission-control repo without the founder's
  explicit go-ahead** (standing owner rule, recorded in `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/
  MISSION_CONTROL_REAL_BUILD_STATUS.md`).

## RUN + VERIFY (port 3001)
`npm --prefix mission-control run dev -- --port 3001` → `http://localhost:3001`. `.env.local` has the
keys. Founder is Tier 3 (`jerzelguerra26@gmail.com`); local magic-link redirect is allow-listed.
After changes, verify every sidebar route still loads for a Tier-3 user with no console/server
errors, and clicking between pages shows an instant skeleton (no frozen delay). Check the devtools
console for hydration warnings and fix them.

## DELIVERABLE
A cohesive premium redesign of the shell (sign-in, sidebar, top bar, page frames) and all module
pages in ScoutIt's dark-gold DNA, with instant-feeling navigation (loading skeletons + streaming +
client active-state) and graceful error states — every existing route, form, and auth rule still
working. Report which files you added/changed and the verification results per route.
