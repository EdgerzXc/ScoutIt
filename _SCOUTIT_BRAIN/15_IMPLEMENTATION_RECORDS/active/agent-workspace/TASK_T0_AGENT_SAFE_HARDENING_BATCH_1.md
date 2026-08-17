---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14
priority: "T0"
tags: [task, batch, antigravity, connects, privacy, faq, analytics, freshness]
updated: 2026-08-14
ai-first: true
related:
  - "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4]]"
  - "[[CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3]]"
  - "[[00_MASTER_ACTION_PLAN]]"
---

# Antigravity Batch 1 - Agent-Safe Product Hardening

## Mission

Complete a large, ordered block of local implementation, test, and documentation work without
requesting routine check-ins between stages. Work autonomously through every independent lane.

This batch does **not** accept the Correction 3 completion report as proof of correctness. Codex's
Correction 3 review found unresolved safety defects. Stage 1 below must execute Correction 4.

## Authority and hard boundaries

Authorized:

- Read the repository and local documentation.
- Edit local source, tests, SQL proposals, rollback proposals, and `_SCOUTIT_BRAIN` records needed
  for these stages.
- Run local tests, lint, build-safe source checks, and `git diff --check`.
- Create decision packets for issues that genuinely require owner policy or live evidence.

Not authorized:

- Do not query or mutate live Supabase, Airtable, GA4, Search Console, Cloudflare, or other providers.
- Do not apply any migration or rollback proposal.
- Do not change environment variables, MCP configuration, provider settings, or DNS.
- Do not deploy, commit, push, open a pull request, delete user work, or rewrite unrelated changes.
- Do not expose credentials, tokens, contact information, lead PII, or raw blocked FAQ text in logs,
  tests, telemetry, reports, fixtures, or screenshots.

## Autonomous continuation rule

Do not stop the whole batch because one lane needs an owner decision or unavailable live evidence.
For a lane-local blocker:

1. Mark that lane `owner-action-required`.
2. Record the exact decision/evidence needed and the safe options.
3. Leave runtime behavior fail-closed and do not guess.
4. Continue every other independent stage.

Stop the entire batch only for destructive risk, an unavoidable scope conflict, corrupted workspace,
or a failure that makes later independent work unsafe. Routine test failures are to be diagnosed and
fixed within scope, not treated as a reason to stop early.

## Startup protocol

Before editing:

1. Read `AGENTS.md` and obey it.
2. Read completely:
   - `_SCOUTIT_BRAIN/00_START_HERE.md`
   - `_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md`
   - `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md`
   - `_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md`
   - `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md`
   - `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/WORKFLOW_STATUS.md`
   - `CODEX_REVIEW_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_3.md`
   - `TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md`
3. Inspect `git status --short` and preserve all unrelated user/Codex changes.
4. Before changing Next.js routes or framework behavior, read the relevant local guide under
   `node_modules/next/dist/docs/` as required by `AGENTS.md`.
5. Update `WORKFLOW_STATUS.md` so this batch is the active task. Do not erase prior review history.
6. Create a stage ledger in the final report with: stage, state, changed files, tests, unresolved
   risks, and owner action.

---

## Stage 1 - Execute Connect Ledger Correction 4

### Source of truth

Execute every requirement in:

`_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md`

Do not substitute the Correction 3 report for verification. Reinspect the actual files and tests.

### Required result

- Server-only, exact-true, default-false canonical activation used consistently by onboarding and
  admin refund paths.
- Legacy mode never touches absent canonical or hold tables.
- Manual rollback artifact exists only outside `supabase/migrations/`.
- Pairwise three-store reconciliation is complete and conserves values rather than selecting a
  convenient maximum.
- Current grants are conserved; missing tier/date/role evidence and ambiguous supported roles hold.
- Refunds require an established wallet and return truthfully named balance semantics.
- Multiple unresolved holds and multiple active-role totals are handled.
- Client localStorage conflicts remain versioned, non-spendable evidence until resolved.
- Required focused tests, scans, scoped lint, full unit suite, and diff checks pass.

### Deliverable

Create or complete:

`ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md`

The report must state that migrations, runtime activation, provider changes, deployment, commit, and
push did not occur. Continue to Stage 2 after the local proposal and verification are complete.

---

## Stage 2 - Privacy-Safe FAQ Block Appeal Path

### Problem

The FAQ contact-leak filter can block a user's answer, but the open Master Action Plan says there is
no appeal path. Build the safest locally reviewable path without weakening the filter or retaining
the rejected contact information.

