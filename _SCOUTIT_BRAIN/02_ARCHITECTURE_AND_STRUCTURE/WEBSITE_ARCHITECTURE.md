---
section: "02_ARCHITECTURE_AND_STRUCTURE"
status: active
tags: [architecture, dual-cms, monetization, feature-gating]
updated: 2026-08-18
related: ["[[02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE|STRUCTURE]]", "[[DATA_DICTIONARY]]", "[[SCOUTIT_PRICING_STRATEGY]]", "[[PROPERTY_ARCHITECTURE]]"]
---

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
* **Context:** `DashboardContext.js` manages User Authentication and Dashboard UI state.
  * **OwnerMode:** Used for individual property owners or single-listing agents.
  * **MissionControlMode (Enterprise):** Used for large developers managing masterplans, multiple properties, unit inventory, and team roles via `ProjectManagementPanel`, `InventoryGridManager`, and `TeamManagementPanel`.
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
[[DATA_DICTIONARY]] → §3 Units Inventory.

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

---

## 8. Showcase Architecture — "The Board" (updated 2026-08-18)

The Showcase (`/showcase`) is ScoutIt's premier editorial surface — a **curated, luxury
leaderboard** that ranks the top properties by earned demand, inquiry velocity, and spatial
intelligence merit. It is NOT a data table or a directory; it is a **cinematic spatial exhibition**.

### A. Responsive Layout
* **Desktop (>1024px):** 3-column fixed grid (`310px minmax(0, 1fr) 310px`) in a full-viewport
  (`100dvh`) non-scrolling container. Left HUD = Inquiry Velocity & Key Numbers. Center = 16:9
  verified media (photos/4K reel). Right HUD = Showcase Distinction & Merits.
* **Tablet (769px–1024px):** 2-column grid, center media on top, HUD panels below.
* **Mobile (≤768px):** 1-column natural scroll with compact 3-row header, full-width swipeable
  category rail, `min-height: 200px` 16:9 media glass card, HUD panels stacked below, and
  bottom Leaderboard Tray with clearance above the fixed `.bottom-nav`.

### B. Cosmic Periphery Backgrounds (per rank tier)
Each ranking tier wraps the center stage with a distinct atmospheric periphery rendered via
`<canvas>` particle systems:
* **Universe (Rank #1):** Deep-space nebula with glowing orbit rings, radial gold stardust.
* **Cluster (Rank #2):** Galactic cluster gas clouds, drifting cosmic dust filaments.
* **Solar (Rank #3):** Planetary orbital system with orbiting celestial bodies.
* **Starry (Rank #4+):** Van Gogh-inspired beach horizon with starry night sky and gentle
  midnight sea reflections.

### C. Showcase Distinction & Merits (right HUD)
The right HUD displays **curated accolades, not raw specifications**:
* 🏆 **Demand Standing** — `Ranked #N in {category} · Top Tier Space across Metro Manila`
* ⚡ **Inquiry Momentum** — `{count} Inquiries / Month · High organic market traction`
* 💎 **Curation Standard** — `100% Earned Demand Integrity · Verified spatial vault intelligence`
* 🎯 **Primary CTA:** Gold gradient `Explore Full Briefing →` button linking to `/property/[slug]`

> **Invariant:** raw technical data tables (Space Type, District, Broker directories) must NEVER
> appear in the Showcase. Those live on the Property Page. See [[00_SOP]] §2.

### D. Monthly Curation SOP
Operators calibrate property merits monthly per [[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|MASTER ACTION PLAN]] §16:
fast connect reply speed, heatmap location proximity, architectural accolades, earned demand
standing, inquiry momentum signals. This cannot be fully automated — it is editorial judgment.

### E. Key Components
* `src/components/board/ShowcaseStage.js` — the full 3-column stage with responsive breakpoints.
* `src/components/board/BoardPodium.js` — the bottom leaderboard tray and property selector.
* `src/components/descent/BackgroundOrbit.js` — cosmic periphery canvas renderer.
* `src/data/mock/mockShowcase.js` — mock data structure for showcase entries, ranks, and awards.

---

## 9. 6-Layer Spatial Descent System (updated 2026-08-18)

ScoutIt's navigation is modeled as a **descent from orbit to core** — each layer represents a
different altitude of spatial intelligence, from macro market demand down to private unit-level
data. Users descend through progressively more detailed views of the same geography.

### A. The 6 Layers

| Layer | Route | Altitude | What it shows |
|---|---|---|---|
| 1 — **Orbit / Universe** | `/layer/orbit` & `/showcase` | Highest — cosmic demand rankings | Planetary orbital tracks, sweeping galaxy canvas, high-altitude demand signals |
| 2 — **Stratosphere** | `/layer/stratosphere` | Regional macro atmosphere | Climate patterns, regional economic drivers, transport flight corridors |
| 3 — **Metropolis** | `/layer/metropolis` | Urban district clusters | Skyline vantage points, commercial district density, arterial transit flow |
| 4 — **Crust** | `/layer/crust` | Neighborhood reality | Street-level walkability, local foot traffic, community vibe, flood/elevation |
| 5 — **Mantle** | `/layer/mantle` | Architectural blueprints | Building engineering, facade materials, lobby atmosphere, shared facilities |
| 6 — **Core** | `/layer/core` & `/property/[slug]` | Private unit level | 3D Spatial Vault, verified transaction ledgers, deep financial intel room |

### B. Visual Descent Style
* **Atmospheric transitions:** deep cosmic black (`#0d0d0d`) at Orbit → atmospheric navy/slate
  at Metropolis → architectural gold & graphite at Core.
* **Altitude telemetry:** micro-indicators showing the current descent altitude with subtle
  particle color shifts between layers.
* **Layer Switcher:** intuitive waypoint navigation for jumping between layers or descending
  sequentially with smooth CSS/canvas transitions.
* **Mobile-first Lite Mode:** guarantees 60fps by pairing Canvas/WebGL particle systems with
  low-power device fallbacks via `src/lib/liteMode.js`.

