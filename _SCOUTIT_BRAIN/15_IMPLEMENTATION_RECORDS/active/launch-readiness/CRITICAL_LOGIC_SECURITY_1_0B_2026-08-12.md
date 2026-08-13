---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: active
tags: [security, implementation-record, phase-1, critical, rls, handshake, telemetry, migration-drift]
updated: 2026-08-12
related:
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]]"
  - "[[MIGRATION_DRIFT_2026-08-12]]"
  - "[[FULL_SYSTEM_REAUDIT_2026-08-09]]"
---

# §1.0B — CRITICAL LOGIC & SECURITY FLAWS (2026-08-12)

Implementation record for Master Action Plan §1.0B. Ten audit findings, plus
four further problems discovered while fixing them.

**Supabase project inspected:** `yyixsuaimdzyiocswcgc` (ScoutIT, ap-northeast-2,
Postgres 17.6). Single project — there is no staging environment.

---

## 0. The headline: the migration files did not describe the live database

The first version of this remediation was written by reading
`supabase/migrations/`. **That was wrong, and it would have failed or silently
done nothing on production.** A read-only inspection of the live database on
2026-08-12 found that several repo migrations were never applied.

This is recorded in full in [[MIGRATION_DRIFT_2026-08-12]]. The consequences for
*this* work were:

| Assumption from the repo | Live reality | What would have happened |
|---|---|---|
| SELECT policy `"Public read for live properties"` exists | Actual name is `"Public can read published properties"` | `DROP POLICY IF EXISTS` matches nothing, then a **second** permissive SELECT policy is created alongside the old one. RLS SELECT policies are OR'd — the fix would have restricted **nothing** while appearing to succeed. |
| UPDATE policy `"Parties update own deals"` exists on `deals` | **No UPDATE policy at all** | Adding a policy would have **granted** client update rights that do not currently exist. The audit's requested fix would have been a **downgrade**. |
| `security_access_logs` has `city/country/latitude/longitude` | Columns absent | The upsert function references them → immediate failure. |
| Pageview duplicates already collapsed by `20260809000001` | 130 extra rows / 67 duplicate groups present | `CREATE UNIQUE INDEX` → immediate failure. |
| `user_profiles.scout_rating` exists | It does not; `scout_rating` is on `broker_profiles` | The rating write would have raised at runtime. |

The rewritten migration is now written against the **live schema** and is
self-sufficient — it does not assume any other migration ran first.

---

## 1. Live pre-flight evidence (read-only, 2026-08-12)

Every number below was measured, not estimated.

**Data-impact checks — all three destructive operations are no-ops today:**

| Check | Value | Meaning |
|---|---|---|
| `saved_intel` total rows | 0 | Nothing to deduplicate |
| `saved_intel` duplicate rows that would be deleted | 0 | Zero data loss |
| `property_claims` total rows | 0 | TEXT→UUID conversion is trivially safe |
| `property_claims` unresolvable `property_id` | 0 | Conversion will not raise |
| `properties` total | 13 | — |
| `properties` public **now** (`pipeline_status='approved'`) | 10 | — |
| `properties` public **after** (`lifecycle_state='live'`) | 10 | — |
| Properties that **disappear** from public read | **0** | Policy swap changes no listing's visibility |
| Properties that **newly appear** | **0** | " |

**Telemetry:**

| Check | Value |
|---|---|
| `security_access_logs` total rows | 1,557 |
| of which `FRICTION:`/`SEARCH:` | 25 |
| Duplicate groups (all rows) | 69 |
| Extra rows collapsing into counters | 145 (130 pageview + 15 friction/search) |

**Deals / handshakes:** `deals` = 0 rows, `deal_handshakes` = 0 rows, 0 completed
transaction handshakes, 0 ratings incremented. The forgery hole was live but had
not yet been exercised.

**Live RLS state before the change:**

| Table | RLS | Policies |
|---|---|---|
| `properties` | on | SELECT `pipeline_status='approved'`; SELECT own; UPDATE own (**no WITH CHECK**); INSERT own; DELETE own |
| `deals` | on | SELECT own; INSERT denied (`false`); **no UPDATE policy** |
| `deal_handshakes` | on | **no policies** → deny-all to clients |
| `saved_intel` | on | SELECT/INSERT/DELETE own |
| `property_claims` | on | SELECT/INSERT own |
| `security_access_logs` | on | `"no client access"` (`false`/`false`) |

---

## 2. What was wrong, and what each fix actually does

### 2.1 Transaction handshake forgery — `complete_transaction_handshake`