### Investigation first

Trace and document:

- `src/app/api/faqs/route.js`
- `src/app/api/faqs/preflight/route.js`
- `src/app/api/faqs/review/route.js`
- `src/components/property/PropertyFAQSection.js`
- `src/components/dashboard/FAQPreflightPanel.js`
- `src/components/dashboard/panels/FAQReviewQueue.js`
- `src/lib/contactLeakFilter.js` and FAQ telemetry helpers/tests
- Existing Supabase tables, RLS policies, review queues, notifications, and audit facilities that
  might safely support an appeal.

### Required behavior

- A blocked authenticated user receives a stable, non-sensitive block code and can submit a short
  appeal explanation without resubmitting the blocked answer.
- Never store the raw blocked answer, detected email, phone number, URL, handle, or matched fragment.
- Store only the minimum review metadata: authenticated actor, authorized property/FAQ reference,
  rule code/category, sanitized explanation, status, timestamps, and reviewer/action data.
- Enforce ownership/role authorization and RLS/service-role boundaries server-side. Client-provided
  user IDs, roles, property ownership, and reviewer authority are not trusted.
- Rate-limit or otherwise prevent appeal spam using an established project pattern.
- Do not create a second public FAQ publishing path. Successful appeal review must not silently
  publish contact-leaking text or bypass the existing review/preflight workflow.
- UI copy must be clear, dark-mode compatible, accessible, and must not promise an SLA that is not
  documented.

### Schema decision gate

If an existing secure table and policy can represent appeals without semantic abuse, reuse it and
prove authorization with tests. If not, create a timestamped **forward migration proposal** and any
local route/UI code behind a server capability gate that defaults disabled until the schema is
applied. Do not apply it. Record any unresolved policy choice—reviewer group, retention period, or
SLA—as `owner-action-required`, then continue.

### Required tests

- Anonymous appeal rejected.
- Cross-property/cross-user appeal rejected.
- Raw blocked content and detected contact fragments never enter storage/log payloads.
- Duplicate/rate-limited behavior is deterministic.
- Reviewer access is server-authorized.
- Disabled schema/capability fails closed without crashing the existing FAQ flow.
- Existing public FAQ, preflight, privacy filter, and review queue tests remain passing.

---

## Stage 3 - Audited Lead Export and Copy Actions

### Problem

Lead export moves private contact data but currently lacks an auditable record of who exported what,
when, in which format, and for what authorized purpose.

### Investigation first

Trace and document:

- `src/lib/leadExport.js`
- `src/components/dashboard/crm/LeadExportButton.js`
- Callers in `src/components/dashboard/BrokerMode.js` and
  `src/components/dashboard/OwnerMode.js`
- Existing lead/inquiry authorization, accepted-handshake gates, audit tables, RLS policies,
  migrations, logging patterns, and privacy documentation.

Preserve existing CSV formula-injection defenses and encoding behavior.

### Required behavior

- CSV, vCard, clipboard copy, and any bulk export action request a server-side audit authorization
  immediately before releasing PII.
- The server derives the actor from the authenticated session and verifies access to every subject
  lead/property. Never trust role, property ownership, or lead access asserted by the client.
- Record actor, action/format, subject lead identifiers or privacy-safe count/scope, property scope,
  purpose code, timestamp, and success/failure. Do not copy exported names, emails, phone numbers,
  messages, or CSV/vCard bodies into audit logs.
- Bulk export must fail closed if any selected lead is outside the actor's authorized scope.
- Define deterministic audit-failure behavior that follows existing privacy policy. If policy is
  absent, default to blocking release and create an owner decision note; do not silently export.
- Do not allow an audit endpoint to become a lead-enumeration oracle.
- UI must distinguish `preparing`, `authorized`, `downloaded/copied`, and failed states without
  claiming a browser download succeeded when only authorization succeeded.

### Schema decision gate

Reuse a suitable existing immutable audit facility if present. Otherwise create a timestamped
forward migration proposal, RLS/permissions, and local implementation behind a server capability
gate that defaults disabled until schema activation. Do not apply it.

### Required tests

- Anonymous and unauthorized exports fail closed before PII release.
- Cross-property and mixed-authority bulk export fail atomically.
- Audit payload contains required metadata and no PII/body content.
- Audit failure prevents release unless an already-documented policy explicitly says otherwise.
- CSV injection, quoting, vCard, clipboard, and multi-lead behavior remain correct.
- Client state and error copy are truthful and accessible.

