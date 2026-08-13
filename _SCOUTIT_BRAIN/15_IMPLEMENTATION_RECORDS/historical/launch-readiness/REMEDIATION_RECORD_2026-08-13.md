---
section: "15_IMPLEMENTATION_RECORDS/historical/launch-readiness"
status: reference
tags: [remediation, security, rls, og-images, ga4, dependabot, codeql]
updated: 2026-08-13
related:
  - "[[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]"
  - "[[SEARCH_ANALYTICS_DNS_AUDIT_2026-08-13]]"
  - "[[MIGRATION_DRIFT_2026-08-12]]"
---

# Remediation record — 2026-08-13 work order

Source branch `security/1-0b-critical-fixes`. **The remediation set is now on
`origin/main` through merge `a312ce7`.** The two critical authorization
migrations were separately owner-approved, applied to production, and verified;
see [[AUTHZ_FIXES_APPLIED_2026-08-13]]. Lower-priority migrations 0003–0005 remain
prepared and unapplied. No CodeQL alert was bulk-dismissed and no unrelated PR
was closed.

Five source commits now merged:

| Commit | Concern |
|---|---|
| `d97a4cf` | fix(og): make social share cards render again |
| `d8984c5` | chore(repo): untrack `scratch/` |
| `4b65e8d` | fix(secrets): credential-shaped literal in a skill doc |
| `279df59` | feat(analytics): GA4 outcome events |
| `ed28cae` | chore(db): five prepared migrations, **not applied** |

---

## Task 1 — OG image renderer ✅ fixed and rendered

**What changed**

- `src/app/opengraph-image.js`, `src/app/twitter-image.js` — added
  `display: 'flex'` to the `fontSize: 72` wordmark div. That div holds a text
  node (`Scout`) plus a `<span>` — two children — and Satori throws on any
  multi-child `<div>` without an explicit `display`.
- `src/app/api/og/route.js:26` — replaced
  `backgroundImage: image ? \`url(${image})\` : 'none'` with
  `...(image ? { backgroundImage: \`url(${image})\` } : {})`. Satori rejects the
  literal string `'none'`.
- Re-scanned all three files for other multi-child divs missing `display`.
  **None found** — every other multi-child div already had it, and the divs
  without `display` all have exactly one child.

**Evidence — actually rendered, not "the build passed"**

Rendered against `next@16.3.0` + `react@19.2.4` (the versions installed in the
repo), in a throwaway harness containing only these three files.

Before:

```
GET /opengraph-image  500  Error: Expected <div> to have explicit "display: flex" ... if it has more than one child node.
GET /twitter-image    500  Error: Expected <div> to have explicit "display: flex" ... if it has more than one child node.
GET /api/og           500  Error: Invalid background image: "none"
GET /api/og?image=... 200  image/png   (only path that worked — the bug needs the no-image branch)
```

After:

```
GET /opengraph-image                                  200  image/png  16437 bytes
GET /twitter-image                                    200  image/png  16215 bytes
GET /api/og                                           200  image/png  23036 bytes
GET /api/og?title=Warehouse%20in%20BGC&category=Industrial&sqm=450
                                                      200  image/png  19874 bytes
```

Both images were opened and inspected: dark `#0d0d0d` field, gold `#E8AE3C`
accent, correct wordmark and spec chips. On brand.

**One cosmetic defect left, not in scope:** the 🛸 in the OG card renders as an
empty circle. Satori has no emoji font and needs an explicit `emoji`/`loadAdditionalAsset`
loader. It does not fail the render. Fixing it means either shipping an emoji
font or replacing the glyph with an SVG mark.

---

## Task 2 — `scratch/` untracked ✅

29 tracked files removed from the index; **all still on disk**. `git ls-files
scratch` now returns 0. This unpublishes 29 dead files and takes
`scratch/jules_session_3/` — 4 of the 18 open CodeQL alerts — out of scan scope.

Reviewed for unique value before untracking:

- 24 of 29 are stale copies of files that still exist under `src/`.
- `scratch/fetch-deals.js` is byte-identical to its live counterpart.
- The three `.jules` notes recorded an aria-label-on-icon-buttons lesson that is
  **already applied** in live code (`NewDealModal.js:63`,
  `DealFileSlideOver.js:78`, `InquiryModal.js:157`).
- `ConciergeChat.js` is an abandoned variant, referenced nowhere in `src/`.

Nothing worth migrating.

---

## Task 3 — secret-scanning fix merged ✅

`.agents/skills/clerk-auth-testing/SKILL.md` now builds the fixture value at
runtime. No `whsec_`-prefixed literal remains in the file. Also restored the
blank line the earlier edit had eaten, so the diff is one line.