The creating `INSERT` wrote `party_a_signed_at = now()` unconditionally.
Whoever called first created a row in which the *buyer* was already recorded as
having signed. A broker calling first, then signing as party B, completed a
two-sided handshake with zero buyer participation — and Handshake #2 is the only
event that credits broker standing. The number a broker shows a stranger was
unilaterally mintable.

The function now inserts both signature columns `NULL`, rejects a caller who is
not one of the two named parties (`42501`) rather than silently doing nothing,
short-circuits on `declined`/`expired`, and guards the credit behind
`rating_incremented` so it cannot fire twice.

**Second bug found while fixing the first.** The old body ran
`UPDATE public.user_profiles SET scout_rating = COALESCE(scout_rating,0)+1`.
`user_profiles` has no `scout_rating` column — that statement would have raised
at runtime the first time any handshake completed. It never fired only because
zero handshakes exist. `scout_rating` lives on `broker_profiles` and is
`numeric(3,2)`: a 0–5 quality rating that **overflows at 10.00**, so
incrementing it by 1 per closed deal was never correct either.

The migration now increments `broker_profiles.verified_closures` (integer, and
semantically exactly "a deal this broker closed"), warns rather than fails if
the broker has no profile row, and returns `rating_updated` truthfully.

**Left open deliberately:** how a verified closure should influence the
displayed 0–5 `scout_rating` is a product decision, not a security fix. Flagged
to the owner rather than invented here.

### 2.2 Global deal handshake sabotage (IDOR) — `/api/deals/handshake`

`action: "decline"` updated `deal_handshakes` filtered on `deal_id` alone, under
the service role, which bypasses RLS. Any signed-in adult could decline any deal
on the platform, in a loop.

The route now loads the deal and returns 403 unless the caller is its buyer or
broker. A non-existent deal returns the *same* 403 — otherwise the endpoint is a
deal-ID oracle. The update is additionally scoped to `status = 'pending'`. A
matching `decline_deal_handshake` RPC carries the same party check in the
database for any future caller.

**Deliberately not done:** the update was not scoped with a PostgREST `.or()`
filter interpolating `userId`. The party check already establishes authority,
and string-building a filter from a session value is a habit worth not forming.

### 2.3 Storage exhaustion via telemetry — `/api/telemetry/device`

Unauthenticated POST, service-role insert, one row per request. The derived
identity is `HMAC(client_ip : user_agent)` — and User-Agent is caller-supplied,
so a single client could mint unlimited distinct identities and therefore
unlimited rows.

Three layers, because none is sufficient alone:

1. `src/proxy.js` already meters `/api/:path*` at 30/10s via Upstash. It is the
   strongest layer and it was **not enough**: it is skipped outside production
   and it *fails open* when Redis is unconfigured or unreachable, because
   telemetry is not on the sensitive-path list.
2. A new per-instance limiter (`src/lib/rateLimit.js`), 120/min, metered on the
   platform-supplied client IP rather than the spoofable derived identity, and
   evaluated **before** parsing or any database call. It needs no external
   service, so it is exactly the layer that survives a Redis outage. It is
   per-instance — real ceiling is (limit × warm instances). Stated, not hidden.
3. The structural fix: every telemetry row becomes a counter keyed by
   `(masked_ip, route_accessed)` over a closed route allowlist, so a flood can
   only increment counters, never grow the table.

The pre-migration insert path is retained in the route as a fallback so it stays
correct on a database where the migration has not been applied.

### 2.4 `saved_intel` duplicates

`/api/wishlist/merge` is idempotent by read-then-insert. That is a race, not a
constraint. `uq_saved_intel_user_property` now enforces it in the schema. The
table is not defined in any migration — it was created outside the migration
flow — so the block is guarded by a `to_regclass` existence check.

### 2.5 Property self-approval

The live UPDATE policy let an owner set their own `pipeline_status='approved'`
and `lifecycle_state='live'`, bypassing Mission Control review entirely. RLS
cannot express a per-column `WITH CHECK`, so this is a trigger:
`enforce_property_moderation_authority()` freezes both columns against any
non-service-role session and forces a client-created property back to
`pending`/`draft` if it arrives pre-approved. Other submission states (`draft`,
`ai_drafting`) pass through untouched so existing intake flows keep working.

**Third bug found while fixing:** the trigger was first written `SECURITY
DEFINER`. Inside a `SECURITY DEFINER` function `current_user` is the function
**owner** (`postgres`), so the privilege check would have passed for everyone
and the guard would have been purely decorative. Both new trigger functions are
`SECURITY INVOKER`, where `current_user` is the effective PostgREST role
(`authenticated` / `anon` / `service_role`) — which is the actual question.

