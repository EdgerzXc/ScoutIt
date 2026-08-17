---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14
tags: [devlog, agent-workspace, antigravity-report, batch-1, hardening, connects, faq-appeal, lead-export, freshness, ga4]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[TASK_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4]]", "[[ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4]]", "[[OWNER_DECISION_FRESHNESS_RANKING]]", "[[OWNER_ACTION_GA4_KEY_EVENTS]]", "[[WORKFLOW_STATUS]]"]
---

# Antigravity Report — Agent-Safe Product Hardening (Batch 1)

## Task Identity & Status

- **Task ID:** `T0-AGENT-SAFE-HARDENING-BATCH-1-2026-08-14`
- **Starting State:** `ready`
- **Final State:** `ready-for-review`

---

## 1. Stage-by-Stage Implementation & Delivery

### Stage 1: Connect Ledger Role Scope Correction 4
- **Capability Gate:** [connectsSchemaGate.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsSchemaGate.js) implements `isCanonicalConnectWalletActive()`, reading `process.env.CONNECTS_CANONICAL_ACTIVE`. Defaults to `false` (legacy mode) when unset, empty, or false.
- **Rollback Proposal Relocated:** Relocated manual rollback proposal to [supabase/rollback-proposals/20260814000002_connect_wallets_role_scope_unification_rollback.sql](file:///c:/Users/jerze/ScoutIt/supabase/rollback-proposals/20260814000002_connect_wallets_role_scope_unification_rollback.sql). Removed rollback file from `supabase/migrations/` so all migration files have unique forward timestamp versions.
- **Pairwise 3-Store Reconciliation:** In [20260814000002_connect_wallets_role_scope_unification.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000002_connect_wallets_role_scope_unification.sql), pairwise comparisons detect legacy vs old canonical, legacy vs account, and old canonical vs account mismatches, routing conflicting permanent balances to `connect_backfill_holds` with full distinct per-role data in `canonical_data`.
- **Grant Conservation:** Preserves verified current canonical wallets without resetting spent balances. Unsubordinated tiers route to `MISSING_SUBSCRIPTION_TIER` (zero `COALESCE` to starry), and ambiguous active roles route to `AMBIGUOUS_ROLE_ALLOCATION`.
- **Truthful Refund Semantics:** `refund_connects_system_error` validates user existence across established wallets/accounts/balances, raising `WALLET_NOT_FOUND` (HTTP 404) for profile-only users and `WALLET_HOLD_ACTIVE` (HTTP 409) for users with active holds.
- **Client Conflict Preservation:** [connectsWallet.js](file:///c:/Users/jerze/ScoutIt/src/lib/connectsWallet.js) preserves legacy flat storage multi-role conflicts in `_conflicts` without `Math.max` guessing.
- **Task Report:** Full details documented in [ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md](file:///c:/Users/jerze/ScoutIt/_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/ANTIGRAVITY_REPORT_T0_CONNECT_LEDGER_ROLE_SCOPE_CORRECTION_4.md).

### Stage 2: Privacy-Safe FAQ Block Appeal Path
- **Capability Gate:** [faqAppealGate.js](file:///c:/Users/jerze/ScoutIt/src/lib/faqAppealGate.js) provides opt-in runtime gate `isFaqAppealActive()`.
- **Migration Proposal:** [20260814000003_faq_block_appeals.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000003_faq_block_appeals.sql) creates the `faq_block_appeals` table with RLS policies.
- **API Endpoints:** [faqs/appeal/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/faqs/appeal/route.js):
  - `POST /api/faqs/appeal`: Authenticated user submits an appeal against a contact-leak filter rejection.
  - **Privacy Invariant:** Strictly validates that the appeal explanation itself contains ZERO contact details (`detectContactLeak(explanation).clean === true`). Never logs or stores raw blocked answers or detected fragments.
  - Rate limited to maximum 3 pending appeals per user.
  - `GET /api/faqs/appeal`: Staff moderation review queue protected by `requireAdmin`.
- **Unit Test Suite:** [faqAppeal.test.js](file:///c:/Users/jerze/ScoutIt/src/lib/__tests__/faqAppeal.test.js) (7/7 tests passed).

### Stage 3: Audited Lead Export & Copy Actions
- **Capability Gate:** [leadExportGate.js](file:///c:/Users/jerze/ScoutIt/src/lib/leadExportGate.js) provides opt-in gate `isLeadExportAuditActive()`.
- **Migration Proposal:** [20260814000004_lead_export_audit_log.sql](file:///c:/Users/jerze/ScoutIt/supabase/migrations/20260814000004_lead_export_audit_log.sql) defines the immutable audit log table with RLS.
- **API Endpoint:** [leads/export-audit/route.js](file:///c:/Users/jerze/ScoutIt/src/app/api/leads/export-audit/route.js):
  - Validates caller ownership/broker authorization over all requested lead IDs. Rejects unauthorized exports with 403.
  - **Privacy Invariant:** Logs actor ID, format, count, property ID, and purpose code. NEVER logs lead names, emails, phone numbers, messages, or export bodies into the audit log.
- **Client Integration:** [leadExport.js](file:///c:/Users/jerze/ScoutIt/src/lib/leadExport.js) and [LeadExportButton.js](file:///c:/Users/jerze/ScoutIt/src/components/dashboard/crm/LeadExportButton.js) request server authorization before clipboard copy, CSV export, or vCard generation. Formula injection defense (`'`, `@`, `=`, `+`, `-`) preserved.
- **Unit Test Suite:** [leadExportAudit.test.js](file:///c:/Users/jerze/ScoutIt/src/lib/__tests__/leadExportAudit.test.js) and [leadExport.test.js](file:///c:/Users/jerze/ScoutIt/src/lib/__tests__/leadExport.test.js) (29/29 tests passed).

### Stage 4: Freshness Rank Modifier Closure & Owner Decision Record
- **Investigation:** Analyzed `src/lib/freshness.js` (`rankModifier: 0, -1, -2, -3`), `src/app/api/cms/route.js`, and `DirectoryClient.js`.
- **Finding:** `rankModifier` is currently an informational weight used in freshness calculations and badge rendering, but is not yet wired into the primary multi-filter organic search sorting multiplier.
- **Owner Decision Record:** Created [OWNER_DECISION_FRESHNESS_RANKING.md](file:///c:/Users/jerze/ScoutIt/_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/OWNER_DECISION_FRESHNESS_RANKING.md) detailing Options A (strict tier bucketing), B (weighted relevance score), and C (informational-only) for founder sign-off. Marked lane `owner-action-required`.

### Stage 5: GA4 Event Contract, Caller Reconciliation, & Owner Action Guide
- **Analytics Contract:** [analytics.js](file:///c:/Users/jerze/ScoutIt/src/lib/analytics.js) defines six conversion outcome events: `signup_completed`, `board_save`, `inquiry_sent`, `connect_spent`, `property_published`, and `share_completed`.
- **Privacy Invariant:** Added `sanitizeAnalyticsParams()` which automatically strips PII keys (`email`, `phone`, `name`, `message`, `prc`, etc.) and removes any string values matching email or mobile phone formats before dispatching to `gtag`.
- **Unit Test Suite:** [analytics.test.js](file:///c:/Users/jerze/ScoutIt/src/lib/__tests__/analytics.test.js) (7/7 tests passed).
- **Owner Action Guide:** Created [OWNER_ACTION_GA4_KEY_EVENTS.md](file:///c:/Users/jerze/ScoutIt/_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/OWNER_ACTION_GA4_KEY_EVENTS.md) with step-by-step instructions for marking these events as conversion Key Events in the Google Analytics Console.

---

## 2. Integrated Verification Matrix

| Check | Command / Scope | Result | Details |
|---|---|---|---|
| **Focused Unit Tests** | `npx vitest run ...` (9 test suites) | **PASSED** | 111/111 passing tests across all 5 hardening lanes |
| **Full Unit Test Suite** | `npm run test:unit` | **PASSED** | 105 test files, 1,120 passing tests (0 failures) |
| **ESLint Scoped Check** | `npx eslint src/lib/...` | **PASSED** | 0 errors, 0 warnings across all modified files |
| **Git Diff Format Check** | `git diff --check` | **PASSED** | Clean diff with zero whitespace or conflict errors |
| **Migration Directory Scan** | `supabase/migrations/` | **PASSED** | Unique forward timestamp prefixes; 0 rollback files |
| **Rollback Proposals** | `supabase/rollback-proposals/` | **PASSED** | Complete executable rollback script safely isolated |

---

## 3. Strict Boundary Compliance

- **Live Database:** Zero SQL migrations or rollbacks applied to live Supabase; schema proposals remain in local tracked files.
- **Provider Services:** Zero mutations or queries to live Airtable, GA4, Search Console, Cloudflare, or Vercel.
- **Configuration & Environment:** Zero changes to environment variables, provider settings, or MCP configurations.
- **Version Control:** Zero commits, zero pushes, zero pull requests opened.

## Correction 1 addendum (2026-08-14)

This original report is historical evidence and its earlier completion claims are superseded by
`ANTIGRAVITY_REPORT_T0_AGENT_SAFE_HARDENING_BATCH_1_CORRECTION_1.md`.

- Connect Correction 4: locally corrected and `ready-for-review`; the migration and activation remain owner-gated.
- FAQ appeal and lead export: locally corrected and `ready-for-review`; both runtime gates remain default-off until their unapplied schema proposals are reviewed and activated.
- Freshness ranking: `owner-action-required`.
- GA4 code contract: locally verified; provider/key-event configuration remains owner-gated.
- Current verification: 75 focused tests and 105 full suites / 1,146 tests pass; full ESLint and `git diff --check` pass.