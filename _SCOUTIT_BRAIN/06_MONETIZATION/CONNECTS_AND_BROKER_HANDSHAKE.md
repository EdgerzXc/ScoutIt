# ScoutIT — Connects Economy & the Owner–Broker–Property Handshake

> The rules for how brokers attach to properties, how the in-system handshake works, how
> Connects accumulate/spend/expire, and what is built where. Decided with the owner
> (Jerzel) June 2026. **Decided items are not to be reversed without the owner.**
>
> Cross-ref: `SCOUTIT_PRICING_STRATEGY.md` (tiers, allocations, bounties),
> `../04_DATA_AND_SCHEMA/AIRTABLE_IMPLEMENTATION_PLAN.md` (dual-CMS rule),
> `00_START_HERE.md` §6 (price/launch decisions).

---

## 1. Where this data lives (dual-CMS)

- **Airtable (public — what ScoutIT shows):** the live broker↔property relationship and its
  status. Table: **`PROPERTY_BROKERS`** (`tblNGGdhICLnm2WFS`). Only **Active** rows are public
  (rendered on a property's *Your Move → Advisors*).
- **Supabase (private — what a user has/did):** each user's **Connect balance + every
  transaction**, and the handshake *workflow* events. The Airtable `Handshake_Connect_Spent`
  checkbox only mirrors that a charge happened; the ledger itself is Supabase.
- **Make.com:** bridges the two (e.g. handshake accepted → set link Active; Connect charged →
  flip the flag). Not built yet.

> For a launch **test run**, `PROPERTY_BROKERS` in Airtable is the source of truth so the whole
> flow is visible/editable in Mission Control. The balance ledger + automated charging move to
> Supabase/Make in that track.

---

## 2. The owner-first rule (no exclusivity)

- **The property's authority comes from the owner, never from whoever typed it in first.**
- An owner can sell it themselves (0 brokers), use 1 broker, or allow many (open listing).
  There is **no exclusivity flag** — "exclusive" is just the case where the owner attached one.
- A broker who creates a listing is credited as the **Lister** ("Listed by ___", default top
  placement in Advisors) — but that is **credit, not a monopoly**. Other owner-confirmed
  brokers also appear.
- Disputes (e.g. "that broker was never authorized") → **human review**, owner sovereignty as
  the default. `Authority_Source` records the basis (Owner / Owner authority document / Pending).

This structurally kills "soloing the gain": once multiple brokers are confirmed, lead routing
is governed by the owner's authorization + each broker's Scout Rating + tier — never by who
created the record.

---

## 3. The handshake — double opt-in, paid by the initiator

A broker's name on a property is a public representation claim (reputation, Scout Rating,
RA 9646 authority), so **neither side can attach the other unilaterally.**

- **Owner invites broker** → link `Invited by owner` → broker accepts → **Active**.
- **Broker pitches owner** → link `Pitched by broker` → owner accepts → **Active**.
- Same rule both ways: **whoever initiates, the other party confirms.** Public only when Active.

**Cost (seeded in `CONNECT_COSTS`):**
- Owner invites broker = **1 Connect** · Broker pitches owner = **1 Connect** (initiator pays).
- Accepting is **free** (one click).
- **Spent on send, win or lose — no refund on decline.** A decline is a signal; they can try
  again. This forces every relationship — even ones arranged off-platform — to come back
  in-system and spend a Connect to become real. (RA 9646-safe: paying for the platform
  gesture/visibility, not a commission.)

How we identify the broker: the owner picks from the **verified broker directory** (a linked
record to `BROKERS_CMS`), not free text. If the broker isn't on ScoutIT yet, invite-by-email
parks a pending link until they join.

---

## 4. Broker listing slots (the tier cap)

- A broker's tier sets a cap: **Starry 3 · Solar 15 · Cluster 50 · Universe unlimited.**
- **1 property = 1 slot.** Counts every property where the broker is an **Active** advisor —
  whether they self-listed it or the owner added them. Listing it first and the owner later
  claiming it stays **one** count (never doubled).
- Only **Active** rows count. Pending (`Invited`/`Pitched`) and `Declined`/`Locked` rows do
  **not** consume a slot.
- App check: count Active `PROPERTY_BROKERS` rows for the broker vs their tier cap.
  **Needs a manual Airtable step:** add a Rollup/Count field `Active_Listings_Count` on
  `BROKERS_CMS` over the new inverse link, filtered to Status = Active (the API can't create
  rollup fields).

### At-limit behavior
- An owner can still **invite** a broker who's full — the invite goes through as Pending (it
  doesn't fail or burn a slot).
- The broker **sees the pending invite** with a signal: *"You're at X/X — free a slot or
  upgrade to accept."* They drop/archive a property or upgrade, then accept.
- The owner sees: *"Invite sent — this broker is at capacity and will appear once they make
  room."* No silent bumping.

