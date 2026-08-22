---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: unverified
tags: [inbox, configuration, cron, non-executable]
updated: 2026-08-22
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
