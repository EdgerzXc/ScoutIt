---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, action-router, execution-control]
updated: 2026-08-26
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

## Current truth — 2026-08-26

- GitHub baseline includes the owner-approved release and O-009 action record
  through `e4c5ea0`. Production Vercel, API, Supabase, Airtable, and email
  health were verified live.
- The previous production baseline was `1daddbb` after the owner-approved
  2026-08-23 push.
- The pre-pilot stabilization gate closed 2026-08-22. U-001 through U-007 are
  in [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]].
- **U-008, U-009 and U-010 were opened and closed on 2026-08-23.** All three
  were security defects read directly out of current code, each fixed test-first
  and recorded with evidence in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]].
- **U-008 through A-017 are now pushed to GitHub.** O-009 closed with evidence
  in [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]].
- **The 2026-08-24 production audit is complete.** Ninety-eight desktop/mobile
  route observations, safe HTTP/security probes, repeat performance samples,
  and a 314-case read-only browser subset verified broad public health and routed
  only reproducible findings. U-011's nested-property soft 404s are now released live with production-mode and post-deploy evidence; A-024 through
  A-027 own unlocked semantic/auth-entry/audit-harness/performance work; O-011
  owns Google production-origin configuration; locked Showcase semantics extend
  F-006; partial canonical coverage stays under Future L-001. Evidence and
  false-positive boundaries are in `15_IMPLEMENTATION_RECORDS/active/launch-readiness/PRODUCTION_AUDIT_2026-08-24.md`.
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
  A-023 is the single Active domain plan item (A-020,
  A-022, A-024, A-025, A-026, A-027, A-028, and A-029 are Done; A-021 is Waiting); Urgent is empty
  after U-011's verified closure.
- **A-029 closed on 2026-08-25.** Truthful human voice established across public metadata,
  Footer, Homepage, Terms of Service, JSON-LD Organization schema, and share briefings;
  AI rewrite and assimilate prompts redesigned to prohibit luxury clichés ("bespoke", "curated",
  "panoramic", "seamless", "prestige", "uncompromising", "oasis", "nestled", "boasts", "breathtaking")
  and enforce strict factual grounding with GEO; canonical `VOICE_AND_COPY_GUIDE.md` authored;
  deliberate single-load system display typography verified. 6/6 contract tests,
  focused Help & Display browser coverage, the full gate, production build, and 3/3 surface locks pass.
- **A-027 closed on 2026-08-25.** Production layout stability and foreground workload
  stabilized across directories (`/property`, `/brokers`, `/discover`) and homepage `/`.
  Server-side pre-fetching eliminated SSR hydration CLS jumps; `ProfessionalDirectorySkeleton`
  and base SSR header CSS in `globals.css` prevent reflow; WebGL raymarch throttled; a 3/3
  source contract keeps new skeleton colors tokenized. Fourteen layout tests pass with CLS <= 0.10;
  the full gate, production build, and 3/3 surface locks pass.
- **A-026 closed on 2026-08-25.** Browser audit and full-site audit harnesses
  derive context from the configured target with environment fallback support;
  brand/ScoutIt links are scoped to their owning navigation landmarks;
  interstitial/protected walls are detected and rejected by the render anchor;
  U-011 nested-property 404s and A-024 landmarks are verified in Playwright
  without destructive writes. Eight focused browser cases, the full gate, production build,
  and 3/3 surface locks pass.
- **A-025 closed on 2026-08-24.** One `VerifiedWorkspaceBoundary` now stands in
  front of every `/dashboard*` and `/admin*` page, and `DashboardProvider` is
  identity-first, so a signed-out visitor issues zero private requests and gets
  one accessible sign-in handoff that carries a validated same-site return path.
  Onboarding degrades honestly when Google Identity cannot load. Server
  authorization was not touched. Focused auth tests, 46/46 desktop/mobile dashboard and
  boundary cases, the full gate, production build, and 3/3 surface locks pass; Google origin
  configuration remains O-011.
