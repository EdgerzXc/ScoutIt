---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: complete
tags: [audit, launch-readiness, frontend, backend, accessibility, security]
updated: 2026-08-09
related:
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN]]"
  - "[[../../../08_OPERATIONS_AND_BACKLOG/ACTION/OWNER_ONLY_ACTIONS]]"
---

# FULL SYSTEM RE-AUDIT — 2026-08-09

## Outcome

ScoutIt is **not yet ready for invited human testing**. The application builds,
the core unit suite is green, the live public surface is reachable, and the
existing architecture contains meaningful authorization and rate-limit controls.
The remaining blockers are concentrated and actionable; a wholesale rebuild is
not justified.

The first release target remains an honest, stable human-testing build. Mock and
sample data stays in place and must be labelled **SAMPLE DATA — FOR HUMAN
TESTING**. Sample removal is an actual-launch task only.

## Audit inventory

| Surface | Inventoried | Evidence |
|---|---:|---|
| Public/customer app pages | 54 source routes | `evidence/page-inventory.json` |
| Mission Control pages | 18 source routes | `evidence/page-inventory.json` |
| Main-app APIs | 88 route handlers | `evidence/api-inventory.json` |
| Mission Control APIs | 2 route handlers | source review |
| Automated test files | 90 | repository inventory |
| Browser route/state checks | 90 desktop + 90 mobile | `evidence/full-site-audit.json` |
| Mission Control anonymous checks | 18 desktop + 18 mobile | `evidence/mission-control-audit.json` |

Representative live screenshots are in `evidence/screenshots/`. The automated
visual evidence does not replace real-device and assistive-technology testing.

## Baselines

| Check | Result | Interpretation |
|---|---|---|
| Main lint | pass, 0 errors, 0 warnings | Clean after Next 16.3 navigation-rule reconciliation and stale suppression removal. |
| Main unit tests | 69 files, 882/882 pass | Strong regression baseline for tested logic, including hub ISR, Google OAuth UI, and buyer/seeker dashboard alias contracts. |
| Main production build | pass | 113 pages generated; all three `/hubs/[slug]` routes are SSG with one-hour revalidation and no Upstash/no-store warning. |
| Mission Control lint | pass, 0 findings | Clean static baseline. |
| Mission Control build | pass | 26 pages generated. |
| Full Playwright suite | 365 pass, 1 intentional skip | Green 366-check production-mode desktop/mobile gate; PDF export is desktop-only and Sharp image optimization runs on both projects. |
| Main production dependencies | 0 advisories | Targeted patch releases verified; full production-and-development audit is also 0. |
| Mission Control production dependencies | 0 advisories | Next 15.5.23 plus targeted transitive patches; full production-and-development audit is also 0. |
| Tracked application secret-pattern scan | no application hits | Example credentials exist only in vendored skill documentation, not product paths. |

Both builds initially failed only because the restricted audit environment could
not reach Google Fonts. With network access, both production builds succeeded.
That first failure is not classified as a product defect.

## Risk-ranked findings

### HT-01 — Sample inventory is live without its required protections

- **Risk:** P0 / human-testing blocker
- **Evidence:** all seven property URLs are present in the live sitemap; sampled
  property pages have no `SAMPLE DATA` label or `noindex`; the owner-side
  `Is_Sample` field activation remains undone.
- **Required work:** owner adds/marks `Is_Sample`; engineering verifies labels,
  `noindex`, sitemap exclusion, JSON-LD exclusion, child-space protection, and
  safe routing of sample inquiries.
- **Pass:** all seven samples remain navigable for testers but are unambiguously
  labelled, excluded from indexing/structured data, and isolated from real users.

### HT-02 — Mission Control used a vulnerable Next Server Action release

- **Risk:** P0 / security blocker
- **Evidence:** the vulnerable Next 15.5.20 tree was upgraded independently to
  Next 15.5.23 with patched PostCSS, NanoID, and Sharp runtime paths. The full
  audit also pins patched brace-expansion and js-yaml development paths.
- **Required work:** local remediation is complete; owner approval is required
  before deployment and production verification.
- **Pass:** met locally. Production and full audits are 0; the 26/26-page build
  and lint pass; all 10 anonymous, inactive, wrong-tier, valid-tier,
  image-optimizer, and canonical-slug boundary tests pass.

### HT-03 — Mission Control can silently change indexed property URLs

- **Risk:** P0 / data-integrity and SEO blocker
- **Evidence:** `mission-control/src/app/api/property/route.js` accepts `title`
  edits on approved records, republishes to Airtable, then overwrites Supabase
  `slug` when Airtable's title formula changes. This violates ScoutIt's locked
  first-publication canonical URL rule.
- **Required work:** block live-title changes until an explicit staff migration
  creates slug history and a permanent redirect; never silently overwrite the
  canonical slug.
- **Pass:** editing an approved listing cannot change its public URL; an approved
  migration preserves the former URL with a permanent redirect and audit event.

### HT-04 — Turnstile is blocked by the production CSP

