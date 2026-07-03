# ScoutIT — Tier Distinction (the enforceable "what is what")

> The single source of truth for **what each subscription tier actually unlocks** — the spec the
> code's entitlement gate (`canSee(feature, tier)`) must enforce. Pairs with
> `SCOUTIT_PRICING_STRATEGY.md` (pricing/positioning prose), `CONNECTS_AND_BROKER_HANDSHAKE.md`, and
> `VAULT_LISTING_LIFECYCLE.md` (how the Vault is produced/kept + listing states + Quest IT).
> Decided with the owner 2026-06-25. **Built? flags = current reality, verified, not aspiration.**

---

## Verification snapshot (2026-06-25) — why this doc exists
A live audit found the subscription system is a **storefront with no working back-end**:
- Pricing pages are live with prices (Seeker ₱0/149/499/2,499; Broker/Owner/Creator too). ✅
- The "Upgrade" buttons link to **`/checkout` → 404** (dead). 🔴
- **No payment provider** wired (GCash/PayMongo/Xendit/Stripe). 🔴
- **Tier gating is NOT enforced** — `SpatialVaultWidget` hardcodes `hasSubscription = false`; no
  component reads the user's tier. Free and paid users see the same. 🔴

**Decisions locked 2026-06-25:**
1. **Free private board = unlimited, never gated** (on-device Ledger). The old "Save up to 5" copy is wrong.
2. **Broker contact = paid (Solar+)** via Connects/anonymous proxy. The free tier must NOT promise free contact.
3. **Storefront is "Coming Soon"** (buy button disabled) until checkout + gating + payments are real.

---

## Legend
🔓 unlocked · 🔒 locked · **Built?**: ✅ works today · ⚠️ partial · ⏳ not built (gating it just shows "coming soon")

---

## 0. Tier model — per-role subscriptions, shared ladder, bundles (decided 2026-06-25)

**Tier is PER ROLE, not per account.** One login holds several *separate* memberships — a Seeker
membership, an Owner membership, a Broker membership, etc. — each at its **own** level, each paid
**separately**. Being Solar as a Seeker does **nothing** for your Broker hat; you subscribe again for
each role. Default for any unsubscribed role = its **free Starry** rung.

- **Which tier gates a feature = the feature's home world.** Seeker features (Vault, deep intel,
  enhanced photos) are gated by the viewer's **Seeker** tier; Broker tools by the **Broker** tier; etc.
  The "active hat" only chooses which world/dashboard you're in.
- **Engine impact:** store a tier **per role** (e.g. `{ seeker:"solar", owner:"starry", broker:"cluster" }`)
  instead of one account-wide `subscription_tier`. `canSee(feature, tier)` must receive the
  feature's-world tier. (Today's code stores one tier — this is the foundation refactor before further gating.)

**Shared ladder, role-specific names.** The rank is universal — `Starry < Solar < Cluster < Universe`
(the *machinery*: rank is all the engine cares about). Each rung gets a themed **display nickname** per
role (decoration only; already live on the pricing pages):

| Rank | Seeker | Owner | Broker | Creator (provider) |
|------|--------|-------|--------|--------------------|
| Starry | Starry Wanderer | Starry Holder | Starry Closer | Starry Lens |
| Solar | Solar Seeker | Solar Landlord | Solar Advisor | Solar Shooter |
| Cluster | Cluster Scout | Cluster Developer | Cluster Strategist | Cluster Architect |
| Universe | Universe Principal | Universe Portfolio | Universe Elite | Universe Visual |

**Bundles (planned, payments-era).** A multi-hat user (e.g. Owner who also wants Seeker + Photographer)
can buy a **bundle subscription** at a combined price. Because tier is stored **per role**, a bundle is
just *one checkout that sets several role-tiers at once* — no special machinery. Build with payments.

**Connects** depend on **both** tier **and** active role (e.g. Solar Seeker = 6/mo, Solar Broker = 8/mo;
`CONNECTS_ALLOWANCE`). Per-role tiers imply **per-role Connects wallets** (separate pots per hat).

> **Live-DB check (2026-07-02):** confirmed the per-role foundation refactor has not started —
> `user_profiles.subscription_tier` is still one value per account, and Supabase's
> `connect_balances`/`connect_transactions` have no `role` column (one wallet per `user_id`).
> See `08_OPERATIONS_AND_BACKLOG/E2E_TEST_FIX_LIST.md` #6. Don't add a `role` column to just the
> Connects tables in isolation — it's downstream of the tier-storage refactor above, not a
> standalone fix.

