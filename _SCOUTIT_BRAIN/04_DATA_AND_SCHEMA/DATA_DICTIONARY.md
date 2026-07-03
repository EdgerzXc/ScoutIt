# ScoutIt Data Dictionary & Schema Map

ScoutIt uses a **Dual-CMS approach**. To prevent crashes, AI agents must strictly adhere to this schema when modifying database queries or frontend data rendering.

---

## 1. AIRTABLE (The Public Read-Only CMS)
All properties, articles, and brokers shown to the public are pulled from Airtable via `src/app/api/cms/route.js`.

### Table: `PROPERTIES_CMS`
This is the master list of properties.
- **`Slug`** (String) - Unique URL identifier (e.g., `zuellig-building-makati`)
- **`Title`** (String) - Display name
- **`City`** & **`Location`** (String) - Human-readable address
- **`Latitude`** & **`Longitude`** (Number) - Optional. If empty, `route.js` will auto-geocode the `Location` string using Mapbox.
- **`SpaceCategory`** (String) - High-level category (e.g., "Commercial", "Residential")
- **`Beds`**, **`Baths`**, **`FloorSqm`**, **`LotSqm`**, **`Parking`** (Numbers) - Numeric stats
- **`Photos`** (String) - Comma-separated image URLs
- **`BestFor`** (Multi-select) - Array of strings for tags
- **`Approved_For_ScoutIt`** (Checkbox) - MUST be true for the API to fetch it.

### Table: `BROKERS_CMS`
- **`BrokerID`** (String) - Primary key
- **`Name`**, **`Title`**, **`Bio`**, **`Image`** (String)
- **`SubscriptionLabel`** (String) - E.g., "Platinum", "Gold"
- **`Approved_For_Live_Site`** (Checkbox) - MUST be true

### Table: `INTEL_CMS`
- **`Slug`**, **`Title`**, **`Excerpt`**, **`Lead`**, **`Image`** (String)
- **`BodyParagraph1`**, **`BodyParagraph2`** (String)
- **`Approved_For_Live_Site`** (Checkbox) - MUST be true

---

## 2. SUPABASE (The Private Dashboard & Auth DB)
Supabase handles user logins, saving properties to a wishlist, and capturing new property submissions from the Owner Dashboard wizard.

### Table: `users` (Managed by Supabase Auth)
- Handled via `supabase.auth.getUser()`

### Table: `profiles`
- **`id`** (UUID) - Primary Key, references `auth.users`
- **`email`** (String)
- **`full_name`** (String)
- **`role`** (String) - "buyer" or "owner"

### Table: `user_reactions`
Tracks what a user has shortlisted.
- **`id`** (UUID)
- **`user_id`** (UUID) - References `profiles.id`
- **`item_id`** (String) - The `Slug` of the Airtable property
- **`reaction_type`** (String) - "shortlist", "save", etc.

### Table: `property_submissions` (Owner Wizard Dump)
When an Owner uses `GuidedWizard.js`, the data goes here to await admin approval before being manually copied to Airtable.
- **`id`** (UUID)
- **`owner_id`** (UUID) - References `profiles.id`
- **`property_title`** (String)
- **`location_text`** (String)
- **`latitude`** & **`longitude`** (Numeric) - Dropped by the Mapbox pin picker
- **`property_type`** (String)
- **`status`** (String) - "pending" or "approved"

> ⚠️ **Correction (2026-06-29):** The sections above are legacy. The LIVE owner-data table is
> **`properties`** (NOT `property_submissions`), profiles live in **`user_profiles`**, and saved
> items live in **`saved_intel`**. Do not reintroduce `property_submissions`. See
> `04_DATA_AND_SCHEMA/SUPABASE_LIVE_SCHEMA.md` for the authoritative live schema.

---

## 3. UNITS INVENTORY (`property_units` table — Supabase, real rows since 2026-07-03)

> ⚠️ **Superseded (2026-07-03):** units used to live only as a JSON array on
> `properties.details.units_inventory`. As of the Unit Delegation build
> (`SCOUTIT_MASTER_BUILD_SPEC.md §9`), the owner's editor
> (`InventoryGridManager.js`) and both public flows read/write the real
> **`property_units`** Supabase table via `/api/dashboard/units`
> (upsert-by-diff CRUD). The JSON blob is no longer written by the current
> code — see §3.1 for how it still reaches the public side.

### Table: `property_units` (Supabase)
- **`id`** (uuid, PK) — the *real*, stable unit id. Client-side temp ids from the editor
  (`newId()`, a base36 string) get replaced with this real id on first save.
