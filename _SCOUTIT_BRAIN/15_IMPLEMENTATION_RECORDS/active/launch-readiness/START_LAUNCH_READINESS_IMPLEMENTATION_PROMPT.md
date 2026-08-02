---
section: "15_IMPLEMENTATION_RECORDS"
status: active
tags: [implementation-prompt, launch-readiness, lr-01, ai-handoff]
updated: 2026-08-02
related: ["[[LAUNCH_READINESS_MASTER_PLAN]]", "[[MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN]]", "[[FOUNDER_LAUNCH_BUDGET_CHECKLIST]]", "[[SCOUTIT_FULL_WORKFLOW]]"]
---

# Start Launch Readiness Implementation — AI Prompt

> Copy everything below the line into the coding agent while its working
> directory is the ScoutIt repository. This first run deliberately completes
> LR-01 before advancing. Do not ask one agent to rewrite the whole platform in
> one uncontrolled batch.

---

You are the implementation agent for the **ScoutIt Space Intelligence
Platform** in `C:\Users\jerze\ScoutIt`.

Your goal is to move the canonical launch-readiness program forward safely and
procedurally. This is not a generic cleanup, redesign, or brainstorming task.

## Canonical authority

Read these files before changing code:

1. `_SCOUTIT_BRAIN/00_MASTER_SYNC.md`
2. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/LAUNCH_READINESS_MASTER_PLAN.md`
3. `_SCOUTIT_BRAIN/11_SCHEMATICS/SCOUTIT_FULL_WORKFLOW.md`
4. `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md`
5. `_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md`
6. `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/MONTHLY_SCOUT_WRAP_IMPLEMENTATION_PLAN.md`
7. `AGENTS.md`

The launch plan and full workflow contain owner-locked decisions. Do not
re-litigate them because an older checklist, code comment, or historical
handoff says something different. Runtime code still wins when deciding what
is currently implemented, so verify every gap before editing.

ScoutIt has no custom domain yet and is not on the paid Vercel/Supabase
production plans. Complete code, migrations, tests, baseline application
security, and local/private-preview behavior now. Do not buy services, connect
a domain, enable payments, or depend on paid provider-only controls.

## This run's required scope

Complete **LR-01 — Property URL and lifecycle safety** from the canonical launch
plan. Do not start LR-02, LR-03, LR-04, or the Monthly Scout Wrap UI in this
run. You may document an event LR-06 will eventually need, but do not build the
analytics system yet.

The required outcome is:

1. A live property's canonical public URL cannot change silently.
2. Withdraw means off-market, not delete.
3. A withdrawn listing disappears from the ordinary public directory, CMS
   feed, sitemap, search, and normal contact surfaces.
4. Eligible off-market inventory is available only through authenticated,
   entitled access, and contact appears only when the owner enabled “Quietly
   open to offers.”
5. Permanently Remove Listing ends market access but retains historical/audit
   records, the reserved URL, and ScoutIt-owned 3D/Spatial Vault assets.
6. Active deals, appointments, messages, saves, FAQs, units, disputes, and
   referenced records cannot be silently orphaned or erased.

## Safety and repository rules

- Start with `git status --short`. The worktree may already contain owner or
  other-agent changes. Preserve them.
- Never use `git reset --hard`, `git checkout --`, broad deletion commands, or
  destructive database commands.
- Do not stage, commit, push, open a PR, or deploy unless the founder explicitly
  asks in a later message.
- Do not modify live Airtable or Supabase data during diagnosis or tests.
- Write ordered additive migrations for schema changes. Do not apply them to
  the live project without explicit approval.
- Do not create a second public CMS or expose Supabase private rows through the
  ordinary Airtable CMS endpoint.
- Airtable remains the public read CMS; Supabase remains private workflow state.
- Never write Airtable's formula `Slug`, invent a replacement public slug, or
  recycle an old slug.
- Before changing Next.js behavior, read the relevant Next 16.2.12 guide in
  `node_modules/next/dist/docs/`.
- Use the existing ScoutIt design system for any UI changes: dark mode,
  variables, accessible mobile controls, and no raw color additions.

## Step 1 — Re-audit the real implementation

Inspect at minimum:

- `src/app/api/dashboard/publish/route.js`
- `src/app/api/dashboard/update/route.js`
- `src/app/api/dashboard/archive/route.js`
- `src/app/api/dashboard/delete/route.js`
- `src/app/api/cms/route.js`
- `src/lib/airtable.js`
- `src/app/sitemap.js`
- property dashboard/listing action components
- public property and directory contact controls
- all Supabase migrations and operations SQL that reference properties,
  deals, units, appointments, messages, FAQs, saves, disputes, or deletion

Search for every caller of publish, update, archive, delete, and Airtable
approval fields. Check dynamic imports and tests too.

Before editing, write a compact evidence table in your commentary or work log:

```text
Rule | Current behavior | Exact code/schema evidence | Required change
```

Do not copy old audit claims without verifying them.

## Step 2 — Define the minimum lifecycle contract

Use one explicit, documented lifecycle authority. At minimum distinguish:

- draft/private;
- live/public;
- off-market/withdrawn;
- permanently removed/retained internally.

Keep freshness, source verification, broker representation, and staff safety
controls separate from market lifecycle state. Do not overload one boolean to
mean several things.

Design the smallest additive migration that can preserve:

- first-publication canonical slug;
- reserved/previous slugs and redirect history;
- market lifecycle state and timestamps;
- “Quietly open to offers” off-market contact preference;
- retained-removal timestamp/reason/actor and audit trail;
- compatibility/backfill for existing rows.

If the final immutable URL solution requires a new Airtable field or formula
change, do not silently alter the live base. Implement the safest temporary
protection—normally blocking live title changes that would drift the formula
slug—and report the exact founder/staff Airtable schema action needed. The site
must never ship a known silent URL change while waiting.

## Step 3 — Implement canonical URL safety

- Preserve the first public canonical slug in Supabase.
- Stop update/publish flows from replacing it after first publication.
- Prevent ordinary live-title edits from changing the public URL while
  Airtable's formula slug remains mutable.
- Add permanent redirect resolution for approved controlled slug migrations
  only after a durable history exists.
- Ensure old slugs remain reserved and cannot be assigned to another property.
- Keep generated share links, Contact links, sitemap entries, and canonical
  metadata aligned.

Do not claim this is complete if only Supabase is frozen while the public
Airtable feed still exposes the recomputed formula slug.

## Step 4 — Implement Withdraw/off-market

- Replace misleading Archive/Withdraw behavior with the locked market-state
  transition.
- Unpublish the ordinary Airtable record by setting the correct approval field
  false through the existing server-side mapping; do not delete the Airtable
  record.
- Ensure the public CMS feed and sitemap no longer include the property.
- Provide authenticated off-market reads separately from the public CMS.
- Enforce the entitled tiers on the server, not only in the UI.
- Default off-market contact to disabled unless the owner explicitly enabled
  “Quietly open to offers.”
- Remove normal inquiry/Contact controls when contact is not allowed.
- Make repeat withdrawal idempotent and auditable.

## Step 5 — Implement retained permanent removal

- Replace hard row deletion with a guarded retained-removal transition.
- Require explicit UI confirmation that is difficult to trigger accidentally.
- Prevent ordinary reactivation after permanent removal.
- Preserve property history, reserved URL, audit metadata, ScoutIt-owned
  Spatial Vault/3D assets, and legally/operationally required references.
- Block or safely resolve removal while an open deal, viewing, or dispute
  requires the property.
- Define child-record behavior explicitly. Do not rely on broad `ON DELETE
  CASCADE` for business records that must survive.
- Restrict true physical deletion to a separate staff-only retention/privacy
  process that is outside this owner action.

## Step 6 — Tests required in the same change

Add focused unit/API tests and Playwright coverage for:

- first publication freezes the canonical URL;
- title edit cannot drift a live URL;
- old slug redirect/reservation behavior;
- withdrawal removes the listing from directory/CMS/sitemap/contact;
- authorized and unauthorized off-market reads;
- “Quietly open to offers” on/off;
- repeated withdrawal is safe;
- permanent removal retains the row/history/assets;
- active deal/viewing/dispute removal protection;
- anonymous and non-owner mutation rejection;
- dual-CMS partial failure behavior and retry/idempotency;
- narrow mobile confirmation and off-market controls.

Tests must use mocks, fixtures, or an isolated development database. They must
not write to production Airtable or Supabase.

## Step 7 — Verification gate

Run the relevant checks on Windows using `npm.cmd` when needed:

```text
npm.cmd run lint
npm.cmd run test:unit
npm.cmd run test:e2e -- <relevant spec or grep>
npm.cmd run build
```

Also run a migration syntax/rebuild check using the project's established
safe workflow. Do not apply migrations to live data.

LR-01 may be marked `DONE` only when every LR-01 acceptance gate in
`LAUNCH_READINESS_MASTER_PLAN.md` has evidence. If an Airtable schema decision
or live migration approval is still required, mark the package `BLOCKED` or
`FOUNDER ACTION`; do not mark it done because local code compiled.

## Step 8 — Documentation and handoff

After implementation:

1. Update LR-01's state in
   `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/LAUNCH_READINESS_MASTER_PLAN.md`.
2. Mirror the state in `_SCOUTIT_BRAIN/00_MASTER_SYNC.md`.
3. Update `DATA_DICTIONARY.md`, `SCOUTIT_FULL_WORKFLOW.md`, and migration docs
   only where runtime behavior/schema genuinely changed.
4. Record files changed, migrations created, tests run, results, and anything
   requiring founder action.
5. Stop for review. Do not automatically begin LR-02.

## Final response format

Lead with one of:

- `LR-01 COMPLETE` — every acceptance gate passed;
- `LR-01 PARTIAL` — safe progress made, exact remaining work listed; or
- `LR-01 BLOCKED` — founder/schema/external action required.

Then report:

1. what now works in plain language;
2. the exact files/migrations changed;
3. verification commands and results;
4. any safe interim protection still active;
5. any founder action required;
6. the next canonical package, without starting it.

Do not hide warnings in a long narrative and do not claim launch readiness from
lint/build success alone.

