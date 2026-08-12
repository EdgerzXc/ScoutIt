---
section: "08_OPERATIONS_AND_BACKLOG"
status: active
tags: [claude-code-prompt, handoff, security, deploy, phase-1, followup]
updated: 2026-08-13
related:
  - "[[CLAUDE_CODE_PROMPT_2026-08-12_SHIP_1_0B]]"
  - "[[../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]]"
---

# Claude Code prompt — follow-up: drop `cmsCache.js`, ship the branch

> Follow-up to `CLAUDE_CODE_PROMPT_2026-08-12_SHIP_1_0B.md`. The verification
> pass found `src/lib/cmsCache.js` is not self-contained. Decision: **Option C**.
>
> Paste everything inside the code fence into the same Claude Code session (or a
> new one from `C:\Users\jerze\ScoutIt`).

---

```
Follow-up on branch `security/1-0b-critical-fixes`, commit 2879575.

## The Vercel preview build FAILED, exactly as you predicted

Deployment FYekzGR1h, 58s, Turbopack build failed with 1 error:

    ./src/lib/cmsCache.js:23:1
    Module not found: Can't resolve '@/lib/sampleInventory'
      21 | import { CITY_HUB } from "@/lib/transit";
      22 | import { DEFAULT_LIVE_CMS_URL, normalizeLiveCmsBundle } from "@/lib/cmsFallback";
    > 23 | import { normalizeSampleBundle } from "@/lib/sampleInventory";
    Import map: aliased to relative './src/lib/sampleInventory' inside of [project]/

Your diagnosis was exactly right, down to the file and line. Nothing to
re-investigate — go straight to the fix.

(Side note, no action needed: the log shows Vercel built with Next.js 16.2.12,
not 16.3.0, because the package.json bump is among the uncommitted ~229. That is
expected and is not a second problem.)

Decision: OPTION C.
Drop src/lib/cmsCache.js from the branch. Reasons, so you can sanity-check me:

  - Both live holes are in /api/deals/handshake and /api/intel/ingest. Neither
    touches cmsCache.js. Dropping it costs nothing security-wise today.
  - The geocode cap is resource-exhaustion hardening, not an exploitable hole.
  - Options A and B both smuggle unrelated ISR/sample-inventory behaviour into a
    security commit, or ship a file variant that has never been tested as such.
    Neither is worth it to land hardening that can wait.

## Step 1 — remove cmsCache.js from the branch

Keep src/lib/boundedCache.js and its tests. They are self-contained, they pass,
and re-applying the cap later is then a one-line consumer change.

Restore cmsCache.js on the branch to its `main` content, WITHOUT touching the
working-tree copy — the working tree holds unrelated uncommitted work that must
survive intact. Check `git status` before and after to prove nothing else moved.

Then confirm: `git diff main --name-only` lists exactly 12 files, no cmsCache.js.

## Step 2 — the docs changed since your commit

I corrected three documentation errors you correctly identified. These files are
modified in the working tree again and must go into the branch:

    _SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN.md
    _SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12.md

What changed:
  - Plan §1.0B "Patched Deal Hijacking" rewritten. It claimed the deals UPDATE
    policy gained a WITH CHECK; that described the REJECTED fix. It now states
    the fix was inverted and deals UPDATE remains deny-all. You were right.
  - Implementation record gained a §7 recording the cmsCache.js ship-set error,
    its root cause (a ship set assembled from filenames rather than hunks, in a
    242-file dirty tree), the 1015-vs-882 test count, the stale .next build
    failure, and the mockOwnerId removal you spotted.

Also add this new file if it is untracked:

    _SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/CLAUDE_CODE_PROMPT_2026-08-13_FIX_SHIP_SET.md

Stage ONLY those doc files plus the cmsCache.js removal. Nothing from the ~229.
Show me `git status --short` before committing.

Commit message:

    fix(security): drop cmsCache from 1.0B ship set; correct records

    cmsCache.js carried two unrelated uncommitted changes, one importing
    the untracked lib/sampleInventory - the branch could not build. The
    geocode cap ships separately; boundedCache.js and its tests remain.

    Also corrects the plan's deal-hijacking bullet, which described the
    rejected fix rather than the inverted one that shipped.

## Step 3 — re-verify, this time against the BRANCH not the working tree

This is the important part, and it is what the last pass got wrong.

`npm run build` passing locally proves nothing here, because the working tree
contains all ~242 files. You must verify the branch IN ISOLATION. Do this:

    git worktree add ../scoutit-verify security/1-0b-critical-fixes
    cd ../scoutit-verify
    npm ci
    npm run lint
    npm run test:unit
    npm run build

A clean worktree contains ONLY committed files, so a module-not-found from the
uncommitted 229 fails here exactly as it would on Vercel.

Then scan every import in the committed source files and confirm each resolves
to something tracked in git — the same check that caught sampleInventory. Report
any that do not.

When done: `cd` back, `git worktree remove ../scoutit-verify`.

## Step 4 — push and report

    git push

Report: the 12-file diff list, clean-worktree lint/test/build results with real
numbers, the import-resolution check result, and confirmation that the working
tree still holds its ~229 uncommitted files untouched.

Do NOT open the PR or merge. Once the clean worktree builds green I will decide.

If you think Option C is wrong, or you find another file in the 12 with the same
non-self-contained problem, say so before acting.
```

---

## Why a clean worktree, not just another `npm run build`

The first pass built green locally and would still have failed on Vercel. A
`git worktree` checkout materialises **only committed content**, so it reproduces
the deploy environment's view of the branch without needing Vercel in the loop.
It is the cheapest way to close the local-passes / preview-fails gap, and it is
now the standing check for any branch cut from a dirty tree.
