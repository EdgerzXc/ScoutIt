# ScoutIT — Per-User Experience Spec (the "unique & fulfilling" build)

> Council-driven (see `00_COUNCIL.md`). Every user type gets a *distinct, fulfilling* experience —
> not a generic dashboard. "Fulfilling" = a real emotional/identity payoff: progress, recognition,
> control, discovery, or earning. Mobile-first throughout. Grounded in the live backend
> (Airtable base `appWFRqR0wy6hSR6h`, Supabase `yyixsuaimdzyiocswcgc`) and existing dashboard modes.
>
> Loop cap: 2 rounds per persona, Founder breaks ties. This doc is the converged result — execute, don't re-litigate.

## The fulfillment levers ScoutIT can pull
Progress (completeness, scores) · Recognition (badges, ID cards, credited bylines, the Board leaderboard) ·
Control (on-device privacy, owner roster sovereignty) · Discovery delight (editorial intel) ·
Earning (Connects, bounties). Each persona below leans on a different lever — that's what makes them feel distinct.

---

## 1. Seeker / Buyer — *"I'm an insider, on my own terms"*
**File:** `components/dashboard/BuyerMode.js` (+ `app/wishlist`, `ReactionButtons`)
**Lever:** discovery + control.
**Human truth:** wants to find a space that *feels* right, explore privately, and never be hounded.
**Fulfilling moment:** building a private **board** of spaces that move them (the 4 feeling-tags: Potential Fit / Interested / Inspired Me / Save) + reading editorial briefings that make them feel like they *understand* a place.
**Differentiator:** no account needed; Ledger lives on-device (privacy promise); editorial property intelligence vs spec sheets; broker contact is anonymous-proxy (Solar+) — interest never means harassment.
**Build:**
- Make the saved board the hero — read `scoutit_reactions`, group by the 4 tags, deep-link to each property.
- "Your taste" insight: infer patterns from saved tags (areas/categories they lean to).
- Deep intel unlock (Solar+) + comparative space analysis (Cluster) surfaced as aspirational locks (`FEATURE_GATES` Seeker).
- Real market-intel feed from `INTEL_CMS`; identity-reveal control when contacting a broker (`CONNECT_COSTS`: contact = 1).

## 2. Property Owner — *"This is my asset, and I'm in command"*
**File:** `components/dashboard/OwnerMode.js`, `GuidedWizard.js`
**Lever:** control + progress.
**Human truth:** wants their space presented well and to stay in control of who represents it and what's shown.
**Fulfilling moment:** a category-intelligent listing that looks pro in minutes, a rising completeness/verified badge, and **sovereign control** of their advisor roster.
**Differentiator:** category-aware listing intelligence; AI-drafted from a PDF; honest owner-verified price (Your Move only); owner controls broker handshakes; hires a vetted ecosystem.
**Build:** (full list in chat / owner spec) category-branched wizard → real `PROPERTIES_CMS` fields; price `Price_Status`/`Price_Verified_By`; **Advisors panel** (invite/confirm/decline brokers via `PROPERTY_BROKERS` + Connect); **Services panel** (hire photographer/researcher/event-planner, `CONNECT_COSTS`); tier + listing-limit + Connect balance header; verified-asset badge + completeness coaching; community-data approval (`bounty_claims.owner_approved`, Cluster+).

## 3. Broker / Advisor — *"My reputation is earned, and it compounds"*
**File:** `components/dashboard/BrokerMode.js`
**Lever:** recognition + progress.
**Human truth:** wants verified credibility and a steady book without paying for dead leads.
**Fulfilling moment:** **Scout Rating climbing from real closures** (never bought), a downloadable ID-card credential, winning a listing with a confident pitch, and Board presence.
**Differentiator:** rating from verified closures only — tier buys visibility, not trust; Connect-gated pitching kills spam; owner-sovereign handshake; on-site ID card.
**Build:**
- Pipeline from `PROPERTY_BROKERS` (Pitched / Active / Locked); pitch an owner = spend 1 Connect (`connect_transactions`).
- Scout Rating + closures from `broker_profiles`; **Active_Listings_Count vs tier `Listing_Limit`** with an upgrade nudge at cap; locked-listing state when over cap.
- Generate the **ID card** (pdf skill) — name, tier, verified, QR to profile, expiry.
- Target feed: owner listings open to advisors, ranked.

