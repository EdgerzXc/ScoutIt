---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [active-work, engineering, pre-pilot]
updated: 2026-08-24
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[WAITING]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Active — approved work that can proceed

> Maximum 25 open items. An agent may work here only after Urgent is stable and
> after re-checking the named behavior against current code.

## No active implementation items

A-012, A-013 and A-014 were closed on 2026-08-24 with evidence in
[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]]. [[URGENT]] is empty.

⚠️ **Six fixes now sit in the working tree and nowhere else.** U-008, U-009,
U-010, A-012, A-013 and A-014 are all uncommitted; `main` and `origin/main`
remain at `1daddbb`. Production still behaves the way it did before any of this
work. Do not read the Done ledger as a description of the live site — the push
decision is [[MASTER_OWNER_ACTIONS|O-009]].

Do not pull work from owner, waiting, future, specifications, or historical
records without first verifying and promoting the same stable task ID here.

---

## Not in this queue, on purpose

- **Monitoring, alerting, and dashboards** are already recorded in
  [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE#L-001 — Launch operations, discoverability, and social readiness|L-001]].
  Sentry is fully wired in code and `/api/health` exists; what is missing is the
  DSN value and the alert rules — owner/ops state, not code.
- **The 114 Supabase advisor lints** stay in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] §3.
  They scale with rows and traffic; there are 13 properties.
- **A distributed rate limiter.** `rateLimit.js` is per-instance and says so.
  Upstash is already a dependency, but swapping it in needs a measured reason,
  not a predicted one.
- **`src/lib/isochrone.js`.** It uses a bare `fetch`, which looks like the
  A-013 defect to a grep, but it is already bounded by its own AbortController.
  A test pins this so it stops being re-proposed.
