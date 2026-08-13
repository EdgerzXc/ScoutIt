---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, master-action-plan, open-work, launch, roadmap]
updated: 2026-08-13
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

## Priority tiers — what is urgent, what waits, what is locked

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

### The one thing that is genuinely blocking today

Nothing in the code. The two live security holes are fixed and verified. **What
remains in T0 is mostly owner-only confirmation work** — environment variables,
hostnames, deploys, and real-device passes that an agent cannot perform. See
[[MASTER_OWNER_ACTIONS]].

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
- [ ] Confirm `IP_SALT` is set in the production environment (still open; the
      schema/length allowlists, server-derived identity, redaction, safe errors,
      centralized rate coverage, and abuse tests are already complete)

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

**Live reconciliation ? 2026-08-13, 21:15 SGT.** GitHub reports **13
Dependabot alerts and 13 CodeQL alerts on `main`**. Every vulnerable package
listed by Dependabot resolves to a patched version on the security branch; both
package audits report zero vulnerabilities. PR #49 now carries the final release
commit that was pushed after PR #48 had already merged. Its dependency review
passes. The first fresh CodeQL policy check correctly found six residual paths:
five authenticated-profile browser-cache writes and one weak E2E URL assertion.
Those paths are now remediated and locally verified; keep this gate open until
the updated PR scan and subsequent default-branch scan both pass.

