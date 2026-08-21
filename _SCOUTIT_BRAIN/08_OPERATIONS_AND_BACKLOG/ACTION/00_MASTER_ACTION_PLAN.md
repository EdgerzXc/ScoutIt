---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, master-action-plan, open-work, launch, roadmap]
updated: 2026-08-21
related:
  - "[[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]]"
  - "[[MASTER_OWNER_ACTIONS]]"
  - "[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]"
---

# SCOUTIT MASTER ACTION PLAN

> **This is the only live execution list.** It contains work that is still open,
> including founder actions, unresolved decisions, verification, and
> trigger-gated obligations. Finished work belongs in
> [[2026-08-13_BRAIN_PRUNING_RECORD|Brain Pruning Record]], not here.

## Reconciliation checkpoint — 2026-08-21

This checkpoint supersedes older status prose when the two conflict.

- **Production:** `origin/main` and Vercel production are on commit `7e6e09a`
  (deployment `dpl_DLDiBGGqgo8gDLN3bS92H8kQhUyn`, READY). `/onboarding` and the
  Ridgeline property route both return 200 on `www.scoutit.space`.
- **Authentication:** onboarding now uses Google Identity Services in the app and
  exchanges the Google ID token through `/api/auth/complete-onboarding`. The
  Supabase project hostname is no longer the Google account chooser's public
  product label. Google Cloud consent-screen/app branding is a separate owner
  configuration and is **deferred because that configuration is not available
  now**; do not treat it as an executable engineering task in this checkpoint.
- **Private onboarding data:** the live Supabase onboarding contract/migration is
  applied; dashboard entry after successful completion is the current contract.
- **Market article bridge:** code reads `Related_Property`, `City`, `Location`,
  `District`, and `Region`; the live `test-intel` record is now truthfully tagged
  `Makati / Makati CBD / Metro Manila`. The blank live-approved record was
  unpublished. No approved Pasig/Capitol Commons briefing exists, so Ridgeline's
  empty state is correct; do not fabricate content or attach the Makati article.
- **Master Flow:** public Flow Map exposure remains removed. The graph is an
  internal staff knowledge source and future user guidance must be cut into
  contextual, role-safe slices. The 117-node/233-edge audit is now route-grounded:
  canonical routes 15/15, evidence 80/117, state transitions 7/20, recovery
  14/19. A 92% trust score means the recorded claims are grounded; it does **not**
  mean the product or state machine is 100% complete.
- **Search Console:** the 2026-08-16 connected read (verified domain property,
  historical data present) overrides older unchecked statements claiming setup
  or data collection never happened.

## Operating rule

1. **Human-testing readiness is the first priority.** Prepare a stable, honest,
   testable product before expansion work unless there is a live security/privacy issue.
2. **Keep all mock and sample data for human testing.** Every affected surface
   must explicitly say **SAMPLE DATA — FOR HUMAN TESTING**, and remain isolated
   from real data. Remove it only during the actual launch cutover.
3. Work from the first open phase after human-testing readiness.
4. Inspect current code and live behavior before implementing an old finding.
5. One concern per change set; include acceptance evidence.
6. Remove a verified item from this file and record its evidence in the done log.
7. Do not create another engineering task list. [[MASTER_OWNER_ACTIONS]] is the
   permitted filtered companion for work only the founder can do. Backlog, idea,
   prompt, and handoff files remain sources/history only.

## Where we stand — audit 2026-08-13

**This file is the queue, not a manually maintained dashboard counter.** The
previous headline said 237 items while the file actually contained 285 unchecked
boxes after later additions. Hard-coded totals have therefore been retired: they
drift whenever work is merged. Use the priority tiers below and the first open
acceptance item in the current phase; count checkboxes only when a dated audit
specifically needs a snapshot.

**Current pilot gate:** the previously exploitable authorization defects are fixed and the 1.0B database change is applied. That does **not** mean code is fully ready: open T0 defects, migration reconciliation, retention/cron work, legal assent, and verification remain below, alongside owner credentials and real-device checks.
**Migration checkpoint - 2026-08-14:** the owner chose tracked migrations as
authority and the read-only live audit is complete. Five migrations are ready
conditionally; `spatial_ref_sys` is held. Nothing was applied. The exact sequence
and gates are in [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].



**Corrections made in this audit (things that no longer made sense):**

1. §1.0 told a future session to *"apply the prepared telemetry migration … and verify
   the scheduled cleanup."* That instruction is now **actively dangerous** — the
   migration it names (`20260809000001`) was superseded by `20260812000001` and would
   regress the storage-exhaustion fix. Struck through and replaced; the still-valid half
   (`IP_SALT` in production) was split out as its own item so it is not lost.
2. §1.0B claimed the `deals` UPDATE policy *"gained a `WITH CHECK`."* It did not — that
   was the rejected fix. The live database has **no UPDATE policy on `deals` at all**,
   which is deny-all and stronger. Corrected to describe the inverted fix that shipped.
3. Added §1.0C recording the owner's **compress-don't-delete** decision for telemetry,
   and the warning that the existing `clean_old_security_logs()` is a hard delete and
   must not be scheduled as-is.

## Addendum — live three-platform read, 2026-08-13 (later same day)

A connected read of **GitHub, Vercel, and Supabase** was taken after the audit
above. Evidence:
`[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]`.
It changes three things:

1. **Two counts in §1.0A were stale and are corrected in place.** Dependabot is
   **13**, not 25. CodeQL is **18**, not 19. Both were read from GitHub's API,
   per Rule 2.
2. **A whole platform was undocumented.** Supabase reports **30 security + 113
   performance advisors**; this plan previously mentioned only leaked-password
   protection. Vercel runtime health was absent entirely. Both now live in the
   new **§1.0E**.
3. **One item moved up sharply, and it is not a security item.** The OG-image
   renderer has been failing for **56 users continuously since 2026-08-01**, so
   every shared listing link has gone out with no preview image for 12 days.

**Still not blocking human testing.** The two ERROR-level database findings are
a PostGIS reference table and a view that needs reading — neither is a live data
leak. The credential-shaped Clerk test fixture was defanged, and vendored agent
tooling was removed from tracked publication. Both are on `origin/main` through
merge `a312ce7`; only the owner dashboard close remains.

**Known stale figure, left alone deliberately:** §1.0's completed entry cites
"unit is 882/882". The suite now runs **1015/1015**. That line is a historical record of
what was true that day, so it has not been rewritten.

## Release record — PR #64, 2026-08-20

