---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [active-work, engineering, pre-pilot]
updated: 2026-08-22
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[WAITING]]"]
---

# Active — approved work that can proceed

> Maximum 25 open items. An agent may work here only after Urgent is stable and
> after re-checking the named behavior against current code.

## A-002 — Contact-message retention and support boundary

The public contact form, database intake, staff queue, reply-by-email path, and
delivery chain are built. Decide and implement only the remaining retention
contract for visitor support messages. Keep visitor support separate from the
post-Connect deal chat lifecycle.

## A-003 — Preview-deployment verification contract

Choose and implement a dependable method for measuring protected Vercel previews:
an automation bypass token or an explicit production-after-merge verification
rule. Every browser audit must assert a known render anchor before trusting a
zero-defect result.

## A-004 — CI failure visibility

Finish the current CI work so a cancelled or failed verification job cannot
look green, typography regression checks run, and the browser suite is at least
discovered in CI without mutating production data.

## A-005 — Universal menu and authenticated-surface verification

After A-001, run production-mode coverage for representative public, property,
profile, onboarding, and authenticated dashboard states. Include mobile touch,
desktop keyboard, session transitions, and zero unexpected console/page errors.

## A-006 — Security and migration reconciliation

Continue the prepared read-only/grant/RLS analysis and migration-wrapper tests.
No migration application, retention scheduling, DNS mutation, or provider change
is authorized by this queue; those move through [[MASTER_OWNER_ACTIONS]].

## A-007 — Monthly Showcase merit curation

On the first operating cycle of each month, review featured spaces and record
only sourced, human-curated demand standing, response/connect velocity, spatial
location merits, and architectural distinctions. Raw specification tables stay
on property briefings; paid rank manipulation and invented metrics are forbidden.

**Boundary:** this is content/operations work. It does not authorize visual
changes to the owner-locked Showcase stage.
