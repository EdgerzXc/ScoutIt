---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, action-router, execution-control]
updated: 2026-08-27
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

## Standing defect — no application audit write reaches the database (A-046)

> **Kept here on owner instruction 2026-08-27 so it cannot be forgotten.** This
> is a *pointer*, not a second queue entry: **A-046's one home is
> [[WAITING]]**. Do not open a duplicate elsewhere, and do not delete this
> block until the fix is applied and read back.

**The defect.** `public.audit_logs` carries

```sql
CHECK (action = ANY (ARRAY['INSERT','UPDATE','DELETE']))
```

Every action name the application uses falls outside that set, so **every
`writeAuditLog` call in the repository is rejected by Postgres**, at all five
call sites: `deal_close`, `deal_dispute_filed`, `deal_conversation_exported`,
`PROPERTY_VERIFIED`, and `ACCOUNT_DELETED_RIGHT_TO_ERASURE`. The last is the
evidence that an RA 10173 right-to-erasure request was honoured, and it has
never been written.

The failure is invisible by design: an audit write must never fail a user's
request, so `lib/auditTrail.js` catches the rejection, logs it, and returns
`{ ok:false }` that nobody reads. Proof rather than inference — `audit_logs`
holds 715 rows and exactly three distinct actions (INSERT 216, UPDATE 301,
DELETE 198), all written by the `audit_record_changes` trigger. **Not one row
has ever come from application code.**

**The fix, written out so it is not re-derived.** Widen the constraint rather
than dropping it — an allowlist that carries the real actions still rejects a
typo, and a typo in an audit action is undetectable once the constraint is
gone. Trigger actions stay in the list; the trigger writes them.

```sql
ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_action_check;

ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_action_check
  CHECK (action = ANY (ARRAY[
    -- audit_record_changes trigger
    'INSERT', 'UPDATE', 'DELETE',
    -- application (src/lib/auditTrail.js call sites)
    'deal_close',
    'deal_dispute_filed',
    'deal_conversation_exported',
    'PROPERTY_VERIFIED',
    'ACCOUNT_DELETED_RIGHT_TO_ERASURE'
  ]));
```

**Any new `writeAuditLog` action must be added to this allowlist in the same
change that introduces it**, or it fails silently exactly like these five did.

**Owner gate.** This is a live schema change and is not authorized by any queue
item — it needs the same approval, backup, verification and rollback discipline
as [[WAITING|W-003]].

**How to close it — the read-back is the point.** After applying, perform one
real deal close and one real conversation export, then
`select action, count(*) from audit_logs group by action` and confirm the two
new actions are present. A migration that "applied cleanly" proves the DDL ran,
not that the write now lands — assuming that is what hid this defect in the
first place.

## Next session — 2026-08-31, Master Mission Control connectors

**Agreed with the owner on 2026-08-30.** The main site is in good shape: the
platform security audit is clean, the public catalogue caching is live and
verified, and Urgent is empty. The next batch is Mission Control, and
specifically the connectors — not new screens.

**Read [[ACTIVE]] "Master Mission Control — four connector gaps" first.** The
evidence is recorded there; it does not need re-deriving.

**The shape of the problem, so it is not mistaken for a UI job.** Mission
Control is deployed and mostly built — 21 pages, 16 server-action modules, RBAC
tiers, 86 audit call sites. In three of the four gaps a well-built console is
wired to the wrong end of the connector, which is exactly why the work looks
finished and changes nothing.

### Order, and why

| # | Item | Why here |
|---|---|---|
| 1 | **A-061** dispute reconciliation | The only one a real user can trigger today. A party can file a dispute that no staff surface can see. It is empty now, so this is fixable before it has a victim rather than after |
| 2 | **A-060** pin correction reaches Airtable | Smallest real fix. The validation and UI already exist; what is missing is the sync a published listing needs |
| 3 | **A-063** system event log | Records what the system does on its own. Do it after A-060 so that fix is observable, and before A-058 because the wrap needs this event history to be reproducible |
| 4 | **A-062** contact reply | Needs an owner decision on the channel before code: email out from the console, route to an authenticated deal room, or change the public promise |

