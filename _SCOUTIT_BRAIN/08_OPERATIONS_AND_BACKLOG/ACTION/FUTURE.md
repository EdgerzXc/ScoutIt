---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [future, deferred, parked, roadmap]
updated: 2026-08-24
related:
  - "[[../00_START_HERE]]"
  - "[[00_MASTER_ACTION_PLAN]]"
  - "[[MASTER_OWNER_ACTIONS]]"
---

# 3 · FUTURE — deliberately deferred

> **Do not start anything on this page.** Every item here was parked *on
> purpose*, with a reason. They live here so they stop looking half-done and
> stop being re-proposed every few weeks.
>
> An item leaves this page only when its **trigger** fires or the owner moves it
> into [[00_MASTER_ACTION_PLAN]].

---

## 1. Parked by owner decision

| Item | Ref | Why parked |
|---|---|---|
| Successor / estate continuity list | §34.4 | Post-launch |
| WebRTC calls / Twilio proxy | §20.2–20.3 | Owner decision, not started |
| Voice AI co-pilot · FSBO intercom · Briefing OS | §6, §7, §33 | Owner-designated future phases; F-002's local Spatial OSINT foundation is complete and its real source/schema activation is owner-gated |
| Manifesto celestial scrollytelling + Founding Team showcase | `ORIGIN_STORY_SCROLLYTELLING` | Direction approved 2026-08-23, implementation not authorized. One continuous founder/product story: realistic celestial bodies and meteor showers converge at the reused black-hole climax; gravitational lensing then disappears into a calm, clear resolution. Click-entry/lazy-loaded About experience only; homepage remains fast. Canonical logic: `03_DESIGN/MANTLE_MANIFESTO_STORY_SYSTEM.md` |
| QuestIT | `QUESTIT_FUTURE/` | Parked feature. ⚠️ Reads 3 tables that do not exist |

The feature and its missing tables remain parked. The independently actionable
route-containment defect closed as
[[08_OPERATIONS_AND_BACKLOG/ACTION/DONE/2026-08|A-018]] on 2026-08-24; every
QuestIT route now requires an explicitly enabled `ai_search` flag.
**Do not enable `ai_search` until those tables exist.**

## 2. Trigger-gated — start when the trigger fires, not before

| Item | Trigger |
|---|---|
| Cloudflare R2 media storage | First genuinely large media files. None yet |
| Wishlist per-link revocation | Only if the 90-day expiry proves insufficient |
| Read replicas, search index, heavier caching | A measured bottleneck, never a predicted one |

## L-001 — Launch operations, discoverability, and social readiness

**Status:** owner-requested future workstream; recorded 2026-08-23; implementation
and external account creation are not authorized yet.

**Trigger:** promote this same `L-001` ID into Active when the owner starts the
pre-public-marketing readiness pass. External account, DNS, registrar, analytics,
or deployment mutations require the relevant owner login and an explicit execution
instruction. Do not duplicate W-006 or O-006: Google Search Console is already
verified and the production sitemap has already been submitted; those existing
items own its current processing-status follow-up.

**Outcome:** ScoutIt enters public promotion with its discovery, measurement,
domain, deployment, recovery, monitoring, and official-channel foundations already
owned and documented. Routine product work can then concentrate on user-visible bugs
instead of emergency account recovery or infrastructure archaeology.

### Search and index coverage

- **Live audit evidence (2026-08-24):** core directories/layers emitted correct
  canonicals, but public/indexable routes including `/`, `/discover`,
  `/enterprise`, `/badges`, `/terms`, and `/privacy` emitted no canonical link.
  The sitemap and robots files returned 200 on the canonical `www` host and the
  sitemap listed 16 URLs. Private/noindex routes are excluded from this finding;
  nonexistent nested property soft 404s are Urgent U-011. Reconcile these exact
  gaps when L-001 is promoted; do not open a duplicate SEO task.
- Audit the existing Google Search Console domain property, sitemap processing,
  canonical/index coverage, manual actions, structured-data enhancements, and URL
  inspection workflow. Preserve its DNS verification record through every DNS move.
