---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: unverified
tags: [inbox, seo, sample-data, non-executable]
updated: 2026-08-22
related: ["[[00_MASTER_ACTION_PLAN]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|Done August 2026]]"]
---

# Sample Intel articles are crawlable while sample properties are not

> **Not executable.** Recorded while closing U-003. Verify and promote before
> any implementation.

## What was observed (2026-08-22, local dev)

- `src/app/property/[id]/page.js` and the unit page set
  `robots: { index: false, follow: true }`, and `src/app/sitemap.js` filters
  `!p.is_sample`. Sample property surfaces are therefore withheld from indexing.
- `/intel/bgc-spatial-movement` (a sample briefing) rendered **no** robots meta
  tag. Sample intel detail routes are absent from the sitemap but remain
  reachable and crawlable from `/intel`.
- The page emits only site-wide Organization and WebSite structured data. No
  fabricated `Article` schema is published, so there is no false attribution to
  a real institution.

## Why it may matter

The two sample surfaces answer the same honesty question differently. A search
engine can index an illustrative briefing as ScoutIt editorial output. The
on-page label is unmistakable to a human reader but carries no crawler signal.

## What must be checked before promoting

1. Whether the owner intends sample briefings to be discoverable during the
   invited pilot at all.
2. Whether withholding them changes the human-testing journey that the sample
   inventory exists to support.
3. Whether the fix belongs with the sample-inventory retirement decision rather
   than as a standalone SEO change.
