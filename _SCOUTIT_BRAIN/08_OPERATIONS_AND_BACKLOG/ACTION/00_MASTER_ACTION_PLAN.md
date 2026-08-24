---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, action-router, execution-control]
updated: 2026-08-24
related: ["[[URGENT]]", "[[ACTIVE]]", "[[WAITING]]", "[[MASTER_OWNER_ACTIONS]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]]", "[[RULES]]"]
---

# ScoutIt Master Action Plan

> **This is the only execution router. It is not a task ledger.** Start here,
> then open exactly one linked queue. Never execute work from specifications,
> implementation records, handoffs, comments, or the legacy Inbox.

## Mandatory documentation transaction

No implementation starts without a stable task ID in exactly one authorized
queue. No turn ends without updating that same task to its truthful state:
current, waiting, owner-gated, deferred, or Done with evidence. Code, data, UI,
operations, and documentation changes all follow this rule. See [[RULES]] Part C.

## Direct Codex execution

Codex executes authorized work directly from exactly one live Action queue item,
verifies its own changes with runnable evidence, and updates that item's truthful
disposition before ending the turn. Historical agent-workspace packets are
implementation records only and assign no work. See [[RULES#PART D — DIRECT CODEX EXECUTION|RULES Part D]].

## Current truth — 2026-08-24

- Production baseline: `origin/main` remains at `1daddbb` after
  the owner-approved 2026-08-23 push. The items below are **not** in that commit.
- The pre-pilot stabilization gate closed 2026-08-22. U-001 through U-007 are
  in [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]].
- **U-008, U-009 and U-010 were opened and closed on 2026-08-23.** All three
  were security defects read directly out of current code, each fixed test-first
  and recorded with evidence in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]]. [[URGENT]] is empty again.
- ⚠️ **Nine task IDs are complete locally and NOT pushed.** Local `main` is at
  `b4d704a`, with A-014's one-line typography verification correction complete
  but uncommitted; `origin/main` is still at `1daddbb`. The live site therefore
  continues to carry the stored-XSS, formula-injection, open-write,
  unmetered-spend and hanging-call defects until the owner approves a reviewed
  commit and push. Tracked as O-009 in [[MASTER_OWNER_ACTIONS]].
  **Do not treat the Done ledger as a description of production.**
- U-010's honest-failure work surfaced a live configuration question:
  `AIRTABLE_REACTIONS_TABLE_ID` may never have been set, in which case every
  recorded reaction was silently discarded while the UI confirmed a save. Owner
  check O-010.
- **A-015, A-016 and A-017 were closed on 2026-08-24**, continuing the owner's
  "list of 10" at items 6 (secrets) and 8 (idempotency). [[ACTIVE]] now carries a
  scoreboard for that list: everything still open on it sits behind an owner gate
  (the parked security pass, or migrations in [[WAITING]] W-003) rather than
  behind engineering effort.
- **A-012, A-013 and A-014 were closed on 2026-08-24.** The repository's own
  rate limiter and `fetchWithRetry` now cover the routes that bypassed them, and
  AI Promote degrades to its local pack instead of dead-ending. Independent
  re-verification found and corrected A-014's one sub-12px retry label; the
  complete gate now passes 1,563 unit tests, 518 E2E cases discovered, lint,
  typography, and 3/3 surface locks, followed by a successful production build.
  A-018 through A-023 are now the six Active items.
- **A-018 was promoted from Future on 2026-08-24 after current-code verification.**
  The unfinished QuestIT feature remains parked, but its route gate currently
  fails open when `ai_search` is missing or pre-launch mode is active. Active work
  is limited to fail-closed containment plus regression coverage; it requires no
  migration, credential, visual approval, or QuestIT product expansion.
  The pricing-benefit gap remains Future until the payment-enablement trigger fires.
