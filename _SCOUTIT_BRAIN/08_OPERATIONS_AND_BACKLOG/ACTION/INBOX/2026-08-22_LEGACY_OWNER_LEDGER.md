---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: stale
tags: [legacy, evidence, non-executable, superseded-owner-ledger]
updated: 2026-08-22
related:
  - "[[00_MASTER_ACTION_PLAN]]"
  - "[[../00_START_HERE]]"
  - "[[../../00_MASTER_SYNC]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/historical/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]]"
---

# 👑 MASTER OWNER ACTIONS

> **SUPERSEDED 2026-08-22. Do not execute checkboxes in this file.** Use the
> lean [[MASTER_OWNER_ACTIONS]] for Jerzel's current lane. This copy preserves
> prior dashboard findings, decisions, and evidence for reconciliation only.
> Any later claim below that this is a live or canonical checklist is preserved
> historical prose and is no longer true.

> **This is the single canonical checklist for work requiring Jerzel personally.**
> It unifies all founder actions, credential setups, external service dashboards, device passes,
> product/legal decisions, and launch gates into one master file.
> Engineering work lives in [[00_MASTER_ACTION_PLAN]]. If another file conflicts with this master list, this file wins.

---
## Jerzel's actual queue - ignore the size of the full ledger

The rest of this file is a complete owner ledger, including later launch and
trigger-gated work. **Jerzel does not need to work all of it now.** At the current
pre-pilot stage, these are the only owner packages that deserve attention.

### Do now - short decisions and dashboards

1. **DONE 2026-08-14 - Database authority policy approved and live audit completed.**
   Five migrations are ready conditionally; PostGIS `spatial_ref_sys` is held. Nothing was applied.
2. **DONE 2026-08-16 — and the premise was wrong.** This was recorded as *"the
   clearest real owner blocker"* and as *"started and never completed"*, with
   the stated consequence that **"zero query, impression, click, position and
   coverage data exists, and none is accumulating."**

   **That was false.** Read directly from Search Console on 2026-08-16, the
   property `sc-domain:scoutit.space` is **verified and has been collecting for
   months**:

   | | |
   |---|---|
   | Verification | ✅ Complete — domain property, not pending |
   | Search clicks | 14 in the trailing window |
   | Indexed pages | 17 indexed, 3 not indexed |
   | History | Coverage data back to 2026-05-18 |

   The half that *was* true: **zero sitemaps had been submitted** (`0-0 of 0`).
   Submitted `https://www.scoutit.space/sitemap.xml` on 2026-08-16 — 16 URLs,
   HTTP 200, valid XML. It initially reports **"Couldn't fetch"**, which is
   normal immediately after submission; ruled out the real causes rather than
   assuming: `robots.txt` allows it and already declares the same sitemap URL,
   a Googlebot user-agent fetch returns 200, and the apex 308-redirects to
   `www`. Re-check the status in a day.

   - [ ] Confirm the sitemap status flips off "Couldn't fetch" within ~48h. If
         it has not, that is then a real finding rather than a fresh-submission
         artefact

   > **Why this item was wrong for months, and it is the same root cause as
   > everywhere else in this file:** the original note recorded that
   > `search.google.com/search-console` *"shows the welcome/onboarding screen"*.
   > That is what Search Console shows when you are signed out or land without a
   > property selected — it is not evidence that verification is incomplete. A
   > UI impression was written down as a system fact and then repeated, and
   > Standing Rule 2 exists for exactly this: **check the system, not the layer
   > that describes it.** Nobody re-opened it because the item said only *who*
   > could do it, never *how to look*.
