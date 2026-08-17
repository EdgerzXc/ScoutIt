---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: ready-for-build
task-id: T0-1.0D-CATEGORY-AUTHORITY-2026-08-14
priority: "T0"
tags: [task, antigravity, category-authority, master-action-plan]
updated: 2026-08-14
ai-first: true
related: ["[[15_IMPLEMENTATION_RECORDS/active/agent-workspace/README|ScoutIt Agent Workspace]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# Antigravity Start — Category Authority

## Authority

This immutable packet is the executable task for `T0-1.0D-CATEGORY-AUTHORITY-2026-08-14`. It supersedes the `idle` placeholder in `CURRENT_TASK.md` for this task only because the existing living file could not be updated through the Windows sandbox on 2026-08-14.

- Local implementation: authorized by owner
- Commit, push, deployment, migration, live data, or external mutation: **not authorized**
- Workflow: inspect -> smallest code cleanup -> focused test -> verify -> report

## Required reading

Read before editing:

1. Repository `AGENTS.md`
2. `_SCOUTIT_BRAIN/00_START_HERE.md`
3. `_SCOUTIT_BRAIN/01_GOVERNANCE_AND_SOPS/00_SOP.md` (locate by search if moved)
4. `_SCOUTIT_BRAIN/00_MASTER_SYNC.md`
5. Master Action Plan section 1.0D
6. `STRUCTURE.md`, `DATA_DICTIONARY.md`, and `USER_FLOWS.md` at the canonical Brain paths named in `AGENTS.md`
7. The scoped runtime files and relevant bundled Next.js guides

Inspect `git status --short` first and preserve every unrelated change.

## Outcome

Make Airtable's normalized `spaceCategory` the unambiguous category authority on `/property` and `/intel`. Remove obsolete slug-based category overrides and dead mapping code, prevent missing categories from becoming false `Residential` values, and add a regression guard.

## Runtime correction to verify

The Master Action Plan is stale about the exact implementation:

- `src/app/property/page.js` is now a server shell without the legacy map.
- The directory duplicate is in `src/app/property/DirectoryClient.js` and appears unused.
- `src/app/intel/page.js` contains a legacy map in dead `[].map(...)` scaffolding; its active Airtable loop uses `p.spaceCategory || "Residential"`.
- Active directory mapping already uses normalized `p.spaceCategory` directly.

Stop and report if current runtime materially differs. Do **not** create a shared mock/fallback map just to follow the old plan wording.

## Included work

- Inspect `src/lib/airtable.js` and both consumers before editing.
- Remove unused scoped `MOCK_CATEGORIES` declarations.
- Remove the dead Intel `baseProperties = [].map(...)` scaffold if confirmed unused.
- Keep non-empty normalized `p.spaceCategory` authoritative; never override it from slug, title, type, or mock data.
- Make missing category honest (not `Residential`) and safe for matching/filtering.
- Add the smallest focused Vitest regression test. Reuse an existing exact resolver if one exists; do not create a parallel category system.
- After all checks pass, surgically mark only the section 1.0D category-precedence item complete in `00_MASTER_ACTION_PLAN.md` with a short dated correction/evidence note. Preserve all unrelated edits. If safe isolation is impossible, leave the plan unchanged and report the exact proposed patch.
- Create `ANTIGRAVITY_REPORT_T0_CATEGORY_AUTHORITY.md` in this same folder with actual diff and verification evidence.

## Excluded work

- Schema/record changes, migrations, API redesign, taxonomy changes, UI redesign, fake data, slug-specific production rules, and unrelated cleanup.
- Editing `CURRENT_TASK.md`, `CODEX_REVIEW.md`, or unrelated dirty files.
- Commit, push, deployment, live migration, or external-system changes.

## Acceptance criteria

- [ ] No scoped runtime category comes from `MOCK_CATEGORIES` or a hardcoded slug override.
- [ ] Non-empty CMS `spaceCategory` is authoritative on `/property` and `/intel`.
- [ ] Missing category is not converted to `Residential` and cannot crash category matching/filtering.
- [ ] Obsolete maps and dead scoped mapping code are removed.
- [ ] A focused test guards CMS precedence and missing-category behavior, or an equally strong source-contract test is used if behavior testing would require unjustified production abstraction.
- [ ] Targeted test, scoped lint, and diff checks pass with honest evidence.
- [ ] The plan is reconciled after proof or the unsafe overlap is explicitly reported.
- [ ] No unrelated or unauthorized action occurs.

## Verification

- Preflight: `git status --short` and scoped diff review.
- Source scan: no remaining scoped `MOCK_CATEGORIES` usage.
- Focused test: `npm.cmd run test:unit -- <test-file>`.
- Lint every changed JavaScript file: `npx.cmd eslint <files>` or repository equivalent.
- Final: `git diff --check` and scoped final diff review.
- Run broader tests/build only if shared runtime logic changes; explain why.
- Browser check is needed only if visible behavior changes.

## Required report

In `ANTIGRAVITY_REPORT_T0_CATEGORY_AUTHORITY.md`, record:

- task ID and final state (`ready-for-review` or `blocked`);
- preflight status and unrelated changes preserved;
- files changed and why;
- exact commands, exit results, and meaningful evidence;
- every acceptance criterion as pass/fail;
- risks, blockers, and any proposed plan patch not safely applied;
- explicit confirmation that no commit, push, deployment, migration, or live/external mutation occurred.

Stop rather than guessing if the fix needs scope expansion, external access, fabricated data/evidence, or overwriting unrelated work.

## Owner note

<!-- @user:start -->
The owner authorized this bounded local coding task on 2026-08-14. No release action is authorized.
<!-- @user:end -->
