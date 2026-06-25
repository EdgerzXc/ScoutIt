# ScoutIT — Session Handoff (2026-06-25)

> Read this first to resume cold. Pairs with `00_SOP.md`, `00_COUNCIL.md`,
> `06_MONETIZATION/TIER_DISTINCTION.md`, and the two backend plans in `04_DATA_AND_SCHEMA/`.
> **Running code + live data win over any doc — verify before acting.**

---

## 0. How to work with this owner (important — read once)
- Owner is **non-technical**. Explain everything in **plain layman's terms**, no jargon.
- **Go slow. Discuss before building.** Don't do too much at once; don't dump decisions on the owner —
  use the Council to offer options *with a recommendation*.
- **Tell the owner before every push.** Pushing to `main` auto-deploys to BOTH live sites.
- **Sandbox rule:** default = push straight to `main`. The `scoutit` *sandbox* project is used **only
  when a big/risky change** shouldn't risk the main — not by default.

## 1. Live state (verified 2026-06-25)
- **Two Vercel projects auto-deploy the same repo** (`EdgerzXc/ScoutIt` → `main`), so both stay in sync:
  - `scout-it.vercel.app` = **MAIN / production** (created Feb, "the one with the dashboard").
  - `scoutit.vercel.app` = **sandbox** (newer; this is what `.vercel/project.json` is linked to).
  - Vercel team `team_hWRb9j8WjUJshQqZuBkAOTFz` · main proj `prj_EERckLskNq8vLPLyavEXjYfen4kI` (scoutit),
    `prj_WD59HGBfyxwxx1HtFjBP8lAXfx7y` (scout-it). Supabase `yyixsuaimdzyiocswcgc` (auto-pauses).
- Public side healthy: all routes 200, `/api/cms` → `source: airtable` (5 properties).
- Latest `main` commit at handoff: **`3696547`**.

## 2. What shipped this session (all on `main`, deployed)
1. **CSP fix** — the prior security-headers CSP was blocking Unsplash images, Leaflet (unpkg) CSS+JS,
   YouTube embeds, and Mapbox workers. Widened precisely in `next.config.mjs` (kept the protective
   directives). Site assets/maps work again.
2. **Property page resolves by id OR slug** (`CommercialFlow`, `ResidentialFlow`, `property/[id]/page.js`)
   — dashboard links use id, public links use slug; both now load the real listing.
3. **Slug-on-publish fix** (`lib/airtable.js` `insertProperty` + `dashboard/publish`) — published listings
   now get a unique Slug written to Airtable (they were invisible before) and it's mirrored to Supabase.
4. **Council doc expanded** (`00_COUNCIL.md`) — 5 standing seats + 11 specialist seats + task→seats picker.
5. **Founding Member pre-launch panels** (`components/ecosystem/FoundingProgramPanel.js`) on the
   photographers/researchers/event-planners pages — recruit supply while services are "coming soon".
6. **Tier Distinction spec** (`06_MONETIZATION/TIER_DISTINCTION.md`) — the authoritative "what each tier
   unlocks" + the audit that found the subscription system is a storefront only.
7. **Honest pricing storefront** — dead `/checkout` (404) buy buttons → disabled "Coming Soon" on all 4
   pricing pages; Seeker free tier corrected (unlimited saves; broker contact = paid Solar+).
8. **Entitlements engine** (`lib/entitlements.js`) — single source of truth for tier gating + Connects
   ladder. Wired the property **Vault** to it (`canSee('vault', tier)` — unlocks Cluster+).
9. **Hidden dev tier-switcher** (`components/dev/TierSwitcher.js`, mounted in `layout.js`) — visit any
   page with **`?dev=1`** to flip tier/role and watch gates lock/unlock. `?dev=0` hides it. Public never sees it.

## 3. Decisions locked this session (do not re-litigate)
- **Subscriptions verified non-functional:** checkout was 404, no payments, tier gating not enforced
  (was hardcoded `hasSubscription=false`). Free vs paid saw the same. Now being made real, gating first.
- **Connects wallet model (final):** 3 buckets — **Monthly** (resets to tier amount on the **1st of the
  calendar month**; new signups get tier amount immediately), **Earned** (bounties, never expire),
  **Bought** (packs, never expire). **Spend order: Monthly → Earned → Bought** (perishable first, paid last).
  **Upgrade** = top up the *difference, once per cycle* (anti-toggle-farm guard). **Downgrade/cancel** =
  monthly immediately capped to the new/free tier amount (no clawback of earned/bought). Run-out → buy a pack
  (needs payments). Connects ladder per role/tier is in `lib/entitlements.js` (`CONNECTS_ALLOWANCE`).
- **Handshake:** a Connect = the gesture (initiator pays 1, non-refundable on decline); the handshake =
  the agreement (other party accepts free); only **Active** links are public. Seeker→broker contact opens
  an anonymous proxy channel (the only way to reach a broker — no direct contact info is ever exposed).
  Broker↔owner double-opt-in puts a broker on a property as "owner-verified". (Full rules:
  `06_MONETIZATION/CONNECTS_AND_BROKER_HANDSHAKE.md`.)
- **Free tier:** unlimited private board (on-device Ledger, never gated, no account). Broker contact is Solar+.
- **Tier ladder feeling:** Free=browse → Solar=understand (deep intel) → Cluster=decide without visiting
  (the Vault) → Universe=done-for-you + plug-in (Concierge auto-draft / own-AI via MCP). Concierge AI is
  tier-gated (basic→Solar, deep vector→Cluster, auto-draft→Universe). Badges grant checkout discounts.

## 4. Vulnerabilities found — fix in the LATER security pass (owner: defer, build functional now)
- **DB is wide open** (RLS dev-open) + **tier is client-side** → tiers/Connects are forgeable today.
  The real fix: server-authoritative identity (auth + service role) + entitlement-filtered API responses;
  premium DATA must never leave the server for a free user. (`OPTION3_BACKEND_HARDENING_PLAN.md`,
  `SUPABASE_AUTH_INTEGRATION_PLAN.md`.)
- Bounty Connects farmable (need verification + caps + anti-self-claim). Badge discounts must be
  server-verified. Concierge AI needs rate-limits + entitlement-filtered context + Connect-charging.
- Resident Intel + Affordability layer need legal review (RESA). Scout Rating must stay closures-only.

## 5. NEXT-STEPS QUEUE (resume here — functional now, security later)
1. **Wire the rest of the gates to `lib/entitlements.js`:** deep-intel teaser (`CategorySpecBlock`),
   enhanced photos, and `ResidentialFlow` (only the Commercial Vault is wired so far). Same SSR-safe
   pattern as `CommercialFlow` `SpatialVaultWidget`.
2. **Pricing pages read the viewer's real tier** (show "Current plan" correctly via `getCurrentTier`).
3. **Connects wallet logic module** (`lib/connectsWallet.js`) — pure functions for the buckets + spend
   order + reset + upgrade(diff-once)/downgrade(cap) per §3. (Designed, not yet built.)
4. **Seed a demo property with Vault/deep-intel data** so the tier-switcher visibly unlocks content.
5. Later: payments (PayMongo/Xendit) + the security hardening program.

> Verify each step (build + `?dev=1` walk-through), tell the owner before pushing, keep changes additive.
