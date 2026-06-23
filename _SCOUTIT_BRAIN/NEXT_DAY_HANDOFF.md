# ScoutIT — Next-Day Integration Handoff

> Snapshot + build plan to resume cleanly. Written 2026-06-21 (end of session).
> Read with `00_SOP.md` (how we work), `00_COUNCIL.md`, and the detailed specs linked at the bottom.
> **Reminder:** the running code + live data win over any doc — verify before acting.

---

## 0. LIVE DEPLOYMENT STATUS (updated 2026-06-22)
- **Deployed to production:** `scoutit.vercel.app` (Vercel project `prj_EERckLskNq8vLPLyavEXjYfen4kI`,
  team `team_hWRb9j8WjUJshQqZuBkAOTFz`; repo `EdgerzXc/ScoutIt`, branch `main`).
- **Antigravity IDE ("ScoutIt Builder") has been building in parallel and is AHEAD of the local
  edits.** Already shipped & live: Owner Editor v1 (live workspace + Draft/Publish), QuestIT
  raise-from-edit, contextual bottom navigation, mobile overhauls, buyer dashboard↔Ledger sync,
  concierge UI. **Treat the deployed/committed code as source of truth — re-read it; local edits
  may be superseded.**
- **Public side works live:** real Airtable listings on `/property` + `/api/cms` (`source: airtable`).
- **Env-var saga (RESOLVED):** the live owner dashboard was empty because the `NEXT_PUBLIC_SUPABASE_*`
  vars were marked **"Sensitive"** in Vercel → Next.js doesn't inline sensitive vars into the client
  bundle → `supabaseClient` fell back to its no-keys **stub** → **zero** Supabase calls. Proven via:
  direct REST call returns 200 + data; `performance` shows 0 supabase requests; keys absent from
  client chunks. **Fix applied:** re-added `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` as **NON-sensitive, plain, Production** (via Vercel CLI) + pushed a
  fresh commit to rebuild. (Airtable vars can stay sensitive — they're read server-side.)
- **✅ VERIFIED LIVE (2026-06-22):** demo owner dashboard renders One/Two E-Com Center listings and
  fires 3 Supabase requests (`/properties`, `/deals`, `/saved_intel`). The env-var fix holds.
- **MOBILE UX COUNCIL LOOP — round 1 done (2026-06-22, LOCAL edits, NOT yet pushed).** Reviewed owner +
  broker dashboards at 390px (via same-origin iframe — `resize_window` can't shrink a maximized window).
  Note: committed code now uses **Tailwind utility classes** in the dashboards (the docs' "no Tailwind"
  line is stale — running code wins). Five additive fixes made:
  1. `OwnerMode.js` portfolio completeness ring → added inner `%` label (was an empty gold ring that
     read as a perpetual loading spinner).
  2. `OwnerMode.js` portfolio card height `h-64` → `h-auto min-h-[12rem] md:h-64` (killed the dead empty
     mid-band on phones; desktop unchanged).
  3. `OwnerMode.js` "+ New Property File" header button → `hidden md:inline-block` (the contextual
     "+ List" FAB is the canonical add-listing control on mobile — one control per action).
  4. `BrokerMode.js` added an `lg:hidden` mobile header (the desktop action bar is `hidden lg:flex`, so
     phones had no title / pipeline context).
  5. `BrokerMode.js` `dealTitle()` guard → never render a raw UUID as a deal title (owner-initiated
     handshake deals carry no title; falls back to the connected property's title or "Unknown Property").
- **NEXT:** owner/Antigravity pushes → re-verify the five fixes live at phone size, then continue the
  council loop (FAB/last-card overlap, broker `lg:`-vs-owner `md:` breakpoint consistency, the UUID deal
  data root-cause in `inviteBroker`).
- **Connectors available:** Airtable MCP, Supabase MCP (project `yyixsuaimdzyiocswcgc` — auto-pauses,
  restore if timing out), Vercel MCP (ids above), Claude-in-Chrome ("Browser 1") for live viewing.
- **Hard-won gotchas:** the sandbox bash mount is STALE vs the real files (verify code via the Read
  tool or the live site — never `git push` from the sandbox); Supabase auto-pauses; `NEXT_PUBLIC_`
  vars must be non-sensitive to reach the browser; demo-owner login + dev-open RLS are scaffolding to
  remove before launch.

---

## 1. STATUS — what's built (this session, local)

### Airtable — base `appWFRqR0wy6hSR6h` (live)
- Persona-audit fields added: `SERVICE_PROVIDERS` (Bio, Service_Area, Rating, Reviews_Count);
  `BROKERS_CMS` (ID_Card_Status, License_Verified).
- New table **`PROPERTY_BROKERS`** (`tblNGGdhICLnm2WFS`) — owner↔broker handshake (Role, Status, Initiated_By, Authority_Source, dates).
- Config **seeded**: `L2_CATEGORIES` (6), `REACTION_TAGS` (4), `BOUNTIES` (5), `CONNECT_COSTS` (6),
  `CONNECT_PACKS` (4: ₱49/199/499/1,199), `Subscription Tiers` rebuilt to **20 clean rows** (junk
  removed) + `Listing_Limit`, `FEATURE_GATES` + `User_Type` + **40 gate rows**.
- Mission Control interface: **5 new pages published** (Property–Brokers, Connect Costs, Connect
  Packs, Bounties, Reaction Tags).
- ⏳ **Manual TODO:** add rollup `Active_Listings_Count` on `BROKERS_CMS` (API can't make rollups).
- ⏳ Add select choices: `Event Planner` (Subscription Tiers.User_Type) + `SPOTLIGHT` (INTEL_CMS.IntelType).

### Supabase — project `yyixsuaimdzyiocswcgc` (auto-pauses when idle)
- Was **empty**; full schema applied: `properties`/`deals`/`projects`/`saved_intel` (+ PostGIS radius
  RPC); `user_profiles`/`privacy_settings`/`broker_profiles`/`researcher_profiles`;
  `subscriptions`/`connect_balances`/`connect_transactions`/`bounty_claims`; `error_reports`.
- `properties` extended: `space_category`, `details` jsonb, `pipeline_status`, `slug`; user-ref
  columns coerced to **text** (matches localStorage IDs).
- **Seeded** from the SM Offices deck: owner `usr-sm-offices` (Cluster, 18 Connects, limit 20) +
  listings **One E-Com Center** and **Two E-Com Center** (real rent/CAMC/PEZA/etc.).
- ✅ App `.env.local` repointed to this project (was on a dead one).
- ⚠️ RLS is **dev-open** everywhere — security overhaul deferred; harden before launch.

### App code (Next.js) — verify with `npm run dev`
- `OwnerMode` reads the logged-in owner's real listings (owner-id filtered) + `activeListing` crash fix.
- **Category-aware wizard** (`GuidedWizard`): step 1 = the 6 categories → category-specific fields
  step → saves `details` + `space_category` + `owner_id` + `pipeline_status='pending'`; completeness scoring.
- **Owner→broker handshake**: `inviteBroker` (spends 1 Connect → writes `deals` + `connect_transactions`
  + decrements `connect_balances`) + "Invite an advisor" panel in the dossier.
- **Demo owner login**: "View demo — SM Offices (Owner)" button on onboarding (REMOVE before launch).
- **QuestIT VIP Concierge (Claude 3.5)**: Backend (`api/questit/route.js`) and UI HUD (`ConciergeChat.js`) built and tested, but currently **shelved/unmounted from layout**. To activate for pre-launch: re-mount `<ConciergeChat />` in `layout.js` and add `ANTHROPIC_API_KEY` to `.env.local`.
- **Error/report safety net**: global `ErrorBoundary`, `reportError` util, `ReportButton` (every page),
  `error_reports` table — wired in root layout.

---

## 2. DECISIONS LOCKED (this session)
- **Price:** shows only in "Your Move", only owner-verified (`Price_Status`+`Price_Verified_By`); else nothing.
- **Launch pricing:** confirmed numbers or none (no placeholder public prices live).
- **Listing Engine / PDF:** concierge now (Claude follows the SOP), Claude API later; PDF stored in
  **Supabase Storage**; brain builds the listing in **Airtable** → mirrors to Supabase → owner reviews → **Publish**.
- **Connects:** granted resets monthly (no roll-over); earned + bought never expire; handshake spent-on-send,
  no refund; packs ₱49/199/499/1,199.
- **Owner editor:** edit **section-by-section on the real master page** (the page is the live canvas; an
  edit panel is the remote control). **Draft until Publish.**
- **Required at publish:** only universal must-haves (title, category, location, ≥1 photo, a price decision).
  **Never require pro-only fields** (forcing a guess breaks "the signals are real"); everything else = completeness nudges.
- **QuestIT:** the **initiator always pays 1 Connect.** Open board (pro nudges = pro pays) OR direct/**Guild**
  (owner initiates = owner pays). Lane B platform bounties pay the claimer. Guild = owner's saved roster of preferred pros.
- **Process:** the 5-seat **Council** + the **SOP** govern every turn; each category curates different data (per-category SOP).

---

## 3. NEXT-DAY BUILD PLAN (ordered)
1. **Owner editor v1 (the spine).** Make the master page (`CommercialFlow`/`ResidentialFlow`) able to
   render from passed-in data (the enabler) → section-by-section edit panel on the live page → **Draft
   banner + Publish gate** (the ~5 must-haves + price confirm). This one surface also powers AI-draft
   review and editing existing listings.
2. **Concierge PDF front door.** 4th wizard mode "Upload your deck" → Supabase **Storage** bucket → create
   an `ai_drafting` listing with `details.source_pdf` → owner sees "drafting → review". Claude drafts via the SOP.
3. **QuestIT raise-from-edit.** "Raise a Quest" on pro-only/unknown fields → `bounty_claims` with a
   `target_field` → Quest board (open-board nudge + direct/Guild) → add `CONNECT_COSTS` rows
   ("Pro nudges a quest" = 1, "Owner initiates a quest (direct/Guild)" = 1).
4. **Shared services (Edge Functions).** Connect grant/reset/earn, handshake-charge hardening,
   Airtable↔Supabase sync (submission→port, bounty-verified→flag, tier→display) — then Claude API auto-draft.
5. **Replicate persona experiences** (Broker → Researcher → Photographer → Event Planner → Seeker) reusing this plumbing.
6. **Manual Airtable:** the `Active_Listings_Count` rollup.

---

## 4. OPEN DECISIONS (not blockers)
- QuestIT: `Target_Field` mechanism (field id vs section); auto-suggest quests?; **Guild** storage + how pros join an owner's guild.
- Connect spend amounts: confirm; flat vs Upwork-style value-scaled (later).
- Tagline (still open). Payments (PayMongo/Xendit) + email (Resend/Brevo) — deferred.

---

## 5. GOTCHAS / HOW TO VERIFY
- **Sandbox bash mount is stale** vs the Edit-tool/real files — do NOT trust a sandbox build/lint for
  edited files; verify via the Read tool or `npm run dev`.
- **Supabase auto-pauses** when idle → if queries time out, restore the project.
- **RLS dev-open** everywhere → don't half-harden; it's a dedicated later overhaul.
- **Scaffolding to remove before launch:** demo-owner login, mock-data fallbacks, any "Simulate" backdoors.

---

## 6. DETAILED SPECS (the source of truth for each area)
- Process: `00_SOP.md`, `00_COUNCIL.md`
- Per-user experiences: `07_FEATURES_AND_FLOWS/USER_EXPERIENCES.md`
- Connects + broker handshake: `06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md`
- Category fields (wizard/editor source): `04_DATA_AND_SCHEMA/CATEGORY_FIELD_SOP.md`
- Live Supabase schema: `04_DATA_AND_SCHEMA/SUPABASE_LIVE_SCHEMA.md`
- QuestIT: spec file removed — decisions are recorded in §2 above (revisit before building QuestIT).
- Pricing/tiers: `06_MONETIZATION/SCOUTIT_PRICING_STRATEGY.md`
- Identity/vision: `01_IDENTITY_AND_VISION/SCOUTIT_BIBLE.md`