3. **MOSTLY DONE 2026-08-16 - four of five credentials proved present from
   outside, without any value being read.** No dashboard access was needed: each
   was confirmed by the behaviour it causes in production, which is stronger
   evidence than a settings screenshot anyway (Standing Rule 2 — check the
   system, not the layer that describes it).

   | Credential | Verdict | Evidence |
   |---|---|---|
   | `CRON_SECRET` | **present** | `cronAuth.js` returns **503** when the secret is absent and **401** when it is set but the caller is wrong. All three `/api/cron/*` routes returned **401** unauthenticated and with a deliberately wrong bearer token |
   | `UPSTASH_REDIS_REST_URL` | **present** | `proxy.js` constructs the limiter only when **both** Upstash vars exist, with no in-memory fallback |
   | `UPSTASH_REDIS_REST_TOKEN` | **present** | `/api/cms` returned `X-Ratelimit-Limit: 30`, matching `Ratelimit.slidingWindow(30, '10 s')` exactly |
   | `NEXT_PUBLIC_GA_ID` | **present** | `G-36WQZF409S` served in the live homepage |
   | `RESEND_API_KEY` | **UNKNOWN — owner must check** | Not externally observable. Nothing renders it and `/api/health` does not report it; the only external probe is sending mail, which was deliberately not done |

   **Owner reported 2026-08-16: `RESEND_API_KEY` is believed NOT set.** Traced
   what that actually costs, because the answer is reassuring in one direction
   and not in the other.

   **Nothing breaks.** `notifyUser` in `src/lib/notifications.js` writes the
   in-app notification first and only then checks `isEmailConfigured()`,
   returning early when it is false. The in-app notification is the system of
   record and still fires. This is the documented design in `src/lib/email.js`
   — email is a courtesy layer, and the whole path is written, tested, and inert
   until the key exists. It fails safe, exactly as intended.

   **But nobody is told anything unless they are already looking at the site.**
   Eleven routes call into notifications, and they are precisely the moments a
   human is waiting on another human:

   - `api/deals/initiate` — **a Connect was just spent on them**
   - `api/deals/pitch`, `api/inquiries` — someone is asking about a property
   - `api/cron/check-stale-listings`, `api/cron/sweep-pending-requests` — the
     freshness and expiry warnings that assume the owner gets told
   - `api/dashboard/units/delegate` — a delegation handshake awaiting a response

   For an invited pilot this is a quality problem rather than a correctness one:
   a tester who spends a Connect and closes the tab hears nothing back, and the
   thing being tested is precisely whether the connection loop feels alive.

   **UPDATE — owner set `RESEND_API_KEY` on 2026-08-16**, shortly after reporting
   it was probably missing. Awaiting confirmation in production.

   - [x] Owner set the key. The near-miss variable name recorded in an earlier
         session was the likely original cause; setting it under the exact name
         `RESEND_API_KEY` is the fix either way
   - [ ] **Confirm it in production rather than trusting the dashboard.** A key
         set under a near-miss name looks identical to a key set correctly when
         read off a settings screen — which is exactly how this was missed the
         first time. `/api/health` now reports `services.email` as `configured`
         or `unconfigured`, so one unauthenticated request settles it:

         `curl -s https://www.scoutit.space/api/health`

         Ships with the health-endpoint change; verify after that deploy.
   - [ ] **Then verify the sending domain separately.** `configured` proves the
         key exists, not that mail arrives. Until the Resend domain is verified,
         delivery fails for every recipient except the account owner's own
         address, and `src/lib/email.js` sends *from* `notifications@scoutit.space`
         — a domain with **no MX records** (2026-08-16 addendum), so replies and
         bounces have nowhere to land. Setting the key moves the failure from
         "nothing sent" to "sent and possibly undeliverable," which is harder to
         notice, not easier
   **ANSWERED 2026-08-16 by reading the Resend dashboard directly: there is NO
   verified sending domain. Resend reports "No domains yet."**

   So email is still not working, and it now fails in a *worse* way than before:

   | | Before the key | After the key |
   |---|---|---|
   | Behaviour | `sendEmail` returns `skipped: "no_provider"` | Resend is called and **rejects the send** |
   | Visibility | Silent by design, documented, expected | A provider error on every notification |

   `EMAIL_FROM` is **not set** either, so `src/lib/email.js` falls back to
   `notifications@scoutit.space` — a domain that is not registered in Resend at
   all, and which has **no MX records** (2026-08-16 addendum). Every send will be
   from an unverified domain.

   **This is the predicted failure mode, arriving on schedule:** setting the key
   moved the problem from "nothing is sent" to "sent and rejected," which is
   harder to notice because it looks configured.

   **RESOLVED 2026-08-16 — route 1 taken at the owner's instruction. Domain
   added in Resend and the DNS records placed at GoDaddy.**

   `scoutit.space` (the apex, so it matches the existing
   `notifications@scoutit.space` sender without a code change) was added to
   Resend, region Tokyo `ap-northeast-1`. **Manual setup was chosen over Resend's
   "Auto configure" deliberately:** auto-configure asks for authorization to make
   DNS changes on the account, which grants write access to the whole zone. Three
   named records is a smaller blast radius than delegated zone control.

   Records added at GoDaddy — the zone went from 8 records to 11:

   | Type | Name | Value | Priority |
   |---|---|---|---|
   | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3…JdS0wIDAQAB` (DKIM) | — |
   | TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
   | MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |

   Every value was read back from the form and compared against Resend's own
   page before saving, then confirmed present in GoDaddy's record list after.

   **The Google Search Console TXT token survived, as required.** Verified twice:
   in GoDaddy's list after saving, and against a public resolver — still
   `google-site-verification=7JuJY3yeardpNnfXokGbh7l5QUUXen4CJESset64uuM`,
   unchanged. Nothing existing was edited or deleted; all three records are
   additive.

   Public resolver check immediately after saving: **MX already resolves**
   (`10 feedback-smtp.ap-northeast-1.amazonses.com`); the two TXT records had not
   propagated yet, which is normal. Resend status moved `Not Started` → **Pending**
   and it is now polling ("this may take a few hours depending on GoDaddy's
   propagation time"). It flips to Verified on its own.

   - [ ] Confirm Resend reports **Verified**, then send one real test message.
         `configured` proved the key exists; only a delivered message proves the
         chain. Until then email remains functionally off
   - [ ] `EMAIL_FROM` still unset. The fallback in `src/lib/email.js` is
         `ScoutIt <notifications@scoutit.space>`, which now matches the domain
         being verified — so it will work as-is. Set it explicitly anyway: a
         hardcoded default that happens to be right is how the unverified-domain
         problem stayed invisible in the first place

   <!-- Original decision, kept for provenance:
   - [ ] **Decide the sending identity.** Two routes, and this is a real choice:
         1. **Verify `scoutit.space` in Resend** (recommended). Add the domain in
            Resend, then add the DKIM/SPF records it issues at GoDaddy. Gives a
            real `notifications@scoutit.space` sender. **Requires a DNS change** —
            additive only, and the Google Search Console TXT token must be left
            untouched
         2. **Ship the pilot in-app-only.** Leave email off deliberately, and
            tell testers the site is the place to check. Honest and zero-risk,
            but the connection loop stays quiet
   - [ ] Whichever route: set `EMAIL_FROM` explicitly rather than relying on the
         fallback. A hardcoded default that names a domain nobody verified is how
         this stayed invisible
   -->
   - [ ] **Decide before the pilot:** either configure Resend, or accept and
         document that the pilot runs in-app-only and tell testers to check the
         site. Do not leave it ambiguous — see §1.6A, which forbids promising a
         reply channel that cannot deliver
   **Google Calendar redirect URIs — DIAGNOSED AND FIXED 2026-08-16.** The owner
   reported Calendar "was already working before, now it's not." It was a
   `redirect_uri_mismatch`, and both halves were verifiable:

   `src/lib/calendar/googleOAuth.js` builds the callback as
   `${SITE_URL}/api/oauth/google/callback`, and `SITE_URL` resolves from
   `NEXT_PUBLIC_SITE_URL` — which Vercel shows as **updated Aug 8**. Production
   `SITE_URL` is `https://www.scoutit.space` (confirmed independently: the live
   sitemap is generated from the same helper and emits that host).

   Google Cloud had only two authorized redirect URIs registered, both from
   Jul 18: `http://localhost:3000/...` and `https://scout-it.vercel.app/...`.
   Neither matches, so Google refused every consent attempt. The console's own
   **"Last used date: July 18, 2026"** — the day the client was created —
   confirms it has not completed a flow since.

   | Date | Event |
   |---|---|
   | Jul 18 | Calendar OAuth client created against `scout-it.vercel.app`; worked |
   | Aug 8 | `NEXT_PUBLIC_SITE_URL` changed to the custom domain |
   | Aug 8 → 16 | Every Calendar connect failed on `redirect_uri_mismatch` |

   - [x] Added `https://www.scoutit.space/api/oauth/google/callback` as a third
         authorized redirect URI on the **ScoutIt Calendar** client. Additive —
         localhost and the vercel.app host were left in place, so local
         development is unaffected. Verified persisted by re-reading the client
         after save. Google notes propagation takes 5 minutes to a few hours
   - [ ] Owner to confirm a real Calendar connect succeeds end to end
   - [x] **Authentication flow corrected 2026-08-21.** Onboarding now uses
         Google Identity Services directly in the ScoutIt page and exchanges the
         returned ID token through `/api/auth/complete-onboarding`. The Google
         account chooser no longer presents the Supabase project hostname as the
         product being entered. The project URL itself is a public API endpoint,
         not a secret; the defect was public-facing identity/branding, not key
         exposure.

         Google Cloud consent-screen and app branding remain a separate owner
         configuration. The owner confirmed that configuration is not available
         now, so it is deferred and must not be attempted as part of the current
         engineering queue.
   > **The generalisable bug:** `NEXT_PUBLIC_SITE_URL` is an input to every
   > absolute URL the product emits — OAuth callbacks, OG images, share links,
   > the sitemap. Changing it silently invalidates every external system holding
   > a copy. Treat a change to it as a migration with a checklist, not a config
   > edit.
   - [ ] Consider extending `/api/health` to report *configured/not configured*
         booleans (never values) for the credentials that have no other outward
         symptom. This item needed a code read plus three live probes to answer a
         question the system could answer about itself in one request.
