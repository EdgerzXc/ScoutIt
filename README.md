# ScoutIt

ScoutIt is a premium Philippine space-intelligence platform for residential,
commercial, hospitality, short-term-rental, restaurant, and event spaces. The
public experience is a dark, cinematic directory; the private experience adds
owner, broker, buyer, provider, CRM, calendar, and portfolio workflows.

## Applications

- `src/` — the public ScoutIt product and role-based dashboard (Next.js 16 App Router).
- `mission-control/` — the separate staff-only operations console (Next.js 15).
- `supabase/` — versioned migrations, Edge Functions, and grouped manual SQL under
  `supabase/operations/`.
- `e2e_tests/full-system/` — the canonical read-only Playwright launch suite.
- `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/` — tracked active, historical, and
  reference implementation packets that previously cluttered the repository root.

## Data boundaries

- **Airtable** is the public read source for published properties, articles, and
  provider rosters. Public reads go through `src/app/api/cms/route.js`.
- **Supabase** owns authentication, private user state, owner drafts, units,
  deals, CRM, calendars, and operational data.
- Publishing bridges Supabase to Airtable. Airtable's computed `Slug` field is
  the source of truth; application code must never write or invent it.

Read `AGENTS.md` before changing code. For architecture or schema work, use the
local `_SCOUTIT_BRAIN/00_START_HERE.md`, then its structure, data dictionary,
and user-flow documents.

## Local development

Use Node.js 20 or newer and install the locked dependencies:

```bash
npm ci
npm run dev
```

The main app runs at `http://localhost:3000`. Environment secrets belong only
in ignored `.env*` files. Core integrations require Supabase, Airtable, and
Mapbox variables; optional features add Sentry, Upstash, Google/Gemini,
Anthropic, Turnstile, and calendar OAuth variables.

Run the staff console independently when needed:

```bash
cd mission-control
npm ci
npm run dev -- --port 3001
```

## Verification

```bash
npm run lint
npm run test:unit
npm run test:e2e:list
npm run build
```

`npm run verify` runs lint, unit tests, and validates the E2E test manifest.
`npm run test:e2e` launches the canonical desktop and Pixel 5 browser suite.
Those browser tests may read live Airtable/Supabase data, so they must never
publish, delete, archive, spend Connects, submit inquiries, or mutate real rows.

Deployment, commits, pushes, and production data changes require explicit owner
approval.
