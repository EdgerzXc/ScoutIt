---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: project
tags: [project, agent-workspace, antigravity, implementation-handoff]
updated: 2026-08-14
ai-first: true
related: ["[[00_SOP]]", "[[00_MASTER_SYNC]]", "[[CURRENT_TASK]]", "[[ANTIGRAVITY_REPORT]]", "[[CODEX_REVIEW]]"]
---

# ScoutIt Agent Workspace

## For future Claude

This folder is the single operational handoff point between the owner, Codex, and Antigravity for ScoutIt implementation work. It was established on 2026-08-14 to eliminate repeated copying of long prompts while preserving explicit task scope, verification evidence, and owner approval gates.

## Purpose

Use this folder for one active implementation task at a time:

1. The owner and Codex shape the feature in conversation.
2. Codex writes the approved execution contract into [[CURRENT_TASK]].
3. Antigravity reads this README and the current task, then implements only that contract.
4. Antigravity records changed files, commands, evidence, and risks in [[ANTIGRAVITY_REPORT]].
5. Codex inspects the actual diff and records its verdict in [[CODEX_REVIEW]].
6. The owner decides whether any commit, push, deployment, migration, or external-system change may proceed.

This folder coordinates work. It does not replace canonical architecture, schema, product, security, or backlog documents elsewhere in `_SCOUTIT_BRAIN`.

## One-line Antigravity trigger

The owner may give Antigravity this short instruction:

```text
Open _SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/agent-workspace/README.md and execute the current ScoutIt task exactly as instructed.
```

No feature prompt needs to be copied into Antigravity. The complete contract must already exist in [[CURRENT_TASK]].

## Required reading order

Antigravity must read these files before changing code:

1. Repository `AGENTS.md`
2. [[00_START_HERE]]
3. [[00_SOP]]
4. [[00_MASTER_SYNC]]
5. [[CURRENT_TASK]]
6. Every task-specific document named under `Required context` in the current task
7. Relevant runtime files and, for Next.js work, the relevant guide under `node_modules/next/dist/docs/`

Runtime code and verified live state win over stale documentation. If they conflict with the task contract, Antigravity must stop and record the conflict instead of guessing.

## File ownership

To prevent concurrent overwrites:

| File | Writer | Purpose |
|---|---|---|
| `CURRENT_TASK.md` | Codex | Approved scope and acceptance contract |
| `ANTIGRAVITY_REPORT.md` | Antigravity | Implementation and verification evidence |
| `CODEX_REVIEW.md` | Codex | Independent review verdict and corrections |
| Application and test files | Antigravity during build | The bounded implementation |

The owner may edit any file, but agents must preserve owner-written content.

## Workflow states

`CURRENT_TASK.md` uses exactly one of these states:

- `idle` - no approved task; Antigravity must not implement anything
- `draft` - discussion is in progress; Antigravity must not implement anything
- `ready-for-build` - contract is approved for local implementation
- `building` - Antigravity is actively implementing
- `ready-for-review` - implementation is complete and evidence is recorded
- `changes-requested` - Codex found bounded corrections
- `accepted` - implementation meets the contract locally
- `owner-action-required` - completion needs an explicit owner action
- `archived` - task is closed and no longer executable

Only `ready-for-build` and `changes-requested` authorize Antigravity to change code. Neither state authorizes a commit, push, deployment, live migration, credential change, DNS change, Airtable mutation, Supabase mutation, or other external side effect unless the task contains separate explicit owner authorization for that exact action.

## Antigravity execution rules

Antigravity must:

- Verify the current working tree before editing and preserve unrelated changes.
- Implement the smallest complete vertical slice described in the task.
- Follow the Airtable-public / Supabase-private boundary.
- Preserve canonical slug and publication lifecycle rules.
- Use ScoutIt design tokens and the mobile-first dark visual system.
- Never fabricate product data, test evidence, external-state evidence, or completion claims.
- Run verification proportional to risk and record exact commands and outcomes.
- Update [[ANTIGRAVITY_REPORT]] when finished or blocked.
- Stop at the first material ambiguity that would expand or alter the approved scope.

Antigravity must not silently broaden the task, clean unrelated files, overwrite another agent's changes, or mark work complete based only on code inspection when runnable verification is available.

## Codex review rules

Codex reviews the real working tree and test evidence, not just Antigravity's narrative. The review records one verdict in [[CODEX_REVIEW]]: `accepted`, `changes-requested`, `owner-action-required`, or `blocked`.

If changes are requested, Codex updates [[CURRENT_TASK]] with a bounded correction list. Antigravity then receives the same one-line trigger again.

## Completion and history

After the owner accepts a completed task, its durable result belongs in the relevant canonical Brain note and, when useful, a dated implementation record. Reset these living files only after durable decisions and evidence have been propagated. Do not create a second active queue.

<!-- BEGIN:GENERATED_LOGIC_INDEX -->

## Complete logic index

> Generated navigation block. Keep human explanation above this marker; regenerate this block whenever files move.

- **Parent:** [[15_IMPLEMENTATION_RECORDS/active/README|Up to active implementation records]]

### Immediate notes

- [[CURRENT_TASK]]
- [[ANTIGRAVITY_REPORT]]
- [[CODEX_REVIEW]]

<!-- END:GENERATED_LOGIC_INDEX -->
