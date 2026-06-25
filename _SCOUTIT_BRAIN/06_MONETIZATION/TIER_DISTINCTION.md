# ScoutIT — Tier Distinction (the enforceable "what is what")

> The single source of truth for **what each subscription tier actually unlocks** — the spec the
> code's entitlement gate (`canSee(feature, tier)`) must enforce. Pairs with
> `SCOUTIT_PRICING_STRATEGY.md` (pricing/positioning prose) and `CONNECTS_AND_BROKER_HANDSHAKE.md`.
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

## 1. Seekers / Buyers — *what they SEE*

| Capability | Starry ₱0 | Solar ₱149 | Cluster ₱499 | Universe ₱2,499 | Built? |
|---|---|---|---|---|---|
| Browse all listings + editorial intel | 🔓 | 🔓 | 🔓 | 🔓 | ✅ |
| Private board / saves — **unlimited, no account** | 🔓 | 🔓 | 🔓 | 🔓 | ✅ |
| Deep intel (cap rate, yield, noise/quiet level, verdict) | 🔒 | 🔓 | 🔓 | 🔓 | ⚠️ data exists, gate missing |
| Enhanced photos | 🔒 | 🔓 | 🔓 | 🔓 | ⚠️ field exists, gate missing |
| Guide Wizard (full) | teaser | 🔓 | 🔓 | 🔓 | ⚠️ |
| **Contact a broker** (anonymous proxy, spends Connects) | 🔒 | 🔓 | 🔓 | 🔓 | ⚠️ |
| Off-market briefings · side-by-side compare | 🔒 | 🔒 | 🔓 | 🔓 | ⏳ |
| **The Vault** (Luma 3D, 360, drone heatmaps) | 🔒 | 🔒 | 🔓 | 🔓 | ⏳ |
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
