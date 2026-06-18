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