Branch `claude/scoutit-launch-plan-322a11` pushed to GitHub and opened as
**[PR #64](https://github.com/EdgerzXc/ScoutIt/pull/64)**. Four commits, one
concern each:

| Commit | Concern |
|---|---|
| `091ae5e` | `/property` viewport overflow + header back button under the touch floor |
| `1576053` | Public-profile indexability now fails closed |
| `6a974a9` | `private, no-store` on every exit of `/api/profile/me/role` |
| `08578dc` | Re-aimed two stale tests that had left the suite red |

**Evidence at push time:** local production build exit 0 · **1210/1210 tests
across 110 files** · ESLint clean on every changed file · all **8 CI checks
pass** (both `verify` jobs, CodeQL, both Analyze jobs, review, Vercel) ·
`mergeable: MERGEABLE`.

**MERGED 2026-08-20 as `41bbb4b`.** Owner approved. Post-merge CI on the merge
commit: `verify`, `Analyze (actions)`, `Analyze (javascript-typescript)` — all
success. Production redeployed and healthy.

### Post-merge production audit — clean

Re-measured the deployed site, because the pre-merge evidence was a local build
plus injected CSS, not the shipped artifact. 10 routes × 5 widths = **50 page
loads**:

| Check | Result |
|---|---|
| Non-200 responses | **none** |
| Pages that failed to render (the false-pass guard) | **none** |
| Horizontal overflow, any route, any width | **zero** |
| Back button height at 320/360/390/768/1280 | **44px everywhere** |
| `/property` card width by width | 296 / 336 / 366 / 736 / 423 — all correct |
| `/api/profile/me/role` | `Cache-Control: private, no-store` (was `public`) |
| Demo profile robots | `noindex, follow` |
| **Nonexistent** profile robots | `noindex, follow` — the actual bug, confirmed fixed |
| `/api/contact` contract | GET 405, malformed POST 400, form and Turnstile intact |

`/property` went from 20 overflowing elements at 320px, worst 49px over, to
**zero**. The auto-min-width fix is live and verified on the real deployment.

**The guard earned its place immediately.** Every page in this run was checked
for a render anchor before its zero was trusted — which is precisely what caught
the preview deployment lying earlier the same day.

**One console error remains site-wide and it is not ours.** `/contact` logs
`%c%d font-size:0;color:transparent NaN` at every width. Traced to its source:
`challenges.cloudflare.com/.../turnstile/...` — Cloudflare Turnstile's own
iframe. Third-party noise, no action. Recorded so the next audit does not
re-investigate it.

### ⚠️ The preview deployment cannot be measured — and a check nearly reported a false pass

Vercel **Deployment Protection is on for preview deployments**, so
`scout-it-git-claude-…vercel.app` **302s to an SSO wall**. Playwright followed
that redirect, rendered an empty shell, and the overflow probe returned a clean
**0 at every width** — which looked exactly like the fix working and was in fact
a measurement of a login page. It was caught only because `cardW`, `backH` and
`headerH` all came back `null`: the elements did not exist.

**The generalisable trap:** an overflow or layout assertion passes trivially
against a page that has no content. Any such check must assert that a known
element **exists** before trusting a zero. A "0 problems" result from a probe
that never found the app is the most convincing wrong answer available.

Recorded rather than fixed, because the protection itself is wanted — §2.5
explicitly asks for Deployment Protection. What is missing is a way to measure
behind it.

- [ ] Decide how deployed previews get verified: a bypass token for automation,
      or accept that verification happens against production after merge. Today
      it is neither, and the gap was invisible until a probe lied convincingly

**So what this PR's layout fix actually rests on:** the local production build,
the full suite, and a live measurement on production with the exact final CSS
injected — which took `/property` from 20 overflowing elements (49px worst at
320px) to **0 at 320/360/390/768/1280**, desktop grid unchanged. That is strong,
but it is *not* the same as verifying the deployed artifact, and it should be
re-measured on production once merged.

## Addendum — the suite was red, 2026-08-20

**The test suite had two failing tests before this session started**, and no
entry in this file said so. Confirmed by stashing the session's changes and
re-running against a clean tree, rather than by assuming.

Both were in `src/components/layout/ambient/ambientData.test.js`, and both were
the same mistake: they asserted **desktop wording against `mobileSegments`**.
The mobile pass deliberately shortened those labels to fit the ambient rail —
`RAIN CHANCE` → `RAIN`, `AIR GOOD` → `AIR`, and the `LOCAL TIME` label dropped
entirely because a clock reads as a clock. `ambientData.js` explains each of
these in a comment beside the code. **The behaviour was right the whole time and
the tests were left behind**, which is Standing Rule 14 in the direction nobody
watches: the rule is usually read as "do not delete a test", but leaving one red
is the same failure with worse ergonomics, because a permanently red suite stops
being a signal.

Both were re-aimed at what the code actually guarantees — including the narrower
rule the code really follows, which is not "always label" but *"a label survives
on mobile only where the value cannot speak for itself"*. Suite after:
**1210/1210 across 110 files.**

- [ ] **Decide how a red suite becomes visible.** Nothing surfaced this for an
      unknown number of days; it was found only because an unrelated change
      required a baseline run. The 2026-08-13 addendum already noted CI was
      "silently red for days" once before (§1.0F). That is twice.

> **Counting note, per Standing Rule 12.** Totals in this file now read 882 →
> 1015 → 1109 → 1210 at four different dates. Each was true when written. Do not
> reconcile them into one number — re-run the suite instead.

## Addendum — re-verification of external claims, 2026-08-16

Read-only pull from GitHub, Vercel, Supabase, and public DNS. Nothing was
applied, dismissed, enabled, or altered. The purpose was narrow: **this plan
asserts many things about systems it does not control, and nothing re-reads
them.** Every claim below was cheap to check and none had been checked since it
was written.

### What was already true and stays true

| Claim | Verdict |
|---|---|
| Five migrations prepared, none applied | ✅ **Confirmed.** Live `list_migrations` shows the last applied is `20260813043104`. None of the five named versions appear |
| DNS still on GoDaddy | ✅ **Confirmed.** `ns57/ns58.domaincontrol.com` |
| Google verification token still live on the apex | ✅ **Confirmed.** `google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM`, byte-identical to the value recorded here. **This is the record that must survive any Cloudflare cutover** |
| No MX records | ✅ **Confirmed.** Zero MX answers |
| `spatial_ref_sys` RLS still open (ERROR) | ✅ **Confirmed.** Still the one object where "is this reachable?" is yes |
| `public_profiles` still a `SECURITY DEFINER` view (ERROR) | ✅ **Confirmed.** The 2026-08-13 work closed the anonymous *write* path; the view's `SECURITY DEFINER` property is unchanged and still flagged |

### What had drifted

- [ ] **`rls_enabled_no_policy` is now 19 tables, not 20.** Minor, but it is the
      kind of number Standing Rule 12 warns about — repeat it often enough and it
      acquires authority it never earned. Re-count rather than re-copy.

- [ ] **Two advisor categories exist now that did not exist at the 2026-08-13
      audit**, so they appear in no prior record and no checklist:
      `anon_security_definer_function_executable` (lint 0028) and
      `authenticated_security_definer_function_executable` (lint 0029). Six
      findings, all on PostGIS `public.st_estimatedextent` in its three
      overloads, callable by both `anon` and `authenticated` via
      `/rest/v1/rpc/st_estimatedextent`.

      **Assessment: low risk, but do not dismiss it unread.** These are PostGIS
      built-ins, not ScoutIt functions, and they arrived with the extension
      rather than with any of our migrations. `st_estimatedextent` returns
      estimated bounding boxes from planner statistics — it leaks approximate
      geometry extents, not rows. It is the same root cause as the existing
      `extension_in_public` warnings for `postgis` and `vector`: **the extension
      is installed in `public`, so everything it ships is on the public API
      surface.** Fixing the schema placement retires this whole family at once.

      Note the tension with Standing Rule 8 — new `SECURITY DEFINER` functions
      must revoke EXECUTE in the same migration — which was written for functions
      *we* create. An extension installed into `public` sidesteps it entirely by
      bringing its own. Worth adding to Rule 8's scope.

- [ ] **Advisor findings should be re-read on a schedule, not per-audit.** The
      lint set itself changes under us; a one-time snapshot silently ages. This
      is one MCP call and belongs in the same cadence as the freshness crons.

### The process finding underneath all of this

Two items in [[MASTER_OWNER_ACTIONS]] were verifiable from outside and neither
had been re-checked: item 6 was **finished three days before** and still sat in
the owner queue, and four of item 3's five credentials were provable by
observable production behaviour without any dashboard access.

- [ ] **Adopt the rule: an item whose state lives in an external system must
      record how to re-check it, in one command.** Not who to ask — how to look.
      Every claim in the table above took under a minute because the check was
      obvious; the ones that rotted were the ones where it was not written down.

- [ ] Extend `/api/health` to report configured/not-configured booleans (never
      values) for credentials with no other outward symptom. `RESEND_API_KEY` is
      the current example: it is the only one of five that could not be verified
      from outside, and the only way left to test it is to send mail.

### One consequence for §1.6

**There are no MX records on `scoutit.space`.** A contact surface must not
publish `support@scoutit.space`, or any address at that domain, as a reply
channel — nothing can receive there. `src/lib/email.js` also sends *from*
`notifications@scoutit.space`, so replies to ScoutIt's own outbound mail
currently go nowhere. Recorded against §1.6A, which already forbids publishing
unmonitored channels; this is the specific evidence for it.

---

## Current execution router - canonical order as of 2026-08-13

> **For future agents:** execute this router, not the physical position of a
> section farther down the file. Section IDs remain stable because implementation
> records and Obsidian notes link to them. Completed sections stay in place as
> evidence; they do not re-enter the queue merely because they appear earlier.

| Order | Gate | Owner lane | Agent-safe lane | Exit condition |
|---:|---|---|---|---|
| **0** | Reconcile the release baseline | ✅ **MET, and superseded — see note below the table** | Verify remote ancestry and the deployed commit without changing live systems | Vercel production is `READY` on the current `main` HEAD and the homepage loads |
| **1** | Short owner checkpoint | Work the **Current checkpoint** at the top of [[MASTER_OWNER_ACTIONS]] | Continue only T0 work that does not mutate live DB, DNS, or provider settings | High-fan-out decisions and credentials are recorded |
| **2** | Close pre-pilot T0 | Complete real-device, external-dashboard, security-setting, and legal/privacy actions | Close open work in sections 1.0/1.0A/1.0C-F/1.0H, 1.1-1.7, 2.1-2.5, and the pre-pilot 4.5 gate | One release candidate passes code, browser, live-service, legal, and owner evidence |
| **3** | Run the invited free pilot | Approve cohort, identities, recipients, and monitoring | Support sections 2.6-2.7; fix only evidenced pilot defects | Pilot exit review is recorded |
| **4** | Post-pilot truth hardening | Approve product/data rules that cannot be inferred | Execute sections 3.0A-3.5 and provider-neutral payment logic only | Real-data cutover is reproducible and trustworthy |
| **5** | Build honest supply | Lead owner/listing acquisition and verification | Execute section 3.6 supply, freshness, and measured discovery improvements | 200 real approved listings |
| **6** | Commercial activation | Choose provider, approve offer/legal/infrastructure, and activate paid mode | Finish sections 5.1-5.3 behind fail-closed gates | First payment is truthful, supportable, and reversible |
| **7** | Trigger-gated expansion | Approve a measured trigger | Activate qualified 4.1/4.2, dormant SEO modules, or [[FUTURE]] items | Module-specific success and rollback gate passes |

> **Gate 0 note, 2026-08-16.** This gate named `77f0ce4` as its exit condition.
> That was met, and `main` has since advanced eight commits to `53c3b1c`, with
> Vercel production `READY` on it and `www.scoutit.space` serving it — verified
> today. The gate is restated against *"the current `main` HEAD"* rather than a
> fixed SHA, for the same reason the §1.2 rollback target was corrected.
>
> **The distinction worth keeping:** a SHA pinned as **evidence** ("this was
> verified at `77f0ce4`") is correct and should never be updated — that is the
> historical record. A SHA pinned as an **instruction or exit condition** rots
> the moment the branch moves. This file contains both; only the second kind
> needs sweeping.

### What can continue before the owner checkpoint is finished

- Code and test work that does not assume an unresolved data authority, public
  profile policy, payment provider, or live migration state.
- Deterministic section 1.0D engineering: Connect ledger role scope correction 3 ready for review; category precedence, Google OAuth redirect contract, raw-style, and silent typo-account defects are closed.
- Read-only Supabase policy/effective-access analysis and preparation of reviewable
  migration proposals; never apply against drifted production history without the
  section 1.12 owner decision and a fresh live-schema read.
- Section 1.5 responsive experience work, current JSON-LD safety/validation
  foundations, focused tests, documentation reconciliation, and release evidence.

### What must wait for the owner checkpoint

- Applying or scheduling database migrations, retention jobs, or policy changes.
- DNS/Cloudflare changes; Search Console must be verified and its TXT record
  preserved first.
- Public-profile canonical/indexing changes, live credentials, repository settings,

  paid-provider SDK selection, legal sign-off, and physical-device acceptance.
## Priority tiers — what is urgent, what waits, what is locked

> **Current authority:** the table below is the effective tier map. The older
> dated snapshot is retained in a hidden comment for provenance only.

| Tier | Meaning | Sections/modules |
|---|---|---|
| **T0 - NOW** | Blocks a safe invited tester | Open work in 1.0, 1.0A, 1.0C-F, 1.0H, 1.1-1.7, 2.1-2.5, and 4.5. For SEO, only 1.4C foundations/prerequisites and 1.4D Phases 0-2 are T0. |
| **T1 - THE PILOT** | The pilot run and evidence | 2.6-2.7 |
| **T2 - AFTER PILOT** | Real-data and trust hardening | 3.0A-3.5 plus provider-neutral payment logic; no live provider activation |
| **T3 - SUPPLY** | North Star climb | 3.6 until 200 real approved listings |
| **T4 - COMMERCIAL LOCK** | Cannot take money until North Star and release gates pass | 5.1-5.3; offer/infrastructure preparation may finish before activation |
| **T5 - FUTURE** | Requires an explicit measured trigger | 4.1, 4.2, 1.4C dormant modules, 1.4D Phases 3-4 where page/data gates are unmet, and [[FUTURE]] |

Completed evidence such as 1.0B and 1.0G is excluded from the open tiers.
Approximate checkbox totals were removed because nested strategy checklists and
historical acceptance evidence made them misleading.

<!-- BEGIN:SUPERSEDED_TIER_SNAPSHOT
Added 2026-08-13. Every section belongs to exactly one tier. **The tier is set by
what an item BLOCKS, not by how interesting or how large it is.**

The founder-confirmed sequence (§"Strategy to confirm once") is:
**stabilise → invited free pilot → build supply to 200 listings → activate
payments → expand later features at their triggers.** The tiers below are that
sentence, applied.

| Tier | Meaning | Sections | Open |
|---|---|---|---|
| **T0 · NOW** | Blocks inviting a single human tester | §1.0, §1.0A, §1.0C, §1.0D, §1.1–§1.5, §2.1–§2.5 | ~119 |
| **T1 · THE PILOT** | The pilot run itself | §2.6, §2.7 | 18 |
| **T2 · AFTER PILOT** | Before mocks come out and real data goes in | §3.0A, §3.0, §3.1, §3.2, §3.3, §3.4, §3.5 | ~58 |
| **T3 · SUPPLY** | The North Star climb — 200 real approved listings | §3.6 | 11 |
| **🔒 T4 · LOCKED** | **Cannot start until the North Star is reached** | §5.1, §5.2, §5.3 | 16 |
| **T5 · FUTURE** | Parked with a reason or a trigger | §4.1, [[FUTURE]] | 25+ |
END:SUPERSEDED_TIER_SNAPSHOT -->

### 🔒 What "locked" actually means

**Payments, subscription tiers, and Connects monetisation do not begin until
there are 200 real approved listings.** That is the North Star, and it is a
locked constraint, not a preference. Payments stay **disabled** throughout human
testing.

Three things are locked to it explicitly:

| Locked item | Gate |
|---|---|
| Payments, tiers, Connects (§5.3) | North Star reached, offer made truthful first |
| Cloudflare R2 Spatial Vault | North Star **and** paying subscribers **and** a real large-file need — all three |
| Voice briefing / co-pilot | 200 verified listings **and** demand **and** sufficient verified data |

⚠️ **§5.1 and §5.2 are the exception inside the lock.** "Make the offer truthful"
(six advertised benefits with no implementation) and "Production infrastructure"
(backups, credential rotation, spend alerts) must be **finished before the first
payment**, not after. They are locked *with* payments, not *behind* them — so
they cannot be left to the week money switches on.

### 💳 Build the payment LOGIC now — provider NOT chosen (owner decision 2026-08-13)

**Owner instruction:** *"just put the logic since I need to decide first if
Stripe is the only way."*

So this section describes **provider-agnostic payment logic**. Stripe is **not**
assumed and must not be hard-wired anywhere.

The lock is on **taking money**, not on **being able to**:

| Can be built NOW (T2) — provider-neutral | Locked until North Star (T4) |
|---|---|
| The subscription **state machine** (active, past-due, cancelled, grace) | Live keys / real charges |
| Tier → entitlement mapping (already exists) | Switching `pre_launch_free_mode` OFF |
| Connects purchase, ledger, receipts | Publishing paid pricing as purchasable |
| Refund, proration, failed-payment and dunning **paths** | Real payouts |
| Invoice/receipt records + the fields PH tax requires | — |
| An **adapter interface** the chosen provider plugs into | — |

**The design rule that keeps the decision open:** every provider call goes
through **one adapter module** (`createCheckout`, `cancelSubscription`,
`handleWebhook`, `refund`). Nothing else in the codebase may import a payment
SDK. Choosing or switching providers then touches one file, not the product.

⚠️ **Two guards so "ready" never becomes "accidentally live":**
1. **No live keys in any environment** until the North Star is reached.
2. The flag enabling purchase must **fail closed** — a missing flag row means
   payments OFF, never ON (Standing Rule 6: a negative check fails open).

- [ ] Build the provider-agnostic payment logic and adapter interface above;
      rehearse subscribe → renew → fail → refund → cancel against a sandbox before
      any live credential exists. **Do not import a provider SDK outside the adapter**

#### ⚠️ Provider choice is an OPEN OWNER DECISION — and it may not be Stripe

Recorded because it could block everything above, and it is not an engineering call.

**ScoutIt is a Philippine business taking payments from Philippine customers.**
That materially narrows the field, and it is the reason the owner is right to
question whether Stripe is even available.

- **Verify Stripe's current availability for a Philippine-registered entity
  before designing around it.** Stripe's supported-country list for *accepting
  payments and receiving payouts as a local business* has historically **not
  included the Philippines**, with access via partners or other arrangements.
  This must be confirmed against Stripe's own current documentation — do not
  design a checkout on an assumption here.
- **Local/regional options to evaluate:** PayMongo, Xendit, Maya Business,
  Dragonpay, PayPal.
- **What Filipino customers actually pay with matters more than card support:**
  **GCash and Maya** are dominant, alongside bank transfer/InstaPay and
  over-the-counter. A card-only provider may fit the code and still fail the
  customer.

**Evaluate on:** PH entity eligibility · GCash/Maya support · settlement time ·
fees · sandbox quality · subscription/recurring support (several local providers
handle one-off payments far better than recurring) · refunds · invoicing for BIR.

- [ ] **Owner:** choose the payment provider. Recorded in [[MASTER_OWNER_ACTIONS]].
      Until chosen, build only against the adapter interface — never a specific SDK

### Where the honest edges are

- **§2.5 Operational security — 35 open, the largest block anywhere.**
  ✅ **Owner ruled 2026-08-13: security is urgent. Do not downgrade it.** Work it
  as T0 in full; do not split it into "pilot-sufficient" and "later."
- **§1.5 Responsive brand experience — 21 open.**
  ✅ **Owner ruled 2026-08-13: design polish on BOTH web and mobile is important.**
  Stays T0 in full. ScoutIt sells judgement, and judgement is read off the
  interface before a word is (see [[RULES]] Part B).

*Both of these overrule an earlier agent suggestion to triage them downward. The
suggestion was wrong for this product; the record is kept so it is not re-proposed.*

**§1.0C (telemetry compaction) is in T0 by date, not by risk.** Nothing is
overdue until ~2026-08-22 and no user is affected; it sits here only so the date
is not missed.

### Current ruling - owner checkpoint now, agent work may continue in parallel

The repository is not generally blocked: the working tree contains no untracked
code and the former 242-file release bundle is already represented in committed
history. There is still useful T0 code, test, SEO-safety, responsive-design, and
read-only security analysis that an agent can perform.

However, **the next high-leverage move is the short owner checkpoint in
[[MASTER_OWNER_ACTIONS]]**, because migration authority, live platform settings,
Search Console, public-profile policy, and credentials each block multiple later
acceptance items. Do not wait for the entire owner checklist before continuing;
finish its Current checkpoint first, then run owner and agent lanes in parallel.

<!-- BEGIN:SUPERSEDED_BLOCKER_SUMMARY
### The one thing that is genuinely blocking today

Nothing in the code. The two live security holes are fixed and verified. **What
remains in T0 is mostly owner-only confirmation work** — environment variables,
hostnames, deploys, and real-device passes that an agent cannot perform. See
[[MASTER_OWNER_ACTIONS]].

END:SUPERSEDED_BLOCKER_SUMMARY -->

## Strategy to confirm once

Recommended operating strategy distilled from the ledger and all backlog files:

- [x] **Founder confirms the strategy (2026-08-11):** stabilize and run a small free invited
      pilot; build honest supply toward **200 real approved listings**; activate
      payments only after the product, commercial infrastructure, and delivery
      promises pass rehearsal; expand later features only at their stated trigger.
      Payments remain disabled during human testing; no active payment work is needed now.

Until changed explicitly, use these locked constraints:

- ScoutIt's existing live domain is `scoutit.space`; it is already indexed,
  searchable, and discoverable in Google;
- invited human testing runs on the live `scoutit.space` production site, not
  on a separate preview deployment;
- invited testers may create real accounts and use complete non-payment workflows
  that write to production; payments remain disabled during human testing;
- testers use valid temporary testing email identities they control. ScoutIt deletes
  only the ScoutIt platform accounts at launch; the external Gmail accounts remain
  the testers' property and are never promoted automatically;
- sample listings remain publicly navigable on live `scoutit.space`, explicitly
  labelled **SAMPLE DATA — FOR HUMAN TESTING**, and excluded from indexing;
- sample inquiries route only to designated test recipients, never uninvolved real
  owners/brokers. Testers use real authentication email only; phones, listings,
  profiles, and other public contact data remain sample data;
- feedback uses observed sessions, a short form, and written notes. No raw session
  recording is retained; sanitized notes may be given to AI to produce fix tasks;
- Jerzel decides when human testing is complete from the accumulated notes and
  evidence; there is no automatic round count or clean-days threshold;
- payment controls remain visible but disabled and explicitly state that payments
  are unavailable during human testing;
- testers receive clear notice that their ScoutIt account is temporary and will be
  deleted at launch; no separate deletion-consent workflow is required;
- staff login aliases use `firstname.lastname@scoutit.space`. Role aliases such
  as `support@` may forward mail but can never authenticate;
- ScoutIt has no separate break-glass admin account;
- staff/admin access uses a two-stage hybrid identity. Initially, each staff
  member creates and privately controls a dedicated free ScoutIt-only Gmail account;
  `name@scoutit.space` forwards to it. When Google Workspace Business Starter is
  activated, Jerzel provisions the managed mailbox at the same `name@scoutit.space`
  address. Supabase/Mission Control identity remains stable while mail delivery moves
  from forwarding to the managed mailbox. The temporary free Gmail is removed from
  ScoutIt routing immediately, retained for a 30-day recovery window, then deleted;
- staff access is default-deny and requires authenticator-app MFA on both the
  dedicated Gmail account and Supabase privileged session; SMS-only protection and
  email possession alone never grant authority;
- each staff member privately holds their own offline recovery codes; there is no
  shared central copy. Any recovery-code use requires immediate full regeneration,
  and lost codes require suspension plus identity re-verification;
- approved personal devices may access Mission Control only after explicit device
  enrollment. Unknown/unhealthy devices are blocked. Recognition must use Cloudflare
  device enrollment/posture or an equivalent cryptographic credential, never
  localStorage, cookies alone, or browser fingerprinting;
- each staff account may have at most two persistent recognized devices: one
  computer and one phone. Any additional device requires explicit temporary approval,
  expires after 24 hours, is revoked automatically, and cannot be reused without a
  new approval. Persistent recognized devices require reapproval every 90 days;
- as of 2026-08-09, `scoutit.space` uses GoDaddy authoritative DNS
  (`ns57/ns58.domaincontrol.com`) and has no MX record. Cloudflare DNS/email
  routing is approved as a required pre-human-testing migration, not yet configured;
- security layers follow one rule: enable Cloudflare where it adds a control the
  origin cannot provide or measured abuse proves the need; do not stack it merely
  to claim another layer. Mission Control requires Cloudflare Access. The public
  Vercel site uses native Vercel protection unless evidence triggers proxy escalation;
- storage authority is deliberately split: Airtable holds public listing text/details;
  Supabase holds users, permissions, standard photos/videos, sensitive files, and
  their private metadata; Cloudflare R2 is reserved for super-large Spatial Vault
  objects such as spatial maps, source scans, and heavy 3D packages. R2 activates only
  after the North Star (200 real approved listings), subscriptions are live with real
  paying subscribers, and a qualifying spatial asset creates an actual storage need.
  Spatial Vault masters are normally created by ScoutIt and treated as ScoutIt
  production assets: only authorized staff/services may ingest them, with documented
  source rights and provenance. Direct customer uploads to R2 are disabled by default.
  Airtable may retain stable references or intentionally public media URLs, but never
  private object URLs, signed URLs, storage credentials, or entitlement logic. Gated
  media resolves only after server-side authorization through a provider-neutral
  Supabase asset registry.
  This choice is independent of whether the public Vercel site is proxied;
- the public site has no print/screenshot/recording blockers. Mission Control uses
  capture deterrence and accountability, but the plan must never claim a web page can
  reliably prevent operating-system screenshots or screen recording;
- web-first; no native app for launch optics;
- owner/lister-confirmed prices only; blank or “Price on request” is honest;
- Provider and Operator remain profile/waitlist surfaces until real workflows exist;
- Airtable is public content; Supabase is private user/submission data;
- owner-authored listings publish after attestation, while ScoutIt-produced PDF
  drafts require source verification;
- no mock, estimated, or enhanced information may appear as verified truth;
- feature growth cannot interrupt an earlier launch or trust gate.

---

# LOCKED SECURITY LOGIC - THE THREE SENTINELS

Mission Control is ScoutIt's central control plane, but it is not the only security
boundary. Security is complete only when all three server-enforced sentinels agree.
No browser-visible lock, hidden component, Airtable view, or direct media URL counts
as authorization.

## Sentinel 1 - Mission Control authoring

1. Cloudflare Access/device posture admits the approved staff device.
2. Supabase verifies the named session, `aal2` MFA, active staff role, and scope.
3. Every create/update/verify/publish action is authorized server-side; client role,
   tier, owner ID, property ID, and approval claims are never trusted.
4. Mission Control writes the canonical private draft, units, asset records, and audit
   events to Supabase. It does not write privileged content directly from the browser
   to Airtable or expose Airtable/R2 service credentials.
5. Denial is the default. Every privileged mutation records actor, target, action,
   before/after reference, time, and outcome.

## Sentinel 2 - publication bridge

1. The server reloads the canonical Supabase property and units; it never publishes a
   browser-supplied object as truth.
2. The server checks actor scope, property ownership/authority, required verification
   or owner attestation, lifecycle state, field classification, and sample status.
3. Supabase `property_units` remains authoritative. Airtable receives one property/
   building record with a schema-versioned `Units_JSON` public mirror, even when that
   property has hundreds of units; do not recreate an Airtable row-per-unit table.
4. Airtable receives only publishable text, typed filter fields, deliberately public
   media URLs, and stable asset references. It never receives secrets, private object
   locations, signed URLs, storage credentials, or permission rules.
5. Publication is idempotent and versioned. Record a publish version/hash and outcome,
   read back Airtable's computed canonical slug on first publication, and fail closed
   on partial validation, serialization, or synchronization errors.

## Sentinel 3 - subscriber and public retrieval

1. Anonymous requests receive a strict public projection only.
2. Authenticated requests resolve the current user, role, subscription/tier, property
   relationship, and asset entitlement from Supabase on the server.
3. The server returns only the permitted projection. Restricted values are never sent
   to the browser and blurred, hidden, or disabled there.
4. Airtable is content storage, not the permission authority. If entitlement state is
   unavailable or contradictory, return only the safe public projection.
5. Gated media requests resolve a stable asset ID through Supabase, verify property and
   tier scope, then issue the minimum necessary short-lived access. Never treat knowing
   an object URL or asset ID as permission.
6. Public, entitled, owner-private, and staff-only responses use separate cache policy
   and cache keys. Private responses are never stored in shared/public caches.

## Storage and record contract

- Airtable maximizes each property record: public details, typed discovery fields,
  stable public media references, and the versioned `Units_JSON` mirror.
- Supabase owns users, roles, subscriptions, permissions, canonical unit rows, standard
  photos/videos, sensitive files, provider-neutral asset metadata, and audit history.
- Cloudflare R2 remains post-North-Star storage for ScoutIt-created super-large Spatial
  Vault masters and derivatives only after the three recorded activation gates.
- Storage location never decides visibility. The Supabase asset classification and the
  server retrieval decision do.

---

# LOCKED EXPERIENCE LOGIC — LUXURY WITH PURPOSE

ScoutIt's primary visual language remains spatial intelligence in deep black, warm
gold, cinematic depth, and precise editorial typography. This is a direction, not a
rule that every pixel must be black or gold. Restrained neon and other supporting
colors are welcome when they communicate layer, role, state, data, or atmosphere and
still meet contrast requirements. Do not add color as random decoration.

For any material design decision, use the following combination before implementation:

1. **Taste Skill** — write a one-line Design Read, reject templated AI patterns, and
   set explicit variance/motion/density dials for the page. Use it chiefly for public
   narrative, editorial, and brand surfaces, not as a dashboard component system.
2. **UI/UX Pro Max** — generate or consult the design-system recommendation, then
   validate responsive layout, touch targets, safe areas, theme contrast, loading,
   focus, accessibility, and reduced-motion behavior.
3. **Emil Kowalski design engineering** — decide whether each motion should exist,
   state its purpose and frequency, use responsive easing/duration, and review UI
   changes with a Before/After/Why table.

These skills are review lenses, not authorities that can overwrite ScoutIt's existing
tokens, architecture, accessibility, or product truth. Never copy a suggested palette,
font, liquid-glass effect, or animation blindly. Avoid generic AI-purple gradients,
three equal feature cards, gratuitous glass panels, cartoonish or contextless motion,
broad gold body text, and identical rounded containers on every section. Decorative
animation is encouraged when it adds spatial depth, atmosphere, material character,
or recognizable ScoutIt identity even when it is not required to complete a task.
Luxury comes from composition, material restraint, typography, lighting, exact
interaction feedback, and details that remain coherent across the whole journey.

The newly created universal header is the current visual north star for ScoutIt's
**space and spatial-commerce** identity: futuristic, precise, architectural, and
alive. Its separated left/right navigation clusters should read like refined robotic
optics around a central intelligence rail, joined by thin glowing gold filaments and
controlled signal movement. Extend that design language selectively; do not turn the
whole product into a cartoon spaceship, noisy cyberpunk HUD, or gaming interface.

## Canonical UX Principle: Humanization Without Flattening
Canonical spec: `[[03_DESIGN/SCOUTIT_UX_DIRECTION|SCOUTIT_UX_DIRECTION]]`.
1. **Simple at first contact. Deep on demand.** Do not reduce intelligence — reduce the effort required to find and understand the right intelligence.
2. **Translation, not replacement.** ScoutIt's branded vocabulary (*The Vault*, *Universe*, *Orbit*, *The Board*, *Where To?*, *Your Move*) remains intact, paired with immediate human-language explanations (e.g. `THE VAULT` / *Floor plans, scans & spatial records*).
3. **Tool-based, non-linear property experience.** Users choose the intelligence relevant to them; do not consolidate into a generic single-column long scroll.
4. **Symbiotic Discover & Intelligence.** Search and Intelligence are twin modes of one unified discovery layer.
5. **No dead ends.** Every empty state becomes a doorway to related spaces or intelligence.
6. **Progressive intent in Your Move.** Intent is recognized gradually (Inspired Me $\rightarrow$ Potential Fit $\rightarrow$ Interested $\rightarrow$ Connect) rather than aggressively pushing salesperson forms up front.

---

# PHASE 1 — GET READY FOR HUMAN TESTING

The first deliverable is a stable human-testing build on live `scoutit.space`.
Deployment, explicit sample-data labelling, authentication safety, and
critical-flow verification serve this goal. Do not remove mock or sample data
in this phase.

## 1.0 Close the 2026-08-09 re-audit blockers

Canonical evidence: [[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]].
Do not split repeated desktop/mobile symptoms into separate backlog items.


- [ ] After the owner confirms the production Cloudflare hostname/key pair,
      Supabase CAPTCHA setting, and Vercel environment, deploy and verify a real
      valid token on onboarding, waitlist, and property inquiry; engineering tests
      already cover absent, expired/replayed, invalid, and configuration-failure paths
- [ ] After the owner confirms `CRON_SECRET` and deploys, verify Vercel Cron Jobs
      history records successful production runs for both configured routes;
      fail-closed authorization and scheduled-run tests are already complete
- [ ] ~~After owner review, apply the prepared telemetry migration~~ — **SUPERSEDED
      2026-08-13. Do not do this.** The telemetry storage fix already shipped in
      `20260812000001` (applied to production 2026-08-12): count-preserving pageview
      dedupe, the total `(masked_ip, route_accessed)` uniqueness invariant, and the
      atomic counter RPC `record_security_event` are all live and verified.
      **`20260809000001_security_telemetry_retention.sql` must NOT be applied** — it
      recreates the *partial* index that `20260812000001` deliberately replaced with a
      total one, and would regress the storage-exhaustion fix. See §1.0C below for the
      only telemetry work still open, and
      [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].
- [x] **`IP_SALT` is set in production — confirmed 2026-08-16** by reading the
      Vercel environment-variable list directly (present, Production scope,
      added Jul 23). The schema/length allowlists, server-derived identity,
      redaction, safe errors, centralized rate coverage, and abuse tests were
      already complete, so this closes the item entirely.

      `GEMINI_API_KEY` is also present (Production and Preview), which retires a
      separate long-standing owner to-do recorded elsewhere as unset.

      Both had been set for weeks. Neither was re-checked because the items said
      only that someone should confirm, never how — the same pattern corrected in
      the 2026-08-16 addendum. The full variable inventory read that day was:
      `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `CALENDAR_TOKEN_KEY`,
      `CRON_SECRET`, `GEMINI_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID`,
      `GOOGLE_OAUTH_CLIENT_SECRET`, `IP_SALT`, `MAPBOX_SERVER_TOKEN`,
      `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`,
      `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SITE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`,
      `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY`,
      `UPSTASH_REDIS_REST_TOKEN`, `UPSTASH_REDIS_REST_URL`,
      `WISHLIST_SHARE_SECRET`. **`EMAIL_FROM` is absent** — see
      [[MASTER_OWNER_ACTIONS]] item 3 for why that matters now that Resend has a
      key but no verified domain.

- [ ] After the owner audits live Airtable media fields and reconciles Airtable-public
      listings whose Supabase lifecycle/roster record is missing or non-public, deploy
      and rerun the property-trust browser check against production; provider-specific
      classification, placeholder denial, honest unavailable/roster states, and local
      live-backed browser coverage are already complete
- [x] Automated critical/serious accessibility remediation is complete: the stable
      production crawl covers 88 desktop and 88 mobile routes with zero critical,
      zero serious, and zero navigation errors; the deterministic shared regression
      gate passes 38/38 across names, controls, scroll focus, inline links, landmarks,
      headings, and contrast. Real-device 200% zoom and assistive-technology journeys
      remain in `OWNER_ONLY_ACTIONS.md` as the human gate.
- [x] Reconciled the original 19 Playwright failures into product fixes and stale
      contracts. The expanded production-mode desktop/mobile matrix passes 362/362
      twice consecutively without unexpected browser console or page errors.
- [x] Restored and verified the universal header's documented glass/luxury contract;
      automatic rotation, manual controls, focus, reduced motion, and containment pass.

- [x] Patched the five main-app runtime advisories without a blind bulk upgrade:
      DOMPurify 3.4.13, fast-uri 3.1.5, NanoID 3.3.18, Next 16.3.0, and
      Sharp 0.35.3. Replaced the hanging `html2pdf.js` DOM raster path with a
      deterministic jsPDF tear-sheet, fixed its pointer stacking contract, and
      added real PDF-signature plus Sharp image-optimizer browser checks. Full
      audit is 0, build is 113/113, unit is 882/882, lint is clean, focused
      export/URI tests are 51/51, and the production desktop/mobile suite is
      365 passed with one intentional mobile skip for the desktop-only export.
- [x] Patched Mission Control independently without a Next major upgrade: Next
      15.5.23, PostCSS 8.5.26, NanoID 3.3.18, Sharp 0.35.3,
      brace-expansion 1.1.18, and js-yaml 4.3.1. Production and full audits are
      0; lint is clean; all 10 authorization/image/slug boundary tests pass; and
      the production build generates 26/26 pages. Deployment remains owner-only.

## 1.0A Close the GitHub repository security gate

Canonical evidence: `12_GITHUB_SECURITY_AUDIT_2026-08-11.md`. The 2026-08-11
inspection was read-only; no GitHub alert, pull request, rule, setting, secret, or
workflow was mutated. Treat GitHub's refreshed default-branch evidence—not a local
scan alone—as the closure authority.

**Closed live - 2026-08-13, 21:23 SGT.** PR #49 merged as `0bdba6a`. The
default-branch CI and CodeQL runs pass, Vercel reports the production deployment
complete, and GitHub now reports **0 Dependabot, 0 CodeQL, and 0 open secret-
scanning alerts**. The one historical secret alert was resolved as
`used_in_tests` only after its immutable commit location was verified as a
synthetic Stripe-format example in a third-party Clerk-testing skill; that
vendored `.agents` tree is no longer tracked. No dependency or code-scanning
finding was manually dismissed.

- [x] Land the already-targeted root and Mission Control dependency remediation only
      after the complete release gate passes. Local re-verification on 2026-08-13:
      both lockfiles audit at zero; the main app lint, 1,057-unit-test suite, and
      113-route production build pass. The final 460-case browser matrix completed
      with 457 passed, 2 intentional skips, and one mobile Orbit contrast failure:
      the empty-state text used hard-coded `#666` at 3.38:1. It now uses the
      shared secondary-text token; focused lint and the exact mobile axe regression
      pass, so every non-skipped browser case has passing evidence without repeating
      the whole matrix. Mission Control lint, both dependency audits, all 42
      security-boundary tests, and its 27-route production build pass. The local
      release gate is complete. GitHub `main` reports
      **13 open Dependabot alerts (8 high, 5 medium)**
      as of the live 2026-08-13 read — down from the 25 recorded on 2026-08-11.
      **Only 4 of the 13 are runtime scope** (`fast-uri`, `nanoid`, `sharp`,
      `dompurify`); the other 9 are development-scope and not visitor-reachable.
      All 5 `undici` alerts collapse into one bump to `7.29.0`. ⚠️ The `dompurify`
      bump must be checked against `lib/sanitize.js` first — see
      [[REMEDIATION_RECORD_2026-08-13]] §Dependency remediation. Confirm the dependency graph refreshes and alerts
      close before closing or superseding the related Dependabot PRs
- [x] Resolve all **13** previously open CodeQL findings (live 2026-08-13; down
      from 19, then 18) by
      source-specific remediation or an
      evidence-backed false-positive decision. Workstreams are legacy
      `scoutit_user` localStorage flows, persisted visitor coordinates, regex HTML
      sanitization, email text extraction, Airtable formula escaping, the unit-preview
      DOM trace, test-regex escaping, stale tracked scratch copies, and workflow token
      permissions. Do not mass-dismiss alerts
- [x] Remove persistent visitor latitude/longitude from the ambient-header browser
      cache. Property pages use property-location weather/air/time; non-property
      pages work without requesting geolocation. Property coordinates remain
      in-memory only for condition requests; cached identity/readings omit coordinates,
      and legacy location cache is cleared. Focused ambient tests pass 19/19; keep the
      parent CodeQL item open until the reviewed source reaches `main` and GitHub rescans
- [x] Retire `scoutit_user` as a clear-text browser profile/session cache. Use the
      verified Supabase session and minimum server-approved display state; keep the
      isolated development fixture incapable of activating on a production hostname
- [x] Replace regex-only HTML security boundaries with context-appropriate escaping or
      a reviewed sanitizer/parser, escape Airtable formula backslashes before quotes,
      and prove all downstream rendering/sink contexts with focused adversarial tests.
      The Airtable formula subtask is complete locally: backslashes are escaped before
      apostrophes, adversarial tests pass 3/3, and the full Mission Control security
      suite passes 42/42. Plain-text field and email conversion now uses a deterministic
      tokenizer that never emits tag delimiters, rejects prototype-polluting keys, and
      passes 18/18 focused tests. The Unit Details alert points to its relative Preview
      link; dynamic property/unit segments are now encoded by a focused route builder
      with 2/2 passing tests. Keep the parent finding open until CodeQL confirms closure
- [x] Review tracked `scratch/jules_session_3` for unique required content, migrate any
      real value, then remove it from production scanning and source ownership. Re-run
      CodeQL before resolving its four duplicate alerts.
      **Mechanical cause found 2026-08-13:** `scratch/` **is** in `.gitignore`
      (line 67), but **29 files under it are already tracked**, and `.gitignore`
      does not untrack files git already follows. The fix is `git rm --cached`,
      not another ignore rule. This closes 4 CodeQL alerts and unpublishes 29 dead
      files from a **public** repository in one move
- [x] **Verify before dismissing** the 2 `actions/missing-workflow-permissions`
      alerts (`ci.yml:20`, `update-spatial-data.yml:11`). Both files now carry
      top-level `permissions` blocks (lines 13 and 9), and the alerts were last
      updated 2026-07-23/25, so they are **probably** stale or job-level gaps —
      but that must be confirmed by a fresh scan, not assumed
- [x] Remove the ecosystem-directory test's dynamic URL regular expression. The test
      now checks the parsed pathname directly; lint passes and Playwright lists all
      10 expected desktop/mobile cases
- [x] Replace the scanner-shaped webhook test literal without recording it. The local
      source now constructs a test-only value without a credential-shaped literal.
      Ask the owner to resolve secret alert 1 only after the source change reaches
      `main` and its synthetic-test classification is verified
- [x] Harden all workflows locally with explicit minimum `permissions`, full-length
      immutable action SHAs verified against upstream repositories, concurrency/
      timeouts, and no pull-request secret exposure. Give the transit updater only
      the exact write scope its reviewed commit path requires. All pinned upstream
      commits were signature-verified through GitHub; YAML parsing and the no-movable-
      tags check pass. Live policy enforcement remains owner-gated and GitHub evidence
      remains open until push
- [x] Extend Dependabot coverage to `/mission-control` and GitHub Actions; add a
      dependency-review check for pull requests; run root and Mission Control audit,
      lint, test, and build gates in CI before dependency changes can merge. Both local
      package graphs report zero vulnerabilities; the existing CI retains lint, unit,
      and build gates, and dependency review blocks moderate-or-higher introductions
- [ ] Add a public `SECURITY.md` reporting policy and a narrow `CODEOWNERS` map for
      workflows, lockfiles, auth/security boundaries, Mission Control, migrations,
      and deployment configuration. `CODEOWNERS` is prepared locally; `SECURITY.md`
      remains blocked until the owner enables private vulnerability reporting or
      supplies another verified private contact channel
- [ ] Prepare an owner-reviewed `main` ruleset proposal with no accidental sole-owner
      lockout: block force pushes/deletions, require pull requests and the verified CI/
      security checks, require conversation resolution, define an auditable emergency
      bypass, and stage commit-signing enforcement only after signing compatibility is
      proven. Do not activate repository settings without explicit owner approval
- [ ] Reconcile 37 open pull requests individually. Close superseded/dirty automation
      branches only after checking for unique changes; never bulk-merge stale security
      PRs into the current architecture
- [ ] Reconcile the six Vercel-created GitHub environments and the duplicate
      `scout-it`/`scoutit` integrations with the live project map. Do not delete or
      disconnect either name until the owner verifies which integration serves production
- [ ] Re-run the authenticated GitHub audit after remediation and record: active
      ruleset, branch coverage, workflow policy, signed-commit decision, alert counts,
      secret resolution, environment map, open-PR count, and latest required checks

## 1.0B Critical Logic & Security Flaws (2026-08-12 Audit)

The following immediate security and logic flaws were identified during the 2026-08-12 audit. They present critical risks of data sabotage, unmoderated publishing, and service degradation. They must be addressed prior to enabling human testing.

**Status 2026-08-12: all ten findings remediated AND the database half is APPLIED
to production** (`yyixsuaimdzyiocswcgc`), verified live. Application-layer fixes
(decline authorization, intel publish RBAC, telemetry metering, geocode cache cap)
are in code and ship with the next deploy.

**Four further bugs were found while fixing these ten**, none of which were in the
audit:

1. The handshake credited `user_profiles.scout_rating` — **a column that does not
   exist**. It would have raised the first time any handshake completed. The real
   column is `broker_profiles.scout_rating`, `numeric(3,2)`, a 0–5 rating that
   overflows at 10.00, so incrementing it per closed deal was never right either.
2. `properties` UPDATE had **no `WITH CHECK`**, so an owner could reassign
   `owner_id` and hand away or take over a listing.
3. The moderation trigger was first written `SECURITY DEFINER`, under which
   `current_user` is the function owner — the privilege check would have passed for
   everyone and the guard would have been decorative.
4. **The repo's migration files do not describe the live database.** Several were
   never applied. Written against the files, this migration would have failed — or,
   for the property SELECT policy, silently added a permissive policy beside the one
   it meant to replace and reported success. See
   [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].
   **Do not bulk-apply the unapplied migrations to catch up** — `20260809000001`
   would regress the telemetry fix. Owner decisions: [[MASTER_OWNER_ACTIONS]] §1.12.

Remaining owner steps: [[MASTER_OWNER_ACTIONS]] §1.10 (post-apply re-tests and the
Scout Rating formula decision), §1.11 (telemetry rate posture), §1.12 (migration
drift), §1.13 (pre-existing Supabase advisor findings).

Full implementation record, including live before/after measurements and what was
deliberately not verified:
[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]].

Canonical remediation artefacts:

- `supabase/migrations/20260812000001_critical_logic_and_security_fixes.sql`
- `src/app/api/deals/handshake/route.js`, `src/app/api/intel/ingest/route.js`,
  `src/app/api/telemetry/device/route.js`
- `src/lib/boundedCache.js`, `src/lib/rateLimit.js`, `src/lib/cmsCache.js`
- `src/lib/__tests__/criticalSecurityFixes1_0B.test.js` (11/11),
  `src/lib/__tests__/deviceTelemetryApi.test.js` (16/16)

- [x] **Fixed Transaction Handshake Forgery:** `complete_transaction_handshake` no
      longer writes `party_a_signed_at = now()` on the creating `INSERT`; both
      signature columns start `NULL` and only the owning party can fill one. A caller
      who is not a party is rejected (`42501`) instead of silently succeeding, and the
      Scout Rating increment is guarded by `rating_incremented` so it can fire at most
      once per handshake. **Requires the migration to be applied.**
- [x] **Fixed Global Deal Handshake Sabotage (IDOR):** the `decline` action now reads
      the deal first and returns 403 unless the caller is its buyer or broker; a
      non-existent deal returns the identical 403 so the endpoint cannot enumerate
      deal IDs. The update is additionally scoped to `status = 'pending'`. A matching
      `decline_deal_handshake` RPC gives the database the same guarantee for any
      future caller. Adversarial tests assert no write is attempted on denial.
- [x] **Fixed Storage Exhaustion via Telemetry:** three layers, none sufficient alone.
      (1) The existing Upstash limiter in `src/proxy.js` — which fails **open** for
      this route, which is why it was not enough. (2) A new per-instance limiter
      (120/min, metered on the platform client IP, *not* the User-Agent-derived
      identity a caller can churn) that returns 429 with `Retry-After` **before** any
      parse or database call. (3) The structural fix: `FRICTION:` and `SEARCH:` rows
      were excluded from the pageview uniqueness invariant, which is what made growth
      unbounded. They are now upserted through `record_security_event` on a total
      `(masked_ip, route_accessed)` unique index, so a flood increments counters over
      a bounded key space instead of adding rows. The pre-migration insert path is
      retained as a fallback. **Full closure requires the migration.**
- [x] **Added Unique Constraint to `saved_intel`:** existing duplicates are collapsed
      (earliest row wins) and `uq_saved_intel_user_property` is created. The
      read-then-insert idempotence in `/api/wishlist/merge` is a race, not a
      constraint; the invariant now lives in the schema. **Requires the migration.**
- [x] **Prevented Property Self-Approval:** RLS cannot express per-column `WITH CHECK`,
      so `enforce_property_moderation_authority()` freezes `pipeline_status` and
      `lifecycle_state` against any non-service-role session, and forces a
      client-created property back to `pending`/`draft` if it arrives pre-approved.
      Only the Mission Control server may move a property through review.
      **Requires the migration** — and owner re-test of the publish path (§1.10).
- [x] **Fixed Unrestricted Intel Ingestion:** ingest stays open to authenticated users,
      but `publish=true` now runs through `requireAdmin` from `src/lib/adminGuard.js`
      (the one admin gate, checking both `role` and `active_roles`). A non-staff caller
      gets 403 and the article is never written with `Approved_For_Live_Site`.
- [x] **Patched Deal Hijacking — by inverting the requested fix.** The audit asked
      for a `WITH CHECK` on the `deals` UPDATE policy. The live database has **no
      UPDATE policy on `public.deals` at all**, and RLS is enabled — which is
      deny-all, already stronger than the requested fix. Creating that policy would
      have **granted** client update rights that do not exist today, so it was
      deliberately **not** created; `deals` UPDATE remains deny-all (verified after
      apply). What shipped instead is the durable half: the
      `enforce_deal_party_immutability` trigger makes `buyer_id`, `broker_id`, and
      `property_id` immutable and blocks a party from closing a deal unilaterally, so
      the hole is already shut if an UPDATE policy is ever added. Applied 2026-08-12.
      *(An earlier revision of this bullet claimed the policy "gained a `WITH CHECK`";
      that described the rejected fix and was corrected 2026-08-13.)*
- [x] **Capped the `geocodeCache`:** replaced with `BoundedCache` (LRU, 2,000 entries)
      from the new dependency-free `src/lib/boundedCache.js`. `location` is free text,
      so the old `Map` grew per novel string *and* burned one Mapbox call per novel
      key — a rate-limit exhaustion path, not merely a memory leak. Tests cover the
      hard cap under 5,000 novel keys, true LRU eviction, and the `null`-value case
      (cached "Mapbox knows nothing"), which a naive cap would have turned back into
      a per-request Mapbox call.
- [x] **Reconciled RLS Read Policies:** the public properties SELECT policy now uses
      `lifecycle_state = 'live'`. **Requires the migration**; owner should spot-check
      that no genuinely live listing depended on the old `pipeline_status` condition.
- [x] **Enforced `property_id` Type:** `property_claims.property_id` converts TEXT →
      `UUID REFERENCES public.properties(id) ON DELETE CASCADE`, with the partial
      unique index dropped and recreated around the conversion. Guarded: the migration
      raises rather than converting if any existing value is not a resolvable
      property. **Requires the migration.**

## 1.0C Telemetry retention — COMPRESS, do not delete (owner decision 2026-08-13)

**Owner decision:** the visitor-traffic log is a **metrics asset**. Old rows must be
**compressed into aggregates, not deleted.** This overrides the 30-day hard-delete
design carried in the retired `20260809000001` migration.

**Consequence — `clean_old_security_logs()` must NOT be scheduled as it stands.**
That function already exists in the live database and is a straight
`DELETE ... WHERE last_request_at < now() - interval '30 days'`. Scheduling it would
destroy exactly the history the owner wants to keep. It is currently harmless only
because nothing calls it.

**Live state, measured 2026-08-13 (read-only):**

| Fact | Value |
|---|---|
| `security_access_logs` rows | 1,414 |
| Oldest / newest activity | 2026-07-23 / 2026-08-12 |
| Rows already past 30 days | **0** |
| Rows flagged suspicious | 10 |
| Distinct routes tracked | 126 |
| `clean_old_security_logs()` exists | yes |
| `pg_cron` installed | **no** |

Nothing is overdue. The first rows cross 30 days around **2026-08-22**, so this is a
dated to-do, not an incident. Growth is already bounded because `20260812000001`
converted these rows from one-per-request into counters.

- [ ] Design the compaction rule: roll detail rows older than 30 days into a periodic
      aggregate (route, period, total requests, distinct masked identities) and drop
      only the detail rows the aggregate now represents. Sum of `request_count` must be
      preserved across the operation — the same invariant `20260812000001` honored when
      it collapsed 145 duplicates while preserving all 4,205 observations
- [ ] **Exempt flagged rows.** `is_flagged` rows are the record that someone probed the
      site; they must survive compaction at full detail, or the abuse history is lost
      exactly when it becomes useful
- [ ] Choose the scheduler. Two routes, no wrong answer:
      (a) install `pg_cron` and schedule in-database, or (b) call a compaction endpoint
      from a **Vercel cron**, which needs no database extension and matches the cron
      jobs this repo already runs. (b) is the lower-change option
- [ ] Decide the aggregate's own retention — aggregates are small and privacy-safe, so
      "keep indefinitely" is a legitimate answer and should be recorded either way
- [ ] Confirm the privacy position: the log stores a one-way-scrambled identity and a
      route *shape* (`/property/:item`), never the specific listing, so compaction is a
      privacy improvement, not a regression. Record this in the retention rules under §3.4

## 1.0D Recovered from the backlog merge (2026-08-13)

These were live, open items in `BACKLOG/01_WORK_ORDER.md` and `LOGIC_TO_TIGHTEN.md`
that **this plan never carried.** They were found by diffing the two lists during
the 2026-08-13 folder reorganisation, not by re-auditing the code. Both source
files are now in `_ARCHIVE/`, so these are the surviving copy — **do not assume a
second home exists.**

### Real defects

- [x] Closed category precedence defect (2026-08-14): removed obsolete unused `MOCK_CATEGORIES` maps and dead scaffolding across `src/app/property/DirectoryClient.js` and `src/app/intel/page.js`; normalized Airtable `spaceCategory` is authoritative; missing category preserved honestly (not coerced to "Residential") and guarded by `src/lib/__tests__/categoryAuthority.test.js`.
<!-- BEGIN:HISTORICAL_CATEGORY_PRECEDENCE_DEFECT
- [ ] 🔴 **`MOCK_CATEGORIES` silently overrides the real category.** Duplicated in
      `src/app/intel/page.js` and `src/app/property/page.js`, evaluated as
      `MOCK_CATEGORIES[p.slug] || p.spaceCategory` — **the hardcoded map wins over
      the live Airtable field**, so a category corrected in Airtable is ignored for
      those slugs. Invert the precedence and share one map
END:HISTORICAL_CATEGORY_PRECEDENCE_DEFECT -->
- [x] Closed the raw-style resource hazard: the focused source scan now finds zero bare `<style>{...}</style>` blocks.
<!-- BEGIN:HISTORICAL_RAW_STYLE_DEFECT
- [ ] 🔴 **15 files still render a bare `<style>{…}</style>`** (was 17; count
      re-verified 2026-08-13). React 19 hoists a raw `<style>` into `<head>` as a
      stylesheet *resource*; without `precedence` it leaves an enclosing
      `<Suspense>` boundary **pending forever**. This exact bug froze `/discover`
      and `/property` — HTTP 200, clean console, page never arrives. Harmless today
      only because none of the 15 currently sits beside a Suspense boundary; adding
      one reproduces the freeze. Sweep them to `<style jsx>`
END:HISTORICAL_RAW_STYLE_DEFECT -->
- [x] Closed silent typo-account creation (tightened 2026-08-21): onboarding now has explicit Sign in and Create account modes. A failed sign-in never calls signup; new account creation requires deliberate mode selection, and unconfirmed email is handled separately.
<!-- BEGIN:HISTORICAL_SIGNIN_SIGNUP_DEFECT
- [ ] 🟠 **Sign-in-then-sign-up creates an account on a typo** (L3).
      `src/app/onboarding/page.js` calls `signInWithPassword` and falls through to
      `signUp` on **any** failure. A typo'd email silently creates a new account;
      the user sees an empty dashboard and assumes their listings vanished. A wrong
      *password* attempts a signup and returns "already registered". **Fix: only
      fall through when the error is specifically "user not found."**
END:HISTORICAL_SIGNIN_SIGNUP_DEFECT -->
- [ ] 🟡 **`connect_balances` / `connect_transactions` role scope and authority unification.**
      Correction 3 ready for review (2026-08-14): 3-store union reconciliation without MAX masking across differing role rows, hold enforcement across spend/refund/admin RPCs, orphan refund prevention (WALLET_NOT_FOUND/404), typed grant rollover handling, runtime schema capability gate, dedicated reviewable non-auto-run rollback artifact, client fail-closed role normalization across all public methods, and 100% passing test suite (1109/1109). Live application remains owner-gated.

### Decisions that block other work (owner)

- [x] 🔴 **L1 closed 2026-08-21 — `pipeline_status` is the Supabase listing-live authority.**
      `normalizeLifecycleState()` now reads `pipeline_status` first, unknown values
      fail closed to draft, and `lifecycle_state` is a compatibility mirror only
      when a legacy row has no pipeline value. Off-market reads filter
      `pipeline_status='off_market'`; publish, withdrawal, removal, contact, and
      title-lock decisions share the same normalizer. Airtable approval remains
      the public CMS mirror required by the dual-CMS contract, not a competing
      Supabase authority. Guarded by `propertyLifecycle.test.js`.
- [ ] 🟠 **L5 — a blocked FAQ answer has no appeal path**
- [ ] 🔵 **L12 — lead export moves PII with no record.** Ties to §3.4's
      "log exports of lead PII with actor, subject, time, purpose"
- [ ] 🔵 **L13 — the Google Meet link depends on the HOST having Google.** Measure
      NULL-link frequency before designing a guest-host fallback (§3.5 has the
      measurement item; this is the decision behind it)
- [ ] 🟡 **L6 — nothing consumes `rankModifier`.** Either wire it into ranking or
      retire the field; a scoring input nothing reads is a promise in the schema

### Smaller, still open

- [x] **Google Calendar OAuth redirect URI contract audited (2026-08-14).** Confirmed canonical callback route is `/api/oauth/google/callback` (not `/api/calendar/callback`); `src/lib/calendar/googleOAuth.js` uses `siteUrl()` for both consent generation and token exchange; guarded by `src/lib/__tests__/googleOAuthRedirect.test.js`. Live Google Cloud Console authorization remains owner-gated in [[MASTER_OWNER_ACTIONS]] §1.8.
<!-- BEGIN:HISTORICAL_GOOGLE_OAUTH_REDIRECT_AUDIT
- [ ] **Google Calendar OAuth `redirect_uri_mismatch`.** Audit `/api/calendar/sync`
      and `/api/calendar/callback` to confirm the callback uses `getSiteUrl()`
      dynamically. Pairs with the owner's Google Cloud Console step (Owner Actions §1.8)
END:HISTORICAL_GOOGLE_OAUTH_REDIRECT_AUDIT -->
- [x] **Closed scoped inline-color migration 2026-08-21.** The focused raw-hex
      scan now measures zero across `CommercialFlow.js`, `ResidentialFlow.js`,
      `SpatialCommandMap.js`, and `UnitMasterPage.js`. DOM styles use semantic CSS
      variables; MapLibre paint values resolve the same tokens to concrete runtime
      colours before layer creation.
- [x] **Master Flow state paths reconciled 2026-08-21.** Inquiry and viewing
      mutations now enforce the shared runtime registry. The staff-only visual graph
      contains 11 runtime state nodes and all 13 enforced transition edges
      (`visualEdgeMappings: 13`), separately from nine planned offer and negotiation
      transitions. Unbuilt structured offers, no-show handling, persisted rescheduling,
      and owner-to-inbox navigation are labelled partial/not started. Per-item node and
      edge evidence validation reports zero stale repository artifacts; executable
      guides no longer instruct users to open a nonexistent offer form. Mock and sample
      property data remains preserved for human testing.
- [x] **SCANNED 2026-08-20 — 10 public routes, both themes, WCAG contrast at
      390px.** The headline result is worth stating plainly:

      **Dark mode is clean.** One failure site-wide (`title-tagline-2`, an 11px
      decorative tagline at 55% gold, 3.62:1). The product's default theme is in
      good shape.

      **Light mode is broken on every page tested**, and it was far worse than
      "only `/` and `/settings` were measured" implied:

      | Route | Light-mode failures |
      |---|---|
      | `/contact` | **11** (17 when scoped to the page) |
      | `/property/[id]` | 9 |
      | `/` · `/pricing` | 4 each |
      | `/brokers` | 3 |
      | `/discover` · `/property` · `/intel` | 2 each |
      | `/hubs/[slug]` · `/about` | 1 each |

      ⚠️ **The scanner lied twice before it told the truth, and both lessons
      generalise.**

      *First:* it required a background with alpha > 0.92 before treating an
      ancestor as the ground, so it walked straight past a 0.86-alpha dark bar
      and compared white text to the light page behind it — reporting `/intel`'s
      article title as 1.1:1 and invisible. Composited properly it is ~13:1 and
      perfectly legible. **A contrast checker must composite every translucent
      layer from the page ground up, not hunt for one "opaque enough" ancestor.**

      *Second:* the freeze CSS must be injected **before** the theme is toggled,
      not after. This file already warned that transitions produce phantom
      failures; the ordering is the half that was missing.

- [x] **Fixed: `/contact` was unreadable in light mode.** `.contact-page` sets
      `background: var(--bg-root, #0d0d0d)` — a hardcoded dark ground — but was
      never registered in the dark-island selector list in `globals.css`, so in
      light mode it kept dark ground while the ink tokens flipped to near-black.
      The `Talk to a person.` heading measured **1.03:1**.

      This is the 2026-08-07 regression arriving from the opposite direction:
      that one was an island with dark ink and no dark ground; this was dark
      ground and no dark ink. **Either half alone is broken.** Added
      `body.light-mode .contact-page` to the list. Verified by applying the real
      rule to the live page: **17 failures → 0**, title `rgb(17,17,19)` →
      `rgb(255,255,255)`.

      🔒 **Standing rule earned here: a surface that hardcodes a dark background
      must be added to that selector list in the same change.** The list has now
      failed twice.

- [x] **Fixed: the ambient rail failed on every page that renders a header —
      which is every page.** `.ambient-rail` is `rgba(6,6,6,.45)`, dark *glass*
      rather than a dark surface. Over light mode's near-white page it
      composites to about `rgb(137,137,137)`, and light mode's amber `#9a6200`
      is chosen for near-white, not mid-grey. The clock and temperature measured
      **1.46:1** on `/`, `/discover`, `/property`, `/brokers`, `/intel`,
      `/about`, `/hubs/*` and `/pricing`.

      Fixed by giving the rail a light ground under `body.light-mode` rather
      than making it a dark island — the rail is meant to sit *in* the header,
      not punch a hole through it. Verified across five routes: **1.46 → 4.88:1**
      everywhere.

      🔒 **The trap: a translucent dark layer looks like a dark surface in the
      file and becomes whatever is behind it.** It cannot be reasoned about from
      the stylesheet alone; it has to be composited.

      ⚠️ Cost a build break on the way in — backticks inside a styled-jsx CSS
      comment end the template literal. The session handoff lists this as having
      broken the build four times already. Caught by lint before commit.

> ✅ **Both fixes MERGED as `a445b4a` ([PR #65](https://github.com/EdgerzXc/ScoutIt/pull/65))
> and re-measured on production.** Post-merge CI green. The re-scan is the proof,
> not the deploy log:
>
> | Route | Light before → after | Dark before → after |
> |---|---|---|
> | `/contact` | **11 → 0** | 0 → 0 |
> | `/hubs/bgc-taguig` · `/about` | 1 → **0** | 0 → 0 |
> | `/discover` · `/property` · `/intel` | 2 → 1 | 0 → 0 |
> | `/brokers` | 3 → 2 | 0 → 0 |
> | `/pricing` | 4 → 3 | 0 → 0 |
> | `/property/[id]` | 9 → 8 | 0 → 0 |
> | `/` | 4 → 4 | 1 → 1 |
>
> Every page that renders a header dropped exactly one failure — the ambient
> rail — which is the signature of a site-wide fix landing. `/` stayed at 4
> because its failures are the Orbit card and the tagline, not the rail.
> **Dark mode is byte-for-byte unchanged**, which is the regression that
> mattered most.

- [ ] **Light mode remains broken elsewhere — NOT fixed, listed honestly.**
      Remaining known failures, worst first: `/pricing` page title white on
      near-white (**1.1:1**, invisible); `/brokers` `general-tier-badge-label`
      white on light (**1.14:1**); `/property/[id]` gold-on-near-white across
      `faq-legend__item`, `cp-eyebrow` and the aesthetic tag (1.68–1.81:1); the
      homepage Orbit card (1.22–1.55:1).

      These share one cause with the two fixed above — **surfaces that assume a
      dark ground** — but each needs its own decision about whether the surface
      should become light or become a declared dark island. Not mechanical.

- [ ] **Decide whether light mode ships for the pilot at all.** It is a
      user-facing toggle today. On this evidence it is not finished, and the
      honest options are to finish it or to hide the toggle until it is. Shipping
      a theme that makes the contact page unreadable is worse than not offering
      one.
- [ ] **The hero wordmark is still white-on-white** in light mode. Unsolved
- [x] **Indexability gate built and tested 2026-08-20 — the prerequisite is now
      done.** `src/app/profile/[username]/layout.js` emits an explicit robots
      directive in every branch, as an allowlist: index only when the profile
      resolves in `public_profiles` **and** is not an example account **and** is
      not a pilot identity. Everything else, including a username that resolves
      to nothing, is `noindex, follow`.

      **The bug this closed is the one Standing Rule 6 describes.** An unresolved
      username previously returned metadata with **no robots key at all**, and
      absent means indexable. Guarded by
      `src/lib/__tests__/publicProfileIndexability.test.js` — 7 tests, and the
      guard was **watched going red** by re-introducing the missing directive
      (2 failures) before being restored, per Standing Rule 19.

      ⚠️ Two process notes worth more than the fix. First, three of those tests
      initially passed *for the wrong reason*: when the profile query returns
      nothing the layout returns early and never calls the second query, so its
      queued `mockResolvedValueOnce` survived into the next test as that test's
      profile row. `vi.clearAllMocks()` does not drain a queue — `mockReset()`
      does. Only the positive-path test could not pass accidentally, and it is
      what exposed it. **A suite of denial tests needs at least one test that
      fails if everything denies.** Second, "verified" in the owner's ruling is
      still ambiguous and was deliberately not guessed: `prc_verified` is
      broker-only, so requiring it would exclude every photographer and
      researcher. Current reading is *real + explicitly public*. Confirm.

- [ ] **KEEP `Disallow: /profile/` FOR NOW — decided 2026-08-20 on evidence, and
      this reverses the previous instruction to "pick one canonical URL" as the
      immediate action.** The contradiction is real (four directories link to a
      robots-blocked destination) but it currently costs nothing, because there
      is nothing behind it worth indexing:

      | Measured on the live database | |
      |---|---|
      | Rows in `public_profiles` | **12** |
      | Example/demo accounts | **12** |
      | Real public profiles | **0** |

      Unblocking the crawl today would send Google to 12 demo pages that all
      correctly answer `noindex` — spending crawl budget to read a refusal. That
      is precisely the mistake `src/app/sitemap.js` already carries a comment
      about after the `/hubs` soft-404 incident: **never advertise a URL you do
      not want fetched.**

      **The trigger, not a date:** remove the disallow when the first real,
      explicitly public profile exists. The gate above is what makes that removal
      safe, so the order is now correct rather than merely pending.

- [ ] **The competing role-slug routes still exist and are still unreachable.**
      `/brokers/[broker-slug]`, `/photographers/[photographer-slug]`,
      `/researchers/[researcher-slug]` and `/event-planners/[planner-slug]` are
      all present in the app tree while every directory links to
      `/profile/[username]`. Decide per the approved canonical: redirect them, or
      delete them. Not urgent while `/profile/` is blocked, but it is dead
      surface that will rot

## 1.0H Sharing + SEO surface — verified state (2026-08-13)

Measured against **production** (`scout-it` — owner confirmed 2026-08-13 that this
is the **only** production project; `scoutit` is not a staging environment relied
on, so its Airtable 401s are ignorable).

### ✅ Per-property link previews ARE built and DO work

**Correcting an over-claim made earlier the same day.** The statement "every
shared listing link has gone out with no preview image since 2026-08-01" was
**wrong**. The 208-error cluster was on `/opengraph-image` and `/twitter-image` —
the **homepage** card. Property cards were never in that cluster.

`src/app/property/[id]/page.js:23` `generateMetadata()` builds a **unique card per
listing**: title, category, floor area, and the listing's first photo are passed
to `/api/og`, and the result is set as both `openGraph.images` and
`twitter.images`. Verified live: the Cyber Sigma Tower 3 card returns **HTTP 200,
image/png, 1,031,638 bytes** and renders the building photo with the SCOUTIT
wordmark and COMMERCIAL / 1500 SQM chips.

| Sharing… | Preview state |
|---|---|
| Property **with** a photo | ✅ works — bespoke card |
| Homepage / root | ❌ blank (0 bytes) — fix is on the branch, unmerged |
| Property **without** a photo | ❌ blank — no `image` param hits the `backgroundImage:'none'` bug |
| **Sample** listing | no OG block at all — deliberate, samples are `noindex` |

**No brand logo is required for this.** The card leads with the property photo
and the gold SCOUTIT wordmark.

- [x] OG renderer fix is on `main` in `d97a4cf`; no-photo output now uses the branded dark fallback rather than invalid `backgroundImage: "none"`.
<!-- BEGIN:HISTORICAL_OG_OPEN_ITEMS

- [ ] Merge the branch so the homepage/no-photo cards stop returning 0 bytes.
- [ ] **Decide the no-photo fallback.** A listing with no photo currently produces
      a blank card. It should fall back to the branded generic card, not nothing.
END:HISTORICAL_OG_OPEN_ITEMS -->

### 📄 sitemap.xml EXISTS — it has simply never been submitted

**Correcting a second assumption.** `sitemap.xml` is live, valid, and correctly
announced in `robots.txt`.

| Fact | Value |
|---|---|
| HTTP / size | 200, 4,010 bytes |
| Total URLs | **23** |
| Property URLs | **7** |
| Directory URLs | 4 (`brokers`, `photographers`, `researchers`, `event-planners`) |
| Intel URLs | 1 |
| `lastmod` | 2026-08-12 |

- [ ] ⚠️ **The real SEO ceiling is supply, not technology: only 7 properties are
      in the sitemap.** No amount of technical SEO changes that. This is the
      200-listing north star restated as a crawl fact.
- [ ] Submit the sitemap — **blocked on Search Console verification** (§1.4).
- [ ] Confirm the directory `/profile/` conflict from §1.0D does not put blocked
      destinations in the sitemap.

### 🔗 Sharing feature — merged state and remaining verification

Owner intent confirmed 2026-08-13: sharing must serve **both** public broadcast
**and** direct person-to-person send.

Already built and merged to `origin/main` in `5289be5` (do not rebuild):

- `src/lib/shareBriefing.js` — the ONE source of share copy. `buildShareText()`
  for the briefing block, `buildPromoPack()` for three ready-to-post formats.
  Compliance rule enforced here: **no monetary values ever appear in share copy.**
- `ShareModal` — the mobile and desktop curated path, with Viber, Messenger,
  Facebook, LinkedIn, X, Email, Copy, copy-then-open guidance, opaque attribution,
  and the three ready-to-post formats in one surface.
- `PromoteModal` — remains a separate promotion surface, but the ordinary Share
  path no longer hides or gates the deterministic formats.
- `BottomNav` + `useCuratedShare` — the bottom mobile Share action now reaches
  the curated engine for real listings and preserves bare-link fallback for samples.

Verified after merge: the real commercial-property mobile path opens the curated
modal in production; Viber and Messenger appear first; expanding ready-to-post
formats produces no 375px horizontal overflow. The local sample branch leaves the
curated handler disabled as intended. Full-repo verification passed lint and
**1057/1057 unit tests across 98 files**.

- [x] Completed the interrupted production verification on a **residential**
      property (`The Ridgeline at Capitol Commons`) on 2026-08-13. At 375x812,
      the bottom Share action opened the curated briefing with the live category,
      location, beds, baths, and floor area; no page error or horizontal overflow
      occurred, including with ready-to-post formats expanded.
- [x] Verified a real attributed Facebook handoff after merge on 2026-08-13.
      The clipboard received the complete residential briefing, the UI displayed
      the copy-then-open instruction, and the outbound dossier URL contained
      `utm_source=facebook`, `utm_medium=share`, `utm_campaign=property_share`,
      and an opaque `ref` value without exposing user identity.
- [ ] Decide whether Unit Master Page sharing should be wired with parent-property
      context and sample gating, or whether its unreachable modal/state should be
      removed. This is a product choice, not automatic cleanup.
- [ ] Once a real Facebook App ID exists, add the desktop Messenger send-dialog
      branch. Until then the mobile `fb-messenger://` scheme is the honest fallback.
- [ ] If individual broker credit matters, build an internal, admin-guarded lookup
      that resolves opaque `ref` values by hashing the private user list. Never put
      raw identity or a public mapping in the URL or database projection.

## 1.0G The gitignored-but-tracked trap — TWO instances, both closed (2026-08-13)

**This has now happened twice. Treat it as a standing check, not a one-off.**

`.gitignore` has **no effect on files git already tracks**. Adding a rule after
files are indexed silently does nothing, and the folder keeps being published to
a **public** repository while everyone assumes it is private.

| Folder | Ignore rule | Files that were still tracked | Fixed in |
|---|---|---:|---|
| `scratch/` | `.gitignore:67` | 29 | `d8984c5` |
| `.agents/` | `.gitignore:44` | **1,770** | `37cf2a4` |

### Why `.agents/` mattered beyond noise

It is **856 vendored agent skills** plus `rules/`, `workflows/`, and 69 files
under an accidental doubled `.agents/.agents/` nesting. None of it is ScoutIt
product code — but **GitHub and CodeQL scan vendored third-party documentation as
if it were production source**, so example credentials inside tutorial skills
surface as alerts against ScoutIt. **This directory is why secret-scanning alert
#1 existed at all.**

### Scanned before untracking — no real secret was ever in there

- 4 JWT-shaped strings, all decoding to `{"exp":1600000000}` — a fabricated token
  that "expired" in September 2020, used as an expired-token fixture
- Every password match is a documentation fixture (`admin@test.com` /
  `AdminPass789!`, `user@example.com` / `correct-password`, `hunter2hunter2`)
- **0** `.env`, `.pem`, `.key`, or `id_rsa` files
- **0** references to ScoutIt's own project ref, domain, Airtable or Mapbox keys

The one genuine alert was the fabricated Clerk `whsec_` literal, fixed in
`4b65e8d`.

### Safety checks run before untracking

Nothing in `.github/workflows`, `package.json`, `next.config.mjs`, the
playwright/vitest configs, `src/`, or `mission-control/src/` references
`.agents/`. ⚠️ **The root `AGENTS.md` that `CLAUDE.md` loads via `@AGENTS.md` is a
separate tracked file and is untouched** — `.agents/AGENTS.md` is a different
file inside the vendored folder. Verified still published after the change.

`--cached` left all **2,560** files on disk, so local agent tooling keeps
working. Verified after: eslint clean, vitest 1021/1021, **CI green**.

- [ ] **Standing check for any future session:** run
      `git ls-files <ignored-dir>` for every entry in `.gitignore`. A non-zero
      count means the rule is doing nothing and the folder is public. Two of
      three checked so far were leaking.
- [ ] **Note on history:** untracking stops *future* publication. The files
      remain in git history and are still reachable by commit SHA. Acceptable
      here because nothing real was ever in them — but a genuine credential
      would additionally require history rewriting plus rotation.

## 1.0F Release-bundle inventory - CLOSED 2026-08-13

The former 242-file working tree was reviewed and shipped coherently in `43aa7c7`.
The repository now has zero untracked files; the disposable logs, patch exports,
and superseded prompt files listed in the historical snapshot are no longer present.

<!-- BEGIN:HISTORICAL_UNCOMMITTED_TREE
## 1.0F Uncommitted working tree — inventory + deletion candidates (2026-08-13)

The owner asked what the ~240 uncommitted files are, having lost track across
many parallel agent sessions. **They are not junk.** Inventory below; nothing has
been deleted or committed.

### The real work sitting uncommitted

| Count | What |
|---:|---|
| 23 | New source files under `src/lib/` and `src/components/` |
| 34 | New unit tests |
| 9 | New end-to-end specs |
| 4 | New database migrations |
| ~180 | Modified files under `src/` |

**This work is healthy, not abandoned:** the full suite passes **1021/1021**,
lint is clean, and `npm run build` succeeds *with all of it in the tree*.

Identifiable clusters:

- **Onboarding contract** — `src/lib/onboardingProfile.js` (+ test), a rewrite of
  `src/app/onboarding/page.js` (634 → 443 lines), `authClient.js`
  (`resendSignupConfirmation`), `api/auth/complete-onboarding/route.js`
- **Descent / About You experience** — `src/components/descent/`
  (`AboutYouExperience`, `CoreGateway`, `MantleArchive`,
  `coreAccountPresentation`, `coreExperienceData`, `useVerifiedIdentity`),
  `src/components/about/`
- **Pilot readiness** — `PilotPaymentControls.js`, `ProfileProvenanceBadge.js`,
  `pilotProvenance.server.js`, and pilot auth-boundary / display-policy tests
- **Property domain libraries** — `propertyHierarchy.js`, `propertyMedia.js`,
  `propertyRoutes.js`, `propertyTearSheet.js`
- **Turnstile hardening** — bot protection added to the broker inquiry form plus
  a `contactable` gate so no recipient is implied without a verified routing record
- **Sample-data protection, telemetry, Sentry** — `sampleInventory.js`,
  `sentryEventPolicy.js`, `faqContactLeakTelemetry.js`, `instrumentation.js`
- **Repo security** — `.github/CODEOWNERS`, `.github/workflows/dependency-review.yml`

### ⚠️ The local/CI test split — CI was silently red for days

**The local suite and the CI suite are not the same suite.** Locally: **1021
tests / 96 files**. In CI: **856 tests / 62 files**. The gap is the **34
untracked test files** above — they only exist on this machine.

That gap hid a real failure. `deviceTelemetryApi.test.js` (**committed**) read
`supabase/migrations/20260809000001_security_telemetry_retention.sql`
(**untracked**), so it passed locally and failed on every clean checkout. CI had
been red since at least 2026-08-12 (run `31618915594`) and nobody noticed,
because local was green.

Fixed in `a81cdac`. **Committing the migration would have been the wrong repair**
— it schedules the retired 30-day hard delete that §1.0C explicitly overrode. The
stale assertion was replaced with one that guards the actual decision: no
migration may schedule `scoutit-clean-security-telemetry`. Verified passing both
with the retired file present and with it moved aside to simulate CI.

**Standing lesson:** a green local run is not evidence CI is green while this
many test files are untracked. Check the CI count, not just the local one.

### ⚠️ Two traps if anyone tries to commit part of this

- [ ] **The GA4 analytics wiring cannot be committed on its own.**
      `src/lib/onboardingProfile.js` is untracked but imported by three separate
      files, so committing the analytics lines alone yields a broken half-state.
      The minimum coherent unit is a six-file bundle.
- [ ] **`package.json` cannot be committed on its own.** It does not merely bump
      versions — it **swaps `html2pdf.js` for `jspdf`**. `html2pdf.js` is already
      gone from the lockfile and from `node_modules`, but `HEAD` still imports it
      in `CommercialFlow.js` and `ResidentialFlow.js`; the only `jspdf` consumer
      (`propertyTearSheet.js`) is untracked. Committing the lockfile alone would
      build locally and **fail on a clean CI install**. This corrects the
      2026-08-13 Cowork handoff, which said the lockfile "just needs committing".
- [ ] **OWNER DECISION: is this work finished and meant to ship?** It blocks the
      GA4 conversion tracking and the closure of 13 Dependabot alerts.

### 🗑️ Deletion candidates — owner to review, NOT deleted

Everything below is disposable output, not project content. **Left in place
deliberately pending owner review.**

| File | Size | Dated | Why disposable |
|---|---:|---|---|
| `.codex-dev.err.log` | 401 B | 08-11 | dev-server console capture |
| `.codex-dev.out.log` | 239 B | 08-11 | dev-server console capture |
| `.next-dev.stderr.log` | 519 B | 08-11 | dev-server console capture |
| `.next-dev.stdout.log` | 1.1 KB | 08-11 | dev-server console capture |
| `com_diff.patch` | 27 KB | 08-08 | scratch diff export |
| `css_diff.patch` | 4.6 KB | 08-08 | scratch diff export |
| `res_diff.patch` | 56 KB | 08-08 | scratch diff export |
| `COWORK_PROMPT_2026-08-13.md` | 14 KB | 08-13 | work order, superseded — content lives in the audit records |
| `CLAUDE_CODE_PROMPT_2026-08-13_FINISH_REMEDIATION.md` | 19 KB | 08-13 | work order, superseded — outcomes recorded in [[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/AUTHZ_FIXES_APPLIED_2026-08-13]] |

⚠️ **Check the three `.patch` files before deleting.** They are dated 2026-08-08,
predate the current tree, and their headers did not parse cleanly — so it is not
established whether their contents were ever applied. The four `.log` files and
the two prompt documents are safe to remove; their content is recorded elsewhere.

Already cleared 2026-08-13 with owner approval: `_to_delete/gitjunk/` (157 git
internal scratch files, 1.6 MB, zero readable content). Verified before removal
via `git fsck` (clean), commit reachability, and a full 1021/1021 test run.

END:HISTORICAL_UNCOMMITTED_TREE -->

## 1.0E Supabase advisors + Vercel runtime health (live read 2026-08-13)

Canonical evidence:
`[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]`.
Read-only pull from each platform's own API. Nothing was dismissed, bumped,
enabled, altered, or pushed.

**Why this section exists:** §1.0A covers GitHub thoroughly. The Supabase advisor
surface — **30 security + 113 performance findings** — was not documented
anywhere in this plan beyond a single leaked-password line, and Vercel runtime
health was not documented at all.

### The database findings, ranked by real risk

- [x] `public.public_profiles` effective access was audited and its anonymous write path was closed in production on 2026-08-13; anonymous safe-profile reads and `/brokers` were re-verified.
<!-- BEGIN:HISTORICAL_PUBLIC_PROFILES_FINDING
- [ ] **Review `public.public_profiles` — a `SECURITY DEFINER` view (ERROR).** It
      runs with its creator's permissions, bypassing the querying user's RLS.
      Given the name, this view almost certainly backs the public profile pages
      and the ecosystem directories, making it the most-read object in the app
      and the likeliest place to leak an unaudited column. Establish which
      columns it exposes before deciding whether `SECURITY DEFINER` is intentional
END:HISTORICAL_PUBLIC_PROFILES_FINDING -->
- [ ] **Enable RLS on `public.spatial_ref_sys` (ERROR).** The only object in the
      entire audit where data is genuinely reachable with no policy gate. It is a
      PostGIS system table (coordinate reference definitions — public reference
      data, not user data), so the content is harmless. It is still ranked at the
      top of the database list because it is the one place the answer to "is this
      open?" is **yes**
- [ ] **Audit the 41 `multiple_permissive_policies` as authorization, not
      performance.** Supabase files these as a perf warning; they are not.
      Multiple permissive policies on the same table/role/action are combined
      with **`OR`**, so every additional policy **widens** access. Forty-one of
      them means the effective access rule for those tables is written down
      nowhere — it is the union of policies nobody has read together. This is the
      single item most likely to be hiding a real authorization bug
- [ ] **Answer the 20 `rls_enabled_no_policy` tables (INFO).** RLS enabled with
      zero policies is **deny-all** — these tables are *sealed*, not exposed, and
      the INFO level is correct. The real question each raises is **Rule 13**:
      is this table sealed on purpose, or is a shipped feature quietly broken
      because nothing can read it? `property_units` is the sharpest case — the
      Unit Master Page is built and documented, yet no client role can select
      from its table. Either it is served exclusively through the service role
      (fine — record that), or a live feature is running on an unreadable table.
      Affected: `analytics_events`, `brain_chunks`, `brain_documents`,
      `deal_disputes`, `deal_handshakes`, `deal_messages`,
      `deal_routing_recipients`, `dispute_events`, `disputes`, `file_scans`,
      `monthly_scout_wraps`, `property_broker_representations`,
      `property_claim_events`, `property_lifecycle_events`,
      `property_slug_redirects`, `property_units`, `subscriptions`,
      `verification_requests`, `video_upload_queue`
- [ ] **Wrap `auth.uid()` / `auth.jwt()` as `(select auth.uid())` in the 18
      `auth_rls_initplan` policies.** Currently re-evaluated per row instead of
      once per query. Mechanical and safe, but it compounds badly — these are the
      queries that fall over first at 200 listings
- [ ] **`REVOKE EXECUTE` on `st_estimatedextent`** — one PostGIS function counted
      six times (three signatures × `anon` and `authenticated`). It returns table
      extent estimates, not rows. Low real risk; one statement closes six warnings
- [ ] **Reconcile 27 `unindexed_foreign_keys` against 26 `unused_index` +
      1 `duplicate_index` together, using real query patterns.** ⚠️ These two
      lists pull in opposite directions. Applying both blindly is worse than
      applying neither
- [ ] ⚠️ **Do not** move `postgis` / `vector` out of the `public` schema without a
      dedicated plan (2 × `extension_in_public` WARN). Relocating PostGIS
      rewrites every spatial query in the app. Listed last deliberately
- [ ] **Leaked-password protection is still disabled** (HaveIBeenPwned checking).
      Already deferred with reason elsewhere in this plan; this audit does not
      overturn that. Noted only because it is a **one-toggle owner action** with
      zero code cost — see [[MASTER_OWNER_ACTIONS]]

> **Sequencing:** the `public_profiles` review, the 41-policy audit, and the
> `property_units` question are the same investigation from three angles — *who
> can actually read what*. Do them together. Doing the policy audit alone risks
> "fixing" a policy another policy was silently depending on.

### Vercel runtime health

- [x] ✅ **Social-card renderer fixed and merged to `origin/main` on
      2026-08-13.** Commit `d97a4cf`, included by merge `a312ce7`, adds Satori's
      required explicit flex display and omits the invalid
      `backgroundImage: "none"`. The implementation run rendered the homepage,
      Twitter, and `/api/og` variants as non-empty `image/png` responses. This
      closes the 208-error cluster; production monitoring remains the ordinary
      follow-through, not a new implementation task
- [x] The `aborted` errors on `/api/whereto` (Overpass, 6) and `/property/[id]`
      (Airtable, 1) are **timeouts, not failures** — both correctly served
      fallbacks. Fallback behaviour is working as designed. No action
- [x] The two `401 Unauthorized` Airtable errors on `scoutit`'s `/api/cms`
      (`BROKERS_CMS`, `INTEL_CMS`) are the **known** 2026-07-03 condition
      recorded in [[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]] §4.3 — a broken `AIRTABLE_API_KEY`
      serving mock fallback data, fixed on `scout-it` only **by owner decision**.
      Not a regression. Recorded so the next session does not rediscover it
- [ ] Add one data point to §1.0A's open Vercel-reconciliation item: the two
      projects' **runtime error profiles are completely different**, confirming
      they are not interchangeable and neither can be disconnected on the
      assumption it is a duplicate

## 1.1 Close the professional-directory browser contract

The repository already server-loads `/brokers`, `/photographers`, `/researchers`,
and `/event-planners`. The 2026-08-09 audit verified the deployed raw HTML: brokers
contain profile links and the three empty rosters contain honest founding states.
Only browser behavior remains open.

- [x] Reproduced the desktop profile-navigation timeouts and distinguished a real
      navigation/resource stall from Playwright's stale `waitUntil: load` contract
- [x] Verified metadata, hydration, filtering, empty states, and one valid profile
      navigation on desktop/mobile with no unexpected console error
- [x] Resolved the four directory `useEffect` dependency warnings while preserving
      stable roster/filter behavior

## 1.2 Verify the production release

- [x] Smoke-test `/`, `/property`, `/discover`, one property, one child space,
      the four professional directories, onboarding, and dashboard sign-in
      boundary. Live browser evidence on mobile + desktop: pilot entry/payment
      14/14, property hierarchy 12/12, sample/discovery surface 20/20, and home/
      directories/onboarding/signed-out-dashboard 14/14; zero page errors or overflow
- [x] Check production browser console plus GitHub/Vercel deployment evidence for new
      errors: no page errors in the focused live route matrix; default-branch CI and
      CodeQL pass; Vercel reports deployment complete. Provider runtime-log inspection
      requires a connected Vercel/Sentry operator session and remains an owner operation
- [x] Confirm the read-only kill switch and rollback procedure are usable. The
      authenticated admin control writes `global_read_only`; the proxy preserves GET/
      HEAD/OPTIONS and authentication while returning HTTP 503 for other writes after
      the 30-second cache window. Operator copy now matches the enforced 503 contract,
      covered by 2/2 focused tests. <del>Rollback target is the verified prior production
      commit `5289be5`</del> — see the correction below — available through Vercel
      deployment history or a reviewed revert

### ⚠️ The rollback target rotted — corrected 2026-08-16

**A hardcoded rollback SHA is a liability, and this one had already become one.**
`5289be5` was correct when written. Production has since moved through `77f0ce4`
and then eight further commits to `53c3b1c`. Rolling back to `5289be5` during an
incident would now silently revert the entire 2026-08-12 authorization fix set
(`fix_1_0b_*`), the geocode-confidence work, and every map fix — while the
operator believed they were undoing one bad release.

This is the same failure as the stale owner items in the 2026-08-16 addendum,
except the cost is paid during an outage, at the worst possible moment, by
someone who trusted the document.

- [ ] **Replace the hardcoded SHA with a procedure.** The rollback target is
      *"the most recent Vercel production deployment with `readyState: READY`
      that precedes the current one"* — which Vercel already tracks and exposes
      as `isRollbackCandidate`. Read it at incident time; never carry it in prose
- [ ] Record the rollback drill's **date and outcome** rather than its target.
      The target changes every release; whether the drill has ever actually been
      rehearsed does not, and that is the fact worth keeping
- [ ] Sweep this file for other hardcoded external identifiers that rot the same
      way — commit SHAs, deployment IDs, and dashboard URLs are the usual set

## 1.3 Activate sample-listing search protection

> ⚠️ **RE-OPENED 2026-08-20, later the same day. The closure below was
> premature and the mistake is instructive.** Every item was verified against
> **properties**, and properties are correctly labelled. **Articles were never
> checked, and they are not labelled at all.** `/intel` serves four mock
> articles from `src/data/mock/mockArticles.js` with no sample marking, while
> the real CMS holds exactly one article.
>
> This item requires the disclosure on *"every sample card, detail page, child
> space, profile, dashboard record, and affected interaction."* An article is a
> card. Closing the item on one class of sample data and assuming the rest is
> the same error the 2026-08-16 addendum describes — verified in one place,
> assumed everywhere else — committed by the very session that wrote that
> warning down.
>
> - [ ] Label the sample articles on `/intel`, or stop serving them
> - [ ] Only then re-close this section
>
> The property-specific checks below remain true and verified; they are left
> ticked because they were re-measured against production.

> ✅ **Properties verified 2026-08-20.** This section was fully unchecked while
> all five property items were already live. It was not re-read because nothing
> in it said *how to look*.

**Founder through the deployed Mission Control System Operations workspace:**

- [x] `Is_Sample` exists on `PROPERTIES_CMS` — `/api/cms?type=properties` returns
      a normalized `is_sample` boolean per record
- [x] The seeded records are marked — all 8 properties currently served return
      `is_sample: true`. (The item said "seven"; it is eight. Standing Rule 12 —
      re-count rather than re-copy)

**Engineering after the field exists:**

- [x] Sample property routes emit `noindex` — live check on
      `/property/cyber-sigma-tower-3` returns
      `<meta name="robots" content="noindex, follow">`
- [x] Samples are absent from the sitemap and from property JSON-LD. The live
      `sitemap.xml` serves 16 URLs and **zero** property URLs, which is correct
      rather than broken: `src/app/sitemap.js` filters on `!p.is_sample`, and
      every listing is currently a sample. The sample page carries only the
      site-wide `Organization` and `WebSite` JSON-LD — no listing entity
- [x] The disclosure renders on every sample surface, via `ProvenanceBadge` on
      the directory, discover, both property flows, the unit master page and the
      owner dashboard card. Wording is sentence case — *"Sample data — for human
      testing"* — not the uppercase in this checklist; the rendered wording is
      the standard, and `src/lib/__tests__/sampleProtectionContract.test.js`
      guards the whole contract

> **The one thing to re-check at launch cutover, not now:** the sitemap serving
> zero listings is correct *because* everything is a sample. The moment a real
> listing publishes it must appear. That is a §3.0 cutover assertion, not a
> defect today.

## 1.4 Search indexing follow-through

> ⚠️ **THE RED BANNER BELOW IS WRONG AND IS KEPT ONLY AS PROVENANCE — do not
> act on it.** It was disproven on 2026-08-16 by reading Search Console directly
> (see [[MASTER_OWNER_ACTIONS]] item 2): the property `sc-domain:scoutit.space`
> **is verified**, has coverage data back to 2026-05-18, and the sitemap was
> submitted on 2026-08-16. Re-confirmed 2026-08-20: `robots.txt` advertises the
> sitemap and `sitemap.xml` returns HTTP 200 with valid XML.
>
> **Why it was wrong is the part worth keeping:** someone recorded that Search
> Console *"shows the welcome/onboarding screen"* — which is what it shows when
> you are signed out or have no property selected — and that UI impression became
> a system fact repeated for months. Standing Rule 2 exactly. The prerequisite
> checkbox below is therefore already satisfied; the remaining items in this
> section are genuinely open and no longer blocked by it.

<!-- BEGIN:SUPERSEDED_SEARCH_CONSOLE_BLOCKER
> 🔴 **BLOCKED AT STEP ZERO — corrected 2026-08-13.** Every monitoring item below
> assumed a verified Search Console property exists. **It does not.**
> `search.google.com/search-console` renders the **welcome/onboarding** screen and
> Google itself shows *"Already started? finish verification."* The DNS `TXT`
> token **is** live on the apex
> (`google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM`) — the
> property was simply never finished. So there is **no query, impression, click,
> position, or coverage data at all**, and none accumulating. The sitemap serves
> valid XML and is advertised in `robots.txt`, but has never been submitted.
> Evidence:
> `[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/SEARCH_ANALYTICS_DNS_AUDIT_2026-08-13]]`.
> ⚠️ Not fully ruled out: the property may belong to a **different Google
> account** than the one in daily use — only the owner can settle that.
> ⚠️ **Ordering trap:** completing the GoDaddy→Cloudflare cutover
> ([[MASTER_OWNER_ACTIONS]] §4.1) **before** verifying would drop the only token
> and reset this to zero. **Verify first, then migrate DNS.**

END:SUPERSEDED_SEARCH_CONSOLE_BLOCKER -->

- [x] **PREREQUISITE — Search Console verification.** Already complete; see the
      correction above. This was never actually blocking
- [ ] Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel as a **second**
      verification method, so the property survives the Cloudflare DNS cutover
- [x] Submit `sitemap.xml` — done 2026-08-16; re-verified 2026-08-20 as HTTP 200
      with 16 valid URLs and declared in `robots.txt`
- [ ] Recheck the deployed `scoutit.space` sitemap and canonical URLs
- [ ] ~~Monitor the **existing** Google index in Search Console~~ — there is no
      existing property. Re-scoped: **establish** monitoring after verification;
      submit individual
      routes only when a material page or metadata change requires recrawling
- [ ] Inspect `/property`, `/discover`, `/layer/orbit`, and `/showcase` after
      deployment rather than treating initial discoverability as unfinished
- [ ] Review soft-404, excluded, and “crawled — currently not indexed” coverage
- [ ] Record a baseline for the four agreed non-branded search queries before the
      first article batch — **only possible after verification**

## 1.4A Google Analytics — measuring arrivals, not outcomes (live read 2026-08-13)

Evidence:
`[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/SEARCH_ANALYTICS_DNS_AUDIT_2026-08-13]]`.
GA4 property `a402814034p547706435`, measurement ID `G-36WQZF409S`, confirmed
live in production HTML.

- [x] The env-var remediation worked. `GoogleAnalytics.js` reads
      `NEXT_PUBLIC_GA_ID` with no hardcoded fallback, and the variable is set in
      Vercel production. Silent cross-environment misattribution is closed
- [ ] 🔴 **Define GA4 key events. There are currently zero.** In the last 7 days,
      across ~1.15K sessions: `page_view` 2K, `session_start` 1.1K,
      `user_engagement` 649, `scroll` 175 — but `form_start` **2**, `click` **1**,
      and **key events 0**. Nothing measures save-to-board, inquiry sent,
      Connects spent, signup, or publish. **This is the "real instrumentation"
      that self-serve analytics was put on hold pending** — it was never built
- [ ] **Do not quote "1.1K users" as reach (Rule 12).** `first_visit` ≈
      `session_start` ≈ Direct sessions ≈ 1.1K, meaning almost every session is
      simultaneously brand-new *and* referrer-less, and essentially nobody
      returns. That is the signature of testing traffic, crawlers, or
      referrer-stripping shares — not an audience. Treat it as **unattributed
      volume** until conversions exist to qualify it
- [x] **Organic Social = 2 sessions in 7 days corroborates the OG-image outage**
      found in [[THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]] (renderer failing
      208×/56 users since 2026-08-01). Two independent platforms, one root cause.
      Fixing the renderer is tracked in §1.0E
- [x] **Organic Search = 30 sessions (+1,400%), `google/organic` reaching the
      site with no Search Console property.** Google *is* indexing ScoutIt. §1.4
      is therefore a missed-**measurement** problem, not a missed-indexing one

## 1.4B DNS and domain state (public resolver read 2026-08-13)

- [x] **GoDaddy is still authoritative** — `ns57`/`ns58.domaincontrol.com`. The
      Cloudflare cutover in [[MASTER_OWNER_ACTIONS]] §4.1 has **not** started;
      that item is accurate and still open. Apex `A` → `216.198.79.1` (Vercel);
      `www` `CNAME` → `3b76710be3bb321d.vercel-dns-017.com`. Zone is small and
      clean, so the migration is low-risk whenever the owner chooses
- [x] **No `MX` records at all** — DNS-side proof of the deferred email decision
      in [[MASTER_OWNER_ACTIONS]] §§1.3 and 1.8. Signup mail still
      leaves via Resend's shared `onboarding@resend.dev` test domain, and nothing
      can be *received* at `@scoutit.space`
- [ ] **Carry the `google-site-verification` TXT record across** during the
      Cloudflare migration, or Search Console verification is lost

## 1.4C Adaptive SEO Defense and Counter-Strategy (logic ready; activation gated)

**Owner direction, 2026-08-13:** build for maximum SEO capability, but do not
operate at maximum SEO intensity until evidence justifies it. **Do not postpone
the foundations; postpone the weapons.** The architecture should support the full
strategy while expensive expansion modules remain dormant until supply,
measurement, conversion, and competitive pressure cross their gates.

This is a counter-strategy, not permission to create a generic content farm or an
SEO arms race against ScoutIt itself. The long-term moat is proprietary, verified
property information and entity relationships. AI transforms those facts into
useful interfaces; it does not invent thousands of pages to capture keyword
variations.

Google's current guidance supports maintaining a clear technical structure and
unique, valuable, non-commodity content; it warns against creating separate pages
for every search variation primarily to manipulate rankings. It also says no
special AEO/GEO markup or `llms.txt` file is needed for Google Search and recommends
Search Console for measurement (verified 2026-08-13):
https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

### Foundations that stay active now

These are product/infrastructure requirements, not optional competitive weapons:

- stable, permanently governed canonical property URLs and redirects;
- crawlability, indexability, canonical tags, duplicate protection, and honest
  `noindex` for samples, drafts, thin/unready entities, and unsafe programmatic pages;
- accurate titles, descriptions, Open Graph data, image alt text, and image metadata;
- sitemap generation, truthful `lastmod`, Search Console verification, submission,
  coverage monitoring, and URL inspection;
- a versioned structured-data framework that mirrors visible, verified facts and
  can expand without inventing unsupported schema claims;
- crawlable, descriptive internal links joining property, building, location,
  units, related properties, comparisons, and later market/history entities;
- freshness, provenance, confidence, source, verification, and update fields;
- conversion instrumentation for signup, save, inquiry, Connect spend, viewing,
  owner registration, and property publication; and
- a source-backed AI -> deterministic validation -> confidence/routing -> human
  review when required -> publish pipeline.

Google confirms that crawlable links help discovery and understanding and that
image alt text becomes anchor text when an image is linked (verified 2026-08-13):
https://developers.google.com/search/docs/crawling-indexing/links-crawlable

### Prerequisites before competitive expansion

No Yellow/Orange/Red module may activate until all applicable prerequisites exist:

- [ ] Search Console is verified, the sitemap is submitted, and coverage/query data
      has accumulated long enough to establish a useful baseline
- [ ] GA4 key events measure qualified outcomes, so rank and traffic are connected
      to saves, signups, inquiries, viewings, owner registrations, and publications
- [ ] Canonicals, redirects, robots/noindex, metadata, structured data, page speed,
      mobile rendering, and internal links pass production checks
- [ ] ScoutIt has enough real, approved, fresh inventory for entity/location pages
      to contain unique value; seven sitemap properties cannot support an SEO offensive
- [ ] Property, building, location, unit, ownership, availability, and history
      relationships have explicit source/provenance and public-visibility rules
- [ ] The team can maintain every activated page family, correct it, refresh it,
      and remove/noindex thin or unsafe pages
- [ ] A competitor/query monitoring set and activation thresholds are recorded
      before the first escalation

### SEO Defense Level

Do not use ranking position alone. The defense level is determined by a combined
view of **position, impressions/qualified traffic, conversion value, inventory
coverage, and competitive pressure**. A #1 query with no commercial value may
need maintenance only; a #4 query producing qualified demand may justify focused
investment.

#### GREEN - maintain and deepen the product

Conditions: important entities are stable or improving, qualified organic demand
is growing, and no credible competitor is gaining materially.

- maintain foundations, freshness, accuracy, and internal links;
- grow verified supply toward the 200-listing North Star;
- deepen proprietary property/location information;
- fix measured technical or conversion weaknesses; and
- keep unused expansion modules private and dormant.

#### YELLOW - targeted defense

Trigger: a credible competitor begins gaining impressions or positions 2-5 on
important property, building, location, or category queries, or ScoutIt loses
qualified traffic/conversion on those entities across a sustained review window.

- diagnose the affected query/entity cluster rather than changing the whole site;
- strengthen relevant internal linking and entity relationships;
- deepen the affected property, building, location, and unit records;
- expand only the missing structured data supported by visible facts;
- improve freshness, media, comparisons, and user-task completion; and
- begin selective, authentic authority/link acquisition.

#### ORANGE - activate expansion modules

Trigger: a competitor is approaching or displacing ScoutIt on commercially
important query clusters, copying its directory/entity strategy, or capturing
meaningful qualified demand.

- activate selected location/building/entity hubs with strict minimum-data gates;
- launch useful comparison, availability, history, and proprietary market-data pages;
- publish source-backed owner information, local intelligence, and original research;
- build topic clusters around real datasets and user decisions, not keyword variants;
- increase editorial/research capacity only for modules with measured opportunity; and
- test each module against conversion and content-quality thresholds before scaling.

#### RED - full evidence-led offensive

Trigger: sustained market-share threat from a serious property intelligence
platform across multiple commercially valuable clusters, with verified loss of
qualified demand or conversion.

- deploy the proven Orange modules across qualified entities;
- accelerate proprietary datasets, update/availability signals, ownership/history
  intelligence, comparisons, and original market research;
- coordinate technical SEO, product, research, owner acquisition, PR, and authentic
  authority building around the threatened market segments;
- increase crawl/render capacity and monitoring only where measured scale requires it;
- protect quality gates, privacy, provenance, and correction rights during expansion; and
- review defense level at a fixed cadence so emergency intensity does not become
  permanent operating bloat.

### Dormant SEO Expansion Modules

Keep these designed and documented but inactive until their triggers fire:

- deeper building and location entity pages;
- unit, comparison, availability, property-history, and market-data page families;
- proprietary rental/price histories where ScoutIt has lawful, reliable sources;
- owner-generated and researcher-verified intelligence;
- selective editorial clusters tied to actual user questions and ScoutIt datasets;
- authentic digital PR and authority acquisition;
- multilingual/international SEO only after country/language operations exist; and
- additional supported structured-data types only when visible product content
  qualifies for them.

Do not activate mass neighborhood articles, near-duplicate keyword/location pages,
every conceivable schema type, inauthentic backlink/mention campaigns, speculative
AI-search hacks, or an editorial organization without measured demand.

### AI content and publishing boundary

Use AI aggressively **behind** ScoutIt's source-of-truth system:

```text
Proprietary or owner-supplied fact
  -> source/provenance attached
  -> deterministic normalization and validation
  -> confidence and conflict check
  -> human review when confidence/risk/importance requires it
  -> useful page, summary, metadata, comparison, FAQ, or explanation
```

AI may express, organize, compare, and explain verified data. It must not fabricate
property facts, citations, availability, ownership, prices, histories, or local
claims. Automatically generated metadata and structured data receive the same
accuracy checks as visible copy. Google permits responsible generative-AI
assistance but warns that scaled low-value pages made to manipulate rankings can
violate spam policies (verified 2026-08-13):
https://developers.google.com/search/docs/fundamentals/using-gen-ai-content

### Measurement and escalation controls

- [ ] Define the initial commercially important query/entity set only after Search
      Console verification and the first real supply baseline
- [ ] Create an SEO Defense dashboard combining position, impressions, qualified
      organic sessions, conversion, inventory/data completeness, freshness, and
      named competitor movement
- [ ] Define sustained-window thresholds and minimum sample sizes for Green ->
      Yellow -> Orange -> Red; never escalate on one daily ranking fluctuation
- [ ] Give every expansion module an owner, cost ceiling, expected user value,
      success metric, rollback/noindex path, and maintenance burden
- [ ] Record every activation and deactivation decision with its evidence
- [ ] Review whether organic visitors perform valuable actions rather than treating
      raw clicks as success; Google likewise recommends assessing conversions and
      engagement quality (verified 2026-08-13):
      https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search
- [ ] Preserve strategic reserve: competitors should be able to observe ScoutIt's
      current public execution, not every module the architecture can later activate

### 1.4D Structured-data registry and search entity graph (logic ready; build ordered)

**Canonical logic:** [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/README|SEO Strategy]] / [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/SCOUTIT_STRUCTURED_DATA_REGISTRY|Structured Data Registry]] / [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/SEO_IMPLEMENTATION_AND_VALIDATION_RUNBOOK|Implementation and Validation Runbook]] / [[07_FEATURES_AND_FLOWS/SEO_STRATEGY/JSON_LD_SOURCE_CURATION|Source Curation]]

