# Heatmap / Flood-Risk Map Layer — NOAH Integration Plan (research done, not yet built)

> **Function of this file:** everything learned about using UP NOAH as the data source for the
> Master Build Spec's Heatmap schema (§6) and a real visual map overlay — researched 2026-07-02,
> ready to execute in a future session. Pairs with `E2E_TEST_FIX_LIST.md` and
> `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/FIELD_VISIBILITY_MAP.md` (flood risk is PUBLIC, never gated).

---

## 1. What NOAH actually is (researched 2026-07-02, live web search)

**UP NOAH** (Nationwide Operational Assessment of Hazards) — `https://noah.up.edu.ph/` — is the
Philippines' free, open-access government hazard-mapping platform (originally DOST-funded
2012–2017, now run by the UP Resilience Institute / UP NOAH Center).

- **It is literally built on Mapbox.** Mapbox's own case study (Oct 2021,
  `https://x.com/Mapbox/status/1445391588595732480`, tag `#builtwithmapbox`): *"Project NOAH
  makes flood and landslide risk models understandable and explorable... via Mapbox."* Served
  through a Mapbox map service called **"open-hazards-ph."**
- **Real usage at scale:** during Typhoon Carina (July 2024), 623,000 users and 4.3M Mapbox
  location searches in 10 days — this is a proven, load-bearing public service, not a hobby project.
- **Data available:**
  - Flood inundation maps for **5-year, 25-year, and 100-year rainfall return periods**
  - Landslide (shallow) susceptibility maps
  - Storm surge advisory maps, **4 severity levels**
  - Coverage: **all 81 PH provinces**
- **Format:** vector tiles — a combined **PMTiles** file (cloud-optimized single-file vector tile
  format), ~4.8GB, **9 named vector tile layers**. Also available as raw ESRI shapefiles.
- **License:** **Open Data Commons Open Database License** — free, public, no API key needed for
  the data itself. A community mirror exists on Hugging Face:
  `https://huggingface.co/datasets/bettergovph/project-noah-hazard-maps`.
- **Also relevant: HazardHunterPH** (`https://hazardhunter.georisk.gov.ph/`) — a *different*,
  PHIVOLCS/DOST-run tool. Instead of map tiles, it's a **point-query tool**: give it a lat/lng,
  it returns a structured hazard assessment report (flood, landslide, liquefaction, ground
  rupture, storm surge) **for that exact point**. This is the better fit for populating a
  *per-property* `FloodRiskScore`/`LandslideRiskScore` field automatically — the Master Build
  Spec already named both NOAH PH and HazardHunterPH as the intended sources (§6.2), and this
  research confirms why: **NOAH = the visual map layer; HazardHunterPH = the per-property score.**

## 2. Why this wasn't fully built today

`src/components/property/InteractiveMap.js` (the map already on every property page) is built on
**Leaflet**, not Mapbox GL JS / MapLibre GL JS. NOAH's hazard data is vector tiles, which are
designed for a WebGL vector renderer (Mapbox GL JS, MapLibre GL JS) — Leaflet can't consume them
natively. Adding real vector-tile hazard layers means either:
- **(A) Add MapLibre GL JS + the `pmtiles` protocol plugin** as new dependencies, and either
  build a second, separate map component for the hazard-overlay use case, or replace Leaflet
  entirely (bigger, riskier, touches every property page).
- **(B) Check if NOAH/GeoServer (DOST-ASTI) also exposes a WMS endpoint** (Web Map Service — an
  OGC standard that serves plain raster map *images*, which Leaflet **can** consume directly via
  `L.tileLayer.wms(...)`, zero new dependencies). The search results mention "all disaster layers
  cached in a GeoServer in DOST-ASTI" and WFS/WMS being standard for PH government hazard data —
  **this needs to be confirmed by inspecting NOAH's live network requests** (their site is a
  JS-rendered SPA; a plain fetch of the HTML doesn't reveal the tile/service URLs — needs a real
  browser session with dev tools/network tab open, or contacting UP NOAH directly).

This is a real integration decision (new dependency vs. reuse Leaflet) that deserves a proper
look before code gets written, not a rushed guess — hence parking it here instead of half-building
it.

## 3. What's already shippable today (done 2026-07-02)

