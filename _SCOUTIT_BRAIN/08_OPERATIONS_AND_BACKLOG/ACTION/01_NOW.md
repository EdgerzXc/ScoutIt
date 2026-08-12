---
section: "08_OPERATIONS_AND_BACKLOG/ACTION"
status: active
tags: [action, now, launch-gate]
updated: 2026-08-08
related: ["[[00_START_HERE]]", "[[02_YOURS]]", "[[03_LATER]]"]
---

# 01 · NOW — everything between here and real users

> Ordered by **what it blocks**. Not by when it was written down.
> Owner-only items live in [[02_YOURS]] and are cross-referenced, not repeated.

---

# GATE A · BEFORE YOU PROMOTE — ~2 hours

**Promotion drives crawls. Crawls are permanent.** The site is already indexed,
so every one of these is being read by Google *right now* in its wrong state.
This is the highest value per minute in the vault.

### A1 · ✅ DONE 2026-08-08 — `NEXT_PUBLIC_SITE_URL` set
`src/lib/siteUrl.js` resolves in order: `NEXT_PUBLIC_SITE_URL` →
`VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → `https://www.scoutit.space`.
The first is **unset in production**, so the Vercel host wins and every canonical,
`og:url` and JSON-LD `@id` tells Google *"the real version of this page lives
somewhere else."*

- [x] **Set in Vercel by the owner 2026-08-08.** Verified against the live site:
      every URL in the homepage response is `www.scoutit.space`. No Vercel host
      anywhere. Because `siteUrl.js` is the single source, this one variable
      fixed canonical, `og:url`, JSON-LD `@id`, `sitemap.js` and absolute links
      in one move.
- [x] `src/lib/cmsFallback.js` → real domain, and the test inverted in the same
      change (now also asserts `not.toMatch(/vercel\.app/)`).
      ⚠️ **Correction to the original note: this was never an SEO problem.** Its
      only caller returns `null` unless `NODE_ENV === "development"`, so no
      crawler ever saw it. Worth changing anyway — a Vercel-generated host is
      outside our control and silently breaks local dev when the project is
      renamed, which already happened once.
- [x] `src/app/layout.js:48` — **checked, no change needed.** The Vercel host
      appears only inside a comment explaining a bug that was already fixed;
      line 51 is `metadataBase: new URL(SITE_URL)`, already correct. Left as-is
      deliberately: it is the record of *why* the two hosts once disagreed.
- [ ] Re-check `sitemap.js` output once the current batch deploys

### A2 · ✅ DONE 2026-08-08 — `JsonLd.js` fixed
Three problems in one file, all entity-level, all being read on every crawl.

- [x] **`"@type": "RealEstateAgent"` → `Organization`.** `/terms` states ScoutIt is *"deliberately
      and strictly NOT a real estate broker, salesperson, appraiser, consultant
      or dealer under RA 9646."* The structured data says the opposite,
      machine-readably. Now `Organization`, plus `alternateName`
      (*ScoutIt Philippines*) and `knowsAbout` for disambiguation.
- [x] **`sameAs` REMOVED entirely** — and it must stay empty until verified. It lists `twitter.com/scoutit`,
      `facebook.com/scoutit.ph`, `linkedin.com/company/scoutit`. There is a
      Scoutit in India with LinkedIn company pages. `sameAs` means *"this is the
      same entity as us."* An absent `sameAs` costs nothing; a wrong one merges
      your entity with someone else's. → add back one at a time, [[02_YOURS]] Y8.
- [x] **Descriptions realigned** — were selling the old positioning — *"Real Estate Directory
      Philippines"* is the exact category `/about` says ScoutIt is not, while the
      homepage's own indexed description already says *"spatial commerce
      platform."* Both now match what is already landing in the index.

### A3 · ✅ DONE 2026-08-08 — copy contradictions resolved
The same fact was stated three different ways in three places.

- [x] `src/app/pricing/page.js` — *"dominate the intelligence roster"*
      contradicts `/about`'s *"never by who paid the most"* **and** the two-layer
      decision (B4). Now sells **eligibility for priority routing**, with
      *"Your independent rating stays earned, never bought."*
      **Also found and fixed on `/pricing/broker`:** the page headline literally
      read *"Dominate The Intelligence Roster"*, the subhead promised to *"boost
      your algorithms"*, and the Universe Elite tier was described as
      *"Top-of-roster placement."* All three sold purchasable ranking.
