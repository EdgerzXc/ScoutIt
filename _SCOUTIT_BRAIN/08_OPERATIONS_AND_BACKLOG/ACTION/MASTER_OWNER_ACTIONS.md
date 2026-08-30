---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [owner-actions, decisions, approvals, external-systems]
updated: 2026-08-30
related: ["[[00_MASTER_ACTION_PLAN]]", "[[WAITING]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/README|Done Index]]"]
---

# Master Owner Actions — Jerzel's current lane

> Maximum 15 current items. This file contains only actions an agent cannot
> honestly complete: decisions, external dashboards, counsel, approvals, and
> physical-device checks. Historical owner notes are preserved in the Inbox.

## Do now

## O-016 — Mission Control does not rebuild when we push

**Found 2026-08-30 while pushing the connector batch, and it is the reason none
of that batch is usable yet.**

There is **one** GitHub repository, `EdgerzXc/ScoutIt`, holding both apps: the
public site in `src/` and the staff console in `mission-control/`. Everything is
committed and pushed — `gh repo list` shows no second repository, and the branch
is level with origin. **The code is not the problem.**

The problem is deployment. Evidence:

- GitHub's own deployment records for the repo contain exactly two environments
  ever, Preview and Production, and both belong to the **scout-it** project.
  There is **no environment for Mission Control**, so a push has never triggered
  a Mission Control build.
- The Vercel project recorded in `mission-control/.vercel/project.json`
  (`prj_ihtbarGRHZiFGB5lPvfz3eN1HOkg`) returns **404** from the API for this
  account, by id and by slug, and `list_projects` for the team returns only
  `scout-it`.
- `https://mission-control-sigma-one-89.vercel.app` is nevertheless **live** and
  answers 200, with an `Age` header of roughly **28 days** on its root.

Read together: the console is running a build from about a month ago, from a
Vercel project this account cannot see, and it has never been wired to the
repository.

**So every Mission Control improvement since that build is in GitHub and not in
front of staff** — including the whole 2026-08-30 batch: the Disputes Hub
adoption, the Position Queue's Airtable sync, System Activity, the fixed OSINT
Control Center, Ownership Claims and Deal Oversight.

**The fix, once, in the Vercel dashboard:** open the Mission Control project,
connect it to the `EdgerzXc/ScoutIt` repository, and set **Root Directory** to
`mission-control`. After that a push updates both apps, and this class of
"shipped but invisible" stops recurring. If the project genuinely no longer
exists, create it against the same repo with the same root directory and the
four environment variables the console needs.

**Why an agent cannot do it:** the Vercel CLI here is installed but reports *Not
authorized*, and the project is invisible to the connected account. Creating a
second project unasked would risk a duplicate console on a new URL.

Worth confirming while there: whether the local
`mission-control/.vercel/project.json` should be corrected or deleted, since it
currently points at a project id that resolves to nothing.

## O-013 — Decide how ScoutIt represents salespersons and DHSUD registration

Raised by the 2026-08-27 RA 9646 audit. Both parts are product decisions, not
engineering work, which is why they are here rather than in Active.

**Part 1 — the salesperson gap.** Under RA 9646 a real estate **salesperson**
is *accredited*, not licensed: they must practise under the direct supervision
of a named licensed broker, independent selling is illegal, the accreditation
renews every two years, and there may be at most twenty salespersons per broker.

ScoutIt has no such role. Live roles are `admin`, `broker`, `provider`. A
salesperson signing up today is carried as a "broker" and rendered on a dossier
headed **Advisory Profile** with a PRC licence field — presenting an accredited
person as a licensed one.

The decision needed: does ScoutIt (a) admit salespersons as a distinct role with
a required supervising-broker link and its own badge, (b) admit licensed brokers
only and say so at onboarding, or (c) defer until a salesperson actually applies?
Option (b) is the cheapest honest answer today, because no salesperson has
signed up yet — but it needs to be stated somewhere a user reads, not just
assumed.

