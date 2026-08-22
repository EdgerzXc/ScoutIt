---
section: "08_OPERATIONS_AND_BACKLOG"
status: active
tags: [verification, e2e, deployment, canonical]
updated: 2026-08-22
related: ["[[00_START_HERE]]", "[[ACTION/00_MASTER_ACTION_PLAN|Master Action Plan]]", "[[ACTION/RULES|Rules]]"]
---

# Deployment verification contract

> How ScoutIt measures a deployed build, and why a green browser run is only
> believable when it proves what it was looking at. Established closing A-003.

## 1. The failure this prevents

A protected Vercel preview answers every request with an authentication wall.
That wall is a real HTML page with headings, paragraphs and a button. A browser
audit pointed at it will load every route, find text on every one, see no error
boundary, and report zero defects — having never once seen ScoutIt.

The same shape appears with a parked domain, a cold 502, and a Cloudflare
challenge. This is not hypothetical: a browser audit is trusted precisely when
it is least able to tell you it measured nothing.

## 2. The rule

**Every browser audit asserts a render anchor before any other assertion is
trusted.** `assertScoutItRendered(page)` in `e2e_tests/full-system/helpers.js`
is that assertion, and `expectRealContent()` calls it, so every spec already
using the shared helper is covered.

The anchor is `div.grain` plus the Organization JSON-LD. Both come from the
root layout, so they appear on every ScoutIt page and on nothing else. Known
interstitial wording fails with an explanatory message rather than a bare
locator timeout.

Do not weaken the anchor to make a run pass. A failing anchor means the run was
not looking at ScoutIt, which is information, not an obstacle.

## 3. The chosen measurement method

**Production after merge, not protected previews.**

```bash
SCOUTIT_E2E_BASE_URL=https://<deployed-host> npx playwright test
```

Supplying a target skips the local build and server. Without it the suite
builds and serves locally, unchanged from before.

This method was chosen because it needs no credential. A Vercel automation
bypass token would allow measuring previews too, but issuing one is an owner
action and a standing secret; it stays available, not assumed. Should the owner
issue one, it is sent as the documented bypass header and the render anchor
still applies — the token changes what can be reached, never what counts as
proof.

## 3b. Never read a result off a piped summary

A run reported "392 passed, exit 0" while the JSON reporter showed **82
failures** on the same run. The exit code belonged to the `tail` in the pipe,
and the reporter's own failure list had scrolled past the captured window.

- Take the verdict from `--reporter=json` (or an equivalent machine-readable
  report), never from the tail of a progress reporter.
- If you must pipe, capture the runner's exit status explicitly; a pipeline's
  status is the last command's.
- A discovery count that exceeds the executed count is unexplained until it is
  explained. `--list` said 466; the run accounted for 394. The missing 72 were
  failures.

## 4. What a verification claim must state

- the exact target measured (localhost build, or the deployed host);
- that the render anchor held;
- the counts: specs run, passed, failed;
- anything skipped and why.

A report that cannot name its target has not verified a deployment.

## 5. Read-only safety

Unchanged and non-negotiable: the full-system suite runs against live Supabase
and Airtable and must stay read-and-render only. See the safety contract at the
top of `helpers.js`. Pointing the suite at production makes that rule more
important, not less.