- **A-019 through A-022 were owner-promoted on 2026-08-24 and verified against
  current code before entry.** They cover the menu/Settings information
  architecture, a Master-Flow-backed Eye guide for Buyer/Owner/Broker journeys,
  retirement of the user-facing development persona with audited transfer of
  eligible private demo authority to the real account resolved from
  `jerzelguerra26@gmail.com`, and bounded consent-safe first-visit warming.
  Public sample/editorial content is not silently converted into a personal
  ownership claim; staff authority is not implied; private data is never
  prefetched; and live ownership mutation must run through audited Mission
  Control rather than a direct provider edit.
- **A-023 was owner-promoted on 2026-08-24 as the canonical Broker Dossier
  workstream.** It converges the Airtable broker page and Supabase broker panel
  into one identity, editor/live preview, generated Current Representations,
  handshake-grounded rating record, sourced statistics, consented structured
  recommendations, inspectable contributions, and one compliant Connect path.
  Raw public screenshots, broker-claimed properties, paid trust, hidden
  composite scoring, and unsupported backfills are excluded.

- Two claims in the original A-012/A-013 text were **wrong and are corrected in
  the Done rows**: `/api/ai/*` and the inquiry paths are not unauthenticated, and
  `src/lib/isochrone.js` was never unbounded. Both originated from greps that
  matched the wrong signal. Verify route-by-route before trusting a scan.
- Monitoring is **not** an open engineering task. Sentry is fully wired in code
  and `/api/health` exists; the DSN value and alert rules are owner/ops state
  owned by L-001. Do not open a duplicate.
- The Showcase stage and its parent navigation are owner-approved and checksum
  locked. A broad Showcase/header redesign is **not** an active task.
- The remaining Showcase control-size question is owner-gated in [[WAITING]].
- The owner retired the Antigravity handoff workflow on 2026-08-23. A-010 was
  cancelled before implementation; Codex now works directly from these queues.
- [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE#L-001 — Launch operations, discoverability, and social readiness|L-001]]
  records the owner-requested launch-readiness workstream for search, analytics,
  Vercel, DNS/CDN/registrar controls, monitoring, and official social accounts.
  It is planning-only and has no execution authority until promoted from Future.

## Execution order

| Order | Queue | What belongs there | Limit |
|---:|---|---|---:|
| 1 | [[URGENT]] | Broken current work, security/privacy defects, pre-pilot blockers | 12 open items |
| 2 | [[ACTIVE]] | Approved engineering work that can proceed now | 25 open items |
| 3 | [[MASTER_OWNER_ACTIONS]] | Decisions, dashboards, credentials, counsel, physical-device checks | 15 current items |
| 4 | [[WAITING]] | Blocked work with a named unblock condition | 25 open items |
| 5 | [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] | Trigger-gated or deliberately deferred work | No build authority |
| 6 | [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/README|Done Index]] | Monthly evidence ledger for closed work | One file per month |

## Task lifecycle

Raw finding → Inbox → verify against code/live state → one live queue → Done.

1. A task has one ID and exactly one active home.
2. New audit findings enter the Inbox first unless current code directly proves
   both the defect and its acceptance test.
3. Moving a task means removing it from the old queue in the same change.
4. Closing a task means removing it from every live queue and adding one concise
   evidence row to the current monthly Done file.
5. Specs describe behavior; they do not contain executable checklists.
6. Historical unchecked boxes are evidence only and never regain authority.
7. If a queue exceeds its limit, split by product domain before adding work.

## Required evidence before promotion

- Current code or connected live-system evidence
- User-visible behavior that is wrong or missing
- Named owner/agent lane
- Acceptance test or observable exit condition
- Dependencies and explicit block reason, if any

## Stop rules

- An owner-approved surface checksum fails.
- A proposed task contradicts newer code, live behavior, or a Done record.
- The task exists in another live queue.
- The item came only from [[08_OPERATIONS_AND_BACKLOG/ACTION/INBOX/README|Legacy Inbox]]
  and has not been re-verified.
