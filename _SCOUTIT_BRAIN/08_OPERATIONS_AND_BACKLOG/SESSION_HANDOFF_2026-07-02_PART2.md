# Session Handoff — 2026-07-02, Part 2

> **Read this after `SESSION_HANDOFF_2026-07-02.md`** — this is a second, later session on the
> same day. Owner asked to "one shot" the outstanding items instead of doing them one at a time,
> then said to proceed fully autonomously. Nothing was pushed to `main`/Vercel.

---

## 0. Correction mid-session: the Master Build Spec DOES exist — just outside the repo

Spent a chunk of this session believing the "Master Build Spec" (cited everywhere with §3/§4.1/§5/
§6/§7 section numbers) was a phantom reference, because a repo-wide search turned up nothing. **It
exists at `C:\Users\jerze\OneDrive\Desktop\SCOUTIT_MASTER_BUILD_SPEC.md`** — on the Desktop,
outside the project folder entirely, dated 2026-07-01. Should have checked outside the repo before
concluding it didn't exist — noted here so a future session doesn't repeat the mistake. **Add a
pointer to this file from `00_START_HERE.md` or copy it into `_SCOUTIT_BRAIN/` so this doesn't
happen again** — not done this session, flagging it.

This correction landed **after** part of the Mission Control / Badge Engine work below was already
built on the wrong assumption — see §1 and §3 for what that cost and how it was fixed.

## 1. Mission Control — real spec says build a standalone app; NOT done, corrected from earlier claim

**Earlier in this session I concluded "Mission Control already exists as a 24-page Airtable
Interface, nothing to build" — this was wrong**, based on not having found the real spec yet. The
actual spec (§3) is explicit: build a **standalone Next.js app, separate Vercel deployment**, with
**Supabase magic-link auth**, `admin_users`/`permission_grants`/`system_audit_logs` tables, role-
based permissions, a circuit breaker, and a refutation loop. It says outright: *"This supersedes
the earlier Airtable-Interface version of Mission Control (`pbdyvI1PCjfhxUH5V`) — do not build that
version."* The Airtable Interface (`MISSION_CONTROL_SOP.md`) is the **old, being-phased-out**
version, not a substitute.

**Not built this session** — this is a substantial, security-sensitive, multi-page standalone app
(auth, roles, audit logging, admin CRUD across most of the platform's data). Building it rushed
inside an already-long session would be reckless given what's at stake (it's the founder's
back-office control panel). This needs its own dedicated planning session. Flagging accurately here
instead of repeating the earlier wrong "nothing to do" claim.

## 2. Fixed: `inviteBroker()` missing Authorization header (known bug from part 1)
`src/context/DashboardContext.js` → `inviteBroker()` now calls `getSession()` and attaches
`Authorization: Bearer <token>`, matching the pattern in `badges/page.js`. Verified `/dashboard`
still renders cleanly (no console/server errors). **Still needs a real logged-in click-through** —
tracked in `E2E_TEST_FIX_LIST.md` #1.

## 3. Fixed: `user_profiles.badges` column didn't exist (real production bug, bigger than expected)

Went looking for "Badge Engine" (§5) work and found it was already partially built
(`src/lib/BadgeEngine.js`, `/badges` page, `/api/badges/claim` route) — but broken. Three live code
paths referenced a `badges` column on `user_profiles` that was **never migrated into the schema**:
`profileClient.js`'s `upsertProfile()` and `loadPublicProfile()`, and the claim route. Every one of
these has likely been silently failing (PostgREST rejects writes/selects on unknown columns).

**First fix (superseded — see correction below):** added a `badges jsonb` column directly on
`user_profiles` and stored claims there. This got the flow working and verified, but **diverged
from the real spec (§5.2)**, which calls for a proper relational `user_badges` Supabase table
(`user_id`, `badge_id`, `earned_at`, `granted_by`, `progress_snapshot`) — the shape Mission
Control's future Trust/Economy pages will need to query directly.

**Corrected once the real spec was found:** since zero real users had claimed anything yet (the
jsonb column was brand new, only throwaway test data had ever touched it), redid it properly at
zero data-migration cost rather than leaving the wrong shape in place for Mission Control to
inherit later:
- Migration `create_user_badges_table` — real `user_badges` table per spec §5.2 (used `user_id`
  text, not `user_email` as literally written in the spec, to match the `user_id` convention every
  other live table already uses — e.g. `connect_balances`, `deals`; a real `user_email` join key
  would be the odd one out. Flagging this one deliberate deviation from the literal spec text.).
  Dropped the now-unnecessary `user_profiles.badges` column in the same migration.