### Before touching code

- Re-verify each defect against current code. All four were verified on
  2026-08-30, but that was a different day and Rule 12 applies to this page too.
- `deal_disputes` and `disputes` are both empty. Confirm that is still true
  before choosing between folding the tables and reading both — a real row
  changes the migration from a rename into a data move.
- Mission Control is a **separate Next.js app with its own Vercel project**
  (`mission-control-sigma-one-89`). It is deployed from the repository, not from
  a working tree. Its verification gate is its own.

### A-062 is owner-gated

Do not build a reply channel before the owner picks one. The current page is
honest about being triage only; adding a reply that lands nowhere would be
worse than the gap.

## Current truth — 2026-08-27

- **A reported conversation is retained forever, and nothing knows it exists.**
  Found 2026-08-27 while designing A-045. The purge job selects
  `status = 'closed'`; the 🚩 Report & Unmatch control writes `'reported'`, so a
  reported thread never enters the candidate set and its messages are never
  replaced — not after seven days, not ever. Retaining evidence is the safe
  direction to fail, but it is *accidental* (a string mismatch in one query), it
  contradicts a published promise with no stated exception, and it writes no
  `deal_disputes` row, so the thread will not appear in the staff queue A-044
  builds. Recorded in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/INBOX/2026-08-27_REPORTED_THREADS_NEVER_PURGE]]
  because the answer is a product decision, not a patch. No user is affected
  today: no thread has ever been reported.

- **A-043 closed 2026-08-27, and verifying it against the live database exposed
  a defect far larger than itself.** The export works and was proven end-to-end
  on a running build (200 for a party, 403 for a non-party, 401 unauthenticated)
  — but its audit row never landed. `audit_logs` carries
  `CHECK (action IN ('INSERT','UPDATE','DELETE'))`, so **every application audit
  write in the repository has always been rejected**, at all five call sites,
  including A-041's dispute filing and the RA 10173 right-to-erasure record.
  715 audit rows exist and every one came from the database trigger. Filed as
  **A-046** in [[WAITING]], with the fix written out in the standing section
  above; the migration is owner-gated. This is Rule 20 and Rule 18 together: the
  constraint was in the live schema all along, and it was only found by auditing
  what a query *writes*.

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
- **The 2026-08-27 full-stack gap audit reopened Urgent with U-012 and U-013.**
  Current code proves that an unowned property skips the freshness authority
  check, and that the staff Verify panel updates Supabase while the public
  Airtable freshness source remains unchanged. Both items have bounded
  acceptance tests in [[URGENT]]. Lower-risk configuration, framework,
  dependency-integration, automation, design-token, and documentation findings
  remain non-executable in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/INBOX/2026-08-27_FULL_STACK_GAP_AUDIT]].
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
  A-022, A-024, A-025, A-026, A-027, A-028, and A-029 are Done; A-021 is Waiting).
  Urgent was empty after U-011's verified closure and now contains U-012 and
  U-013 from the 2026-08-27 audit.
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
  Phase 1's migration-free trust convergence landed on 2026-08-26: legacy
  rating composites and tier/rating roster claims are retired, missing evidence
  is an explicit building-record state, the roster preserves representation
  authority order, and legacy broker-shaped profiles are non-indexed.
  **Phase 2 landed the same day.** The allowlisted public projection now exists
  and the dossier consumes it. Two things were found by checking the live
  systems rather than the documents: Airtable's `BrokerID` already carries the
  broker's Supabase Auth UUID, so representations needed no migration to
  generate; and `/api/cms` was still publishing the retired `rating`,
  `closures` and commercial-tier fields that phase 1 had only stopped
  rendering. The dossier's "no representations" line is now an earned answer
  from the authority rather than a hardcoded empty array, and it is separated
  from the two states that cannot make that claim. The loading state is the one
  phase-2 item NOT delivered — see the Inbox note on stranded route-level
  Suspense fallbacks. The editor/publish, recommendations, contributions,
  metrics, and migration phases remain Active.
