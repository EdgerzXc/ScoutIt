---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [active-work, engineering, pre-pilot]
updated: 2026-08-24
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[WAITING]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Active — approved work that can proceed

> Maximum 25 open items. An agent may work here only after Urgent is stable and
> after re-checking the named behavior against current code.

## Active domain plans

- [[A-023_BROKER_DOSSIER|A-023 — Canonical Broker Dossier and editor]]
  is the complete authoritative plan for the broker master-page workstream.

## A-018 — Fail closed for parked QuestIT endpoints

**Owner outcome:** unfinished QuestIT routes never reach missing tables or paid
provider calls unless the `ai_search` feature flag is explicitly present and
enabled. The broader QuestIT product remains parked in
[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]].

**Current evidence (2026-08-24):** `src/proxy.js` gates the route only when
`flags.ai_search === false`, and only after `pre_launch_free_mode` becomes false.
A missing flag or today's pre-launch default therefore allows `/api/questit` and
`/api/v1/questit/*` through. The v1 handlers read `questit_api_keys`,
`questit_policies`, and `company_quests`, which are deliberately not provisioned.

**Agent lane:** change only route containment and its regression coverage. Do
not create QuestIT tables, enable the feature, or expand its product scope.

**Exit test:** missing and false `ai_search` states return a controlled unavailable
response for every QuestIT route; only an explicit true state passes. Existing
global-read-only behavior, the full verification gate, build, and 3/3 approved
surface locks remain green. No migration or owner credential is required.

## A-019 — Reframe the universal menu and Settings information architecture

**Owner outcome:** the menu and Settings surfaces feel like one deliberate
control system instead of unrelated navigation, profile, display, privacy, and
security panels. A first-time visitor can find Explore, their workspace, Help,
and account controls without knowing ScoutIt's internal layer names.

**Current evidence (2026-08-24):** universal navigation correctly comes from
`src/lib/navigationManifest.js`, but the Eye calls itself Display Settings while
also containing the guide, issue reporting, and hidden development controls.
`/settings` is a long Edit Profile Settings form containing identity, roles,
public-card editing, privacy, password, MFA, badges, and sign-out without a
shared settings hierarchy.

**Agent lane:** preserve the single navigation manifest and identical mobile/
desktop destinations; improve grouping, labels, active state, and handoffs into
Account, Privacy, Security, Display, and Guide controls. Do not introduce a
client-side role gate or duplicate menu definitions.

**Exit test:** every destination still resolves; mobile and desktop share one
manifest; Settings sections are directly reachable and keyboard/focus behavior,
Escape/outside dismissal, `aria-current`, 360px layout, and reduced motion pass.
No Showcase checksum or unrelated header redesign is in scope.

## A-020 — Turn the Eye into a Master-Flow guide and assistance hub

**Owner outcome:** the Eye offers purposeful choices—page help, start/restart a
guided journey, display/accessibility preferences, and report a problem. Its
wizard helps seekers navigate ScoutIt, owners edit their properties, and brokers
connect with owners through the real product paths.

**Current evidence (2026-08-24):** `FloatingToolbox.js` already resolves a
small per-page registry from `src/lib/pageGuides.js`. Separately,
`src/lib/flow/subgraphExtractor.js` and generated `linearGuides.json` already
provide Buyer, Owner, and Broker sequences from the Master Flow Graph. The Eye
does not consume those sequences, track a journey across routes, or verify that
each guide target exists before presenting it.

**Agent lane:** build one public-safe guide adapter over the Master Flow Graph;
select role variants only from `/api/profile/me/role`; expose only executable,
currently shipped nodes with real routes/targets; keep neutral help for signed-
out visitors. Planned graph nodes must be omitted or honestly labelled rather
than presented as working actions.

**Exit test:** Buyer, Owner, and Broker journeys can start, resume across route
changes, skip, finish, dismiss, and deliberately restart. The guide appears
once to a first-time visitor, never blocks use, restores focus, supports Escape
and keyboard navigation, works at 360px, respects reduced motion/Lite Mode, and
has tests proving graph-node/route/target validity plus server-verified role
selection. No guide state grants access or changes an entitlement.

## A-021 — Retire the product dev persona and transfer eligible demo authority

**Owner outcome:** `jerzelguerra26@gmail.com` is the real authenticated owner of
eligible ScoutIt demo properties and their owner-controlled relationships;
visitors can no longer reveal a role/tier switcher from the Eye. Human-testing
sample content remains available and truthfully labelled.