- `api/badges/claim/route.js` — enforces real `max_slots` scarcity server-side via a `count` query
  against `user_badges` (previously unenforced entirely — the hardcoded `claimed` numbers in
  `BADGE_DEFINITIONS` were cosmetic only, meaning the scarce Pioneer cohorts could have been
  oversold with no server-side check at all). Duplicate claims rejected by the table's
  `unique(user_id, badge_id)` constraint.
- New `GET /api/badges` — returns real per-badge claimed counts computed from `user_badges`, merged
  with `BADGE_DEFINITIONS` metadata. `FOUNDING_SEEKER`/`ALPHA_CARTOGRAPHER` keep their hardcoded
  historical counts (pre-launch cohorts closed before this system existed — not live-queryable);
  the three `PIONEER_*` cohorts now show real counts.
- `badges/page.js`, `profileClient.js` — updated to read/write `user_badges` instead of the removed
  column. `badges/page.js`'s current-user badges now come from a real Supabase session when one
  exists, falling back to the dev-toolbox mock user only when there's no real session (previously
  it *only* checked localStorage, so a real logged-in user with no dev-toolbox mock set would
  always see "please log in").
- `BADGE_DEFINITIONS` itself stays hardcoded in `src/lib/BadgeEngine.js` rather than moving to an
  Airtable table as spec §5.1 calls for — Airtable work is still explicitly paused this session
  ("pure codebase" mode from part 1), and this is exactly the kind of Airtable-dependent piece the
  session handoffs have consistently deferred. Resume per spec once Airtable work resumes.

**Verified (twice — once before the correction, once after):** `/badges` renders real `0/20`
counts (previously hardcoded `14/20`, `8/20`, `19/20`); `GET /api/badges` returns correct JSON; the
claim route's scarcity-check and duplicate-claim logic verified directly against real
`user_badges` rows (inserted, counted, confirmed the unique-constraint rejection with the exact
Postgres error code (`23505`) the route checks for, deleted — no real data left behind). Could not
click-test the actual POST end-to-end because no real Supabase Auth session was available in this
environment — tracked in `E2E_TEST_FIX_LIST.md` #1b.

**Found but not fixed (spawned as a separate flagged task, `task_ce5cea06`):** a second, disconnected
badge catalog (`src/lib/badges.js`'s `BADGE_REGISTRY`, used only by `VaultOfHonor.js`) with entirely
different badge IDs, permanently hardcoded to mock data. Also, `settings/page.js` sources its whole
profile (name/tags/badges) from the localStorage mock-user pattern rather than the real session,
inconsistent with the same page's password/2FA sections which use real Supabase Auth. Didn't fix
either — real but broader scope-creep risk than the badge engine ask.

## 4. Role-column decision — corrected the docs, did NOT build it

Re-read `06_MONETIZATION/TIER_DISTINCTION.md` (a real, dated 2026-06-25 spec I hadn't seen before) —
per-role Connects wallets **is** a locked design, not a documentation error. But it's explicitly
downstream of a "foundation refactor" (storing `subscription_tier` per-role instead of one
account-wide value) that **hasn't started**, and there's no payment provider wired at all yet
(checkout is a 404). Adding a `role` column to just `connect_balances`/`connect_transactions` now
would build one slice of a multi-file refactor without its prerequisite. **Decision: don't build
it now** — corrected `E2E_TEST_FIX_LIST.md` #6 and added a live-DB-check note to
`TIER_DISTINCTION.md §0` so a future session doesn't have to re-discover this.

## 5. NOAH heatmap — technical path confirmed conclusively (no code built)

Used a real browser to inspect `noah.up.edu.ph`'s Network tab (the check the integration plan asked
for). **Confirmed: no WMS/raster path exists.** Everything is Mapbox GL JS vector tiles, hosted
under NOAH's own private Mapbox account (`upri-noah`) and authenticated with their own token — even
a promising-looking `webgis-static.up.edu.ph` "combined tileset" endpoint turned out to just be a
manifest pointing back at the same `mapbox://upri-noah.*` IDs, not self-hosted data. Full findings
+ updated build order in `HEATMAP_NOAH_INTEGRATION_PLAN.md §4-5`. Bottom line: the only sound path
is self-hosting the Hugging-Face-mirrored open PMTiles file with MapLibre GL JS + the `pmtiles`
protocol — not pointing at NOAH's live site, and not a quick add. Not built this session (correctly
scoped as its own dedicated build).