Verified safe: every route that writes `lifecycle_state`/`pipeline_status`
(`dashboard/archive`, `dashboard/delete`, `off-market`, `property/verify`,
`admin/approve`, `cron/check-stale-listings`) uses `supabaseAdmin`, and Mission
Control CMS actions use `createAdminClient` — all service role, all unaffected.

### 2.6 Property UPDATE had no `WITH CHECK` — ownership transfer

Not in the original audit list; found during inspection. The live policy checked
only the row being updated (`USING`), not the row being written, so an owner
could set `owner_id` to another user in the same statement and hand away — or,
with a guessed id, take over — a listing. Recreated with a matching `WITH CHECK`.

### 2.7 Unrestricted intel ingestion — `/api/intel/ingest`

`publish=true` set `Approved_For_Live_Site` on a new INTEL_CMS record. Any
authenticated account could put an article on the public `/intel` surface
without passing Mission Control.

Ingest stays open to authenticated users (the parse/preview path is harmless);
publishing now runs through `requireAdmin` from `src/lib/adminGuard.js` — the
one admin gate, which checks both `role` and `active_roles`. Non-staff gets 403
and nothing is written.

### 2.8 Deal hijacking — **the audit's requested fix was wrong for this database**

The audit asked for a `WITH CHECK` on the `deals` UPDATE policy. On the live
database there is **no UPDATE policy on `public.deals`**, and RLS is enabled —
which is deny-all, i.e. already stronger than the requested fix. Creating that
policy would have **granted** client update rights that do not exist today.

It is therefore deliberately **not created**. What ships instead is the durable
half: `enforce_deal_party_immutability()` makes `buyer_id`, `broker_id`, and
`property_id` immutable and blocks a party from unilaterally closing a deal —
so whenever an UPDATE policy is eventually added, the hole is already shut.

### 2.9 Unbounded `geocodeCache`

`src/lib/cmsCache.js` keyed a process-lifetime `Map` on `p.location` — free
text. Novel strings grew the Map *and* spent one Mapbox call each, which
exhausts the geocoding rate limit for real visitors. That is the more expensive
of the two failure modes and the reason this was not merely a memory-leak item.

Replaced with `BoundedCache` (LRU, 2,000 entries) from the new dependency-free
`src/lib/boundedCache.js`. `lru-cache` would have worked; the requirement is
get/set/has with a cap, and `Map` already preserves insertion order, so a new
dependency was not justified.

One subtlety the tests pin: the cache stores `null` to mean "Mapbox knows
nothing about this string". A cap that treated a stored `null` as a miss would
have re-asked Mapbox for every unknown location on every request —
reintroducing the exact burn the cap exists to stop.

### 2.10 RLS read policy keyed to the wrong column

Public SELECT used `pipeline_status = 'approved'`, keeping approved-but-
withdrawn, off-market, and permanently-removed properties publicly readable.
Now `lifecycle_state = 'live'`. Both the live policy name and the repo's
aspirational name are dropped, so the statement is correct in either state.

### 2.11 `property_claims.property_id` typing

`TEXT` with no foreign key. Converted to `UUID REFERENCES public.properties(id)
ON DELETE CASCADE`, with the partial unique index dropped and recreated around
the conversion. Guarded: the migration **raises** rather than converting if any
existing value is not a resolvable property, instead of silently discarding
claims.

---

## 3. Files changed

| File | Change |
|---|---|
| `supabase/migrations/20260812000001_critical_logic_and_security_fixes.sql` | New. All database fixes, written against the live schema. |
| `src/app/api/deals/handshake/route.js` | Party check before decline; scoped update. |
| `src/app/api/intel/ingest/route.js` | `requireAdmin` gate on `publish=true`. |
| `src/app/api/telemetry/device/route.js` | Per-IP limiter; counter upserts for friction/search. |
| `src/lib/boundedCache.js` | New. Dependency-free LRU. |
| `src/lib/rateLimit.js` | New. Fixed-window in-process limiter. |
| `src/lib/cmsCache.js` | `geocodeCache` bounded to 2,000 entries. ⚠️ **See §7 — this file is NOT self-contained and was pulled from the ship set.** |
| `src/lib/__tests__/criticalSecurityFixes1_0B.test.js` | New. 11 tests. |
| `src/lib/__tests__/deviceTelemetryApi.test.js` | 2 stale contracts updated, 4 tests added. |

---

## 4. Verification evidence

