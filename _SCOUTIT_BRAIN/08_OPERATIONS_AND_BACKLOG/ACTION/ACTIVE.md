---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [active-work, engineering, pre-pilot]
updated: 2026-08-24
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[WAITING]]", "[[MASTER_OWNER_ACTIONS]]"]
---

# Active — approved work that can proceed

> Maximum 25 open items. An agent may work here only after Urgent is stable and
> after re-checking the named behavior against current code.

## Active domain plans

- [[A-023_BROKER_DOSSIER|A-023 — Canonical Broker Dossier and editor]]
  is the complete authoritative plan for the broker master-page workstream.
  Its statistics contract makes the read-only ScoutIt transaction record primary
  and keeps broker-editable historical career data secondary and clearly labelled.

## A-019 — Reframe the universal menu and Settings information architecture

**Owner outcome:** the menu and Settings surfaces feel like one deliberate
control system instead of unrelated navigation, profile, display, privacy, and
security panels. A first-time visitor can find Explore, their workspace, Help,
and account controls without knowing ScoutIt's internal layer names.

**Current evidence (2026-08-24):** universal navigation correctly comes from
`src/lib/navigationManifest.js`, but the Eye calls itself Display Settings while
also containing the guide, issue reporting, and hidden development controls.
`/settings` is a long Edit Profile Settings form containing identity, roles,
public-card editing, privacy, password, MFA, badges, and sign-out without a
shared settings hierarchy.

**Agent lane:** preserve the single navigation manifest and identical mobile/
desktop destinations; improve grouping, labels, active state, and handoffs into
Account, Privacy, Security, Display, and Guide controls. Do not introduce a
client-side role gate or duplicate menu definitions.

**Exit test:** every destination still resolves; mobile and desktop share one
manifest; Settings sections are directly reachable and keyboard/focus behavior,
Escape/outside dismissal, `aria-current`, 360px layout, and reduced motion pass.
No Showcase checksum or unrelated header redesign is in scope.

## A-020 — Turn the Eye into a Master-Flow guide and assistance hub

**Owner outcome:** the Eye offers purposeful choices—page help, start/restart a
guided journey, display/accessibility preferences, and report a problem. Its
wizard helps seekers navigate ScoutIt, owners edit their properties, and brokers
connect with owners through the real product paths.

**Current evidence (2026-08-24):** `FloatingToolbox.js` already resolves a
small per-page registry from `src/lib/pageGuides.js`. Separately,
`src/lib/flow/subgraphExtractor.js` and generated `linearGuides.json` already
provide Buyer, Owner, and Broker sequences from the Master Flow Graph. The Eye
does not consume those sequences, track a journey across routes, or verify that
each guide target exists before presenting it.

**Agent lane:** build one public-safe guide adapter over the Master Flow Graph;
select role variants only from `/api/profile/me/role`; expose only executable,
currently shipped nodes with real routes/targets; keep neutral help for signed-
out visitors. Planned graph nodes must be omitted or honestly labelled rather
than presented as working actions.

**Exit test:** Buyer, Owner, and Broker journeys can start, resume across route
changes, skip, finish, dismiss, and deliberately restart. The guide appears
once to a first-time visitor, never blocks use, restores focus, supports Escape
and keyboard navigation, works at 360px, respects reduced motion/Lite Mode, and
has tests proving graph-node/route/target validity plus server-verified role
selection. No guide state grants access or changes an entitlement.

## A-021 — Retire the product dev persona and transfer eligible demo authority

**Owner outcome:** `jerzelguerra26@gmail.com` is the real authenticated owner of
eligible ScoutIt demo properties and their owner-controlled relationships;
visitors can no longer reveal a role/tier switcher from the Eye. Human-testing
sample content remains available and truthfully labelled.

**Current evidence (2026-08-24):** the Eye still contains a five-tap/`?dev=1`
entry that creates the localhost `master-dev` persona and changes apparent
roles and tiers in browser storage. The runtime boundary now limits that persona
to localhost/non-production, but dashboard and test code still depend on it.
Public editorial mocks and example profiles are separate from private Supabase
property ownership and cannot truthfully be assigned wholesale to a person.

**Agent lane:** remove the user-facing development controls and production
query/gesture entry; retain only an explicitly isolated E2E fixture. Add an
audited Mission Control dry-run and execute path that resolves the named email
to its verified Supabase Auth UUID, inventories every `master-dev` reference,
and transfers only private owner-authoritative rows and valid dependent
relationships. Preserve public Airtable/sample/editorial records as labelled
examples unless their schema has a truthful ownership field. Do not hard-code
the email as authorization, grant staff/Mission-Control privileges, bypass RLS,
or mutate providers directly.

**Exit test:** the target Auth account must exist and be uniquely resolved; a
dry-run lists every changed, skipped, and blocked row; the audited operation is
atomic or safely resumable; ownership checks pass as that user; no orphaned
deal/unit/representation references remain; sample disclosures remain; and
`master-dev` is accepted only by the local E2E harness. Live mutation occurs
only through Mission Control and produces an audit record.

