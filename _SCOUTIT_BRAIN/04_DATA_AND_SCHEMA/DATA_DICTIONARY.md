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

## 3. UNITS INVENTORY (Embedded — `properties.details.units_inventory`)

Units/spaces inside a building are **not a separate table**. They live as a JSON array on the
property row: `properties.details.units_inventory`. This array also rides the publish chain to
Airtable's `Units_JSON` column and is parsed back on fetch (mirrors the `WhereTo` JSON pattern).

### Per-unit object shape
- **`id`** (String) — client-generated row id (stable within the editor session)
- **`name`** (String) — unit identifier, e.g. "Unit 12-A", "Master Suite"
- **`size`** (String/Number) — area in sqm; rendered publicly as "X sqm"
- **`floor`** (String) — floor label, e.g. "3", "Ground"; rendered publicly as "Floor X"; also drives
  the editor's floor-grouping. *(Added 2026-06-29.)*
- **`features`** (String[]) — tag chips, e.g. ["Aircon ready", "Corner unit"]; rendered as chips on
  the public page. *(Now wired to display — 2026-06-29.)*
- **`photos`** (String[]) — Supabase Storage URLs (`property_photos` bucket). **Tier-gated:** free
  (Starry) = 1 photo/unit, PRO (Solar/Cluster/Universe) = 5/unit.
- **`image`** (String) — convenience mirror of `photos[0]` for legacy readers.
- **`price`** (String, optional) — legacy per-unit price; still rendered if present, not collected by
  the current editor.

### Who reads/writes it
- **Editor (write):** `src/components/dashboard/InventoryGridManager.js` at
  `/dashboard/inventory/[id]` (the dedicated bulk manager). Also `LiveEditorWorkspace.js` wizard.
- **Public (read):** `src/components/property/ResidentialFlow.js` + `CommercialFlow.js` map
  `units_inventory` → unit cards. Real owner units override the synthesized fallback units.
- **Photo resolution on public page:** `photo || image || photos.find(Boolean)` (so any of the
  fields populated by the editor will display).