- **W-003 was cleared by the owner on 2026-08-27 and every prepared A-023
  migration is applied to the live ScoutIT project** (`yyixsuaimdzyiocswcgc`).
  Six tables and three functions now exist: broker dossier drafts + audit,
  recommendations, contributions, social-proof audit, and metric snapshots. All
  are RLS-enabled with **zero policies**, revoked from anon/authenticated and
  granted only to `service_role`; every `SECURITY DEFINER` function is
  `search_path`-pinned and service-role only. Verified against
  `information_schema` rather than the migration text (Rule 20). Phases 3, 4 and
  5 are therefore verifiable against real data for the first time.
- **A-023 was re-audited against Philippine law (RA 9646) on 2026-08-27 and one
  latent defect was fixed.** The dossier serves Philippine real estate practice,
  so it was checked against the Real Estate Service Act and DHSUD/PD 957 rather
  than against general assumptions. **The PRC badge ignored expiry:**
  `licenseVerified` was a single Airtable checkbox ticked once by staff, and
  nothing in the public projection consulted `user_profiles.prc_expiry` — which
  Supabase already stores and the dashboard already collects. Since a PRC broker
  licence is valid for three years, a lapsed registration would have rendered
  "✓ PRC VERIFIED" indefinitely and, after phase 6, emitted
  `"@type": "RealEstateAgent"` with a credential block into structured data.
  The badge and the licensed-profession claim now both depend on the expiry
  date, with three states: current (claims allowed), lapsed (stated plainly,
  number withheld), and verified-but-undated (says when it was checked and
  claims nothing about today). **The defect was latent, not live** — zero users
  have a recorded expiry and `prc_verified` is false for all three brokers, so
  no badge renders today; the fix stops it activating the first time staff
  verify somebody. Gate green at 1,845/1,845.
- **RULES.md Part B was corrected on 2026-08-27 and now records the Anthropic
  skills.** Two findings, one owner question. The owner asked whether
  `github.com/anthropics/skills` was installed: it is not, and it must not be.
  No registered marketplace points at it, `installed_plugins.json` holds five
  plugins and none is it, and nothing matching exists on disk — but its skills
  ship with Claude Code and are already invocable under the
  `anthropic-skills:` namespace. Cloning it would shadow maintained skills with
  a frozen copy, and the failure would be silent. `pdf` and the Office skills
  are called out as load-bearing for the owner-PDF-to-listing path and the
  broker briefing print layout rather than as incidental extras.
  **The second finding was not asked for and matters more:** Part B ordered
  every component author to load `make-interfaces-feel-better` and `motion-ui`,
  and **neither has ever existed** under any name. A binding rule pointed at two
  missing files, so the only way to comply with Part B was to ignore part of it.
  Motion guidance now names skills that resolve, and the section distinguishes
  invocable skills from the `.agents/skills/` reference files it had conflated.

- **A-041 was built and closed on 2026-08-27, and it spawned the rest of its
  chain.** A party can now file a dispute, and the same write that records it
  places the hold that stops the conversation being purged. Filing and holding
  are deliberately one insert: a hold applied by a later call can lose a race
  with the nightly purge, and what it loses is the evidence it exists to
  protect. Seven guards were mutation-tested; **two survived the first attempt
  because the tests were wrong rather than the code** — one matched text from
  the wrong region of the file, the other asserted that constants were imported
  rather than that the guard ran. Both re-mutated red after being tightened.
  **It is a route with no screen and no way to close a dispute**, so three
  follow-ons are queued rather than implied: **A-044** gives staff a review and
  resolution surface — without it every hold stays open forever, which quietly
  turns a published seven-day retention promise into permanent for that thread;
  **A-045** is the on-screen way to file, without which the route repeats the
  very defect it fixed; and **A-043** is the conversation download the owner's
  whole retention model rests on.
  **Execution order for this chain: A-043 → A-045 → A-044 → A-038 → A-042.**
  The download comes first because the retention decision assumes it, and the
  AI adjudication stays last and trigger-gated on counsel.
  **A-043 and A-045 both closed on 2026-08-27** with evidence in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]]; the chain is now at
  **A-044**, the staff review surface. A-045 also closed two boundaries A-041's
  own record left open: the route now has a caller, and **the hold was watched
  stopping a real purge** — `{purged:0, heldByDispute:1}` with the hold in
  place, `{purged:4, eligibleDeals:1}` once resolved, on an owner-approved
  fixture that was deleted afterwards. A-041's Done row is annotated rather than
  reopened.

