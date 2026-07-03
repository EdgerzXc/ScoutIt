# 🔮 QuestIT — FUTURE DEVELOPMENT. DO NOT BUILD, FIX, OR TOUCH.

> **Owner instruction (2026-07-03): leave QuestIT alone unless we explicitly say we're starting
> QuestIT work.** This folder exists specifically so that stops being ambiguous — QuestIT's
> unfinished pieces (a missing DB migration, two "broken-looking" API routes) kept resurfacing
> as if they were bugs in ScoutIt itself. They aren't. Read this file before touching anything
> with "questit" in the name.

## What QuestIT actually is

QuestIT is **not a ScoutIt feature** — it's a **separate, standalone product**: a hybrid
quest-app/website "Bounty-as-a-Service" platform for the gig economy, meant to be used by
**many companies, not just ScoutIt**. Per the existing vision docs (this is not new context,
just consolidated here):

- `01_IDENTITY_AND_VISION/NEW_IDEAS.md` §7 ("QuestIT Standalone Protocol"): *"QuestIT is
  decoupled from ScoutIt and acts as a standalone 'Bounty-as-a-Service' API for the gig
  economy... Any business (not just ScoutIt) can hit the `api.questit.network/bounties/create`
  endpoint to summon local freelancers... Companies register as 'Guilds' on QuestIT. Individual
  humans join these Guilds... ScoutIt simply acts as the first client of the QuestIT API."*
- `MASTER_CONTEXT.md`: *"QuestIT — a separate future platform — ScoutIT is just one
  client/company that uses it. QuestIT has its own API + MCP server; companies integrate it via
  policy."*
- Internally, ScoutIt's own use of QuestIT (per `MASTER_CONTEXT.md`'s "Vault Listing Lifecycle")
  is meant to be **invisible to property owners** — when an owner joins the Vault recording
  queue, ScoutIt posts an internal QuestIT quest; if no community member claims it, ScoutIt's
  own team fulfills it. The owner just sees "ScoutIt team records it."

So QuestIT is a whole separate app/company-facing platform that ScoutIt happens to be the first
customer of — not an internal ScoutIt module to finish wiring up.

## Current real state (as of 2026-07-03 — verify before trusting if this is old)

Two ScoutIt-side API routes already exist, written as ScoutIt's bridge into QuestIT once it's
real:
- `src/app/api/v1/questit/raise/route.js` — post a bounty
- `src/app/api/v1/questit/quests/route.js` — list a company's bounties

Both currently fail on every call. **Not because the design is missing** — a real schema exists
(see `questit_api_schema.sql` in this folder, moved here from the repo root on 2026-07-03) — but
because **the migration was written and never actually run** against the live Supabase database.
`questit_api_keys`, `questit_policies`, and `company_quests` simply don't exist yet. The routes'
generic error handling turns this into a misleading `401 "Invalid or inactive API Key"` instead
of a clear "not configured" message — this is exactly what makes it *look* like a bug worth
fixing on sight. It isn't, yet — it's unbuilt-on-purpose infrastructure.

**Known loose end for whenever this does get picked up:** `questit_api_schema.sql` (this folder)
and `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md` (Block 7, same three tables)
disagree slightly — the root schema file scopes RLS to `auth.uid()` per real company/user,
`SUPABASE_REBUILD_GUIDE.md`'s version uses this codebase's usual permissive `dev_all_*`-style
policy. Reconcile these before ever applying either one for real.

## The rule

Don't apply the schema. Don't "fix" `raise`/`quests` to make them return 200. Don't build the
QuestIT app itself. Don't treat the current failure as a ScoutIt bug in a review or an E2E pass —
note it as "parked, see `QUESTIT_FUTURE/README.md`" and move on. Do all of the above **only**
when the owner explicitly says QuestIT work is starting.

## Related

- `_SCOUTIT_BRAIN/01_IDENTITY_AND_VISION/NEW_IDEAS.md` §7 — the standalone-platform vision
- `_SCOUTIT_BRAIN/MASTER_CONTEXT.md` — internal ScoutIt-side usage (Vault queue fulfillment)
- `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/SUPABASE_REBUILD_GUIDE.md` Block 7 — the alternate schema draft
- `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/E2E_TEST_FIX_LIST.md` — where the routes' failure was
  first (mis)flagged as a bug, corrected 2026-07-03
