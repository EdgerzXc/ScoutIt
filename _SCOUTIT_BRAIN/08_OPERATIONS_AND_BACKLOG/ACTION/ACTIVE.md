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

A-015, A-016 and A-017 were closed on 2026-08-24 with evidence in
[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done]]. [[URGENT]] is empty.

## Where the owner's "list of 10" stands

The ten items raised on 2026-08-23 as the ones that actually matter at this size:

| # | Item | State |
|---:|---|---|
| 1 | IAM / authorization | Owner-parked. The security overhaul is one deliberate pass, not a drive-by. |
| 2 | Monitoring / alerting | Code complete (Sentry wired, `/api/health` exists). DSN + alert rules are owner/ops state in L-001. |
| 3 | Rate limiting | Done — A-012. |
| 4 | Caching | Already correct — `cmsCache.js` + Upstash. No task was needed. |
| 5 | Timeouts & retries | Done — A-013. |
| 6 | Secrets management | Done — A-015. |
| 7 | XSS / input validation | Done — U-008, U-009, U-010. |
| 8 | Idempotency | Client half done — A-016, A-017. Durable server half is migration-gated in [[WAITING|W-003]]. |
| 9 | Migrations / schema versioning | Owner-gated — [[WAITING|W-003]]. |
| 10 | Cold starts / serverless limits | Knowledge, not work. Nothing to build at 13 properties. |

Everything still open on that list is behind an owner gate rather than behind
engineering effort. **Do not promote 1, 9, or the server half of 8 without the
owner's explicit go-ahead** — they need migrations or the parked security pass.

## Deployment state

⚠️ Local `main` is ahead of `origin/main`. Nine task IDs (U-008 through A-017)
are committed locally and **not pushed**; `origin/main` remains at `1daddbb`.
Production behaves as it did before any of this work. The push decision is
[[MASTER_OWNER_ACTIONS|O-009]].

---

## Not in this queue, on purpose

- **Component render tests.** This repo writes JSX in `.js` files, which the
  Vite/Rolldown pipeline vitest runs on will not parse. No component can be
  render-tested today. Fixing it means changing build configuration or renaming
  files repo-wide; A-016 used source assertions instead and recorded the limit.
- **A distributed rate limiter.** `rateLimit.js` is per-instance and says so.
- **The 114 Supabase advisor lints** stay in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] §3.
- **`src/lib/isochrone.js`.** Bounded by its own AbortController; a test pins
  this so it stops being re-proposed as an A-013-style defect.
