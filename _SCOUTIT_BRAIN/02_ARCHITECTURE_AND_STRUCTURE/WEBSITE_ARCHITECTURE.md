# ScoutIt Website Architecture & Data Flow

This is the comprehensive architectural overview of ScoutIt, encompassing the Dual-CMS strategy, database schemas, feature gating, and monetization flows.

## 1. The Dual-CMS Golden Rule
ScoutIt operates on a powerful dual-CMS architecture, heavily separating the fast, public-facing reading layer from the heavy, secure private writing layer.

### A. SUPABASE = Private User Data, Drafts, & File Storage
* **Role:** The secure intake and state engine.
* **Usage:** Authentication, user dashboards, property draft building, the Connects wallet engine, saved intel (Ledgers), and high-res photo hosting.
* **Storage:** Supabase Storage (`property_photos` bucket) holds massive, multi-megabyte `.jpg` and `.png` files. We rely on Supabase because cloud storage is significantly cheaper and more robust than Airtable for massive file repositories.
* **Key Tables:** `properties` (drafts/pending), `user_profiles`, `saved_intel`, `connect_balances`.

### B. AIRTABLE = Public Read-Only Content & Directory
* **Role:** The lightning-fast public directory engine.
* **Usage:** All live properties (`PROPERTIES_CMS`), articles (`INTEL_CMS`), and broker profiles (`BROKERS_CMS`).
* **Integration:** When a property is verified and published by an admin (or pipeline status changes to approved), the **text data** (title, price, location) and the **URLs** of the Supabase photos are pushed to Airtable via the `src/app/api/dashboard/publish/route.js` endpoint. Airtable stays lightweight because it only holds the URLs, not the actual file blobs.

---

## 2. Monetization & Content Limits (Freemium Model)
To organically drive upgrades to the `PRO` tiers (Solar, Cluster, Universe), ScoutIt strictly limits photo uploads and feature access based on the subscription tier, pushing heavy users to upgrade to unlock their full media kits.

### Free Tier Restrictions (Starry):
* **Main Property Photos:** Strictly capped at **7 photos maximum**.
* **External Media Folder:** Locked 🔒. Free users cannot link out to external data rooms (Google Drive) to bypass the photo limits.
* **Unit Photos (Deep Intelligence):** Strictly **1 photo per unit**. The broker must make a hard choice between showing a floor plan or an interior photo.

### ScoutIt PRO Tiers (Solar, Cluster, Universe):
* **Main Property Photos:** Up to **15-20 photos**.
* **External Media Folder:** Unlocked 🔓. Brokers can paste a Google Drive folder link to their "Data Room" or full media kit.
* **Unit Photos (Deep Intelligence):** Up to **5 photos per unit**, easily accommodating floor plans + multiple interior angles per unit.
* **VIP Spatial Vault:** Gated at Cluster+. Unlocks Luma 3D maps, Matterport 360 tours, and drone heatmaps.

---

## 3. The "No URL" Policy for Primary Photos
For the main property photos, ScoutIt **strictly prohibits pasting external URLs** (e.g., Google Drive links, Dropbox).
* **Why?** Services like Google Drive aggressively block third-party websites from embedding images (to prevent hotlinking and bandwidth theft). Paste links inevitably break, destroying the luxury aesthetic of the directory.
* **The Solution:** We force 100% direct file uploads for the main slots via drag-and-drop. The files securely upload directly to Supabase (`property_photos` bucket), guaranteeing the listing never suffers from a broken image link.

---

## 4. Feature Gating & Entitlements
Entitlements are handled via a robust gating system defined in `src/lib/entitlements.js`. 
* **Deep Intel:** Solar+
* **Vault:** Cluster+ (3D Maps, AR tours)
* **Market Intel:** Cluster+
* **Implementation:** Client-side gating uses an SSR-safe pattern: `useState(false)` initialized inside a `useEffect` evaluating `canSee("featureName", getCurrentTier())`. Paid/Tiered fields are blurred out with an "Unlock with Verified Scout →" CTA when viewed by free users.