- **Risk:** P1 / abuse-control blocker
- **Evidence:** login, onboarding, dashboard, profile, and broker-portal states
  report that `https://challenges.cloudflare.com/turnstile/...` violates
  `script-src`; the domain is absent from the current production CSP.
- **Required work:** add only the Cloudflare Turnstile directives required by the
  integration and verify the production site/secret keys as a pair.
- **Pass:** Turnstile loads and validates on all protected forms; a missing,
  expired, replayed, or invalid token is rejected server-side; no CSP error occurs.

### HT-05 — Scheduled mutation routes fail open when `CRON_SECRET` is absent

- **Risk:** P1 / authorization blocker
- **Evidence:** both configured main-app cron routes skip authentication when the
  environment variable is missing. One archives/deletes deal content; the other
  sends notifications.
- **Required work:** fail closed in every non-test environment and add anonymous,
  wrong-secret, and correct-secret tests.
- **Pass:** missing configuration produces no mutation; anonymous and wrong-secret
  calls fail; the scheduled Vercel invocation succeeds once and is auditable.

### HT-06 — Public device telemetry accepts unbounded service-role writes

- **Risk:** P1 / integrity, privacy, and cost blocker
- **Evidence:** `/api/telemetry/device` accepts free-form identifiers, paths,
  search text, locations, and event types, then writes through `supabaseAdmin`.
  It has centralized rate limiting but no schema/length allowlist and returns raw
  exception messages.
- **Required work:** schema/length allowlists, server-derived identifiers where
  possible, privacy classification, safe errors, retention, and abuse tests.
- **2026-08-09 engineering remediation:** production-mode concurrency exposed duplicate
  pageview counters behind the endpoint's single-row assumption. The prepared owner-gated
  migration now merges counts, adds a pageview-only uniqueness invariant, and installs
  a service-role-only atomic increment RPC. The route has a bounded compatibility path
  until that migration is approved and deployed; focused tests pass 12/12.
- **Pass:** oversized/unknown fields fail without a write; sensitive text cannot
  enter logs; response errors reveal no internals; retention and rate tests pass.

### HT-07 — Full browser regression gate (resolved locally)

- **Risk:** P1 / release-confidence blocker
- **Original evidence:** 19/284 checks failed. Root clusters included SPA navigation waiting
  for `load`, renamed Enterprise preview controls, duplicate broker assertions,
  missing mobile Your Move controls, public share/auth errors, header glass-blur
  expectation, and CSP/media errors.
- **Required work:** reproduce each cluster, fix product defects, update only stale
  selectors/contracts, and rerun both projects.
- **Pass:** the complete desktop/mobile suite is green twice consecutively with no
  unexpected console or page errors.
- **2026-08-09 remediation complete:** the suite was expanded to 362 checks and
  passed 362/362 twice consecutively in production mode. Fixes covered responsive
  property actions, directory keyboard navigation, local-only production E2E auth,
  map readiness, CRM/Vault contracts, header timing, and stale selectors. The
  localhost E2E gates remain server-rejected on public hosts.

### HT-08 — Critical and serious accessibility failures remain

- **Risk:** P1 / human-testing blocker
- **Evidence:** Axe found critical missing labels on date/time/text/textarea/select
  inputs; serious unnamed Leaflet controls, non-focusable scrolling regions, and
  indistinguishable inline links. Contrast, heading, and landmark findings are
  widespread. No horizontal overflow, broken image, missing image alt, or duplicate
  ID was found in the audited anonymous states.
- **Required work:** fix shared root causes, then perform keyboard, visible-focus,
  reduced-motion, 200% zoom, screen-reader, and real-device checks.
- **Pass:** no critical/serious Axe violations on the audited states; one complete
  journey works with keyboard and screen reader on desktop and mobile.
- **2026-08-09 automated remediation complete:** the production-backed crawl now
  covers 88 desktop and 88 mobile routes with zero critical, zero serious, and zero
  navigation errors. The deterministic shared regression suite passes 38/38 after
  fixing names, focusable scroll regions, link distinction, landmarks, headings,
  and contrast. The remaining pass condition is the owner-coordinated real-device
  NVDA/VoiceOver and TalkBack/VoiceOver journey at 200% zoom.

### HT-09 — Live content contains broken or unsafe interaction edges

- **Risk:** P1 / trust blocker
- **Evidence:** discovered Intel links `/intel/makati-yields`,
  `/intel/nuvali-expansion`, and `/intel/pasig-zoning` return 404; property pages
  attempt to frame an Unsplash image as media, a sample Matterport ID returns 403,
  some broker-roster requests return 404, and anonymous share/property behavior can
  throw `Please log in again` instead of an intentional sign-in state.
- **Required work:** repair/remove broken internal links, classify media by type,
  use honest sample embeds or explicit unavailable states, and make anonymous
  interactions fail gracefully.
- **Pass:** link crawl is clean; property media has no CSP/403 error; missing broker
  rosters show an honest empty state; anonymous actions never throw a page error.
- **2026-08-09 remediation:** engineering and local live-backed verification are
  complete. Media is provider-classified before rendering, audited placeholder IDs
  are denied, images never enter spatial iframes, missing/non-public roster records
  return an explicit non-contactable state, and the focused Chromium contract passes
  without the audited page errors. Production Airtable cleanup, lifecycle
  reconciliation, deployment, and production rerun remain owner-gated.

