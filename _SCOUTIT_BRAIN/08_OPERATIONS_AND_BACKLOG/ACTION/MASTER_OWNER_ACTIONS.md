---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [master-owner-actions, founder-actions, decisions, credentials, approvals, launch-readiness]
updated: 2026-08-12
related:
  - "[[00_MASTER_ACTION_PLAN]]"
  - "[[../00_START_HERE]]"
  - "[[../../00_MASTER_SYNC]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]]"
---

# 👑 MASTER OWNER ACTIONS

> **This is the single canonical checklist for work requiring Jerzel personally.**
> It unifies all founder actions, credential setups, external service dashboards, device passes,
> product/legal decisions, and launch gates into one master file.
> Engineering work lives in [[00_MASTER_ACTION_PLAN]]. If another file conflicts with this master list, this file wins.

---

## 🧭 Operating Rules

1. **Tasks live in this file only.** Do not duplicate owner actions across multiple backlog files.
2. **Never paste raw secret values here.** Record only that a credential was set and where it is configured (e.g. Vercel, Supabase, Cloudflare).
3. **Tick and date when complete.** An untracked "I think I did that" leads to broken environment states.
4. **When an item is finished**, notify the implementing AI agent so evidence can be recorded in the done log and cross-references updated.
5. **No premature commercial spend.** Do not enable paid infrastructure (Vercel Pro, Supabase Pro, R2) until stated trigger thresholds are reached.

---

## 🔴 1. Immediate Unblocking Pass — ~3 Hours Total

*High-value, immediate actions that block real-device verification, email deliverability, and search crawling.*

### 1.1 ✅ DONE — Site URL Environment Variable
- [x] **Set `NEXT_PUBLIC_SITE_URL = https://www.scoutit.space` in Vercel.** (Done 2026-08-08 by Jerzel). Verified: canonical tags, `og:url`, JSON-LD `@id`, and sitemap now emit `www.scoutit.space` cleanly.

### 1.2 📱 Real-Device Verification Pass — iPhone & Android (~2h)
*Hardware pass on live `scoutit.space`. Replaces all scattered "verify UI" items. Cannot be tested in code or emulation.*

- [ ] **Turn `pre_launch_free_mode` OFF temporarily** before testing entitlement gates so features do not falsely report as unlocked. Turn it back ON after testing.
- [ ] Check dynamic viewport heights (`100dvh`) on physical **iOS Safari** and **Android Chrome**.
- [ ] Test mobile bottom sheets, lister declaration modal (W2), property claim panel (W8), SEO readiness panel (W11), and privacy shield toggle (W13).
- [ ] Confirm all touch targets are $\ge 44\text{px}$ on 360px / 390px phone viewports.
- [ ] **Record verified devices & date:** `______`

### 1.3 ✉️ Email Infrastructure & Domain Verification (~15 min)
*The email system is fully built but sends nothing without live keys.*

- [ ] Add `RESEND_API_KEY` to Vercel production environment variables.
- [ ] Verify the `scoutit.space` sending domain in the Resend dashboard (fixes shared test domain spam classification).
- [ ] Send and receive one real test email to confirm deliverability.

### 1.4 🛡️ Verify Vercel Production Environment Keys (~5 min)
*Silent fallbacks were removed; missing keys fail visibly in production.*