- **The retention question was settled on 2026-08-27: option 1, the dispute
  window is bounded by retention.** No published promise changes, no automatic
  holds. The owner's model is that ScoutIt is not a long-term archive of private
  conversations — each party downloads and keeps their own copy outside ScoutIt,
  and the platform does its due diligence inside the seven days, encouraging fast
  disputes so they are settled while the record still exists.
  **Checking that premise found the same shape of gap for the third time, and
  A-043 closed it the same day.** The owner believed the download already
  existed; it did not — no export route, no download control, no transcript
  generation, with "transcript" appearing only in three code comments. Until it
  shipped, seven days after close the messages were gone for everyone
  **including the two people who wrote them**. `GET /api/deals/[id]/export` and
  the Download copy control now make "we don't keep it, they do" true, so the
  retention decision rests on something real. Two consequences are written into
  A-038: the dispute window must be stated when someone rates, not discovered
  afterwards, and closing a deal now does prompt both parties to save their copy
  while the thread is whole.

- **A-042 was recorded in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] on
  2026-08-27**: AI-assisted, evidence-based dispute adjudication with a human
  gate, and counsel retained for the standard. Trigger-gated on A-041 existing
  and counsel engaged — it confers no build authority. The owner's rationale for
  all-time permanence is recorded with it: a broker's record follows them, that
  is what makes the signal worth reading, and the dispute inbox is the
  counterweight rather than leniency in the metric.
  **Two hazards are written into the task rather than left to be discovered.**
  First, the evidence is attacker-controlled text: a dispute is adjudicated
  against a conversation written by the two parties, one of whom wants an
  outcome, and a party can type instructions to the model directly into the chat
  months before any dispute exists. Message bodies are untrusted data, never
  instructions, and the prompt must be structurally incapable of taking direction
  from what it reads — it is the cheapest attack on the whole mechanism and costs
  the attacker one sentence. Second, the model proposes and a human disposes, with
  no automated removal even in obvious cases: a determination affects a licensed
  professional's reputation and livelihood, so the human gate must be one that
  returns "disagree" in practice, and that should be measured rather than assumed.
  The seven-day retention question becomes sharper here, not softer — an
  adjudicator reasoning over a purged thread produces confident nonsense, so the
  retention decision is settled before this is built.

- **A-041 was opened on 2026-08-27, and it is the most consequential finding of
  the day.** The owner chose all-time satisfaction with no recency decay, on the
  grounds that sympathy for a broker must not degrade the signal buyers rely on;
  the remedy for an unfair response is evidence-based removal, adjudicated by
  staff against the retained conversation. Checking that premise found the
  infrastructure half-built in a specific and dangerous way. `deal_disputes` is
  live and correctly shaped, and `purge-chat-messages` genuinely exempts any
  thread under an `open_hold` or `under_review` dispute — reading the holds
  rather than the deal row, because a dispute is filed against an already-closed
  deal. **But a search for writers to `deal_disputes` returns one file: the purge
  job, which only reads it.** Nothing can file a dispute, so no hold is ever
  placed, so every closed thread's message bodies are replaced seven days after
  close, unconditionally. A party who is defrauded or threatened cannot stop the
  only record of it being overwritten. That is the third producer/consumer gap
  found this week (Rule 13) and it is independent of A-038 — dispute holds
  protect fraud and harassment cases, not only feedback. A-038 is simply the
  first feature that needed it and therefore the one that exposed it.
  It also forces a decision the owner must make with counsel: satisfaction
  responses are permanent, but the evidence to overturn one lives **seven days**.
  Either the dispute window is bounded by retention (changes no promise), or a
  negative response places an automatic preservation hold, or a bounded evidence
  bundle is snapshotted at submission — and the last two extend retention beyond
  what Privacy section 04 publicly promises. The Bible's shorthand that chat is
  "ephemeral, deleted on close" also understates the implemented rule: seven days
  after close, bodies only, rows retained.