- **`property_id`** (uuid, FK → `properties.id`)
- **`name`** (text) — unit identifier, e.g. "Unit 12-A", "Master Suite"
- **`size_sqm`** (numeric)
- **`floor`** (text) — also drives the editor's floor-grouping
- **`features`** (text[]) — tag chips, e.g. `["Aircon ready", "Corner unit"]`
- **`photos`** (text[]) — Supabase Storage URLs. **Tier-gated:** free (Starry) = 1 photo/unit,
  PRO (Solar/Cluster/Universe) = 5/unit.
- **`image`** (text) — convenience mirror of `photos[0]`
- **`price`** (text) — legacy per-unit price, still carried but not currently surfaced in the grid UI
- **`sort_order`** (int4) — manual display order (owner-controlled)
- **`operator_id`** (text, nullable) — **NEW, §9.2.** The Supabase Auth user id of the co-working
  operator this unit is delegated to. `NULL` = the building owner controls it (the default). No
  FK constraint, matching every other user-id column in this DB (`deals.buyer_id`,
  `connect_balances.user_id`, etc. — none FK to `auth.users` here).
- **`availability_status`** (text, nullable) — **NEW, §9.2.** App-enforced values only:
  `available` / `occupied` / `coming_soon`. Editable by the delegated operator, not the owner
  (mirrors `CM_Availability_Status`'s existing free/public precedent — see
  `FIELD_VISIBILITY_MAP.md`).
- **`airtable_record_id`** (text, nullable) — legacy link to the separate `UNITS` Airtable table
  (see §3.2) — not populated by the current write path.

### Who reads/writes `property_units`
- **Owner editor (read/write):** `/api/dashboard/units` (GET/POST), called from
  `src/app/dashboard/inventory/[id]/page.js` → `InventoryGridManager.js`. Delegated units
  (`operator_id` set) are pinned — this route never edits or deletes them, even if the client
  omits/mutates them in its payload.
- **Owner delegation action (write, `operator_id` only):** `/api/dashboard/units/delegate` — the
  only path that can set/clear `operator_id`, triggered by accepting an operator's handshake
  request (see §9.2 delegation model in the build spec).
- **Operator editor (restricted read/write):** `/api/dashboard/operator/units` — an operator can
  only touch units where `operator_id` = their own user id, and only `name`/`photos`/`image`/
  `availability_status` — never `size_sqm`/`floor`/`features`. Rendered via
  `OperatorMode.js` → `InventoryGridManager.js` in its restricted `mode="operator"`.

### §3.1 How units still reach the public side (Airtable `Units_JSON`)
Every write to `property_units` (via either route above) triggers
`syncPropertyUnitsToAirtable()` (`src/lib/unitsSync.js`) if the property is
`pipeline_status = 'approved'` — it re-serializes the property's current `property_units` rows
into Airtable's `Units_JSON` column (same field, same JSON-array-of-objects shape as before), now
including two new keys per unit: **`id`** (the real `property_units.id`, so the Unit Master Page
can look a specific unit up) and **`operator_id`**/**`operator_display_name`** (so the public page
knows who "Your Move" should route to). `ResidentialFlow.js`/`CommercialFlow.js` parse this
exactly as before (`JSON.parse(f.Units_JSON)` → `property.units_inventory`); the two new keys just
ride along.

### §3.2 The separate `UNITS` Airtable table (linked records) — not the write path
A prior session (2026-07-02) also created a first-class linked-record `UNITS` table in Airtable
(`tblfvXBgDzY1l9OpJ`) intended to eventually replace `Units_JSON` entirely ("Mission Control reads/
writes here going forward" per its own field description). **The current build did not migrate to
this table** — it stays an unwired, parallel structure. `Units_JSON` remains the live public read
path. If/when Mission Control work resumes, reconciling these two unit representations is a real,
still-open decision — don't assume `UNITS` is authoritative just because its description says so.

### Unit object shape as consumed by the public page (`property.units_inventory[i]`)
- `id`, `name`, `size`, `floor`, `price`, `features[]`, `photos[]`, `image`
- `operator_id`, `operator_display_name` (new, §9.2 — `null` when not delegated)
- Photo resolution: `photo || image || photos.find(Boolean)`

### §3.3 `deals.unit_id` (new column, Supabase)
`deals` (the existing Connects-handshake ledger — buyer→owner inquiries, owner→broker invites)
gained a nullable `unit_id uuid references property_units(id)`. `NULL` = an ordinary
property-level deal (unchanged). Set = either an operator's delegation ask (buyer_id = the
operator, initially `unit_id IS NULL` until the owner picks units) or a seeker's per-unit "Your
Move" contact (buyer_id = the seeker, `unit_id` set immediately). One deal row = one unit — an
owner delegating 3 units in one accept action produces 1 updated deal row + 2 cloned sibling rows,
not one deal covering all 3 (see the build spec §9.2 for why).