`src/components/property/FloodRiskBadge.js` — a small, dependency-free badge showing the
already-live Airtable fields `FloodRiskScore` (number) + `FloodZoneStatus` (text) with a
color-coded severity band (Low/Moderate/High/Severe). Wired into `ResidentialFlow.js`'s "The Fine
Print" chapter. **Public, never gated** (matches the hard invariant in `FIELD_VISIBILITY_MAP.md`).
Verified in a live browser against a real Airtable record — correctly renders nothing when the
fields are blank (this record has no flood data yet), no errors. **Not yet wired into
`CommercialFlow.js`** — same fast-follow note as the Affordability Calculator.

## 4. Technical path — CONFIRMED 2026-07-02 (real browser, Network tab inspected)

**Path (A) only — no WMS/raster shortcut exists.** Opened `noah.up.edu.ph` → NOAH Studio
(`/noah-playground`) in a real browser and inspected all network traffic:
- The map loads `mapbox-gl.css` + `api.mapbox.com/styles/v1/upri-noah/...` — genuine Mapbox GL JS,
  confirming the Oct 2021 Mapbox case study claim.
- Every hazard layer (`ph_fh_100yr`/`25yr`/`5yr` flood, `ph_lh_lh1`/`lh2` landslide, `ph_ssh_ssa1-4`
  storm surge) loads as a **`mapbox://upri-noah.*` vector tileset** via `api.mapbox.com/v4/...json`,
  authenticated with **NOAH's own Mapbox account's public token** (visible in the network request,
  but it belongs to their account, not ours).
- Also found a second endpoint, `webgis-static.up.edu.ph/api/hazards/ph_combined_tileset.json` — a
  manifest that looked promising (self-hosted, non-Mapbox domain) but **just maps layer names back
  to the same `mapbox://upri-noah.*` tileset IDs** — it is not a self-hosted copy of the raw data,
  just metadata pointing at Mapbox's proprietary hosting.
- **No WMS/GeoServer endpoint anywhere in the traffic.** Path (B) is dead — ruled out for real, not
  just unconfirmed.

**What this means:** ScoutIt cannot point `InteractiveMap.js` (Leaflet) at NOAH's tiles directly,
and cannot even point a new MapLibre GL JS map at NOAH's own tileset IDs for production use —
those are hosted under NOAH's private Mapbox account. Relying on their exposed token would mean
borrowing someone else's credential for our own traffic (fragile — they can rotate/restrict it
anytime, and it's not ours to depend on). **The only sound path is 3(b) from below: self-host the
Hugging-Face-mirrored open-licensed PMTiles file** on ScoutIt's own infrastructure, not point at
NOAH's live site at all.

## 5. Recommended next-session build order (updated) — §6 below supersedes 2-3

1. ~~Confirm the actual technical path~~ — **done above.**
2. ~~Add MapLibre GL JS + the pmtiles protocol plugin~~ — **done, see §6.**
3. ~~Download/host the PMTiles file~~ — **not needed after all, see §6** (pointed directly at the
   Hugging Face CDN instead — it supports HTTP range requests, which is the whole point of the
   PMTiles format; no re-hosting required for v1).
4. **HazardHunterPH for the per-property score:** once the map-layer question is settled, wire a
   one-time (not per-request) lookup — geocode the property once, query HazardHunterPH for that
   point, cache the result into the already-live `FloodRiskScore`/`FloodZoneStatus` Airtable
   fields. Air pollution and heat island still need a separate provider — nothing found for those.
5. Only after 2–4: build the legend + severity color scale + the rest of the Heatmap schema
   fields (`LandslideRiskScore`, `TrafficCongestionScore`, etc.) on top of a proven map-layer
   pattern.

## 5. What NOT to do

- Don't guess a tile/style URL and hardcode it — verify it live first (§4 step 1).
- Don't silently swap Leaflet for MapLibre across the whole app to save a step — that's a much
  bigger, riskier change than this feature needs; scope it to a hazard-specific overlay first.
- Don't populate `FloodRiskScore` with invented numbers — this field is public and
  decision-critical; a wrong "Low" reading is worse than a blank one.

## 6. BUILT 2026-07-02 — the actual map layer, end to end

**Fully free, no paywall anywhere** (owner ruling: this is government/NOAH open data, monetizing
it would look bad — matches the existing "flood risk never gated" invariant).