- **A-038 was promoted to [[ACTIVE]] on 2026-08-27 by owner direction, and it
  closes a producer gap that cannot close itself.** After a completed handshake
  or deal, the counterparty — buyer, owner or client — should be offered a place
  to say how the broker performed, routed through approval before it appears.
  The gap is proven rather than asserted: `/api/broker/recommendations` and
  `/api/broker/contributions` are authorization-correct and tested, and **a grep
  for callers returns only their own test files**. Every recommendation visible
  on a dossier today was written straight into Supabase by an operator. Rule 13,
  exactly — an endpoint with no caller is a plan, and recommendations can never
  appear on their own however many deals complete.
  **The rating question was settled by the owner the same day: no rating, a
  satisfaction level instead.** Four ordered faces — angry, sad, smile, happy —
  captured in one tap after a completed handshake and published as ScoutIt's own
  health metric above a floor of five responses. The computation is a **positive
  share reported with its denominator**, never an average: assigning 1-4 to those
  labels would assert that sad-to-angry is exactly as large a step as
  smile-to-happy, which is not a measured quantity, and averaging ordinal labels
  is how a satisfaction level quietly becomes a 4.2-out-of-5 star rating. The
  full distribution ships beside the headline, because two brokers can both read
  75% positive while only one of them has angry responses.
  Two findings came out of specifying it. **The obvious green-to-red scale fails
  accessibility** — run through the palette validator, the two middle faces sit
  at ΔE 2.7-4.4 for deuteranopes, and those are exactly the two that decide
  whether the reading is positive or negative; the validated replacement is a
  blue-to-red ordered ramp at ΔE 17.2. And the anti-slop ban on emoji as
  production iconography was classified by the owner as a purposeful default
  rather than a lock, so this surface earns its way out deliberately — with drawn
  assets, never system emoji, which cannot be styled or named accessibly.
  The G6 boundary still holds and is now written down: this mixes nothing else
  in, weights nothing, and produces no ranking. Historically the plan said: phase 1 retired the legacy rating
  composites, `aggregateRating` is withheld because Google renders it as stars
  the page refuses to show, and the single Scout Rating composite (G6) stays
  unbuilt pending a published formula, anti-gaming review and separate owner
  approval. A-038 therefore captures structured written feedback and consented
  attribution, and introduces no public score. A visible rating remains G6 and
  needs its own decision — building it inside A-038 would restore through the
  back door what phase 1 removed from the front.
  It is also honestly unverifiable against real data today: every deal table
  holds zero rows, so no prompt can fire from real activity and the first real
  deal is the true test.

- **A-037 closed on 2026-08-27.** The ScoutIt Record is now readable at a glance
  beside the advisor's identity, on the dossier and in the editor preview that
  shares the identity block. The design constraint was that the three metrics
  carry **incompatible units** — a count, a percentage and a duration — so they
  are not drawn against one axis: transactions get one tick per transaction, the
  response rate gets the only honest meter (a true ratio against 100), and the
  median reply gets a figure with no bar, because its only defensible
  denominator is the 24-hour window and 26 minutes inside 1,440 renders as an
  unreadable sliver. The detail panel's numeric list was removed as duplication,
  which is safe only while any publishable metric guarantees the chart renders —
  an invariant now pinned by an exhaustive test rather than assumed. Suppression
  is proven: a below-floor sample can never be drawn as a bar. Gate green at
  1,901/1,901. **The queue transaction ran out of order** — the work was directed
  mid-session and built before an Active entry existed, with the ID reserved in
  code first. Recorded rather than quietly closed. Two presentation defects and
  the orphaned left panel are carried forward.