**Current evidence (2026-08-24):** the Eye still contains a five-tap/`?dev=1`
entry that creates the localhost `master-dev` persona and changes apparent
roles and tiers in browser storage. The runtime boundary now limits that persona
to localhost/non-production, but dashboard and test code still depend on it.
Public editorial mocks and example profiles are separate from private Supabase
property ownership and cannot truthfully be assigned wholesale to a person.

**Agent lane:** remove the user-facing development controls and production
query/gesture entry; retain only an explicitly isolated E2E fixture. Add an
audited Mission Control dry-run and execute path that resolves the named email
to its verified Supabase Auth UUID, inventories every `master-dev` reference,
and transfers only private owner-authoritative rows and valid dependent
relationships. Preserve public Airtable/sample/editorial records as labelled
examples unless their schema has a truthful ownership field. Do not hard-code
the email as authorization, grant staff/Mission-Control privileges, bypass RLS,
or mutate providers directly.

**Exit test:** the target Auth account must exist and be uniquely resolved; a
dry-run lists every changed, skipped, and blocked row; the audited operation is
atomic or safely resumable; ownership checks pass as that user; no orphaned
deal/unit/representation references remain; sample disclosures remain; and
`master-dev` is accepted only by the local E2E harness. Live mutation occurs
only through Mission Control and produces an audit record.

## A-022 — Consent-safe first-visit warming for smoother navigation

**Owner outcome:** after the initial page becomes interactive, ScoutIt quietly
warms the small set of public code/data most likely needed next so the first
navigation, guide step, and role handoff feel immediate on a capable browser.

**Current evidence (2026-08-24):** the app has server-side CMS caching, route-
specific caches, dynamic dashboard bundles, and a Metropolis destination
preloader, but no single first-visit policy. Private API responses correctly use
`no-store`, and existing localStorage keys hold explicit preferences or private
device-local state; these must not be replaced by broad prefetching or silent
consent.

**Agent lane:** measure the actual cold path first, then use idle/intent-based
Next route prefetch and bounded public-data warming. Prioritize the next guide
step and universal-shell chunks; cap work by network/device signals and honor
Save-Data, Lite Mode, reduced motion, offline/private-mode failures, and memory
limits. Never prefetch authenticated/private APIs, Connect actions, full media
libraries, third-party embeds, or paid AI calls.

**Exit test:** measured first-transition latency improves without regressing
initial LCP/INP or increasing failed requests; warm work starts only after the
entry surface is usable, cancels cleanly, and has a strict byte/request budget.
No analytics/marketing cookie, fingerprint, location, terms acceptance, or
authentication state is created by preload. Only essential cache/preference
state with documented purpose and expiry may be stored.

## Where the owner's "list of 10" stands

The ten items raised on 2026-08-23 as the ones that actually matter at this size:

| # | Item | State |
|---:|---|---|
| 1 | IAM / authorization | Owner-parked. The security overhaul is one deliberate pass, not a drive-by. |
| 2 | Monitoring / alerting | Code complete (Sentry wired, `/api/health` exists). DSN + alert rules are owner/ops state in L-001. |
| 3 | Rate limiting | Done — A-012. |
| 4 | Caching | Already correct — `cmsCache.js` + Upstash. No task was needed. |
| 5 | Timeouts & retries | Done — A-013. |
| 6 | Secrets management | Done — A-015. |
| 7 | XSS / input validation | Done — U-008, U-009, U-010. |
| 8 | Idempotency | Client half done — A-016, A-017. Durable server half is migration-gated in [[WAITING|W-003]]. |
| 9 | Migrations / schema versioning | Owner-gated — [[WAITING|W-003]]. |
| 10 | Cold starts / serverless limits | Knowledge, not work. Nothing to build at 13 properties. |

Everything still open on that list is behind an owner gate rather than behind
engineering effort. **Do not promote 1, 9, or the server half of 8 without the
owner's explicit go-ahead** — they need migrations or the parked security pass.

## Deployment state

Local `main` and `origin/main` are synchronized through `bab4a06`. The full
release gate passed before the 2026-08-24 owner-approved push. GitHub delivery
is confirmed; production deployment and behavior remain subject to the live
website audit now in progress.

---

## Not in this queue, on purpose

- **Component render tests.** This repo writes JSX in `.js` files, which the
  Vite/Rolldown pipeline vitest runs on will not parse. No component can be
  render-tested today. Fixing it means changing build configuration or renaming
  files repo-wide; A-016 used source assertions instead and recorded the limit.
- **A distributed rate limiter.** `rateLimit.js` is per-instance and says so.
- **The 114 Supabase advisor lints** stay in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] §3.
- **`src/lib/isochrone.js`.** Bounded by its own AbortController; a test pins
  this so it stops being re-proposed as an A-013-style defect.