**Part 2 — DHSUD.** `dhsud_number` is collected in the broker dashboard and is
deliberately **not** published, because DHSUD certificates renew annually and
there is no expiry column to check currency against. Publishing it would repeat
the PRC-expiry defect in a different field.

DHSUD registration (PD 957) governs subdivision and condominium sales, and
ScoutIt does list residential inventory, so this matters if the platform grows
into project selling. Displaying it requires an expiry column and a renewal
policy first.

Nothing is broken today. Both parts become real the moment a salesperson signs
up or a subdivision/condo project is listed.

## O-012 — Confirm which CRON_SECRET Vercel actually holds

**Promoted from the Inbox 2026-08-27 after independent reproduction.** The
2026-08-22 note was unverified; it is now confirmed on a second, unrelated
cron route.

`.env.local` defines `CRON_SECRET` **twice, with two different values**. Tested
empirically against the new `/api/cron/recompute-broker-metrics`: a request
signed with the **first** value returns 401; the **second** value returns 200
(`{"ok":true,"scanned":3,"recomputed":3,"failed":0}`). The last definition wins
locally. One of the two values is dead.

**Why this now matters more.** Four scheduled jobs authenticate with this one
secret: `check-stale-listings`, `sweep-pending-requests`,
`purge-chat-messages`, and the new `recompute-broker-metrics`. If the value set
in the Vercel project is the dead one, **all four return 401 every night and
silently do nothing.** The failure leaves no user-visible trace: stale listings
are never flagged, pending requests are never swept, chat is never purged, and
every broker's ScoutIt Record freezes permanently.

**The one thing to check:** open the Vercel project's environment variables,
read `CRON_SECRET`, and confirm it matches the value that returns 200 — the
**second** of the two in `.env.local`. Then delete the dead line from
`.env.local` so the next person does not have to rediscover this.

Worth also checking once: whether any of the three older cron paths has ever
returned 200 in production logs. If none has, they have never run.

This is owner-gated because it requires the Vercel dashboard, and reading or
rotating a deployment secret is not something an agent should do.

**Update 2026-08-30 — half of this is now closed, and the rest answers itself.**

The owner reported changing the Vercel value. Checked:

- **The dead line is gone.** `.env.local` had two `CRON_SECRET` declarations;
  the earlier one was dead because Next loads the later declaration. The dead
  line was removed and the survivor annotated as local-dev only. Verified after:
  exactly one declaration, no other key touched, and a local cron still returns
  200 with it and 401 without.
- **Production has a secret set.** `www.scoutit.space` answers **401**, not 503,
  and `authorizeCronRequest` returns 503 only when the variable is unset. So this
  is no longer a "the variable may be missing" question.
- **The Vercel value has been rotated** — neither former local value is accepted
  by production. That is fine; local and production need not match.

**What is still unknown:** whether the *scheduler* authenticates. Runtime logs
cannot answer it — a 7-day query returned only the three manual probes made
minutes earlier, so retention on the Hobby plan is about an hour. **Do not read
that absence as proof the crons never ran.**

**It is now self-answering and needs no engineer.** A-063 shipped 2026-08-30, so
the first scheduled run after that date writes a `cron.completed` row to
`system_events`. Jobs run at 00:00–03:00 UTC.

> Open **Mission Control → System Activity** after 03:00 UTC.
> **Four `cron.completed` rows = the secret is right and the jobs are running.**
> **No rows = the scheduler is still being rejected**, and the Vercel value needs
> correcting.

⚠️ **Caveat that may matter more than the secret.** This Vercel account is on the
**Hobby** plan, and `vercel.json` declares **four** cron jobs. Hobby allows a
smaller number of cron jobs and runs them approximately once a day rather than
at the stated times. If fewer than four rows appear, the cause may be the plan
rather than the secret. Check the plan's current cron limits before concluding
the secret is wrong. **This depends on O-016 being done first** — System Activity
is not live until Mission Control is actually deployed.

