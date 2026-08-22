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

Named dependency: `supabase/migrations/20260821000001_versioned_terms_acceptance.sql`
must be applied **before** the versioned-acceptance code is deployed. The code
reads and writes `user_profiles.terms_version`, `user_profiles.terms_accepted_at`,
and `terms_acceptances`; deploying first would send every signed-in account back
to an onboarding form that cannot save.

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