---

## 5. State & Components Hierarchy
* **Context:** `DashboardContext.js` manages User Authentication and Dashboard UI state (BuyerMode vs OwnerMode).
* **CMS Proxy:** `src/app/api/cms/route.js` is the central proxy for all Airtable fetching. It prevents client-side exposure of Airtable API keys and handles Mapbox geocoding + Haversine radius search filters on the backend.
* **Property Architecture:** The `/property` pages use a modular 10-chapter registry system (e.g., The Space, Location, Life Here) dynamically reframed per property category (Residential, Commercial, STR, etc.).

---

## 6. Design DNA
* **Visual Identity:** 95% deep black (`#0d0d0d` / `#121212`) and 5% gold.
* **Variables:** CSS variables are strictly used over raw hex values: `--accent` (`#E8AE3C`), `--accent-bright` (`#F7C64E`), `--accent-muted` (`#6E531A`).
* **Animations:** Glassmorphism and localized glows are paired with performance considerations (`Lite Mode` disables WebGL/animations for low-end devices).

---

## 7. Units / Inventory Manager (updated 2026-06-29)
A building's individual units/spaces live as an **embedded JSON array** on the property row:
`properties.details.units_inventory` (no separate units table). They ride the publish chain to
Airtable's `Units_JSON` column and parse back on fetch. Full per-unit schema lives in
`04_DATA_AND_SCHEMA/DATA_DICTIONARY.md → §3 Units Inventory`.

### A. Owner editor — `InventoryGridManager.js` (`/dashboard/inventory/[id]`)
Purpose-built for **high-volume buildings** (e.g. a commercial floor with 25 units). Features:
* **Floor field + auto floor-grouping** — units collapse into per-floor sections with live counts and
  an "Add here" button per floor.
* **Bulk add** — create N blank units at once, optionally pre-assigned to a floor.
* **Search** — filter by unit name, floor, or feature.
* **Duplicate unit** — clone name/size/floor/features (photos don't carry over) for repetitive spaces.
* **Live summary** — "X units · Y floors" header.
* **Tier-gated photos** — free (Starry) = 1 photo/unit, PRO = 5/unit (`maxPhotos = isPro ? 5 : 1`).

### B. Save model (page: `dashboard/inventory/[id]/page.js`)
* **Auto-save** on edit (debounced ~1s) **and** a manual **Save Changes** button share one `persist()`
  path. Typing only updates local state (never saves mid-keystroke); blur / structural changes commit.
* The **Save button is a state machine**: idle → *Saving…* (spinner) → *Saved* ✓ (green) → idle, with a
  red *Retry Save* on failure. `updateListing()` now returns a real `true/false` so the button reflects
  the actual server result (no more false "saved").

### C. Public render — `ResidentialFlow.js` + `CommercialFlow.js`
Real `units_inventory` overrides the synthesized fallback units. Each flow renders per unit:
name, **size**, **floor**, **features** (chips), price (legacy), and a photo resolved as
`photo || image || photos.find(Boolean)`. *(Features + floor + the photos[]/image resolution were
wired on 2026-06-29 — previously the public page silently ignored owner-entered features and read a
`u.photo` field the editor never wrote.)*

### D. ⚠️ Server gotcha — no DOM sanitizers in API routes
`isomorphic-dompurify` must **never** be imported in a server API route. It loads `jsdom`, which under
Next 16 + Turbopack serverless throws `ERR_REQUIRE_ESM` at module load and **500s the whole route**.
This silently broke unit saves (`/api/dashboard/update`) — edits looked saved (optimistic UI) then
reverted on refresh. Fixed 2026-06-29: `src/lib/sanitize.js` is now dependency-free (regex
HTML-stripping, exports `stripAllTags` / `sanitizeObject`); routes `update`, `bulk-insert`, and
`waitlist` use it. Diagnose "saves don't persist" by checking the route's real HTTP status, not the UI.