## O-010 — Check whether property reactions have ever been recorded

`/api/reactions` writes to the Airtable table named by
`AIRTABLE_REACTIONS_TABLE_ID`. A-015 now documents it in `.env.example`, and the
route plus tests enforce the configuration contract. Template documentation does
not prove that a real table exists or that Vercel has the real table ID, which is
the remaining owner question.

Locally the route now answers `503 Reactions are not configured`. Before U-010
the same condition returned `{ ok: true }` — the code checked for the three env
vars, skipped the write when any was missing, and reported success anyway. **So
if this variable is also unset in Vercel, every reaction anyone has ever tapped
was silently discarded and the interface said "Saved to Your Board." each time.**
This was invisible by construction; the honest-failure work is what surfaced it.

**What the owner checks:** whether `AIRTABLE_REACTIONS_TABLE_ID` is set in the
Vercel project environment (both projects — `scout-it` is the main site), and
whether a reactions table exists in the Airtable base at all.

**Then one of two things is true:**
- The table exists and the value is missing in an intended environment — set it
  there through the normal secret/configuration workflow; the template is current.
- The table was never created — then the reaction tiles have been decorative
  since they shipped, and the owner decides whether to build the table or retire
  the feature. Local saving to Your Board works either way; it is only the
  anonymous aggregate that was going nowhere.

**Note:** this is a data question, not an outage. Nothing is broken for users
today, and after U-010 a missing table produces an honest 503 instead of a
false success.

## O-011 — Allow and prove Google sign-in on the production origin

The 2026-08-24 live audit loaded the deployed Google Identity Services client
on ScoutIt's onboarding/auth entry. Google returned 403 and logged: the given
origin is not allowed for client ID
`626088890600-iavfh4001lirqsrn2kjdl4i5049s7i0p.apps.googleusercontent.com`.
The button therefore cannot be treated as a working production sign-in path.
Email/password and OTP remain available; this is not a total login outage.

**What the owner does:** in the Google Cloud OAuth client, verify the correct
ScoutIt-owned project and add only the exact production JavaScript origins
`https://scoutit.space` and `https://www.scoutit.space` as needed by the canonical
redirect. Verify Supabase's Google provider/client-secret configuration and
allowed redirect URLs, then confirm Vercel's `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
matches that same client in Production (and intended Preview scope). Do not paste
a client secret, recovery code, or token into Git, chat, screenshots, or logs.

**Exit evidence:** a fresh incognito desktop and mobile session renders the
Google button without the origin error, completes one controlled sign-in to the
expected Supabase Auth UUID, returns only to an allowlisted ScoutIt URL, and can
sign out cleanly. A-025 separately owns the honest unavailable fallback.

### F-001 — Approve retrieval persistence and provider activation

The local two-corpus retrieval foundation is engineering-complete and remains
deliberately disconnected from live traffic. Public and internal chunks have
separate fail-closed construction, rebuild, tombstone, role, expiry, persistence,
and fallback contracts. The server-only fixture coordinator re-authorizes every
semantic candidate against its requested corpus and current canonical source,
then applies authoritative category, location, radius, price-band, lifecycle,
and server-owned entitlement checks. If semantic candidates yield nothing, the
same source/filter/entitlement path consumes corpus-scoped keyword results.

Adversarial tests prove a compromised ranker cannot return internal content to a
public request. Stale lifecycle mirrors cannot override pipeline status, canonical
route drift and withdrawn records fail closed, sample disclosure and reviewed
internal provenance survive, and public output does not serialize price-bearing
metadata. The coordinator opens no database or model connection and has no public
route. Verification: 22/22 focused retrieval tests, 7/7 migration-contract tests,
1,468/1,468 full unit tests, production build, lint, typography, and all 3 approved
surface locks pass.

