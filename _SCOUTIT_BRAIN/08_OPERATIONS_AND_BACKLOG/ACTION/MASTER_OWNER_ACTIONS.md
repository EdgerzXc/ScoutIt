---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [master-owner-actions, founder-actions, decisions, credentials, approvals, launch-readiness]
updated: 2026-08-12
related:
  - "[[00_MASTER_ACTION_PLAN]]"
  - "[[../BACKLOG/00_START_HERE]]"
  - "[[../../00_MASTER_SYNC]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]]"
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

### 1.10 🧨 Apply the §1.0B Critical Security Migration — **BLOCKS HUMAN TESTING**

*Engineering closed all ten §1.0B findings on 2026-08-12, plus four further bugs found while fixing them. The database half is inert until this migration is applied. Full detail: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]].*

**File:** `supabase/migrations/20260812000001_critical_logic_and_security_fixes.sql`
**Project:** `yyixsuaimdzyiocswcgc` (ScoutIT) — the only project; there is no staging.

**Pre-flight was run live on 2026-08-12 and every destructive statement measured as a no-op on current data:** `saved_intel` 0 rows / 0 duplicates, `property_claims` 0 rows, and 0 properties change public visibility (10 approved = 10 live). The only data change is collapsing 145 duplicate telemetry rows into counters.

- [x] **✅ APPLIED 2026-08-12** to `yyixsuaimdzyiocswcgc`, as five isolated tracked migrations, all succeeded. Verified after: forgery path gone, both triggers active and confirmed `SECURITY INVOKER`, `property_claims.property_id` now UUID with FK, 145 duplicate telemetry rows collapsed with all 4,205 observations preserved, 0 duplicate groups remaining, public property count unchanged at 10, `deals` UPDATE still deny-all. Supabase security advisor clean of anything this created. Evidence: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/CRITICAL_LOGIC_SECURITY_1_0B_2026-08-12]] §5.
- [ ] **Re-test the Mission Control publish path.** `pipeline_status` and `lifecycle_state` are now writable only by the service role. Verified in code that all lifecycle routes and Mission Control CMS actions use the admin client, so this *should* be transparent — but confirm approve / publish / withdraw / suspend end to end anyway.
- [ ] **Re-test owner property intake.** A client-created property can no longer arrive `approved` or `live`; it is forced to `pending` / `draft`. Confirm the listing flow completes and lands in review.
- [ ] **Spot-check the public property list and one property page** still render after the SELECT policy swap.
- [ ] **Decide the Scout Rating formula (product, not security).** The handshake used to write `user_profiles.scout_rating`, a column that does not exist — it would have errored the first time any handshake completed. The real column is `broker_profiles.scout_rating`, `numeric(3,2)`, a 0–5 rating that **overflows at 10.00**, so incrementing it per closed deal was never right. The migration now credits `broker_profiles.verified_closures` instead. **How a verified closure should move the displayed 0–5 rating is your call, and no broker rating is being computed until you make it.**
- [ ] **Record applied date:** `______`

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
- [ ] **Secret Scanning Alert**: Review alert #1 in GitHub; mark synthetic test fixtures as false positives or rotate active credentials immediately if exposed.
- [ ] **Least-Privilege Actions**: Approve GitHub Actions workflow permissions (read-only default, SHA-pinned actions).

---

## 🌐 4. Infrastructure, DNS & Mission Control Setup

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
- [ ] Apply telemetry retention migration `20260809000001_security_telemetry_retention.sql` and verify `scoutit-clean-security-telemetry` pg_cron job.

---

## ⚖️ 5. Product, Brand & Legal Decisions

### 5.1 Pricing & Copy Alignment
- [ ] **Six Pricing Benefits**: For the 6 advertised but unbuilt pricing features, choose: **(A) Build**, **(B) Deliver manually**, or **(C) Remove from pricing page**.
- [ ] **Broker Traffic Visibility**: Decide whether a broker can see listing view analytics on a property *before* their representation pitch is formally accepted by the owner.

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