- **A-036 closed on 2026-08-27**, promoted from GAP-04 in the full-stack gap
  audit. The Buyer and Broker dashboard maps rendered a
  `unpkg.com/maplibre-gl@4.7.1` stylesheet on top of the bundled 5.24 CSS they
  already imported. What made removal safe was countable rather than assumed:
  eleven components import the bundled sheet and **nine already ship with only
  that**, so the CDN link was a workaround that outlived the 4-to-5 upgrade.
  The bundled sheet was then asserted to define the control, popup and marker
  rules directly. RED/GREEN and mutation proofs both ran, including one
  mutation whose only purpose is to stop the guard passing vacuously on a file
  with no MapLibre CSS at all. Browser-verified on `/transit`: bundled chunk
  only, zero unpkg requests. **CSP was deliberately left alone**, because the
  consumer inventory the task required turned up a third `unpkg` user GAP-04
  had missed — `InteractiveMap.js` loads Leaflet CSS *and JavaScript* from the
  CDN with no SRI, live on public property pages. That is filed as new Inbox
  evidence rather than fixed, since bundling, adding SRI and migrating to
  MapLibre are three different changes with three different risks.

- **A-031 and A-032 were promoted and closed on 2026-08-27**, and what they
  found matters more than what they fixed. The first-visit Help & Display panel
  covers ordinary page controls on a phone; the owner chose an outside-press
  dismiss that passes the press through. **The implementation already existed
  in the working tree** — a capture-phase handler with focus restoration and an
  Escape guard, written by an earlier session that used the IDs `A-031`/`A-032`
  in a test title without ever opening either task. It was uncommitted,
  untested and unowned; `git show HEAD` has zero occurrences of
  `handleOutsidePointer`, so production still carries the defect until the tree
  is committed. **Two process failures are worth more than the fix.** First, the
  promotion entry itself claimed no dismiss existed — a grep matched style names
  rather than behavior, the same failure shape already recorded for A-012/A-013.
  Second, an earlier session shipped code, wrote a test naming two task IDs, and
  completed no documentation transaction, which is precisely what RULES Part C
  forbids; the IDs are now recorded so they cannot be silently reused. The
  contract test went from 2 assertions to 12, every one mutation-tested and
  watched red — and the first mutation attempt **passed**, exposing that the
  test, not the code, was wrong. Evidence and boundaries are in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]]. Active is empty of
  engineering work again; A-023 remains for owner visual review only.

- **O-013 was opened for the two RA 9646 findings that are product decisions.**
  ScoutIt has no real estate **salesperson** role, although RA 9646 makes them
  accredited rather than licensed, requires a named supervising broker, forbids
  independent selling, and caps twenty per broker — so a salesperson signing up
  today would be carried as a "broker". And `dhsud_number` is collected but
  deliberately unpublished, because DHSUD certificates renew annually with no
  expiry column to check. Neither is broken today; both become real the moment a
  salesperson applies or a subdivision/condo project is listed.

- **A-023 audit gaps G2 and G4 were closed on 2026-08-27, completing every gap
  that engineering can close.** G4: Career History ships as a genuinely separate
  secondary template — its own table with no join to `broker_metric_snapshots`,
  a projection that imports nothing from `brokerMetrics.js` and takes no
  snapshot argument, and a UI that always renders after the ScoutIt Record at a
  lower visual weight. Contract tests pin the isolation in both directions at
  storage, projection and UI. Every claim needs a unit, both coverage dates, a
  source note and an explicit attestation; publication without attestation, a
  review with no named reviewer, a backwards period, and a valueless claim are
  all rejected by the database — proven live inside a rolled-back transaction,
  leaving the table at zero rows. G2: `/api/broker/contributions` credits and
  retracts contributions, staff-only by design, because a broker-facing form
  would let a self-declared claim wear a platform-credited label. Artifact paths
  are validated with the public projection's own resolver, so a row that could
  never render is never stored.
- **A-023's remaining open items are not engineering work.** G5 needs Airtable
  `BROKERS_CMS` columns (owner/staff schema change; the editor already states
  honestly which fields cannot publish), and G6 — a single Scout Rating
  composite — stays deliberately unbuilt pending a published formula,
  anti-gaming review and separate owner approval.

