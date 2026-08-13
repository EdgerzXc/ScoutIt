---
section: "15_IMPLEMENTATION_RECORDS/historical/launch-readiness"
status: reference
tags: [launch-readiness, lr-01, lifecycle, url-safety]
updated: 2026-08-02
---

# LR-01 implementation record

## Status

PARTIAL / FOUNDER ACTION. Local code and verification are complete for the
implemented contract. The additive migration has not been applied to live
Supabase, and Airtable still needs an immutable canonical-slug schema decision
or an approved staff-controlled migration path.

## Implemented

- First publication stores the Airtable-computed slug as `canonical_slug` and
  never writes Airtable's formula `Slug`.
- Live, off-market, staff-suspended, and permanently removed rows cannot take
  ordinary title edits while the mutable Airtable formula remains in place.
- Withdraw unpublishes Airtable, retains the Supabase row, records an event, and
  exposes no ordinary public CMS/sitemap record.
- Authenticated off-market reads are separate from `/api/cms` and require the
  owner, Cluster/Universe, or an explicitly enabled pre-200 locker. Contact is
  disabled unless `quietly_open_to_offers` is true.
- Owner deletion is now a retained, guarded removal with exact-title and
  re-authentication confirmation plus dependency preflight. It never performs a
  physical row or Airtable record delete.
- A collapsed, touch-safe mobile Danger Zone and a private `/off-market` route
  are present.

## Verification

- `npm.cmd run lint` — pass.
- `npm.cmd run test:unit` — 24 files, 415 tests, pass.
- Focused Playwright LR-01 spec — 4 desktop/Mobile Chrome tests, pass.
- `npm.cmd run build` — pass with network approval for configured Google fonts.
- Migration structural check — pass; Supabase CLI was unavailable, so no local
  database rebuild was run.

## Temporary safety protection

Live/off-market/staff-suspended/permanently-removed title edits are blocked
until Airtable can hold an immutable canonical slug. Permanent removal and
withdrawal fail closed if Airtable cannot be unpublished or dependency checks
cannot be completed.