Before a live pilot, approve the individually reconciled additive migration
`mission-control/supabase/migrations/0008_retrieval_corpus_contract.sql` through
O-004's backup/read-back/rollback process. Separately approve an embedding provider,
measured model/dimension/cost plan, feature flag, and relevance/leakage acceptance
run. No migration was applied, provider called, endpoint exposed, surface changed,
checksum refreshed, deployment made, commit created, or push performed here.

### F-002 — Approve an OSINT source and provenance schema extension

The bounded local feeder foundation is engineering-complete and remains fully
disconnected from operational ingestion. `src/lib/osint/feederContract.js`
defines the versioned adapter envelope, allowlisted credential-free HTTPS source
URLs, capture/source timestamps, publisher and geography provenance, stable
identity, content hashes, revisions, deduplication, quarantine, and explicit
empty/error reporting. Its only adapter is a disclosed fictional publisher on a
reserved `.example` host. Every run is fixture-only and reports zero writes.

Accepted fixture signals can become only F-001 **internal** retrieval chunks for
recognized staff roles; a public role fails closed. The real cron route still
requires staff authentication, carries `OSINT_FEEDS = []`, and is absent from
Vercel schedules. No path auto-publishes, writes Airtable, generates an `Our
Take`, or turns fixture text into a factual claim. Focused feeder/retrieval proof
passes 23/23; the full unit gate passes 1,480/1,480; lint, typography (483 files),
and all three approved surface locks pass.

Before engineering connects any real source, choose and approve the exact
publisher/feed or search provider, its terms/cost/credentials, polling policy,
and source allowlist. Also approve an additive `intel_sources` schema design for
`adapter_id`, `adapter_version`, `external_id`, `captured_at`,
`source_published_at`, `content_hash`, and a distinct quarantine/review state.
The existing table cannot safely persist those fields, so the local runner
reports the gap instead of hiding provenance in `notes`. After that decision,
the same F-002 task returns to Active for a reconciled migration, real adapter,
and controlled read-back plan. No migration was drafted or applied, provider
called, credential added, schedule enabled, live row touched, deployment made,
commit created, or push performed here.

### F-006 — Approve the final locked Showcase wordmark reconciliation

Every unlocked ScoutIt logo/name lockup now follows one reusable identity contract:
gold **S**, white **cout**, gold **IT**, exact accessible name “ScoutIt,” tokenized
focus/hover behavior, and reduced motion. The global header/menu/footer, layer
navigation, homepage title, Transit, Enterprise, and property broker roster share
the browser component. Discover's duplicate rail logo was removed after mobile
review. A separate Satori-safe component now keeps the same split across the root
Open Graph image, root Twitter image, and dynamic `/api/og` card; all three real PNG
outputs were inspected at 1200px.

The owner-locked Showcase already looks correct, but the 2026-08-24 production
audit confirmed three source-only accessibility defects inside the same locked
file: its home link still declares legacy label `ScoutIT — home` and duplicates
the shared wordmark; `ShowcaseStage` nests a second `<main>` inside the page's
top-level `<main>`; and tray item names jump from H1 to H4. Axe reports duplicate/
nested main landmarks and invalid heading order on desktop and mobile.

Approve the exact accessibility-only reconciliation—shared wordmark, internal
stage changed to a non-landmark container, and tray names changed to the correct
non-skipping heading level—plus visual review and the resulting checksum update,
or explicitly retain the locked implementation as a documented exception. No
composition, copy, rank, motion, or navigation change is authorized. Until then,
do not edit
`src/components/board/ShowcaseStage.js` or refresh its checksum. No locked source,
checksum, migration, live data, deployment, commit, or push changed in F-006.

### F-008 — Accept the descent visual-system reconciliation

Review the local desktop and mobile appearance across Orbit, Stratosphere,
Metropolis, Crust, Mantle, Core, and About You, with particular attention to the
shared navigation/header/transition now consumed by locked Metropolis. Engineering
is complete: canonical tokens, 44px foreground controls, visible focus, reduced
motion/transparency, truthful states, and restrained background intensity are
covered; desktop/Pixel 5 visual review and the dedicated browser suite pass 16/16;
the full gate passes 1452 unit tests and discovers 498 E2E cases.

