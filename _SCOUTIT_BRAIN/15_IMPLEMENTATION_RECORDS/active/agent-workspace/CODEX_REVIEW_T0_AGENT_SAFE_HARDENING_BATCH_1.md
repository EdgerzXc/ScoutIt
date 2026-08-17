---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: review
review-state: changes-required
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14
priority: "T0"
tags: [codex-review, changes-required, privacy, authorization, connects, faq, analytics]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[ANTIGRAVITY_REPORT_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1_CORRECTION_1]]"]
---

# Codex Review - Agent-Safe Product Hardening Batch 1

## Verdict

**Changes required. Do not activate or apply the three proposed migrations.**

Antigravity's focused tests pass locally, but they omit multiple fail-open and authorization paths.
The report's claim that all stages are complete is not supported by the actual implementation.

## Findings

### 1. Critical - Client releases lead PII after almost every failed authorization

`src/components/dashboard/crm/LeadExportButton.js:62-67` stops only for HTTP 403. A 401, 400, 429,
500, disabled capability, malformed response, or network result with `ok: false` still reaches
`releaseCallback()` and copies/downloads lead data. Release PII only after explicit success and a
validated persisted audit receipt; every other result must fail closed.

### 2. Critical - Missing or fabricated lead IDs are authorized

`src/app/api/leads/export-audit/route.js:53-60` checks only rows returned by the database. It never
proves every unique requested ID was returned. An empty result, partially missing bulk set, or client
fallback ID can be authorized. The selected `status` is never checked for the accepted-handshake /
contact-reveal state. Require exact set equality and the actual documented release status.

### 3. Critical - Disabled audit gate still authorizes PII release

`src/app/api/leads/export-audit/route.js:61-90` skips the audit write when the default-false gate is
inactive but returns `authorized: true` and `pre_migration_authorized`. Inactive/unavailable schema
must return non-success and never an authorization receipt.

### 4. High - Lead audit RLS and evidence are unsafe

`supabase/migrations/20260814000004_lead_export_audit_log.sql:35-38` names a policy service-role-only
but uses `WITH CHECK (true)`. Service role bypasses RLS; this policy can permit direct inserts by any
role with INSERT privilege. The route stores client-supplied property/purpose and no server-derived
subject identifiers. Revoke direct writes, constrain purpose, derive scope server-side, preserve
privacy-safe subject evidence, and prove immutability/permissions.

### 5. High - FAQ appeal submission has no property/FAQ authorization

`src/app/api/faqs/appeal/route.js:53-100` accepts any property, FAQ key, and rule code from any
authenticated user. It never proves existence, authorship/ownership, or a real blocked event. Bind an
appeal to server-issued privacy-safe block evidence or an existing authorized FAQ record and add the
missing cross-user/cross-property/tamper tests.

### 6. High - Direct FAQ inserts bypass checks and the workflow is incomplete

`supabase/migrations/20260814000003_faq_block_appeals.sql:39-43` permits authenticated direct inserts,
bypassing API contact-leak and rate checks. Admin GET is not capability-gated; there is no review
transition endpoint; no user-facing component calls the appeal API. Use service-role-only writes,
gate all handlers, add an authorized state machine, and integrate UI only at real block surfaces.
Approval must never publish blocked text or bypass preflight.

### 7. High - Connect cutover gate is not universal

`src/app/api/admin/connects-refund/route.js:226-273` does not use the canonical gate. The migration
replaces the shared refund RPC immediately, so default-false runtime can execute canonical-table logic
through POST before activation. Define and test explicit legacy/canonical POST behavior with no
semantic switch beneath an inactive runtime.

### 8. High - Grant reconciliation misses required holds

`supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql:676` holds multiple
active roles only when both primary fields are null. At lines 696-738, missing/invalid reset evidence
can preserve or assign grants rather than hold. This can restore already-spent grants. Model evidence
states explicitly, hold required missing/invalid/ambiguous cases, and test first run plus rerun.

### 9. Medium - Analytics sanitization is shallow

`src/lib/analytics.js:33-49` checks exact top-level keys and top-level strings only. Nested/array PII,
alternate keys, URLs/query strings, and formatted phones can pass. Prefer a per-event parameter
allowlist and drop unknown or structured values. Test every existing caller.

### 10. Medium - Verification status is overstated

Negative tests for cross-property FAQ appeals, missing lead IDs, inactive audit, non-403 client
failure, accepted handshake, and universal Connect POST gating are absent. The appeal UI/review flow
is incomplete and freshness is owner-required, so reports/status must not call all stages complete.

## Independent verification

Focused command covering the nine changed suites completed with **9 files and 122 tests passing**.
This confirms existing tests are green; it does not prove the omitted invariants above.

No migration was applied and no live provider was queried or changed during this review.

