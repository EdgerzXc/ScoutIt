---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [owner-actions, decisions, approvals, external-systems]
updated: 2026-08-22
related: ["[[00_MASTER_ACTION_PLAN]]", "[[WAITING]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/README|Done Index]]"]
---

# Master Owner Actions — Jerzel's current lane

> Maximum 15 current items. This file contains only actions an agent cannot
> honestly complete: decisions, external dashboards, counsel, approvals, and
> physical-device checks. Historical owner notes are preserved in the Inbox.

## Do now

### O-001 — Showcase touch-target decision

Choose whether the locked Showcase's 32px mobile controls should grow to 44px
or remain a documented density exception. Any visual change requires review
before the checksum can change.

### O-002 — True Light Mode pilot policy

Choose full remediation before pilot or consistent temporary withholding on all
selectors. Do not leave desktop and mobile behavior inconsistent.

### O-003 — Legal/privacy authority before invited pilot

Confirm the real legal entity/contact details and effective date; appoint the
privacy owner/DPO; route Terms, Privacy, RESA boundaries, retention, processor,
and data-subject-rights documents through Philippine counsel.

### O-004 — Migration approval lane

Approve only individually reconciled migrations with live-schema read-back,
backup, rollback, and immediate verification. spatial_ref_sys remains held
unless its dedicated risk plan is accepted.

~~Named dependency: the versioned-acceptance migration must be applied before
that code deploys.~~ **Withdrawn 2026-08-22 — it was already applied.** The live
database carries `20260821122706 versioned_terms_acceptance`; `terms_acceptances`
and both `user_profiles` columns exist with RLS on and no policies. There is no
deploy-ordering hazard for U-002.

Still open under this lane: `supabase/migrations/20260822000001_drop_broken_chat_purge_function.sql`
(drops a function that can never have run — safe, but unapplied) and the
`spatial_ref_sys` decision.

What the owner should expect on the next deploy: all five onboarded accounts,
including the founder's, will be asked to accept the current Terms once before
reaching the dashboard. That re-consent is now additive only — it records the
acceptance and changes no roles, tier, or profile data (U-007).

### O-005 — Stable-release real-device pass

After the urgent working tree is split, verified, merged, and deployed with
approval, perform the real iPhone/Android, 200% zoom, screen-reader, navigation,
onboarding, and sample/real-property journeys.

### O-006 — Search Console sitemap status recheck

The property is verified and the sitemap was submitted on 2026-08-16. Re-read
only the sitemap processing status; do not repeat verification/setup work.

## Later / trigger-gated

- Payment-provider selection and counsel review before commercial activation
- DNS/Cloudflare and Mission Control deployment changes after the approved order
- Pilot-cohort recruitment and release approval after the pre-pilot gate
- Production infrastructure upgrades at their documented triggers

See [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] for deliberately deferred
work and [[WAITING]] for the exact conditions that reopen engineering.

### A-002 — Visitor contact-message retention period

`contact_messages` holds a stranger's name, email and free text with no
retention rule: rows currently live forever. The table is RLS deny-all and
service-role only, so this is a retention question, not an exposure one. Live
count at handoff: 0 rows.

**The one decision needed:** how long a resolved visitor support message is
kept before its personal fields are cleared. Everything else is built and
waiting on that number. Retention wording also sits inside the counsel review
already tracked as O-003, so the two should be answered together rather than
guessing a period and publishing it.

Deliberately not implemented: a placeholder period would become a published
privacy claim nobody actually decided.

### O-007 — The Showcase presents invented metrics as verified, on a locked surface

Found 2026-08-22 while reviewing A-007. Stated here rather than fixed, because
`src/components/board/ShowcaseStage.js` is checksum-locked and a failed lock is
a stop signal.

What the page renders today:

- **"Inquiry Velocity 98.4% / 94.1% / 89.6% / 82.0%"** — not a measurement. The
  number is chosen from the card's rank position, so rank 1 always reads 98.4%.
- **"Private saves"** and **"View signals"** fall back to `inquiry_count × 1.8`
  and `inquiry_count × 8` when absent — arithmetic dressed as telemetry.
- A **"Verified"** shield sits above all of it.
- Every entry comes from `src/data/mock/mockShowcase.js`. There is no live
  showcase data source; `SHOWCASE_CMS` is still a planned Airtable table.
- Unlike sample Intel and sample properties, the Showcase carries **no sample
  disclosure of any kind** (U-003 covered the others).

This is Standing Rule 3 and the A-007 prohibition on invented metrics, on the
one public surface that claims to rank real spaces by real demand.

**The decisions needed, in order:**

1. Does the Showcase carry a sample disclosure until real data exists? That is
   the smallest honest fix and it changes a locked surface.
2. Do the rank-derived percentage and the multiplied counts come out, or does
   the Showcase wait for the real `SHOWCASE_CMS` feed before it ships?
3. Explicit authorization is required before either edit, and the checksum is
   refreshed only after you have reviewed the exact new appearance.

Not done here: nothing on the locked surface was edited, and no checksum was
touched.