---

## 1. Seekers / Buyers — *what they SEE*

| Capability | Starry ₱0 | Solar ₱149 | Cluster ₱499 | Universe ₱2,499 | Built? |
|---|---|---|---|---|---|
| Browse all listings + editorial intel | 🔓 | 🔓 | 🔓 | 🔓 | ✅ |
| Private board / saves — **unlimited, no account** | 🔓 | 🔓 | 🔓 | 🔓 | ✅ |
| Deep intel (cap rate, yield, noise/quiet level, verdict) | 🔒 | 🔓 | 🔓 | 🔓 | ✅ reveal+gate built 2026-06-25 (both flows + demo data); Starry shows no real values (no leak) — real values demo-only until server pass |
| Enhanced photos | 🔒 | 🔓 | 🔓 | 🔓 | ✅ gate built 2026-06-25 (both flows; locked button → upgrade), pending push |
| Guide Wizard (full) | teaser | 🔓 | 🔓 | 🔓 | ⚠️ |
| **Contact a broker** (anonymous proxy, spends Connects) | 🔒 | 🔓 | 🔓 | 🔓 | ⚠️ |
| Off-market briefings · side-by-side compare | 🔒 | 🔒 | 🔓 | 🔓 | ⏳ |
| **The Vault** (Luma 3D, 360, drone heatmaps) | 🔒 | 🔒 | 🔓 | 🔓 | ⚠️ gate ✅ both flows + demo (`the-paragon-tower`) 2026-06-25; production pipeline ⏳ (see `VAULT_LISTING_LIFECYCLE.md`) |
| **Hidden Intel** — market/investment panel (txn history, cap-rate benchmark, appreciation modelling) | 🔒 | 🔒 | 🔓 | 🔓 | ✅ gate+reveal built 2026-06-25 (`marketIntel`, both flows + demo data) |
| Identity-reveal control · priority matching · bounties | 🔒 | 🔒 | 🔓 | 🔓 | ⏳ |
| Universe-only listings · custom briefings · curator · off-market pipeline | 🔒 | 🔒 | 🔒 | 🔓 | ⏳ |

## 2. Owners — *what they can DO*
Active listings: **1 / 5 / 20 / ∞**. Full edit + Natural/Enhanced toggle, verified badge, hire
photographers+researchers (Connects) = **Solar+**. Hire ALL providers + event planners, full
analytics, crowdsourced-data approval = **Cluster+**. White-glove + CDN media + pre-launch = **Universe**.
*Built?* editor ✅; listing-limit enforcement ⚠️; badges/analytics/hiring ⏳.

## 3. Brokers — *recognition + reach*
Active listings: **3 / 15 / 50 / ∞**. ID card, pitch-to-listing (Connects), enhanced photos = **Solar+**.
Showcase board, AI copy, featured placement, full analytics = **Cluster+**. Top-of-roster + elite buyer
access = **Universe**. **Scout Rating = closures only, NEVER bought by tier** (hard rule).
*Built?* directory ✅; pitch ⚠️; limits/ID card/analytics/placement ⏳.

## 4. Photographers / Researchers / Event Designers (providers)
Portfolio/jobs scale: **5 / 30 / 100 / ∞**. ID card + pitch-to-listing (Connects) = **Solar+**.
Enhanced processing + CDN + featured-on-property = **Cluster+**. Top roster + spotlight = **Universe**.
Researchers earn Connects from bounties at **every tier** (zero-barrier data workforce).
**Status: pre-launch (Founding Member program live).** *Built?* mostly ⏳.

---

## What "making it real" requires (build order)
1. **Entitlement gate** — one `canSee(feature, tier)` helper from this table; replace hardcoded `hasSubscription`.
2. **Mock tier-switcher** (dev-only) — flip Starry↔Universe to test; Playwright-verify each tier matches this doc.
3. **Honest storefront** — "Coming Soon", buy button disabled (done 2026-06-25).
4. **Checkout + payments** (PayMongo/Xendit) — separate track, needed before charging.
5. Wire the ⏳ features themselves (Vault, analytics, ID cards…) — each its own job.

> Rule: a tier may only promise on the live page what this table marks ✅/⚠️ — never sell a pure ⏳.