4. **APPROVED BY OWNER 2026-08-16 — public-profile policy.** The recommendation
   as written is now the ruling: canonical `/profile/[username]`; index **only**
   profiles that are real, verified, **and** explicitly made public by the
   person; samples and private profiles stay `noindex`; exposure is governed by
   an **explicit public-field allowlist**, not by whatever happens to be on the
   record.

   The allowlist is the load-bearing half. Without it, any column added to a
   profile table later becomes public the moment it ships, with no decision
   taken. Treat adding a field to the allowlist as a privacy decision.

   Unblocks: §1.4 search-indexing follow-through, and the public-profile
   canonical/indexing work previously held behind the owner checkpoint.

5. **APPROVED BY OWNER 2026-08-16 — listing truth.** `pipeline_status` is the
   single lifecycle source of truth for whether a listing is publicly live.
   Verification and moderation fields are supporting information and carry **no
   public authority** unless a deliberate, recorded migration changes that.

   - [ ] Audit every read path that currently decides "is this listing live?"
         and confirm it consults `pipeline_status` and nothing else. Standing
         Rule 4 applies — an exact-match filter on a status string fails by
         showing nothing, and showing nothing looks exactly like having nothing
   - [ ] Record the permitted `pipeline_status` values against the live schema,
         not against this document (Standing Rule 20 — `information_schema` is a
         test fixture)
