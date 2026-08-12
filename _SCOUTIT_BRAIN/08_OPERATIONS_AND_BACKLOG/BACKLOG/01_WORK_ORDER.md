---
section: "08_OPERATIONS_AND_BACKLOG"
status: active
tags: [backlog, work-order, plan]
updated: 2026-08-06
related: ["[[00_START_HERE]]", "[[02_FRONTEND_STANDARD]]", "[[03_OWNER_DECISIONS]]", "[[04_INVENTORY]]"]
---

# ✅ THE WORK ORDER

**One ordered list. Do them in this order.** The order is not by size or by
interest — it is by **what a real visitor hits first**, per the standing
instruction *"one bad error would push away users."*

**Legend** — 🎨 = must pass [[02_FRONTEND_STANDARD]] · 👤 = only the owner can do
it · 🌐 = needs a browser or real device · ⏱ = rough size

| | Status |
|---|---|
| ⬜ | Not started |
| 🔄 | In progress |
| ✅ | Done — *and a human has touched the screen* |
| 🚫 | Blocked (say on what) |

---

## PHASE 1 — STOP THE BLEEDING
*Things currently harming a real visitor or blocking growth. Nothing else starts until these do.*

### W1 ✅ Remove the hub URLs from the sitemap — *done 2026-08-06*
`src/app/sitemap.js` submits `/hubs/bgc-taguig`, `/hubs/makati-cbd`,
`/hubs/quezon-city-hub` to Google. **No `/hubs` route exists — all three 404.**

Live since 2026-08-05. Google records soft-404s, which suppresses crawl budget
for the pages that *do* work — actively fighting §13's indexing effort.

- **Done:** the block is now behind `const HUB_PAGE_EXISTS = false` with the
  slugs and the reasoning preserved in comments. Flip it to `true` **in the same
  commit** that ships the page (W7) — never before.
- **Ref:** §51.2

> ⚠️ **Follow-up applied 2026-08-06:** W1 left `src/lib/__tests__/sitemap.test.js`
> asserting the three hub URLs were *present*, so the suite went red the moment
> W1 shipped. The handoff's "617 assertions passing" was written before that
> ran. Now split in two: static/property routes, and a test that asserts
> `/hubs/*` is **absent** while `HUB_PAGE_EXISTS === false`. **Invert it in the
> same commit as W7.**

---

### W2 🔄🎨🌐 Publish UI must collect the lister declaration ⏱ ~1h · C23
**Built 2026-08-06. Not closable until someone publishes from a real phone** —
Standing Rule 13 and §6 of [[02_FRONTEND_STANDARD]] both say so.

- **Built:** `src/components/dashboard/ListerDeclarationModal.js` (sheet at
  390px, centred card from 700px) + the gate in `publishListing()` in
  `src/context/DashboardContext.js`.
- **Where the gate lives:** inside `publishListing`, not in `OwnerMode`. That is
  the single door to `/api/dashboard/publish`, so every current and future
  caller inherits it. Callers keep `await publishListing(id)` unchanged — it
  awaits the user's answer and retries itself with the declaration attached.
- **Watch:** `agreed === true` only, client and server. Nothing pre-selected —
  a default would manufacture a legal claim from inattention (§47.2).
- **Remaining:** the 🌐 rows below. Logged as **C25**.

```
[x] Design read declared in one line before coding
[x] Built at 390px first, then widened (breakpoint at 700px)
[ ] Checked at 360 / 390 / 768 / 1280            → C25, needs a browser
[x] dvh not vh (`max-height: 92dvh`) · no fixed widths
[x] All tap targets ≥ 44px · primary action bottom-of-sheet, thumb-reachable
[x] Gold used once — "Declare & publish". Cancel is ghost
[x] Loading (button busy) / error (server text, unbusies) / success (modal
    closes, listing flips live) all implemented. Empty: n/a, static content
[x] No unsourced numbers rendered
[x] Motion: named properties, ease-out, :active scale, reduced-motion honoured
[x] Keyboard: Esc closes (blocked while busy), focus lands on the card not the
    first radio, focus-visible outlines on options and buttons
[ ] Contrast ≥ 4.5:1 verified with a tool           → C25
[x] Images: none
[ ] Opened in a real browser on a real phone        → C25
[x] Nothing on the anti-slop list — the per-option emoji in
    LISTER_RELATIONSHIPS is deliberately NOT rendered
```

- **Done when:** a new listing publishes end-to-end from a phone, and the stored
  `owner_claim_agreed` has a timestamp and `disclaimer_version`.
- **Ref:** §50.4 · §53 · C23 · C25

---

### W3 ⬜🌐 Browser-verify everything from §40–§50 ⏱ ~2h
**~60 changed files, none opened in a browser.** Logic is tested; rendering is
not. This is the single biggest source of a visible error.