- **A-023 audit gaps G1 and G3 were closed on 2026-08-27.** G3: the metric
  recompute had no caller (Rule 13), so `/api/cron/recompute-broker-metrics` now
  runs daily behind `authorizeCronRequest`, reporting `recomputed` and `failed`
  separately so a partial sweep is never called clean. The repo's own cron guard
  had the same blind spot that created G3 — it asserted two hardcoded paths — so
  it now enumerates the cron directory from disk and requires each route to be
  registered or explicitly allowlisted (`osint-scraper`, disarmed, is the one
  exception); the new assertion was mutation-tested red. G1: recommendations can
  now be submitted, moderated and withdrawn. Author identity, verified-connection
  status and moderation state are all resolved server-side and rejected as
  unknown keys if a client sends them; consent must be an explicit boolean and is
  stored with its timestamp; a submitter must already hold a deal with the broker.
  Moderation is staff-only, withdrawal is author-only, and a withdrawn row is
  retained so the consent record survives — a moderator cannot approve past a
  revoked consent. Gate green at 1,795/1,795 with all three routes in the build.
- **O-012 was promoted to Master Owner Actions on 2026-08-27.** Running the new
  cron for real proved the previously-unverified duplicate `CRON_SECRET`: the
  first value in `.env.local` returns 401, the second returns 200, and the two
  differ. Four scheduled jobs share that secret, so if Vercel holds the dead
  value all four fail silently every night. Owner check required.

- **A-023 phase 6 landed on 2026-08-27, and the full line audit is complete.**
  Metadata, OpenGraph/Twitter, canonical, robots policy, JSON-LD, Lite/reduced-motion
  verification and a verified rollback path all shipped. Structured data withholds
  two claims deliberately: an unverified broker is a `Person`, never
  `RealEstateAgent` (the RA 9646 trap the site-wide schema already fell into and
  corrected in August), and `aggregateRating` is never emitted because Google
  renders it as stars the page itself refuses to show. **All three live brokers
  are example accounts, so `/brokers/*` currently serves `noindex, follow` with
  zero broker JSON-LD** — verified in the served HTML, and load-bearing because
  `/brokers/` is not in `robots.js`'s disallow list. A metadata/page divergence
  was also closed: both now resolve the broker through one `findPublicBroker`.
  **The audit fixed two real gaps and recorded six open ones.** Fixed: the
  biography had no provenance label although A-023 requires every public card to
  declare its source, and the editor offered eight fields Airtable has no column
  for, so a broker could fill them all in and be refused at publish. Open, in
  priority order: no recommendation submission/moderation interface (G1) and no
  contributions producer (G2) — both Rule 21 producer/consumer gaps; nothing
  calls `recompute_broker_metric_snapshot` (G3, Rule 13); Career History unbuilt
  (G4); eight broker fields need Airtable columns (G5, owner-gated); and no
  single Scout Rating composite exists (G6, correct by design). Verified clean:
  no public contact bypass and no deal/message/buyer data reachable from any
  broker projection.

- **A-023 phase 5 landed on 2026-08-27.** The ScoutIt Record is computed, not
  hardcoded. **Reading the live database changed the design**: every input is
  empty (`deal_handshakes`, `deals`, `deal_messages`, `deal_disputes` all 0
  rows), so a parallel event ledger would have produced the sentence already on
  screen. None was built — the existing deal tables *are* the audited sources
  and a snapshot is a reproducible cached aggregate over them (Rule 2, 13, 21).
  Qualification is SQL-enforced: transaction handshakes only, both parties
  signed, self-dealing and non-dismissed disputes excluded, `DISTINCT deal_id`
  so a retry cannot double-count. Below a 5-inquiry sample a metric is
  suppressed rather than rounded, and the guard was mutation-tested.
  **Demo data is seeded for the three `is_example_account` personas only**, by a
  SELECT filtered on that flag (no id literal to mistype), marked
  `source = 'example_seed'`, and recompute returns such rows untouched so demo
  numbers can never be laundered into computed ones. Live check: 0 real accounts
  hold a snapshot. One precondition was fixed first — the canonical dossier
  never labelled example profiles although the directory always did, so it now
  says "Example profile · illustrative data, not a real advisor record".
  Browser-verified live: Marco 6/89%/38min each with its sample, Isabella's
  response metrics **suppressed at sample 3**, Daniel "Building a ScoutIt
  record". Boundary: no scheduled recompute job exists yet, and response metrics
  are exercised only through seeds until the first real deal.