- [x] `src/components/layout/Footer.js` — *"Philippine operations governed by
      RA 9646"* contradicts `/terms` on every page of the site. Narrow to
      *"Real-estate services facilitated through ScoutIt are subject to
      applicable Philippine law, including RA 9646 where relevant."*
      ⚖️ **Still needs a lawyer's review** — flagged in the code comment.
- [x] SEO title anchored: *"ScoutIt — Property & Space Intelligence
      Philippines."* **"Philippines" does more work than "ScoutIt"** — it
      separates you from India, from the EV battery, and from outer space in one
      word. "Space Intelligence" stays everywhere in the copy — it is the brand.

### A4 · ✅ DONE 2026-08-08 — samples are `noindex`
Decided 2026-08-08: samples are **public and badged**. Badges work on people;
Google does not read them. Indexed samples 404 in bulk when they are removed
after human testing, and a real owner's first contact with ScoutIt could be a
search result for an invented listing in their own building.

> ⚠️ **No sample flag existed** — this needed the mechanism built, not toggled.
> `is_sample` now maps from an Airtable `Is_Sample` column in `airtable.js`.
> **The field does not exist in Airtable yet, so all of this is currently inert**
> — nothing changes for real listings until the column is added and ticked.
> That is deliberate: the code is ready before the data is.

- [x] **`noindex` on sample property pages** — `robots: { index: false, follow: true }`.
      `follow` kept so links out of a sample still reach real pages.
- [x] **Excluded from `sitemap.js`.** A sitemap entry plus a noindex tag is a
      contradiction Google resolves by crawling the URL anyway to read the tag —
      spending budget on a page we already said not to index. This file has
      already paid that cost once with the `/hubs` soft-404s.
- [x] **No JSON-LD on samples.** A `Product`/`Offer` node on a fabricated
      listing is a machine-readable claim that something is for sale when it is
      not — the version of this that earns a manual action.
- [x] 🔴 **Unit pages inherit it.** Marking a parent `noindex` does nothing for
      its children — separate URLs, separate metadata. And units are the
      long-tail surface, so a fabricated parent would push invented, highly
      specific listings into the index *at the greatest volume*. Missed in the
      original A4 wording; caught while implementing.
- [ ] Add the `Is_Sample` column in Airtable and tick it on the 7 seeded records
- [x] Samples excluded from share briefings, emails, OG images

### A5 · Confirm the §65 fix reached the crawler — 15 minutes 🔴
`/discover` and `/property` render again. **Unverified: whether the Suspense
boundary resolves on the SERVER** (streamed HTML carries the markup, which is
what a crawler needs) **or only on the client.** Only one of those fixes SEO.

- [x] ✅ **ANSWERED 2026-08-08 — and the answer was split.**
      `/discover` server-renders correctly (it was already a server shell around
      a client child). **`/property` did not** — the crawler received exactly
      one line, `LOADING DIRECTORY LEDGER...`, with a 200 and a correct title.
- [x] **Shell fixed** — `page.js` is now a server component wrapping
      `DirectoryClient.js`; `"use client"` moved down one level. Verified live.
- [x] **Grid fixed** — a *second* loading state (`LOADING THE DIRECTORY...`,
      confusingly near-identical) survived the shell fix because the list was
      fetched in a `useEffect`. Now loaded server-side and passed as
      `initialProperties`, premium-stripped.
- [ ] Re-verify on the next deploy: the body must contain property names
- [ ] Request indexing for both in Search Console rather than waiting
- [ ] Check coverage for soft-404 / "crawled – currently not indexed"

### A7 · ✅ DONE 2026-08-08 — "The Board" → **Orbit**
*Dropped from the first cut of this file. From the session audit.*

Two fundamentally different things are one word apart, and **in the bottom nav
they are the same word.** Confirmed in code:

| label in the UI | what it actually is | route |
|---|---|---|
| **"The Board"** | rankings — top properties | `/layer/orbit` |
| **"The Board"** | rankings — the podium | `/showcase` |
| **"Board"** ← bottom nav | **your saves** | `/wishlist` |
| **"Your Board"** ← header, wishlist page | your saves | `/wishlist` |

So on mobile the primary nav has an item called **"Board"** that opens *saves*,
while two other pages titled **"The Board"** are *rankings*. Obvious once you
know ScoutIt. Invisible to a stranger — and this is one of the first things they
tap.

