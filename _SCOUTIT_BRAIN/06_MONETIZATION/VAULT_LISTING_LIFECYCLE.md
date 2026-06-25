# ScoutIT — The Vault, Listing Lifecycle & Quest IT (the operating model)

> The source of truth for **how the Spatial Vault gets produced, gated, and kept**, and **what
> happens to listings when an owner subscribes, cancels, sells, or deletes.** Pairs with
> `TIER_DISTINCTION.md` (what each tier unlocks) and `CONNECTS_AND_BROKER_HANDSHAKE.md`.
> Decided with the owner 2026-06-25. **Running code wins over this doc — verify before acting.**

---

## 1. The Vault has TWO locks (supply + demand)
The Spatial Vault (Luma 3D map · 360° tour · drone heatmap) is gated on **both** sides:

- **Lock 1 — Owner side (supply):** a property only *gets* a tour produced if the owner subscribes
  to the tier that includes it (or brings their own existing tour). Subscribing is what puts them
  into the production pipeline.
- **Lock 2 — Seeker side (demand):** even once a tour exists, a seeker only *sees* it at the tier
  that unlocks it (**Vault = Cluster+**, per `entitlements.js` `FEATURE_MIN_TIER.vault`).

These are two independent subscriptions (owner-tier vs seeker-tier) — consistent with the per-role
tier model (each role is its own paid relationship; see `TIER_DISTINCTION.md`).

## 2. How a tour gets made — the production pipeline
Most tours are **produced by ScoutIt**, not uploaded by owners. The owner-upload path (paste a
Matterport/Luma/YouTube link, or send a raw video) is the *minority* case.

**Per-property tour status (a state machine):**
`None → Requested → Queued → Scheduled → Filming → Processing (Luma) → Live`

- Owner subscribes (with no tour yet) → property enters the **queue** (an ordered list).
- ScoutIt's crew (or a Quest IT freelancer — see §5) records the walkthrough.
- Footage is run through **Luma AI** → 3D spatial map / 360 tour.
- The finished URL is saved to the field the Vault widget reads → goes **Live**, gated at Cluster+.

> **Bottleneck reality:** the limit is crew capacity, not software. The software is just status
> tracking + a worklist + (eventually) the Luma conversion step.

**Build phasing (cheapest first):**
1. **Display + dual gating** — done 2026-06-25 (demo property `the-paragon-tower` proves it).
2. **Tour-status field + admin paste-the-link** — makes the queue real with almost no code; lets the
   crew fulfill manually long before any AI automation.
3. **Luma auto-conversion pipeline** — the real technical project (API, upload, processing, storage,
   per-conversion cost). Build last, once it's earning.

> ⚠️ **Wiring gap to fix:** owner-submission fields are `Video_URL` / `Virtual_Tour_URL`, but the Vault
> widget reads `matterportTourUrl` / `luma3dMapUrl` / `droneHeatmapUrl`. These ends are not connected
> yet — an owner-pasted link would not appear today. Connect them in phase 2.

## 3. Ownership & churn — ScoutIt owns the produced media
- A tour **ScoutIt produces is ScoutIt's asset**, not the owner's. The owner holds a **license only
  while subscribed**.
- If the owner **cancels:** the tour **keeps showing** to qualifying paid seekers; the owner's
  *privileges* are locked. The owner cannot take or reuse the tour elsewhere.
- This **must be written into the owner agreement/terms at signup** ("ScoutIt produces and owns the
  spatial media; it may remain on and continue to be displayed by the platform after your subscription
  ends; you receive a license only while subscribed"). → belongs in the **later legal-review pass**.
  Do **not** produce real tours until that wording exists.

## 4. Listing lifecycle — archive, never destroy
Mindset: a cancelled owner "just forgot to resubscribe." So nothing is deleted — it's **parked**.

- **Active vs Off-market** switch per property. Owners can self-toggle a listing off.
- **Free (Starry) owner keeps 1 active listing** (Solar 5 / Cluster 20 / Universe ∞ — see
  `TIER_DISTINCTION.md §2`). On cancel/downgrade, listings **beyond the new cap** drop to **off-market**.
- **Off-market = dormant-but-premium, still for sale.** It is **not** "dead." Off-market inventory is
  browsable **only by high-tier seekers (Cluster+)** — already encoded as `FEATURE_MIN_TIER.offMarket`.
  → Churn quietly *feeds* the premium seeker tier instead of creating dead pages.
- **Re-deployable:** off-market listings are locked but fully preserved and instantly relight when the
  owner re-subscribes.
- **Sold:** marked via the **`tenure`** field. Sold → off-market, **switch off data-heavy features**
  (live map, heavy media autoload, geocoding) to save cost; record + tour retained. Renders a
  **lightweight** version.

### Delete = soft-delete (decided 2026-06-25)
- Owner-facing **"Remove listing"** *feels* like delete (instantly gone from public + the owner's
  active list) but **archives, not erases** — record and the ScoutIt-owned tour stay in the database,
  recoverable.
- **True permanent erase** is rare and goes through a **support/legal flow** (e.g., a genuine
  data-removal request) — part of the later legal pass. No public "nuke forever" button.

## 5. Quest IT — the supply engine (FUTURE, separate, big project)
A **separate website** in the ScoutIt ecosystem (not built; do not start now). It lets owners,
ScoutIt's team, or anyone in the ecosystem pick up **immediate capture requests** as paid gigs,
earning **rewards/incentives** for fulfilling them (e.g., going out to record a property).

- Designed to be **general-purpose**: any business website could plug in, read the host's policy, and
  gain a freelancer workforce. (ScoutIt is the first consumer.)
- **Connects bridge:** Quest IT is *where bounties get fulfilled and earned*. It feeds the **"earned"
  Connects bucket** (never-expire rewards) already modelled in `entitlements.js` + the Connects wallet
  (`CONNECTS_AND_BROKER_HANDSHAKE.md`). Design the wallet so earned-from-Quest-IT is ready to plug in.
- Status: **future dependency.** Tracked here so the Connects wallet and bounty surfaces don't paint
  themselves into a corner.

---

## 6. What this adds to the entitlement engine (for the build)
1. **Numeric caps per tier**, not just on/off feature flags — owner/broker/provider **active-listing
   limits** (owner 1/5/20/∞, broker 3/15/50/∞, provider 5/30/100/∞). The engine today only does
   boolean `canSee`; it needs a `limitFor(role, tier, "activeListings")`-style helper.
2. **Per-property `tourStatus`** field (the state machine in §2).
3. **Per-property `listingState`** (active / off-market / archived) + `tenure` sold handling.
4. **Media ownership flag** so a ScoutIt-produced tour is retained through churn/soft-delete.

## 7. Open / deferred
- Owner agreement & terms wording for media ownership + churn + true-delete → **legal pass**.
- Luma API integration (cost, pipeline) → **phase 3**.
- Quest IT site → **separate future project**.
- `Video_URL`/`Virtual_Tour_URL` ↔ Vault field wiring → **phase 2**.
