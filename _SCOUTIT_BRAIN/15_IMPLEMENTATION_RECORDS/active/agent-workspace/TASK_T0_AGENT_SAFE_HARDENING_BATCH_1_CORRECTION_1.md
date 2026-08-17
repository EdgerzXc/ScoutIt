---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-review
task-id: T0-AGENT-SAFE-HARDENING-BATCH-1-CORRECTION-1-2026-08-14
priority: "T0"
tags: [task, correction, antigravity, privacy, authorization, connects, faq, analytics]
updated: 2026-08-14
ai-first: true
related: ["[[CODEX_REVIEW_T0_AGENT_SAFE_HARDENING_BATCH_1]]", "[[TASK_T0_AGENT_SAFE_HARDENING_BATCH_1]]"]
---

# Antigravity Batch 1 - Correction 1

## Authority

Fix only `CODEX_REVIEW_T0_AGENT_SAFE_HARDENING_BATCH_1.md`. Preserve unrelated dirty work. Do not
query/mutate live systems, apply migrations, change environment/provider settings, deploy, commit,
push, or broaden scope. Read relevant local Next.js docs before route changes.

## A. Lead export must fail closed end to end

1. Release PII only when `response.ok`, `authorized === true`, and a valid persisted audit receipt are
   all proven. Block every error/status/malformed/network case. Remove fallback/fabricated IDs.
2. Normalize unique IDs and prove exact set equality with database rows. Reject empty, duplicate,
   missing, unknown, partially found, and mixed-authority sets.
3. Trace the actual deal schema and require the exact accepted-handshake/contact-reveal state for every
   lead. Do not invent the status name.
4. Derive actor, property, lead scope, and purpose server-side. Client fields are not authority.
5. Default-false audit gate returns 503/disabled and never authorization. Audit failure blocks release.
6. Harden migration permissions: service-role-only writes, immutable records, constrained values, and
   privacy-safe subject/scope evidence.
7. Test all client failures, zero/partial/duplicate IDs, every deal state, mixed scope, audit failure,
   direct-write permissions, and that PII never releases before success.

## B. Complete the FAQ appeal path safely

1. Bind submission to server-issued privacy-safe block evidence or an authorized blocked FAQ record;
   never treat client identifiers/rule codes as proof.
2. Verify actor, property, FAQ/preflight context, and authorship/ownership server-side. Test anonymous,
   cross-user, cross-property, nonexistent, replayed, and tampered evidence.
3. Remove permissive direct INSERT; writes/review transitions are service-role-only.
4. Gate every handler so absent schema is never queried.
5. Add admin-authorized state transitions, reviewer/timestamp evidence, concurrency protection, and no
   raw blocked content. Approval never publishes or bypasses preflight.
6. Add accessible UI at genuine block surfaces with truthful disabled/pending/error states and no SLA.
7. Make rate limiting atomic or constraint-backed, not count-then-insert race prone.

## C. Finish Connect Correction 4

1. Make refund POST obey the server-only cutover gate. Default-false must not call canonical RPC logic
   during the migration-to-activation interval.
2. Use separate legacy/canonical RPC names or another unambiguous staged strategy; do not replace one
   function's semantics beneath inactive runtime.
3. Hold every required missing/invalid reset-date and genuinely ambiguous multiple-role case. Never
   restore an allowance without safe evidence.
4. Test first run/rerun proving already-spent grants cannot return. Recheck permissions, rollback,
   hold reactivation, pairwise reconciliation, and truthful return fields.

## D. Enforce analytics privacy

Prefer a per-event parameter allowlist. Drop unknown keys and unsupported structured values. Cover
nested/array PII, alternate keys, URLs/query strings, formatted phones, and every call site. Tracking
remains non-throwing and disabled without GA configuration.

## E. Verification and records

- Do not edit unrelated files to make global checks clean; scope checks and report pre-existing issues.
- Run focused tests, scoped ESLint, full unit tests, source/permission scans, and scoped diff check.
- Correct Batch 1/Correction 4 reports and status with exact stage states. Freshness remains
  `owner-action-required`; GA4 provider configuration remains owner-gated.
- Create `ANTIGRAVITY_REPORT_T0_AGENT_SAFE_HARDENING_BATCH_1_CORRECTION_1.md` mapping each finding to
  code/tests and confirming no live or version-control action.

Stop only for an unresolved authoritative product/privacy decision; leave that capability disabled,
record `owner-action-required`, and continue independent corrections. Never guess live schema state.