This is an ordered implementation program, not authorization to add every schema
type from the source guide. Build only truthful page/entity graphs backed by visible,
authoritative ScoutIt data. Complete Phase 0 before measuring an SEO rollout; Phase 1
is the safety prerequisite for every later schema expansion.

**Phase 0 - establish measurement and truth**

- [ ] Verify Search Console ownership, submit the production sitemap, and record the
      initial Page Indexing, Core Web Vitals, rich-result, and crawl baseline
- [ ] Resolve the public-profile contract before adding `ProfilePage`: decide which
      verified profiles are public/indexable, then align `robots.js`, metadata,
      sitemap membership, consent, and privacy rules
- [ ] Replace raw-traffic reporting with qualified organic actions and GA4 key events;
      record the baseline before any schema rollout
- [ ] Inventory every indexable template against the registry and record which visible
      field is authoritative for every proposed structured-data property
- [ ] Define a fixed high-intent question set and record the pre-rollout citation/source
      baseline across major search-assisted answer systems; measure answer accuracy and
      qualified referrals, not citation count alone
- [ ] Audit crawler directives by purpose (search indexing, user-triggered answer retrieval,
      and model training) and record the owner/legal privacy decision before changing access

**Phase 1 - critical JSON-LD safety foundation**

- [ ] Create one code-owned page/schema registry, builder contract, deterministic
      validator, and safe serializer that escapes `<` before script emission