- **A-023 phase 4 landed on 2026-08-27.** Client Recommendations and ScoutIt
  Contributions ship as two independent authorities with their own projections,
  fail-closed readers, four-state sections, and prepared schema. Attribution is
  the privacy boundary and is written to fail closed: an unrecognised
  attribution mode resolves to **Anonymous client**, never to the name, and the
  guard was mutation-tested — rewriting it in the negative form Rule 6 warns
  about leaks the real surname in three modes and turns three tests red.
  "Verified ScoutIt connection" is earned only by a qualifying two-sided
  handshake; everything else says **Client-submitted · unverified** rather than
  going unlabelled. A contribution whose artifact cannot be opened is not
  published, enforced in both the app and a schema `CHECK`. Private evidence and
  client identity are protected by never being selected, and the migration
  enables RLS with no policy on all three tables. 37/37 focused tests, full gate
  green, production build compiles. **Both sections' read-failure state was
  verified against genuinely absent tables**, and the listed state was verified
  with a temporary fixture (removed) proving the anonymous author's surname, the
  pending-moderation row, and an off-site contribution never reach the HTML.
  Boundary: the tables await W-003, so every live dossier currently renders the
  read-failure state; submission/moderation interfaces are not built.

- **A-023 phase 3 landed on 2026-08-26.** `/brokers/portal`, until now only a
  redirect, is the broker dossier editor: structured left editor, exact public
  preview right, autosaved private draft, explicit publish. The preview is exact
  structurally rather than by promise — the public identity block was extracted
  verbatim into one shared component that both the canonical dossier and the
  preview render, so the two cannot drift.
  Two defects surfaced by running the editor rather than reading it, both
  presenting as a permanently dead preview pane: the route computed the public
  identity and then discarded it in every response, and the broker lookup used a
  raw `===` beside an ownership gate that lower-cases first, so an uppercase
  Airtable `BrokerID` would pass authorization and resolve to no broker at all.
  The dossier's loading state also shipped, closing the one item phase 2 carried
  forward. **Both A-023 Inbox notes are resolved and neither was a defect.** The
  `loading.js` "stall" is a hidden-tab artifact — React schedules the Suspense
  reveal with `requestAnimationFrame`, which a browser never fires in a tab
  whose `visibilityState` is `hidden`, so the automation pane strands every
  streamed boundary while real users are unaffected. The `.sr-only` report was a
  false positive: it is a Tailwind-generated utility and the original grep
  searched only `*.css`, where a generated utility cannot appear. **Standing
  lesson worth more than either finding: a background browser tab does not tick
  `requestAnimationFrame`, so any check of streamed-content visibility measured
  there is unsound** — the same class of trap as the existing RULES warning that
  background tabs do not tick CSS transitions.
  Publish fails closed on the eight structured fields with no confirmed Airtable
  target — they autosave privately and wait for an owner-approved CMS schema
  instead of being dropped or invented. Full gate green (3/3 locks, lint,
  typography over 491 files, 1,682/1,682 unit tests, 574 E2E cases) plus browser
  verification at 375px/1280px. **The authenticated path is unverifiable in a
  browser today**: `broker_dossier_drafts` does not exist until W-003 is applied,
  so every signed-in load returns the migration notice the editor renders. A-023
  stays Active for recommendations, contributions, metrics, and migration.

- **A-030 closed on 2026-08-26.** The committed tree was failing its own
  typography gate: commit `1daddbb`..`1a2aae8` shipped an 11px interface label
  in `CommercialFlow.js` without re-running `npm run audit:typography`. Fixed to
  the file's own 12px convention. Worth noting as a process signal — the gate
  only protects what actually runs it.

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
