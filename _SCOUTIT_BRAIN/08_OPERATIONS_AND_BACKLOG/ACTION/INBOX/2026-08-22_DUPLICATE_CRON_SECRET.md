---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: promoted-to-O-012
tags: [inbox, configuration, cron, non-executable]
updated: 2026-08-30
related: ["[[00_MASTER_ACTION_PLAN]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# `.env.local` defines CRON_SECRET twice

> **Not executable.** Observed 2026-08-22 while running the new chat-purge job
> locally. Verify against Vercel before promoting.

## What was observed

`.env.local` contains two different `CRON_SECRET` values, on separate lines.
Only the second one authorises a request to `/api/cron/purge-chat-messages`;
a request signed with the first value returns 401. One of the two is dead.

## Why it may matter

The scheduled jobs (`check-stale-listings`, `sweep-pending-requests`, and now
`purge-chat-messages`) all authenticate with `CRON_SECRET`. If the value set in
the Vercel project matches the dead local one, every scheduled job in
production returns 401 and silently does nothing — the same failure shape as
the purge function that never ran.

## What must be checked before promoting

1. Which value is set in the Vercel environment for each project.
2. Whether the scheduled jobs have ever returned 200 in production logs.
3. Whether the duplicate should be removed from `.env.local` or the two
   entries belong to different environments and were merged by accident.

Not checked here: this needs the owner's Vercel dashboard, and reading or
rotating a deployment secret is owner-gated.

---

## PROMOTED 2026-08-27 → [[MASTER_OWNER_ACTIONS|O-012]]

Independently reproduced on a second, unrelated cron route
(`/api/cron/recompute-broker-metrics`, built the same day): the first
`CRON_SECRET` value returns 401, the second returns 200
(`{"ok":true,"scanned":3,"recomputed":3,"failed":0}`). The last definition
wins locally, and the two values genuinely differ.

That removes the "unverified" caveat: this is not specific to the purge job,
it is the shared secret. Four scheduled jobs now depend on it. Owner action
O-012 carries the Vercel check.

---

## Hard evidence, 2026-08-30 (found while verifying A-063)

Forcing a real cron run required picking the right secret, which settled which
one is live:

- `.env.local` declares `CRON_SECRET` on **line 15** and again on **line 39**,
  with **different 64-character values**.
- Against a running dev server, the **first** value returns **401**. The
  **second** returns **200** and the job runs. Next's env loader takes the later
  declaration.

So the line-15 value is dead. **The live risk is Vercel**: if the production
`CRON_SECRET` holds the dead value, all four scheduled jobs have been answering
401 and nothing has ever reported it. Until 2026-08-30 there was no place that
could have reported it.

That part is now checkable rather than invisible: `withCronEventLog` records a
run in `system_events` and deliberately does **not** record a rejected probe, so
a job that is being rejected shows up as a **gap** in `cron.completed` on
`/dashboard/system`, not as noise.

**Next step is owner access, not code:** read the `CRON_SECRET` value in the
Vercel project, confirm it matches the line-39 value, then delete the dead
line-15 declaration so the file stops being ambiguous.