| Check | Result |
|---|---|
| `criticalSecurityFixes1_0B.test.js` (new) | 11/11 pass |
| `deviceTelemetryApi.test.js` | 16/16 pass (12 before) |
| `dealHandshakeApi.test.js` + `handshakeLifecycle.test.js` | 5/5 pass |
| `propertyClaimApi.test.js` + `propertyLifecycle.test.js` | 26/26 pass |
| `adminGuard.test.js` + `cmsFallback.test.js` | 17/17 pass |
| `npm run lint` (`src` + `mission-control/src`) | clean |
| Live pre-flight inspection | 5 read-only queries, §1 above |

### What was NOT verified, and why

Stated plainly rather than implied:

- **The full 882-test unit suite was not run to completion.** The verification
  environment mounts the repository over a filesystem where jsdom setup costs
  40–90 s *per test file*; the complete suite cannot finish inside the available
  execution window. Targeted suites covering every touched module were run
  instead. **The full suite, the production build, and the Playwright
  desktop/mobile matrix remain part of the release gate.**
- **No staging environment exists**, so the migration could not be rehearsed on
  a copy. Confidence rests on the live pre-flight measurements in §1, which show
  every destructive operation is a no-op on current data.
- **Two stale test contracts were updated, not deleted.** The telemetry geo-
  fallback and error-hiding tests previously drove the raw insert path; they now
  reach it by declaring the RPC absent, so they still prove the same behavior on
  a pre-migration database.

### Environment note

The Linux `@rolldown/binding-linux-x64-gnu` package was added under
`node_modules/@rolldown/` so vitest could run in the Linux verification sandbox
(the checkout carries the win32 binding). It is not in `package.json` or the
lockfile and is inert on Windows, but it could not be removed afterwards
(permission denied on the mount). `npm ci` will clear it.

---

## 5. APPLIED TO PRODUCTION — 2026-08-12

**Project:** `yyixsuaimdzyiocswcgc` (ScoutIT). Applied by agent with owner
approval, after the live pre-flight in §1.

Applied as five tracked migrations rather than one, so a failure in any section
would be isolated and recoverable. Each is individually idempotent:

| # | Migration name | Result |
|---|---|---|
| 1 | `fix_1_0b_handshake_forgery_and_decline_authority` | success |
| 2 | `fix_1_0b_property_moderation_authority_and_rls` | success |
| 3 | `fix_1_0b_deal_party_immutability` | success |
| 4 | `fix_1_0b_saved_intel_unique_and_property_claims_uuid` | success |
| 5 | `fix_1_0b_telemetry_storage_exhaustion` | success |

### Post-application verification (live queries)

**Objects — all present:**

| Object | State |
|---|---|
| `record_security_event()` | created |
| `decline_deal_handshake()` | created |
| `enforce_property_moderation_authority()` | created, **SECURITY INVOKER confirmed** |
| `enforce_deal_party_immutability()` | created, **SECURITY INVOKER confirmed** |
| `trg_enforce_property_moderation_authority` | active |
| `trg_enforce_deal_party_immutability` | active |
| `uq_security_event_identity_route` | created |
| `uq_saved_intel_user_property` | created |
| `property_claims.property_id` | now `uuid` |
| `property_claims_property_id_fkey` | created |
| `complete_transaction_handshake` still fabricates party A's signature? | **false** — forgery path gone |

**Data — impact exactly as predicted, nothing lost:**

| Measure | Before | After |
|---|---|---|
| `security_access_logs` rows | 1,557 | **1,412** (145 duplicates collapsed) |
| Sum of `request_count` (the actual observations) | — | **4,205 preserved** |
| Duplicate `(masked_ip, route_accessed)` groups | 69 | **0** |
| `properties` total | 13 | 13 |
| Properties publicly readable | 10 | **10 — unchanged** |
| `saved_intel` rows | 0 | 0 |
| `property_claims` rows | 0 | 0 |

**Policy state after:**

- `properties` SELECT: `"Public can read live properties"` (lifecycle-keyed) +
  `"Users can read their own properties"` — the old `pipeline_status` policy is
  gone, not sitting alongside.
- `properties` UPDATE: now has a `WITH CHECK`.
- `deals` UPDATE: **still no policy — deny-all preserved**, as intended.

**Supabase security advisor** was run immediately after. No finding refers to
any object created here; the new functions do not appear in the
anon/authenticated `SECURITY DEFINER`-executable lists, confirming the `REVOKE`
statements took effect.

### Pre-existing advisor findings — NOT caused by this work

Surfaced for the owner, recorded in
[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/MASTER_OWNER_ACTIONS]] §1.13:

- **ERROR** — view `public.public_profiles` is `SECURITY DEFINER`.
- **ERROR** — `public.spatial_ref_sys` has RLS disabled (PostGIS system table;
  usually accepted, but should be a recorded decision rather than an oversight).
- **WARN** — leaked-password protection (HaveIBeenPwned) is **disabled** in
  Supabase Auth. Cheap, high-value win before inviting pilot testers.
- **WARN** — `postgis` and `vector` extensions installed in the `public` schema.
- **INFO ×19** — tables with RLS enabled and no policies. Deny-all, therefore
  safe, but each should be a deliberate "service-role only" decision.

## 7. Correction 2026-08-13 — the ship set was wrong, caught before the PR

The Claude Code verification pass found a blocker this record's "Files changed"
table did not predict. Recording it because the mistake is instructive.

**What was wrong.** `src/lib/cmsCache.js` was listed as a single-purpose edit
("`geocodeCache` bounded to 2,000 entries"). It is not. The file already carried
two *unrelated* uncommitted changes before the §1.0B edit was layered on top:

1. §1.0B — `geocodeCache` → `BoundedCache` ✅ belongs to this work
2. `normalizeSampleBundle` at six call sites ❌ unrelated sample-inventory work
3. `CMS_REDIS_FETCH_CACHE` fetch-cache / ISR change ❌ unrelated

Change (2) imports `@/lib/sampleInventory`, which is **untracked** — one of the
~229 uncommitted files deliberately excluded from the ship set. So committing
`cmsCache.js` alone produces a branch that **cannot build**: module not found.

**Why the local build passed anyway.** `npm run build` ran with the full working
tree present, so `sampleInventory.js` was on disk. The branch does not contain
it. This is exactly the local-passes / preview-fails gap the ship plan warned
about — it just came from an unexpected direction.

**Confirmed by the real build.** Vercel preview deployment `FYekzGR1h` on commit
`2879575` failed after 58s:

```
./src/lib/cmsCache.js:23:1
Module not found: Can't resolve '@/lib/sampleInventory'
```

The prediction and the failure match to the line. Also visible in that log:
Vercel built with **Next.js 16.2.12**, not 16.3.0, because the `package.json`
bump is among the uncommitted ~229 — expected, not a second fault.

**Root cause.** The ship set was assembled by listing *files touched*, on the
assumption that each file's diff was self-contained. In a working tree with 242
uncommitted files, that assumption does not hold: editing a file that already
has unrelated pending changes silently adopts them. **Assemble a ship set from
hunks, not filenames, whenever the tree is dirty** — or verify each candidate
file's full diff against `main`, not just the intended edit.

**Resolution.** `src/lib/cmsCache.js` was dropped from the branch. The geocode
cap is resource-exhaustion hardening, not an exploitable hole, and neither live
hole (`/api/deals/handshake`, `/api/intel/ingest`) touches this file. It lands
separately once the sample-inventory work is committed on its own terms.
`src/lib/boundedCache.js` and its tests still ship — they are self-contained and
the cap is a one-line consumer change afterwards.

### Other verification corrections

- **Test count:** the suite is **1015 tests across 95 files**, not 882. The 882
  figure in §4 was taken from an older record and is stale.
- **Build cache:** the first `npm run build` failed with 19 Turbopack/PostCSS
  errors on every CSS file, including one in `node_modules`. Cause was a stale
  gitignored `.next` directory left from the pre-bump Next version
  (`package.json` carries an uncommitted `^16.2.12` → `^16.3.0` change). Clearing
  `.next` and rebuilding from identical source passed. No source was changed to
  make the build green.
- **`/api/intel/ingest`** also removed the `mockOwnerId` development bypass,
  which §3 did not mention. Correct and consistent with the existing
  `mockMutationRouteContracts` test, but note
  `src/components/intel/IntelStudioPanel.js:30` still sends that field — now a
  no-op. Intel Studio needs a real staff session going forward.
- **Master Action Plan §1.0B** claimed the `deals` UPDATE policy "gained a
  `WITH CHECK`", contradicting §2.8 and the live database. That bullet described
  the *rejected* fix; corrected 2026-08-13.

## 6. Still open after this session

- The five owner re-tests in `MASTER_OWNER_ACTIONS` §1.10 (Mission Control
  publish path, owner intake, public property render, Scout Rating formula
  decision, applied-date record).
- The migration-drift decisions in §1.12 — **do not bulk-apply the unapplied
  migrations**; `20260809000001` would regress the telemetry fix just landed.
- The release gate: full 882-test suite, production build, Playwright matrix.