The fix uses a concept already built and already indexed: **`/layer/orbit` is
literally the Orbit layer.** Only the plain-language label says "The Board."

- [x] **Orbit = rankings.** Done — no user-facing "The Board" string remains
      anywhere in `src/`. `BottomNav`'s **Board** now unambiguously means your
      saves, with a comment forbidding reuse of the word for rankings.
- [ ] ⚠️ **Re-request indexing for `/layer/orbit` and `/showcase`** — both page
      titles changed, so the index currently holds the old ones.
- [ ] ~~**Orbit = rankings.**~~ `LayerNav.js:10` `Orbit: "The Board"` → `"Orbit"`
      or `"Rankings"`; `layer/orbit/page.js:21` `title="The Board"` → `"Orbit"`;
      `layer/orbit/layout.js` title + description; `showcase/page.js` title;
      `page.js:638` **"Browse The Board"** → **"Browse Orbit"**;
      `ShowcaseStage.js:421`; `CinematicJourney.js:23` `"01 — THE BOARD"`
- [ ] **Your Board = saves.** `BottomNav.js:94` label `"Board"` → `"Your Board"`
      — this is the one that actually collides
- [ ] Do it **before more pages index.** `/layer/orbit` is already indexed as
      *"The Board — Top Properties"*, so this is a small SEO event; it is smaller
      now than after the article push
- [ ] `mockShowcase.js` comment and `delete-account/route.js:59` are internal —
      rename for consistency, no user impact

### A6 · Baseline the non-branded queries — 10 minutes
Brand indexing proves the site exists. It does not prove the architecture
acquires users. **Baseline before the article push so there is a before/after.**

- [ ] *spatial commerce Philippines* · *property intelligence Philippines* ·
      *verified property intelligence* · *office space intelligence Manila*

---

# GATE B · BEFORE REAL USERS — the stranger test

**A stranger with no one beside them explaining what you built.**

### B1 · The browser pass — one session, ~2–3 hours 🔴
**This one item replaces thirteen.** C4, C9, C10, C11, C12, C15, C16, C18, C21,
C25, C26, C29, C35 and W3 were all *"verify X in a browser."* They are one
session on real hardware. ⚠️ **100% device work — nothing here can be done
without a phone.** → [[02_YOURS]] Y2

Run on **iPhone and Android**, at 375px, and re-check at 1280px:

- [ ] **Inbox** — WAITING gate, Decline, Withdraw, archive lifecycle (7d archive,
      30d delete, reopen resets)
- [ ] **Public profiles** still render after the RLS lockdown
- [ ] **`100dvh`** — scroll until the toolbar collapses, then back. Full-height
      screens must not clip or jump. `/intel` side panel footer; homepage
      `.property-split` last row; `/dashboard/crm`; Mission Control; Team
      Management; `/showcase`; `/discover`; `MonthView` `grid-cols-7`