Swept the rest of `.agents`, `src`, `supabase`, `scripts`, `e2e_tests` for other
`whsec_` literals: one hit,
`.agents/skills/payment-testing/references/webhooks-and-clocks.md:18`, which is
`whsec_abc123…` inside a CLI transcript — truncated with an ellipsis, not
credential-shaped, and not what alert #1 points at. Left alone.

The defanged fixture and subsequent `.agents/` untracking are on `origin/main`
through `a312ce7`. GitHub alert #1 may remain open until the owner closes the
synthetic fixture alert in the Security dashboard.

---

## Task 4 — who can read (and write) what 🔴 two real holes found

Ran as one investigation. Both findings were **proven against the live database
inside rolled-back transactions**; rollback itself was verified first (created a
table inside `begin … rollback`, confirmed `to_regclass` returned null).

### 4A — `public_profiles` is writable by anonymous visitors 🔴

The `SECURITY DEFINER` property is **intentional and load-bearing**. The only
`SELECT` policy on `user_profiles` is `id = auth.uid()`, so an invoker-rights
view would return zero rows to anonymous visitors and blank every public profile
page. `src/lib/profileClient.js` reads this view with the browser anon client.
**Do not flip it to `security_invoker = true`.**

The columns it exposes are the right ones — 19 presentation fields, filtered to
`is_profile_public = true AND NOT is_shadowbanned AND archived_at IS NULL`:

```
id, display_name, avatar_url, location, headline, bio, firm, service,
member_since, subscription_tier, active_roles, provider_type,
provider_availability, is_profile_public, is_example_account,
prc_license, prc_verified, prc_expiry, dhsud_number
```

Correctly withheld from the view: `connects_balance`, `moderation_note`,
`date_of_birth`, `adult_eligibility_status`, `telemetry_opt_out`,
`marketing_opt_out`, `is_shadowbanned`, `archived_at`, `role`, `prc_verified_at`.

**The bug is the write path, not the read path.** It is a simple single-table
projection, so Postgres makes it auto-updatable
(`information_schema.views.is_updatable = YES`), and `anon` holds
`INSERT/UPDATE/DELETE` on it. A write through the view runs as the view's owner
and **bypasses `user_profiles` RLS entirely**.

```sql
begin; set local role anon;
update public_profiles set display_name = display_name
  where id in (select id from public_profiles limit 1);
-- anon_rows_writable_via_view = 1
rollback;
```

Anyone holding the publishable anon key can rewrite — or, since `user_profiles`
has **no DELETE policy at all** and the view bypasses that too, delete — any
public profile. 15 profiles currently.

Fix prepared in `supabase/migrations/20260813000001_close_public_profiles_write_path.sql`:

```sql
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

Swept every other view in `public` for the same shape. Only PostGIS's
`geometry_columns` also comes back auto-updatable with anon write grants; that is
extension-owned metadata, not app data, and is noted rather than changed.

### 4B — effective access rule per table/role/action

Supabase counts 41 `multiple_permissive_policies` warnings because it checks six
roles. Reduced to the roles that matter, `anon` and `authenticated`, there are
**20 distinct (table, role, action) combinations across 9 tables**. Permissive
policies combine with `OR`, so each row below is the real rule:

| Table | Action | Effective rule for anon / authenticated | Verdict |
|---|---|---|---|
| `audit_logs` | SELECT | `false OR false` → **deny** | correct, redundant pair |
| `badge_definitions` | SELECT | `true OR false` → **public read** | correct (catalog); writes still denied |
| `connect_balances` | SELECT | `user_id = auth.uid() OR false` → **own rows** | correct |
| `connect_transactions` | SELECT | `user_id = auth.uid() OR false` → **own rows** | correct |
| `projects` | SELECT | `status IN (active, showcase) OR provider_id = auth.uid()` | correct — the OR is doing real work |
| `properties` | SELECT | `lifecycle_state = 'live' OR owner_id = auth.uid()` | correct — public sees live, owners see drafts |
| `user_availability` | SELECT | `true OR (auth.uid() = user_id)` → **public read** | probably intended; confirm |
| `intel_briefings` | SELECT / INSERT / UPDATE | `true OR true` → **wide open** | 🔴 see below |
| `intel_sources` | SELECT / INSERT / UPDATE | `true OR true` → **wide open** | 🔴 see below |

**The real authorization bug was hiding exactly where the work order predicted.**
The policies named `Service role full access on intel_briefings` and
`… on intel_sources` are not scoped to `service_role` at all — both are
`FOR ALL TO public USING (true)`, and the Postgres `public` role **includes
`anon`**. That single policy ORs over everything else on those tables:

```sql
begin; set local role anon;
insert into intel_briefings (slug, title, city) values (...);
-- anon_insert_rows_accepted = 1
rollback;
```

Both tables are **empty (0 rows)**, so nothing has leaked. The live risk is an
anonymous injection path into whatever renders on `/intel` — anyone with the
publishable key can create or rewrite briefings.

`service_role` has `BYPASSRLS`, so these policies were never load-bearing. Fix
prepared in `…0002_scope_intel_service_role_policies.sql`, which recreates them
scoped to `service_role`.

**Second-order owner decision, deliberately left out of the migration:** once
scoped, `authenticated` still holds `SELECT/INSERT/UPDATE USING (true)` on both
tables — any signed-in user can rewrite any briefing. Nothing in the app needs
it: every write goes through `src/app/api/admin/osint/route.js` and
`src/app/api/cron/osint-scraper/route.js`, both on the service-role client. The
DROP statements are written out, commented, at the foot of that migration.

### 4C — the 19 sealed tables are sealed on purpose ✅

The work order says 20; the advisor returns **19**, matching the list in the
work order body. Deny-all, as it says — the question is whether any shipped
feature is quietly broken.

Traced every `.from('<table>')` call in `src/` and `mission-control/src/`: **84
references, all of them in server-side code** — `src/app/api/**` route handlers,
`src/lib/**` server helpers, or the separate `mission-control` admin app's server
actions and pages. **Zero references from client components.** Every one of the
19 is reached only through `supabaseAdmin` (service role) or an explicitly
service-keyed client. Nothing is broken; the seal is correct and is now recorded.

`property_units` — the sharpest case — is served entirely through the service
role: 15 references, all in `src/app/api/dashboard/**` and `src/lib/unitsSync.js`
(which takes a `serviceClient` parameter). The Unit Master Page works because
nothing client-side ever touches the table. 26 rows present.

**One landmine found while confirming it.**
`src/app/api/dashboard/units/route.js:48`:

```js
createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey, …)
```

If `SUPABASE_SERVICE_ROLE_KEY` is ever unset in an environment, that "service"
client silently degrades to an anon client — and because `property_units` is
RLS-with-no-policies, every unit read comes back empty instead of erroring. The
Unit Master Page would go blank with no error anywhere. Same failure mode as the
GA hardcoded-fallback lesson in §25.5: a fallback that makes a misconfiguration
invisible. Recommend making the key required and throwing.

---

## Task 5 — GA4 outcome events ✅

New `src/lib/analytics.js` exporting `trackEvent()` and `GA_EVENTS`. Guard is
deliberately identical to `GoogleAnalytics.js` (§25.5): no `NEXT_PUBLIC_GA_ID`
→ no `gtag` → silent no-op, and nothing invents a measurement id. `trackEvent`
also swallows any `gtag` error (instrumentation must never take a user flow
down) and returns a boolean so "sent" is distinguishable from "no-op".

Seven call sites, five events:

| Event | Call site | Fires when |
|---|---|---|
| `board_save` | `DashboardContext.js:371` | save branch of `toggleSave` |
| `inquiry_sent` | `InquiryModal.js:122` | after `/api/deals/initiate` returns a receipt |
| `inquiry_sent` | `BrokersClient.js:80` | after `/api/inquiries` routes successfully |
| `connect_spent` | `DashboardContext.js:843` | pitch, after server confirms |
| `connect_spent` | `DashboardContext.js:906` | handshake, after server confirms |
| `signup_completed` | `onboarding/page.js:276` | after `/api/auth/complete-onboarding` succeeds |
| `property_published` | `DashboardContext.js:587` | after `/api/dashboard/publish` succeeds |

Every one fires **after** the server confirms, never on click, so the counts
mean outcomes rather than intent.

**Evidence:** 6/6 unit tests pass in `src/lib/__tests__/analytics.test.js`
(covers: the five names; no-op with the id unset even when `gtag` exists; no-op
server-side; correct `gtag('event', …)` payload when both are present; never
throws when `gtag` throws; ignores a missing name). ESLint clean on all five
touched files.

**Only two files are in the commit.** `DashboardContext.js`,
`onboarding/page.js` and `BrokersClient.js` already carry substantial
uncommitted work from earlier sessions (880, 111 and 36 changed lines
respectively). Committing them would sweep unrelated work in under an analytics
message, which breaks the one-concern-per-commit rule. Their wiring is written
and lints clean **in the working tree, uncommitted**, and needs to go in with
whatever commit closes out that earlier work.

**Owner action:** marking these as *key events* is a GA4 dashboard action
(Admin → Events → Mark as key event). Code can only emit them.

---

## Task 6 — dependency bumps: **already done** ⚠️ finding contradicts the work order

Checked `package-lock.json` — which is what Dependabot actually reads — not just
`node_modules`:

| Package | Fix version asked for | In lockfile | Status |
|---|---|---|---|
| `fast-uri` | 3.1.5 | **3.1.5** | ✅ |
| `nanoid` | 3.3.17 | **3.3.18** | ✅ ahead |
| `sharp` | 0.35.0 | **0.35.3** | ✅ ahead |
| `dompurify` | 3.4.13 | **3.4.13** | ✅ |
| `brace-expansion` | 1.1.16 / 5.0.7 | **1.1.18** and **5.0.9** | ✅ both lines |
| `js-yaml` | 4.3.1 | **4.3.1** | ✅ |
| `undici` | 7.29.0 | **7.29.0** | ✅ |

**All 13 Dependabot alerts are already remediated in the lockfile.** They are
still open because the fix has not been pushed — `package.json` and
`package-lock.json` are both modified-uncommitted in the working tree. Nothing to
bump. The alerts should close on the next push + rescan.

**The `dompurify` trap warning is obsolete.** `isomorphic-dompurify` is not in
`package.json`, not in the lockfile, and not in `node_modules`.
`src/lib/sanitize.js` has been rewritten as a dependency-free tag stripper
precisely because `isomorphic-dompurify` pulled in `jsdom` and crashed API routes
with `ERR_REQUIRE_ESM`. There is no direct import to reintroduce and the
`dompurify` bump has no surface in this app at all.

---

## Task 7 — prepared, not applied

- **`auth_rls_initplan`** — 17 policies across 9 tables (`calendar_connections`,
  `calendar_events`, `private_notifications`, `property_claim_documents`,
  `property_claims`, `property_control_assignments`, `property_slug_history`,
  `user_availability`, `viewing_appointments`) re-evaluate `auth.uid()` per row.
  Migration `…0003` wraps each as `(select auth.uid())`, generated from live
  `pg_policies` so every expression is verbatim. Supabase says 18 because it
  counts role expansions.
- **`st_estimatedextent`** — migration `…0004`, three `REVOKE EXECUTE`
  statements closing all six warnings. Nothing in `src/` or
  `mission-control/src/` calls it.
- **`spatial_ref_sys`** — migration `…0005`. Highest breakage risk of the five
  because the table is extension-owned; apply it alone and re-test a radius
  search immediately.
- **`actions/missing-workflow-permissions` ×2** — inspected all four workflows.
  `ci.yml` has top-level `permissions` at line 13, `update-spatial-data.yml` at
  line 9, `dependency-review.yml` at line 6, and `refresh-spatial-data.yml`
  carries a job-level block (which also satisfies the rule). **No workflow is
  currently missing permissions.** The two alerts read as stale — but as the
  work order insisted, that is not confirmed: a fresh CodeQL scan needs a push,
  which is an owner action.

**Not done, as instructed:** `postgis`/`vector` schema move; the
`unindexed_foreign_keys` (27) and `unused_index` (26) lists.

---

## Follow-up outcome

The terminal follow-up ran lint and **1057/1057 unit tests across 98 files**.
The remediation commits reached `origin/main` through `a312ce7`. Migrations 0001
and 0002 were owner-approved, applied one at a time, and verified in both allowed
and denied directions; `/intel` was confirmed editorial and authenticated write
policies were removed. The durable evidence is in
[[AUTHZ_FIXES_APPLIED_2026-08-13]].

## Owner actions still open

1. Finish Google Search Console verification before the GoDaddy→Cloudflare
   cutover, then submit `https://www.scoutit.space/sitemap.xml`.
2. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel as a second verification
   method so the property survives the DNS cutover.
3. Mark the emitted GA4 outcome events, including `share_completed`, as key
   events in GA4 where commercially appropriate.
4. Close GitHub secret-scanning alert #1 as a synthetic Clerk fixture; the code
   correction is already on `origin/main`.
5. Revisit leaked-password protection only if Supabase Pro is activated for an
   independent reason. Do not buy Pro solely for that toggle.
6. Perform the GoDaddy→Cloudflare DNS cutover only after Search Console is
   secured, carrying the `google-site-verification` TXT record across.

## Follow-ups worth a ticket

- `src/app/api/dashboard/units/route.js:48` — remove the
  `SERVICE_ROLE_KEY || anonKey` fallback; make the key required and throw.
- OG cards: 🛸 renders as an empty circle. Ship an emoji font to Satori or
  replace the glyph with an SVG mark.
- `git` operations against the mounted repo leave `.git/*.lock` and
  `tmp_obj_*` files that the bridge cannot delete. They were moved to
  `_to_delete/gitjunk/` — **that folder is safe to delete and should be.**