- Establish Bing Webmaster Tools and IndexNow coverage, validate the production
  sitemap and robots/canonical behavior there, and record ownership and recovery.
- Verify discoverability from the major search surfaces relevant to the Philippine
  audience. Add regional engines only when they have measurable audience value;
  do not create decorative accounts that nobody will monitor.
- Mozilla has no webmaster/search console. Cover Firefox through the browser and
  accessibility test matrix instead of inventing a nonexistent submission step.
- Prepare Google Business Profile, Bing Places, and Apple Business Connect only if
  ScoutIt truthfully meets each platform's eligibility rules. Never invent an office,
  service area, registration status, review, or operating claim.

### Analytics, observability, and consent

- Audit the existing GA4 installation rather than installing a duplicate property.
  Confirm production traffic, internal-traffic exclusion, consent behavior, referral
  exclusions, retention, data-sharing settings, and a small set of truthful key events.
- Reconcile GA4 with Search Console, Vercel Analytics/Speed Insights, Sentry, and
  Cloudflare analytics so each system has one named purpose and no double-counted event.
- Define dashboards and alerts for availability, deploy failures, Web Vitals, API
  errors, indexing loss, unusual traffic, domain/SSL expiry, and critical user journeys.
- Record a privacy-safe measurement dictionary. Do not send private CRM, inbox,
  profile, property-owner, or authentication data into public analytics tools.

### Vercel, Cloudflare, GoDaddy, DNS, and recovery

- Audit Vercel production/preview domains, environment-variable scope, deployment
  protection, Git integration, function regions/limits, logs, alerts, rollback, and
  access ownership. Keep previews from becoming indexable production duplicates.
- Export and inventory the complete GoDaddy zone before any change. Confirm registrar
  lock, auto-renew, billing continuity, registrant/recovery contacts, least-privilege
  access, and offline recovery records.
- Execute any GoDaddy-to-Cloudflare nameserver cutover only under its existing owner
  action and verified order. Preserve Search Console, MX, SPF, DKIM, DMARC, Resend,
  Vercel, Turnstile, and other validation records; establish rollback evidence before
  enabling DNSSEC, proxying, WAF, rate limits, bot controls, or Access policies.
- Keep the public Vercel host, Mission Control protection, Turnstile, email routing,
  and future R2 storage as separate controls. Do not enable a Cloudflare product merely
  to claim that another layer exists.
- Maintain one credential/asset register containing account owner, purpose, recovery
  contact, 2FA/passkey state, billing owner, renewal date, and last recovery test—never
  raw secrets or recovery codes in Git.

### Official social accounts and distribution

- Reserve truthful, consistent ScoutIt handles on Facebook, Instagram, LinkedIn,
  YouTube, TikTok, X, and Threads. Evaluate Pinterest only if the design/inspiration
  audience becomes an active content lane; do not reserve unmanaged platforms blindly.
- Use a dedicated brand-owned admin identity, password manager, passkeys or strong 2FA,
  offline recovery codes, backup owner, and documented role access. No account may depend
  permanently on one personal device, phone number, or undocumented email address.
- Prepare a shared brand kit: canonical name, wordmark/avatar, bio, category description,
  website URL, contact path, disclosure language, and platform-appropriate banner assets.
- Define link ownership, UTM conventions, publishing permissions, moderation/escalation,
  impersonation reporting, account-recovery drills, and a minimum sustainable content
  cadence before any channel is publicly announced.
- Connect social profiles through truthful same-as structured data only after the official
  accounts are live and controlled by ScoutIt.

### Exit evidence

- One current account and infrastructure inventory with named owners and recovery paths.
- Search engines accept the canonical production sitemap without a new blocking error.
- Analytics and error monitoring receive a controlled production test without leaking
  private data or double-counting the event.
- Domain, DNS, email, SSL, Vercel deployment, rollback, and account-recovery checks are
  rehearsed and documented.
- Every announced social account is secured, branded consistently, linked from the
  canonical site, and assigned to a sustainable publishing/response owner.
