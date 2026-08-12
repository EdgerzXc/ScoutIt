---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [canonical, master-action-plan, open-work, launch, roadmap]
updated: 2026-08-11
related:
  - "[[05_DONE_VERIFICATION_2026-08-08]]"
  - "[[06_SESSION_HANDOFF_2026-08-08]]"
  - "[[MASTER_OWNER_ACTIONS]]"
  - "[[../ROADMAP_TRIAGE_2026-08-08]]"
  - "[[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]]"
---

# SCOUTIT MASTER ACTION PLAN

> **This is the only live execution list.** It contains work that is still open,
> including founder actions, unresolved decisions, verification, and
> trigger-gated obligations. Finished work belongs in
> [[05_DONE_VERIFICATION_2026-08-08]], not here.

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
  labelled **SAMPLE DATA â€” FOR HUMAN TESTING**, and excluded from indexing;
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
- owner/lister-confirmed prices only; blank or â€œPrice on requestâ€ is honest;
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

# LOCKED EXPERIENCE LOGIC â€” LUXURY WITH PURPOSE

ScoutIt's primary visual language remains spatial intelligence in deep black, warm
gold, cinematic depth, and precise editorial typography. This is a direction, not a
rule that every pixel must be black or gold. Restrained neon and other supporting
colors are welcome when they communicate layer, role, state, data, or atmosphere and
still meet contrast requirements. Do not add color as random decoration.

For any material design decision, use the following combination before implementation:

1. **Taste Skill** â€” write a one-line Design Read, reject templated AI patterns, and
   set explicit variance/motion/density dials for the page. Use it chiefly for public
   narrative, editorial, and brand surfaces, not as a dashboard component system.
2. **UI/UX Pro Max** â€” generate or consult the design-system recommendation, then
   validate responsive layout, touch targets, safe areas, theme contrast, loading,
   focus, accessibility, and reduced-motion behavior.
3. **Emil Kowalski design engineering** â€” decide whether each motion should exist,
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

# PHASE 1 â€” GET READY FOR HUMAN TESTING

The first deliverable is a stable human-testing build on live `scoutit.space`.
Deployment, explicit sample-data labelling, authentication safety, and
critical-flow verification serve this goal. Do not remove mock or sample data
in this phase.

## 1.0 Close the 2026-08-09 re-audit blockers

Canonical evidence: [[../../15_IMPLEMENTATION_RECORDS/active/launch-readiness/FULL_SYSTEM_REAUDIT_2026-08-09]].
Do not split repeated desktop/mobile symptoms into separate backlog items.


- [ ] After the owner confirms the production Cloudflare hostname/key pair,
      Supabase CAPTCHA setting, and Vercel environment, deploy and verify a real
      valid token on onboarding, waitlist, and property inquiry; engineering tests
      already cover absent, expired/replayed, invalid, and configuration-failure paths
- [ ] After the owner confirms `CRON_SECRET` and deploys, verify Vercel Cron Jobs
      history records successful production runs for both configured routes;
      fail-closed authorization and scheduled-run tests are already complete
- [ ] After owner review, apply the prepared telemetry migration (30-day retention,
      count-preserving pageview dedupe, atomic counter RPC, and uniqueness invariant),
      confirm `IP_SALT` in production, deploy, and verify the scheduled cleanup;
      schema/length allowlists, server-derived identity, redaction, safe errors,
      centralized rate coverage, and abuse tests are already complete

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

- [ ] Land the already-targeted root and Mission Control dependency remediation only
      after the complete release gate passes; both current local lockfiles audit at
      zero, while GitHub `main` still reports 25 open Dependabot alerts (13 high,
      12 medium). Confirm the dependency graph refreshes and alerts close before
      closing or superseding the related Dependabot PRs
- [ ] Resolve all 19 open CodeQL findings by source-specific remediation or an
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
      CodeQL before resolving its four duplicate alerts
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
- [ ] Display **SAMPLE DATA â€” FOR HUMAN TESTING** on every sample card, detail
      page, child space, profile, dashboard record, and affected interaction

## 1.4 Search indexing follow-through

- [ ] Recheck the deployed `scoutit.space` sitemap and canonical URLs
- [ ] Monitor the existing Google index in Search Console; submit individual
      routes only when a material page or metadata change requires recrawling
- [ ] Inspect `/property`, `/discover`, `/layer/orbit`, and `/showcase` after
      deployment rather than treating initial discoverability as unfinished
- [ ] Review soft-404, excluded, and â€œcrawled â€” currently not indexedâ€ coverage
- [ ] Record a baseline for the four agreed non-branded search queries before the
      first article batch

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

### True Light Mode â€” not Lite Mode

- [ ] Treat **Light Mode** as a complete first-class visual theme across every public,
      profile, property, dashboard, modal, menu, form, empty, loading, error, and success
      state. Do not mark Light complete from a homepage-only pass
- [ ] Keep **Lite Mode** a separate performance/motion choice; it must never substitute
      for, rename, or silently activate Light Mode
- [ ] Replace dark-only raw colors and component-local theme assumptions with semantic
      tokens. Give Light Mode deliberate warm-ivory/ink/gold hierarchy, readable surfaces,
      visible dividers, intentional shadows, and equal state contrastâ€”not washed gray,
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

### ScoutIt Manifesto â€” comprehensive interactive explanation

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

### Layer 05 Mantle â€” who ScoutIt is and how it works

- [x] Keep the four existing categoriesâ€”**Our Story**, **Platform Architecture**,
      **Data Philosophy**, and **Trust & Verification**â€”and make every category solely
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