| Check | Ref |
|---|---|
| Inbox: WAITING gate, Decline, Withdraw, archive lifecycle | C4 · C9 · C10 |
| Public profiles still render after the RLS lockdown | C15 |
| Mobile `100dvh` on real iOS **and** Android | C11 |
| New signup hits the age gate; an existing account still works | C20 |
| Privacy settings page (it 500'd until 2026-08-06) | C21 |
| Entitlement gate with a real subscriber — ⚠️ **turn `pre_launch_free_mode` OFF first** or everything looks unlocked | C18 |

- **Done when:** every row above is ticked with the device it was checked on.
- **2026-08-06:** consolidated into a single runnable pass as **C26** — the six
  C-refs above were scattered and none of them said what "verified" looked like.
  W2's and W7's screens are folded into the same pass, since it is one browser
  session either way. **This is 100% device work; nothing here can be done
  without hardware.**

---

## PHASE 2 — OWNER UNBLOCKS
*Five minutes each, and each one un-inerts something already built. Full detail in [[03_OWNER_DECISIONS]].*

### W4 ⬜👤 Set `RESEND_API_KEY` + verify the sending domain ⏱ 15 min
The whole email layer is built and tested and **sends nothing** without it.
`§42.2 · C13`

### W5 ⬜👤 Click the Connect refund panel once ⏱ 5 min
Built, applied to production, never used. Find out it works *before* you need it
during an incident. `§42.1 · C12`

### W6 ⬜👤 Confirm `NEXT_PUBLIC_GA_ID` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel ⏱ 5 min
Their silent fallbacks were removed in §44.3, so a missing value now fails
**visibly**. `C16`

---

## PHASE 3 — MAKE THE ORPHANED BACKENDS REACHABLE
*Six features are marked complete with zero callers. Each needs a screen, not a rewrite. This is the actual remaining product.*

### W7 🔄🎨 Build `/hubs/[slug]` ⏱ ~2h
**Built 2026-08-06.** The three URLs now have a page, and the sitemap entries
went back in the **same commit** — they are true rather than merely absent.

- ⚠️ **`/api/hubs` did NOT "already return the data".** It returns hub metadata
  only — name, tagline, coordinates. It has never returned a single listing.
  The missing piece was *which properties belong to a hub*, now
  `src/lib/hubProperties.js`. §51.4 said otherwise and §51.4 was wrong.
- **Built:** `src/app/hubs/[slug]/page.js` + `hub.css` (server-rendered, zero
  client JS for the content), `src/lib/hubProperties.js`, and
  `src/lib/locationHubs.js` — the hub list moved out of the route handler so the
  page, the API and the sitemap all read **one array** and cannot drift.
- **Sitemap:** `HUB_PAGE_EXISTS` is gone. Slugs are mapped from
  `LOCATION_HUB_SLUGS`, so adding a hub adds a page and a sitemap entry together.
- **Public surface**, so every property goes through
  `stripPremiumFields(p, 'starry')` before it reaches the markup (§45).
- **Tests:** 24 new, covering the hub-selection rules.

```
[x] Design read declared in one line before coding
[x] Built at 390px first, then widened (768 → 2 cols, 1100 → 3)
[ ] Checked at 360 / 390 / 768 / 1280            → C26, needs a browser
[x] dvh not vh (`min-height: 60dvh`)
[x] All tap targets ≥ 44px (cards, CTA 46px, hub links 44px)
[x] Gold used once — the single CTA in the empty/error state
[x] Loading (static page, no client fetch) / empty / error / success all built
[x] No unsourced numbers — a distance only renders from a MEASURED coordinate
[x] Motion: named properties, ease-out, :active, reduced-motion honoured
[x] Keyboard: focus-visible on every card, CTA and hub link
[ ] Contrast ≥ 4.5:1 verified with a tool          → C26
[x] Images: none rendered — deliberate, PH mobile data is metered
[ ] Opened in a real browser on a real phone       → C26
[x] Nothing on the anti-slop list
```

- **Done when:** the three hub URLs return 200 on the live deploy, and Search
  Console stops reporting soft-404s on them.
- **Ref:** SEO-03 · §51.4 · §54 · C26

### W8 🔄🎨 Property claim UI ⏱ ~3h · §37
**Built 2026-08-06.** `src/components/property/ClaimPropertyPanel.js`, mounted
in `src/app/property/[id]/page.js` — at the PAGE SHELL, not inside a flow.
There are two flow components and four category aliases mapping into them;
putting it in one flow would make claiming work on residential listings and
silently not exist on commercial ones.

- 🔴 **The backend was wrong, not just uncalled** — see §55.3. `/api/property/claim`
  used a **second vocabulary** (`direct_owner` / `authorized_manager`) for the
  same three concepts `properties.lister_relationship` spells
  (`owner` / `property_manager`). Only one of three matched. A claim asserting
  ownership would have been stored under a different word than the listing's own
  declaration, and the comparison a RESA dispute turns on would have found nothing.
- ⚠️ **REQUIRES MIGRATION `20260806000006`** — apply it BEFORE deploying, or the
  claim insert violates the old CHECK constraint and 500s. **C27.**
- **Also added:** a `GET` (so the UI knows whether a claim is already open —
  without it, someone whose claim is under review would be shown "Claim this
  property" again), existence + claimability checks before insert, and a
  self-claim guard.
- **Claimability is decided SERVER-SIDE.** The panel never computes it from the
  property payload: the page is ISR, so one cached document serves the owner, a
  broker and a stranger alike.
- **NULL is claimable.** All 13 listings are NULL today (queried, not assumed).
- **Remaining:** browser + device verification → **C26**.

### W9 ⬜🎨 Monthly Scout Wrap UI ⏱ ~4h — **endpoint now audited and FIXED**
`/api/wrap` and the wrap RPC exist. No UI anywhere. ⚠️ §31 calls this a
**pre-launch requirement** — confirm that still holds before spending the day
(**D2**).

✅ **Rule 15 pre-flight done 2026-08-06 (§58.9). The endpoint was broken; it is
now fixed and verified against the live database.** Build the UI on it freely —
but read §58.9 first, because two of the three findings change what the UI must
do.

| Found | Fix |
|---|---|
| 🔴 The RPC **threw on every property request** — `viewing_appointments.property_id` is `text`, but the function cast `p_entity_id::UUID`. `analytics_events` and `deals` **are** uuid, so 3 of 4 casts were correct and the 4th aborted the whole function (`42883 text = uuid`) | migration `20260806000008`; all three entity types now return well-formed reports |
| 🔴 **No authorisation at all.** It authenticated but never checked `entityId` against the caller — any signed-in user could read any broker's lead volume, any owner's portfolio traffic, or a competitor's listing numbers by editing a query string. Rule 9. | positive-check helper: staff/admin any; otherwise the caller must **be** the subject; a failed property lookup **denies** |
| 🟡 `getCurrentPeriodMonth()` returned the **current** month on the 31st (`setMonth` day-overflow), so a partial month would render as the completed wrap | anchored to day 1 before stepping back; fixed-instant tests (Rule 11) |

- **Plumbing that genuinely checked out:** all six `monthly_scout_wraps` columns
  match, the `ON CONFLICT` triple matches a real UNIQUE constraint, and EXECUTE
  is granted only to `postgres`/`service_role` (Rule 8 already satisfied).
- ⚠️ **Broker representation is NOT authorised** for a listing's wrap — a
  deliberate deny, because "may a broker see traffic on a property they pitched?"
  is a product decision nobody has made. If the UI needs it, decide it first.
- **The wrap returns all zeros today**, and that is correct: there is almost no
  `analytics_events` data yet. Do not let the UI render a zero as a dash or a
  placeholder — an honest zero is the honest blank here (Rule 3).

### W10 ✅🎨 Surface walkability — *done 2026-08-06*
`calculateWalkabilityScore()` existed in `src/lib/overpassIntel.js` with zero
callers. It is computed from POI layers `/api/whereto` already fetches, so
surfacing it cost one function call and no extra upstream request.

- **Server:** `/api/whereto` now returns `walkability`.
- **Client:** rendered in `WhereToSection` — score, label, and the count it was
  derived from.
- ⚠️ **`null` when the lookup failed.** The function falls back to a neutral 50
  with no layers, and a hardcoded 50 rendering as "MODERATE PEDESTRIAN ACCESS"
  would be a claim about a neighbourhood produced by an Overpass outage. Follows
  the same three-state honest-blank rule as the POI list (§3).
- **Low confidence is stated, not styled away.**

### W11 🔄🎨 SEO readiness in the dashboard ⏱ ~2h
**Built 2026-08-06.** `src/components/dashboard/SeoReadinessPanel.js`, mounted in
`OwnerMode` beside Listing Strength — Strength answers *"is this complete?"*,
this answers *"can Google reach it?"*. A 100%-complete DRAFT passes the first and
fails the second.

- 🔴 **The endpoint was broken.** It read SIX columns that do not exist
  (`address`, `photos`, `category`, `property_type`, `metadata`, `status`) and
  reported **every listing as un-indexable** with a confident score. Shipping the
  panel on it would have told all 13 owners their listings were broken (§55.1).
- 🔴 **It had no authentication.** It enumerates a listing's weaknesses to anyone
  who asks by slug. Now owner-or-staff.
- **Logic extracted** to `src/lib/seoReadiness.js` so it is testable without a DB.
- **A test then caught a second bug:** a 1-photo listing scored 100 and came back
  index eligible while `minPhotosPassed` was false — the panel would have printed
  "Google can index this" above "Add 2 more photos" (§56.1). Eligibility now
  requires the hard checks as well as the score.
- **Remaining:** browser verification → **C26**.

### W12 🔄🎨 Staff surface for property verification ⏱ ~1h
**Built 2026-08-06.** `src/components/admin/PropertyVerifyPanel.js`, new
"Re-verification" tab in `/admin`.

- 🔴 **`/api/property/verify` was broken two ways** (§55.2): it selected a
  `status` column that does not exist, and looked properties up with
  `.or('id.eq.<slug>')` against a **uuid** column — so every slug-based call
  errored and answered "Property not found".
- **Verifying is an assertion, not a button.** Two-step confirm, and
  deliberately **no "verify all"** — a bulk button produces a directory of
  confidently-wrong data carrying ScoutIt's name instead of an owner's (§21.2).
- **NULL `last_verified_date` = never verified**, sorts first, never reads as
  "verified today".
- 🔴 **A THIRD bug, found 2026-08-06 (§58.3): the route 500'd on every single
  call.** It updated `properties.updated_at`, and **`properties` has no
  `updated_at` column** — PostgREST rejects the whole UPDATE, so W12's panel has
  never once worked. §55 fixed this endpoint's *lookup* and never ran its
  *write*. **Fixed**, plus a test that asserts every written key is a real
  column and one that fails if `updated_at` returns.
- 🟡 Its audit write also targeted `supabase_audit_logs`, which does not exist.
  Now goes through `src/lib/auditTrail.js` → `audit_logs` (§58.5).
- **Remaining:** browser verification with a staff account → **C26**. Now worth
  doing, because until today the panel could not have succeeded.

### W13 🔄🎨 Anonymity shield: settings toggle + upgrade path ⏱ ~1h · C19
**Built 2026-08-06.** `src/components/profile/PrivacyShieldPanel.js`, mounted in
`/settings` **above** Security & Login — burying privacy under password fields
makes it read as an advanced setting rather than a promise.

- **Standing Rule 10 honoured literally:** no upgrade prompt, no lock icon, no
  "available on Cluster", and the panel never calls `canSee()`. Tier decides the
  DEFAULT only, and even that is stated as a fact about the account.
- **Brokers see nothing here** — every broker tier benefit is discoverability.
  It is a ROLE check (`canUseAnonymityShield`), never a tier check.
- **`/api/user/privacy-settings` extended** to read and write
  `privacy_settings.anonymous_browsing` / `.anonymous_byline`. It had no path to
  them at all, so the shield was wired at row creation and unreachable.
- ⚠️ **UPSERT, not UPDATE.** Profiles created before the shield have no
  `privacy_settings` row; an UPDATE against a missing row succeeds and changes
  nothing — the user would watch the toggle flip and the setting never save.
- **Remaining:** browser verification → **C26**.
- ✅ **D4 closed 2026-08-06 (C30).** There is no upgrade path because there is no
  gate — verified in code, not assumed: `canUseAnonymityShield(role)` is a ROLE
  check that is always true for `seeker`/`owner`, `anonymityShieldDefaultsOn()`
  decides only the DEFAULT, and `/api/user/privacy-settings` carries an explicit
  "must never learn to check a tier" note. Nothing to design. **D4 needs no
  owner decision.**

---

## PHASE 4 — BEFORE PAYMENTS SWITCH ON
*Not urgent today. Non-negotiable before money moves.*

### W14 ⬜👤 Six advertised pricing benefits have no implementation
Build them, deliver them by hand, or take them off the page. Charging for an
undelivered benefit is the one mistake with no cheap fix. `§46.5`

### W15 ⬜👤 Separate dev Supabase project
The "40 real users" urgency was false (§49), but the risk returns with the first
real signup. `§11`

### W16 ✅ Record the §50 columns as INTERNAL ONLY — *done 2026-08-06*
Documented in [[FIELD_VISIBILITY_MAP]] §7 and [[DATA_DICTIONARY]], and — more
importantly — **enforced in code**, because a document does not stop a query.

- ⚠️ **The column is `owner_claim_agreed`, not `agreement_record`.** This item,
  the handoff and §50.4 all named a column that does not exist. Corrected
  everywhere (§53.4).
- **Enforcement point:** `PROPERTY_PUBLIC_COLUMNS` in `src/lib/propertyLookup.js`
  lists columns explicitly and excludes every internal one. A `select('*')`
  would drag them all back in — which is exactly what the old
  `/api/seo/readiness` did. A test asserts the exclusion so it cannot regress.
- **Scope grew beyond §50's two columns.** Also now recorded as INTERNAL ONLY:
  the whole `property_claims` and `property_claim_events` tables,
  `property_control_assignments.controller_user_id` (🔴 was **world-readable**
  until today — §55.4), `user_profiles.date_of_birth`,
  `adult_eligibility_status`, and the two `privacy_settings` shield columns.
- **Ref:** §50.4 · §55 · C24

---

### W17 ✅ Schema audit of every DB read AND write — *done 2026-08-06* · C28
Every `.from(...).select(...)` **and** every `.insert()/.update()/.upsert()`
payload in `src/app/api/**` and `src/lib/**`, diffed against
`information_schema.columns`. Full reasoning in **§58**.

**The selects were nearly a false alarm** — 18 of 19 flagged columns were the
audit script mis-attributing a `.select()` to the wrong `.from()`. **The writes
were where every real bug was**, because a rejected write is invisible by design:
audit and telemetry writes are wrapped in `try {} catch {}` on purpose, so they
must not fail a user's request — and therefore never report that they did.

| | Bug | Fixed |
|---|---|---|
| 🔴 | `/api/property/verify` 500'd on **every** call — `properties.updated_at` is not a column. **W12 shipped against it.** | ✅ |
| 🔴 | `/api/user/delete-account` (RA 10173 right-to-erasure) erased nothing, anonymised nothing, audited nothing, and returned `success: true`. 2 phantom tables + 4 phantom columns. | ✅ rewritten |
| 🔴 | **No application code had ever written an `audit_logs` row.** All 3 sites omitted `table_name`/`record_id`, both NOT NULL. 692 rows in the table, all from the DB trigger. | ✅ one `lib/auditTrail.js` |
| 🔴 | `/api/wrap` had **no authorisation** + a fatal uuid/text cast + a wrong default month → see W9 | ✅ |
| 🟠 | Removing/withdrawing a listing **always returned 500** after committing the change — `operation_key` did not exist. Retry failed forever. | ✅ migration `…0007` |
| 🟠 | `/api/deals/[id]/schedule` "reset chat inactivity timer" never ran — and its sibling route already documented this exact bug and fixed it | ✅ |
| 🟡 | `/api/dashboard/inventory` 500'd the whole owner panel for one **never-read** column, `price_monthly` | ✅ |

- **Migrations applied and verified:** `20260806000006` (C27, claim vocabulary +
  closed the world-readable `property_control_assignments`), `20260806000007`
  (`operation_key`, FULL unique per BF1 — idempotency proven by running two
  identical upserts → 1 row), `20260806000008` (wrap RPC cast).
- **Tests: 723 → 756, all green, lint clean, `npm run build` compiles.** Four
  test files were rebuilt from the real schema; the new guards were **confirmed
  to fail** by re-introducing the bug, then restoring the fix.
- **New standing rules earned:** 18 (audit writes, not just reads), 19 (a DB mock
  must reject what the DB rejects), 20 (`information_schema` is a test fixture).

**Residuals — small, deliberately not done:**

| Item | Why it is left |
|---|---|
| `property_id` is `uuid` in `analytics_events`/`deals` but `text` in `viewing_appointments`/`property_claims` | The `coerce_user_ref_columns_to_text` legacy. Retyping a column live code filters on is far larger than any bug required. Every cross-table property query is a chance to hit it, and it fails at runtime, never at build. |
| Quest IT (`/api/v1/questit/*`) reads 3 tables that do not exist | Parked feature, and `proxy.js:172` blocks it while `ai_search` is off. ⚠️ But that guard reads `=== false`, so a **missing** flag row fails open (Rule 6 shape) → 500s not 404s. **Do not enable `ai_search` until the tables exist.** |
| `/hubs/[slug]` logs `[CMS] Redis fetch failed: Dynamic server usage` during build | Cosmetic; build succeeds and the page renders live data. It is noise in every build log. |
| 38 `select("*")` calls | Not defects — `*` cannot name a missing column. Noted because that is precisely why it *hides* this bug class. |

---


---

### W18 ✅ Reconnect the three instruments that collect nothing — *done 2026-08-06* · §60
**Shipped in commit `f59d54e`, pushed.** 809 tests (was 770), build green, lint clean.

| | Outcome |
|---|---|
| Waitlist | ✅ **Saves signups now.** ⚠️ The commented-out code would NOT have worked if simply uncommented — it used the browser client against a `USING (false)` policy. Writes via the service client. Proven in a rolled-back transaction: service insert OK, duplicate raises `23505`, **anon insert denied**. Also fixed a Zod bug that rejected any email with a trailing space (routine on mobile). |
| Analytics | ✅ **Property views are recorded for the first time.** Verified end to end against production: a real page view wrote one row with the correctly slug-resolved uuid, then the wrap RPC reported `unique_monthly_eyes: 1`. Test row deleted afterwards. **W9's dependency is now closed.** |
| Crash queue | ✅ **28 triaged** — 20 resolved with verified notes, 8 left `investigating` because they need a real click (C26). One had a **live root cause**, now fixed: React #31 on a public property page. |

🔴 **Found and fixed along the way: `telemetry_opt_out` was never enforced.** It
is written by `/api/user/privacy-settings` and rendered as a real toggle in
`PrivacyShieldPanel`, and **nothing read it**. Wiring analytics without honouring
it would have started collecting from people who had switched it off — worse
than never collecting. Now enforced server-side, and an unreadable preference
records nothing.

→ **Standing Rule 23** (a render fallback must never return a non-primitive).

<details><summary>Original item, kept for the reasoning</summary>

### W18 (original) 🔴 Reconnect the three instruments that collect nothing ⏱ ~3h · §59
**The single highest-value item in the backlog, and it is not a feature.** Three
systems are fully built, wired to a UI, and disconnected at the far end. Each was
marked complete. Full reasoning: **§59 Layer 9 · Standing Rule 21.**

**1. The waitlist discards every signup.** `/api/waitlist` validates the email,
runs the Turnstile check, then `console.log`s it and returns `{ok: true}`. The
insert is commented out. `waitlist` has **0 rows**. This is the entire pre-launch
Founding Member funnel.
- The stated reason — *"Supabase is mid-security-reset"* — **has expired.** The
  table exists and RLS is on.
- ⚠️ **Uncommenting it as written will NOT work.** The commented code uses the
  browser `supabase` client, and `waitlist` carries a deny-all client policy
  ("Clients cannot access waitlist directly"). It must use `supabaseAdmin`.
- Keep the `23505` unique-violation → success branch: a repeat signup is not an
  error.

**2. Nothing has ever recorded a property view.** `analytics_events` has **0
rows**, and the write path is not broken — it is **absent**. `/api/analytics` is
a complete, correct endpoint with a privacy-safe salted monthly `viewerKey`, and
it has **zero callers**. Nothing POSTs to it, ever.
- 🔴 **This is a hard dependency of W9.** The Monthly Scout Wrap reads
  `analytics_events`. Ship W9 first and it will correctly report zero forever.
  **Do W18 before W9**, or W9 is a UI for an empty table.
- It is also the owner value proposition: "unique monthly eyes", listing
  performance, the whole reason an owner logs in.
- ⚠️ Two traps when wiring it: `analytics_events.property_id` is **uuid** but
  public URLs carry **slugs** — passing a slug fails silently (the helper
  returns `false` and logs). And the wrap RPC exact-matches
  `'property_view'` / `'property_save'`, so the event strings must match
  exactly (Rule 4).

**3. 28 real crash reports have never been triaged.** All `kind='crash'`, all
still `status='new'`, from 2026-06-23 → 2026-07-05 — i.e. before the July
cleanup, so most are probably already fixed. But nobody has confirmed it, and
this table is the only place a real user's crash is ever recorded.
- `Cannot destructure property 'user' of useDashboard(...)` — a component using
  `DashboardContext` outside its provider
- `getPropertyBySlug is not defined`
- `Minified React error #31` — an object `{key,label,placeholder}` rendered as a
  React child
- `Cannot read properties of undefined (reading 'length'/'map')`, plus a
  chunk-load failure
- Confirm each against current `main`, then close them. An untriaged crash queue
  is a wasted instrument.

</details>

---

### W19 🟠 Consolidate the admin gate onto `lib/adminGuard.js` ⏱ ~30 min · §59
`requireAdmin` was hand-copied into **five** route files — `admin/approve`,
`connects-refund`, `feature-flags`, `prc`, `property` — and **omitted from a
sixth**, `/api/admin/osint`, which is how that route ended up unauthenticated
(fixed 2026-08-06). The five working copies were deliberately left alone at the
time to limit blast radius.

- Point all five at `requireAdmin` from `src/lib/adminGuard.js`.
- ⚠️ **They all share a parsing bug worth fixing in the move:**
  `authHeader.replace("Bearer ", "")`. The `Headers` API trims values, so
  `Authorization: Bearer` with no token never matches `"Bearer "` and yields the
  literal string `"Bearer"` as the credential. Supabase rejects it, so it is not
  a hole — but it was caught by the new guard's own test, not by review.
- ⚠️ **`role` vs `active_roles`:** the five copies check `role === 'admin'`;
  `/api/property/verify` checks `active_roles.includes('admin'|'staff')`. Those
  can disagree. `adminGuard` accepts **either** on purpose. Reconcile the data
  before narrowing it, or a staff member gets half the console.
- Same lesson as `lib/auditTrail.js` (§58.5): a check duplicated per call site
  is a convention, not a control.

---

### W20 🟡 Two competing profile URL schemes, one unreachable ⏱ ~1h · §59
- The provider directories link to **`/profile/[username]`**.
- The routes **`/photographers/[photographer-slug]`**,
  `/researchers/[...]`, `/event-planners/[...]` also exist, and are in neither
  the sitemap nor any directory link — reachable from nowhere.
- `robots.js` disallows `/profile/`, so the directories are indexable and every
  destination they point to is blocked. → that half is **D6**, an owner call.

Pick one canonical public-profile URL and make the other redirect. Two schemes
means the SEO value splits and one of them is dead.

Also 🟡 `MOCK_CATEGORIES` is duplicated in `src/app/intel/page.js` and
`src/app/property/page.js`, and evaluates as
`MOCK_CATEGORIES[p.slug] || p.spaceCategory` — **the hardcoded map wins over the
real field**, so a category corrected in Airtable is silently overridden for
those slugs. Invert the precedence and share the one map.

---

### W21 ⬜ Scale-only performance pass — DO NOT DO THIS YET ⏱ ~2h · §59 Layer 8
114 Supabase advisor lints: 41 redundant permissive policies, 27 unindexed
foreign keys, 27 unused indexes, 18 `auth_rls_initplan` (`auth.uid()`
re-evaluated per row instead of `(select auth.uid())` — newer policies already
use the fast form), 1 duplicate index.

**Every one is a cost that scales with rows and traffic.** At 13 properties, 0
deals and 0 analytics events, fixing them is premature optimisation. Recorded
here as a single deliberate pass to run when real load exists — explicitly NOT
part of the pre-launch queue, so it stops resurfacing as "114 problems".

---

### W22 🟡🎨 Light-mode colour migration — CSS layer DONE, inline styles left ⏱ ~2h · §61 §63
Light mode itself was fixed and shipped in `5b5e883`. **2026-08-07 (§63) closed
the CSS-file half of the migration and rewired the three Tailwind palette keys
that were the largest single cause of "light mode did nothing".**

**Measured, both themes, 1280px, contrast scan with transitions disabled:**

| surface | dark before | dark after | light before | light after |
|---|---|---|---|---|
| `/` homepage | 0 | 0 | 0 | 0 *(dark island by design)* |
| `/settings` | 0 | **0** | **18** | **0** |

**Done — CSS layer is at zero hardcoded theme colour:**

| file | hex before | hex after |
|---|---|---|
| `settings/page.module.css` | 3 | 0 |
| `property/[id]/brokers/brokers.css` | 77 | 8 *(metallic tier gradients)* |
| `property/property.css` | 38 | 0 |
| `property/[id]/property-detail.css` | 31 | 5 *(local `:root`, photo backdrop)* |
| `hubs/[slug]/hub.css` | 32 | 0 |
| `discover/discover.css` | 31 | 0 |
| `ProfileContactModal.css` · `OwnerMode` · `BrokerMode` | 6 | 0 |
| `PrivacyShieldPanel.js` styled-jsx | 19 | 0 |

**The three Tailwind keys that mattered more than all 13 files combined.**
`on-surface` (367 call sites), `surface-variant` (497), `surface-container` (31)
were flat hex in `tailwind.config.js`, so `text-on-surface` painted near-white
ink on a near-white light surface across the whole app. Now
`rgb(var(--m3-*-ch) / <alpha-value>)`. **The dark values are byte-identical to
the old hex, so this is a no-op for dark mode.**

**New tokens** (`--bg-rgb`, `--surface-rgb`, `--surface2-rgb`, `--surface3-rgb`,
`--text-primary-rgb`, `--text-secondary-rgb`, `--accent-fill` in `:root`,
`--on-accent`, `--tier-diamond|platinum|silver|bronze`, the four `--m3-*-ch`).
Every `-rgb` shipped with its `-ch` twin per the channel-syntax rule.
`scripts/verify-contrast.mjs` grew from 17 pairs to **24** and still exits 0.

**Two corrections to the handoff doc, both verified:**
1. `#f0ede8` is **not** an orphaned background. All 87 occurrences are `color:`
   — zero are backgrounds. It is the warm off-white INK. Mapped to
   `var(--text-primary)`, not deleted.
2. `.descent-root` was added to the **dark-islands** list rather than migrated.
   Its 85 colours are five animated nebula frames — art, not theme.

---

### W23 ⬜🎨 Initialize Dashboard to Buyer / Scout Mode by default ⏱ ~1h
- **Default state**: Every registered user is a buyer/scout baseline. `/dashboard` must initialize `activeMode` to `'buyer'` (Buyer / Scout Workspace) where core search, property intelligence, and boards live.
- **Role Progression**: Users toggle into or add secondary roles (`owner`, `broker`, `provider`, `operator`) on top of the default buyer view.
- **Ref**: §Master Action Plan 5

### W24 ⬜🎨 Universal Typography & Readability Pass across Dashboard Modes ⏱ ~2h
- **Problem**: Text in Inbox, Calendar, Schedules, CRM, panels, and drawers is too small (<12px) and hard to read.
- **Fix**: Upgrade baseline font size to 13px–15px, expand line heights, and verify text contrast against deep background variables (`--accent`, `--bg-primary`).
- **Ref**: §Master Action Plan 7

### W25 ⬜🎨 Universal Header Integration on Dashboard Layout ⏱ ~1h
- **Requirement**: Mount the platform's Universal Header (`Header.js`) consistently across dashboard layout templates.
- **Goal**: Maintain unified top-level platform navigation between public discovery and private workspace environments.
- **Ref**: §Master Action Plan 7

### W26 ⬜ Live Chat & MMC Integration on Contact Surface ⏱ ~3h
- **Live Chat**: Build a real-time visitor live chat component on `/contact` that routes chat messages directly into Master Mission Control (MMC) real-time operations queue.
- **Contact Modules**: Structure clean placeholder cards for email (`support@scoutit.space`), phone number, and physical office location.
- **Ref**: §Master Action Plan 6

### W27 ⬜ Audit Google Calendar OAuth Redirect URI Handling ⏱ ~30 min
- **Problem**: Users encounter `Error 400: redirect_uri_mismatch` during Google Calendar OAuth connection.
- **Fix**: Audit `/api/calendar/sync` and `/api/calendar/callback` to ensure callback URL uses `getSiteUrl()` dynamically. (Requires Owner Action 1.8 in Google Cloud Console).
- **Ref**: Master Owner Actions 1.8

### W28 ⏸️ Origin Story Scrollytelling Manifesto & Team Showcase ⏱ ~8h · PARKED / LATER STAGE
- **Context**: Explicitly non-blocking for pre-launch or immediate launch. Post-launch brand asset.
- **Scope**: Continuous 600vh Three.js WebGL track flythrough, UFO trigger, gold kintsugi crack, 6-layer descent, and Founding Team showcase waypoint.
- **Ref**: §Master Action Plan (Post-Launch Brand Experience) · `[[ORIGIN_STORY_SCROLLYTELLING]]`

### W29 ⬜🎨 Enterprise Mode Read-Only Interactive Preview & Enterprise Pricing Upgrade Modal ⏱ ~2h
- **Interactive Preview**: Restore Enterprise Mode as an interactive read-only showcase so users can browse enterprise portfolios, team seats, analytics, and compliance views.
- **Read-Only Gate**: Prevent any write or mutation actions inside the preview.
- **Enterprise Pricing Modal**: Trigger a sleek Enterprise Pricing Modal on any attempt to click "Add Property", "Create Portfolio", "Invite Member", or execute mutation actions.
- **Ref**: §Master Action Plan (Enterprise Read-Only Preview & Pricing Modal Policy)

### W30 ⬜🎨 Layer 2 Discover & Intel Symbiotic Integration ⏱ ~3h
- **Bi-Directional Navigation**: Add a unified header toggle bar (`[🔍 DISCOVER SPACES]` ↔ `[📡 MARKET INTEL & BRIEFINGS]`) that preserves filter context when switching.
- **Intel Tags & Dossiers**: Display matching Intel badges on discovery property cards that open market research dossiers.
- **Embedded Space Carousels**: Embed property carousels inside Intel/OSINT articles so readers can inspect spaces without leaving research.
- **Spatial Radar Overlay**: Implement MapLibre `[📡 SIGNALS]` layer on `/discover` displaying geotagged market signals with dynamic impact radiuses.
- **Ref**: §Master Action Plan (Layer 2 Discover & Intel Symbiotic Integration Architecture)

**Left — inline styles, the other half:**
- 649 inline `style={{ color: "#…" }}` in JSX. 420 of them in
  `CommercialFlow.js` (225) + `ResidentialFlow.js` (195), then
  `SpatialCommandMap.js` (48), `UnitMasterPage.js` (37). Same mapping table;
  inline `style` accepts `var()` fine.
- 378 Tailwind arbitrary values `bg-[#111111]`.
- **Only `/` and `/settings` have been re-measured.** `/discover`, `/property`,
  `/property/[id]`, `/hubs/[slug]`, the brokers page and the dashboard were
  changed but not scanned — measure before claiming them.
- The hero wordmark is still white-on-white. Unchanged, still unsolved.
- `cubic-bezier(0.175, 0.885, 0.32, 1.275)` bounce easing, 2 uses. Owner call.

🔴 **The scan snippet in the handoff doc under-reports unless you first inject
`* { transition: none !important; animation: none !important; }`.** In a
background tab Chrome does not tick transitions, so any element with
`transition: color` returns its frozen pre-toggle value — `/settings` measured
9 phantom failures that way. See §63.

**Ref:** §61 · §63 · Standing Rules 24, 25

---

### W23 🟢🎨 Type + motion pass on the reading surfaces — DONE ⏱ done · §64
2026-08-07. Display face, type scale, motion discipline and light mode across
`/intel`, the article template, `/about`, `/discover`, `/dashboard`.

**Measured — contrast scan, transitions disabled, both themes:**

| surface | dark | light | note |
|---|---|---|---|
| `/intel` | 0 | **0** *(was 12)* | 76 elements |
| `/intel/[slug]` | 0 | **0** *(was 1)* | 59 elements, also at ~620px |
| `/about` | 0 | **0** | 52 elements |
| `/dashboard` | 0 | **0** | 47 elements |
| `/discover` | 0 | **0** | 58 elements — measured after the §65 fix below |

`verify-contrast.mjs` now 30 pairs, exits 0. `verify-tokens.mjs` exits 0.

**Typography.** Georgia → **Instrument Serif** via `next/font`. Georgia is a
*system* font: never downloaded, a different typeface per OS, one weight — so
the 35 `font-weight: 500/600/700` declarations on it were being **synthesised**
by the browser. All 128 hardcoded `Georgia, serif` stacks now point at
`--font-display`. New fluid scale `--display-xl/lg/md/sm` with per-size tracking
(high-contrast serifs need it pulled in at display size), `--measure: 66ch`.
Article body 15px → 17px.

**Two real bugs found, both invisible in dark mode:**
1. 🔴 `.cinematic-container` and `.global-footer` had been **dropped from the
   dark-islands selector list** before `0320dbd`, leaving only `.descent-root`.
   Footer headings measured 1.03:1 in light. Restored.
2. 🔴 Islands had dark **ink** but no dark **ground**. Fixed on `.global-footer`,
   `.article-hero`, `.featured-card-new`, `.visualContent`. Islands also need
   the `-ch` twins or Tailwind-coloured children stay light (2.05:1 case).

**Design corrections** (taste-skill / emil-design-eng / DESIGN.md):
`.hov-card` + `.hov-glow` + `.glass-panel` off violet glass onto tonal surfaces;
`--transition-slow: 0.3ms` → `0.3s` (a typo, so every rule using it was
snapping); 400ms bounce hovers → 200ms ease-out at 2px; `transition-all` ×103
and `duration-500/700/1000` ×34 tightened on the dashboard; `:active` press
states; `prefers-reduced-motion` and `prefers-reduced-transparency` guards.
`/about` de-centred; `/intel` grid given editorial rhythm; the featured card's
four hardcoded heights replaced by one `aspect-ratio`.

**Open — owner decision, not a bug:** `#00f2fe` / `#ff75c3` (70 uses) are a
fourth and fifth hue with no documented meaning. Tokenised with dark values
unchanged; whether they belong is a brand call. See §64.9.

**Left:** the 649 inline `style={{}}` colours (W22), `/discover` verification,
the hero wordmark, and a true 375px pass — the browser window would not go
below ~560px, so mobile was checked at ~620px content width, not 375.

**Ref:** §64 · W22

---

### W24 🔴🐛 A raw `<style>` in Header froze `/discover` and `/property` — FIXED · §65
Pre-existing, not from W23. Both pages sat on their loading fallback **forever**
— HTTP 200, no console error, no error overlay, all chunks fetched. Two of the
three surfaces a buyer browses.

**Cause:** `Header.js` shipped ~11KB of CSS as a **raw `<style>{…}</style>`**
instead of `<style jsx>`. React 19 hoists a raw `<style>` into `<head>` as a
stylesheet *resource*; without `precedence` it leaves the enclosing `<Suspense>`
boundary pending forever. Any page rendering `<Header />` beside a `<Suspense>`
froze — action at a distance, with nothing wrong at either end.

Proved by 14 bisect probes: a one-rule raw `<style>` is fine (probe M), Header's
block alone reproduces it with no other Header code present (probe N).

**Fixed:** `<style>` → `<style jsx>`. All of Header's selectors are its own
markup, so scoping changes nothing. `/discover` and `/property` both render;
`/discover` now measures 0 failing in both themes (58 elements, first time ever
measured).

⚠️ **17 other files still use a bare `<style>{…}</style>`** — `page.js`,
`about/`, `brokers/`, `intel/`, the five directory pages, `error.js`,
`not-found.js`. Harmless *only* because none currently sits next to a Suspense
boundary. Adding one will reproduce the freeze. Worth a sweep to `<style jsx>`.

🧹 **Cleanup owed:** 14 throwaway routes at `src/app/zzprobe-*` and 3 at
`src/app/__probe_*`. The session could not delete files. They are stubbed to
`notFound()` so they 404, but **delete the folders**:
`rm -rf src/app/zzprobe-* src/app/__probe_*`

**Ref:** §65

## PHASE 5 — DEFERRED BY DECISION
*Explicitly parked so they stop looking half-done. Do not start these.*

| Item | Ref | Why parked |
|---|---|---|
| Successor / estate continuity list | §34.4 | Post-launch |
| MMC internal RAG assistant | §10a | Internal leverage only |
| CSP tightening (remove `unsafe-inline`) | §25.3 | ⚠️ Verify MapLibre/Matterport first — `unsafe-eval` may be load-bearing |
| Wishlist per-link revocation | C17 | 90-day expiry covers most of it |
| WebRTC calls / Twilio proxy | §20.2–20.3 | Owner decision |
| Voice AI co-pilot · FSBO intercom · Spatial OSINT · Briefing OS | §6, §7, §23, §33 | Owner-designated future phases |
| Cloudflare R2 media | §9 | Trigger-based — no large files yet |
| Broker briefing print layout | §5 | Code complete, never seen by human eyes. Verify during W3 if convenient |

---

> 📌 **Before ticking anything ✅, name the screen a user touches to reach it.**
> If there isn't one, the status is "backend ready" — never "done". That mistake
> is what produced Phase 3.
