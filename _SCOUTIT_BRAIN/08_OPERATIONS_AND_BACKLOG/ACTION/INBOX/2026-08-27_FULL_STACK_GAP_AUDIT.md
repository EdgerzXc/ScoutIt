---
section: "08_OPERATIONS_AND_BACKLOG/ACTION/INBOX"
status: active
tags: [audit, full-stack, frontend, backend, node, configuration, non-executable]
updated: 2026-08-27
related: ["[[README]]", "[[../URGENT]]", "[[../ACTIVE]]", "[[../00_MASTER_ACTION_PLAN]]", "[[../../../02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE]]", "[[../../../04_DATA_AND_SCHEMA/DATA_DICTIONARY]]", "[[../../../07_FEATURES_AND_FLOWS/USER_FLOWS]]"]
---

# 2026-08-27 Full-stack gap audit — evidence awaiting reconciliation

> **Non-executable Inbox evidence.** Do not fix an item from this file. Verify
> it against the then-current code, check every live queue and Done for a
> duplicate, assign one stable task ID, and promote it to exactly one live queue
> first. U-012 and U-013 are the only exceptions: they were promoted directly to
> [[../URGENT]] because current code proves the defect and its acceptance test.

## Audit intent and method

**Intent:** `AUDIT_ANALYSIS` (high confidence). The request was to find gaps,
misconfiguration, misalignment, and nonsensical behavior across the ScoutIt
website, source, Node stack, frontend, backend, and documentation—not to perform
a broad cleanup.

Evidence precedence in this pass was current source/build/test output first,
canonical docs second, and inference last. Grep-only security claims were
manually traced route by route because earlier ScoutIt audits recorded false
positives from matching the wrong signal.

## Verified baseline — healthy, not backlog

- Approved surface lock: **3/3 passed** before documentation edits.
- Root lint and 499-file typography audit: passed.
- Unit suite: **1,845/1,845** across 186 files passed.
- Playwright manifest: **574** cases across 32 files discovered.
- Main Next.js 16.3 production build: passed, 126 static pages generated.
- Mission Control: lint passed, **57/57** security tests passed, Next.js 15.5
  production build passed.
- Registry-backed `npm audit`: zero known vulnerabilities in both dependency
  trees at the time of this audit (995 root dependencies; 448 Mission Control).
- Root package/lock/install tree: `npm ls --depth=0` passed.

These results reject a blanket claim that ScoutIt is currently broken. The
findings below are bounded gaps a green compile-and-unit gate does not cover.

## Production-browser and mobile addendum

The complete production-backed Playwright suite was subsequently executed, not
only listed: **574 tests** split evenly between Desktop Chrome and the Pixel 5
Mobile Chrome profile. Result: **546 passed, 26 failed, 2 skipped** in 9.3
minutes. Desktop contributed 274 pass / 12 fail / 1 skip; Mobile contributed
272 pass / 14 fail / 1 skip.

Healthy mobile evidence includes explicit 320, 375, 390, and 768px containment
and operability checks; the separate no-horizontal-scroll route sweep; mobile
CLS checks on `/brokers` and `/property`; touch-size and focus checks; and
reduced-motion behavior. The mobile problem is therefore bounded: it is not a
site-wide responsive collapse. Most interaction timeouts trace to the already
live A-031 first-visit toolbox overlay.

A focused 12-case single-worker rerun then reproduced nine failures and passed
three. It confirmed the LR-01 mock drift, obsolete broker-card selector, mobile
header menu failure, and Orbit heading failure. The broker directory's transient
duplicate `Named signals only` locator passed in isolation and is classified as
test/hydration robustness, not a confirmed user-facing defect.

## Promoted findings

### U-012 — Null-owner freshness authority bypass

**Severity:** High. **Confidence:** High.