The protected Metropolis source files were not edited and approved-surface locks
remain 3/3. Do not refresh a checksum for this review. Accept the local appearance
to close F-008, or return it to Active with exact surface feedback.

### F-009 — Accept the Mantle and manifesto story upgrade

Review the local `/layer/mantle` and `/about` experience on desktop and mobile.
Engineering is complete: the existing Mantle archive and manifesto now form one
beginning-to-action story; the six layer concepts are bound to public,
`VERIFIED`/`PUBLIC_LIVE` Master Flow chunks that pass F-001's corpus contract; and
the workflow copy follows canonical architecture, schema, and user-flow sources.
The retired blanket phrase “verified lifecycle” is now the accurate
“source-qualified lifecycle.” Internal graph, security, and staff-only detail is
not shipped to the browser.

The manifesto rail follows scroll position, keeps the active chapter visible on
small screens, preserves stable hash focus, and uses restrained gold progress and
focus treatments. The mobile sticky rail defect found during visual review was
repaired by separating the sticky frame from its horizontal scroller and avoiding
the mobile overflow root that disabled sticky positioning. Reduced motion,
transparency, no-JavaScript, Lite/paused Mantle atmosphere, keyboard, contrast,
overflow, and performance paths are covered.

Verification: scoped source contracts pass 18/18; the final full unit gate passes
1454/1454; lint, typography (475 files), and approved-surface locks (3/3) pass;
the final manifesto suite passes 12/12, Mantle passes 10/10, and the deep-link race
passes five consecutive repetitions. Desktop 1440×1000 and mobile 390×844 renders
were visually reviewed. No checksum, locked surface, live data, migration, deploy,
commit, or push changed. Accept the local appearance to close F-009, or return the
same task ID to Active with exact visual feedback.

### F-010 — Accept the professional directory and approve private saves

Review the local `/brokers`, `/photographers`, `/researchers`, and
`/event-planners` experience on desktop and mobile. Engineering is complete:
all four routes now share one extensible dark-gold directory, derived filters,
useful sorting, honest empty/error states, stable source-ID profile links, and
separate accessible **View** and **Save interest** actions. Cards no longer
invent Active/Available status, unsupported verification checklists, default
rank/clearance, or unproven performance claims. Generic broker profiles no
longer imply property-specific authorized representation.

The private-save path requires individual migration approval for
`supabase/migrations/20260823000001_saved_professionals.sql`. It creates an
RLS-enabled, browser-role-revoked table reached only through an authenticated
server route; saves can be revoked and never create an Airtable write or public
count. The migration was not applied in this run. Approve it through O-004's
backup/read-back/rollback process before deploying the save UI.

Verification: production build passes; full unit gate passes 1,462/1,462;
lint, typography (480 files), and approved-surface locks (3/3) pass; the new
desktop/mobile directory suite passes 12/12, existing ecosystem plus new
directory regression passes 22/22, and anonymous save/read/revoke authorization
passes 6/6. Desktop 1280px and mobile 390px renders were visually reviewed.
No locked surface, checksum, live data, migration application, deploy, commit,
or push changed. Accept the local appearance and approve the named migration to
close this task, or return it to Active with exact feedback.

### O-001 — Showcase touch-target decision

Choose whether the locked Showcase's 32px mobile controls should grow to 44px
or remain a documented density exception. Any visual change requires review
before the checksum can change.

### O-002 — True Light Mode pilot policy

Choose full remediation before pilot or consistent temporary withholding on all
selectors. Do not leave desktop and mobile behavior inconsistent.

### O-003 — Legal/privacy authority before invited pilot

