---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: devlog
report-state: ready-for-review
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-CORRECTION-1-2026-08-14
priority: "T0"
tags: [devlog, correction, privacy, authorization, connects, faq, analytics]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1_CORRECTION_1]]", "[[CODEX_REVIEW_T0_AGENT_SAFE_HARDENING_BATCH_1]]"]
---

# Antigravity Report - Agent-Safe Hardening Batch 1 Correction 1

## Final state

`ready-for-review`. All three proposed migrations remain unapplied. Their server gates remain
opt-in/default-false. Freshness is still `owner-action-required`; GA4 provider/key-event configuration
is still owner-gated.

## Finding-to-evidence map

| Review finding | Correction | Primary verification |
|---|---|---|
| Lead PII released after failed authorization | Client now releases only after HTTP success, explicit authorization, matching count/format, UUID audit receipt, and persisted timestamp. Missing/duplicate/fabricated IDs fail before release. | `leadExportAudit.test.js` client receipt matrix |
| Missing/partial/unauthorized lead sets | Route normalizes UUIDs, proves exact requested/found set equality, derives owner/broker/property scope server-side, and requires deal `accepted` plus completed transaction/contact handshake for every row. | zero/partial/mixed authority and deal/handshake state tests |
| Disabled/missing lead audit | Default-false gate returns 503 before schema access; audit insert failure or malformed receipt blocks export. | route gate/audit-failure tests |
| Unsafe lead audit permissions/evidence | Proposal stores only SHA-256 scope hashes/counts, constrains purpose/format/count, revokes browser writes, and rejects UPDATE/DELETE. | migration permission/source test |
| FAQ appeal trusted client context | One-time `faq_block_evidence` is issued only at the authorized owner preflight block surface; atomic RPC binds actor/property/preflight key/rule/context and rejects replay/expiry/tampering uniformly. | FAQ cross-user/cross-property/nonexistent/replay/tamper tests and SQL scan |
| FAQ direct inserts/incomplete workflow | Browser writes are revoked. POST submission and admin PATCH review use service-role-only RPCs with advisory locks, optimistic expected status, reviewer ID, notes, and timestamps. Approval changes only appeal state and never publishes content. | FAQ API/migration tests |
| FAQ UI/rate race | Accessible evidence-gated review form exposes ready/pending/error states without SLA. Atomic submission lock enforces the pending limit. | panel/source and RPC tests |
| Connect cutover ambiguity | POST uses legacy RPC while gate is false and separately named canonical RPC only after explicit activation. Rollback removes canonical RPC. | Connect refund gate tests and source scan |
| Connect grant restoration risk | Missing/invalid required reset evidence creates a hold; conflicting/genuinely ambiguous role evidence holds; current canonical monthly grants remain untouched on first run/rerun. | migration structural/conservation tests |
| Shallow analytics privacy | Exact per-event parameter allowlists drop unknown keys, arrays/objects, alternate PII keys, URLs/query strings, formatted phones, non-finite values, and unknown events. Tracking stays non-throwing/off without GA ID. | analytics caller matrix |

## Verification

- Focused: 5 files, 75 tests passed.
- Full unit: 105 files, 1,146 tests passed.
- Full ESLint (`src` and `mission-control/src`): passed with zero findings.
- Source/permission scans: passed; no fabricated lead receipt/ID fallback or permissive browser write policy remains.
- `git diff --check`: passed.
- Next.js local route-handler/authentication guidance was read before route changes.

## Boundary confirmation

No live system was queried or mutated. No migration or rollback was applied. No environment/provider
setting was changed. No deployment, commit, push, pull request, or external message was performed.