### Over-cap on downgrade → soft-lock (oldest first)
- Downgrading below the current active count does **not** delete links.
- The **oldest** excess links flip to **`Locked (over limit)`**: the broker still shows on
  those properties but the card is **greyed-out / unclickable** (no contact, no leads).
- Upgrading reactivates them (oldest unlocks first). Locked links don't count against the cap.

---

## 5. Connects — accumulation, spend, expiry

**Accumulation (base 1 + tier bonus; monthly, no roll-over):**

| Tier | Seeker | Broker | Owner | Photographer | Researcher |
|---|---|---|---|---|---|
| Starry (free) | 1 | 1 | 1 | 1 | 1 |
| Solar | 6 | 8 | 6 | 5 | 5 |
| Cluster | 15 | 20 | 18 | 12 | 12 |
| Universe | 40 | 50 | 40 | 25 | 25 |

**Spend (`CONNECT_COSTS`, seeded — working values, game mechanics not public peso prices):**
handshake (either direction) = 1 · seeker→broker contact = 1 · owner commissions
photographer/researcher/event-planner = 2 each.

**Expiry rule:** the monthly **granted** Connect resets and does not roll over; **bounty-earned
and bought Connects never expire.** *Granted resets; earned + bought stay.*

**Buy ladder (CONFIRMED + seeded in `CONNECT_PACKS` `tblu9NxS70EnZgzkr`):** 1 = ₱49 ·
5 = ₱199 (~19% off) · 15 = ₱499 (~32%) · 40 = ₱1,199 (~39%). Single Connect is priciest per
unit (₱49) so packs/subscriptions always win; biggest pack ≈ ₱30/Connect. Sits in the PH
₱20–₱100 impulse band (GCash / game-diamond psychology). The buy ledger/transactions stay in
Supabase.

---

## 6. Research benchmarks behind the pricing

- **Upwork Connects** (closest analog): $0.15 each (~₱9), proposals cost 2–16+ Connects scaled
  to job value, 10 free/month free tier, real cost to win $4–$22. Lesson: tokens can **scale
  with opportunity value**.
- **PH affordability:** heavy microtransaction market (33% of PH mobile games monetize via IAP
  vs 21% global); spend rails are GCash / load / game diamonds in a ₱20–₱100 band with
  bundle discounts.
- **Broker economics:** PH commission 3–5% of sale → a closeable lead is worth thousands, so a
  ₱49–₱100 Connect is trivial for brokers; affordability matters most for **seekers**.
- **Open option:** flat action costs (launch) vs Upwork-style value-scaled costs (later — e.g.
  contacting about a ₱50M property costs more than a ₱2M one).

---

## 7. `PROPERTY_BROKERS` schema (live — `tblNGGdhICLnm2WFS`)

| Field | Type | Purpose |
|---|---|---|
| `Link_Label` | singleLineText (primary) | e.g. "Zuellig Tower — Maria Santos" |
| `Property` | link → `PROPERTIES_CMS` | the property |
| `Broker` | link → `BROKERS_CMS` | the broker |
| `Role` | singleSelect | Lister / Co-broker |
| `Status` | singleSelect | Invited by owner / Pitched by broker / Active / Declined / Locked (over limit) |
| `Initiated_By` | singleSelect | Owner / Broker (initiator pays the Connect) |
| `Authority_Source` | singleSelect | Owner / Owner authority document / Pending |
| `Handshake_Connect_Spent` | checkbox | charge occurred (ledger in Supabase) |
| `Date_Invited` | date | handshake sent |
| `Date_Confirmed` | date | became Active; drives oldest-first locking |

---

## 8. Status — what's deployed vs pending

**✅ Deployed in Airtable (this session):**
- `PROPERTY_BROKERS` table + fields (inverse links auto-added to `PROPERTIES_CMS` &
  `BROKERS_CMS`).
- `CONNECT_COSTS` seeded (6 rows).
- `CONNECT_PACKS` table + 4 rows (confirmed prices ₱49/199/499/1,199).
- `L2_CATEGORIES` (6), `REACTION_TAGS` (4), `BOUNTIES` (5) seeded.
- `Subscription Tiers` rebuilt: 12 junk rows removed, 20 clean rows (prices blank), +`Listing_Limit`.
- `FEATURE_GATES`: +`User_Type` field, 40 gate rows across all 5 user types.

**⏳ Pending:**
- Manual: `Active_Listings_Count` rollup on `BROKERS_CMS` (API can't make rollups).
- Supabase: Connect balance/transaction ledger, handshake workflow events; Make.com bridges.
- Optional: broker `Slug` field on `BROKERS_CMS` if profile URLs need a stable slug.
- Still-empty config tables (separate task): `L2_CATEGORIES`, `REACTION_TAGS`, `FEATURE_GATES`
  (+ User_Type), clean `Subscription Tiers`, `BOUNTIES`; choices Event Planner + SPOTLIGHT.
