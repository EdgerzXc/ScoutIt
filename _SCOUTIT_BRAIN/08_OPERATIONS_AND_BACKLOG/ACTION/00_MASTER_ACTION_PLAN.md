---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, action-router, execution-control]
updated: 2026-08-23
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

## Current truth — 2026-08-23

- Production baseline: main and origin/main were at 89185c8 when this control
  system was created.
- The pre-pilot stabilization gate closed 2026-08-22. U-001 through U-005 are
  in [[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]], the working tree is
  committed on main as six reviewed change sets, and nothing has been pushed,
  merged, or deployed. [[URGENT]] is empty. The bounded F-series implementation
  slices are either in Done or at exact owner gates. [[ACTIVE]] has no authorized
  implementation item. New work must be verified
  and promoted through this router before execution.
- The Showcase stage and its parent navigation are owner-approved and checksum
  locked. A broad Showcase/header redesign is **not** an active task.
- The remaining Showcase control-size question is owner-gated in [[WAITING]].
- The owner retired the Antigravity handoff workflow on 2026-08-23. A-010 was
  cancelled before implementation; Codex now works directly from these queues.

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