**`src/components/property/FloodHeatmapMap.js`** — new component, `maplibre-gl` (already a
dependency) + `pmtiles` (newly installed). Points directly at
`huggingface.co/datasets/bettergovph/project-noah-hazard-maps/.../flood_100yr.pmtiles` via the
`pmtiles://` protocol — **no download/re-hosting needed**, PMTiles uses HTTP range requests so the
browser only ever fetches the bytes for tiles actually in view (confirmed: a real Manila/Pasig
River tile is ~520KB, not the full ~970MB file). Basemap is CARTO's free `dark-matter-gl-style`
(same pattern already used by `InteractiveRadiusMap.js`). Inspected the PMTiles file's own
metadata first (`PMTiles.getMetadata()`) rather than guessing the internal layer name — source-
layer is `flood_100yr`, single `Var` attribute (1/2/3 = NOAH's own Low/Medium/High classification,
mapped to yellow/orange/red). Historical data (not live) — matches the owner's spec exactly;
"refreshing" just means occasionally re-pointing at a newer PMTiles file if NOAH republishes one.

**Wired into both flows** as a third tab ("Flood Risk Map") alongside the existing "Tactical Map" /
"Directory List" toggle in the Location chapter — `ResidentialFlow.js` and `CommercialFlow.js`,
identical pattern in both.

**Two real bugs found and fixed while verifying this in a live browser (not sandbox — the preview
tool's browser has no external network access at all, had to use a real Chrome instance):**
1. **CSP blocked both the basemap and the flood data.** `next.config.mjs`'s `connect-src` only
   allowlisted `supabase.co`/`mapbox.com`/`unpkg.com` — neither `cartocdn.com` nor
   `huggingface.co`/`hf.co` were in it. This would have *also* silently broken the pre-existing
   `InteractiveRadiusMap.js` (same CARTO URL), not just this new feature. Fixed by widening
   `connect-src` to `https://*.cartocdn.com https://huggingface.co https://*.hf.co` (CARTO's style
   references a *different* subdomain, `tiles.basemaps.cartocdn.com`, for the actual tiles/sprite/
   fonts — needed the wildcard, not just the exact host).
2. **The map's wrapper div collapsed to ~2px tall.** The Location chapter's `.panel-content` is a
   flex container; `.flood-heatmap-wrapper` never got an explicit height (only its child did), so
   flex layout squashed it. Fixed by giving the wrapper itself an explicit
   `height: clamp(360px, 48vh, 440px)` + `flex-shrink: 0` — matches the exact pattern
   `ResidentialFlow.js` already uses when wrapping `InteractiveMap`.

**Verified:** full trace (load → addSource → addLayer → ready) with no errors; real network
request to Hugging Face's CDN with correct PMTiles range-header behavior; legend, marker, zoom
controls all render correctly; independently confirmed real flood polygon data exists at a known
flood-prone Manila coordinate (520KB tile, not empty) to rule out a silent paint-expression bug —
the test property's own coordinates just happen to fall outside any mapped hazard zone in its
visible viewport, which is normal (most of any country isn't in a flood zone).

**Not yet done:** HazardHunterPH per-property scoring (§4 above), the rest of the Heatmap schema
fields (landslide/storm-surge/traffic/air-quality layers) — this session only shipped the flood
layer, per the locked spec from conversation.

## 7. BUILT + VERIFIED LIVE 2026-07-03 — 5-yr / 25-yr / 100-yr return-period tabs

`FloodHeatmapMap.js` gained a 3-tab selector for NOAH's other two published return periods (this
doc's §1 already confirmed NOAH publishes exactly 5/25/100-yr — no "50-year" dataset exists, so
the owner's original 50-yr ask was corrected to 25-yr instead of invented).

**Verified for real, not assumed:**
- `curl`-confirmed both `flood_5yr.pmtiles` (510MB) and `flood_25yr.pmtiles` (590MB) return HTTP
  200 at the same Hugging Face path as the already-working `flood_100yr.pmtiles`.
- Live browser check: clicked all 3 tabs on a real property page, confirmed via network logs that
  each tab actually triggers a real 206 Partial Content range-request fetch against the correct
  `.pmtiles` file (not just a UI label swap) and the legend/marker update correctly, no console
  errors.

Pushed live to `scoutit.vercel.app` + `scout-it.vercel.app`, commit `9aab743`.