`/api/property/verify` checks owner/staff authority only when `owner_id` is
truthy. Because the column is nullable, an ordinary signed-in account can stamp
an unowned property's `last_verified_date` through the service-role client.
Promoted to [[../URGENT#U-012 — Unowned properties bypass the freshness-attestation authority gate|Urgent U-012]].

### U-013 — Staff freshness success does not reach Airtable-backed public pages

**Severity:** High. **Confidence:** High.

The main-app staff panel calls `/api/property/verify`, which writes only
Supabase. Public pages read Airtable `Last_Verified_Date`. The action therefore
can confirm success while the public trust badge remains stale, and it sits
outside the documented Mission Control mutation boundary. Promoted to
[[../URGENT#U-013 — Staff freshness verification reports success without updating the public source|Urgent U-013]].

### A-031 — First-visit Help & Display blocks ordinary controls

**Severity:** Significant, mobile-weighted. **Confidence:** High.

The full browser run reproduced A-031 across both mouse and touch projects. The
fixed auto-open toolbox intercepted Metropolis category selection on both, and
on Pixel 5 also intercepted property Inquire/Save, Enterprise preview,
Manifesto, Mantle, and Core controls. Core was blocked on desktop too. This is
new verification for [[../ACTIVE#A-031 — The first-visit Help & Display panel must dismiss on an outside tap|Active A-031]], not a new task ID.

## Findings that remain in Inbox

### GAP-01 — Mission Control's environment template is not its deployment contract

**Severity:** Significant. **Confidence:** High. **Likely cause:** documentation
and deployment configuration evolved separately.

`mission-control/.env.example` contains only the Supabase URL, anon key, and
Google visibility flag. Current Mission Control source or its own README also
depends on `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`,
`AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `CRON_SECRET`, `GEMINI_API_KEY`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MAIN_SITE_URL`, and optionally
`VIRUSTOTAL_API_KEY`. A clean deploy can therefore look correctly templated
while staff invitations, Airtable operations, Management API operations,
cross-site OSINT calls, scan work, or the cron worker are unavailable.

**Reconcile/exit:** classify each value as required, feature-required,
platform-provided, or optional; add names and safe descriptions (never values)
to the Mission Control template; align the README; and add a test that every
non-platform `process.env` consumer is documented in that app's own template.

### GAP-02 — CI never production-builds the separately deployed Mission Control app

**Severity:** Significant. **Confidence:** High. **Likely cause:** CI added the
Mission Control security suite but retained only the root build step.

`.github/workflows/ci.yml` installs Mission Control and runs its 57 security
tests. Root lint also scans `mission-control/src`. The only build step is
`npm run build` at the repository root, which does not compile the separate
Next.js 15 application. The app builds successfully today, but a future
Mission-Control-only route/config/build regression can merge while required CI
stays green.

**Reconcile/exit:** add a Mission Control production-build step with explicit
placeholder build variables, prove a deliberately broken Mission Control build
turns CI red, and retain the final `required-ci-result` gate.

### GAP-03 — Three routes explicitly force Next.js's deprecated Edge Runtime

**Severity:** Moderate. **Confidence:** High. **Likely cause:** framework upgrade
left legacy metadata configuration behind.

The main production build emits `The Edge Runtime is deprecated` and warns that
edge runtime disables static generation for a page. The installed Next.js 16.3
runtime guide says `edge` is deprecated and instructs projects to remove the
runtime export. Current occurrences are `src/app/opengraph-image.js`,
`src/app/twitter-image.js`, and `src/app/api/og/route.js`.

**Reconcile/exit:** verify these image paths under the default Node runtime,
remove only the obsolete exports, assert valid image bytes/content types, and
require a clean production build with no Edge Runtime warning.

### GAP-04 — Dashboard maps bundle MapLibre 5 but inject MapLibre 4 CSS at runtime

**Severity:** Moderate. **Confidence:** High. **Likely cause:** a CDN workaround
survived the package upgrade.

`package-lock.json` installs `maplibre-gl@5.24.0`. Both `BuyerMode.js` and
`BrokerMode.js` already import the bundled `maplibre-gl/dist/maplibre-gl.css`,
then render another stylesheet link for
`unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css` when the map opens. The same
widget can receive two major-version style sheets, and it remains dependent on
third-party CSS despite already shipping the matching local CSS.

**Reconcile/exit:** browser-check Buyer and Broker maps using only the bundled
5.24 CSS, remove the duplicate 4.7.1 links if no required rule is missing, and
cover controls/popups at mobile and desktop. Reassess `unpkg.com` in CSP only
after all consumers are inventoried; do not tighten CSP as a drive-by.

### GAP-05 — Scheduled transit updater can misclassify unknown stations as MRT-3 and auto-commit unvalidated output

**Severity:** Significant. **Confidence:** High for the code defect; Medium for
current live impact because no workflow run was inspected. **Likely cause:** a
prototype sync script was placed on a production schedule without an output
contract.

`scripts/sync_transit_data.js` requests every rail/subway station in a Metro
Manila bounding box. It recognizes LRT-1 and LRT-2 with loose operator/line/name
text; **every other node falls into `mrt3`**. A successful response can therefore
replace MRT-3 with unrelated, future, duplicate, or insufficiently tagged
stations. The script writes the runtime JSON directly, drops existing per-row
fields such as `km`, has no fixture/schema/count/line-membership tests, and the
monthly workflow immediately auto-commits that one file without running ScoutIt
verification. The current checked-in file is coherent (24 LRT-1, 13 LRT-2, 13
MRT-3; complete coordinates), so this is a forward automation hazard, not a
claim that current transit data is corrupt.

**Reconcile/exit:** parse line membership from explicit OSM relations/tags;
reject unknowns rather than assigning MRT-3; validate unique names/coordinates,
expected line IDs, plausible counts, and required consumer fields; write to a
temporary candidate and replace only after validation; fail non-zero on bad
input; and make the workflow run focused tests/validation before commit.

### GAP-06 — The no-raw-palette rule is not mechanically enforced

**Severity:** Moderate maintenance risk. **Confidence:** Medium until exceptions
are classified. **Likely cause:** the typography gate grew without a companion
design-token gate.

AGENTS.md and `STRUCTURE.md` prohibit raw replacement palettes, and both apps
define gold tokens. Yet Mission Control contains many Tailwind arbitrary gold
values such as `text-[#E8AE3C]` and `bg-[#F7C64E]`; the main app also has direct
gold literals outside the central token definitions. A broad search touches 157
files, but that number includes legitimate token declarations, SVG/canvas/email
contexts, comments, and fallbacks, so it is **not** a 157-file authorized
cleanup list. The current typography audit cannot detect this class of drift.

**Reconcile/exit:** define explicit exceptions for token declaration, generated
media/email/canvas, data values, and required fallbacks; then add a non-vacuous
audit for UI code where CSS variables/Tailwind semantic tokens are available.
Any visual conversion on checksum-locked surfaces requires exact owner review;
never mass-rewrite colors or refresh checksums from this finding.

### GAP-07 — A-023 is implementation-complete but its canonical schema and user-flow docs do not name the new broker stores

> Promoted 2026-08-27 to [[../ACTIVE|A-040]] (schema half). The user-flow half was
> closed the same day: `USER_FLOWS.md` now describes the A-037 record card and
> names A-038 as the missing feedback producer. This section remains evidence,
> not a second executable home.

**Severity:** Significant documentation drift. **Confidence:** High. **Likely
cause:** the six implementation phases advanced faster than the canonical-doc
transaction.

A-023 says all engineering phases are complete and live verification covered
seven RLS-deny-all broker tables. Current migrations and readers introduce
`broker_dossier_drafts`, `broker_recommendations`, `broker_contributions`,
`broker_metric_snapshots`, and `broker_career_claims`, but none of those names
appears in `DATA_DICTIONARY.md`; the canonical `USER_FLOWS.md` does not describe
the dossier editor, recommendation/contribution production, metric refresh, or
career-history authority split. `STRUCTURE.md` also does not summarize the
public Airtable identity plus private/operational Supabase projection now used
by the canonical dossier. A-023 remains Active for owner visual review, so this
belongs inside that existing ID rather than a duplicate task.

**Reconcile/exit:** before A-023 can close, update the canonical data dictionary
with table ownership, public/private fields, RLS/service-role boundary,
producers/consumers, and migration/live status; update the user flow from broker
edit/attest/publish through public projection; and update Structure with the
narrow dual-CMS exception for computed/operational trust data. Preserve the
mathematical isolation between ScoutIt Record and declared Career History.

### GAP-08 — The auto-open Help & Display panel has independent accessibility failures

> Promoted to [[../ACTIVE#A-032 — Help & Display must satisfy contrast and landmark semantics|A-032]]. This section remains evidence, not a second executable home.

**Severity:** Significant. **Confidence:** High. **Likely cause:** the floating
utility was built outside the page landmark and token/contrast contracts.

This is related to A-031 but outside that task's explicitly locked scope.
Playwright/axe reports the panel's 12px descriptions at computed contrast ratios
of **2.69-2.70:1** against their dark/translucent surfaces, below the required
4.5:1. The source uses `rgba(255,255,255,0.3)` for `Cosmic default`, `Maximum
readability`, and `Stops animations for older devices`. Serious contrast failures
appeared on the home page, both broker-profile routes, and Mantle depending on
viewport. On `/property/audit-invalid-property`, axe also reports the open
`.toolbox-float` content outside any landmark. A-031 authorizes dismissal only
and expressly excludes panel composition, so contrast/semantics cannot be
smuggled into that implementation.

**Reconcile/exit:** decide whether the global utility should be a named
complementary/region landmark or live inside an appropriate shell landmark;
replace the low-contrast descriptive treatment with compliant semantic tokens;
and pass focused axe scans on the invalid-property surface, home, Mantle, and
both canonical/legacy broker profiles in Desktop and Mobile Chrome. Preserve the
owner-approved auto-open and A-031 dismissal decision.

### GAP-09 — Orbit has no page-level H1 on desktop or mobile

> Promoted to [[../ACTIVE#A-033 — Orbit needs one route-level H1 without breaking its Descent embedding|A-033]]. This section remains evidence, not a second executable home.

**Severity:** Significant accessibility/structure regression. **Confidence:**
High. **Likely cause:** A-024 correctly demoted embedded Orbit inside Descent,
but the shared component has no route-aware heading level.

`/layer/orbit` renders `Top-Ranked Spaces` and all subsequent headings as H2/H3;
there is no H1. The failure reproduced at compact phone and desktop widths in
both browser projects, then reproduced in the focused single-worker run. The
same shared `BoardPodium` is embedded inside `/descent`, where H2 is correct, so
a blanket H2-to-H1 edit would re-open the duplicate-heading defect A-024 closed.

**Reconcile/exit:** make the Orbit route supply exactly one meaningful H1 while
the Descent embedding remains H2; pass the existing shared-descent heading suite
on both projects and retain one top-level main landmark.

### GAP-10 — Mobile universal-header menu exposes an off-viewport destination

> Promoted to [[../ACTIVE#A-034 — Every mobile universal-menu destination must be actionable|A-034]]. This section remains evidence, not a second executable home.

**Severity:** Significant mobile navigation defect. **Confidence:** High.
**Likely cause:** the Pixel 5 bottom-sheet/popover geometry does not make the
`/brokers` link scrollable into the actionable viewport in this state.

On Mobile Chrome, the visible `/brokers` link inside `#header-menu-panel` cannot
be clicked because Playwright repeatedly reports it outside the viewport even
after scroll-into-view. The same test passes on desktop and the mobile failure
reproduced in the focused single-worker run, so it is not full-suite concurrency
noise. This is narrower than the previously completed menu touch-target work:
the trigger is correctly sized, but a destination inside the open menu is not
operable.

**Reconcile/exit:** measure panel/link rectangles and internal scroll position on
Pixel 5 and 320/360/390px viewports; ensure every destination can be brought
inside the visual viewport and activated without relying on forced clicks; then
pass the route-change, focus-trap, every-destination, safe-area, and no-overflow
menu cases on desktop and mobile.

### GAP-11 — Two E2E contracts no longer observe the behavior they claim to protect

> Promoted to [[../ACTIVE#A-035 — Browser safety contracts must target current product boundaries|A-035]]. This section remains evidence, not a second executable home.

**Severity:** Significant verification gap. **Confidence:** High. **Likely
cause:** product data/loading contracts evolved while exact selectors and route
mocks stayed fixed.

The Airtable catalog test proves the API returns the exact three expected
brokers and the rendered accessibility snapshot contains all three advisor
articles, but it still asserts `.broker-card`, a class the A-023 directory no
longer renders; it deterministically reports zero cards on both projects. The
LR-01 lifecycle test mocks `**/rest/v1/properties*`, yet the dashboard remains in
`Add your first property`, so the fixture never reaches the current owner data
path and the dangerous-action UI is no longer tested. Separately, the broad run
once saw two simultaneous `Named signals only` nodes during skeleton-to-content
transition; that semantic-text assertion passed in isolation, so it should be
made state-aware rather than treated as a product copy defect.

**Reconcile/exit:** update the catalog assertion to a durable role/name or
directory-region contract while retaining exact Airtable roster checks; mock the
actual current owner-property request for LR-01 and prove the fixture appears
before exercising the collapsed danger zone; wait for the professional directory
loading state to settle before strict semantic assertions; then pass both
projects without weakening the safety behavior.

## Cross-cutting diagnosis

The repository is not suffering from one broken subsystem. The recurrent shape
is **verification and documentation boundary drift**:

1. A route is tested for common identities but not the absent/null authority
   state (U-012).
2. Each database write works in isolation while the public source-of-truth
   bridge is skipped (U-013).
3. A separately deployed application is linted/tested but not built in the same
   required gate (GAP-02).
4. Operational scripts and templates sit outside the strongest application
   contracts (GAP-01, GAP-05).
5. Framework and visual-dependency upgrades leave explicit old-version
   configuration behind (GAP-03, GAP-04).
6. Browser execution reveals global-overlay coupling, route/embed heading
   coupling, and test contracts tied to obsolete implementation details
   (A-031, GAP-08 through GAP-11).

The highest-leverage improvement is not a broad refactor. It is to extend
existing gates around **negative authority states, dual-store projection,
separate-app builds, and scheduled-data output contracts**.

## Scope boundaries and retractions

- No code, migration, live provider state, deployment, commit, push, Airtable
  row, or Supabase row was changed by this audit.
- No approved surface checksum was updated.
- Browser execution was local against the suite's production build and test
  environment. It is strong reproducible application evidence, not a claim that
  every external production integration or physical device was exercised.
- `npm audit` was green at the audit time, not a permanent guarantee.
- Root `.env.example` covers every non-platform main-app variable consumed by
  current code; the environment-template finding is specific to Mission Control.
- The standard root `verify` script intentionally lists rather than runs E2E,
  and existing Done evidence already records that boundary. It is not reopened
  as a duplicate task here.
- Next.js 15.5 in Mission Control and 16.3 in the main app are documented as
  separate deployments. Version skew alone is not classified as a defect.