## A-022 — Consent-safe first-visit warming for smoother navigation

**Owner outcome:** after the initial page becomes interactive, ScoutIt quietly
warms the small set of public code/data most likely needed next so the first
navigation, guide step, and role handoff feel immediate on a capable browser.

**Current evidence (2026-08-24):** the app has server-side CMS caching, route-
specific caches, dynamic dashboard bundles, and a Metropolis destination
preloader, but no single first-visit policy. Private API responses correctly use
`no-store`, and existing localStorage keys hold explicit preferences or private
device-local state; these must not be replaced by broad prefetching or silent
consent.

**Agent lane:** measure the actual cold path first, then use idle/intent-based
Next route prefetch and bounded public-data warming. Prioritize the next guide
step and universal-shell chunks; cap work by network/device signals and honor
Save-Data, Lite Mode, reduced motion, offline/private-mode failures, and memory
limits. Never prefetch authenticated/private APIs, Connect actions, full media
libraries, third-party embeds, or paid AI calls.

**Exit test:** measured first-transition latency improves without regressing
initial LCP/INP or increasing failed requests; warm work starts only after the
entry surface is usable, cancels cleanly, and has a strict byte/request budget.
No analytics/marketing cookie, fingerprint, location, terms acceptance, or
authentication state is created by preload. Only essential cache/preference
state with documented purpose and expiry may be stored.

## A-024 — Repair verified public semantic and contrast defects

**Owner outcome:** Discovery, Descent, and Crust retain their approved visual
composition while exposing one clear document title, distinguishable landmarks,
valid tab semantics, and readable non-text decoration.

**Current evidence (2026-08-24):** the live desktop/mobile axe sweep found two
H1s and a duplicate unlabeled navigation landmark on `/discover`, two H1s on
`/descent`, `role="tabpanel"` on an `article` in Crust, and a 2.69:1 inactive
Crust tab index at 12px on mobile. Current JSX/CSS reproduces every finding.
Locked Showcase findings are excluded and remain owner action F-006.

**Agent lane:** make semantic/token changes with no composition redesign. Add
focused axe/heading/landmark regressions for these exact routes and both profiles.

**Exit test:** each route has one meaningful H1; multiple navs have distinct
names; the tablist/panel relationship uses valid elements/roles; informative text
meets WCAG AA; keyboard/history behavior remains; full verify/build and 3/3 locks
pass without changing `ShowcaseStage.js`.

## A-025 — Make signed-out workspace and auth entry fail quietly and honestly

**Owner outcome:** a signed-out visitor sees an immediate deliberate sign-in
handoff and ScoutIt makes no private workspace request until identity is proven.

**Current evidence (2026-08-24):** production `/admin`, calendar, CRM, and inbox
surfaces issue protected requests while anonymous and log expected 401 failures;
inbox calls `/api/deals` before resolving a usable identity. Onboarding also asks
for missing `/grain.png` on every auth-derived entry even though the root layout
already provides the data-URI grain. APIs correctly deny access; this is an entry,
noise, and wasted-request defect, not evidence of data exposure. Google origin
configuration is separately owner-gated as O-011.

**Agent lane:** centralize the verified signed-out boundary before private child
effects mount, preserve localhost E2E isolation, remove the redundant missing
asset request, and render an honest Google-unavailable state if GIS cannot render.
Do not weaken server authorization or treat browser cache as identity.

**Exit test:** anonymous workspace URLs make zero private API calls, emit no
expected-auth console errors, and reach one accessible sign-in state/redirect;
valid sessions retain deep links; no `/grain.png` 404 occurs; email/OTP remains
usable when Google is unavailable; auth, mobile, and production-host tests pass.

## A-026 — Make the browser audit portable and non-vacuous

**Owner outcome:** the same read-only suite can audit localhost or a supplied
production URL without false failures or accidentally measuring the wrong host.

**Current evidence (2026-08-24):** six of 314 production-suite results failed for
two deterministic harness bugs: the Manifesto no-JS case hardcodes
`http://localhost:3000/about`, and Descent uses an unscoped ScoutIt-link locator
that matches both layer navigation and footer. The application behavior passed;
the tests did not honor their configured `baseURL` or landmark scope.

**Agent lane:** derive new contexts from the configured target, keep the ScoutIt
render anchor, scope locators to their owning landmark, and add regression checks
for U-011/A-024 without making live tests destructive.

**Exit test:** the curated production subset passes without a localhost server;
a protected/interstitial host still fails the render anchor; no live test writes,
publishes, spends, sends, or changes account state; local and remote modes pass.

## A-027 — Stabilize measured production layout and foreground workload

**Owner outcome:** key directories do not visibly jump as data hydrates, and the
homepage remains responsive while preserving its cinematic identity.

**Current evidence (2026-08-24):** three desktop production samples measured
CLS near 0.26 on `/brokers`, 0.13 on `/property`, and 0.11 on warm `/discover`.
Homepage paint/navigation entries were fast, but a nominal 3.5-second settle and
evaluate cycle took about 20–30 seconds desktop and 7–8 seconds mobile, pointing
to foreground/main-thread work rather than network latency. This is lab evidence;
it does not identify the responsible component by itself.