---

## Stage 4 - Freshness Rank Modifier Closure

### Problem

`src/lib/freshness.js` emits `rankModifier`, but repository search shows no proven production
consumer. The Master Action Plan requires either wiring it into ranking or retiring the dead signal.

### Required investigation

- Trace all public property discovery/search/map/recommendation ordering paths, including the central
  Airtable proxy and any client sorting.
- Identify the current primary ordering contract and all tests that protect it.
- Determine whether authoritative ScoutIt documentation already approves freshness as a bounded
  ranking input. Do not treat the existence of `rankModifier` as product approval.

### Decision and action

- If the repository contains an unambiguous approved contract, implement freshness only as the
  documented bounded comparator/tie-breaker, preserve deterministic ordering, and add tests proving
  high-relevance listings are not buried merely for age.
- If product weight/order is ambiguous, do not invent it. Create
  `OWNER_DECISION_FRESHNESS_RANKING.md` containing the current behavior, affected surfaces, data,
  two or three concrete options with tradeoffs, a recommendation, and exact acceptance tests. Mark
  this lane `owner-action-required` and continue.
- If evidence establishes `rankModifier` is obsolete, retire it consistently from contracts, tests,
  and docs without changing freshness badges or verification state.

### Required tests/checks

- Deterministic order for equal scores.
- Missing/malformed verification timestamps handled safely.
- No change to Haversine radius filtering or Airtable/Supabase authority boundaries.
- No accidental client/server disagreement in ordering.

---

## Stage 5 - GA4 Event Contract and Caller Reconciliation

### Scope

Do not connect to GA4 or change its dashboard. Audit local instrumentation for these known events:

- `signup_completed`
- `board_save`
- `inquiry_sent`
- `connect_spent`
- `property_published`
- `share_completed`

Inspect `src/lib/analytics.js`, its tests, and every caller found by repository search.

### Required result

- Create one source-level event contract table documenting event, trigger, required privacy-safe
  parameters, allowed optional parameters, and duplicate-prevention expectation.
- Ensure event names are centralized and callers do not send email, phone, person name, message body,
  precise private location, access token, or other PII/secrets.
- Add or improve unit/source-contract tests for event names, disabled/missing GA configuration,
  malformed calls, PII-key rejection or sanitization, and major caller coverage.
- Do not fabricate delivery confirmation. Browser `gtag` invocation is not proof that GA4 ingested an
  event.
- Create `OWNER_ACTION_GA4_KEY_EVENTS.md` with the exact later dashboard actions needed to mark key
  events and validate them in DebugView/Realtime. Keep all provider operations owner-gated.

If robust PII filtering would change an existing public analytics contract, implement the safest
backward-compatible behavior and document it; do not expand tracking.

---

## Stage 6 - Integrated Verification and Handoff

### Required verification

Run, fix within scope, and record exact commands/results for:

1. Focused tests for each changed lane.
2. Scoped ESLint for every changed JS/JSX file.
3. Full `npm.cmd run test:unit`.
4. Relevant local Next.js/build checks when safe and supported by the repository.
5. Source scans for secrets/PII fixtures, stale rollback files in migrations, raw `Math.max`
   conflict selection, and unguarded canonical-table access.
6. `git diff --check` scoped to batch-touched files.
7. Final `git status --short`, separating pre-existing changes from batch changes.

Do not claim success for a command that did not finish or returned non-zero. Record flaky or
environment-limited checks precisely.

### Documentation updates

- Update this task's state and `WORKFLOW_STATUS.md`.
- Update only the corresponding open Master Action Plan lines with evidence-backed status.
- Do not mark an owner-gated or unapplied-schema item complete.
- Preserve earlier review/correction history; never rewrite a rejected report as accepted.

### Consolidated deliverable

Create:

`_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/ANTIGRAVITY_REPORT_T0_AGENT_SAFE_HARDENING_BATCH_1.md`

It must include:

- Executive summary.
- Stage ledger (`complete`, `partial`, `owner-action-required`, or `not-started`).
- Files changed per stage.
- Exact tests/checks and results.
- Security/privacy invariants proven.
- Migration/capability gates created but not activated.
- Owner decisions/actions in one short ordered list.
- Explicit confirmation of no live query/mutation, migration application, environment change,
  provider action, deployment, commit, or push.
- Recommended next Codex review task.

When the report is complete, stop and return a concise summary pointing to the Correction 4 report,
the consolidated batch report, and any owner-decision files. Do not start unrelated backlog work.