- A quarterly access, billing, recovery, indexing, analytics, and platform-health review
  is placed on the operating calendar.

## A-042 — AI-assisted, evidence-based dispute adjudication with a human gate

**Recorded 2026-08-27 on owner direction. Trigger-gated: this does not authorize
a build.** Promote it into [[ACTIVE]] only when **A-041 exists** (nothing can
file a dispute today, so there is nothing to adjudicate) and **the owner has
engaged legal counsel** for the standard the model is asked to apply.

### The owner's position, recorded as given

All-time satisfaction is deliberate and its permanence is the point: a broker's
record follows them, and that is what makes the signal worth reading. The owner
accepts this is harsh on incompetence and considers it necessary rather than
incidental. The dispute inbox is the counterweight — not leniency in the metric,
but a real path to remove a response that evidence does not support. Adjudication
is to be assisted by an AI applied strictly to law and evidence, with a human in
the loop, and a lawyer retained for it later.

### What the AI may and may not do

**It proposes; a human disposes.** The defensible division, and the one this task
is scoped to:

| The model may | The model may never |
|---|---|
| Summarise a thread against a named ground | Remove, uphold, or publish anything |
| Quote the passages it relies on | Act without a human decision recorded separately |
| State which ground is and is not met | Infer a ground nobody filed |
| Say the evidence is insufficient | Fill a gap in evidence with plausibility |

**No automated removal, ever — including the "obvious" cases.** A determination
here affects a licensed professional's public reputation and livelihood in a
regulated profession. Human-in-the-loop must be a gate that can and does return
"disagree", not a confirmation step someone clicks through. If reviewers approve
everything the model proposes, the gate is decorative and the design has failed;
measure that rather than assume it.

### The hazard that must be designed for first

**The evidence is attacker-controlled text.** A dispute is adjudicated against a
conversation written by the two parties, one of whom wants a specific outcome. A
party can type instructions to the model directly into the chat — months before
any dispute exists, in a thread nobody was reading with suspicion.

Treat every message body as **untrusted data, never as instructions**. The
adjudication prompt must be structurally incapable of taking direction from the
evidence it reads: content fenced and labelled as quoted material, the ground
and the standard supplied only by the system, and any instruction-shaped text
inside the evidence reported as a finding rather than obeyed. This is not
hypothetical — it is the cheapest attack on the whole mechanism and it costs the
attacker one sentence.

**Adversarially test it before it decides anything.** Seed threads containing
direct instructions, role-play framing, fake system messages, and text claiming
prior staff authorisation. A model that follows any of them is not shippable.

### Other requirements

- **Evidence must exist to adjudicate against.** A-038's open question — that a
  response is permanent while the thread lives seven days — becomes sharper
  here, not softer. An adjudicator reasoning over
  `[Purged after 7 days retention policy]` will produce confident, well-written
  nonsense. Settle the retention decision **before** this is built.
- **The model never sees more than the ground requires.** Adjudicating a
  retaliation claim does not require deal value, negotiation history, or the
  parties' other threads. Scope the evidence to the case.
- **Both the proposal and the decision are audited**, separately and
  attributably: what the model was shown, what it proposed, on what ground, and
  what the human decided — including when they overrode it.
- **The standard is written down before it is automated.** "Evidence-based" is
  not a specification. The grounds list in A-038 is the starting point, and it
  is what counsel should review; a model applying an unwritten standard is
  applying its own.
- **Disclosed, not hidden.** A broker whose dispute was assessed with model
  assistance should be told so, and be able to reach a human.
- **Model choice is not settled here.** Note that `GEMINI_API_KEY` has been an
  open owner to-do; do not assume any provider is configured.

### Boundaries

Legal counsel owns the standard; ScoutIt owns the mechanism. Nothing in this
task creates a legal opinion, and no output should be presented to a user as
one. This item confers no authority to enable a paid provider, mutate live data,
or change the published retention promise.


## 3. Scale-only performance pass — **explicitly not pre-launch**