- [ ] Land the already-targeted root and Mission Control dependency remediation only
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
- [ ] Resolve all **13** currently open CodeQL findings (live 2026-08-13; down
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
- [ ] Retire `scoutit_user` as a clear-text browser profile/session cache. Use the
      verified Supabase session and minimum server-approved display state; keep the
      isolated development fixture incapable of activating on a production hostname
- [ ] Replace regex-only HTML security boundaries with context-appropriate escaping or
      a reviewed sanitizer/parser, escape Airtable formula backslashes before quotes,
      and prove all downstream rendering/sink contexts with focused adversarial tests.
      The Airtable formula subtask is complete locally: backslashes are escaped before
      apostrophes, adversarial tests pass 3/3, and the full Mission Control security
      suite passes 42/42. Plain-text field and email conversion now uses a deterministic
      tokenizer that never emits tag delimiters, rejects prototype-polluting keys, and
      passes 18/18 focused tests. The Unit Details alert points to its relative Preview
      link; dynamic property/unit segments are now encoded by a focused route builder
      with 2/2 passing tests. Keep the parent finding open until CodeQL confirms closure
- [ ] Review tracked `scratch/jules_session_3` for unique required content, migrate any
      real value, then remove it from production scanning and source ownership. Re-run
      CodeQL before resolving its four duplicate alerts.
      **Mechanical cause found 2026-08-13:** `scratch/` **is** in `.gitignore`
      (line 67), but **29 files under it are already tracked**, and `.gitignore`
      does not untrack files git already follows. The fix is `git rm --cached`,
      not another ignore rule. This closes 4 CodeQL alerts and unpublishes 29 dead
      files from a **public** repository in one move
- [ ] **Verify before dismissing** the 2 `actions/missing-workflow-permissions`
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

- [ ] 🔴 **`MOCK_CATEGORIES` silently overrides the real category.** Duplicated in
      `src/app/intel/page.js` and `src/app/property/page.js`, evaluated as
      `MOCK_CATEGORIES[p.slug] || p.spaceCategory` — **the hardcoded map wins over
      the live Airtable field**, so a category corrected in Airtable is ignored for
      those slugs. Invert the precedence and share one map
- [ ] 🔴 **15 files still render a bare `<style>{…}</style>`** (was 17; count
      re-verified 2026-08-13). React 19 hoists a raw `<style>` into `<head>` as a
      stylesheet *resource*; without `precedence` it leaves an enclosing
      `<Suspense>` boundary **pending forever**. This exact bug froze `/discover`
      and `/property` — HTTP 200, clean console, page never arrives. Harmless today
      only because none of the 15 currently sits beside a Suspense boundary; adding
      one reproduces the freeze. Sweep them to `<style jsx>`
- [ ] 🟠 **Sign-in-then-sign-up creates an account on a typo** (L3).
      `src/app/onboarding/page.js` calls `signInWithPassword` and falls through to
      `signUp` on **any** failure. A typo'd email silently creates a new account;
      the user sees an empty dashboard and assumes their listings vanished. A wrong
      *password* attempts a signup and returns "already registered". **Fix: only
      fall through when the error is specifically "user not found."**
- [ ] 🟡 **`connect_balances` / `connect_transactions` have no `role` column.**
      Owner-resolved 2026-08-02; the migration was never written

### Decisions that block other work (owner)

- [ ] 🔴 **L1 — seven overlapping "is this listing real?" fields across two
      systems.** Supabase: `verified` (TRUE on 0 of 20 — dead), `moderation_status`
      ('pending' on all 20 including live ones — dead), `pipeline_status` (the only
      one doing real work), `archived_at` (a second way to archive),
      `last_verified_date`. Airtable adds `Verification_Status` and `Pipeline_Status`,
      **neither of which any code reads**. Different parts of the codebase already
      guess differently. **Recommendation: declare `pipeline_status` the single
      source of truth.** ⚠️ Decide before building search ranking, trust badges, or
      the AEO schema — and do **not** wire `Verification_Status` into a public badge
      first, which would add a seventh reader to a contradictory set
- [ ] 🟠 **L5 — a blocked FAQ answer has no appeal path**
- [ ] 🔵 **L12 — lead export moves PII with no record.** Ties to §3.4's
      "log exports of lead PII with actor, subject, time, purpose"
- [ ] 🔵 **L13 — the Google Meet link depends on the HOST having Google.** Measure
      NULL-link frequency before designing a guest-host fallback (§3.5 has the
      measurement item; this is the decision behind it)
- [ ] 🟡 **L6 — nothing consumes `rankModifier`.** Either wire it into ranking or
      retire the field; a scoring input nothing reads is a promise in the schema

### Smaller, still open

- [ ] **Google Calendar OAuth `redirect_uri_mismatch`.** Audit `/api/calendar/sync`
      and `/api/calendar/callback` to confirm the callback uses `getSiteUrl()`
      dynamically. Pairs with the owner's Google Cloud Console step (Owner Actions §1.8)
- [ ] **649 inline `style={{ color: "#…" }}` colours** remain from the light-mode
      migration — 420 in `CommercialFlow.js` (225) and `ResidentialFlow.js` (195),
      then `SpatialCommandMap.js` (48), `UnitMasterPage.js` (37). The CSS-file half
      is done and measures zero. Inline `style` accepts `var()` fine
- [ ] **Light mode is only measured on `/` and `/settings`.** `/discover`,
      `/property`, `/property/[id]`, `/hubs/[slug]`, brokers and dashboard were
      changed but never scanned. ⚠️ Inject
      `* { transition: none !important; animation: none !important; }` before
      measuring or the scan under-reports (9 phantom failures on `/settings`)
- [ ] **The hero wordmark is still white-on-white** in light mode. Unsolved
- [ ] **Two competing profile URL schemes.** Directories link to
      `/profile/[username]`; `/photographers/[slug]`, `/researchers/[slug]`,
      `/event-planners/[slug]` also exist and are reachable from nowhere.
      `robots.js` disallows `/profile/`, so every indexable directory points at a
      blocked destination. Pick one canonical URL, redirect the other

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

- [ ] Merge the branch so the homepage/no-photo cards stop returning 0 bytes.
- [ ] **Decide the no-photo fallback.** A listing with no photo currently produces
      a blank card. It should fall back to the branded generic card, not nothing.

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

- [ ] **Review `public.public_profiles` — a `SECURITY DEFINER` view (ERROR).** It
      runs with its creator's permissions, bypassing the querying user's RLS.
      Given the name, this view almost certainly backs the public profile pages
      and the ecosystem directories, making it the most-read object in the app
      and the likeliest place to leak an unaudited column. Establish which
      columns it exposes before deciding whether `SECURITY DEFINER` is intentional
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

- [ ] Smoke-test `/`, `/property`, `/discover`, one property, one child space,
      the four professional directories, onboarding, and dashboard sign-in
- [ ] Check production console/server logs for new errors
- [ ] Confirm the read-only kill switch and rollback procedure are usable

## 1.3 Activate sample-listing search protection

**Founder through the deployed Mission Control System Operations workspace:**

- [ ] Run the audited control to add checkbox field `Is_Sample` to `PROPERTIES_CMS`
- [ ] Run the audited control to mark the seven seeded/sample records

**Engineering after the field exists:**

- [ ] Verify sample properties and child-space routes emit `noindex`
- [ ] Verify samples are absent from the sitemap and property JSON-LD
- [ ] Display **SAMPLE DATA — FOR HUMAN TESTING** on every sample card, detail
      page, child space, profile, dashboard record, and affected interaction

## 1.4 Search indexing follow-through

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

- [ ] **PREREQUISITE — finish Search Console verification.** The DNS token is
      already live and GA4 is already installed; either route completes in
      minutes. Nothing else in this section can start until this is done
- [ ] Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel as a **second**
      verification method, so the property survives the Cloudflare DNS cutover
- [ ] Submit `sitemap.xml` once the property exists
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

## 1.5 Complete the responsive brand experience

Implement this after the security/data blockers in 1.0, but before inviting human
testers. Preserve mock/sample data and label it; this is experience work, not launch
cleanup.

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

# PHASE 4.5 - LEGAL AND PRIVACY LAUNCH CONTROLS

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
| D4 | When may public profiles be indexed? | After demo profiles are removed; otherwise per-demo `noindex` |
| D5 | FAQ Silver meaning | Separate licensed Advisor Spec from Contributor |
| D6 | May delegated brokers confirm freshness? | Yes, with verifier audit trail |
| D7 | Hidden FAQ retention period | 90–180 days plus manual erasure |
| D8 | Is legacy `source` metadata or public display data? | Treat as internal provenance unless proven otherwise |
| D9 | Keep cyan/magenta accents? | Only with explicit semantic roles |
| D10 | Keep bounce easing? | Replace with restrained motion |

Record the answer here, convert it into an action in the correct phase, and
remove the decision row. Do not duplicate it in another checklist.

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