6. **ALREADY DONE - closed 2026-08-13 by EdgerzXc; verified via the GitHub API
   2026-08-16.** The alert reports `"state": "resolved"`, `"resolution":
   "used_in_tests"`. **This item had been sitting in the owner queue for three
   days after it was finished.**

   Two corrections to the description that was here: the secret was a
   **Stripe webhook signing secret** (`stripe_webhook_signing_secret`), not a
   Clerk key — it merely lived inside a vendored Clerk testing skill at
   `.agents/skills/clerk-auth-testing/SKILL.md`. Nothing needed rotating either
   way, so the conclusion held, but the label did not.

   > **Process finding.** Nothing in this queue re-reads its own external state,
   > so a finished item stays "open" until a human happens to look. This is the
   > mirror of the §1.6 finding (prose with no checkbox is never executed): a
   > checkbox with no re-check is never closed. Both are cheap to verify from
   > outside — this one took a single API call.

### Do before inviting outside testers - not necessarily today

- Add/tag `Is_Sample` records and configure the sample inquiry recipient UUIDs.
- Complete one iPhone and one Android physical-device pass after the intended
  release/environment is confirmed.
- Rehearse Mission Control publish, owner intake, public property read, cron
  authentication, and the 1-Connect refund with test data.
- Establish owner/staff MFA, recovery, Mission Control access, and device posture.
- Complete the legal/privacy identity, terms, retention, DPO/privacy-owner, and
  counsel gates before collecting external tester data.
- Recruit the small invited cohort only after those gates pass.

### Not needed now

Do not spend time now choosing a payment provider, activating paid mode, buying
Vercel/Supabase Pro, enabling R2, creating Google Workspace mailboxes, scaling to
200 listings, or building future SEO/Ownership/Intel modules. Those remain
trigger-gated.

### Already done - no owner action

GitHub PR #63 is merged as `77f0ce4`; Speed Insights and the release-contract
commit are already on `main`. Do not create another PR or repeat that comparison.

## 🧭 Operating Rules