### HT-10 — Dependency remediation must be split by reachability

- **Risk:** P1/P2
- **Evidence:** the main app now resolves DOMPurify 3.4.13 through direct jsPDF,
  fast-uri 3.1.5 through Sentry/AJV, NanoID 3.3.18 through PostCSS, Next 16.3.0,
  and Sharp 0.35.3. Development-only brace-expansion, js-yaml, and undici paths
  were also patched. Mission Control independently resolves Next 15.5.23,
  PostCSS 8.5.26, NanoID 3.3.18, Sharp 0.35.3, brace-expansion 1.1.18, and
  js-yaml 4.3.1.
- **Required work:** dependency remediation is complete locally. Obtain owner
  deployment approval; no blind bulk upgrade.
- **2026-08-09 main-app remediation:** `html2pdf.js` was removed after its
  full-DOM raster export proved unbounded on cinematic property pages. A compact
  CSS-token-driven jsPDF tear-sheet now produces a valid PDF, and the export
  control's stacking/actionability defect is fixed. Full npm audit is 0; build
  is 113/113; unit is 882/882; lint is clean; focused export/URI tests are 51/51;
  the real PDF and Sharp browser contracts pass 2/2; and the full suite finishes
  with 365 passes plus one intentional mobile skip for the desktop-only export.
- **2026-08-09 Mission Control remediation:** production and full audits are 0;
  lint is clean; all 10 staff authorization/image/slug boundary tests pass; and
  the production build generates 26/26 pages.
- **Pass:** met locally for both applications; deployment remains owner-gated.

### HT-11 — Mission Control is not deployable at its planned protected hostname

- **Risk:** P1 / operational blocker
- **Evidence:** `mc.scoutit.space` is NXDOMAIN. Anonymous local requests correctly
  redirect all 18 staff routes to the sign-in page, but authenticated tier/MFA/device
  behavior cannot be certified without provisioned staff test identities and the
  Cloudflare/Vercel controls.
- **Required work:** complete the existing DNS, Deployment Protection, Cloudflare
  Access, Supabase TOTP, exact-email, device posture, cache, watermark, and print
  deterrence work.
- **Pass:** direct/bypass host is unavailable; expected hostname enforces both
  Access and active staff role with AAL2; device cases and revocation are tested.

### P2 cleanup — not a pilot blocker by itself

- **Resolved 2026-08-09:** the CMS Redis client uses the neutral fetch-cache mode
  instead of Upstash's `no-store` default. The regression contract passes, the
  clean build emits no Upstash warning, and all three hub paths report SSG with
  one-hour revalidation.
- Remove five duplicate variable definitions from root `.env.local` after verifying
  which occurrence is authoritative; never copy values into documentation.

- Review production CSP nonce/hash hardening after Turnstile works; current
  `unsafe-inline`/`unsafe-eval` should not be accepted as the permanent state.
- Consider self-hosting configured fonts only if build-network reliability becomes
  an observed deployment problem.

## Verified work that should not remain as build tasks

- Main and Mission Control production builds succeed.
- Main unit suite passes 882/882.
- Public API rate limiting is centralized in `src/proxy.js`; direct per-route
  limiter imports are not required.
- Shared main-app admin routes use `requireAdmin`; Mission Control mutations
  consistently resolve active staff and assert tier before the service-role write.
- Mission Control's verification page exists and is mounted in staff navigation;
  the remaining work is authenticated human verification, not building W12 anew.
- Live directory SSR is deployed: brokers expose live profile links; photographers,
  researchers, and event planners expose honest founding states in raw HTML.
- Root domain redirects to `www`; all 23 current sitemap URLs return 200; robots.txt
  is reachable; public responses include CSP, HSTS, frame denial, MIME sniffing,
  referrer, and permissions headers.
- Automated anonymous route states showed no navigation crash, horizontal overflow,
  broken image, missing image `alt`, or duplicate ID.

## Human testing that automation cannot certify

The first human-ready release still requires:

1. iPhone, Android, and 1280px desktop passes with browser/version recorded.
2. Keyboard-only and screen-reader completion of one full seeker, owner, broker,
   and staff journey.
3. 200% zoom, reduced motion, text scaling, safe-area, virtual keyboard, focus
   restoration, and long-content checks.
4. Authenticated owner/broker/staff authorization and cross-account object tests.
5. Aesthetic/trust review of every major page section in both supported display
   modes, including loading, empty, error, success, and destructive-confirmation
   states.
6. Production email, Turnstile, analytics, monitoring, rollback, and recovery
   rehearsals.

## Evidence limitations

- No destructive security test was run against production.
- Production checks were GET/HEAD/browser reads only, apart from ordinary page
  analytics that the live application itself may emit.
- Authenticated Mission Control and real cross-account flows await safe staff/test
  identities; they remain open tasks rather than assumed passes.
- Axe detects only part of accessibility; human assistive-technology testing is
  mandatory.