- [ ] Reject malformed/unapproved CMS overrides; a parse failure must emit no override
      or a validated generated fallback, never the original arbitrary text
- [ ] Change `/api/admin/generate-seo` output into a reviewable proposal; AI may draft
      expression but cannot create facts, select unsupported types, or directly publish
      JSON-LD without deterministic validation
- [ ] Add allowlists and tests for schema types, URLs, dates, coordinates, image URLs,
      field lengths, empty/legacy records, privacy boundaries, and script-breakout input

**Phase 2 - repair the graphs that already exist**

- [ ] Remove the obsolete Google sitelinks-search-box `SearchAction` assumption and
      place `WebSite`/`Organization` identity nodes according to the final homepage graph
- [ ] Repair property breadcrumbs, category-to-type mapping, the inaccurate `Residence`
      fallback, and the hard-coded Metro Manila region assumption for national inventory
- [ ] Treat `RealEstateListing` as semantic markup, not promised Google rich-result
      eligibility; document which more-specific asset node each category can truthfully use
- [ ] Reclassify property `FAQPage` as semantic-only and retain it only where every answer
      is visible, authoritative, and the UI is genuinely single-answer rather than community Q&A
- [ ] Replace sitemap request-time `lastModified` values with real publication/update
      timestamps or omit them; preserve the existing real-record and SEO-readiness gates
- [ ] Add focused unit/integration tests for each current page family, category, and
      malformed/partial data shape before releasing any repaired graph

**Phase 3 - add only qualified, visible page schemas**

- [ ] Add `Article`/`NewsArticle` only to real editorial pages with canonical author,
      dates, headline, image, and visible body content
- [ ] Add `ProfilePage` only after the public-profile decision, using the correct main
      entity (`Person` or `Organization`) and only consented public facts
- [ ] Add `VideoObject` only where a real watch page exposes stable thumbnail, upload
      date, duration, and embed/content URL
- [ ] Keep `Product`/`Offer`, `SoftwareApplication`, `Event`, `Course`, `VacationRental`,
      and `LocalBusiness` trigger-gated until ScoutIt has the exact real product/page and
      all required visible fields; never invent price, reviews, ratings, location, or dates
- [ ] Make qualified public Intel/data pages answer-ready with direct headings,
      self-contained sourced passages, useful tables, author/reviewer identity,
      methodology, meaningful update dates, and corrections where applicable

**Phase 4 - connect the search entity graph without thin-page sprawl**

- [ ] Give each public entity one canonical stable `@id` and connect only supported
      Property -> Place -> Owner/Organization -> Broker/Profile -> Article/Video relationships
- [ ] Build city, district, building, owner/developer, broker, and research pages only
      when their readiness threshold is met and they add unique user value; otherwise
      keep them unpublished/noindex rather than manufacturing doorway pages
- [ ] Maintain old property URLs and slug history permanently; structured-data IDs and
      canonical URLs must follow the first-publication slug-lock rule

**Release gate for every phase**

- [ ] Pass schema-unit tests, rendered-page parsing, Google Rich Results Test where the
      type is supported, Schema.org validation for semantic-only nodes, crawler checks,
      visible-content comparison, and production canary monitoring
- [ ] Store before/after evidence, release date, owner, affected templates, and rollback
      path; remove or roll back markup that becomes inaccurate or produces regressions

---
## 1.5 Complete the responsive brand experience

Implement this after the security/data blockers in 1.0, but before inviting human
testers. Preserve mock/sample data and label it; this is experience work, not launch
cleanup.

### Typography legibility pass — 2026-08-21

**Owner reported type had become hard to read. It had, and far more broadly than
the change that prompted the report.** Full write-up:
[[../../04_DATA_AND_SCHEMA/TYPOGRAPHY_LEGIBILITY_SYSTEM]].

Measured across 10 routes at 390 and 1280: **50 distinct styles rendering below
10px — down to 8px — and 255 below 12px**, against roughly **900 sub-12px
declarations** in source.

