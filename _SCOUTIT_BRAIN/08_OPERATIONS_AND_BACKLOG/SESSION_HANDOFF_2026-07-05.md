# Session Handoff — 2026-07-05

> ## ▶️ RESUME HERE — Transit Logic Optimization, Codebase Cleanup, and Infrastructure Blueprint (On Hold)

**Context:** The owner requested optimization of the transit routing logic (specifically to fix an issue where the map calculated the closest train station via straight-line distance rather than actual driving distance), followed by a massive codebase cleanup to remove lags and strip out unused code. Finally, we drafted an infrastructure stabilization plan but deliberately put it on hold so that the owner can tighten security first.

### What was built and shipped (Live in Production):
1. **Transit Routing Logic (Mapbox Matrix API):**
   - The transit routing logic was updated from using a simple mathematical Haversine (straight-line) formula to utilizing the **Mapbox Matrix API**.
   - This ensures the app now calculates the *true* driving distance to nearby train stations. This fixed a specific edge case where a user driving on the highway would be incorrectly routed to Ayala Station instead of Magallanes Station despite already passing the Magallanes exit.

2. **Frontend Performance & Dynamic Maps:**
   - Identified that the heavy Leaflet library (`InteractiveMap`) was statically imported and blocking the main thread during the initial render of property pages.
   - Refactored `src/components/property/CommercialFlow.js` and `ResidentialFlow.js` to use Next.js `dynamic()` imports with `ssr: false`.
   - The map now defers loading until the browser is idle, instantly rendering a sleek "Loading tactical map..." skeleton state in its place, vastly improving the initial page load speed.

3. **Next.js Image Optimization Groundwork:**
   - Configured `images.remotePatterns` in `next.config.mjs` to authorize external domains (`v5.airtableusercontent.com`, `*.supabase.co`, and `picsum.photos`).
   - This unlocks the ability to incrementally replace heavy, uncompressed standard `<img />` tags with Next.js's highly optimized `<Image />` component across the site.

4. **Codebase Cleanup:**
   - Ran extensive sweeps using `knip` and `depcheck`.
   - Removed orphaned scratch files and uninstalled unused dependencies to keep the bundle and repository lightweight.
   - **Commit:** `perf: dynamically import InteractiveMap and configure Next.js Image` (Pushed to `main` and successfully deployed to Vercel).

---

### Infrastructure Blueprint (ON HOLD)
After the optimizations, we designed a robust three-point infrastructure plan to prevent API rate-limit crashes and geocoding billing burn. **The user explicitly placed this on hold to focus on security tightening first.** The code for this was reverted to keep the working tree clean, but the strategy is fully mapped out for when security is complete.

**The Pending Plan:**
1. **Airtable CMS Cache:**
   - **Problem:** Airtable enforces a strict 5 req/sec limit.
   - **Solution:** Add `Cache-Control: public, s-maxage=60, stale-while-revalidate=120` to the response headers in `src/app/api/cms/route.js`. This will cache the public directory at the Vercel Edge, completely shielding Airtable from traffic spikes.
2. **Mapbox Geocoding Cache-Back:**
   - **Problem:** `api/cms/route.js` currently geocodes string locations dynamically, burning Mapbox API credits on every cache miss.
   - **Solution:** When Mapbox is called, fire a non-blocking `PATCH` request *back* to Airtable using the Airtable Record ID to permanently save the `Latitude` and `Longitude`. Mapbox is only ever called once per property.
3. **Make.com Migration to Native Webhooks:**
   - **Problem:** The synchronization between Supabase (Owner Dashboard) and Airtable (Public CMS) relies on third-party Make.com scenarios, which are brittle and costly.
   - **Solution:** Build `src/app/api/webhooks/supabase/route.js` to natively listen to Supabase Database Webhooks. When a property in Supabase hits `verified: true`, the Next.js API automatically formats and `POST`s the record directly to the Airtable `PROPERTIES_CMS` table.

**Next Immediate Step:** The owner will be focusing on security audits and hardening before resuming the infrastructure blueprint above.

---

## ▶️ RESUME HERE (Part 2) — New Features & Cinematic Visual Polish

**Context:** Following the optimization pass, the owner requested a set of new features (Comparison Matrix and Dynamic Geo-Pricing Engine) and a massive "Cinematic Visual Polish" pass across the site using `motion-ui` and `make-interfaces-feel-better` skills to elevate the brand's luxury aesthetic.

### What was built and shipped:
1. **Dynamic Geo-Pricing Engine:**
   - Implemented `/api/geo-pricing/route.js` and `GeoPricingGauge.js`.
   - Integrated dynamic geographic pricing calculations against local market averages into the `LiveEditorWorkspace.js` for owners.
2. **Comparison Matrix Feature:**
   - Built a sleek `ComparisonMatrix.js` modal to compare multiple properties side-by-side.
   - Updated `/property/page.js` to manage a `compareList` state and added floating action buttons to toggle properties.
3. **Cinematic Visual Polish (Design Engineering):**
   - **Framer Motion Stagger:** Added a buttery smooth `0.08s` staggered entry animation to the Property Grid in `/property` using `framer-motion`.
   - **AnimatePresence Focus Pull:** Replaced static overlay toggles in the Comparison Matrix with `AnimatePresence` to enable soft blur and scale animations on entrance and exit.
   - **Tabular Numerals:** Applied `tabular-nums` CSS rules globally and directly to the `GeoPricingGauge` so changing numbers don't jitter horizontally.
   - **Typography & Dark Mode Framing:** Applied `text-wrap: balance` to key headings to eliminate single-word widows, and added a subtle `1px` translucent outline to images so they don't bleed into the dark (#0e0e0e) background.
   - **Film Grain Texture:** Verified the global cinematic film grain (`.grain`) is actively applied via `layout.js` to complete the premium luxury feel.

**Status:** The build is verified successfully. The Next.js production build (`npm run build`) completed with 0 errors.

**Next Steps for Owner:**
- Security Hardening (Supabase RLS & Input Validation) — This is currently on hold but should be prioritized next.
- SEO Automations — The owner suggested building an automation to generate good SEO practices for property listings.