**114 Supabase advisor lints:** 41 redundant permissive policies, 27 unindexed
foreign keys, 27 unused indexes, 18 `auth_rls_initplan` (`auth.uid()`
re-evaluated per row instead of `(select auth.uid())`), 1 duplicate index.

Every one is a cost that **scales with rows and traffic**. At 13 properties, 0
deals and near-zero analytics events, fixing them is premature optimisation.

Recorded as **one deliberate pass** to run when real load exists — specifically
so it stops resurfacing as "114 problems" and panicking a future session.

## 4. Before payments switch on — not urgent today, non-negotiable later

| Item | Ref |
|---|---|
| 🔴 **Six advertised pricing benefits have no implementation.** Build them, deliver them by hand, or take them off the page | §46.5 |
| CSP tightening — remove `unsafe-inline` | §25.3 ⚠️ verify MapLibre/Matterport first; `unsafe-eval` may be load-bearing |

**Charging for an undelivered benefit is the one mistake with no cheap fix.**

## 5. Post-pilot engineering hygiene

- The `property_id` type split: `uuid` in `analytics_events`/`deals`, `text` in
  `viewing_appointments`/`property_claims`. A legacy of
  `coerce_user_ref_columns_to_text`. Retyping a column live code filters on is
  far larger than any bug so far required — but every cross-table property query
  is a chance to hit it, and it **fails at runtime, never at build**

---

## 6. The product-vision idea list — lives OUTSIDE this folder

⚠️ **Found 2026-08-13 during the folder audit. It had no inbound link from any
backlog file, which is why it kept being forgotten.**

**[[../../01_IDENTITY_AND_VISION/NEW_IDEAS|`01_IDENTITY_AND_VISION/NEW_IDEAS.md`]]**
holds **15 numbered product ideas** with placement and status notes. It is a
*different file* from the `NEW_IDEAS` journals now in `_ARCHIVE/idea_journals/`
— same name, different folder, different job. That name collision is precisely
how it got lost.

| # | Idea | Status noted there |
|---|---|---|
| 1 | Hidden Resident Intel (members only) | **On hold** — risks conflict with the owners whose buy-in we need now |
| 2 | Post-Move Layer (movers, utilities, local services) | Idea |
| 3 | Affordability + Monthly Cost Sandbox | ✅ **Built** |
| 4 | AI Assimilation "Blueprint Rule" (cost-saving architecture) | Idea |
| 5 | Gamified badge ecosystem | Partly built |
| 6 | Multi-LLM parsing pipeline (Gemini → Claude) | Idea |
| 7 | QuestIT standalone bounty API | Parked — see §1 |
| 8 | In-app concierge, "the AI that lives in the database" | Idea |
| 9 | ScoutIt MCP server protocol (B2B / AI ecosystem) | Idea |
| 10 | Google OAuth | Blocked on owner setup |
| 11 | Owner dashboard intelligence + gamification (rule-based, no AI cost) | Idea |
| 12 | **Phased feature-unlock roadmap — milestone-gated, not time-gated** | The roadmap shape |
| 13 | Cinematic audio briefing (VIP Voice Mode) | Parked |
| 14 | Network node referral protocol (permanent reward Connects) | Idea |
| 15 | Web-first launch; native app packaging is milestone-gated | Decision |

**It stays where it is.** Product vision belongs in `01_IDENTITY_AND_VISION`, not
in an operations backlog. This entry exists so it is **reachable** — the problem
was never its location, it was that nothing pointed at it.

### Before adding any of them, apply the founder feature gate

[[../../01_IDENTITY_AND_VISION/FOUNDER_FEATURE_GATE|`FOUNDER_FEATURE_GATE.md`]]
is the "should we build this at all" test: **does it reduce work, increase trust,
and reduce operational cost?**

---

## Why this page exists

Three separate sessions independently rediscovered the 114 advisor lints and
treated them as an emergency. Two sessions proposed building the estate
continuity list. Parking something without writing down *that* it is parked
means paying to rediscover it forever.

> **The test for this page:** if an item is neither blocking today nor has a
> named trigger, it belongs here — or it should not be written down at all.
