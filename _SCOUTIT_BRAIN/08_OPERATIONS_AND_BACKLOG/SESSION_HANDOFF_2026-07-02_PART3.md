# Session Handoff — 2026-07-02, Part 3

> **Read this after Part 2** (`SESSION_HANDOFF_2026-07-02_PART2.md`). Same day, continued session:
> a real E2E pass on Part 2's fixes, the full NOAH flood heatmap build, and a long design
> conversation about co-working operators that's now written into
> `SCOUTIT_MASTER_BUILD_SPEC.md §9`. Nothing pushed to `main`/Vercel.

---

## 1. Real E2E pass — found a third production bug

Tested Part 2's fixes (`inviteBroker`, badge claiming) with a genuinely fresh Supabase Auth user,
not a pre-seeded profile. Real signup is currently broken ("Error sending confirmation email" — no
email provider configured on the project; flagged, not fixed, low priority pre-launch). Worked
around it using the Supabase Admin API to create a confirmed test user directly.

**Found + fixed:** no `user_profiles` row ever gets created for a new signup — nothing in the
codebase does it (`onboarding/page.js` only ever `SELECT`s; `profileClient.js`'s `upsertProfile()`
only runs if a user visits `/profile`). Since `user_badges` and `connect_balances` both foreign-key
to `user_profiles`, this would have silently blocked badges *and* Connects for every real new user,
indefinitely. Fixed with the standard Supabase pattern: an `AFTER INSERT ON auth.users` trigger
(`handle_new_auth_user()`) that auto-creates a minimal profile row.

**Verified after the fix**, with a real account, real money-adjacent logic:
- Badge claim: success → real count updates → duplicate claim correctly rejected (Postgres `23505`).
- Broker invite: no token → 401. Real listing + no Connects → clean 403 "Insufficient balance,"
  confirmed the `deals` row got rolled back correctly. Real listing + funded wallet (seeded 5
  Connects for the test) → full success, `deals` row created, `connect_transactions` ledger entry
  exactly right (bucket `granted`, amount `-1`, correct reason/ref).
- All test data (auth user, profile, badge, deal, transaction, audit log rows) deleted afterward.

## 2. NOAH flood heatmap — built, wired, verified

New `src/components/property/FloodHeatmapMap.js` — MapLibre GL JS + the `pmtiles` npm package,
pointed directly at the Hugging Face-hosted `flood_100yr.pmtiles` file
(`huggingface.co/datasets/bettergovph/project-noah-hazard-maps`) via the `pmtiles://` protocol and
HTTP range requests. **No re-hosting needed** — confirmed a single real tile is ~520KB, not the
full ~970MB file; the browser only ever fetches what's in view. Basemap is CARTO's free
`dark-matter-gl-style` (same one already used by the pre-existing `InteractiveRadiusMap.js`).

Inspected the PMTiles file's own metadata (`PMTiles.getMetadata()`) before writing any map code,
rather than guessing — source-layer is `flood_100yr`, single `Var` attribute (1/2/3 = NOAH's own
Low/Medium/High classification), mapped to a yellow/orange/red legend.

**Fully free, no paywall anywhere** — owner's explicit call: it's Philippine government open data
(NOAH), monetizing it would look bad. Extends the existing "flood risk never gated" rule to the
visual map too, not just the `FloodRiskScore` number.

**Wired into both `ResidentialFlow.js` and `CommercialFlow.js`** as a third "Flood Risk Map" tab
next to the existing Tactical Map / Directory List toggle in the Location chapter.

**Two more real bugs found and fixed while verifying live** (the Claude Preview sandbox tool has
*zero* external network access at all — had to verify in a real Chrome browser instead):
1. **`next.config.mjs`'s CSP never allowlisted `cartocdn.com` or `huggingface.co`/`hf.co`** in
   `connect-src`. This was *already* silently breaking the pre-existing `InteractiveRadiusMap.js`
   too (same CARTO URL), not something only the new feature hit. Fixed by widening `connect-src`
   to `https://*.cartocdn.com https://huggingface.co https://*.hf.co` — needed the wildcard because
   CARTO's style references a second subdomain (`tiles.basemaps.cartocdn.com`) for the actual
   tiles/sprite/fonts, not just the one hosting `style.json`.
