# Units Feature + Data-Layer Reconcile — Handoff (2026-06-22)

Self-contained handoff for the next session (Antigravity, resuming ~Wed 2026-06-24).
Pick up from here — assume no chat memory.

---
## 🆕 2026-06-29 UPDATE — units editor rebuilt, save crash fixed, public render wired
This supersedes parts of the backlog below. What changed today:

1. **ROOT-CAUSE: unit saves silently failed in prod.** `/api/dashboard/update` was 500-crashing on
   every call because `isomorphic-dompurify` → `jsdom` throws `ERR_REQUIRE_ESM` at module load under
   Next 16 / Turbopack serverless. Optimistic UI showed "saved", then refresh reverted (looked like a
   React bug; was 100% server-side). **Fix:** `src/lib/sanitize.js` is now dependency-free; routes
   `update`, `bulk-insert`, `waitlist` use `stripAllTags`. (Same crash had silently broken bulk import
   + waitlist too.)
2. **Save UX:** auto-save + manual **Save Changes** button now share one debounced `persist()` path;
   button is an animated state machine (idle → Saving… → Saved ✓ → idle, red Retry on fail).
   `updateListing()` returns a real boolean now.
3. **DONE — Step C "owner spreadsheet-grid view":** shipped as the dedicated
   `src/components/dashboard/InventoryGridManager.js` at `/dashboard/inventory/[id]`. Adds Floor field,
   floor-grouping (collapsible), search, bulk-add N units, duplicate unit, live unit/floor counts,
   tier-gated photos (free 1 / pro 5).
4. **DONE — ResidentialFlow units:** `ResidentialFlow.js` now renders real units (same mapping as
   `CommercialFlow.js`). BOTH flows now also render owner **features** (were ignored) + **floor**, and
   resolve unit photos as `photo || image || photos.find(Boolean)`.
5. **Schema:** per-unit object now `{ id, name, size, floor, features[], photos[], image, price? }`.
   See `04_DATA_AND_SCHEMA/DATA_DICTIONARY.md → §3`.

**Still open:** confirm the publish/approve step copies `units_inventory` → Airtable `Units_JSON` so
owner units appear on the PUBLIC page (a pending Supabase-only property still shows synthesized
fallback units, since the public page reads the `/api/cms` Airtable feed).
---

## TL;DR status
- **All of today's work is committed + pushed**: commit `cfca1f0` on `main`, deployed to Vercel prod.
- **Production is healthy**: `scoutit.vercel.app` → 200; `GET /api/cms` → `"source":"airtable"` (live data, not mock).
- Working tree is clean. `add_units_check.mjs` (obsolete diagnostic) was removed.

## What was DONE today

### 1. CRITICAL fix — owner data layer was pointed at a table that doesn't exist
Commit `9a807ef` (earlier on 2026-06-22) had renamed all Supabase code refs from the real
`properties` table → a `property_submissions` table that was never created (and renamed columns:
title→property_title, pipeline_status→status, etc.). This silently broke owner submit / approve /
dashboard-load. Reconciled back to the real schema across 5 files:
- `src/context/DashboardContext.js`
- `src/app/api/dashboard/update/route.js`
- `src/app/api/admin/approve/route.js`
- `src/app/admin/page.js`
- `src/lib/profileClient.js`
Real `properties` columns: `title, type, space_category, slug, location, price, description,
media_link, completeness_score, verified, pipeline_status, details(jsonb), coordinates(geography
— insert as WKT string 'POINT(lng lat)'), owner_id`. Verified via a live DB round-trip insert/delete.

### 2. Units feature — EMBEDDED model (no separate units table, no migration)
A building's units live as `properties.details.units_inventory` = array of
`{ name, size, price, floor, photo }`.
- **Owner editor** (`src/components/dashboard/LiveEditorWorkspace.js`): "Available Inventory"
  card form already writes `details.units_inventory`. Now it actually persists (data layer fixed).
- **Public/buyer** (`src/components/property/CommercialFlow.js`): real `units_inventory` OVERRIDES
  the old spec-synthesized fake units. Clicking a unit → hero photo crossfades to that unit's
  photo + a "Selected Unit — Full Detail" sub-panel shows its specs. Falls back to synthesized
  units when a property has none. (Verified locally with temp mocks.)
- **Airtable bridge** (`src/lib/airtable.js`): `insertProperty`/`updateProperty` serialize units to
  a `Units_JSON` string field on approval; `fetchProperties` parses `Units_JSON` back into
  `units_inventory` (mirrors the existing `WhereTo` JSON pattern).

### 3. Infra (done via connectors/CLI this session)
- Airtable `PROPERTIES_CMS` table: added `Units_JSON` field (multilineText, `fldqfJavPbBtuJLZG`).
- Vercel Production env vars: added the missing `AIRTABLE_API_KEY` + `AIRTABLE_BASE_ID`
  (Supabase URL/anon + Mapbox were already present). Redeployed → live site now serves Airtable.
  NOTE: the Vercel *connector* has no env tool; use the authenticated `vercel` CLI (`vercel env add/ls`).

## NATURAL NEXT STEP (start here)
**End-to-end verify the live units pipeline** now that every piece is deployed:
1. Log in as an owner (demo-owner login still present), create/edit a property, add 2-3 units in
   "Available Inventory", save.
2. Confirm it lands in Supabase `properties` (`pipeline_status='pending'`) with units inside
   `details.units_inventory` (Supabase table editor or SQL).
3. Approve it (admin flow → `/api/admin/approve`) and confirm the Airtable record gets `Units_JSON`
   populated + `Approved_For_ScoutIt` checked.
4. Open the public property page → confirm the real units render, photo-swaps on click, detail panel shows.

## REMAINING BACKLOG
- ✅ **DONE (2026-06-29) — Step C owner grid view**: shipped as `InventoryGridManager.js`
  (`/dashboard/inventory/[id]`) with floor-grouping, search, bulk-add, duplicate, counts.
- ✅ **DONE (2026-06-29) — ResidentialFlow units**: real-units rendering applied (now also renders
  features + floor in both flows).
- **Update-after-approval units sync**: `/api/dashboard/update` currently syncs title/type/location
  (+ Units_JSON via updateProperty if details passed). Confirm edited units re-sync to Airtable.
  (Note the update route's `details` merge now persists `units_inventory` correctly post-crash-fix.)
- **Pre-launch security**: remove the demo-owner login button + dev-open access before public launch.

## KEY FACTS / GOTCHAS
- Dual-CMS rule: Airtable = public read-only (via `src/app/api/cms/route.js` proxy); Supabase =
  private owner data. Owner submit → Supabase `properties` → admin approve → copied to Airtable →
  public reads Airtable. Units ride this whole chain via `details.units_inventory` ⇄ `Units_JSON`.
- Do NOT reintroduce `property_submissions`. The table is `properties`.
- `/api/cms` returns `"source":"mock_fallback"` when Airtable env vars are missing — a useful health
  signal. Should read `"airtable"` in prod.
- Verify with text probes, not screenshots (preview screenshots time out on this project).
