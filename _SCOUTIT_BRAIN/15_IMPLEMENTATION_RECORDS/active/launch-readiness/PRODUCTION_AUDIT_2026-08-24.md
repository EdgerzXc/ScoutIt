---
section: "15_IMPLEMENTATION_RECORDS/active/launch-readiness"
status: verified-audit
tags: [production, audit, accessibility, seo, performance, auth]
updated: 2026-08-24
related: ["[[00_MASTER_ACTION_PLAN]]", "[[URGENT]]", "[[ACTIVE]]", "[[MASTER_OWNER_ACTIONS]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE|FUTURE]]"]
---

# Production website audit — 2026-08-24

## Release and scope

Audited `https://scoutit.space` after GitHub `main` reached `a35237d`. The
production Vercel instance returned HTTP 200 for the homepage, About, property
directory, broker directory, public CMS feed, robots, sitemap, and health route.
`/api/health` reported API, Supabase, Airtable, and email healthy. The observed
fresh process uptime immediately after the push is deployment evidence, not a
claim that every external dashboard is configured.

The audit was read-only. It did not publish, archive, delete, approve, send an
inquiry, spend a Connect, create an account, or write valid reaction/analytics
data. Invalid security probes were rejected before any permitted write.

Raw machine evidence: `evidence/full-site-audit-2026-08-24.json`.

## Coverage and clean signals

- Desktop and Pixel 5 axe/DOM/network sweep: 49 routes each, 98 page/profile
  observations total.
- Curated production Playwright pass: 314 read-only public/design/responsive/
  accessibility/professional tests; 306 passed on the broad run. Six failures
  were deterministic harness defects, not production failures. The two remaining
  mobile timing failures passed 6/6 on three immediate repetitions.
- Release gate before push: approved surfaces 3/3, lint, 489-file typography
  audit, 1,563/1,563 unit tests, 518 E2E cases discovered, and a 121-page build.
- Audited routes had no horizontal overflow, broken images, missing image alt
  attributes, duplicate IDs, sub-12px visible text, or browser page exceptions.
- Invalid `property_id` reaction input returned 400. The geo-pricing invalid
  payload was rejected with 400. Protected QuestIT v1 read returned 401.
- `robots.txt` and `sitemap.xml` returned 200. The live sitemap contained 16
  canonical-host URLs; sample/private URLs were not treated as public results.

## Verified findings and disposition

| Finding | Evidence | Disposition |
|---|---|---|
| Nonexistent nested property URLs are soft 404s | `/property/audit-invalid-property/brokers` and `/property/audit-invalid-property/unit/audit-invalid-unit` returned HTTP 200, indexable metadata, and titles formed from caller-controlled path text; the parent correctly returned 404/noindex. Current server routes do not call `notFound()` when parent/unit lookup fails. | **U-011** in Urgent. |
| Public semantic and contrast defects | `/discover` has two H1s and an unlabeled utility nav beside another nav; `/descent` has two H1s; Crust uses `role=tabpanel` on `article` and the inactive `--accent-muted` 12px index measured 2.69:1 on mobile. | **A-024** in Active. |
| Signed-out/auth entry is noisy and misleading | `/admin` and private dashboard subroutes issue protected requests while anonymous and log expected 401 errors; inbox fetches before proving identity. Onboarding separately requests missing `/grain.png` even though the global data-URI grain already exists. | **A-025** in Active. |
| The live-target browser harness has false failures | Manifesto no-JS test hardcodes `http://localhost:3000/about`; Descent tests use an unscoped `ScoutIt` link locator now matching both layer nav and footer. These accounted for six of eight broad-run failures. | **A-026** in Active. |
| Layout stability and homepage foreground work need a measured repair | Three desktop samples produced CLS ~0.26 on `/brokers`, ~0.13 on `/property`, and ~0.11 on warm `/discover`. Homepage navigation timing painted quickly, but the automation event loop took ~20–30s desktop and ~7–8s mobile to complete a 3.5s settle/evaluate sequence, requiring a long-task/interaction trace before optimization. | **A-027** in Active; do not guess at a WebGL fix. |
| Google sign-in rejects the production origin | Google Identity Services returned 403 and logged that the origin is not allowed for the deployed client ID on onboarding/login-derived entry surfaces. Email/password/OTP remain available. | **O-011** in Owner Actions for Google/Supabase/Vercel configuration and controlled sign-in proof. |
| Locked Showcase has semantic defects | Axe found nested/duplicate `main` landmarks and H1→H4 heading order in `ShowcaseStage.js`. That file is checksum locked, so the audit does not authorize an edit. | Existing **F-006** owner approval expanded with the exact semantic-only change. |
| Canonical coverage is partial | Canonicals exist on core directories/layers, but live indexable routes including `/`, `/discover`, `/enterprise`, `/badges`, `/terms`, and `/privacy` emitted none. Private/noindex routes are not counted as defects. | Existing **L-001** Future launch-readiness work, not a duplicate Active task. |

## False-positive and boundary notes

- Expected invalid URLs returned 404 and expected protected APIs returned 401;
  those statuses are not outages.
- Aborted `_rsc` prefetches during navigation and blocked Google/Cloudflare
  headless resources were separated from application page exceptions.
- The one Manifesto rail and one broker-directory mobile timing miss did not
  reproduce in 6/6 focused reruns; no product task was opened from them.
- The automated audit cannot replace W-004 real-device, assistive-technology,
  cognitive, or authenticated account acceptance.