- [x] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` set in Vercel (Screenshot verified 2026-08-09).
- [ ] `NEXT_PUBLIC_GA_ID` present in Vercel environment.
- [ ] `CRON_SECRET` configured in Vercel. Test `curl` unauthenticated against `/api/cron/*` to confirm **401 Unauthorized**.
- [ ] Verify next scheduled cron run in Vercel Logs.

### 1.5 💳 Connect Refund Panel Rehearsal (~5 min)
*RPC, route, and admin panel are built and deployed to production.*

- [ ] Open Mission Control / Admin Refund Panel (`/admin/connects-refund`).
- [ ] Look up a test wallet; verify balance and ledger rows render.
- [ ] Test rejection on reason < 10 characters.
- [ ] Execute 1-Connect test refund: confirm balance increases, `system_error_refund` ledger row is logged, and credit lands in `purchased_balance`.
- [ ] Confirm non-admin attempt returns **403 Forbidden**.

### 1.6 📦 Dependabot Security Triage (~5 min)
- [ ] Open GitHub Security / Dependabot advisories for `EdgerzXc/ScoutIt`.
- [ ] Request agent triage on which reported advisories are actually reachable in production code.

### 1.7 🔗 JSON-LD Social Entity Verification (`sameAs`) (~10 min)
- [ ] Inspect social profile links in `JsonLd.js` (`twitter.com/scoutit`, `facebook.com/scoutit.ph`, `linkedin.com/company/scoutit`).
- [ ] Confirm ownership of each URL. Remove any profile link not directly owned by ScoutIt Philippines to prevent Google entity merging.

### 1.8 📅 Google Calendar OAuth Redirect URI Setup (`redirect_uri_mismatch` Fix) (~5 min)
*Fixes the Error 400: `redirect_uri_mismatch` when users connect Google Calendar.*

- [ ] Open **Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client IDs**.
- [ ] Under **Authorized redirect URIs**, add:
  - `https://www.scoutit.space/api/calendar/callback`
  - `https://scoutit.space/api/calendar/callback`
  - `http://localhost:3000/api/calendar/callback` (for local development)
- [ ] Save changes and verify calendar handshake flow completes cleanly without `redirect_uri_mismatch`.

---

### 1.10 ✅ §1.0B Critical Security Migration — **APPLIED 2026-08-12.** Re-tests remain

> **Heading corrected 2026-08-13.** It previously read *"Apply the … Migration — BLOCKS HUMAN TESTING"*, which contradicted the ticked item directly beneath it. **The migration is applied and verified; it is not blocking anything.** What is still open here are the owner re-tests and the Scout Rating decision.

*Engineering closed all ten §1.0B findings on 2026-08-12, plus four further bugs found while fixing them. Full detail: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]].*

**File:** `supabase/migrations/20260812000001_critical_logic_and_security_fixes.sql`
**Project:** `yyixsuaimdzyiocswcgc` (ScoutIT) — the only project; there is no staging.

**Pre-flight was run live on 2026-08-12 and every destructive statement measured as a no-op on current data:** `saved_intel` 0 rows / 0 duplicates, `property_claims` 0 rows, and 0 properties change public visibility (10 approved = 10 live). The only data change is collapsing 145 duplicate telemetry rows into counters.

- [x] **✅ APPLIED 2026-08-12** to `yyixsuaimdzyiocswcgc`, as five isolated tracked migrations, all succeeded. Verified after: forgery path gone, both triggers active and confirmed `SECURITY INVOKER`, `property_claims.property_id` now UUID with FK, 145 duplicate telemetry rows collapsed with all 4,205 observations preserved, 0 duplicate groups remaining, public property count unchanged at 10, `deals` UPDATE still deny-all. Supabase security advisor clean of anything this created. Evidence: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]] §5.
- [ ] **Re-test the Mission Control publish path.** `pipeline_status` and `lifecycle_state` are now writable only by the service role. Verified in code that all lifecycle routes and Mission Control CMS actions use the admin client, so this *should* be transparent — but confirm approve / publish / withdraw / suspend end to end anyway.
- [ ] **Re-test owner property intake.** A client-created property can no longer arrive `approved` or `live`; it is forced to `pending` / `draft`. Confirm the listing flow completes and lands in review.
- [ ] **Spot-check the public property list and one property page** still render after the SELECT policy swap.
- [ ] **Decide the Scout Rating formula (product, not security).** The handshake used to write `user_profiles.scout_rating`, a column that does not exist — it would have errored the first time any handshake completed. The real column is `broker_profiles.scout_rating`, `numeric(3,2)`, a 0–5 rating that **overflows at 10.00**, so incrementing it per closed deal was never right. The migration now credits `broker_profiles.verified_closures` instead. **How a verified closure should move the displayed 0–5 rating is your call, and no broker rating is being computed until you make it.**
- [x] **Applied date: 2026-08-12** (five tracked migrations, all succeeded — recorded 2026-08-13; this line was previously left blank)

### 1.12 🗂️ Migration Drift — the repo does not describe the live database — **DECISION NEEDED**

*Found 2026-08-12 during pre-flight. Several migration files in `supabase/migrations/` were never applied to production, and some live objects were applied outside the tracked history. Full detail and evidence: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].*

**Confirmed never applied:** `20260803000001_production_security_rls`, `20260809000001_security_telemetry_retention`, `20260809000002_onboarding_completion_contract`, `20260811000001_wishlist_share_revocation`, `20260811000002_pilot_cohort_registry`.

- [ ] **Do NOT bulk-apply the backlog to "catch up."** `20260809000001` would actively regress the §1.0B telemetry fix — it recreates the partial index that `20260812000001` deliberately replaces. At least two files now conflict.
- [ ] **Approve annotating `20260803000001` and `20260809000001` as superseded** in-file, so a future session does not apply them.
- [ ] **Approve an individual audit of the remaining three** unapplied migrations against the live schema, applying only what is still needed and still correct.
- [ ] **Choose one source of truth:** drive everything through tracked Supabase migrations, or declare the SQL editor authoritative and stop maintaining files that imply otherwise. The split history is the root cause and will keep producing this.
- [ ] **Note for future audits:** any finding derived from reading `supabase/migrations/` may describe a database that does not exist. One §1.0B finding was actively wrong for production — it asked to add a `WITH CHECK` to a `deals` UPDATE policy that does not exist, which would have *granted* access that is currently denied.

### 1.13 🩺 Supabase Advisor Findings (pre-existing, ~15 min) — surfaced 2026-08-12

*Found while verifying the §1.0B migration. **None of these were caused by that work** — they were already present. Listed so they are decided rather than drifted past.*

- [x] ✅ **CLOSED 2026-08-12 — leaked-password protection is deferred with reason, not outstanding.** It is a Supabase **Pro-plan-only** feature and the ScoutIT org (`szoadayarauelryyfcdm`) is on **Free**; buying Pro for it alone would violate the no-premature-spend rule. Password length is already set to **12 characters**, well above Supabase's "under 8 is not recommended" guidance and double the default floor of 6 — so the practical risk is already addressed. Moved to the trigger-gated table in [[00_MASTER_ACTION_PLAN]]; it activates only if Supabase Pro is turned on for an independent reason. **Expect this WARN in every future advisor run — it is not a regression.**
- [ ] **Review view `public.public_profiles`** — flagged ERROR for being `SECURITY DEFINER`, meaning it enforces the creator's permissions and RLS rather than the querying user's. Confirm that is intentional for a public profile projection, or convert it.
- [ ] **Record a decision on `public.spatial_ref_sys`** (RLS disabled, flagged ERROR). It is a PostGIS system table and this is commonly accepted — but it should be a written decision, not an oversight.
- [ ] **Decide on `postgis` and `vector` extensions installed in the `public` schema** (WARN). Moving them is disruptive; accepting them is reasonable. Either way, record the choice.
- [ ] **Review the 19 tables with RLS enabled and no policies** (INFO — deny-all, therefore safe today). Each should be a deliberate "service-role only" decision. Includes `deal_handshakes`, `deal_messages`, `disputes`, `subscriptions`, `property_units`, `verification_requests`.

### 1.11 🔎 Decide the Telemetry Rate-Limit Posture (~5 min)

*`/api/telemetry/device` is unauthenticated by design. It now has a per-instance limiter (120 events/minute/IP) as a fail-closed backstop, because the existing Upstash limiter in `src/proxy.js` fails **open** for this route when Redis is unconfigured or unreachable.*

- [ ] **Confirm `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel production.** Without them the strong distributed limiter is silently inactive site-wide, not just for telemetry.
- [ ] **Decide whether 120 events/min/IP is right for real traffic.** A shared office or campus NAT can legitimately exceed it. If pilot testers hit 429s on telemetry, raise it — telemetry failing is harmless, but a wrongly-metered visitor is a false signal in the data.

### 1.14 📣 Sharing — Owner Actions (added 2026-08-13, Cowork share-engine pass)

*The share engine was rebuilt on 2026-08-13 (mobile curated share, Viber/Messenger, copy-then-open, attribution, tests). These five items are the parts code cannot do. Implementation record: `_SCOUTIT_BRAIN/15_IMPLEMENTATION_RECORDS/active/sharing/2026-08-13_SHARE_ENGINE.md`.*

- [ ] **Register a Facebook App and record its App ID.** Messenger's proper send dialog (`facebook.com/dialog/send`) requires one. Without it the Messenger button uses the `fb-messenger://share` app scheme, which works on a phone with Messenger installed and does **nothing on desktop**. No App ID was found anywhere in the repo, and inventing one produces a broken dialog, so none was used. Once you have it, add `NEXT_PUBLIC_FACEBOOK_APP_ID` to Vercel and the desktop path can be wired.
- [ ] **Mark `share_completed` as a key event in GA4** (`G-36WQZF409S` → Admin → Events → Mark as key event). The event now fires on every completed share with `channel`, `property_slug` and `ref` params, but GA4 will not treat it as a conversion until it is promoted in the dashboard. Code cannot do this.
- [ ] **Enter the floor area for One E-Com Center.** Measured 2026-08-13 against the live Airtable base: of the **7 approved listings, exactly 1 — One E-Com Center — has no floor area on record** in any field (`FloorSqm`, `CM_Total_GLA`, `HOSP_GFA`). It is the only listing that now falls back to the shorter share copy. Every other listing carries at least one measured spec and gets the full briefing. This is data entry, not a code fix — ScoutIt must never estimate a specification.
- [ ] **Decide whether `ref` codes should be resolvable back to people, and where that mapping lives.** You chose person-level attribution. The code in a public link is an opaque SHA-256-derived string; to learn *which* broker a code belongs to you must hash your own user list and match. Nothing does that today. If crediting brokers matters commercially, an internal lookup page is a small future build — and worth writing down as a decision either way.
- [ ] **Decide Unit Master Page sharing:** wire its currently unreachable share
      modal using parent-property context and sample gating, or remove the dead
      state. Do not let an agent silently choose.
- [x] **Sharing push/merge approved and completed 2026-08-13.** Commits
      `ce51bc9` and `d36d965` are on `origin/main` through merge `5289be5`.


---

## 🚀 2. Human Testing & Invited Pilot Unblocking

*Locked human-testing decisions: Testers use valid temporary email identities they control. Sample data remains public on live `scoutit.space` but explicitly badged and `noindex`ed. Account deletion notice given without separate consent workflow.*

- [ ] **Approve Pilot Release**: Approve deployment of the audit-remediated release after engineering evidence confirms Phase 1 blockers are closed.
- [ ] **Airtable `Is_Sample` Field**: Add the `Is_Sample` checkbox column to Airtable `PROPERTIES_CMS` via Mission Control (do not edit Airtable directly).
- [ ] **Tag Sample Records**: Use Mission Control to mark the 7 seeded sample property records as `Is_Sample = true`.
- [ ] **Configure Sample Inquiry Recipient**: Set `HUMAN_TEST_SAMPLE_RECIPIENT_IDS` in Vercel to designated Supabase auth user UUIDs (keeps sample inquiries fail-closed).
- [ ] **Listing Title Protection**: Do not edit Airtable property `Title` fields directly until the canonical URL redirect migration is live (prevents indexed URL drift).
- [ ] **Media URL Audit**: Audit `Video_URL`, `Virtual_Tour_URL`, `Luma_3D_Map_URL`, and `Drone_Heatmap_URL` in Mission Control to remove placeholder Matterport/Luma assets.
- [ ] **Recruit First Testing Cohort**: 5 owners, 5 seekers, 2–3 brokers, 2 photographers/researchers.
- [ ] **Screen-Reader & Zoom Gate**: Perform one real NVDA/VoiceOver desktop journey and one TalkBack/VoiceOver mobile journey at 200% zoom.

---

## 🔒 3. GitHub Repository & Operational Security

- [ ] **Repo Visibility**: Confirm whether `EdgerzXc/ScoutIt` remains public or moves to private. Review Vercel integration, Dependabot, and fork impacts before changing.
- [ ] **Account 2FA & Passkey**: Verify strong 2FA and hardware passkey on Jerzel's GitHub account; store offline recovery codes.
- [ ] **Branch Protection Ruleset**: Review and approve proposed `main` ruleset ensuring sole owner, Vercel, and emergency recovery cannot be locked out.
- [ ] **Commit Signing**: Establish and test GPG/SSH commit signing before enforcing signed commits on `main`.
- [ ] **Secret Scanning Alert — one dashboard action remains.** The defanged
      fixture and `.agents/` removal are already on `origin/main` through merge
      `a312ce7`; CI was reported green. GitHub does not auto-close this alert.
      Open `https://github.com/EdgerzXc/ScoutIt/security/secret-scanning/1` and
      close it as a synthetic Clerk test fixture. ScoutIt uses Supabase Auth, so
      there is no Clerk webhook secret to rotate.
- [ ] **Least-Privilege Actions**: Approve GitHub Actions workflow permissions (read-only default, SHA-pinned actions).

### 3.0 ✅ TWO LIVE AUTHORIZATION HOLES — CLOSED 2026-08-13

**Both applied to production with owner approval and verified in both directions.**
Full evidence: `[[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/AUTHZ_FIXES_APPLIED_2026-08-13]]`.

- [x] **`public.public_profiles` write path closed.** Was: `anon` held
      `INSERT/UPDATE/DELETE/TRUNCATE` on an auto-updatable `SECURITY DEFINER`
      view, bypassing `user_profiles` RLS over **15 real rows**. Proven live
      (rolled back): anon UPDATE affected 1 row. Now `SELECT` only.
      **Verified:** anon write blocked ✅, anon read still returns 12 profiles ✅,
      and the live `/brokers` page still renders all three real broker profiles
      on a cache-busting fetch ✅.
- [x] **`intel_briefings` / `intel_sources` write access scoped.** Was: policies
      *named* "Service role full access" were actually `roles={public}` (which
      includes `anon`), `FOR ALL`, `USING (true)`. Both tables were empty, so
      nothing leaked. **Verified:** anon INSERT blocked ✅, signed-in INSERT
      blocked ✅, **Mission Control service-role publish still works** ✅,
      0 probe rows left behind ✅.
- [x] **DECISION RESOLVED — `/intel` is EDITORIAL.** Owner confirmed 2026-08-13:
      authored by the ScoutIt team, published through **Mission Control**, each
      category becoming a library of presentation methods (scrollytelling,
      interactives, WebGL) chosen per piece; OSINT gathers source material for
      the team's own take. Not user-generated. The four `authenticated`
      insert/update policies were therefore dropped; the two `SELECT` policies
      were kept so signed-in users can still read.

> ⚠️ **Lesson worth keeping:** Supabase's security advisor reported **30 findings
> before these fixes and 30 after** — it never flagged either hole. Both were
> found by querying grants and policy *roles* directly. A policy named "Service
> role full access" was open to the public. **A clean advisor run is not evidence
> that access control is correct** (Rule 2).

### 3.0-OPEN Remaining database items (prepared, not applied)

- [ ] `…000003_rls_initplan_wrap_auth_calls.sql` — 17 policies re-evaluate
      `auth.uid()` per row instead of once per query. Compounds badly at 200 listings.
- [ ] `…000004_revoke_st_estimatedextent.sql` — closes 6 advisor warnings at once.
- [ ] `…000005_spatial_ref_sys_rls.sql` — ⚠️ highest breakage risk of the five;
      the table is owned by the PostGIS extension. Apply alone, then immediately
      re-test a map / radius search.
- [ ] **Decide on two exposed regulatory fields.** `public_profiles` exposes
      `dhsud_number` and `prc_expiry` to anonymous visitors alongside
      `prc_license` / `prc_verified`. Public license verification is plausibly
      the intent for the PRC pair; the other two deserve a deliberate decision
      rather than an inherited default.

> **How to apply the remaining three:** one migration at a time, verifying after
> each. Verification SQL is written as comments at the foot of each file.
> ⚠️ `supabase/migrations/` is known to have **drifted from the live database**.
> These files were generated from live introspection, not from that directory's
> history. Always query the live schema before trusting anything in that folder.

### 3.1 Supabase Platform Toggles (live advisor read 2026-08-13)

Evidence: `[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/THREE_PLATFORM_SECURITY_AUDIT_2026-08-13]]`.
Full engineering queue is in **§1.0E** of [[00_MASTER_ACTION_PLAN]]; only the
owner-gated items are repeated here.

- [x] **Leaked Password Protection — intentionally deferred.** It is unavailable
      on the current Supabase Free plan. Revisit only when Pro is activated for
      an independent reason; do not purchase Pro solely for this toggle.
- [ ] **Schema Change Approval — `spatial_ref_sys`**: Approve enabling RLS on this PostGIS system table. It is the only object in the whole audit with **no policy gate at all**. Content is public reference data (coordinate systems), not user data, so the real risk is low — but it is the one place the honest answer to "is this open?" is *yes*.
- [ ] **Awareness only, no action yet — `postgis` / `vector` in `public` schema**: Supabase flags these. ⚠️ Moving them **rewrites every spatial query in the app**. Do not approve a relocation as routine cleanup; it needs its own plan.

---

## 🌐 4. Infrastructure, DNS & Mission Control Setup

### 4.0 🔴 Finish Google Search Console Verification (live check 2026-08-13)

Evidence: `[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/SEARCH_ANALYTICS_DNS_AUDIT_2026-08-13]]`.

- [ ] **Finish the Search Console property.** It was **started and never completed**. The DNS `TXT` token is already live on the apex (`google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM`), but `search.google.com/search-console` shows the **welcome/onboarding** screen with Google's own *"Already started? finish verification"* prompt. **Consequence: zero query, impression, click, position, and coverage data exists, and none is accumulating.** The sitemap has never been submitted. Verification takes minutes — the DNS token is in place and GA4 is already installed, so either route works.
- [ ] **Check which Google account holds it.** Not ruled out: the property may sit under a **different Google account** than the one in daily use. Only you can confirm this.
- [ ] **Submit `https://www.scoutit.space/sitemap.xml`** once the property is verified. It serves valid XML and is already advertised in `robots.txt`.
- [ ] **Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel** as a *second* verification method, so the property survives the DNS cutover below.

> ⚠️ **Order matters.** Doing §4.1 **before** the items above would drop the only verification token and reset Search Console to zero again. **Verify first, then migrate DNS.** Either way, carry the `google-site-verification` TXT record across.

### 4.1 GoDaddy to Cloudflare DNS Cutover
- [ ] Export complete live GoDaddy DNS zone (including non-public records).
- [ ] Create ScoutIt Cloudflare account with strong 2FA and offline recovery codes.
- [ ] Change authoritative nameservers to Cloudflare after verifying matching DNS zone.
- [ ] Enable DNSSEC in Cloudflare and publish DS record at GoDaddy. Keep public Vercel host DNS-only (no orange-cloud proxy during cutover).

### 4.2 Staff Mailbox & Identity Strategy
- [ ] Require each staff member to create a dedicated free ScoutIt-only Gmail account (`name@scoutit.space` forwarding alias).
- [ ] Enforce TOTP authenticator MFA on Gmail and Supabase staff accounts; store recovery codes offline.
- [ ] When Google Workspace Business Starter is activated later, provision managed `name@scoutit.space` mailboxes and transition Supabase auth seamlessly.

### 4.3 Recognized Device Posture (Mission Control)
- [ ] Require Cloudflare One Client (posture-only) on staff devices (screen lock, disk encryption, OS updates).
- [ ] Authorize at most **2 persistent devices per staff member** (1 computer, 1 phone). Re-evaluate posture every 90 days.
- [ ] Require 24-hour explicit approval for temporary extra devices.

### 4.4 Mission Control (`mc.scoutit.space`) Deployment
- [ ] Create Supabase Personal Access Token (`SUPABASE_ACCESS_TOKEN`) under Supabase Account > Access Tokens. Add to Mission Control Vercel environment.
- [ ] Deploy Mission Control to `mc.scoutit.space` under Cloudflare Access (exact-email, MFA, device posture rules).
- [ ] Verify `X-Robots-Tag: noindex`, private cache policy, and watermark deterrence.
- [ ] Apply Supabase migration `20260809000002_onboarding_completion_contract` via Mission Control System Operations panel.
- [ ] Apply pilot cohort registry migration `20260811000002_pilot_cohort_registry` via MMC using checksum `C3910F49F333B023FF2B99F558F0057E954314E8302AA12C5DB018C03ED36140`.
- [x] **Do not apply** `20260809000001_security_telemetry_retention.sql`; it was
      superseded by `20260812000001` and would regress the live telemetry fix.
- [ ] Approve a replacement **compaction** migration only after its aggregate
      contract, flagged-row exemption, retention, and scheduler are documented.

---

## ⚖️ 5. Product, Brand & Legal Decisions

### 5.1 Pricing & Copy Alignment
- [ ] **Six Pricing Benefits**: For the 6 advertised but unbuilt pricing features, choose: **(A) Build**, **(B) Deliver manually**, or **(C) Remove from pricing page**.
- [ ] **Broker Traffic Visibility**: Decide whether a broker can see listing view analytics on a property *before* their representation pitch is formally accepted by the owner.

### 5.3 💳 Payment Provider — **DECISION NEEDED, may block the payment build** *(added 2026-08-13)*

Engineering can build the payment **logic** now behind a provider-agnostic
adapter, so this decision does not block starting. It **does** block finishing.

- [ ] **Verify whether Stripe is even available to a Philippine-registered
      business** for accepting payments *and* receiving payouts, against Stripe's
      own current documentation. Historically the Philippines has **not** been on
      its supported list for local entities. **Do not assume — confirm.** If it is
      not available, Stripe is out regardless of preference
- [ ] **Evaluate the local/regional options**: PayMongo, Xendit, Maya Business,
      Dragonpay, PayPal
- [ ] **Decide which payment methods ScoutIt must accept.** In the Philippines
      **GCash and Maya** dominate, alongside bank transfer/InstaPay and
      over-the-counter. A card-only provider can satisfy the code and still fail
      the customer
- [ ] **Confirm recurring-billing support specifically.** Several local providers
      handle one-off payments well and subscriptions poorly — and ScoutIt's model
      is subscription tiers plus Connects top-ups
- [ ] Compare on: PH entity eligibility · GCash/Maya · settlement time · fees ·
      sandbox quality · refunds · BIR-compliant invoicing

**Engineering constraint already recorded** ([[00_MASTER_ACTION_PLAN]] §Priority
tiers): no payment SDK may be imported outside the single adapter module, so
switching providers later touches one file rather than the product.

### 5.4 Legal and Privacy Sign-off

- [ ] Appoint the accountable privacy owner/DPO and have Philippine counsel classify mandatory NPC registration versus the applicable exemption or sworn-declaration route using ScoutIt actual processing, risk, profiling/automation, staffing, and sensitive-personal-information volume.
- [ ] Complete and retain the approved NPCRS registration or exemption/SDAU evidence; do not infer the filing path from record count alone.
- [ ] Approve the PIA/DPIA, records of processing, breach-response ownership, data-subject request procedure, and retention schedule.
- [ ] Approve processor/vendor DPAs and cross-border transfer terms for the providers actually used in production.
- [ ] Confirm the legal entity name, business address, contact channels, governing law/venue, Terms version, Privacy version, and real effective date before pilot enrollment.
- [ ] Obtain counsel review of RESA/non-brokerage boundaries, listing and price representations, professional/event-planner roles, Connect terms, refunds, and payment-provider disclosures.
- [ ] Approve work-for-hire, contributor, media, 3D/spatial capture, and IP/license terms before accepting third-party production assets.
- [ ] Decide and document a private backup location and restore owner for the mostly gitignored ScoutIt Brain; do not make the private vault public merely to back it up.

### 5.2 Ecosystem & Design Choices
- [ ] **Public Profile Indexability**: Decide when public professional profiles should be indexable by Google. *(Recommendation: Keep `noindex`ed until demo accounts are replaced with real users).*
- [ ] **Cyan `#00f2fe` and Magenta `#ff75c3` Tokens**: Confirm whether to keep cyan/magenta semantic tokens in the dashboard alongside Gold/Sapphire/Emerald.
- [ ] **Operator and Provider Roles**: Decide whether to build out Operator/Provider workflows or temporarily streamline the role switcher.
- [ ] **Session-less Dashboard Mode**: Confirm that client-side `localStorage` dashboard rendering is intentional for demo/testing and that API endpoints independently enforce server-side auth.

---

## ⏸️ 6. Trigger-Gated Future Commercial & Scale Actions

*These items remain locked until specific traffic, user, or revenue triggers are met.*

| Item | Trigger | Action Required |
|---|---|---|
| **Vercel Pro Upgrade** ($20/mo) | First commercial peso / paid subscription | Upgrade Vercel plan to Pro for commercial SLA compliance. |
| **Supabase Pro Upgrade** ($25/mo) | Pre-launch / real user signups | Enable Supabase Pro with PITR backups and leaked-password protection. |
| **Separate Dev Supabase Project** | First real non-tester user signup | Spin up `scoutit-dev` Supabase instance so local dev no longer touches production DB. |
| **Cloudflare R2 Spatial Vault** | 200 real approved listings + first paying subscriber | Activate R2 bucket for super-large 3D packages/spatial scans; configure budget alerts and signed URL expiration. |
| **Google Workspace Starter** | Financial sustainability | Provision managed `name@scoutit.space` mailboxes to replace Gmail forwarding. |

---

## ✅ 7. Cleared & Verified Ledger

*Finished owner actions recorded here to prevent accidental re-auditing or duplicate work.*

| Item | Cleared Date | Verification Summary |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | 2026-08-08 | Set in Vercel; live site emits `www.scoutit.space` canonicals. |
| Google OAuth Onboarding | 2026-08-09 | Google provider enabled in Supabase; "Continue with Google" live in deployment `dpl_46bx8x7tFboT2nxFjswR1eVvdbZ1`. Owner completed login test. |
| Turnstile Widget Domain | 2026-08-09 | Added `scoutit.space` and `www.scoutit.space` to Cloudflare Turnstile widget `ScoutIT`. Verified site key & secret. |
| Vercel Project Linking | 2026-08-09 | Approved repository Vercel link repair from stale `scoutit` to live `scout-it`. Deployment `dpl_46bx8x7tFboT2nxFjswR1eVvdbZ1` ready. |
| Ranking Model Alignment | 2026-08-08 | Decided 2-layer ranking: independent ratings (unbought) + ScoutIt Match relevance. |
| Sample Badging & `noindex` | 2026-08-08 | Samples badged for human testing and set to `noindex, follow` in metadata and sitemaps. |
| DB Migration `20260806000006` | 2026-08-06 | Applied & verified: lister claims + closed world-readable policy on `property_control_assignments`. |
| Anonymity Shield Gate (D4) | 2026-08-06 | Closed: shield is a role capability, not a paywalled tier. |