- [ ] **New signup** hits the age gate; an existing account still works
- [ ] **Privacy settings page** (it 500'd until 2026-08-06)
- [ ] **Entitlement gate** with a real subscriber — ⚠️ **turn
      `pre_launch_free_mode` OFF first** or everything looks unlocked
- [ ] **Lister declaration modal** at 360 / 390 / 768 / 1280; contrast ≥ 4.5:1;
      publish end-to-end from a phone and confirm `owner_claim_agreed` stored
      with timestamp and `disclaimer_version`
- [ ] **The UI pass** — `/intel` wide card reverts to stacked below 768px;
      featured hero `aspect-ratio` does not collapse; `/about` de-centred;
      **`Header.js` after the `<style jsx>` conversion** (back button radius
      20px, min-height 44px, dropdown closed state) — highest risk, it is on
      nearly every page
- [ ] **Connect refund panel** — clicked once → [[02_YOURS]] Y3
- [ ] Tick each row **with the device it was checked on**

### B2 · ✅ DONE 2026-08-08 — loading states
Zero loading states in three of seven dashboard modes. While data fetches the
screen is indistinguishable from *"you have nothing"* — the worst possible
ambiguity in a first session. A new broker sees an empty pipeline that may not
be empty.

> ⚠️ **Correction:** the item said "match `OwnerMode`'s existing pattern."
> **`OwnerMode` has no skeleton pattern** — the grep hit was a toast string.
> There was nothing to match, so `DashboardSkeleton.js` is the first one and is
> now the pattern the next mode should copy.

- [x] **`DashboardSkeleton.js`** — `CardGridSkeleton` + `RowListSkeleton`.
      Skeletons, not spinners: they reserve the layout the real content will
      occupy, so nothing jumps when data lands. A centred spinner collapses the
      page to zero height and then shoves it down — the CLS source `/property`
      already had to fix once.
- [x] **BuyerMode** — 2 empty states gated. The saved-board one told a
      *returning* user their saved spaces were gone.
- [x] **BrokerMode** — 3 empty states gated on the `isLoading` the context was
      already exporting and no mode consumed.
      🔴 **The worst of the three was a claim, not a blank:** *"You have pitched
      all available properties in the market"* rendered while the feed was still
      loading. An empty state that is merely uninformative is survivable; one
      that asserts something false about the user's own work is not.
- [x] **BulkImporterMode** — different problem, named rather than papered over.
      It reads a local file, so it never had the empty-vs-loading bug. Its gap
      was two sequential network calls (AI column mapping, then bulk insert)
      behind a button reading "Processing…". Now a live status line plus
      `aria-busy`, because a long silent wait over the user's real portfolio is
      where people double-submit or reload.
- [x] Screen readers get `role="status"` + an `sr-only` sentence — without it a
      load is completely silent assistively, which is the same bug in another
      medium.

### B3 · ✅ MOSTLY DONE 2026-08-08 — empty states
`brokers/page.js:367` — *"No matching intelligence advisors found."* True, and
it says the platform is empty.

- [x] **Split into two states**, because they mean opposite things: an empty
      ROSTER is a founding invitation (*"The Founding Advisor cohort is being
      assembled"* + an apply CTA); an empty FILTER result is a search miss.
      Merging them told a visitor the platform has nobody.
- [x] Same split applied to `/property` — *"The first spaces are being
      verified"* with a **List a space →** CTA
- [x] ✅ **Photographers, researchers, event planners — DONE 2026-08-08.**
      They *did* already have the two-state split; the grep missed it. What was
      actually wrong is subtler: the ROSTER state read *"No photographers on the
      public roster yet"* — accurate, and still telling a first-time visitor the
      platform is empty. Now a founding invitation with a CTA, matching brokers.
      **The split existing is not the same as the split working.**
- [x] `DiscoverClient.js` — *"No regions match ''"* fired on first paint
      because the guard was on `shownRegions.length`, not on the query. Now
      guarded on `regionQuery.trim().length > 0`.

### B4 · Your Move — two visibly separate layers
Decided 2026-08-08.

| layer | what it is | subscription affects it? |
|---|---|---|
| **Top Rated** | Independent ratings | **No. None.** |
| **ScoutIt Match** | subscription **+** ratings **+** detail relevance to *this* deal | **Yes** |

- [x] Two distinct sections, never one merged list
- [x] Layer 2 labelled a **recommendation**, not a ranking, with its inputs disclosed where a user can see them
- [x] ⚠️ Layer 1 must be provably untouched by tier. If a subscribed broker's rating ever moves, layer 1 is dead and so is the trust argument. Test it.
- [x] Say the good part out loud: because **detail completeness** is an input, money alone cannot buy the top slot
- [x] Record in `SCOUTIT_BIBLE.md` so it cannot drift once money is involved

### B5 · Mock data — transfer and label now, remove later
Decided: **the mock data stays through human testing.**

- [x] ✅ **MOCK DATA + PROVENANCE** — moved static mock data out of component files and into `src/data/mock/`. Added centralized `USE_MOCK_DATA` flag. 
- [x] ✅ LABEL — `<ProvenanceBadge>` as a field on the record, not a prop at the call site. A prop gets forgotten by exactly one component and that is the one that gets screenshotted.
- [x] ✅ TEXT — Check the fallback copy in `ProviderMode`. If the API fails it should silently show the mock set, but with a visual indicator that says "showing sample bounties — live feed unavailable".* — it currently renders invented client names as real
- [ ] **REMOVE — after human testing, not before.** Flip the flag, delete
      `src/data/mock/`, confirm every surface renders with real data or a real
      empty state.

### B6 · Correctness and cleanup
- [x] ✅ **CAAP, not CAA** — done 2026-08-08. Three sites: the photographers
      verification list, the HUD toggle, and a "CAA Certified" badge. CAA is the
      UK regulator; on a page whose purpose is *verification criteria*, naming
      the wrong one undermines the claim.
- [x] ✅ **Probe routes gone 2026-08-08.** `src/app/` is down to 39 entries and
      no `zzprobe-*` / `__probe_*` remains. Nothing imported them.
      Added `.fuse_hidden*` to `.gitignore` — in-place edits over the mounted
      filesystem leave stale handles that would otherwise be committable.
- [x] ✅ **`git checkout -- src/lib`** — ~35 files of comment-only churn from a
      backtick fix that ran wide. No behaviour change.
- [ ] **Remove the Rickroll** from the seed data before any demo with video.
      ⚠️ **Not in the repo** — no `dQw4w9WgXcQ` / `rickroll` string in `src/`,
      `supabase/` or `scripts/`. It is almost certainly in **Airtable**. Check
      the CMS, not the code, and record which it was.
- [x] ✅ **DONE 2026-08-08 — located and fixed.** `FoundingProgramPanel.js:40`.
      **The JSX source was correct** — `{serviceName} goes live` has the space,
      which is why it stayed unlocated. The cause is the **text-node boundary**:
      an expression between two literals server-renders as three text nodes
      separated by `<!-- -->`, and the space next to that comment is lost. Line
      34 of the same file, `{ctaLabel} →`, renders fine — it has a literal on
      one side only. Fixed by building the sentence as a single interpolated
      string: one text node, no boundary. Confirmed on the deployed page first.
- [x] ✅ **DONE 2026-08-08 — ZERO raw `<style>` tags remain anywhere in `src/`.**
      The count was **24, not 17**, and the split mattered more than the number:
      **9 of them were in SERVER components**, where `<style jsx>` is impossible
      (styled-jsx needs `"use client"`). Converting those would have pushed every
      Intel article, both legal pages, the 404 and all four directory detail
      pages into client rendering — undoing the D2 server-render work in the
      same commit that "fixed" them.
      - [x] **15 client files → `<style jsx global>`** — behaviour-identical,
            removes the React 19 hoisting hazard, zero scoping risk
      - [x] **9 server files → real `.css` imports**, still server-rendered
      - [x] **~900 lines of duplication deleted on the way.** Event-planner,
            photographer and researcher detail pages carried **byte-identical
            294-line blocks** (verified by md5). Now one
            `src/app/directory-detail.css`. Broker was a genuine variant and was
            deliberately kept separate so its rules cannot drift into the other
            three.
      - [x] ESLint clean across all of `src/app` and `src/components`

### B7 · ✅ DONE 2026-08-08 — Keyboard and screen reader
- [x] Convert to `<button type="button">` where it is genuinely a button — that
      brings focus, Enter/Space and semantics for free, rather than bolting on
      `role` + `tabIndex` + a key handler
- [ ] Tab through one full mode end to end

### B8 · ✅ DONE 2026-08-08 — Mobile-first on the two stub modes
`OperatorMode` has **one** responsive class in 126 lines; `BulkImporterMode` one
in 232. Both are desktop-only, against the standing mobile-first instruction.

- [x] `OperatorMode` — `InventoryGridManager` is the real work
- [x] `BulkImporterMode` — importer tables are the classic mobile failure
- [x] At 375px, not a narrow desktop window

### B9 · Finish what is half-built
> ⚠️ **Four of these were already finished.** Verified against the working tree
> 2026-08-08 — see [[05_DONE_VERIFICATION_2026-08-08]]. They were built and
> mounted, and the backlog line was never touched. **W7 was one command away
> from being built a second time.**

- [x] ✅ **W7** `/hubs/[slug]` — **DONE.** `src/app/hubs/[slug]/page.js` ships;
      `HUB_PAGE_EXISTS` is gone from `sitemap.js` (slugs map from
      `LOCATION_HUB_SLUGS:42`, so page and sitemap read one array and cannot
      drift); `sitemap.test.js` inverted in the same commit. Exactly as spec'd.
- [x] ✅ **W8** property claim UI — **DONE.** `ClaimPropertyPanel.js` →
      `/api/property/claim`, mounted at `property/[id]/page.js:208`
- [x] ✅ **W11** SEO readiness in dashboard — **DONE.** `SeoReadinessPanel.js`,
      imported in `OwnerMode.js`
- [x] ✅ **W13** anonymity shield toggle — **DONE.** `PrivacyShieldPanel.js`,
      rendered at `settings/page.js:376`
- [ ] **W12** staff property verification — the only one of the four still open;
      no caller found in `src/app/dashboard`, `src/components/dashboard` or
      `mission-control/src`
- [ ] **W19** consolidate the admin gate onto `lib/adminGuard.js` — ⚠️ **verify
      before working.** 4 files import `adminGuard`; **zero** API routes do a raw
      `is_staff` / `isAdmin` / `role === 'admin'` check. This may already be done.
- [ ] **W20** two competing profile URL schemes — ⚠️ **re-scope or close.** Only
      `src/app/profile` exists in the app router; the second scheme is not there
- [ ] **C17** wishlist share-link revocation — confirmed **not built** (no revoke
      path under `src/app/api/wishlist*` or `src/app/wishlist`)
- [x] ✅ **STALE — self-claim IS enforced.** Verified 2026-08-08:
      `api/property/claim/route.js` returns **409** *"This listing is already
      yours — there is nothing to claim"* when `property.owner_id === userId`,
      and `propertyClaimApi.test.js:176` asserts it. Three sibling 409s are also
      covered (owner-verified, owner-declared, duplicate active claim).
      **Third stale item found in B9** — see [[05_DONE_VERIFICATION_2026-08-08]].

### B11 · Make the parent/child relationship unmistakable
*Dropped from the first cut. This is the **real** remaining Ridgeline issue.*

The audit's original P0 was "mother property and units are blurred together."
You corrected it: **the separation already exists.** What it exposed is a
presentation problem, and it is still open.

On Ridgeline the mother record presents itself visually as **one specific 340
sqm / 38th-floor residence at ₱68M**, while simultaneously listing a **350 sqm /
45th-floor unit at ₱150M** underneath Units. A visitor cannot tell what they are
looking at — and neither will RAG, which will have two plausible answers to
*"how much is Ridgeline?"* and three to *"what floor?"*

- [ ] Label the level explicitly. Something as small as
      **PROPERTY** · The Ridgeline at Capitol Commons versus
      **SPACE WITHIN THIS PROPERTY** · 38F Five-Bedroom Residence removes it.
      Exact wording is a design call; the parent/child relationship just has to
      be visible.
- [ ] Fix the mock record so parent and child stop describing the same kind of
      thing at different numbers — it is mock data, so this is free
- [ ] Public labels stay category-natural: Units (residential) · Available
      Spaces (commercial) · Rooms & Facilities (hotel) · Areas (venue) · Zones
      (restaurant). **Users should never have to speak database.**

### B10 · Then: put humans through it
Not a campaign. **5 owners · 5 seekers · 2–3 brokers · 2 photographers or
researchers.** Do not explain ScoutIt first. Give them the URL.

- [ ] Watch where they click, where they stop, what they do not understand, and
      what makes them say *"oh, that's cool"*
- [ ] The question being tested: **can a stranger understand and trust this
      without you standing beside them?**

---

# GATE C · BEFORE REAL DATA — the security boundary

**Not now. Not launch. The day mock stops and private owner data starts.**
Everything is mock today, so there is nothing to leak — which is exactly why it
must already be done on the day that changes.

### C1 · Server-side field authorization 🔴
`/api/cms` returns **everything** to an unauthenticated request: all properties,
all Intel, all brokers, and the `deepIntel` objects the tier UI is supposed to
gate — HOA reserves, dues history, tax, insurance, CapEx, transaction history,
ownership lineage, blueprints, room dimensions, material schedules, cap rate,
price history.

**Tier protection is currently UX protection, not data protection.**

- [ ] Server receives `user + role + tier + property + scoped permissions` and
      returns **only permitted fields**. Never filter in the browser.
- [ ] The eye ×5 → Universe unlock is a fine dev affordance. It must not be the
      access-control mechanism — disable in production or gate behind an
      authenticated internal account.

### C2 · Targeted data access
One property view currently downloads the entire CMS. Fine at 6 properties;
not at 10,000 spaces, 20,000 children and thousands of professionals.

- [ ] `/api/spaces/{slug}`, `/api/spaces/{slug}/children`,
      `/api/spaces/{slug}/intel`, or server-side RSC loading
- [ ] Field projection by tier. The tiers already exist in
      `src/lib/entitlements.js` — **`starry · solar · cluster · universe`** — so
      the projection has a vocabulary to use rather than one to invent:
      public → solar → cluster → owner/admin. Solves C1 and this in one move.

### C3 · Separate dev Supabase project → [[02_YOURS]] Y5

### B10 · Dashboard Usability & Core Integrations
- [ ] **W23 · Buyer / Scout Mode Default**: Default `/dashboard` initialization to `buyer` mode for every user identity.
- [ ] **W24 · Typography Scale Sweep**: Fix small/hard-to-read text across Inbox, Calendar, Schedules, CRM, drawers (baseline 13px–15px).
- [ ] **W25 · Universal Header**: Mount `Header.js` consistently on dashboard layouts.
- [ ] **W26 · Contact Live Chat**: Implement real-time visitor live chat on `/contact` connected directly to Master Mission Control (MMC).
- [ ] **W27 · Google Calendar OAuth**: Audit `/api/calendar/sync` and update Google Cloud Console redirect URIs (`redirect_uri_mismatch`).
- [ ] **W29 · Enterprise Read-Only Preview**: Enable interactive read-only browsing of Enterprise Mode and attach the Enterprise Pricing Upgrade Modal on any add/mutation action.
- [ ] **W30 · Layer 2 Discover & Intel Integration**: Unify `/discover` and `/intel` with bi-directional navigation, embedded space carousels, intel badges, and spatial radar overlays.

---

# GATE D · BEFORE PAYMENTS — the North Star

**200 real, approved listings.** Then paywalls and subscription tiers.

### D1 · Settle the schema before 200 listings make it expensive
Decided: **properties with child rows**, not space nodes. Faster to 200, and 200
real listings beats an elegant schema with six.

**Take the two-column hedge — near-zero cost, and it is the difference between a
rename and a redesign later:**

- [ ] `parent_id` — self-referencing, nullable, instead of a hard `property_id`
      FK. Identical behaviour today; allows arbitrary depth later.
- [ ] `space_type` enum (`unit｜floor｜amenity｜room｜suite｜common_area｜facility｜parking｜zone｜custom`).
      Today it always reads `unit`. Adding it later means backfilling every row
      by inference.

Still open:
- [ ] Category-aware intelligence schemas — residential / commercial / venue
      should not share one flat shape
- [ ] **Explicit subtype.** `spaceCategory = "Residential"` with
      `property_type = ""` is why `propertySchema.js:42` maps a penthouse to
      `SingleFamilyResidence`. Needs `Residential → Condominium Unit`, and
      `Building → Residential Condominium Tower` as a separate entity. Subtype
      then drives schema.org, filters, comparables, pricing, UI language.
- [ ] Canonical + subtype URL rules so 200 listings are not duplicate content
- [ ] Public / Connect-gated / internal field boundaries

### D2 · Server-render unit master pages
`UnitMasterPage.js:151` renders *"Loading Unit Intelligence…"* and fetches on
mount. `generateMetadata` **is** server-side and correct — so crawlers get a good
`<title>` wrapped around an empty body. **Different bug from §65, still open.**

The single biggest unrealised SEO asset: *Unit 3801 Ridgeline · Penthouse
Ridgeline · 5BR Ridgeline · Ridgeline 340 sqm · Ridgeline units for sale* —
genuinely distinct Spaces, not spun thin content. This is the original SEO thesis.

- [x] ✅ **DONE 2026-08-08.** The route now loads the record server-side and
      passes `initialProperty`; `UnitMasterPage` seeds state from it instead of
      fetching `/api/cms` on mount. Stripped to the `starry` tier first — this
      is an anonymous surface and server props serialise into the HTML (§45).
      **Found while fixing:** `generateMetadata` was *already* fetching the
      property and discarding it, while the client re-fetched the entire CMS.
      One page, two loads, neither reaching the crawler.
- [ ] Only generate a master page where the child Space justifies one
- [ ] Verify on the deployed site — fetch a unit URL and confirm the body
      carries the unit name, not "Loading Unit Intelligence…"

### D3 · Six advertised pricing benefits have no implementation → [[02_YOURS]] Y4
### D4 · Revisit grandfathering before payments go live
### D5 · Monthly Scout Wrap — still a pre-launch requirement? → [[02_YOURS]] Y6