Confirm the real legal entity/contact details and effective date; appoint the
privacy owner/DPO; route Terms, Privacy, RESA boundaries, retention, processor,
and data-subject-rights documents through Philippine counsel.

### O-004 — Migration approval lane

Approve only individually reconciled migrations with live-schema read-back,
backup, rollback, and immediate verification. spatial_ref_sys remains held
unless its dedicated risk plan is accepted.

~~Named dependency: the versioned-acceptance migration must be applied before
that code deploys.~~ **Withdrawn 2026-08-22 — it was already applied.** The live
database carries `20260821122706 versioned_terms_acceptance`; `terms_acceptances`
and both `user_profiles` columns exist with RLS on and no policies. There is no
deploy-ordering hazard for U-002.

Still open under this lane: `supabase/migrations/20260822000001_drop_broken_chat_purge_function.sql`
(drops a function that can never have run — safe, but unapplied) and the
`spatial_ref_sys` decision. The individually reconciled
`20260823000001_saved_professionals.sql` migration is also awaiting the
professional-directory approval above. Retrieval migration
`mission-control/supabase/migrations/0008_retrieval_corpus_contract.sql` is also
awaiting the F-001 approval above.

What the owner should expect on the next deploy: all five onboarded accounts,
including the founder's, will be asked to accept the current Terms once before
reaching the dashboard. That re-consent is now additive only — it records the
acceptance and changes no roles, tier, or profile data (U-007).

### O-005 — Stable-release real-device pass

After the urgent working tree is split, verified, merged, and deployed with
approval, perform the real iPhone/Android, 200% zoom, screen-reader, navigation,
onboarding, sample/real-property journeys, and the already-built broker briefing
print layout. Automated checks do not close those physical acceptance boundaries.

### O-006 — Search Console sitemap status recheck

The property is verified and the sitemap was submitted on 2026-08-16. Re-read
only the sitemap processing status; do not repeat verification/setup work.

### O-008 — Development database boundary before outside human accounts

Decide before the first outside human tester creates a real account whether ongoing
development will continue against the production Supabase project or move to a
separate development project. The five current onboarded rows do not by themselves
prove an outside real-user trigger, but invited testing makes the trigger imminent.

If a separate project is chosen, approve its creation, safe schema/bootstrap order,
non-production credentials, sample-data policy, and environment separation. Agents
must not create a project, copy production personal data, or rotate credentials
without this exact owner authorization.

## Later / trigger-gated

- Payment-provider selection and counsel review before commercial activation
- DNS/Cloudflare and Mission Control deployment changes after the approved order
- Pilot-cohort recruitment and release approval after the pre-pilot gate
- Production infrastructure upgrades at their documented triggers

See [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] for deliberately deferred
work and [[WAITING]] for the exact conditions that reopen engineering.

### A-002 — Visitor contact-message retention period

`contact_messages` holds a stranger's name, email and free text with no
retention rule: rows currently live forever. The table is RLS deny-all and
service-role only, so this is a retention question, not an exposure one. Live
count at handoff: 0 rows.

**The one decision needed:** how long a resolved visitor support message is
kept before its personal fields are cleared. Everything else is built and
waiting on that number. Retention wording also sits inside the counsel review
already tracked as O-003, so the two should be answered together rather than
guessing a period and publishing it.

Deliberately not implemented: a placeholder period would become a published
privacy claim nobody actually decided.

### ~~O-007 — The Showcase presents invented metrics as verified, on a locked surface~~ (Resolved 2026-08-23)

Owner authorized sample disclosure, metric honest relabelling, and surface checksum update on 2026-08-23.
`src/components/board/ShowcaseStage.js` now renders `Sample data — for human testing` in the top viewport bezel,
replaces the ungrounded "Verified" badge with `Curated Merit` / `Human-Curated Architectural Merits`,
and explicitly marks demand metrics as projected sample data. Checksum updated in `scripts/approved-surfaces.json`
and verified. Closed in Done as `D-2026-08-24`.