## 4. Photographer — *"My eye is the product, and it's seen"*
**File:** `components/dashboard/ProviderMode.js` (type = photographer)
**Lever:** recognition + earning.
**Human truth:** wants the work seen and a pipeline of paid shoots.
**Fulfilling moment:** a portfolio shown off in the dark/gold gallery, getting commissioned, the verified badge + ID card to flash on-site, being **featured on a property page**.
**Differentiator:** commissions tied to real properties/owners; on-site ID credential; Natural/Enhanced delivery; photo bounties to earn Connects even on free.
**Build:** portfolio manager (`SERVICE_PROVIDERS.Portfolio`, + new `Bio`/`Service_Area`/`Rating`/`Reviews_Count`); inbound commissions + pitch-to-listing (Connect); enhanced-processing + CDN gating (`FEATURE_GATES` Photographer); ID card; geo-tagged photo bounties (`bounty_claims`).

## 5. Researcher — *"I'm the trusted source, and I get paid to know"*
**File:** `components/dashboard/ProviderMode.js` (type = researcher)
**Lever:** earning + recognition.
**Human truth:** wants credibility and income from fieldwork with zero barrier to entry.
**Fulfilling moment:** **earning Connects from bounties** (unlimited even on Starry), a credited byline on Intel articles, a rising credibility score — becoming the area's data authority.
**Differentiator:** zero-barrier earning (the data workforce no competitor has); credited intel; deep-intel read access (Cluster+); anonymous-byline option.
**Build:** **Bounty board** — `BOUNTIES` defs → claim → submit geo-tagged proof → `bounty_claims` → payout to `connect_transactions` (earn, never expires); Connects-earned tracker; credited submissions (`INTEL_CMS.Credited_Researcher`); credibility from `researcher_profiles`; anonymous byline (`privacy_settings.anonymous_byline`).

## 6. Event Planner — *"I'm matched to the rooms that need me"*
**File:** `components/dashboard/ProviderMode.js` (type = event planner)
**Lever:** discovery + recognition.
**Human truth:** wants client discovery and to be matched to the right venues/restaurants.
**Fulfilling moment:** being discovered by Venue/Restaurant owners, designing the space, an events portfolio.
**Differentiator:** category-matched to Venues + Restaurants specifically; commissioned via Connects; Event Design service tag.
**Build:** provider machinery as above, matched to Venues/Restaurants; **add the `Event Planner` choice to Subscription Tiers `User_Type`** (pending) so they're a real tier-holder; `CONNECT_COSTS` commission = 2.

---

## Cross-cutting (makes the whole thing cohere)
- **Multi-role identity:** one person can be Owner + Broker + Seeker. Dashboard already routes by `tags`/`primaryMode`; each role has its own `subscriptions` row (`unique(user_id,user_type)`) and the modes switch cleanly. Keep the switcher frictionless.
- **Shared wallet header:** Connect balance + tier visible across every mode (`connect_balances`, `subscriptions`, Airtable `Subscription Tiers`).
- **Onboarding routes to the right first experience** by role, and to the matching empty-state.
- **Privacy controls per role** (`privacy_settings`): anonymous browsing (seeker), anonymous byline (researcher).
- **Mobile-first** every mode (single column, ≥44px targets, sticky primary action).
- **Provider split:** `ProviderMode` currently shared — branch its copy/metrics/feeds by `providerType` (photographer/researcher/event-planner) so each feels purpose-built, not generic.

## Backend readiness (what's already there vs needed)
- **Ready:** all Airtable config (tiers, gates, connect costs/packs, bounties, categories, reaction tags), `PROPERTY_BROKERS`, the Supabase user layer (`subscriptions`, `connect_balances`, `connect_transactions`, `bounty_claims`, profiles).
- **Needed to make it move:** Edge Functions (Connect grant/spend/earn, handshake charge, bounty payout, Airtable↔Supabase sync); the `Active_Listings_Count` rollup (manual); `Event Planner` + `SPOTLIGHT` select choices; payments + email (deferred).
