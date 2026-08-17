---
section: "15_IMPLEMENTATION_RECORDS/active/agent-workspace"
status: active
date: 2026-08-14
type: task
task-state: changes-requested
task-id: T0-1.0D-CATEGORY-AUTHORITY-2026-08-14-C1
priority: "T0"
tags: [task, antigravity, category-authority, correction]
updated: 2026-08-14
ai-first: true
related: ["[[TASK_T0_CATEGORY_AUTHORITY]]", "[[ANTIGRAVITY_REPORT_T0_CATEGORY_AUTHORITY]]", "[[CODEX_REVIEW_T0_CATEGORY_AUTHORITY]]"]
---

# Antigravity Correction 1 - Category Authority

## For future Claude

This is the only authorized correction to task `T0-1.0D-CATEGORY-AUTHORITY-2026-08-14`. Apply the smallest diff needed to address the three findings in [[CODEX_REVIEW_T0_CATEGORY_AUTHORITY]], verify it, and write a task-specific correction report in this same folder.

## Authority

- State: `changes-requested`
- Local correction: authorized by owner
- Commit, push, deploy, migration, live data, or external mutation: not authorized

## Required corrections

1. In `src/app/intel/page.js`, restore the pre-task fallback for missing **article** category (`item.category || "Residential"`). This task changes property `spaceCategory` authority only; do not redefine article taxonomy inconsistently with the detail route.
2. Restore the pre-task `getLinkedProperty` body because it is unused and its hardening was outside this bounded cleanup. Do not expand or delete the dormant feature in this correction.
3. Tighten `src/lib/__tests__/categoryAuthority.test.js`:
   - keep direct source-contract coverage for removal of `MOCK_CATEGORIES`;
   - directly guard that the active Intel **property** mapper uses honest CMS `spaceCategory` and has no `p.spaceCategory || "Residential"` coercion;
   - directly guard that the directory consumes `p.spaceCategory` without a slug override;
   - remove tests that recreate the resolver or `getLinkedProperty` inside the test;
   - remove unrelated `categoryKeyFor` coverage from this task-specific file.
4. Do not change the already-correct category cleanup or unrelated working-tree files.
5. Do not broaden the Master Action Plan edit. Its category closure may remain if all corrected acceptance checks pass.

## Acceptance criteria

- [ ] Property `spaceCategory` cleanup remains intact and `MOCK_CATEGORIES` stays absent.
- [ ] Missing property category remains honest and safe; no `p.spaceCategory || "Residential"` exists in the scoped property consumer.
- [ ] Missing Intel article category behavior matches the pre-task behavior and the current detail route.
- [ ] The task test contracts the real source files without copied production-like functions or unrelated utility tests.
- [ ] Focused test, scoped lint, full unit suite, and scoped diff checks pass.
- [ ] Repository-wide diff-check findings are reported honestly and distinguished from this task's scoped files.
- [ ] No unrelated or unauthorized action occurs.

## Verification and report

Run:

- `git status --short` before editing;
- the focused Vitest file;
- scoped ESLint for every changed JavaScript file;
- `npm.cmd run test:unit`;
- `git diff --check -- src/app/intel/page.js src/app/property/DirectoryClient.js src/lib/__tests__/categoryAuthority.test.js`;
- repository-wide `git diff --check`, reporting pre-existing unrelated findings separately;
- a final scoped diff inspection.

Create `ANTIGRAVITY_REPORT_T0_CATEGORY_AUTHORITY_CORRECTION_1.md` in this folder. Record exact commands/results, changed files, each criterion, residual risks, and confirmation that no commit, push, deploy, migration, or external mutation occurred.

## Owner note

<!-- @user:start -->
The owner authorized continuing local work after Codex verification. No release action is authorized.
<!-- @user:end -->