## 6. Critical, unrelated finding: RLS is effectively disabled platform-wide

While investigating the badge column, checked `user_profiles`'s RLS policies and found a
`dev_all_user_profiles` policy granting `ALL` unconditionally to `public`. Checked further with
Supabase's own security advisor — the same pattern (`dev_all_<table>` or similarly-named policies
with `USING (true) WITH CHECK (true)`) exists on **15+ tables**: `user_profiles`,
`connect_balances`, `connect_transactions`, `properties` (full CRUD), `deals`, `broker_profiles`,
`researcher_profiles`, `subscriptions`, `privacy_settings`, `saved_intel`, `property_units`,
`bounty_claims`, `error_reports`, `projects`, `deal_messages`. Since RLS policies are OR'd
together, these wide-open policies make the narrower "own row only" policies on the same tables
moot — anyone with the public anon key (which ships in every client bundle by design) can
currently read/write/delete every row in nearly the whole database, no login required.

**Not touched.** This matches the owner's already-existing, deliberate plan (per project memory
and `VULNERABILITY_AUDIT_2026-06-26.md`) to do one full Supabase/RLS reset as a single dedicated
pass, which the owner is personally self-studying. Added the precise table list + advisor
confirmation to `VULNERABILITY_AUDIT_2026-06-26.md`'s existing "Supabase reset with RLS on from
day one" checklist item so that reset has a ready-made target list instead of starting from
scratch. **Flagging prominently here too since it's more concrete/severe than the doc's original
vague note** — this is fine pre-launch with no real user data at stake, but is the single highest-
priority item before any real users or real Connects purchases happen.

## 7. What's still open

1. **Mission Control (real spec, §3)** — a standalone Next.js app with magic-link auth, roles,
   permission grants, audit logging. Not started. Big enough to need its own planning session —
   don't rush it into an already-long session next time either.
2. **RLS reset** (§6) — owner-owned, deliberately deferred, now has a precise target list.
3. **Real E2E click-through pass** — `inviteBroker`, badge claim, Connects spend routes all need a
   real logged-in session test; tracked in `E2E_TEST_FIX_LIST.md`.
4. **Badge system reconciliation** — spawned as `task_ce5cea06` (the second, dead `lib/badges.js`
   catalog + `settings/page.js`'s localStorage-only profile loading), not started. Also: move
   `BADGE_DEFINITIONS` from hardcoded JS to the spec's Airtable table once Airtable work resumes.
5. **Per-role tier/wallet foundation refactor** — its own future project, not started, now has an
   accurate doc trail instead of a vague "add a column" note.
6. **NOAH map layer build** — path confirmed, actual build (MapLibre GL JS + self-hosted PMTiles)
   is next-session work per the updated `HEATMAP_NOAH_INTEGRATION_PLAN.md`.
7. **Copy/link the real Master Build Spec into the repo** (§0) — it currently only lives on the
   Desktop; add a pointer from `00_START_HERE.md` at minimum so this doesn't get "lost" again.
8. Everything already paused from part 1 (Units wiring, Airtable-adjacent work) — still paused.

## 8. Files touched this session (part 2)

**Code:** `src/context/DashboardContext.js`, `src/app/api/badges/route.js` (new),
`src/app/api/badges/claim/route.js`, `src/app/badges/page.js`, `src/lib/profileClient.js`.

**Supabase:** migration `create_user_badges_table` (new `user_badges` table per spec §5.2;
superseded an earlier same-session migration, `add_badges_column_to_user_profiles`, which added
then this migration removed a `user_profiles.badges` column — no real data was ever in it).

**Docs:** `E2E_TEST_FIX_LIST.md`, `TIER_DISTINCTION.md`, `HEATMAP_NOAH_INTEGRATION_PLAN.md`,
`VULNERABILITY_AUDIT_2026-06-26.md`, this file, `NEXT_DAY_HANDOFF.md` (pointer updated).

**Nothing pushed to `main`/Vercel.**