2. **The map's wrapper div collapsed to ~2px tall.** The Location chapter's `.panel-content` is a
   flex container; the wrapper never got an explicit height (only its child did), so flex layout
   squashed it. Fixed by matching the exact pattern `ResidentialFlow.js` already uses for wrapping
   `InteractiveMap` — explicit height + `flex-shrink: 0` on the outer wrapper.

**Verification chain:** full trace (load → addSource → addLayer → ready) with no errors; real
network request to Hugging Face's CDN with correct range-header behavior; legend/marker/zoom
controls all render; independently confirmed real flood polygon data exists at a known flood-prone
Manila/Pasig River coordinate (520KB tile) to rule out a silent paint-expression bug — the test
property's own coordinates just don't happen to fall inside a mapped hazard zone in its visible
viewport, which is normal (most land isn't flood-prone).

**Not yet done:** HazardHunterPH per-property scoring, the rest of the Heatmap schema fields
(landslide/storm-surge/traffic/air-quality layers) — this session only shipped the flood layer, per
the locked spec.

## 3. Unit Delegation & Co-Working Operators — now written into the spec

Long design conversation about letting co-working operators (KMC, WeWork-style) manage specific
units inside buildings they don't own. Fully written up in `SCOUTIT_MASTER_BUILD_SPEC.md §9` —
read that section for the real detail. Summary:

- **Corrected an externally-pasted AI proposal** that would have resurrected the deprecated
  `units_inventory` JSON-blob pattern — units already moved to a real table (`property_units`)
  earlier this session; any operator delegation builds on that table (`operator_id` column), not
  JSON.
- **New route agreed:** `/property/[slug]/unit/[unit-id]` — Unit Master Page, sound on its own.
- **The "KMC is also a broker and a developer" identity problem** resolved by reusing three
  already-designed mechanisms (per-role "hats" from `TIER_DISTINCTION.md`, the Ownership Graph's
  Corporation-entity concept from this doc's §2, Mission Control's `permission_grants` pattern)
  instead of inventing a fourth.
- **Succession/transfer kept deliberately simple** (owner's call — don't over-engineer a rare
  event): explicit real-time transfer by the top permission holder, plus a Mission Control support
  fallback. No voting, no inactivity timers.
- **Sequencing:** Unit Master Page + `operator_id` column is buildable soon; full Enterprise Mode
  (multi-seat team access) stays parked until the RLS reset actually happens, since its security
  promise doesn't hold today.
- **Status: conversation-level agreement only** — no wireframes, no detailed permission-check
  design, no code yet. Next step (per owner) is a design-skill pass to produce the actual dashboard
  UI direction.

## 4. Files touched this session (part 3)

**Code:** `src/components/property/FloodHeatmapMap.js` (new), `src/components/property/
ResidentialFlow.js`, `src/components/property/CommercialFlow.js`, `next.config.mjs`,
`package.json`/`package-lock.json` (added `pmtiles`).

**Supabase:** migration for `handle_new_auth_user()` trigger + `on_auth_user_created` on
`auth.users`.

**Docs:** `SCOUTIT_MASTER_BUILD_SPEC.md` (new §9), `HEATMAP_NOAH_INTEGRATION_PLAN.md` (new §6),
`E2E_TEST_FIX_LIST.md` (items 1/1b/1c updated), this file, `NEXT_DAY_HANDOFF.md` (pointer updated).

**Nothing pushed to `main`/Vercel.**

## 5. What's next

Design-skill pass on the Unit/Operator dashboard UI (Owner's delegation flow, Operator's "Operated
Spaces" filtered dashboard, the Unit Master Page itself) — in progress as of this doc being
written. Then: real permission-check design, then code.