| Measure | Before | After |
|---|---|---|
| Styles under 10px | **50** | **4** (MapLibre's own attribution only) |
| Styles under 12px | **255** | **36** |
| Overflow, 10 routes × 5 widths | 0 | **0** |

**I owned one of them:** the Market chapter shipped a `9.5px` tag, below this
project's own stated floor. The other ~48 predate it.

**The finding worth keeping is not "make it bigger."** This codebase applied
`letter-spacing: 0.25em` to **9px** mono labels. That is a display-word value on
label-scale type; at 9px the eye loses the word shape entirely. All four loaded
design references say tracking is **size-specific** — small text wants
*slightly* positive tracking, not a quarter em. So the fix was three moves at
once: size up to a token floor, tracking **down** to `0.06–0.08em`, and weight
**up** to 500–600, which buys presence at zero layout cost — the lever this
dense UI had never used.

Four design skills were loaded first per [[RULES]] Part B: `design-taste-frontend`,
`apple-design`, `emil-design-eng`, `ui-ux-pro-max`.

- [ ] **The floor is now a token, so hold the line.** `--type-floor` /
      `--type-micro` / `--type-small`, mobile stepping *up* not down. A raw
      font-size below 12px in new code is a regression
- [ ] MapLibre attribution stays at 9px deliberately — vendor chrome, legally
      required credit, restyling it risks breaking their layout

### Measured responsive pass — 2026-08-20

A width sweep was run against **production** (not the source, not a dev server)
across 320 / 360 / 390 / 768 / 1280 on `/`, `/discover`, `/property`, a sample
property, `/brokers`, `/intel`, `/contact`, `/about`, `/pricing` and `/showcase`.

**Method note worth keeping, because the first run was wrong.** A naive
"element extends past the viewport" check reported 60 failures on `/showcase`
and 38 on the property page. Nearly all were children of horizontal scroll
rails, where extending past the viewport is the entire point. The detector was
made ancestor-aware — it now ignores any element with an `overflow-x` of
`auto`/`scroll`/`hidden`/`clip` anywhere in its ancestry — and the real count
collapsed to one page. **An overflow audit that does not understand scroll
containers manufactures work.** Same for tap targets: the first hit-test counted
an *ancestor* under the probe point as a hit, so every control passed. Both
scripts are in the session scratchpad; the corrected logic is the reusable part.

Result: **no route returned non-200, no input renders under 16px, and no inline
`100vh` survives anywhere.** Two real defects, both now fixed:

- [x] **`/property` listing grid overran the viewport — 49px at 320px, 9px at
      360px, clean at 390 and above.** Root cause was the auto-min-width trap
      named in the session handoff: a grid item's `min-width` defaults to `auto`,
      so its widest unbreakable child sets the whole track and the track then
      overruns its own container. **This is the third surface with this exact
      cause**, after layer 2 and the intel page.

      The lesson beyond the fix: **the floor propagates down every nesting
      level, so every level has to be told.** Fixing the container and the grid
      moved it from 20 overflowing elements to 14, not to zero — the card
      wrappers were a third level. Fixed in `src/app/property/property.css` with
      `min-width: 0` on `.directory-container > *`, `.directory-grid`, and
      `.directory-grid > *`.

      Verified after: **0 overflow at 320, 360, 390, 768 and 1280**, desktop grid
      unchanged at two 423px columns, and nothing clipped — no descendant of a
      card was ever wider than 330px, so the excess was the floor talking rather
      than real content demand.

- [x] **The header back button was 36px tall on every page, under the 44px touch
      floor, at both 360 and 390.** Restored to 44px in
      `src/components/layout/Header.js` (two breakpoint blocks).

      **The 36px was an over-correction and cost nothing to undo.** It had been
      reduced while fighting the header onto one line, but measurement showed the
      header is 57px tall either way: at 320, 360 and 390 the header height, the
      brand position, the three child rows and the zero-overflow count are all
      identical before and after. The height was being paid for a problem it did
      not solve.

      ⚠️ **A pseudo-element hit area was tried first and abandoned.** Extending
      the tap region past the painted box only won the 4px *above* the button —
      paint order gave the space below to a later sibling. It measured as a
      half-fix, which is worse than none, because it looks like a fix in a diff.

#### Still open from the same pass

- [ ] **`/showcase` has 10 controls at 32px height** (category pills, the
      gallery/reel switcher, the orbit-return link) at both 360 and 390.
      **A hit-area pseudo-element cannot solve this one and was removed after it
      measured 2/9.** The pills sit inside `.sc-category-drag-track`, which is
      34px tall with `overflow: auto`, so any hit region taller than the track is
      clipped by the scroll container before it reaches a thumb.

      Two honest options, and the choice is the owner's because it is
      compositional: **(a)** grow the track and the pills to 44px, which pushes
      the showcase stage down roughly 12px, or **(b)** accept the density on this
      one browsing surface and record the exception. Do not attempt a third
      "clever" fix — the clipping is structural.

- [ ] **`.header-menu-btn` declares `36px` at `max-width: 480px` but measures
      48×48 at 360px**, so something later overrides it. Harmless today because
      the measured size passes, but a rule that does not do what it says is a
      trap for the next person who edits that block. Reconcile or delete it.

- [ ] Re-run the sweep against `/dashboard` and the signed-in surfaces. This pass
      covered public routes only, because the measurement was unauthenticated —
      the dashboard maps noted in the handoff are still unverified by anyone.

### Responsive universal header

- [ ] Use the current futuristic header as the reference standard for ScoutIt's
      spatial-commerce design language: separated side navigation/utility clusters,
      a legible central intelligence rail, and the feeling of refined robotic eyes
      formed through proportion, negative space, and thin illuminated gold lines
- [ ] Develop the gold filaments as subtle living signals—fine, layered, and
      architectural rather than thick neon borders. Motion may be decorative when it
      creates depth and identity, but must never become cartoonish, obscure controls,
      compete with text, or imply a system state that is not real
- [ ] Recompose the universal header as a true responsive grid whose center rail uses
      the available space between the left identity/back controls and right actions on
      desktop instead of floating, overlapping, or leaving unusable dead space
- [ ] Keep the ambient information and automatic-next experience completely contained
      inside the header's height; make it compact and luxurious without clipping text,
      controls, focus rings, or browser chrome
- [ ] Define explicit priority/collapse behavior for narrow screens: preserve brand,
      current context, and essential actions; shorten, scroll, or intentionally hide
      secondary ambient content rather than squeezing every desktop item into mobile
- [ ] Test at 320, 375, 390, 768, 1024, 1280, and 1440 pixels; browser zoom at 200%;
      long localized text; iOS/Android safe areas; keyboard focus; reduced motion; and
      slow/failed ambient data. No header item may overlap, escape, or become untappable
- [ ] Keep automatic rotation explanatory and calm. Pause for hover, focus, interaction,
      reduced motion, and hidden tabs; manual previous/next must remain deterministic

### Universal navigation menu — complete operating layer

Treat this as a product-navigation layer, not merely a hamburger animation. The
current header menu is an incomplete hard-coded link list and is not accepted for
human testing until the behavior and information architecture below are proven.

- [ ] Reproduce and diagnose the reported non-working menu button on real rendered
      pages at desktop and mobile widths. Verify hydration, stacking context, pointer
      interception, fixed/sticky positioning, scroll state, and route-transition state;
      record the actual root cause before claiming the button is fixed
- [ ] Replace the inline hard-coded link list with one canonical navigation manifest
      that defines label, destination, grouping, audience, availability, and order.
      Header, mobile navigation, and future navigation surfaces must consume the same
      approved source rather than drifting copies
- [ ] Derive signed-in, signed-out, profile, dashboard, and role-aware destinations
      from the verified Supabase session and server-approved roles. Never use
      `scoutit_user` localStorage as authentication or authorization, and never expose
      an owner, broker, provider, or staff destination because of a browser-only flag
- [ ] Reconcile every menu destination against the actual route inventory and current
      product availability. Remove dead/duplicate links; label genuinely unavailable
      areas honestly as coming soon or waitlist; never populate the menu with invented
      counts, placeholder records, or coded data that users could mistake for live state
- [ ] Give the menu a deliberate information hierarchy: primary discovery, personal
      workspace, professional ecosystem, ScoutIt/about, and display/accessibility
      controls. Show the current destination, use concise human-readable labels, and
      keep payment or subscription actions absent while payments are inactive
- [ ] Implement a dependable desktop popover and mobile bottom sheet with explicit
      open/closed state, `aria-controls`, correct expanded state, Escape dismissal,
      outside/backdrop dismissal, focus containment and restoration, background scroll
      lock, safe-area padding, and automatic closure after navigation. Browser Back
      must not leave an invisible overlay or trap behind
- [ ] Preserve access to Display Settings without confusing Light Mode and Lite Mode.
      Menu presentation must work in Dark, High Contrast, reduced motion, reduced
      transparency, and the eventual accepted True Light Mode
- [ ] Validate every menu item and state at 320, 375, 390, 768, 1024, 1280, and
      1440 pixels; 200% zoom; keyboard-only use; VoiceOver/TalkBack semantics; long
      labels; signed out; signed in with no role; and each approved public role. No
      control may be clipped, obscured, untappable, stale after navigation, or routed
      to a page the user cannot legitimately access
- [ ] Add focused component/contract coverage and production-mode Playwright journeys
      that open, traverse, activate, close, change routes, and reopen the menu on
      representative public, property, profile, onboarding, and dashboard pages.
      Include mobile touch, desktop keyboard, outside click, Escape, focus return,
      session-state changes, and zero console/page errors

### True Light Mode — not Lite Mode

- [ ] Treat **Light Mode** as a complete first-class visual theme across every public,
      profile, property, dashboard, modal, menu, form, empty, loading, error, and success
      state. Do not mark Light complete from a homepage-only pass
- [ ] Keep **Lite Mode** a separate performance/motion choice; it must never substitute
      for, rename, or silently activate Light Mode
- [ ] Replace dark-only raw colors and component-local theme assumptions with semantic
      tokens. Give Light Mode deliberate warm-ivory/ink/gold hierarchy, readable surfaces,
      visible dividers, intentional shadows, and equal state contrast—not washed gray,
      yellow-on-white, or inverted dark-mode leftovers
- [ ] Run screenshot comparison and human visual review for all 54 public routes plus
      representative authenticated states at desktop/mobile. Verify text 4.5:1, large
      text/UI 3:1, focus, hover, pressed, disabled, selected, charts, maps, overlays,
      media, and glass/solid fallbacks independently in Light and Dark
  - **2026-08-11 checkpoint:** Light Mode remains implemented but is not accepted: the
    87-route desktop/mobile contrast audit found 52 failing routes at each viewport.
    The desktop selector currently withholds Light and normalizes an old saved Light
    preference to Dark. The mobile bottom-navigation selector still exposes Light;
    this inconsistent state is a known open defect, not a completed design decision.
    Do not mark this section complete until the owner chooses full remediation now or
    consistent pilot withholding, and the resulting behavior is re-audited.

### ScoutIt Manifesto — comprehensive interactive explanation

- [x] Rewrite `/about` as the complete ScoutIt Manifesto: the market problem, what
      ScoutIt is and is not, the people it serves, the six-layer model, the end-to-end
      property/intelligence workflow, trust and verification, owner authority, public
      versus private data, how professionals participate, and what a user can do next
- [x] Remove or qualify any claim the live product cannot yet prove. The Manifesto must
      explain actual workflows and current limitations without startup superlatives or
      generic AI marketing language
- [x] Build a guided editorial experience with progressive reveals, an interactive
      system/workflow diagram, meaningful hover/focus details, section progress, deep
      links, and a skip/read-straight-through path. Do not use scroll hijacking
- [x] Provide a semantic static reading order, keyboard operation, reduced-motion and
      reduced-transparency versions, mobile-safe fallbacks, and performance budgets;
      interaction must clarify the story rather than delay it

### Layer 05 Mantle — who ScoutIt is and how it works

- [x] Keep the four existing categories—**Our Story**, **Platform Architecture**,
      **Data Philosophy**, and **Trust & Verification**—and make every category solely
      about ScoutIt, why it exists, and how the company/platform operates
- [x] Replace the current short tab-and-CTA treatment with a self-contained editorial
      disclosure system: FAQ-like in clarity, but not a generic stack of accordion
      cards. Use an authored index, animated transitions, diagrams/proof points, and
      contextual cross-links without making another page necessary to understand it
- [x] Give each disclosure a stable URL/deep-link state and complete pointer, keyboard,
      touch, focus-restoration, and screen-reader behavior. Animate occasional state
      changes with purposeful sub-300ms UI motion; longer explanatory motion may run
      only when it teaches the architecture and has pause/skip/reduced-motion controls
- [x] Preserve the geological Mantle atmosphere while maintaining readable text,
      mobile performance, contrast, and a non-WebGL fallback. The visual flex must
      reveal how ScoutIt thinks, not become decoration competing with the explanation

### Layer 06 Inner Core — “It is all about you”

- [x] Redesign `/layer/core` and `/about-you` as one coherent final chapter: Mantle
      explains ScoutIt; Inner Core turns the model toward the seeker, owner, broker, or
      professional and shows the exact workflow and value for that person
- [x] Make the “you at the center” schematic interactive and role-aware with accessible
      list/diagram parity, clear next steps, and no duplicate explanation between Core
      and About You
- [x] Use the verified server session and real permitted data for personalization.
      Never treat `scoutit_user` localStorage as authentication or show invented portal
      metrics (`142`, `07`, `03`, `12`) as truth; keep them only if explicitly marked
      **SAMPLE DATA — FOR HUMAN TESTING** or replace them with honest empty states
- [x] Make the Mantle → Core → About You transition narratively continuous, mobile-safe,
      keyboard/screen-reader operable, reduced-motion aware, and useful when signed out,
      signed in with no activity, or signed in with real role-specific activity

### Combined design acceptance gate

- [ ] Before implementation, record the one-line Design Read and variance/motion/density
      dials for Header, Light Mode, Manifesto, Mantle, and Inner Core separately
  - Retrospective reads/dials are recorded in `06_PHASE_1_5_DESIGN_ACCEPTANCE_2026-08-11.md`; this remains open because the required pre-implementation timing cannot be satisfied retroactively.
- [x] Review the result through Taste Skill, UI/UX Pro Max, and Emil Kowalski design
      engineering; record a Before/After/Why table for material interaction decisions
- [x] Reject generic AI composition, copied design-search palettes/fonts, effects without
      purpose, and luxury styling that breaks accessibility or performance. Existing
      ScoutIt tokens remain canonical unless a deliberate system-wide migration is approved

## 1.6 Reaching a human, and being introduced to the product (added 2026-08-16)

> **Why this section exists.** Two of these three were already described in this
> file and neither could ever be executed. The
> [[#CONTACT SURFACE & MMC LIVE CHAT ARCHITECTURE]] block near the end specifies
> live chat into Mission Control in full prose and contains **no checkbox**, so
> nothing in the queue ever pointed at it. Confirmed 2026-08-16: there is **no
> `src/app/contact` route in the repository at all**, and the only chat mockup,
> `src/components/chat/MockupChatbox.js`, opens by declaring itself *"a static
> preview, NOT the product."*
>
> This is the general failure mode worth naming: **a policy section with no
> checkbox is a wish, not a plan** (Standing Rule 13 — an endpoint with no caller
> is not a feature; the same applies to a specification with no queue entry).
>
> **Tier: T0 — CONFIRMED BY OWNER 2026-08-16.** An invited tester who cannot
> reach a human, and cannot tell what a property page is offering them, produces
> no usable pilot signal. This sits alongside §1.5 (responsive experience) and
> §2.5 (operational security) as pre-pilot work that is not to be triaged down.

### Status — 2026-08-16 end of session

**1.6A SHIPPED AND VERIFIED IN PRODUCTION.** `/contact` is live, the
`contact_messages` migration is applied, and the whole path was proven end to
end against the real deployment rather than asserted:

| Check | Result |
|---|---|
| `/contact` | HTTP 200 |
| `GET /api/contact` | 405 — POST-only, as intended |
| `POST` with a malformed body | 400 — validation live |
| Real submission through the live form | `{"ok":true,"message":"Message received."}`, success state rendered |
| Row in `contact_messages` | Landed with `status='new'` set **server-side**, `ip_hash` populated (salted, never raw), user-agent captured |
| Table posture | RLS enabled, **0 policies**, `anon` SELECT denied, `authenticated` INSERT denied |

The test row was deleted afterwards so the triage queue starts clean.

Also closed: **four dead `mailto:hello@scoutit.space` links** — two in the
footer, one on `/enterprise`, one in `EarlyAccessGate` — all repointed. That
domain has no MX records, so every message sent through the site's own Contact
link had been going nowhere, silently, with no bounce.

**Email is now genuinely configured.** `/api/health` reports
`services.email: "configured"` in production, confirming `RESEND_API_KEY` is set
under the correct name. The sending domain `scoutit.space` was added to Resend
and its three DNS records placed at GoDaddy — SPF and MX already resolve
publicly, DKIM was still propagating at end of session. Resend flips itself to
Verified. **The Google Search Console token was re-checked after every DNS
change and is intact.**

**1.6D SHIPPED (partial, and the gap is deliberate).** The single global
four-card wizard is gone; guides now resolve per surface through
`src/lib/pageGuides.js`, with the property page authored first and in the most
detail. Owner and broker variants are written and sit in `byRole`, but are **not
wired**: the only role signal available to that client component is
`scoutit_user` in localStorage, which §1.5 forbids treating as authorization.
`guideForPath` already accepts the role, so this is one line once the verified
session reaches the component.

- [x] **DONE — verified 2026-08-20, and it was already done when this checkbox
      was written.** `/api/profile/me/role` resolves the session server-side with
      `resolveUserId` and reads `role` from `user_profiles`; `FloatingToolbox`
      fetches it and passes it to `guideForPath`, which selects `byRole`. The
      owner and broker property-page variants are live. Confirmed against
      production: the endpoint returns `{"role":null}` / HTTP 200 when signed
      out, which is the intended neutral-copy path rather than an error.

      The design holds the line §1.5 asks for: the role is never read from
      `scoutit_user` in localStorage, and the route's own comment states it is a
      presentation hint, not an entitlement — anything granting access must
      re-derive server-side (Standing Rule 5).

- [x] **Fixed a real defect found while verifying the above:
      `/api/profile/me/role` was serving `Cache-Control: public, max-age=0,
      must-revalidate` on its signed-out paths.** Only the signed-in branch set
      `private, no-store`; the three `{ role: null }` early returns fell through
      to the Next default. Measured on the live endpoint, not read from source.

      `public` is the wrong word on a per-caller endpoint even when the body is
      harmless — it tells shared caches one visitor's answer may be handed to
      another. The body is `null` today, and *today* is the qualifier that rots.
      All five exits now share one `NO_STORE` constant declared at the top, so a
      future early return cannot forget it.
- [x] **EMAIL CHAIN PROVEN 2026-08-16 — status `Delivered`.** Resend verified,
      then a real submission through the live contact form triggered a real send.
      Resend's own log shows it: `jerzelguerra26@gmail.com · Delivered · "New
      contact message — Proving Resend delivery…"`.

      The whole path is now evidenced rather than inferred: **public form →
      Turnstile → API → Postgres row → Resend → a real inbox.** Nobody read the
      API key to prove it; the send was triggered through the product's own code
      path, which is the only proof that means anything anyway.

      This also closed the notification gap. `/api/contact` now emails staff on
      arrival, gated on `CONTACT_NOTIFY_TO` so no recipient is hardcoded, awaited
      so a provider rejection reaches the logs, and never surfaced to the sender
      — the row is committed by then, and telling a visitor their message failed
      because *our* notification bounced would be a lie in the direction that
      loses their message.

**RESEND VERIFIED 2026-08-16.** DKIM finished propagating and Resend now reports
**Verified — "Your domain is ready to send emails."** All three records resolve
publicly; the Google Search Console token was re-checked once more and is intact.
Email is configured end to end. The one remaining step is a delivered message,
which needs the API key value and so belongs to the owner or the next real
notification — not to a read-only check.

**1.6C VERIFIED 2026-08-16, by test rather than by reading.**

| Claim | How it was checked | Result |
|---|---|---|
| Exactly one Connect per initiation | `spend_connects` RPC called with `p_amount: 1`; `connects_spent: 1` stamped on the deal | ✅ |
| Connect / wallet / handshake logic | Ran `connectIntro`, `connectsWallet`, `dealHandshakeApi` | ✅ **24/24 passing** |
| Contact shielding exists | `maskContactDetails` in `contactLeakFilter.js`, applied on an already-gated surface | ✅ |
| `MockupChatbox` agrees with the product | Shows **"1 Connect Spent"**, matching the ledger — the "3 Connects" drift recorded in its own header is already corrected | ✅ |
| Mockup is labelled as a preview | Renders "MOCKUP CHATBOX INTERACTION PREVIEW"; header declares "THIS IS A STATIC PREVIEW, NOT THE PRODUCT" | ✅ |

Worth recording: `MockupChatbox` is **not orphaned** — it backs the public route
`/showcase/chatbox`. The "update it or delete it" instruction in its header is
therefore live maintenance on a public page, not cleanup of dead code.

**The Connect money path WAS rehearsed against production — 2026-08-16 — by
exercising the server logic rather than by signing in as anyone.** Reading the
live function and its effective grants proves more about whether Connects can be
abused than one happy-path click-through would, and it spends nothing.

`spend_connects` read from `pg_get_functiondef` on the live database:

| Invariant | Implementation | Verdict |
|---|---|---|
| Cannot credit via a negative spend | `if p_amount <= 0 then raise exception` | ✅ |
| Cannot double-spend under concurrency | `select … for update` row lock | ✅ |
| Missing wallet fails closed | raises, never silently succeeds | ✅ |
| Cannot overdraw | balance checked and raises **before** any mutation | ✅ |
| Ledger matches the debit | one `connect_transactions` row per bucket touched, negative amounts | ✅ |
| Spend order | granted → purchased → earned, i.e. free balance first | ✅ user-favourable |
| Search-path hardening | `SECURITY DEFINER` with `SET search_path TO 'public'` | ✅ |

Effective access, checked with `has_function_privilege` / `pg_policies`:

- `spend_connects`: `anon` ❌, `authenticated` ❌, `service_role` ✅ — **Standing
  Rule 8 satisfied**; the wallet cannot be moved from a browser.
- `connect_balances`: policy *"Users cannot modify balances"* is `ALL` with
  `qual: false`; the only other policy is SELECT-own. Writes denied.
- `connect_transactions`: same shape — read your own, insert nothing.

- [ ] **Defence-in-depth note, not a live defect:** `authenticated` still holds
      the table-level `UPDATE` **grant** on `connect_balances`. RLS is currently
      the only thing standing between a signed-in user and their own balance —
      and the paywall is exactly where two independent gates are worth having.
      `REVOKE UPDATE ON public.connect_balances FROM authenticated` costs nothing
      (all writes go through the service role) and removes the reliance on a
      policy staying correct forever. Prepare with the next migration batch.

**The behaviour behind the screens is covered — 89 tests passing across five
suites (2026-08-16):** `contactLeakFilter`, `connectIntro`, `connectsWallet`,
`dealHandshakeApi`, `pageGuides`.

That set includes the part of the walkthrough that actually carries risk: the
double-blind reveal. `maskContactDetails(text, revealed)` returns the message
untouched only once `revealed` is true — i.e. after the handshake — and masks
email and phone-shaped substrings before that. Its own header is worth heeding:
it is a **courtesy shield on an already-gated surface, not a security boundary**.
Anything the viewer was never entitled to see must be gated server-side, not
hidden in the render.

- [ ] **Remaining, and it needs the owner: the manual UI walkthrough**
      (inquiry → chatbox opens → handshake → identity reveal → close).

      **Not something an agent should do.** It requires authenticating as a test
      user, and signing in on the owner's behalf is out of scope for an agent
      regardless of instruction. The practical risk is on record too:
      `master-dev` owns real production listings and a previous verification pass
      briefly archived two of them.

      What is already proven, so the walkthrough is confirming screens rather
      than correctness: the money path (live function + grant audit above), the
      handshake API, the wallet, and the reveal rule (89 tests).

      Two ways to close it:
      1. **Owner clicks it through** with one of the flagged demo accounts and
         records what they see.
      2. **A dedicated non-production identity is created** — not a demo account
         layered on production data — after which an agent can drive it end to
         end safely.

**1.6B — STAFF SIDE BUILT 2026-08-16. `/dashboard/contact` in Mission Control.**

The contact surface was not actually finished when `/contact` shipped: messages
landed in `contact_messages` and nothing read them. A queue nobody opens is the
same failure as the mailto it replaced.

- [x] Staff can read, triage and act on visitor messages. `new → in_progress →
      resolved`, with spam and reopen paths, gated at **OPS_MANAGER** and served
      only through the service role — the table stays RLS deny-all and holds a
      stranger's name, email and free text
- [x] Every status change writes to `mission_control_actions` via
      `logActionStrict`, so contact triage is covered by the existing audit log
      and revert engine rather than being a mutation nobody can trace
- [x] `handled_at` / `handled_by` clear when a message returns to `new`, so
      "nobody picked this up" stays distinguishable from "someone picked it up
      and did nothing" (Standing Rule 14 — a NULL is not an assertion)
- [x] Mission Control builds clean with the route registered

Caught during the build and worth keeping: `logActionStrict` takes `staff`, not
`actor`. The wrong key would have logged `actor_id: undefined` and thrown inside
the audit insert — turning a successful triage into a failed request *after* the
status had already been written. Exactly the class of silent-write bug Standing
Rule 18 exists for.

- [x] **Staff can now answer, not just triage (2026-08-16).** Reply opens the
      staff member's own mail client, pre-filled with a `Re:` subject and the
      original quoted. A queue that can only be marked resolved without anyone
      having resolved anything is not finished.

      Not a send-from-the-app feature, deliberately. A visitor who has not signed
      up has no identity and no inbox on ScoutIt, so a reply reaches them by
      email whichever route it takes — and routing it through the product means
      the staff member never sees the thread in their own sent mail, the visitor
      cannot simply reply to a human, and it needs new infrastructure to say
      something that can already be said.

- [ ] **Remaining for 1.6B: the realtime half.** What exists is a polled queue,
      not a live chat — staff read and triage, but there is no threaded reply to
      the visitor and no realtime push. Deciding factor before building it: a
      visitor who has not signed up has no identity and no inbox, so a "reply"
      has to go by email. **That now works** (Resend verified 2026-08-16), which
      makes an email reply the honest next increment rather than a socket.
- [ ] Decide the retention rule for visitor contact messages before the pilot.
      The SCOUTIT BIBLE commits to chat being ephemeral and deleted on close;
      confirm whether that governs staff support messages or only deal chat. It remains fully specced below, and now has its
storage pattern established by `contact_messages`.

### 1.6A Contact surface — the way a stranger reaches ScoutIt

There is currently no contact page. Reaching ScoutIt depends on `mailto:` links,
which was a deliberate earlier decision under the Connects model — but that
decision assumed a registered user inside the product, not a visitor who has not
signed up and has a question.

- [ ] Build `/contact` as a real route. Reachable from **both** the universal
      navigation menu and the footer (`src/components/layout/Footer.js`) — a
      contact surface that exists but cannot be found is the same as none
- [ ] Ship all four states (Rule: loading / empty / error / success). A contact
      form whose failure is silent is worse than no form: the visitor believes
      they have been heard. `InquiryModal.js` already did exactly this once and
      discarded every real inquiry behind a fake success message
- [ ] Do not publish a phone number, office address, or support mailbox that is
      not monitored. Publish only channels that are actually answered; the
      architecture block lists `support@scoutit.space` and physical addresses as
      **future placeholder modules**, and Standing Rule 3 forbids rendering what
      cannot be sourced
- [ ] Confirm whether `RESEND_API_KEY` is live before contact email is promised.
      As of 2026-08-16 this is the one production credential that could not be
      verified from outside, and `src/lib/email.js` states unset is the current
      production state. If it is unset, contact must not claim an email reply

### 1.6B Live chat into Mission Control — give the existing spec a queue

Implements the [[#CONTACT SURFACE & MMC LIVE CHAT ARCHITECTURE]] block, which
until now had no executable entry anywhere in this plan.

- [ ] Stream visitor chats from `/contact` into the Mission Control real-time
      operations queue; staff triage and reply from MMC
- [ ] **Keep this strictly separate from the post-Connect chatbox (1.6C).** They
      are different products for different people: this one is an unauthenticated
      stranger asking ScoutIt a question; that one is two identified parties
      transacting after a Connect is spent. Never let one inherit the other's
      identity, retention, or billing rules — Standing Rule 9 (a tier buys data
      about a property, never access to a person) governs the boundary
- [ ] Decide and record the retention rule for visitor chat before launch. The
      SCOUTIT BIBLE commits to chat being ephemeral and deleted on close; confirm
      whether that applies to staff support chat or only to deal chat
- [ ] Rate-limit and abuse-guard the intake. It is an unauthenticated write path
      reachable by anyone; `src/proxy.js` already classifies sensitive routes as
      fail-closed and this belongs in that set

### 1.6C Verify the post-Connect chatbox still works end to end

**Not new work — verification of a system already built and never re-proven.**
`src/components/dashboard/ChatBox.js` and `src/app/api/deals/{initiate,handshake,pitch}`
carry substantial existing logic (Connect spend, double-blind identity, the
handshake, the ledger, refunds). The owner's concern on 2026-08-16 was that this
logic is easy to break silently and has real value for ease of use.

- [ ] Rehearse the full path against real records: inquiry → Connect spent →
      chatbox opens → handshake → identity reveal → close. Standing Rule 15 — run
      the endpoint before trusting the UI built on it
- [ ] Confirm exactly **one** Connect is spent per initiation and the ledger
      agrees. `MockupChatbox.js` drifted to showing "3 Connects" once while the
      ledger charged 1; a mockup disagreeing with the product is how fabricated
      figures spread
- [ ] Confirm the double-blind rule still holds: accepted connections show a
      name, pending ones stay sealed. Verify against the live UI, not the spec
- [ ] Re-verify the 1-Connect refund path
- [ ] Either update `MockupChatbox.js` to match the shipped product or delete it.
      Its own header says: *"If you change either, update this or delete it."*

### 1.6D Per-page guided introduction — replace the single global wizard

The current guide is not per-page and not role-aware. `WIZARD_STEPS` in
`src/components/ui/FloatingToolbox.js` is one fixed four-card sequence — The
Descent, Space Directory, Roles & Connects, Your Profile — shown identically on
every page in the product, with no owner or broker variant. That is why it does
not land: it explains ScoutIt in general to someone who is standing on one
specific screen with one specific question.

- [ ] Replace the global constant with a per-surface guide manifest, one entry
      per surface, consumed by a single component. **One source, like the
      navigation manifest in §1.5** — never parallel copies that drift
- [ ] Author the property-page guide first, since it is the surface the owner
      named and the densest screen in the product: the chapter rail, the lens
      bar, the reach ring, the tilt and compass controls, the Vault, and what a
      Connect actually buys
- [ ] Make the guide **role-aware** for the three audiences named: seeker/buyer,
      owner, and broker. Derive the role from the verified Supabase session and
      server-approved roles — never from `scoutit_user` localStorage (§1.5 sets
      the same rule for navigation)
- [ ] Show it once, let it be dismissed, and let it be reopened deliberately. A
      guide that reappears on every visit is an obstacle; one that can never be
      found again is a missed explanation
- [ ] Meet the accessibility bar the rest of the product is held to: focus
      containment and restoration, Escape to dismiss, no hover-only affordance,
      reduced-motion honoured, and readable at 360px
- [ ] **Remove the developer role/tier switcher from the same component before
      launch.** It is currently revealed by tapping the eye five times or by
      `?dev=1`, and it writes a mock role and tier to localStorage. Its own
      comment says *"remove before launch — scaffolding."* Shipping a public
      control that changes a visitor's apparent entitlements is a gate defect,
      not a UI defect (Standing Rule 5 — a gate the client evaluates is a
      suggestion)

---

## 1.7 About page, founder letter, and the written-by-us voice (added 2026-08-16)

> **Full brief: [[../../01_IDENTITY_AND_VISION/ABOUT_PAGE_AND_FOUNDER_VOICE|ABOUT_PAGE_AND_FOUNDER_VOICE]].**
> That file holds the approved founder letter, the four opening scenarios, the
> page structure, the voice rules, and the money constraints. Read it before
> writing a line of this. Do not restate it here; this section is the queue.

> **Tier: owner to set.** Argument for T0: this is the first impression for
> visitors *and* investors, and the founder is recruiting a team off the back of
> it. Argument for later: it does not block an invited tester from using the
> product. Recommend T0 for the letter and copy, and the interactive build
> after the pilot, since the letter is cheap and the interactive comparison is
> not.

### 1.7A The letter and the copy

- [ ] Ship the approved founder letter. It is written and signed **Von**; treat
      changes as founder edits, not as a rewrite brief
- [ ] Render the four opening scenarios **as scenarios, never as testimonials**.
      Presented as real user quotes they are invented reviews, which would break
      the one thing this page is arguing
- [ ] Keep money claims exactly as ruled: looking is never charged, Starry is
      free forever and genuinely useful, depth/visibility/reaching a person are
      what cost. **No prices** — the pricing doc marks every figure placeholder
      until validated with real users
- [ ] Say nothing that implies a registered company. ScoutIt is operated by an
      individual until registration, which is deliberate and comes after demand
      is proven

### 1.7B The voice pass across the whole site

The founder's instruction was not limited to this page: existing copy reads as
AI-written and needs humanising. Most of it was drafted by agents.

- [ ] **Start with the homepage.** Founder ruling 2026-08-16: the voice pass is
      site-wide and the home page is explicitly included, not exempt as
      "already done". It is the page most people read and the one most likely
      to have been agent-drafted
- [ ] Sweep every other surface for the tells listed in the brief. **The em
      dash rule is necessity, not abolition** (founder correction 2026-08-17):
      remove the ones doing no work, keep the ones carrying a real break in
      thought. Test by replacing the dash with a full stop; if the meaning
      survives, it was decoration. Full worked example in 1.7B-AG below
- [ ] Audit headings site-wide for the same problem. Generated headings are
      uniformly balanced and say nothing specific
- [ ] Replace generic claims with specific ones wherever a specific one exists.
      "We saw a gap in the market" is generated; "I spent months digging through
      Maps for answers" happened
- [ ] Use "I" and never "we" in founder-voice copy while ScoutIt is one person

### 1.7B-AG — Agent execution brief: the voice pass (written for Google Antigravity / Gemini, 2026-08-17)

> **You are the agent. This section is self-contained.** It assumes no prior
> conversation. Read it fully before editing. If something here contradicts
> what you infer from the code, this file wins; raise the conflict rather than
> guessing.

#### What you are doing

Removing the AI-written texture from ScoutIt's user-facing copy, starting with
the **homepage**, then every other public surface. Most of this copy was drafted
by AI agents and reads like it.

You are **not** redesigning anything. Copy and micro-typography only. If you
find a layout or logic bug, write it down and move on.

#### Before you write a single word: load the skills

Two are installed at `.claude/skills/` in this worktree and both are mandatory
for this task:

| Skill | Path | Why |
|---|---|---|
| **taste-skill** (registers as `design-taste-frontend`) | `.claude/skills/taste-skill/skills/taste-skill/SKILL.md` | The anti-slop framework. **Section 14 is the pre-flight checklist — run every box.** |
| **impeccable** | `.claude/skills/impeccable/` | Loads PRODUCT.md + DESIGN.md + the brand register. Run `node .claude/skills/impeccable/scripts/context.mjs` first |

Originals live at `.agents/skills/` in the repo root if the worktree copies are
missing.

#### The em dash rule, stated correctly

**Do not delete every em dash.** An earlier pass of this plan said "banned
outright" and that was wrong. Prose that contorts around missing punctuation
reads as strange in its own way.

**The tell is the unnecessary one.** AI reaches for a dash where a full stop, a
colon, or nothing would do, because it is a cheap way to sound considered.

**The test:** replace the dash with a full stop and reread. If the meaning
survives, the dash was decoration. Remove it.

Worked example, already applied to `src/app/page.js`:

```
❌  We turn every kind of space — homes, offices, venues, restaurants — into
    clear, verified intelligence.
✅  We turn every kind of space into clear, verified intelligence. Homes,
    offices, venues, restaurants.
```

The dashes were fencing a plain list. Removing them shortened the sentence and
the fragment gives the paragraph a short beat between two long ones.

#### The other tells, in priority order

1. **Rhythm.** The strongest signal and the one most agents miss. AI writes
   sentences of near-identical length with balanced clauses. Humans write a long
   winding one and then a short one. Vary it deliberately.
2. **"Not just X, it's Y."** Delete on sight.
3. **Three-item lists where two would do.**
4. **Opening with "Here's the thing."**
5. **Vocabulary nobody says aloud:** robust, seamless, leverage, delve,
   comprehensive, elevate, unlock, empower, transformative, cutting-edge.
6. **Generic claims where a specific one exists.** "We saw a gap in the market"
   is generated. "I spent months digging through Maps for answers" happened.

#### Order of work

1. `src/app/page.js` — the homepage. **Start here.** Founder ruling: the home
   page is explicitly in scope and not exempt for looking finished.
2. `src/app/about/`, `src/app/enterprise/`, `src/app/pricing/`
3. Property page chapter copy under `src/components/property/`
4. Dashboard empty states and helper text
5. `src/app/terms/`, `src/app/privacy/` — **STOP. Do not touch these.** They are
   under a documentation-only hold (§1.7D) pending a legal audit. Changing the
   voice of a legal page risks changing what it says.

#### Hard constraints

- **"I", never "we", in founder-voice copy.** ScoutIt is one person today.
- **Never invent a fact, number, testimonial, or capability.** If copy claims
  something you cannot verify in the code, flag it; do not smooth it over.
- **The mono-uppercase chapter eyebrows (`01 — THE SPACE`) are a locked brand
  system**, per `AGENTS.md` and PRODUCT.md principle 5. Generic anti-eyebrow
  guidance does **not** apply to them. Leave them.
- **Do not touch the 95/5 dark-to-gold ratio, the palette, or the type scale.**
- Copy changes only. No component restructuring.

#### How to verify

```bash
npm run build          # must compile
```

Then check the surface you changed at 390px and 1280px, and confirm no string
overflows its container. `src/app/page.js` is the highest-risk file for that
because the hero uses large `clamp()` scales.

**Known issue, not yours:** the build may fail in `src/app/globals.css` with
`TypeError: __turbopack_context__.a is not a function`. That is `.next` cache
corruption, present before this work and reproducible with all changes stashed.
Fix with `rm -rf .next && npm run build`. Do not chase it into postcss config.

#### Uncommitted work in the tree as of 2026-08-17

Five files carry finished, browser-verified changes that are **not yet
committed**. Do not revert them:

- `src/components/layout/Header.js` and `ambient/AmbientRail.js` — mobile header
  fix: the ambient rail was being handed 28px to render 93px of text
- `src/app/layer/layer-descent.css`, `src/components/board/BoardPodium.js`,
  `src/app/layer/orbit/page.js` — layer 2 mobile fix: the responsive rules
  targeted `.board-*` classes while the markup renders `.descent-*`

### 1.7C The interactive build

- [x] **DECIDED 2026-08-16: build new. Do NOT revive the parked UFO origin
      scrollytelling.** It was tried before and it did not work. The reason is
      worth keeping: scrollytelling is a *narrative* device that tells the reader
      a story about the company, and this page needs an *evidence* device that
      shows the product and lets the reader conclude for themselves. The parked
      concept stays parked as brand material
- [ ] Interactivity must prove the argument, not decorate it. The strongest
      available demonstration is a typical PH listing beside a ScoutIt one, with
      the visitor able to move between them
- [ ] **Animation is a layer, never a dependency.** Write the copy so it reads
      perfectly with every animation switched off, then add motion on top. This
      is the likely reason the earlier scrollytelling failed: it made the
      animation load-bearing, so when scroll behaved badly on a phone the page
      became nonsense. Full direction in the brief
- [ ] **Stick figure first, black hole later** (recommendation, founder to
      confirm). The walking figure is a few lines with the already-installed
      `framer-motion`, costs almost nothing, and matches a letter about doing
      the work by hand. Keep the walk cycle frame-based rather than smoothly
      interpolated: slight jank reads as hand-drawn, perfect smoothness reads as
      computed
- [ ] If the WebGL version is ever built, **reuse `BlackHoleCanvas.js`** — it
      already exists at 551 lines, alongside `EventHorizonCanvas` and six
      background canvases. Lazy-mount it through `InViewport`, gate it behind
      Lite Mode and `prefers-reduced-motion`, and test on a mid-range Android at
      320px. Three.js alone blows the 150kb landing-page JS budget several times
      over, which is fine on the descent pages and is not fine here by default
- [ ] Meet the same bar as the rest of the product: 320px up, keyboard operable,
      reduced-motion honoured, no motion that blocks reading

### 1.7D Legal surfaces — DOCUMENTATION ONLY FOR NOW

> ⚠️ **Founder instruction 2026-08-16: document, do not execute.** Nothing in
> this subsection is authorised to be built, rewritten, or published yet. The
> task right now is to establish what actually exists and whether it is correct.
> Drafting new legal text before that audit would be writing over an unknown.

**The order the founder set:** look at what we have right now, then look at
everything, and confirm what we have is the right and correct way. Audit before
authorship.

- [ ] **The privacy policy is the urgent one, not the Terms.** RA 10173 applies
      to whoever is processing personal data, registered or not. Signups,
      property inquiries and the new contact form are already collecting it
- [ ] **Build the data inventory first.** A truthful privacy policy is impossible
      without one, and almost nobody writes it first, which is why most privacy
      policies are fiction. Enumerate from the codebase: every field collected,
      where it is stored, and every third party it reaches. The current
      processor list includes Supabase, Airtable, Mapbox, Cloudflare Turnstile,
      Google Analytics, Sentry, Upstash, Vercel, Resend and Gemini — ten
      disclosures owed to users
- [ ] That inventory is the artefact to hand to counsel or a PH-law-focused
      review later. It turns their job from guessing into checking, and it can be
      produced today without registration or a lawyer
- [ ] Audit the existing `/terms` and `/privacy` pages against what the product
      actually does. The founder's note: these were written earlier and need
      tightening against "what we actually have and use and get from others"
- [ ] Designate a Data Protection Officer. It can be the founder. Already open
      in [[MASTER_OWNER_ACTIONS]] as part of the legal gate

---

# PHASE 2 — CONTROLLED PILOT SAFETY

## 2.1 Authentication and onboarding truth

- [x] Tell users before the final onboarding step that email confirmation is
      required; test resend, expiry, wrong-email recovery, and confirmed login
- [x] Verify a production dashboard requires a real Supabase session and cannot
      treat `scoutit_user` local storage as authentication
- [x] Keep demo/mock mode isolated from real APIs and impossible to enable in
      production accidentally
- [x] Rename or remove the production-facing “Dev Mode: Bypass Paywall” label;
      enforce real server entitlements before charging
- [x] Confirm Supabase Google provider credentials for Mission Control, or hide
      its Google button until the provider is enabled
  - Google remains hidden behind `NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED`; payments remain inactive. Evidence: `07_PHASE_2_1_AUTH_PILOT_SAFETY_2026-08-11.md`.

## 2.2 Real-device stranger pass

Use an iPhone, Android device, and 1280px desktop. Record device/browser beside
every result. Turn `pre_launch_free_mode` off when testing entitlements.

- [ ] Test inbox wait/decline/withdraw/archive/reopen lifecycle
- [ ] Test public profiles after RLS lockdown
- [ ] Test mobile browser toolbar, safe-area, keyboard, `100dvh`, and scroll traps
- [ ] Test signup age gate, existing-account continuity, and privacy settings
- [ ] Test real subscriber entitlement behavior
- [ ] Test lister declaration/publishing at 360, 390, 768, and 1280 pixels
- [ ] Test header, directories, Intel, CRM, calendar, showcase, and discovery for
      clipping and horizontal overflow
- [ ] Keyboard-tab one full dashboard mode and record focus/semantic defects

## 2.3 Finish or close remaining partial systems

- [x] Build and mount the staff property-verification UI (`W12`)
- [x] Add wishlist share-link revocation (`C17`)
- [x] Reverify profile URL schemes; add a canonical redirect only if competing
      live schemes still exist
- [ ] Remove the Rickroll/test video record from Airtable if it is still present
- [x] Add privacy-safe telemetry for FAQ answers blocked by the contact-leak
      filter: rule code and context, never the blocked text

Phase 2.3 engineering evidence is recorded in
`08_PHASE_2_3_PARTIAL_SYSTEMS_2026-08-11.md`. C17 is implemented and its
checksum-locked Mission Control activation is ready, but the migration is not
live until the owner runs that audited operation. The Rickroll cleanup remains
open: six Airtable records were found and the existing owner-confirmed media
cleanup operation now classifies all six as invalid.

## 2.4 Property and child-space clarity

- [x] Add an explicit level label to property and child-space pages
- [ ] Correct test records where parent and child use conflicting space meanings
- [x] Preserve category-natural labels such as Units, Available Spaces, Rooms &
      Facilities, Areas, and Zones

Phase 2.4 engineering evidence is recorded in
`09_PHASE_2_4_PROPERTY_HIERARCHY_2026-08-11.md`. Six invalid sample child rows
were identified and the exact Mission Control cleanup is ready. The test-record
checkbox remains open until the owner runs it and the post-write scan is clean.

## 2.5 Operational security checks

### 2.5.0 Table GRANTs were never audited — money tables fixed 2026-08-16, rest OPEN

**This section had 35 items and none of them looked at the grant layer.** Every
prior database review — including the 2026-08-13 three-platform audit — examined
RLS policies. RLS is the *second* gate. The first is the SQL `GRANT`, and on the
billing tables it was wide open to the public.

Measured on the live database, before the fix:

| Table | `anon` (not signed in) | `authenticated` |
|---|---|---|
| `connect_balances` | SELECT, INSERT, UPDATE, DELETE, **TRUNCATE**, REFERENCES, TRIGGER | identical |
| `connect_transactions` | SELECT, INSERT, UPDATE, DELETE, **TRUNCATE**, REFERENCES, TRIGGER | identical |
| `subscriptions` | SELECT, INSERT, UPDATE, DELETE, **TRUNCATE**, REFERENCES, TRIGGER | identical |

`TRUNCATE` empties the table. `anon` is a visitor who has not logged in.

`subscriptions` carries this comment in its own schema — *"RLS deny-all BY
DESIGN. Service-role only. Billing state must never be client-writable - it is
the paywall"* — while granting TRUNCATE to anonymous callers. The intent was
written down correctly and enforced in only one of the two places it needed to be.

**Not exploitable when found.** RLS denied the writes, verified by reading the
policies. The defect is that RLS was the *only* thing denying them: one mistaken
policy edit, or one migration that drops a policy, turns the paywall into a
public write endpoint. The plan already flags 41 `multiple_permissive_policies`
as "the effective access rule is written down nowhere" — this is the same
exposure one layer lower, and worse, because a grant needs no policy to be
reached.

- [x] **Fixed 2026-08-16** — migration `lock_down_money_table_grants` applied to
      production. `anon` now holds nothing on any of the three.
      `authenticated` keeps SELECT on the two wallet tables only, because the
      existing "read your own balance / transactions" policies scope it to the
      caller's own rows; `subscriptions` has zero policies, so its SELECT grant
      was dead surface and went too. `service_role` retains full access, which
      is how every legitimate write already happens.

      Verified before applying: no client-side read or write of these tables
      exists anywhere in `src/`. Every path goes through `supabaseAdmin`
      (`spend_connects`, `/api/admin/connects-refund`,
      `/api/auth/complete-onboarding`). Verified after: grant matrix re-read from
      `has_table_privilege`, live site healthy, `/`, `/property`, `/dashboard`
      and `/api/cms` all 200.

#### The part that is still open

The three money tables were fixed because they are the paywall and the owner
asked for those specifically. **They are almost certainly not the only ones.**
A uniform `SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` across
three unrelated tables is the signature of a blanket `GRANT ALL ... TO anon,
authenticated` in an early migration, not of three separate decisions.

- [x] **DONE 2026-08-20 — the query below was run against production, read-only.
      The finding is recorded here rather than fixed, because the owner ruled the
      same day that the lockdown belongs to the single security overhaul at the
      end, not to pre-pilot work.** Do not re-run this as discovery; re-run it as
      verification when the overhaul happens.

      | Measured | Value |
      |---|---|
      | Tables in `public` | **59** |
      | Granting `anon` SELECT + INSERT + UPDATE + DELETE + TRUNCATE | **55** |
      | RLS enabled with **zero** policies (deny-all is the only gate) | **20** |
      | RLS **off** *and* anon-writable — no gate at any layer | **1** |

      The hypothesis in this section was right: a uniform grant across 55
      unrelated tables is one blanket `GRANT ALL … TO anon, authenticated`, not
      55 decisions. The three money tables fixed on 2026-08-16 are the only
      exceptions in the whole schema.

      **The one that is not merely theoretical: `spatial_ref_sys`.** It is the
      single table with RLS *off* and full anon write grants, so unlike the other
      54 there is no second gate behind the grant. Confirmed reachable: an
      anonymous REST read through the public API returned rows. **A write was
      deliberately not attempted** — the grant matrix plus RLS-off is proof
      enough, and the test itself would be the damage. Prior audits called this
      "a PostGIS reference table, not a live data leak", which is true of
      *reading* and was never checked for *writing* — Standing Rule 18 exactly.
      PostGIS reads this table for every coordinate transform, so emptying it
      breaks the maps rather than leaking anything.

      **The other 20 hold, today.** Probed `verification_requests` and
      `deal_messages` anonymously: both correctly returned empty. They are one
      dropped policy away from public, which is the argument for two gates, not
      evidence of a live hole.

- [ ] **Audit the grant layer for every table in `public`.** One query answers
      it — this is the "how to re-check it in one command" rule from the
      2026-08-16 addendum, applied to grants:

      ```sql
      select c.relname, r.rolname,
             string_agg(distinct p.priv, ', ' order by p.priv) as granted
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      cross join (values ('anon'),('authenticated')) as roles(rolname)
      join pg_roles r on r.rolname = roles.rolname
      cross join lateral (select unnest(array[
        'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'
      ]) as priv) p
      where n.nspname = 'public' and c.relkind = 'r'
        and has_table_privilege(r.rolname, c.oid, p.priv)
      group by c.relname, r.rolname
      order by c.relname, r.rolname;
      ```

- [ ] Expect the 19 `rls_enabled_no_policy` tables to be the sharpest cases.
      Those are sealed by deny-all RLS *and nothing else*; if they also carry
      write grants, each is one dropped policy away from public. Several hold
      exactly what must never be client-reachable — `verification_requests`
      (identity documents), `deal_disputes`, `file_scans`, `brain_chunks`.
- [ ] Prefer revoking to the narrowest grant that keeps the product working,
      then let RLS narrow further. Two gates, not one.
- [ ] **Add a grant assertion to the release checks.** A finding fixed by hand
      returns the next time someone writes `grant all` for convenience. This is
      cheap to assert and expensive to rediscover.

> **Why this was missed for so long, and it is not carelessness:** Supabase's own
> advisor lints RLS thoroughly and does not lint grants at all. Every review that
> trusted the advisor inherited that blind spot — including this file's
> §1.0E, which ranked 30 security findings and contains no grant row. A tool's
> coverage silently becomes the audit's scope unless someone checks what the tool
> does not look at.


- [ ] Confirm the anonymous `property_photos` upload policy was actually removed;
      apply the prepared migration if it remains
- [ ] Confirm `supabase_rls_hardening.sql` or its replacement is live and record
      the policy evidence
- [ ] Enable Vercel Deployment Protection for Mission Control and add `noindex`
      response protection if it remains externally reachable
- [ ] Inventory/export every live GoDaddy DNS record before any nameserver change;
      preserve Vercel, `www`, Google verification, OAuth, and future mail records
- [ ] Stage `scoutit.space` in Cloudflare, compare the imported zone record by
      record, and prepare a rollback before changing nameservers
- [ ] Before any human testing, migrate authoritative DNS to Cloudflare, verify all
      live hostnames/canonicals, then enable DNSSEC correctly
- [ ] Keep public `scoutit.space` and `www` DNS-only to their Vercel project;
      use Cloudflare for authoritative DNS/email routing without stacking a reverse
      proxy in front of the public Vercel application
- [ ] Enable Vercel Bot Protection on the public project in log mode first; verify
      Googlebot, Search Console, sitemap, monitoring, and legitimate API traffic
      before switching malicious non-browser traffic to challenge mode
- [ ] Configure the public project's native Vercel WAF/custom rules and retain
      Attack Challenge Mode as the emergency whole-site response
- [ ] Record a future escalation trigger for orange-clouding the public site only
      if measured attacks prove Vercel's native controls insufficient; re-test bot
      detection, caching, client IPs, SEO crawlers, webhooks, and `.well-known` paths
- [ ] Route the separately deployed `mc.scoutit.space` hostname to the Mission
      Control Vercel project through Cloudflare proxy and protect only that hostname
      with Cloudflare Access, exact-email rules, MFA, and device posture
- [ ] Verify public-site traffic is never accidentally put behind an Access login
      and Mission Control is never reachable by bypassing its protected hostname
- [x] Add `Permissions-Policy: display-capture=()` to Mission Control to prevent
      the site and its embedded content from initiating the browser Screen Capture API;
      document that this does not block OS screenshots or external recording tools
- [x] Add Mission Control-only print deterrence: redact sensitive content in
      `@media print`/print preview and show an explicit printing-prohibited notice
- [x] Add a persistent, non-obstructive watermark to sensitive Mission Control
      surfaces containing the named staff identity, timestamp, and audit/session reference
- [x] Redact or blur sensitive Mission Control content when the tab/window loses
      visibility and require re-authentication after risky focus/session changes
- [x] Send privileged responses with no-store/private cache controls and ensure
      sensitive values are never placed in URLs, client logs, or downloadable HTML
- [x] Do not implement fake protections such as right-click blocking, text-selection
      blocking, or Print Screen key interception as security controls
- [ ] Test normal print, print preview, browser PDF export, browser-initiated display
      capture, OS screenshot/recording limitations, watermark visibility, tab switching,
      accessibility, and recovery from false-positive redaction
- [ ] Treat actual capture prevention as a future managed-device/native-app control;
      use Android `FLAG_SECURE` or equivalent platform controls only when such a
      client exists and verify platform limitations before making any guarantee
- [ ] Require each staff member to create and privately control one dedicated free
      ScoutIt-only Gmail account; prohibit shared accounts, personal Gmail
      destinations, and founder access to passwords/MFA secrets
- [ ] Enroll authenticator-app MFA on every dedicated Gmail account and verify
      recovery before connecting it to ScoutIt
- [ ] Give recovery codes only to the named staff member and verify offline storage
      without copying the codes into ScoutIt documents, chat, email, or logs
- [ ] Enforce immediate recovery-code regeneration after any code is used; suspend
      access and re-verify identity if the codes or authenticator device are lost
- [ ] Configure one individual `firstname.lastname@scoutit.space` Email Routing
      alias per staff member, forwarding only to that person's dedicated ScoutIt Gmail
- [ ] Keep role addresses as non-login forwarding aliases; reject them in Supabase
      staff invitation and Mission Control IAM flows
- [ ] Put Cloudflare Access in front of Mission Control with exact-email allow rules
      and a second authentication check
- [ ] Enroll approved personal devices with the Cloudflare One Client in posture-only
      mode and bind each device to its named staff identity
- [ ] Require screen lock, disk encryption where supported, current OS/security
      updates, no shared device profile, and a healthy enrolled-device posture
- [ ] Block unknown or failed-posture devices; require explicit approval for every
      new/replacement device and immediate revocation for loss or staff offboarding
- [ ] Enforce a maximum of two persistent recognized devices per staff account:
      one computer and one phone; expire and reapprove them every 90 days
- [ ] Implement additional-device approval as a single 24-hour authorization;
      auto-revoke it at expiry and require a completely new approval before reuse
- [ ] Test approved, third-device, expired temporary, reused temporary, unknown,
      unhealthy, revoked, reinstalled, and cloned-device cases
- [ ] Invite the same alias through Supabase, grant its Mission Control role
      separately, and require Supabase TOTP MFA / `aal2` for staff operations
- [ ] Test denial for unknown email, valid email without role, role without MFA,
      revoked staff, forwarded-link reuse, and lost-device recovery
- [ ] When Google Workspace Business Starter is activated, provision each managed
      mailbox at the existing `name@scoutit.space` identity, replace forwarding
      with Google mail delivery, enroll fresh authenticator MFA, and verify that
      Supabase identity, Mission Control role, and audit ownership remain unchanged
- [ ] Remove every temporary free Gmail from aliases, recovery methods, OAuth, and
      ScoutIt systems; after the 30-day recovery window, verify no dependency remains
      and require the staff member to permanently delete the temporary account
- [ ] After the fail-closed cron fix in 1.0, verify anonymous/wrong-secret requests
      cause no write and the next authenticated scheduled run succeeds exactly once
- [ ] Exercise one Connect correction/refund: non-admin rejection, authorized
      correction, ledger entry, and final balance
- [ ] Review the audit's dependency reachability report and approve the verified
      Mission Control/main-app patches; do not treat the old undifferentiated
      Dependabot count as the acceptance criterion
- [ ] Decide whether to add the optional VirusTotal scanner key; keep local
      validation mandatory either way

Phase 2.5 engineering and public-read evidence is recorded in
`10_PHASE_2_5_OPERATIONAL_SECURITY_2026-08-11.md`. The six checked Mission
Control safeguards pass source tests and a production build, but deployment and
physical capture-limit testing remain open. Supabase policy state is intentionally
unverified until server-only management evidence is available. The public DNS
snapshot is not a registrar zone export. Payments remain inactive and are outside
this phase.

## 2.6 Controlled human pilot

- [ ] Add a reliable test-cohort marker so tester accounts, submissions, listings,
      inquiries, saves, Connect activity, and other writes can be identified later
      Engineering is ready: a private two-table user-ID registry is checksum-locked,
      RLS/privilege protected, backup-gated, and exposed only through an audited
      Super-Admin operation. Keep open until it is applied and live membership is verified.
      Evidence: `11_PHASE_2_6_CONTROLLED_PILOT_2026-08-11.md`.
- [ ] Provision valid temporary testing email identities controlled by the testers
- [ ] Verify testers can complete all non-payment production workflows while payment
      controls remain visible, disabled, and labelled unavailable during testing
      Local payment-boundary evidence passes 14/14 across onboarding and all pricing
      surfaces at mobile/desktop widths. Keep open until authenticated production
      workflows are exercised by the invited cohort. Evidence:
      `11_PHASE_2_6_CONTROLLED_PILOT_2026-08-11.md`.
- [ ] Route every sample inquiry/notification only to designated test recipients
      Engineering now enforces this before inquiry/pitch/question writes and again
      at the shared in-app/email notification boundary. Keep open until the live
      UUID allowlist is set and delivery is verified. Evidence:
      `11_PHASE_2_6_CONTROLLED_PILOT_2026-08-11.md`.
- [ ] Permit real authentication email only; require sample phone numbers, listings,
      profiles, and other public contact details
  - Local engineering now derives active tester provenance from the private cohort
    registry, exposes only a boolean, visibly labels directory cards and individual
    profiles `SAMPLE PROFILE — FOR HUMAN TESTING`, and emits `noindex,follow` metadata.
    Focused contracts pass 15/15. Keep the parent item open until the registry is
    owner-applied, a real enrolled profile is verified live, and tester-entered public
    fields are observed to contain sample data only.
- [ ] Test with 5 owners, 5 seekers, 2–3 brokers, and 2 photographers/researchers
- [ ] Tell testers before entry that their ScoutIt account is temporary and will be
      deleted at launch; notice is required, separate deletion consent is not
      The pre-authentication entry screen now gives this notice and also states that
      the external email remains theirs, public/contact data must be sample, and
      payments are inactive. Keep open until the deployed notice and briefing are used.
- [ ] Do not explain the product first; observe where people stop or lose trust
- [ ] Collect a short feedback form and written observation notes; do not retain raw
      screen/audio/video recordings
- [ ] Remove personal information from notes before using AI to turn them into
      reproducible defects and fix tasks, not new feature ideas
- [ ] Keep all mock/sample data after this test so it remains available for
      further human-testing rounds
- [ ] Confirm every mock/sample surface on live `scoutit.space` explicitly says
      **SAMPLE DATA — FOR HUMAN TESTING** and cannot be confused with verified
      real inventory or user data
      Local rendered evidence passes 20/20 across 390px and 1280px, including all
      seven known sample listings and Discover. Keep open until the same audit passes
      on deployed `scoutit.space`. Evidence: `11_PHASE_2_6_CONTROLLED_PILOT_2026-08-11.md`.

## 2.7 Pilot communications and monitoring

- [ ] Set `RESEND_API_KEY`, verify the sending domain, and receive a real email.
      This is ScoutIt's transactional notification transport; Supabase Google/Gmail
      sign-in is a separate authentication path and does not send these messages
- [x] Complete one real Google sign-in from `www.scoutit.space/onboarding` and verify
      the Supabase callback returns to the custom domain rather than a Vercel alias.
      Owner completed this on 2026-08-09; the discovered `seeker`/`buyer` UI alias
      mismatch was corrected in production deployment `dpl_8wmmVPJfj7Eyyfmga2k6BmRJFZBd`
- [x] Implement the authentication-first new-user contract: explicit completion
      marker; private full name and date of birth; exactly one initial role
      (`buyer`/`seeker`, `owner`, or `broker`); optional private buyer location;
      conditional PRC format gate; wallet-before-completion ordering; and dashboard
      redirection for incomplete accounts. Prepared migration:
      `supabase/migrations/20260809000002_onboarding_completion_contract.sql`.
      This code is complete locally but must not deploy before the owner-gated
      migration and backfill are applied and verified
- [x] Build the audited Mission Control onboarding migration operation. The
      Super-Admin-only workspace verifies the exact SHA-256, previews schema and
      backfill counts, requires a current Supabase backup/PITR point, checks that
      private onboarding fields are absent from public views, records immutable
      intent/completion/failure events, and fails closed on drift. It exposes no
      SQL editor or caller-provided query. Local implementation is complete;
      owner must add the MMC-only Management API token, deploy MMC, and apply the
      operation there. Neither engineering nor the owner applies it directly in
      Supabase
- [x] Remove browser-only role self-granting for real accounts. Existing
      server-approved multi-role accounts remain switchable; only the explicit
      `master-dev` toolbox account retains local activation controls
- [ ] Build an authenticated server-side additional-role activation workflow with
      eligibility/credential checks, audit history, and Mission Control review where
      required. Do not restore localStorage-only role activation
- [ ] Confirm Turnstile site/secret keys and GA environment variables in production;
      verify Turnstile after the CSP fix rather than accepting variable presence alone
- [ ] Deliberately test the error-monitoring path before inviting users
      Engineering is ready: Next.js 16 instrumentation is current, Replay is off,
      failed reports no longer show success, and both local development and
      production-mode E2E telemetry are disabled. The exact legacy Node
      `abortIncoming`/`Error: aborted` signature and Next renderer
      `The destination stream closed early.` signature are discarded only when
      their framework stream stacks match, without suppressing application
      exceptions. Focused monitoring/privacy tests pass 11/11, lint is clean, and
      the 113-route production build passes. Keep this open until one sanitized
      deployed-production event is visibly received in Sentry.
- [ ] Record support owner, incident path, pilot feature flags, and rollback steps
- [ ] Observe clean logs and support behavior before widening the cohort

---

# PHASE 3 — DATA TRUST AND INVENTORY SCALE

## 3.0A Post-pilot engineering hygiene

- [x] Resolved `/hubs/[slug]` static-generation versus no-store Upstash warnings.
      The CMS Redis client no longer forces ISR callers dynamic; the regression
      contract passes, the clean 113/113 build emits no Upstash warning, and all
      three hub routes are reported as SSG with a one-hour revalidation interval
- [ ] Remove duplicate root environment-variable definitions after verifying the
      authoritative value in the deployment dashboard; never copy values into docs.
      Name-only inventory confirms two occurrences each for `CRON_SECRET`,
      `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
      `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN`; owner verification
      is recorded in `OWNER_ONLY_ACTIONS.md`
- [ ] Review nonce/hash CSP hardening after Turnstile works; do not accept
      `unsafe-inline`/`unsafe-eval` as the permanent production policy

## 3.0 Actual launch cutover — remove mocks here, not during testing

Run this only when the founder explicitly declares the real public launch.

- [ ] Back up or archive the human-testing dataset if it will be useful later
- [ ] Export only the testing findings/audit evidence that must be retained, then
      delete tester accounts and clean or anonymize all marked test-cohort activity
- [ ] Revoke tester sessions and verify deleted tester identities cannot sign in
- [ ] Create and verify separate staff email identities before granting any admin access
- [ ] Enable each approved identity explicitly in Mission Control with the minimum
      required role; verify default denial, re-authentication, audit logging, and revocation
- [ ] Disable production mock/demo flags
- [ ] Remove production-visible mock records, simulated unlocks, hard-coded test
      identities, and invented data fallbacks
- [ ] Verify every affected surface now uses real data or an honest empty state
- [ ] Keep reusable test fixtures only in isolated development/test environments

## 3.1 Separate development from production

Complete before the first real owner draft or real signup is allowed to become
operational data.

- [ ] Create `scoutit-dev` as a separate Supabase project
- [ ] Replay repository migrations into a clean database
- [ ] Define development seed data, backup, restore, and rollback discipline
- [ ] Repoint local development to the dev project
- [ ] Prove development/test activity cannot mutate production

## 3.2 Implement and prove the three-sentinel contract

### Mission Control authoring boundary

- [ ] Define one server-side authorization function for every MMC mutation using
      authenticated user ID, `aal2`, active staff role, action, property, and scope
- [ ] Remove all authorization decisions based on browser state, hidden controls,
      submitted role/owner fields, email possession alone, or raw admin booleans
- [ ] Route privileged Airtable, Supabase service-role, and future R2 operations through
      server-only adapters with separate least-privilege credentials
- [ ] Add append-only audit events for privileged create, update, verify, publish,
      unpublish, entitlement correction, media access, and denial outcomes

### Publication boundary and Airtable projection

- [ ] Classify every field and asset as public, entitled, private owner, staff-only,
      or internal; make unclassified additions fail closed
- [ ] Make `/api/dashboard/publish` reload canonical Supabase rows and authorize the
      actor instead of trusting the submitted property body
- [ ] Serialize authoritative `property_units` into one schema-versioned `Units_JSON`
      mirror per Airtable property; enforce stable unit IDs, validation, payload limits,
      deterministic ordering, and round-trip tests for properties with hundreds of units
- [ ] Keep typed Airtable discovery/filter fields alongside `Units_JSON`; do not recreate
      the deleted Airtable `UNITS` table unless cross-property unit search and its paid
      record cost are explicitly approved
- [ ] Allow only deliberately public media URLs or stable asset IDs into Airtable;
      reject signed URLs, private bucket paths, secrets, and permission metadata
- [ ] Add an idempotent publish ledger with property ID, version/hash, actor, attempt,
      Airtable record ID, read-back slug, outcome, and retry/rollback status
- [ ] Reject partial or stale publishes and prove a failed Airtable sync cannot mark the
      Supabase version as published

### Retrieval and entitlement boundary

- [ ] Split the public CMS response from authenticated entitled property reads; the
      anonymous `/api/cms` route must never return premium `deepIntel`, Vault fields,
      private contacts, internal provenance, or direct gated media locations
- [ ] Replace whole-CMS browser downloads with targeted server/RSC reads and explicit
      allowlist projections for anonymous, tiered subscriber, owner, and staff contexts
- [ ] Resolve user, current subscription/tier, role, property relationship, and asset
      classification from Supabase for every restricted read; ignore client tier claims
- [ ] Return the public projection when entitlement services fail or disagree; never
      fail open to the richest Airtable record
- [ ] Resolve gated media by opaque asset ID after authorization and issue minimum-scope,
      short-lived access; do not persist signed URLs in Airtable, Supabase records, HTML,
      analytics, referrers, errors, or logs
- [ ] Partition caches by projection and authorization context; mark owner/staff/private
      responses `private, no-store` and prove they cannot enter a shared CDN cache

### Adversarial proof before real premium data

- [ ] Test anonymous curl/API access, lower-tier access, expired/cancelled subscription,
      revoked role, wrong owner, wrong property/asset pairing, modified asset ID, and
      direct object-path guessing
- [ ] Test cache bleed between anonymous, subscriber tiers, owner, and staff sessions,
      including logout, entitlement downgrade, and revocation
- [ ] Test MMC bypass by direct API request, forged role/owner/tier fields, stale session,
      missing MFA, unhealthy device, replayed publish request, and concurrent unit edits
- [ ] Compare every response against the field/asset classification allowlist and fail
      CI when a new Airtable/Supabase field can reach a broader projection by default
- [ ] Record evidence that UI locks and network responses agree before any real premium,
      owner-private, or ScoutIt-created Vault data is loaded

## 3.3 Category and hierarchy schema hedge

Keep the chosen property-with-child-rows model; do not rewrite into a graph now.

- [ ] Add nullable self-referencing `parent_id`
- [ ] Add `space_type`: unit, floor, amenity, room, suite, common_area, facility,
      parking, zone, or custom
- [ ] Define explicit property/building subtype vocabulary
- [ ] Define category-aware intelligence schemas
- [ ] Define canonical parent/subtype URL rules
- [ ] Define public, Connect-gated, and internal field boundaries
- [ ] Add migration, backfill, rollback, and compatibility tests

## 3.4 Field-level provenance and retention

- [ ] Store source, verifier, checked-at, confidence, and methodology per field
      where applicable
- [ ] Use the existing provenance vocabulary consistently
- [ ] Preserve contradictory/negative evidence in Fine Print
- [ ] Distinguish natural imagery from enhanced imagery
- [ ] Map legacy `published_rent` to the canonical owner-confirmed rent key
- [ ] Decide whether legacy `source` is provenance metadata or a display field,
      then map or retire it
- [ ] Set retention/anonymization rules for hidden FAQ content and implement a
      manual privacy-erasure path
- [ ] Log exports of lead PII with actor, subject, time, and purpose

## 3.5 Resolve product rules before scale

- [ ] Define and test one defensible listing-ranking formula before promising
      placement; include freshness, strength, paid promotion, distance, and recency
- [ ] Define FAQ Silver semantics: distinguish licensed Advisor Spec from
      self-declared Contributor, or document the approved interim rule
- [ ] Decide whether delegated brokers may attest freshness; if yes, store who
      verified it
- [ ] Add a global per-user FAQ daily cap alongside the per-property cap
- [ ] Measure Google Meet NULL-link frequency before considering guest-host fallback

## 3.6 Reach honest supply and learn

- [ ] Build the property-acquisition operating system: intake, evidence,
      verification, freshness, SEO readiness, and handoff
- [ ] Run a five-property pilot through that system
- [ ] Publish 3–5 plain, sourced intelligence briefings before building an
      interactive newsroom framework
- [ ] Establish profile/roster acquisition and verification operations
- [ ] Progress toward 200 real approved listings; report verified count separately
      from samples, drafts, and stale inventory

---

# PHASE 4 — PRODUCT DEVELOPMENT AFTER PILOT STABILITY

These are approved directions, but none may interrupt an earlier open phase.

- [ ] Owner dashboard intelligence: deterministic Listing Strength, checklist,
      missing-field guidance, Market Badges, and Demand Meter
- [ ] Badge ecosystem: collection/rarity UI with server-authoritative claims and
      anti-forgery tests
- [ ] AI Assimilation: send headers plus three sample rows to the model, then apply
      the returned mapping locally to the complete import
- [ ] Multi-model parsing: economical extraction, programmatic normalization,
      higher-reasoning synthesis, source verification, and spend caps
- [ ] Wire the public product to approved Mission Control feature-gate and badge
      definitions only after authority/caching rules are proven
- [ ] Add Mission Control's Airtable approval gate and verify all mutations are
      protected by RLS as well as app authorization

---

## 4.1 Intel Briefings interactive experience architecture (future)

**Founder direction, 2026-08-09:** Intel briefings should mature from readable
articles into cinematic, interactive intelligence products. Scrollytelling is the
preferred first storytelling pattern, but the architecture must also safely host
maps, comparisons, timelines, calculators, simulations, 3D scenes, contextual
property recommendations, and later RAG-assisted questions. Fewer exceptional,
sourced briefings are better than an automated article factory.

**Current foundation:** src/lib/articleSchema.js already validates one universal
body-block array, and src/components/intel/ArticleBlocks.js renders legacy and new
articles through one reader. It safely supports headings, paragraphs, quotes, lists,
tables, stats, callouts, images, and dividers. It does **not** yet provide an
interactive Experience Registry, article mood contract, isolated client runtime, or
RAG composition boundary.

Do not place custom creative code inside an article record and do not let a model
generate arbitrary React, JavaScript, CSS, shaders, or queries. Articles select only
versioned, engineering-approved experiences and pass schema-validated configuration.
The prose, evidence, and sources must remain readable when every interactive fails.

### Stage A - make the reader safely extensible

- [ ] Version the article envelope and give blocks stable IDs so editorial changes,
      citations, analytics, and interactive anchors do not depend on array position
- [ ] Keep authoritative prose/evidence blocks separate from an optional experience
      manifest; an experience references approved block/entity/dataset IDs rather
      than owning or duplicating article truth
- [ ] Define a scoped briefing mood contract: palette tokens, atmosphere, density,
      motion level, audio policy, and chapter transitions. Apply it only inside the
      article root; never permit article configuration to mutate global CSS, layout,
      navigation, authentication, or shared providers
- [ ] Add an explicit experience/scrolly slot to the schema only after its validator,
      no-JavaScript fallback, unknown-type behavior, and legacy rendering
      compatibility tests exist
- [ ] Preserve a canonical plain-reading mode, print/share representation, stable
      headings, citations, source list, and crawlable text regardless of experience
      availability

### Stage B - Experience Registry and isolation

- [ ] Build a code-owned Experience Registry mapping stable IDs and versions to
      lazy-loaded components, Zod config schemas, allowed datasets, capability flags,
      maturity (experimental or stable), and fallback renderers
- [ ] Give every experience a strict contract: article ID, location/entities,
      approved dataset references, sources/provenance, theme tokens, config, loading,
      empty, error, mobile, reduced-motion, keyboard, and screen-reader behavior
- [ ] Wrap each experience in its own error and suspense boundary so a failed map,
      shader, API, or dataset becomes a useful static fallback without breaking the
      surrounding briefing
- [ ] Prevent arbitrary imports, URLs, HTML, scripts, CSS, database queries, secret
      fields, and client-claimed entitlements from entering an experience config
- [ ] Add performance budgets per experience: bundle/asset weight, memory, long tasks,
      WebGL contexts, animation frame time, data size, and mobile/Lite Mode behavior;
      pause work offscreen and when the tab is hidden
- [ ] Keep experimental experiences isolated to named briefings/feature gates. Promote
      one to stable only after reuse, accessibility, performance, and failure evidence

### Stage C - first scrollytelling Intel pilot

- [ ] After 3-5 sourced plain briefings establish the editorial workflow and a
      readership baseline, choose one high-value spatial question whose answer truly
      benefits from scroll-driven explanation
- [ ] Graybox the narrative beats first: sticky scene, prose steps, progress, sources,
      skip control, direct links to chapters, and a static/reduced-motion story reel
      before adding cinematic art
- [ ] Implement scroll progress as enhancement, not navigation capture; preserve normal
      browser scrolling, focus order, back behavior, text selection, deep links, and a
      complete small-screen reading path
- [ ] Use one coordinated render loop/WebGL context when 3D is justified, with
      intersection-based pause, responsive LOD, asset caps, and a static poster fallback
- [ ] Test touch scrolling, 200% zoom, keyboard and assistive-technology reading,
      reduced motion, low-power Android, failed datasets, offline/slow networks, and
      abrupt route changes before public release
- [ ] Measure completion, chapter exits, fallback use, interaction value, and return to
      property/discovery actions without turning scroll telemetry into invasive tracking

### Stage D - RAG-assisted composition, never RAG-authored code

- [ ] Establish the approved, provenance-aware briefing corpus and retrieval evaluation
      set before adding user-facing or editorial RAG
- [ ] Let RAG propose claims, source links, narrative beats, entity/dataset bindings,
      mood presets, and compatible Experience Registry IDs; require schema validation
      and human editorial approval before publication
- [ ] Reject unsupported claims, missing citations, stale sources, private-field leakage,
      prompt-injected configuration, unknown experience IDs/versions, and dataset/entity
      mismatches through deterministic publish checks
- [ ] Build an internal Mission Control Experience Composer with preview at desktop,
      mobile, reduced-motion, empty/error, and plain-reading states; publication records
      the approved config version, datasets, sources, actor, and rollback target
- [ ] Add contextual Ask ScoutIt only after answer grounding, citation coverage,
      correction workflow, query privacy, abuse limits, cost ceilings, and a useful
      non-AI article experience are proven

### Release gates

- [ ] No interactive may publish without a static fallback, source/provenance display,
      accessibility review, performance budget, failure test, version pin, and rollback
- [ ] One-off art may remain experimental, but the shared article renderer accepts only
      registry contracts; never merge article-specific conditionals into its core switch
- [ ] Do not activate the full interactive newsroom until plain briefings show real
      readership and the first scrollytelling pilot demonstrates comprehension or
      decision value beyond decorative spectacle

---

## 4.2 Ownership Intelligence and Succession (future)

**Owner direction, 2026-08-13:** this is bigger than a `Property Inheritor`
field. ScoutIt should eventually have an **Ownership Intelligence** system, with
**Succession and Heirs** as one module beneath it.

### Locked conceptual model

ScoutIt must keep these layers separate:

```text
Property
  -> Registered title holder
  -> People/entities behind the holder
  -> Estates or succession events
  -> Potential successors
  -> Evidence and verification
```

The system must distinguish:

1. **Registered ownership** - who appears as the legal/title holder.
2. **Entity ownership or economic interest** - shareholders, partners, or other
   interests behind a corporation or partnership.
3. **Listing authority** - who may manage and publish the ScoutIt listing.
4. **Succession claim** - who may have inherited an interest.
5. **Verified succession** - who has sufficient reviewed evidence.
6. **Registered transfer** - whether the applicable official record changed.

A status at one layer never grants another. A shareholder's heir may inherit an
interest in the shares while the corporation remains the property's registered
holder. An OPC nominee may temporarily manage the corporation without becoming
the heir. A family relationship never automatically determines an ownership
percentage or transfers the ScoutIt account.

### Holder-specific branches

The first workflow question is: **who legally holds the title?** Branch into:

- individual or multiple individual co-owners;
- sole proprietor/proprietor;
- corporation;
- One Person Corporation, including nominee and alternate nominee;
- partnership;
- estate, trust, or another legal structure; or
- unknown/under research.

Each branch has different succession logic. Do not force every holder through a
family tree, and do not treat heirs of shareholders or partners as direct owners
of each property held by the entity.

### Property registration integration

Ownership Intelligence begins inside **property registration**, not as a detached
research tool added later. The registration flow must progressively ask:

1. Who is registering or listing the property, and what is their relationship to it?
2. Who is shown as the registered title holder?
3. What holder type applies?
4. If there are co-owners or an entity holder, what interests and authorized
   representatives are known?
5. Is there a known death, incapacity, estate, succession, nominee, trustee,
   executor, or unresolved ownership event?
6. Which statements are owner-supplied claims, and which have supporting evidence?

Registration creates the first ownership **claims**, not automatic legal truth.
Owner attestation may support publication under ScoutIt's existing publishing
rule, but it must not produce `legal_verified` or `registered` status by itself.
The form must support `unknown`, `under research`, `not applicable`, and `complete
later` so owners are not forced to invent family or corporate information.

The first release should use progressive disclosure:

- **Core registration:** lister relationship, registered-holder name/type, listing
  authority, and owner attestation.
- **Conditional branch:** co-owner, corporation, OPC, sole proprietor,
  partnership, estate/trust, or representative questions only when applicable.
- **Optional private evidence:** title/entity/authority documents and known
  succession facts, subject to the legal/privacy gates below.
- **Research follow-up:** missing or conflicting evidence becomes a private task;
  it does not silently rewrite the property or block an honest draft.

### User visibility and high-intent entitlement

Users should be able to see useful Ownership Intelligence on a property, but the
system must separate a safe public summary, paid derived intelligence, and
case-authorized private evidence:

- **Public/free candidate:** holder type, approved holder display name when lawful,
  coarse verification badge/date, and whether ownership history or unresolved
  research exists.
- **High-intent paid candidate:** a derived ownership map/timeline, entity-versus-
  property distinction, verification trail, material conflicts, missing-evidence
  summary, and researcher-approved ownership report.
- **Never unlocked by payment alone:** birth/marriage/death records, IDs, private
  addresses, title or stock-book source documents, probate files, family contact
  data, privileged legal material, raw research notes, or unrestricted exports.

The exact tier is an **open monetization decision**. The working product hypothesis
is to place detailed derived Ownership Intelligence in a high-intent tier such as
Cluster+ or Universe, while keeping a trustworthy basic summary visible to all.
Validate willingness to pay and legal/privacy feasibility before locking the tier.
A paid entitlement controls product depth; lawful purpose, relationship/case scope,
and role authorization control sensitive-data access. Both checks are required.

### Evidence graph and verification states

Plan a normalized private relationship graph for `property`, `person`, `entity`,
`estate`, `document`, `claim`, `relationship`, `verification`, `ownership_event`,
and `research_task`. Every claim and relationship must carry its own source,
effective date, learned date, visibility, verification state, and immutable audit
history.

Use six evidence states:

1. `claimed`
2. `sourced`
3. `research_verified`
4. `conflicted`
5. `legal_verified`
6. `registered`

A GIS match alone must not be labelled a verified shareholder. Automation may
propose claims and research tasks, but it may never declare heirs, calculate legal
shares, grant high-trust verification, change `properties.owner_id`, publish a
listing, or transfer account authority.

### Privacy boundary

This system is **private by default**. Family trees, birth/marriage/death records,
title numbers, stock records, probate/estate documents, IDs, addresses, research
notes, and conflicts must not enter Airtable or the public CMS. A future public
property page may show only an expressly approved minimal summary such as holder
type, coarse verification status/date, and ownership-history availability.

A subscription tier never grants access to genealogy or source documents. Access
requires a lawful purpose plus case-scoped authority. Account succession and legal
property succession are separate workflows.

### Trigger and ordered work

This is approved future direction, not launch scope. Until the gates below pass,
use synthetic data only and do not solicit real genealogy or succession documents.

- [ ] Founder selects the first justified use case and activation trigger: paid
      title research, enterprise portfolio diligence, or an internal verification need
- [ ] Philippine counsel reviews terminology, holder branches, source hierarchy,
      professional-review scope, public labels, correction/dispute handling, and
      the distinction between legal verification and registered transfer
- [ ] Complete a privacy impact assessment, threat model, and lawful-basis/purpose
      matrix covering living non-users, minors, civil-registry data, government IDs,
      privileged material, public records, retention, objections, and legal holds
- [ ] Decide whether ScoutIt stores source documents, verified extracts,
      hashes/references, or a controlled combination
- [ ] Design normalized private tables and case-scoped RLS for parties, title
      interests, entity interests, relationships, claims, evidence, verification,
      events, research tasks, and access logs; do not place genealogy JSON in
      `properties.details`
- [ ] Prove graph operations cannot change listing ownership, publishing, lead
      routing, entitlements, or account access
- [ ] Build a synthetic Mission Control research workspace with Ownership Map,
      accessible table/timeline, Evidence Drawer, conflicts, missing-evidence queue,
      corrections, and audit trail
- [ ] Pilot individual/co-owner and corporation branches first; add OPC, sole
      proprietor, partnership, estate/trust, and representative branches afterward
- [ ] Red-team forged evidence, identity collisions, malicious family claims,
      unauthorized merging/export, insider browsing, self-approval, and account takeover
- [ ] Release only a counsel/privacy-approved minimal public projection after real
      correction, dispute, access-review, retention, and incident rehearsals pass

---
# PRE-PILOT LEGAL AND PRIVACY GATE (stable section 4.5)

This gate executes during router Order 2, before invited humans enter the pilot.
Its stable 4.5 identifier and physical location are retained only to preserve
existing cross-references; it is not post-pilot work.

These are engineering controls, not legal conclusions. Owner, counsel, filing, and approval work lives in [[MASTER_OWNER_ACTIONS]]. Supporting analysis lives in [[16_LEGAL_AND_COMPLIANCE/README|Legal and Compliance]].

## 4.5.1 Versioned terms acceptance

- [ ] Re-verify that TermsAcceptanceModal is mounted in every applicable signup/onboarding path; do not rely on an unused component.
- [ ] Add an additive, reviewed migration for terms_accepted_at, terms_version, and server-derived acceptance evidence only after confirming the live schema.
- [ ] Persist acceptance through an authenticated server route with a versioned Terms snapshot, timestamp, actor, and auditable failure behavior; client-only or local state is not evidence.
- [ ] Add tests for first acceptance, version change/re-consent, failed persistence, unauthenticated calls, and already-accepted users.

## 4.5.2 Retention and data-subject rights

- [ ] Schedule purge_expired_chat_messages through an authenticated, monitored cron path and prove legal holds prevent deletion.
- [ ] Implement a documented access, correction, export, erasure/blocking, and appeal workflow with identity verification, retention exceptions, audit evidence, and response ownership.
- [ ] Reconcile chat, analytics, security telemetry, submissions, backups, vendor logs, and public-content retention against the actual Privacy notice.

## 4.5.3 Truthful legal surfaces and platform boundaries

- [ ] Replace the future-dated 2026-10-24 Terms/Privacy effective date before any invited pilot; publish only the version actually in force.
- [ ] Reconcile Terms and Privacy disclosures with actual analytics, telemetry, cookies, processors, cross-border transfers, retention, notifications, and AI-assisted processing.
- [ ] Keep payment language provider-neutral until the owner selects and counsel reviews the real provider, refund, receipt, tax, recurring-billing, and outage flows.
- [ ] Test listing, lead-routing, event-planner, broker, rating, price, and contact copy against the approved RESA/non-brokerage boundary; route legal interpretation to counsel.
- [ ] Re-verify every 2026-08-03 blueprint fault against current code and production before implementing it; several recorded findings are stale.

## 4.5.4 Release evidence

- [ ] Record counsel-approved Terms and Privacy versions, effective date, acceptance migration, automated tests, cron evidence, and data-rights runbook in a dated implementation record.
- [ ] Do not describe ScoutIt as compliant or legally verified until the owner closes the corresponding counsel and filing gates in [[MASTER_OWNER_ACTIONS]].

---

# PHASE 5 — COMMERCIAL ACTIVATION

Do not accept money until every item in this phase is complete.

## 5.1 Make the offer truthful

- [ ] For each of the six advertised but undelivered benefits, record: build it,
      deliver it manually, or remove the promise
- [ ] Update pricing copy and the actual fulfillment path to match each decision
- [ ] Publish current commercial terms, privacy/retention rules, and correction/
      refund policy

## 5.2 Production infrastructure

- [ ] Reverify the existing `scoutit.space` production setup before payments:
      DNS, SSL, `www`/Vercel redirects, canonical URLs, OAuth callbacks, email
      records, and allowed Mapbox hosts
- [ ] Confirm Vercel plan terms and upgrade before commercial use where required
- [ ] Upgrade production Supabase for required Auth, daily backup, and availability
      controls
- [ ] Enable leaked-password protection and review password minimums
- [ ] Choose daily database backups versus PITR; separately back up Supabase Storage
      objects because database backups contain only their metadata, then rehearse both restores
- [ ] Rotate production credentials and complete the production environment inventory
- [ ] Set provider spend alerts/limits for hosting, email, AI, maps, and monitoring

## 5.3 Payments, tiers, and Connects

- [ ] Select the Philippine payment provider and document webhooks, refunds,
      reconciliation, tax/receipt handling, and outage behavior
- [ ] Keep Enterprise non-purchasable until its delivery operation exists
- [ ] Verify the server-side role/tier matrix with `pre_launch_free_mode` disabled
- [ ] Rehearse subscription purchase, renewal, cancellation, entitlement loss,
      webhook replay, and failed payment with real test accounts
- [ ] Rehearse Connect pack purchase and reconciliation before enabling it at the
      200-listing threshold
- [ ] Roll out payments to a controlled cohort and monitor before broad activation

---

# FOUNDER DECISIONS — NO ENGINEERING UNTIL ANSWERED

| ID | Decision | Recommended default / deadline |
|---|---|---|
| D1 | Confirm the strategy at the top of this file | Confirm now |
| D2 | Delivery choice for each of six pricing benefits | Before any payment |
| D3 | May a broker see property traffic before representation is accepted? | No |
| D5 | FAQ Silver meaning | Separate licensed Advisor Spec from Contributor |
| D6 | May delegated brokers confirm freshness? | Yes, with verifier audit trail |
| D7 | Hidden FAQ retention period | 90–180 days plus manual erasure |
| D8 | Is legacy `source` metadata or public display data? | Treat as internal provenance unless proven otherwise |
| D9 | Keep cyan/magenta accents? | Only with explicit semantic roles |
| D10 | Keep bounce easing? | Replace with restrained motion |

Record the answer here, convert it into an action in the correct phase, and
remove the decision row. Do not duplicate it in another checklist.

## Answered and removed

**D4 — when may public profiles be indexed? Answered by the owner 2026-08-16.**
Removed from the table above per this section's own rule.

The ruling is *not* the recommended default that sat here. The default made
indexing wait on **demo profiles being removed**, treating them as a temporary
obstacle. The approved policy instead makes the gate a property of each profile:
index only profiles that are **real, verified, and explicitly made public by the
person**, with exposure governed by an **explicit public-field allowlist**.

Demo and sample profiles therefore stay `noindex` permanently because they are
not real and verified — not because they are awaiting deletion. That removes the
dependency entirely, and it survives new demo data being added later, which the
original default would not have.

Full text and consequences: [[MASTER_OWNER_ACTIONS]] item 4. Execution lands in
§1.4 search-indexing follow-through.

---

# TRIGGER-GATED FUTURE WORK — NOT THE CURRENT QUEUE

| Work | Trigger |
|---|---|
| Experience Registry and isolated experience contracts | Before the first published interactive, after 3-5 plain briefings stabilize the editorial schema |
| Interactive intelligence/newsroom layer | The first isolated scrollytelling pilot proves comprehension or decision value, accessibility, performance, and fallback safety |
| Rich space graph and tree-scoped permissions | Third hierarchy level, multiple space types, or valuable inter-space relationships |
| Property Passport / Quiet Market | First real property lifecycle is proven |
| Internal Mission Control RAG assistant | Stable approved corpus and proven staff retrieval need |
| Spatial OSINT signal engine | Human review and field-level provenance are operational |
| Automated 3D/Spatial Vault provider | Proven customer demand and selected capture/provider workflow |
| Cloudflare R2 Spatial Vault activation | North Star reached, subscriptions live with paying subscribers, and first super-large spatial map/3D package creates a real need |
| User-facing RAG guide | Approved help corpus exists |
| Voice briefing/copilot | 200 verified listings, demand, and sufficient verified data |
| Direct-owner/FSBO mode | Legal review and owner-direct workflow validation |
| WebRTC/phone proxy | Usage proves Google Meet cannot serve the need |
| Zero-log AI CRM | Real conversation channel and consent model exist |
| High-traffic architecture/SQL aggregates | Measured capacity thresholds are exceeded |
| Enterprise/white-glove operations | Paid demand and staffed SLA exist |
| QuestIT protocol | 1,000+ honest listings and stable engagement |
| Native mobile app | Stable web usage proves a need the web cannot meet |
| Supabase leaked-password protection (HaveIBeenPwned) | Supabase Pro is activated for an independent reason. **Pro-plan-only feature; the ScoutIT org is on Free.** Do not buy Pro for this alone — see below |

## Supabase leaked-password protection — deferred with reason (2026-08-12)

The Supabase security advisor reports "Leaked Password Protection Disabled" as a
WARN. **This is a known, accepted state, not an open task.** The feature is
Pro-plan-and-above only, and the ScoutIT organization (`szoadayarauelryyfcdm`)
is on the Free plan. Buying Pro solely for it would violate the standing rule
against premature commercial spend.

What is already in place instead, at no cost: a **12-character minimum password
length** and strong required-character rules on the email provider — well above
Supabase's own "under 8 is not recommended" guidance, and a materially better
defence than the default 6-character floor.

When Supabase Pro is activated for an independent reason (capacity, backups,
support), enable leaked-password protection at the same time and close this
advisor finding. Until then, expect the warning to keep appearing in every
advisor run and do not treat it as a regression.

---

Only after all three R2 gates are met - North Star, paying subscribers, and a
qualifying super-large spatial asset - the activation work must include:

- [ ] Keep source/master 3D files, panoramas, scans, textures, and other gated
      high-intent assets in private buckets; never expose the bucket or API keys
- [ ] Store asset ownership, listing links, entitlements, processing state, checksums,
      provenance, retention status, access audits, storage provider, bucket, and object
      key in a provider-neutral Supabase asset registry
- [ ] Keep private/signed media URLs out of Airtable; resolve gated asset IDs only after
      server-side authorization so storage can move without rewriting public records
- [ ] Authorize every private download server-side and issue a short-lived,
      single-purpose presigned URL; treat every URL as a bearer credential
- [ ] Create separate optimized public previews only when publication is intended;
      serve production previews through an approved custom domain, never `r2.dev`
- [ ] Validate file signature/MIME type, size, and checksum; quarantine uploads for
      malware/content inspection before they become retrievable
- [ ] Restrict CORS to required ScoutIt origins, set upload/file-size limits, define
      lifecycle and retention rules, and configure spend alerts before accepting files
- [ ] Permit R2 ingestion only through an authorized ScoutIt staff/service workflow;
      record creator, source rights, capture details, checksum, and chain of custody
- [ ] Keep masters non-public and non-overwritable with an approved bucket-lock period;
      write derived versions to new keys and keep an independent recoverable archive
- [ ] Preserve ScoutIt-owned source assets according to the approved retention policy;
      do not silently delete them merely because a listing is withdrawn

---

# DASHBOARD DEFAULT MODE & ROLE PROGRESSION POLICY

1. **Buyer / Scout Mode Default**:
   - Every registered identity on ScoutIt is fundamentally a space seeker, buyer, or scout.
   - When any user opens or navigates to `/dashboard`, the initial state **must default to `buyer` mode** (Buyer/Scout Workspace), where ScoutIt's core search, property intelligence, saved boards, and deal initiation logic live.
   - Users may then toggle into or add secondary active roles (`owner`, `broker`, `provider`, `operator`) depending on their elevated permissions and workflows.

---

# ENTERPRISE READ-ONLY PREVIEW & PRICING MODAL POLICY

1. **Interactive Read-Only Preview**:
   - Enterprise Mode is accessible as an interactive preview so any visitor or user can switch to Enterprise Mode and browse its full interface (multi-property portfolios, team seat controls, enterprise analytics, and compliance logs) to showcase ScoutIt's enterprise capabilities.

2. **Read-Only Enforced Gate**:
   - Users can freely click around and inspect Enterprise Mode panels, but **all write and mutation actions are strictly disabled** (no creating properties, adding seats, or saving configuration changes).

3. **Enterprise Pricing / Upgrade Modal**:
   - Attempting any write or add action inside Enterprise Mode (e.g. clicking "Add Property", "Create Portfolio", or "Invite Team Member") triggers a sleek **Enterprise Pricing Upgrade Modal**.
   - The modal displays Enterprise tier feature breakdowns, seat pricing options, and a direct CTA to request an enterprise tier upgrade or schedule an onboarding call.

---

# THE MARKET CHAPTER — articles on property pages (built 2026-08-20)

Owner asked for a section on property pages carrying **articles for that
property's location, plus articles written specifically about that property.**
This supersedes §Layer 2 item 2 below, which specified only *"a gold link to the
corresponding city/category intel briefing"* — a link, not a section.

## What shipped

**One shared component, `components/property/MarketChapter.js`, used by both
flows.** Two layers in one chapter:

| Layer | Content | Audience |
|---|---|---|
| Free | Briefings about this property and its market | Everyone |
| Paid | Cap rate · Transaction history · Appreciation · Price history · Competitive density · Market position | Cluster+ |

Matching lives in `lib/propertyArticles.js`, 31 unit tests.

## Three real defects found on the way in

- [x] **`canMarketIntel` in `CommercialFlow` was declared, computed on mount,
      and never read.** One reference in the whole file. So commercial, STR,
      hospitality, restaurants and venues — **five of seven categories** —
      rendered no market intelligence at all, not even the locked teaser
      residential got. Cap rate and transaction history are commercial metrics
      first; the only flow that had them was the one that needed them least.
      Standing Rules 13 and 21, both.

- [x] **Exact city matching would have returned nothing, on every property.**
      Articles are authored at district level and properties recorded at city
      level — `"BGC, Taguig"` vs `"Taguig"`, `"Makati CBD"` vs `"Makati"`,
      `"Poblacion, Makati"` vs `"Makati"`. Not one pair is string-equal, and
      every pair is obviously the same market. Found by testing against the live
      feed rather than by reading the schema. Standing Rule 4 exactly: it fails
      by showing nothing, and showing nothing looks exactly like having nothing.

      Fixed with meaningful-token overlap plus a stopword list — without it
      `"Cebu City"` matches `"Quezon City"` on the shared token `city`, which is
      worse than no match.

- [x] **"The Fine Print" was a misnomer twice over.** It means legal caveats and
      terms; the chapter renders investment metrics. Its subtitle promised a
      third thing again — *"Title classification, zoning & risk assessments"* —
      which it has never rendered. Renamed to **The Market** in
      `chapterConfig.js`. **The tab id stays `hiddenintel`** because it is in
      every deep link, in `VALID_CHAPTERS` on both flows, and in the panel CSS.

## ⚠️ A correction to this file's own §1.3 entry

**§1.3 was marked closed on the strength of PROPERTIES being labelled. Articles
were never checked, and they are not labelled.** `/intel` renders **four mock
articles** from `src/data/mock/mockArticles.js` with **no sample marking at
all**, while the real CMS holds exactly **one** article (`test-intel`, blank
city).

- [ ] Label the sample articles on `/intel`, or stop serving them. §1.3 requires
      the disclosure on "every sample card, detail page, child space, profile,
      dashboard record, and affected interaction" — an article is a card
- [ ] Re-open §1.3 until that is done. Closing it on a partial check is the
      same error the 2026-08-16 addendum describes: a claim verified in one
      place and assumed everywhere else

**Because of this, the property page deliberately reads only `bundle.intel`
(real CMS) and NOT the mock feed.** Piping unlabelled sample articles onto
property pages would have spread the problem rather than shown the feature
working. The consequence is that the empty state is what ships today — which is
correct, and is why it was designed first.

## Verified

Dev server, both flows, four widths:

| Check | Result |
|---|---|
| Chapter present on commercial (`cyber-sigma-tower-3`) | ✅ new — had nothing before |
| Chapter present on residential (`the-ridgeline-…`) | ✅ |
| Nav label on both | **The Market** |
| Populated state (temporarily fed the mock feed, then reverted) | 1 row, tagged *"This market"*, links to `/intel/bgc-spatial-movement` |
| Empty state with real data | *"No briefings cover this part of Taguig yet"* + Browse market intel |
| Overflow at 320 / 390 / 768 / 1280 | **0** |
| Tap targets under 44px | **0** |
| Build | exit 0 · Suite **1241/1241** |

## MERGED `51066fb` ([PR #66](https://github.com/EdgerzXc/ScoutIt/pull/66)) — production audit clean

Post-merge CI green. Verified on the deployed site, **one property per category**:

| Category | Chapter | Label | Stale "Fine Print" |
|---|---|---|---|
| Commercial (×2) · STR · Hospitality · Residential · Restaurants · Venues | present on **all 7** | **The Market** | **none** |

Five of those seven had **no market chapter at all** before this. Regression
sweep across 10 routes × 5 widths: no non-200s, every page rendered, **zero
overflow at every route and width**, and the only console error remains the
third-party Turnstile one on `/contact`.

`?chapter=hiddenintel` still returns 200 — the frozen tab id did its job.

## Article storage decided — see [[../../04_DATA_AND_SCHEMA/ARTICLE_CREATION_LOGIC]]

Owner asked where articles live given each category will get its own
interactive. Decided and written up 2026-08-20; the short version:

**Supabase captures, Airtable publishes** — the same shape as properties, per
the Dual-CMS Golden Rule. `intel_sources` (raw, **7-day** retention) →
`intel_briefings` (draft) → **`INTEL_CMS` (published, permanent)**.

**The 7 days applies to raw sources, never to published articles.** A published
article is SEO surface and is what the Market chapter links to; expiring them
would rot every property page's list and feed Google dead URLs — the `/hubs`
soft-404 mistake again.

**Interactives are code, not storage.** Measured: MapLibre **267 KB gzipped**,
Three.js **178 KB**. The article stores only a registry key plus a small config,
so one more article in a category that already has its interactive costs
**~2–15 KB of text and zero experience weight**. The binding constraints are
bandwidth (≈1.2 MB if a reader opens one article per category) and WebGL
contexts — not disk. Airtable's real limit is records per base (16 properties,
2 articles today).

Built with it: `Experience_ID` + `Experience_Config` on `INTEL_CMS`, the publish
bridge `src/lib/intelPublish.js` (16 tests), and the end of the
`published_to_airtable` lie.

## Still open

- [x] **CORRECTION 2026-08-20 — `Related_Property` ALREADY EXISTED, and the
      claim that this was owner-only was wrong twice over.**

      I recorded this as *"owner-only, the Airtable connector is not authorised"*
      and asked the owner to create the field. Both halves were false:

      1. **The connector was authorised.** I read the deferred-tool list once at
         session start, saw `plugin:airtable:airtable` under "requires
         authentication", and never checked that a *second*, working Airtable
         server was also present. I reported a capability as unavailable without
         testing it.
      2. **The field was already there.** `Related_Property`
         (`fldzcxvHiIQIbDYlh`) has been on `INTEL_CMS` all along — a
         `multipleRecordLinks` to `PROPERTIES_CMS` (`tbly4IqdfwkAoUsd4`), with
         its reciprocal `INTEL_CMS` field (`fldxfQC3YgTsmH7GP`) already on
         `PROPERTIES_CMS`. Exactly the shape specced, built long before it was
         specced.

      **The real gap was in code, not in Airtable:** `fetchIntel()` in
      `src/lib/airtable.js` never read the field, so the strongest
      article↔property signal in the base was invisible to the product. Fixed —
      one mapped line plus a contract test.

      **This is the fourth instance of the same class**, after `SEO_Title`,
      `Floor_Plans` and `Verification_Status` in
      [[../../04_DATA_AND_SCHEMA/AIRTABLE_COMPRESSION_PLAN]]: a field that
      exists in Airtable with no consumer in code. It fails silently — nothing
      errors, nothing logs, the feature just does nothing. Standing Rule 21 is
      the check that catches it, and the direction to look is the one you are
      not looking at.

      🔒 **Rule earned: before asking the owner to create an Airtable field,
      read the live schema.** The base has 186 fields on `PROPERTIES_CMS` alone;
      assuming something is absent is not the same as looking.

- [x] **Location metadata repaired 2026-08-21.** `test-intel` is an area-level
      Makati CBD briefing, so `City=Makati`, `Location=Makati CBD`,
      `District=Makati CBD`, and `Region=Metro Manila` are now populated.
      `Related_Property` remains blank deliberately: the article does not name a
      specific property. The otherwise blank record was removed from the live
      feed by clearing `Approved_For_Live_Site`. No Pasig/Capitol Commons article
      exists yet, so Ridgeline correctly retains the honest empty state.
- [x] `DATA_DICTIONARY.md` now records the full `INTEL_CMS` read contract,
      including `City`, `Location`, `District`, `Region`, `Related_Property`,
      experience fields, and `Body_JSON` (2026-08-21).
- [ ] Decide whether the Unit Master Page inherits its parent's list. A unit has
      no separate location, so it should inherit rather than match on its own

---

# LAYER 2 DISCOVER & INTEL SYMBIOTIC INTEGRATION ARCHITECTURE (PRAGMATIC LAUNCH SCOPE)

1. **Bi-Directional Symbiotic Navigation**:
   - Market Intelligence (`/intel`, Layer 2 Stratosphere) and Space Discovery (`/discover`) operate as deeply connected twin surfaces.
   - A persistent header bar allows seamless switching: `[🔍 DISCOVER SPACES]` ↔ `[📡 MARKET INTEL & BRIEFINGS]`, preserving active city, category, and keyword filters.

2. **Intel → Discover (Launch Integration)**:
   - **Micro-Market Summary Banners**: Selecting a city/region on `/discover` (e.g. BGC, Makati) displays a 1-sentence plain-language note sourced directly from `INTEL_CMS.Excerpt` with a `[Read Full Guide →]` link.
   - **Simple Feature Badges**: Property cards display clear, lightweight tags (`Commercial Hub`, `Pet-Friendly`, `Prime Location`) derived from standard Airtable fields.
   - **Property Detail Market Guide Link**: Property pages include a gold link to the corresponding city/category intel briefing.

3. **Discover → Intel (Launch Integration)**:
   - **Article-Bottom Related Space Carousel**: Intel articles (`/intel/[slug]`) dynamically render a 3-card carousel of active verified ScoutIt listings matching the article's `SpaceCategory` or `City`.
   - **Direct Filter CTAs**: Articles conclude with a `[SEE PROPERTIES IN THIS AREA →]` button deep-linking directly to `/discover?city=...&type=...`.

4. **Pragmatic Scope Guard (Post-Launch Deferral)**:
   - Complex financial yield formulas, predictive algorithms, transit heatmaps, and formal financial certifications are **explicitly deferred to post-launch Phase 8**.
   - Pre-launch integration relies 100% on existing Airtable CMS fields (`City`, `SpaceCategory`, `Excerpt`, `Slug`).

---

# CONTACT SURFACE & MMC LIVE CHAT ARCHITECTURE

1. **Master Mission Control (MMC) Connected Live Chat**:
   - The `/contact` surface and contact modals feature a real-time **Live Chat interface** that streams visitor inquiries directly to the Master Mission Control (MMC) real-time operations queue.
   - Staff in Mission Control receive, triage, and respond to incoming visitor chats in real-time.
   - The contact page structures placeholder modules for formal contact email (`support@scoutit.space`), direct phone numbers, and physical office addresses for future operational expansion.

---

# DASHBOARD TYPOGRAPHY & UNIVERSAL NAVIGATION STANDARDS

1. **Dashboard Readability & Font Scale**:
   - All dashboard modes (Buyer, Owner, Broker, Provider, Operator), Inbox, Calendar, Schedules, CRM, panels, and drawers must use clear, accessible font sizing.
   - Tiny sub-12px text must be upgraded to 13px–15px baseline for body copy and system labels.
   - Line height and text contrast must be strictly maintained against deep dark background surfaces (`--accent`, `--bg-primary`, `--text-primary`).

2. **Universal Header Integration**:
   - The platform's **Universal Header (`Header.js`)** must remain accessible across all dashboard pages to provide seamless navigation between public discovery and private workspace environments.

---

# SCOUTIT UX DIRECTION — HUMANIZATION, NAVIGATION & PROPERTY EXPERIENCE

> **Canonical Spec:** `[[03_DESIGN/SCOUTIT_UX_DIRECTION|SCOUTIT_UX_DIRECTION]]`.
> **Core Commitment:** *ScoutIt should help someone understand a space before asking them to act on it.* Simple at first contact; deep on demand. Do not reduce intelligence — reduce the effort required to find and understand the right intelligence.

1. **Humanize Without Removing Identity (Translation, Not Replacement)**:
   - ScoutIt's distinctive branded nomenclature (*The Vault*, *Universe*, *Orbit*, *Intelligence*, *The Board*, *Where To?*, *Your Move*) remains intact.
   - Do not replace branded vocabulary with generic real-estate terms. Instead, pair each with immediate plain-language subtitles:
     - **THE VAULT** — *Floor plans, scans & spatial records*
     - **UNIVERSE** — *Building history & wider property context*
     - **THE BOARD** — *Your saved and compared spaces*
     - **WHERE TO?** — *Travel times & nearby destinations*
     - **YOUR MOVE** — *Save, evaluate or connect when you're ready*

2. **Discover and Intelligence As One Unified System**:
   - Market Intelligence (`/intel`) and Space Discovery (`/discover`) are two modes of one single layer: `[Search]` | `[Intelligence]`.
   - **Intelligence $\rightarrow$ Discovery:** Micro-market insights and signals prompt links to explore spaces in that district.
   - **Discovery $\rightarrow$ Intelligence:** Search results provide context on *why* these locations match the intelligence criteria.
   - Desired user loop: **Discover $\rightarrow$ Understand $\rightarrow$ Refine $\rightarrow$ Discover**.

3. **Tool-Based, Non-Linear Property Experience**:
   - The 11 property experience tools will **not** be flattened into a single linear long scroll.
   - Preserves non-linear user journeys (e.g. Seeker A: Location $\rightarrow$ Units $\rightarrow$ Your Move; Seeker B: The Space $\rightarrow$ Fine Print $\rightarrow$ Build Plans).
   - Improves **orientation** (*"Explore this property: Choose what matters to you"*) while keeping individual tools independently accessible.

4. **Spatial Vault as Capability Demonstration (Human Testing Logic)**:
   - Showcases multiple spatial formats (floor plans, 360° tours, Matterport, drone scans, BIM, walkthroughs) to demonstrate platform capabilities.
   - In production, properties render only the spatial intelligence actually captured for that space.
   - Demo label: *"Spatial Vault Demonstration: Sample spatial formats ScoutIt can support. Actual properties display only intelligence available for that space."*

5. **Explanatory Verification & Trust System**:
   - Verification badges must explain **why** something or someone can be trusted rather than displaying an arbitrary score.
   - Categories: Property (Owner Verified, Availability Confirmed, Floor Plan Verified), Owner (Identity Verified, Responsive Owner), Broker (Identity Verified, Owner Authorized, Local Specialist).

6. **Transparent Mock/Sample Data Demarcation**:
   - Demonstration listings retain deep mock intelligence during human testing so testers experience the full vision.
   - Clear global banner: *"DEMONSTRATION PROPERTY: Some intelligence, availability, pricing and spatial information shown here is illustrative."*
   - Explicit `DEMO DATA` tags on sensitive sections (legal, risk, structural, pricing, sensor/drone).

7. **Progressive Intent in Your Move**:
   - Do not aggressively push broker contact forms across every section.
   - Early interactions offer low-pressure tools (Save, Compare, Share).
   - As engagement deepens (multiple images, Units, Fine Print, Vault), gently suggest *"Seen enough? Your Move $\rightarrow$"*.
   - Progression inside Your Move: `Inspired Me` $\rightarrow$ `Potential Fit` $\rightarrow$ `Interested` (reveals *"Connect with an authorized professional"*).

8. **Comparison System Foundations**:
   - Normalized data fields preserved across listings (area, price/sqm, type, availability, commute, risks, verification status).
   - Long-term goal for The Board: help users understand *why* one space fits them better than another.

9. **Zero Dead Ends (Doorway Principle)**:
   - Empty search results or unavailable records must never end the journey.
   - Replace *"No properties available"* with *"Nothing matching this search yet"* accompanied by proactive doorways: *Explore all spaces $\rightarrow$*, *Change your search $\rightarrow$*, *Explore another area $\rightarrow$*, *View related intelligence $\rightarrow$*.

---

# INITIATIVE — DASHBOARD & WORKSPACE COHESION (v1.0 • 2026-08-17)

> **Canonical Specification:** `[[07_FEATURES_AND_FLOWS/DASHBOARD_AND_WORKSPACE_COHESION_SPEC|DASHBOARD_AND_WORKSPACE_COHESION_SPEC]]`.
> **North Star:** Make ScoutIt satisfying and coherent at the 10–20 listing stage before expanding into large-enterprise complexity.
> **Core Architectural Loop:** *Context Bridges create activity $\rightarrow$ Notifications understand it $\rightarrow$ Return Brief summarizes it $\rightarrow$ Continue remembers where you were $\rightarrow$ Your Board interprets what you've accumulated.*

## Sequenced Execution Router (Order of Work)

| Step | Work | Ref | Why Now / Objective |
|---|---|---|---|
| **16.1** | Mission Control isolation/security | §14 | Protect internal operating surface before increasing real usage |
| **16.2** | Context Bridge foundation | §15 | Establish canonical entity relationships that later dashboard intelligence depends on |
| **16.3** | Workspace language pass | §2 | Humanize the core multi-role mental model (`Mode` $\rightarrow$ `Workspace`) |
| **16.4** | Owner creation simplification | §5 | Reduce first-use complexity for a key supply-side workflow |
| **16.5** | Return Brief | §1 | Make every return visit immediately useful without duplicating notification state |
| **16.6** | Continue Where You Left Off | §6 | Add workflow continuity across sessions and workspaces |
| **16.7** | Buyer Saved Intelligence | §3 | Complete the Buyer Workspace as a personal library rather than a second discovery engine |
| **16.8** | Board Intelligence | §7 | Turn accumulated saves/research into neutral, explainable insight |
| **16.9** | Broker Match Explanation | §9 | Establish transparent ranking logic before inventory scale |
| **16.10** | Connects explanation | §10 | Remove currency/action-credit ambiguity |
| **16.11** | Terminology cleanup | §11 | Standardize product language after structural decisions are stable |
| **16.12** | Universal empty-state pass | §8 | Eliminate dead ends across all core surfaces |

## Active Workstreams & "Done When" Acceptance Gates

### §1. Return Brief — Useful Every Login (P0)
- [ ] Returning users receive a concise role-aware brief derived from real notification/activity data.
- [ ] Each brief item deep-links into the exact relevant property, deal, message, job, or workspace.
- [ ] When nothing changed, display confident all-clear state (*"You're up to date. Everything you follow is unchanged."*).
- [ ] **Guardrails:** Do not create a second notification database; do not manufacture fake urgency.

### §2. Mode $\rightarrow$ Workspace Terminology Pass (P0)
- [ ] User-facing copy completely retires "Mode" in favor of "Workspace" (`MODE: OWNER` $\rightarrow$ `WORKSPACE: OWNER`, `Switch Capability` $\rightarrow$ `Switch Workspace`, `Working as: Owner`).
- [ ] Workspace switching preserves the same signed-in identity and changes only the active working context.
- [ ] **Guardrails:** Keep internal code variables (`mode`) intact unless deliberate migration is scheduled; never use "Mission Control" for customer-facing workspaces.

### §3. Buyer Workspace Scope — Manage, Do Not Duplicate Discovery (P0 Foundation / P1 Enhancement)
- [ ] Buyer Workspace centers on personal management: **Your Board** (saved spaces), **Saved Intelligence** (saved briefs/guides), **Watches** (monitored districts), **Recent Changes**, **Continue Comparing**, and **Radar** (purposeful geographic scanning).
- [ ] Public ScoutIt (`/discover`, `/intel`, Space Directory) remains the primary exploration and search engine.
- [ ] **Guardrails:** Do not duplicate the layered public discovery flow inside the personal dashboard.

### §4. Notifications, Inbox & CRM Semantic Separation (P0 Semantics)
- [ ] Maintain semantic separation: **Notifications** (*something happened*), **Inbox** (*somebody communicated with me*), **CRM / Deal Files** (*something I am actively working toward*).
- [ ] Notifications act as pointers to communication/work objects without creating redundant work queues requiring multiple dismissals.

### §5. Owner Property Creation — Humanize Ingestion Choices (P0)
- [ ] First screen progressively discloses two primary paths: **[I already have property materials]** (*PDF, brochure, deck, existing file*) and **[I'll build it myself]** (*guided property setup*).
- [ ] Secondary drawer / *"More ways to add"* houses bulk CSV import, Advanced Property Editor, and Spatial Vault requests.
- [ ] **Guardrails:** Do not remove CSV, PDF extraction, advanced editor, or Spatial Vault capabilities.

### §6. Continue Where You Left Off (P0)
- [ ] Persist lightweight continuation state (`user_id`, `workspace`, `entity_type`, `entity_id`, `surface`, `subsection`, `last_meaningful_action`, `updated_at`).
- [ ] Resumes meaningful workflow state upon login (e.g. *"Ridgeline at Capitol Commons — you were editing Fine Print"*).
- [ ] **Guardrails:** Do not restore every scroll position or destructive confirmation modal; invalidate safely if access or underlying data changes.

### §7. Your Board Intelligence — Turn Saves into a Research Workspace (P0 Foundation / P1 Intelligence)
- [ ] Start without AI: derive neutral, deterministic patterns from normalized metadata (location clusters, price/size ranges, amenities, lifestyle signals, building age, saved intel topics).
- [ ] Neutral framing: *"Your Board is taking shape"* / *"Patterns we can observe"* — strictly never *"We think you should buy X."*
- [ ] Surface saved intelligence connections when relevant to saved spaces.

### §8. Universal Empty-State Rule (P0)
- [ ] Every empty state explains why it is empty and provides one obvious next doorway (Empty Board $\rightarrow$ Explore spaces; Empty Intel $\rightarrow$ Explore Intelligence; No watches $\rightarrow$ Explore space/area to watch).
- [ ] Loading and empty states are visually and logically distinct (skeleton loaders first; no false empty flash).

### §9. Broker Opportunity Explanation — Build Logic Before Scale (P0 Foundation / Next Calibration)
- [ ] Rule-based scoring engine based on `authorization_score`, `geographic_fit`, `asset_type_fit`, `listing_freshness`, `listing_strength`, `owner_intent`, `broker_service_area`, and `broker_verified_capabilities`.
- [ ] Transparent human explanation layer: *"Why this surfaced: Owner accepts broker representation; within your service area; matches your commercial specialization; verified recently; dossier is 91% complete."*
- [ ] **Guardrail:** Verification, relevance, owner authorization, freshness, and quality strictly outrank monetization.

### §10. Connects — Humanize Currency & Action Credits (P0)
- [ ] Add explicit explanation: *"Connects are ScoutIt action credits. Certain professional introductions and actions use Connects. You'll always see the cost before confirming."*
- [ ] Provide clear balance ledger (available balance, used in period, transaction history, cost confirmation before action).

### §11. Terminology Standardization (P0 Copy Pass)
- [ ] Enforce naming law: **Workspace** (user), **Organization Workspace / Enterprise Console** (company), **Mission Control** (staff-only).
- [ ] Standardize labels: `Provider Workspace`, `Photography Workspace / Photo Jobs`, `Research Workspace`, `Event Design Workspace`, `Broker Workspace`, `Opportunity Feed`, `Active Representations`, `Advanced Property Editor`.
- [ ] Subtitle branded terms: `Spatial Vault` (*3D tours & immersive property media*), `Universe` (*building history & wider property context*), `The Board` (*your saved spaces & research*), `Where To?` (*travel times & nearby destinations*), `Your Move` (*evaluate, save or connect when ready*).

### §12. Operator Workspace — Preserve Boundary, Defer Product (P2)
- [ ] Preserve clean architectural boundary (*delegated units only; building ownership remains with owner*).
- [ ] Keep data relationships compatible with unit delegation while deferring heavy UI expansion until real-user need.

### §13. Enterprise — Explicitly Deferred from 10–20 Listing North Star (DEFERRED)
- [ ] Preserve organization schema, seat models, and RBAC roles in data layer.
- [ ] Stop spending pre-pilot attention on Enterprise UI polish or 200-property portfolio optimization.

### §14. Mission Control Isolation & Security Pass (P0 SECURITY)
- [ ] Isolate `mission-control/` source from the public GitHub repository into a private repository or separate private project.
- [ ] Enforce server-side staff authorization (Supabase `admin_users` + `aal2` MFA) on every route, API handler, and Server Action.
- [ ] Enforce `Cache-Control: no-store` on sensitive responses, strict CSP (`frame-ancestors 'none'`), strip source maps/verbose server errors.
- [ ] Run repository-history secret scan and rotate any legacy credentials.
- [ ] **Security Principle:** *Noindex is not access control; source secrecy is not access control.*

### §15. Context Bridge Architecture — One Ecosystem, Different Perspectives (P0 Foundation)
- [ ] Connect canonical entities (`PROPERTY ↔ UNIT`, `PROPERTY ↔ DEAL ↔ OWNER/BROKER/BUYER`, `PROPERTY/AREA ↔ INTELLIGENCE`, `PROPERTY/DEAL ↔ VIEWINGS/TASKS/ACTIVITY`).
- [ ] Every actionable record carries relational bridge fields (`entity_type`, `entity_id`, `related_entity_type`, `related_entity_id`, `event_type`, `actor_id`, `target_user_id`, `workspace_context`).
- [ ] Powers Return Brief (§1), Continue Where You Left Off (§6), Board Intelligence (§7), and deep-linking notifications (§4).

### §16. Monthly Showcase Curation & Merit Calibration SOP (P0 Operating Rhythm)
- [ ] **Core Showcase Identity & Human Curation Principle:** The Showcase (`/showcase` / Orbit Demand Board) is ScoutIt's flagship spatial & demand showcase. It cannot and must not be treated as a generic, 100% blind automated feed. Because it represents ScoutIt's prestige demand tier, every featured property requires human-curated, truthful, and high-impact merit calibration every month.
- [ ] **Monthly Audit & Curation Cadence (1st of every Month):**
  - **Audit Cycle Verification:** Review and verify top-ranked spaces across categories (`Commercial`, `Residential`, `STR`, `Hospitality`, `Restaurants`, `Venues/Events`) and awards (`Most Inquired`, `Top Rated`, `New This Month`, `Staff Pick`). Update active audit cycle stamp (`Active_Month`, e.g., "June 2026 Audit").
  - **Merit & Distinction Calibration (The "Best Things" Rule):** Operators/curators evaluate and input the specific best-in-class highlights for each featured property:
    - ⚡ **Response & Connect Velocity:** e.g., verified broker response times under 15 mins, highest inquiry response rate.
    - 🗺️ **Spatial & Heatmap Location Proximity:** e.g., walking distance to primary commercial hubs, central transit arterial access, flood-free elevation, high pedestrian footfall heatmaps.
    - 💎 **Architectural & Spatial Merits:** e.g., unobstructed skyline views, column-free layouts, high-ceiling spatial clearance, LEED/WELL green certifications.
    - 📈 **Organic Demand Momentum:** e.g., Top Inquired Commercial Space in Taguig, record private saves cohort, 100% earned demand score.
- [ ] **Showcase vs. Briefing Boundary Law:**
  - The Showcase card is strictly reserved for **Prestige Highlights, Demand Distinction, and Merits**.
  - Raw specification data tables, mechanical specs, and full broker directory rosters are explicitly excluded from the Showcase stage. They belong on the dedicated Property Briefing Page (`/property/[slug]`), accessible via the primary gold **`Explore Full Briefing →`** button.
- [ ] **Integrity Guardrails:** No automated placeholder text, no false velocity scores, and zero paid manipulation of rank positions. 100% earned demand verification required.

### §17. 6-Layer Spatial Descent Visual Style & Layer Navigation Polish (P1 Experience)
- [ ] **Descent Narrative & Spatial Cohesion:** Solidify the visual and psychological progression as users descend from high-altitude market intelligence down to granular unit transactions:
  - **Layer 1: Orbit / Universe (`/layer/orbit` & `/showcase`):** Cosmic demand rankings, planetary orbital velocity, sweeping galaxy canvas, high-altitude demand signals.
  - **Layer 2: Stratosphere (`/layer/stratosphere`):** Regional macro climate, macro economic indicators, transport and logistics flight corridors, macro heatmap overview.
  - **Layer 3: Metropolis (`/layer/metropolis`):** Urban district clusters, skyline vantage points, commercial district density, arterial transit connectivity.
  - **Layer 4: Crust (`/layer/crust`):** Neighborhood reality, street-level walkability, local commercial foot traffic, community vibe, and flood/elevation topography.
  - **Layer 5: Mantle (`/layer/mantle`):** Architectural structure, building envelope, engineering specs, facade materials, lobby atmosphere, shared facilities.
  - **Layer 6: Core (`/layer/core` & `/property/[slug]`):** Private unit level, 3D Spatial Vault, verified transaction ledgers, deep financial intel room.
- [ ] **Descent Style Polish & UI Aesthetics:**
  - **Altitude & Atmospheric Telemetry:** Implement micro-telemetry altitude indicators and subtle atmospheric particle color transitions as users transition between layers (deep cosmic black `#0d0d0d` $\rightarrow$ atmospheric navy/slate $\rightarrow$ architectural gold & graphite).
  - **Fluid Layer Switcher & Waypoint HUD:** Provide intuitive, high-touch waypoint navigation enabling users to jump between layers or descend sequentially with smooth transitions.
  - **Mobile-First Adaptive Performance (`Lite Mode`):** Guarantee 60fps responsiveness across all descent layers by pairing Canvas/WebGL particle systems with low-power device fallbacks (auto-disabling heavy particle loops on mobile battery-saver modes).
  - **Unified Dark Luxury Aesthetics:** Adhere strictly to 95% deep black / 5% glowing gold CSS variables (`--accent`, `--accent-bright`, `--accent-muted`), glassmorphism overlays, and tabular monospace telemetry numbers.

---

# POST-LAUNCH BRAND EXPERIENCE — ORIGIN STORY SCROLLYTELLING & TEAM SHOWCASE (PARKED / LATER STAGES)

> ⚠️ **Context: Non-Immediate Build.** This is a post-launch brand experience asset. It is **explicitly non-blocking for pre-launch human testing** or the 200-listing North Star goal. It is parked for future brand expansion or post-launch activation.

1. **Origin Story Scrollytelling Track**:
   - Continuous 600vh Three.js WebGL scrollytelling track triggered by the homepage UFO (`scout-ufo.png`).
   - Rhymes the origin of the universe with ScoutIt's spatial commerce mission across 5 Acts (Origin $\rightarrow$ The Gap $\rightarrow$ ScoutIt Mission $\rightarrow$ 6-Layer Descent $\rightarrow$ Core Ignition into Live Hero).
   - Features gold kintsugi crack SVG, starfield parallax, particle fields, gold bloom glows, and smooth scroll scrubbing.

2. **Founding Team & Contributors Showcase**:
   - Integrated as an interactive waypoint near the end of Act 4 (between *Crust / People You Trust* and *Core Ignition*).
   - Displays the founding builders, spatial engineers, data architects, and regulatory/legal advisors with gold-accented avatar cards, bio overlays, and role declarations.
   - Reference specs: `[[ORIGIN_STORY_SCROLLYTELLING]]`, `[[SCOUTIT_SCROLLYTELLING_PROMPT]]`, and `[[scrollytelling-mission-text]]`.

---

# AUDIT COVERAGE AND SOURCE DISPOSITION

This plan was reconciled on 2026-08-08 against **all 78 Markdown files** in
`08_OPERATIONS_AND_BACKLOG/`: 9 `ACTION` files, 7 `BACKLOG` files, and 62 files
at the folder root, plus the downloaded Master Execution & Verification Ledger.

Disposition rules:

- `ACTION/01_NOW`, `ACTION/02_YOURS`, budget, paid-tier, security, launch,
  logic, E2E, Mission Control status, roadmap-triage, and deferred-item documents
  supplied open work and were merged here.
- `NEW_IDEAS`, `NEW_IDEAS_2`, and `NEW_IDEAS_IMPLEMENTATION_READY` supplied
  approved directions and milestone triggers. No literal `NEW_IDEAS_3.md` exists;
  the implementation-ready volume is treated as the effective third volume.
- Architecture/spec/SOP/playbook files remain constraints or implementation
  references, not parallel queues.
- Dated session handoffs and done-verification records remain evidence/history.
- Old build/deploy/cleanup prompts, the parallel Mission Control build prompt,
  archived work orders, and stale pre-launch checklists are superseded and must
  not be executed wholesale.
- Completed claims were excluded. Where an old finding conflicted with newer
  evidence, current code/live behavior won. Examples: Monthly Scout Wrap is
  built and belongs in release verification; Provider/Operator waitlisting is
  locked; chat retention, CMS caching, Terms, and submission validation already
  exist and were not resurrected.

If a source produces a new valid task later, add only the reconciled action,
owner, phase, and acceptance gate here—never reactivate the whole source file.
