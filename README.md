# ScoutIt

ScoutIt is a premium Philippine spatial-commerce platform for residential,
commercial, short-term-rental, hospitality, restaurant, and event spaces. It is
an intelligence and discovery product—not a generic listings board. The public
experience is dark, cinematic, and location-aware; authenticated workspaces add
private owner, broker, seeker, provider, CRM, calendar, and portfolio workflows.

The canonical public site is `https://scoutit.space`. Legacy Vercel hostnames
redirect to the canonical domain and are not separate product surfaces.

## Repository map

- `src/` — public ScoutIt and authenticated role-based workspaces (Next.js 16.3,
  React 19, App Router).
- `mission-control/` — separate staff-only operations console (Next.js 15).
- `supabase/` — versioned migrations, Edge Functions, and grouped manual SQL in
  `supabase/operations/`.
- `e2e_tests/full-system/` — canonical read-only Playwright launch suite.
- `scripts/` — repeatable audits and verification gates. One-off repair scripts
  do not belong in the repository root.
- `_SCOUTIT_BRAIN/` — local canonical product knowledge. Start at
  `_SCOUTIT_BRAIN/00_START_HERE.md`; tracked implementation records live under
  `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/`.

## Product surfaces

ScoutIt’s spatial descent is a six-layer system:

1. `/layer/orbit` — ranked earned-demand overview.
2. `/layer/stratosphere` — market and spatial intelligence.
3. `/layer/metropolis` — category-based property discovery.
4. `/layer/crust` — professional and provider network.
5. `/layer/mantle` — provenance and system archive.
6. `/layer/core` — authenticated workspace threshold.

`/showcase` is the immersive ranked-property presentation reached from Orbit.
It intentionally uses its own command bar rather than stacking the universal
site header. Its ScoutIt wordmark returns home and its explicit parent action
returns to `/layer/orbit`.

## Data boundaries

ScoutIt uses two systems for different jobs. Do not combine their authority.

- **Airtable is the public read source** for published properties, articles, and
  provider rosters. Public reads go through `src/app/api/cms/route.js`.
- **Supabase owns private state**: authentication, saves, owner drafts, units,
  deals, CRM, calendars, submissions, and operational records.
- **Publishing is the bridge.** An owner-approved Supabase listing is synced to
  Airtable. Airtable’s computed first-publication `Slug` is canonical; app code
  must never write, invent, recycle, or silently replace it.
- **Mapbox performs server-side geocoding.** Radius filtering uses the project’s
  Haversine logic behind the CMS route.

Secrets belong only in ignored `.env*` files. Never put service-role keys,
provider secrets, production tokens, or private user data in source or logs.

## Design and owner-approved surface locks

ScoutIt’s working visual rule is approximately 95% deep darkness and 5% Spatial
Gold. Use the shared CSS variables, readable Geist typography, mono uppercase
instrument labels, restrained glass, and intentional motion. Read `DESIGN.md`
before changing a public surface.

The following owner-approved surfaces are checksum-locked:

- `src/components/board/ShowcaseStage.js` — Showcase composition and navigation.
- `src/app/layer/metropolis/page.js` — approved Layer 3 foreground surface.
- `src/components/descent/BackgroundMetropolis.js` — approved Layer 3 city
  background composition.

Run the lock before and after work:

```bash
npm run verify:surfaces
```

A failure means an approved surface changed. Restore the approved source unless
the owner explicitly requested that exact visual change. Never refresh
`scripts/approved-surfaces.json` during cleanup, formatting, conflict resolution,
or an unrelated fix. For an intentional redesign, preview and verify locally,
obtain explicit owner acceptance, and only then update the recorded checksum.
CI runs this check on every branch push and pull request.

Mock/demo scaffolding remains while ScoutIt is being built and must not be
removed as “cleanup” unless the owner specifically approves its retirement.

## Local development

Use Node.js 20 or newer and the locked dependency tree:

```bash
npm ci
npm run dev
```

The main app runs at `http://localhost:3000`. Run the staff console separately
when needed:

```bash
cd mission-control
npm ci
npm run dev -- --port 3001
```

## Verification

```bash
npm run verify:surfaces
npm run lint
npm run audit:typography
npm run test:unit
npm run test:e2e:list
npm run build
```

`npm run verify` combines the surface lock, lint, typography audit, unit suite,
and E2E manifest validation. `npm run test:e2e` launches the canonical desktop
and Pixel 5 suite. Browser tests may read live Airtable/Supabase data, so tests
must never publish, delete, archive, spend Connects, submit inquiries, or mutate
real rows.

Generated `.next/`, `test-results/`, Playwright reports, scratch captures, local
review queues, and external tool clones are not product source. Keep canonical
launch evidence only in its documented implementation-record location.

## Working agreement

Read `AGENTS.md` before changing code. For architecture or schema work, continue
through `_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md`,
`_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md`, and
`_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md`.

Commit, push, deployment, production-data changes, DNS changes, and external
provider configuration require explicit owner approval. `main` must remain
deployable.