### Layer 06 Inner Core â€” â€œIt is all about youâ€

- [x] Redesign `/layer/core` and `/about-you` as one coherent final chapter: Mantle
      explains ScoutIt; Inner Core turns the model toward the seeker, owner, broker, or
      professional and shows the exact workflow and value for that person
- [x] Make the â€œyou at the centerâ€ schematic interactive and role-aware with accessible
      list/diagram parity, clear next steps, and no duplicate explanation between Core
      and About You
- [x] Use the verified server session and real permitted data for personalization.
      Never treat `scoutit_user` localStorage as authentication or show invented portal
      metrics (`142`, `07`, `03`, `12`) as truth; keep them only if explicitly marked
      **SAMPLE DATA â€” FOR HUMAN TESTING** or replace them with honest empty states
- [x] Make the Mantle â†’ Core â†’ About You transition narratively continuous, mobile-safe,
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

# PHASE 2 Ã¢â‚¬â€ CONTROLLED PILOT SAFETY

## 2.1 Authentication and onboarding truth

- [x] Tell users before the final onboarding step that email confirmation is
      required; test resend, expiry, wrong-email recovery, and confirmed login
- [x] Verify a production dashboard requires a real Supabase session and cannot
      treat `scoutit_user` local storage as authentication
- [x] Keep demo/mock mode isolated from real APIs and impossible to enable in
      production accidentally
- [x] Rename or remove the production-facing Ã¢â‚¬Å“Dev Mode: Bypass PaywallÃ¢â‚¬Â label;
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
- [ ] Test with 5 owners, 5 seekers, 2â€“3 brokers, and 2 photographers/researchers
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
      **SAMPLE DATA â€” FOR HUMAN TESTING** and cannot be confused with verified
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
      failed reports no longer show success, local development telemetry is disabled,
      and the exact Node `abortIncoming`/`Error: aborted` client-disconnect signature
      is discarded without suppressing application exceptions. Focused monitoring
      tests and lint pass. Keep this open until one sanitized deployed-production
      event is visibly received in Sentry.
- [ ] Record support owner, incident path, pilot feature flags, and rollback steps
- [ ] Observe clean logs and support behavior before widening the cohort

---

# PHASE 3 â€” DATA TRUST AND INVENTORY SCALE

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

## 3.0 Actual launch cutover â€” remove mocks here, not during testing

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
- [ ] Publish 3â€“5 plain, sourced intelligence briefings before building an
      interactive newsroom framework
- [ ] Establish profile/roster acquisition and verification operations
- [ ] Progress toward 200 real approved listings; report verified count separately
      from samples, drafts, and stale inventory

---

# PHASE 4 â€” PRODUCT DEVELOPMENT AFTER PILOT STABILITY

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

# PHASE 5 â€” COMMERCIAL ACTIVATION

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

# FOUNDER DECISIONS â€” NO ENGINEERING UNTIL ANSWERED

| ID | Decision | Recommended default / deadline |
|---|---|---|
| D1 | Confirm the strategy at the top of this file | Confirm now |
| D2 | Delivery choice for each of six pricing benefits | Before any payment |
| D3 | May a broker see property traffic before representation is accepted? | No |
| D4 | When may public profiles be indexed? | After demo profiles are removed; otherwise per-demo `noindex` |
| D5 | FAQ Silver meaning | Separate licensed Advisor Spec from Contributor |
| D6 | May delegated brokers confirm freshness? | Yes, with verifier audit trail |
| D7 | Hidden FAQ retention period | 90â€“180 days plus manual erasure |
| D8 | Is legacy `source` metadata or public display data? | Treat as internal provenance unless proven otherwise |
| D9 | Keep cyan/magenta accents? | Only with explicit semantic roles |
| D10 | Keep bounce easing? | Replace with restrained motion |

Record the answer here, convert it into an action in the correct phase, and
remove the decision row. Do not duplicate it in another checklist.

---

# TRIGGER-GATED FUTURE WORK â€” NOT THE CURRENT QUEUE

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

# LAYER 2 DISCOVER & INTEL SYMBIOTIC INTEGRATION ARCHITECTURE

1. **Bi-Directional Symbiotic Twin Concept**:
   - Market Intelligence (`/intel`, Layer 2 Stratosphere) and Space Discovery (`/discover`) are two sides of the same coin and must operate as deeply integrated companion features.
   - A unified navigation bar allows seamless switching: `[🔍 DISCOVER SPACES]` ↔ `[📡 MARKET INTEL & BRIEFINGS]`.
   - Context, category filters, and active region selections persist when switching between reading research and exploring physical spaces.

2. **Discovery-Embedded Space Carousels in Intel Articles**:
   - All Intel articles, OSINT briefings, and market reports dynamically render **Embedded Space Carousels** of active verified ScoutIt properties affected by the article's topic or location.

3. **Intel-Powered Discovery Dossiers**:
   - Property cards and regional clusters on `/discover` display matching **Intel Signals & Yield Badges** (e.g. `"BGC Yield Signal +8.2%"`, `"Transit Impact Zone"`).
   - Tapping an Intel badge on a property opens a side dossier with the underlying market research.

4. **Spatial Radar Map Overlay (`[📡 SIGNALS]`)**:
   - `/discover` features an interactive MapLibre map mode displaying geotagged market signals with dynamic impact radiuses, highlighting properties inside signal boundaries.

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
owner, phase, and acceptance gate hereâ€”never reactivate the whole source file.