**Agent lane:** capture layout-shift sources and long tasks first; reserve real
dimensions for async content; schedule/pause decorative work by visibility,
reduced motion, Lite Mode, and device capability. Coordinate with A-022 warming
so prefetch never hides or worsens the measured costs. Do not remove WebGL or
cinematic layers on a guess.

**Exit test:** three cold/warm desktop/mobile repetitions show CLS at or below
0.10 on audited routes, no unexplained multi-second long task, responsive menu/
primary interaction, no LCP regression, and preserved reduced-motion/Lite paths.
Record trace evidence, not only a score; full verify/build and 3/3 locks pass.

## A-029 — Establish a truthful human voice and deliberate display typography

**Owner outcome:** ScoutIt sounds like a precise, confident Philippine property
platform written by people who know the product—not a generic luxury generator—
and its display typography is a conscious luxury-system decision rather than a
misdocumented fallback.

**Current evidence (2026-08-24):** Geist Sans and Geist Mono load correctly once
through `next/font`, and the 489-file readability audit passes, but display and
body both resolve to Geist Sans while stale CSS comments claimed Instrument
Serif was active. Public metadata, homepage, footer, legal metadata, and JSON-LD
repeat “the Philippines' first” and blanket “verified intelligence” without one
cited authority or a definition that fits every content type. The authenticated
AI rewrite endpoint explicitly asks Gemini for “bespoke, curated, panoramic,
seamless, prestige, uncompromising,” manufacturing the exact AI-luxury voice this
audit is meant to remove. Broker ranking contradictions stay in A-023.

**Agent lane:** inventory public copy by claim type and content authority; define
a compact ScoutIt voice guide with banned clichés, evidence language, unknown/
sample/projection wording, and examples for property, Intel, professional, legal,
empty, and error states. Replace unsupported superlatives and blanket
verification with specific sourced meaning. Redesign the rewrite prompt to
preserve owner facts and voice, prohibit invented claims and cliché stuffing, and
return a transparent draft. Propose and browser-test the display-font decision
against performance, Philippine glyphs/names, readability, and every owner-locked
surface before changing `--font-display`. Do not use copy cleanup to change
legal meaning, scores, tier promises, or locked composition.

**Exit test:** no uncited market-first claim or undefined blanket verification
remains in public metadata/JSON-LD/shell copy; generated descriptions preserve
facts, uncertainty, and owner meaning and avoid the banned corpus; representative
human review beats the current prompt on specificity without adding claims;
font assets load once with no CLS/LCP regression and correct fallbacks; mobile,
Lite, reduced-motion, metadata, accessibility, full verify/build/browser, and
3/3 locks pass. Any display-font visual change requires explicit owner review
before its checksum can move.

## Where the owner's "list of 10" stands

The ten items raised on 2026-08-23 as the ones that actually matter at this size:

| # | Item | State |
|---:|---|---|
| 1 | IAM / authorization | Owner-parked. The security overhaul is one deliberate pass, not a drive-by. |
| 2 | Monitoring / alerting | Code complete (Sentry wired, `/api/health` exists). DSN + alert rules are owner/ops state in L-001. |
| 3 | Rate limiting | Done — A-012. |
| 4 | Caching | Already correct — `cmsCache.js` + Upstash. No task was needed. |
| 5 | Timeouts & retries | Done — A-013. |
| 6 | Secrets management | Done — A-015. |
| 7 | XSS / input validation | Done — U-008, U-009, U-010. |
| 8 | Idempotency | Client half done — A-016, A-017. Durable server half is migration-gated in [[WAITING|W-003]]. |
| 9 | Migrations / schema versioning | Owner-gated — [[WAITING|W-003]]. |
| 10 | Cold starts / serverless limits | Knowledge, not work. Nothing to build at 13 properties. |

Everything still open on that list is behind an owner gate rather than behind
engineering effort. **Do not promote 1, 9, or the server half of 8 without the
owner's explicit go-ahead** — they need migrations or the parked security pass.

## Deployment state

GitHub and production are confirmed current through the 2026-08-24 release; the
follow-up action record is at `a35237d`. The live API and its Supabase/Airtable
dependencies reported healthy. The completed production audit routed U-011,
A-024 through A-027, O-011, F-006, and L-001 without duplicating their authority.

---

## Not in this queue, on purpose

- **Component render tests.** This repo writes JSX in `.js` files, which the
  Vite/Rolldown pipeline vitest runs on will not parse. No component can be
  render-tested today. Fixing it means changing build configuration or renaming
  files repo-wide; A-016 used source assertions instead and recorded the limit.
- **A distributed rate limiter.** `rateLimit.js` is per-instance and says so.
- **The 114 Supabase advisor lints** stay in [[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]] §3.
- **`src/lib/isochrone.js`.** Bounded by its own AbortController; a test pins
  this so it stops being re-proposed as an A-013-style defect.
