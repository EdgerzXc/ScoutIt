# ScoutIt — Master Architecture & Structure Guide

This is the **master architectural guide** for ScoutIt. It is explicitly designed to be read by AI agents (like Antigravity and Claude) to instantly understand the project's layout, data flow, tech stack, and recent feature integrations.

---

## 1. Core Tech Stack & Integrations

- **Framework:** Next.js (App Router)
- **Styling:** Vanilla CSS (`globals.css` and CSS Modules) & styled-jsx
- **Primary Public CMS:** Airtable (Properties, Intel, Brokers)
- **Secondary DB & Auth:** Supabase (User Auth, Owner Dashboard, Property submissions)
- **Mapping & Geocoding:** Mapbox & Leaflet

---

## 2. System Architecture & Data Flow

ScoutIt uses a unique **Dual-CMS Architecture**:

### A. The Public Directory (Airtable + Mapbox)
All public-facing data (the `/property` directory, `/intel`, `/brokers`) is pulled from Airtable.
- **API Proxy:** `src/app/api/cms/route.js` acts as the central switchboard. It fetches live Airtable data securely using `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` from `.env.local`.
- **Dynamic Geocoding:** To keep Airtable easy for human editors, owners only type a string location (e.g., "Zuellig Building, Makati"). `route.js` intercepts these properties, silently pings the **Mapbox Geocoding API** on the backend, and automatically assigns exact `lat` and `lng` coordinates to the payload.
- **Proximity Radar (Haversine Filter):** The user can trigger a visual Radius Search (`InteractiveRadiusMap`). Because Airtable lacks built-in PostGIS, `route.js` uses a mathematical **Haversine Distance Formula** in Javascript to instantly filter the geocoded Airtable properties against the user's Mapbox slider radius.

### B. The Private Dashboard (Supabase + Context)
The `/dashboard` route is protected and splits into two distinct UX flows controlled by `DashboardContext.js`:
- **Buyer Mode (`BuyerMode.js`):** A sleek, dark-mode CRM where users track shortlisted properties, saved searches, and intel briefs.
- **Owner Mode (`GuidedWizard.js`):** A heavily interactive multi-phase wizard for property developers to submit new listings. The wizard includes:
  - Step-by-step UI with progress saving.
  - An interactive Mapbox pin-dropper to extract coordinates.
  - Submissions are pushed directly to **Supabase** via `supabaseClient.js`.

---

## 3. Folder Structure — `src/`

This project uses the Next.js App Router (`src/app/`).

### `src/app/` (Pages & Routes)
- `layout.js` — The global shell wrapper (fonts, global CSS, film-grain overlay).
- `page.js` — The main homepage (cosmic event-horizon hero).
- `globals.css` — Core design system tokens (95% black / 5% gold rule).
- `property/page.js` — The primary Public Space Directory (grid of properties).
- `property/[slug]/page.js` — The individual property detail page.
- `dashboard/page.js` — The private authenticated portal (loads BuyerMode or OwnerMode).
- `settings/page.js` — User profile and account configuration.
- `api/` — Backend endpoints:
  - `cms/route.js` — The master proxy for Airtable fetching and Mapbox geocoding.
  - `reactions/route.js` — Endpoint for handling user likes/saves.

### `src/components/` (Reusable UI Blocks)
- `dashboard/` — Holds the heavy dashboard logic: `BuyerMode.js` and `GuidedWizard.js`.
- `property/` — Everything for the property pages:
  - `InteractiveRadiusMap.js` — The visual 3D radar map for radius searching on the directory.
  - `InteractiveMap.js` — The Leaflet-based static map on individual property pages (shows vicinity/amenities).
- `ui/` — Shared micro-components (e.g., `ReactionButtons`).
- `layout/` — Site-wide wrappers (e.g., `Header`, `Footer`).
- `scrollytelling/` — Complex narrative components driven by scroll progress.

### `src/context/` (State Management)
- `DashboardContext.js` — The global React Context that manages User Authentication (via Supabase) and UI state (switching between Buyer and Owner modes).

### `src/data/` (Local Mock Data)
Holds `mockProperties.js`, `mockBrokers.js`, etc. These files act as the ultimate fallback. If the `.env.local` Airtable keys are missing or the Airtable API goes down, `route.js` falls back to serving these mock files to ensure the site never crashes.

### `src/lib/` (Utilities)
- `airtable.js` — The isolated logic for fetching and normalizing data from the Airtable API.
- `supabaseClient.js` — The initialized Supabase client for authentication and Owner submissions.
- `regions.js` — Helper functions for mapping cities to regions.

---

## 4. AI Collaboration Rules (`AGENTS.md`)

- **One agent at a time** finishes a chunk, then commits it to git to create a clean checkpoint.
- If modifying the dashboard, always review `DashboardContext.js` to ensure state is maintained.
- When creating UI, strictly adhere to the established "Premium ScoutIt Aesthetic" (vibrant accents, dark mode dominance, glassmorphism).

> **AI Instruction Context:** Whenever an AI agent is asked to build a new feature or debug data flow, start by referencing `src/app/api/cms/route.js` for data origin, and `src/components/` for UI conventions.