1. **Tasks live in this file only.** Do not duplicate owner actions across multiple backlog files.
2. **Never paste raw secret values here.** Record only that a credential was set and where it is configured (e.g. Vercel, Supabase, Cloudflare).
3. **Tick and date when complete.** An untracked "I think I did that" leads to broken environment states.
4. **When an item is finished**, notify the implementing AI agent so evidence can be recorded in the done log and cross-references updated.
5. **No premature commercial spend.** Do not enable paid infrastructure (Vercel Pro, Supabase Pro, R2) until stated trigger thresholds are reached.

---

## Detailed how-to reference - use only when an item enters the actual queue

> This preserves click paths and evidence requirements. It is not a second queue.
> Use [[#Jerzel's actual queue - ignore the size of the full ledger]] to decide
> what Jerzel should actually do now.

| Order | Owner package | Why it comes now | Existing checklist |
|---:|---|---|---|
| **Done** | Release merge | GitHub PR #63 is merged as `77f0ce4`. No owner action remains in this queue. | Historical evidence below |
| **Done** | Migration source of truth | Authority is recorded and all remaining migrations were audited read-only on 2026-08-14. Applying the five ready migrations still requires separate approval. | Sections 1.12, 3.0-OPEN, and 4.4 |
| **3** | Search Console before DNS | Verification and sitemap submission must precede Cloudflare nameserver changes, and the Google TXT record must survive the cutover. | Sections 4.0 then 4.1 |
| **4** | Production credentials and limiters | Email, GA4, cron verification, Upstash, and calendar OAuth require dashboard access and block truthful live testing. | Sections 1.3, 1.4, 1.8, and 1.11 |
| **5** | Public profile contract | Choose canonical profile URLs, indexability timing, and public regulatory fields together; they affect robots, sitemap, JSON-LD, privacy, and directory navigation. | Sections 3.0-OPEN and 5.2; engineering detail in [[00_MASTER_ACTION_PLAN]] sections 1.0D/1.1/1.4D |
| **6** | Real-device acceptance | Run only against the intended deployed release, after the environment and sample gates above are correct. | Sections 1.2 and 2 |

### Owner-instruction standard

Whenever an agent asks Jerzel to act, it must provide: **where to go, exact clicks,
exact value/decision, expected success state, safety warning, and what evidence to
return.** Never assign a vague task such as "verify Vercel" or "review security."
Never ask Jerzel to paste a secret into chat or documentation.

### Completed reference - GitHub release merge (no owner action)

GitHub is complete. User screenshot and refreshed remote history verify that pull
request **#63** merged the branch into `main` as commit `77f0ce4`. The compare page
correctly says there is nothing left to compare. Do not create another pull request.

Do this now:

1. Open [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **`scout-it`** project. Do not select the obsolete similarly named project.
3. Click **Deployments**.
4. Find the newest deployment whose source is `main` and whose commit is `77f0ce4`
   or whose title says pull request #63 / release verification.
5. If its status is **Building**, wait. If it is **Error**, open it and send a
   screenshot of the error summary; do not redeploy repeatedly.
6. If its status is **Ready**, open the deployment and confirm the assigned domains
   include `www.scoutit.space` or `scoutit.space`.
7. Open `https://www.scoutit.space` in an incognito window and confirm the homepage loads.
8. Return: a screenshot showing the Vercel deployment status and commit, the
   deployment URL, and whether the homepage loaded. Do not send environment values.

Expected result: a Ready production deployment sourced from merge `77f0ce4`, with
the ScoutIt production domain attached and the homepage loading.

<!-- BEGIN:SUPERSEDED_CHECKPOINT_1_GITHUB_STEPS
### Checkpoint 1 - merge and verify the release baseline (do this now)

Current evidence: `codex/production-release-verification` is pushed and is two
commits ahead of `main`: `aa76899` (emergency-mode release contract) and `dbe7dfb`
(Vercel Speed Insights). The documentation edits from this session are local and
are not part of those two commits.

1. Open [GitHub's branch comparison](https://github.com/EdgerzXc/ScoutIt/compare/main...codex/production-release-verification?expand=1).
2. Confirm the base says **`main`** and compare says **`codex/production-release-verification`**.
3. Click **Create pull request**. Title it `Release verification and Speed Insights`.
4. Wait for every required GitHub check to finish. Do not merge if any required
   check is red or still pending.
5. Click **Merge pull request**, then **Confirm merge**. Do not use force push,
   rebase locally, or delete `main`.
6. Open [Vercel](https://vercel.com/dashboard), select the **`scout-it`** production
   project (not the obsolete similarly named project), then open **Deployments**.
7. Open the newest deployment sourced from `main`. Wait until it says **Ready**
   and its domains include `www.scoutit.space` or `scoutit.space`.
8. Open `https://www.scoutit.space` in a private/incognito window and confirm the
   homepage loads. Do not treat this as the later full physical-device pass.
9. Return only: the GitHub pull-request URL, the merge commit SHA, the Vercel
   deployment status/URL, and whether the homepage loaded. Do not send secrets.

Expected result: `main` contains both commits and Vercel shows a Ready production
deployment sourced from that merged `main` commit.

END:SUPERSEDED_CHECKPOINT_1_GITHUB_STEPS -->

### Checkpoint 2 - approve the migration authority (reply in chat; no dashboard)

Copy and send this exact sentence if you approve the recommended safe policy:

> I approve tracked Supabase migrations as ScoutIt's database source of truth. Mark `20260803000001_production_security_rls.sql` and `20260809000001_security_telemetry_retention.sql` as superseded. Audit the remaining unapplied migrations individually against the live schema and show me the plan and verification before applying anything.

This authorizes documentation/annotation and a read-only audit. It does **not**
authorize applying a migration, deleting live data, or scheduling retention.

### Checkpoint 3 - finish Search Console before touching DNS

1. Open [Google Search Console](https://search.google.com/search-console) using
   each ScoutIt-related Google account if necessary.
2. Use the property selector in the upper-left and look for `scoutit.space`.
3. If it exists, select it. If Google shows **Finish verification**, click it and
   click **Verify**; the DNS TXT token is already present.
4. If it does not exist, choose **Add property** -> **Domain**, enter
   `scoutit.space` (no `https://`, no `www`, no path), then click **Continue** and
   **Verify**. Do not replace the existing TXT record.
5. After ownership succeeds, open **Sitemaps** in the left menu. Under **Add a new
   sitemap**, enter `sitemap.xml` and click **Submit**.
6. Expected state: property ownership says verified and the submitted sitemap
   appears with status **Success**. Processing counts may take time.
7. Return a screenshot or text containing the verified property name, sitemap
   status, and Google account email used. Do not start the Cloudflare DNS cutover.

### Checkpoint 4 - production credentials and external settings

Perform these in order and report each as `present`, `set`, or `blocked`; never
send the value itself.

1. Vercel -> **scout-it** -> **Settings** -> **Environment Variables** -> filter
   **Production**. Confirm `NEXT_PUBLIC_GA_ID`, `CRON_SECRET`,
   `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` exist.
2. If `NEXT_PUBLIC_GA_ID` is missing, add the real GA4 Measurement ID already
   associated with ScoutIt and select **Production**.
3. If `CRON_SECRET` is missing, generate a new private random secret of at least
   32 bytes, add it for **Production**, and store it in your password manager.
4. If either Upstash variable is missing, open the ScoutIt Upstash Redis database,
   copy its REST URL and REST token into the matching Vercel variables, and select
   **Production**. If no database exists, report `blocked - no Upstash database`;
   do not choose a paid plan without review.
5. Open [Resend](https://resend.com/domains). Verify `scoutit.space`. Then place
   its active API key in Vercel as `RESEND_API_KEY` for **Production**. If DNS
   verification records are missing, stop and report the exact record names/types
   without exposing the API key.
6. Open Google Cloud Console -> **APIs & Services** -> **Credentials** -> ScoutIt
   OAuth web client -> **Authorized redirect URIs**. Ensure these exact URIs exist:
   `https://www.scoutit.space/api/oauth/google/callback`,
   `https://scoutit.space/api/oauth/google/callback`, and
   `http://localhost:3000/api/oauth/google/callback`. Click **Save**.
7. Redeploy only after all changed Vercel variables are saved. Return the variable
   names/statuses, Resend domain status, OAuth URI status, and deployment status.

### Checkpoint 5 - approve the public-profile contract (reply in chat)

Recommended decision: use `/profile/[username]` as the one canonical professional
profile route; permanently redirect role-specific detail routes to it; index only
real, verified, explicitly public profiles; keep demo/sample/private profiles
`noindex` and out of the sitemap; expose only fields explicitly approved for public
professional verification; do not expose expiry or extra regulatory identifiers
by inheritance.

Copy and send this if approved:

> I approve `/profile/[username]` as the canonical professional profile route. Redirect the role-specific profile routes to it. Index only real, verified, explicitly public profiles. Keep sample, demo, incomplete, and private profiles noindex and out of the sitemap. Public regulatory fields must use an explicit allowlist; do not expose PRC expiry, DHSUD number, or other fields until individually approved.

### Checkpoint 6 - physical-device acceptance (only after deployed release is Ready)

1. On a real iPhone using Safari and a real Android phone using Chrome, open
   `https://www.scoutit.space` in private/incognito mode.
2. Test sign up/sign in, Discover, one real property, one sample property, one
   public professional profile, dashboard entry, mobile navigation, bottom sheets,
   property claim, SEO readiness, and privacy shield.
3. Temporarily turn `pre_launch_free_mode` off only for the entitlement test, then
   restore it immediately. Record both changes.
4. Confirm no horizontal scrolling at normal zoom, controls are comfortably
   tappable, keyboard fields remain visible, and rotation does not trap content.
5. Test one journey with VoiceOver on iPhone or TalkBack on Android and one at
   200% text/zoom.
6. Return device model, OS/browser version, date, each route tested, pass/fail,
   screenshots of failures, and confirmation that `pre_launch_free_mode` was restored.

### Parallel agent lane while this checkpoint is open

The agent may continue deterministic T0 fixes, focused tests, responsive work,
JSON-LD validation/safe serialization, documentation reconciliation, and read-only
security analysis. It must not apply migrations, change DNS/provider/repository
settings, choose product policy, or claim physical-device/live-dashboard acceptance.

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
  - `https://www.scoutit.space/api/oauth/google/callback`
  - `https://scoutit.space/api/oauth/google/callback`
  - `http://localhost:3000/api/oauth/google/callback` (for local development)
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

<!-- BEGIN:SUPERSEDED_PRE_DECISION_MIGRATION_CHECKLIST
### 1.12 🗂️ Migration Drift — the repo does not describe the live database — **DECISION NEEDED**

*Found 2026-08-12 during pre-flight. Several migration files in `supabase/migrations/` were never applied to production, and some live objects were applied outside the tracked history. Full detail and evidence: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].*

**Confirmed never applied:** `20260803000001_production_security_rls`, `20260809000001_security_telemetry_retention`, `20260809000002_onboarding_completion_contract`, `20260811000001_wishlist_share_revocation`, `20260811000002_pilot_cohort_registry`.

- [ ] **Do NOT bulk-apply the backlog to "catch up."** `20260809000001` would actively regress the §1.0B telemetry fix — it recreates the partial index that `20260812000001` deliberately replaces. At least two files now conflict.
- [ ] **Approve annotating `20260803000001` and `20260809000001` as superseded** in-file, so a future session does not apply them.
- [ ] **Approve an individual audit of the remaining three** unapplied migrations against the live schema, applying only what is still needed and still correct.
- [ ] **Choose one source of truth:** drive everything through tracked Supabase migrations, or declare the SQL editor authoritative and stop maintaining files that imply otherwise. The split history is the root cause and will keep producing this.
- [ ] **Note for future audits:** any finding derived from reading `supabase/migrations/` may describe a database that does not exist. One §1.0B finding was actively wrong for production — it asked to add a `WITH CHECK` to a `deals` UPDATE policy that does not exist, which would have *granted* access that is currently denied.
<!-- END:SUPERSEDED_PRE_DECISION_MIGRATION_CHECKLIST -->

### 1.12 Migration authority - decided and audited; apply approval still required

*Reconciled read-only on 2026-08-14. Full evidence and the proposed sequence:
[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/MIGRATION_DRIFT_2026-08-12]].*

**Owner decision:** tracked migrations are the database source of truth. Historical
drift must be reconciled, never bulk-applied.

- [x] Do not bulk-apply the backlog.
- [x] Mark both conflicting migrations superseded.
- [x] Audit every remaining migration against live: five are ready conditionally and one is held.
- [x] Make live preflight a standing rule.
- [x] Hold `20260813000005_spatial_ref_sys_rls.sql`; do not apply it as written.
- [ ] Approve the five-migration apply sequence after reviewing the plan. This is separate live-change authorization; nothing was applied during this audit.

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