- **A-018 closed on 2026-08-24.** Every `/api/questit` and `/api/v1/questit/*`
  route now fails closed before pre-launch feature logic unless `ai_search` is
  explicitly true; the route-level helper uses the same disabled default and an
  unexpected flag-resolution error returns the controlled 503 for QuestIT only.
  The broader product and its missing tables remain parked; no migration,
  credential, or paid-provider enablement was introduced.
  The pricing-benefit gap remains Future until the payment-enablement trigger fires.
- **A-028 closed on 2026-08-24 after the full repository ownership audit.**
  Nine dead source/style files, five unreferenced tool captures, one broken
  gitlink, one unused dependency, and one overridden CSS block were removed;
  retained exceptions and verification evidence are in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]] and the canonical
  repository ownership report.
- **A-019 closed on 2026-08-24.** The universal menu now derives Account,
  Explore, Workspace, and Help groups from the one canonical manifest; Settings
  and Contact & Support are first-class destinations, and the Eye is truthfully
  named Help & Display everywhere. `/settings` now exposes stable Account,
  Public profile, Privacy, Security, and Display & guide anchors with mobile-safe
  navigation. Authentication-entry changes remain owned by A-025; the
  Master-Flow journey implementation subsequently closed under A-020.
- **A-021's engineering lane completed on 2026-08-24 and moved intact to
  [[WAITING]].** The hidden Eye persona controls and browser-authority fallbacks
  are gone; only the explicit localhost E2E fixture can use `master-dev`.
- **A-020 closed on 2026-08-24.** Help & Display now separates neutral page
  help from server-selected Seeker, Owner, and Broker journeys derived from the
  Master Flow Graph. The public adapter admits only verified nodes with shipped
  page routes and grounded targets; journey state can resume, skip, finish,
  dismiss, and restart but grants no role or entitlement. The first visit opens
  the non-blocking hub once, and the 360px guide supports Escape, focus return,
  keyboard navigation, reduced motion, and Lite Mode.
  Mission Control now owns a Super-Admin-only dry-run and atomic transfer path
  with unique Auth resolution, complete reference classification, reviewed-plan
  hashing, strict audits, and post-verification. No live ownership was changed:
  A-021 remains open until the prepared migration is owner-approved and the
  exact plan is previewed and executed through Mission Control.
- **A-029 owns the verified voice and display-typography findings from A-028.**
  It covers unsupported market-first/blanket-verification claims, the AI rewrite
  prompt's cliché vocabulary, and the owner-reviewed display-font decision;
  A-023 retains all broker-rating and roster copy authority.
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
- **A-022 closed on 2026-08-24.** A dynamically loaded first-visit warmer now
  starts only after `load` plus browser idle time on capable sessions. It has a
  hard budget of two stable static public route hints, one anonymous public-data
  request, and 32 KiB; Save-Data, slow links, low memory/CPU, offline, Lite Mode,
  reduced motion, private-storage failures, and unmount all fail quietly. The
  projected snapshot carries only three records' slug/title/category/location,
  uses no credentials or cookies, and stores only a six-hour session-cache
  marker. A nine-sample same-build A/B reduced the measured Descent-to-About
  transition median from 390 ms to 371 ms with zero internal request failures
  and no entry timing regression. Dynamic directory prefetch remains with Next.
- **A-024 closed on 2026-08-24.** Discovery now has one meaningful H1 and
  uniquely named Primary/Discovery navigation landmarks; its embedded search
  title is an H2. Descent retains ScoutIt as its one H1 and treats the embedded
  Orbit ranking as an H2 section. Crust's tab panel now uses a neutral `div`,
  and inactive tab indices use the readable secondary-text token. The focused
  axe/heading suite passes 6/6 across desktop and mobile, and the existing Crust
  keyboard/history/responsive/reduced-motion suite passes 8/8 across both
  profiles. No composition, spacing, animation, or locked Showcase surface
  changed; 3/3 surface locks remain intact.
- **A-023 was owner-promoted on 2026-08-24 as the canonical Broker Dossier
  workstream.** It converges the Airtable broker page and Supabase broker panel
  into one identity, editor/live preview, generated Current Representations,
  a primary read-only ScoutIt transaction record, a mathematically isolated
  secondary broker-editable Career History template, handshake-grounded rating,
  consented structured
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
