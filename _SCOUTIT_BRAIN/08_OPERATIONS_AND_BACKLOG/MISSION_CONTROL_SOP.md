# ScoutIT — Mission Control: Schematic + Operating SOP (founder side)

> The founder cockpit. One Airtable Interface ("ScoutIt Mission Control",
> `pbdyvI1PCjfhxUH5V`) over base `appWFRqR0wy6hSR6h`. This is how *we* run the platform.
> **Not final — a working baseline; adjust pages/steps as we learn.** Open it via Airtable →
> **Interfaces** tab → ScoutIt Mission Control (the Data tab shows raw tables, not this).

---

## 1. Schematic — the 6 zones (24 pages grouped by job)

```
                         ┌─────────────────────────────┐
                         │  A. PULSE                    │
                         │  • Overview (KPIs: live      │
                         │    properties, inquiries,    │
                         │    brokers, providers,       │
                         │    bounty tasks)             │
                         └─────────────────────────────┘
                                       │
   SUPPLY IN ───────────────► B. THE GATE ──────────────► PUBLIC SITE
   owner wizard / concierge   • Approval Queue — Properties   (api/cms serves
   PDF → Supabase (pending)   • Cat · Residential/Commercial/  only Approved_* = true)
   → sync → PROPERTIES_CMS      STR/Hospitality/Restaurants/
     (unapproved)               Venues  (per-category review)
                                       │
        ┌──────────────────────┬───────┴────────┬───────────────────────┐
        ▼                      ▼                ▼                       ▼
  C. CONTENT            D. ECOSYSTEM       E. MONETIZATION         F. L5 CONFIG
  • L1 The Board        • L4 Brokers       • Tiers (20 rows)       • Reaction Tags
  • L2 Categories       • L4 Service Prov. • Feature Gates (40)
  • L3 Collections      • L4 Property–     • Connect Costs
  • L3 Intel Articles     Brokers (handshake)• Connect Packs
  • L6 About                              • Bounties
```

**The spine:** everything points at `PROPERTIES_CMS`. **The gate:** nothing is public until its
approval checkbox is ticked (`Approved_For_ScoutIt` for properties; `Approved_For_Live_Site` for
brokers/providers/intel; `Published` for board/collections/about).

---

## 2. SOP — daily / weekly operating ritual

### A. Daily glance — **Overview**
Check the KPIs (live properties, pending count, inquiries, brokers, providers, open bounties).
The pending-approval count tells you what needs work today.

### B. The core ritual — **approving a property** (The Gate)
This is the most important job. For each record in **Approval Queue — Properties**:
1. Open the record → also open its **category page** (Cat · …) to see the category-specific fields.
2. **Verify against the rules** (see §3):
   - Honest blanks — no `0`/`N/A`/guesses; empty is fine.
   - Required-to-publish present: Title, City/Location, Space_Category, ≥1 photo.
   - **Price compliance:** a price shows only if `Price_Status = Published` AND `Price_Verified_By ∈
     {Owner, Property Manager, Broker}`. If unverified → leave it "On Request," don't publish a price.
   - Legally-adjacent fields (STR legality, F&B/fire permits) carry `[UNVERIFIED]` until a human asserts.
3. Set `Pipeline_Status` (e.g., Ready for Market) → tick **`Approved_For_ScoutIt`**. It goes live.
4. **Reject/hold:** leave unapproved, note what's missing in `AI_Draft_Notes` (the owner/concierge fixes it).

### C. Ecosystem approvals — **L4 Brokers / Service Providers**
- Brokers: check PRC license + closures; Scout Rating is earned by closures only (never tier).
  Tick `Approved_For_Live_Site`.
- Service Providers (photographer/researcher/event planner): check `Verified`, portfolio → approve.
- **Property–Brokers**: this is the handshake table — watch Status (Invited/Pitched/Active/Locked);
  it's mostly app-driven, but you can audit relationships here.

### D. Content curation
- **L1 The Board** — set the weekly champion / ranking (manual pin so it doesn't flicker).
- **L3 Collections / Intel Articles** — publish curated collections + editorial; tick `Published`/`Approved`.
- **L6 About** — edit manifesto copy without touching code.
- **L2 Categories** — rename/reorder the 6 tabs; toggle `Is_Active`.

### E. Monetization config (edit rarely, deliberately)
- **Tiers** (20 rows) — names/connects/limits per user-type × Cosmic tier. **Prices stay blank until
  confirmed** (launch rule: confirmed numbers or none).
- **Feature Gates** (40) — what unlocks at each tier, per audience (User_Type).
- **Connect Costs** — what each cross-user action costs.
- **Connect Packs** — buyable bundles (confirmed prices ₱49/199/499/1,199).
- **Bounties** — quest task-type definitions + payouts.

---

## 3. The golden rules (never break — protects the live site)
1. **Approval gate is sacred:** public = approval checkbox true. Review before ticking.
2. **Additive only** in the base — the app reads fields by name; don't rename/delete live fields.
3. **Dual-CMS:** Airtable = public content; Supabase = private user state. Never mix.
4. **Price only in "Your Move," owner-verified.** Never publish an unverified price.
5. **Honest blanks** — wrong data is worse than no data.

---

## 4. Status & adjust-later notes
- All 24 pages exist and are published. **This SOP/schematic is a baseline — adjust freely.**
- Cleanup later: the Subscription Tiers table still has old empty styling columns (Visual
  Treatment / Border Style / Glow Color / Priority / linked-record placeholders) — harmless; hide or delete.
- Not yet wired: the Supabase→Airtable **sync** that auto-ports approved owner submissions (today
  that hop is manual / via the concierge). That's the Edge-Function track.
- Future page worth adding: an **Error/Reports** view (the app now logs to Supabase `error_reports`)
  + a **QuestIT** board once built.
