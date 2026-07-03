# VISIBILITY MAP — RESTAURANTS / CULINARY (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of a RESTAURANT
> property page. One file per category — see `VISIBILITY_MAP__*.md` siblings + the master
> `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (restaurants) · `chapterConfig.js`
> (RESTAURANT_CONFIG) · `CategorySpecBlock.js` (restaurant).

**Chapter order (experience-led — The Vibe renders FIRST; the Engine Room is collapsed by default with a
"For operators →" toggle):** The Vibe → The Kitchen & Dining Room → How Guests Arrive → *(The Vault)* →
Around the Table → The Engine Room → The Fine Print → The Rooms → Property Universe → Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · The Vibe** (Life Here) | Atmosphere/dining narrative | Acoustic Baseline Score · Ambient Light Temperature · Ventilation Capacity · Table Privacy Rating · Noise Level Score |
| **02 · The Kitchen & Dining Room** (The Space) | Story text · Floor Area · Seating Capacity · Kitchen Condition · Foot Traffic · Frontage · Indoor/Outdoor · Previous Use | CAMS (CUSA) · Fit-out Allowance · Kitchen-to-Dining Ratio · Table Turnover Projections · Liquor License Status · Hood/Exhaust · Grease Trap · Gas Line · Power Capacity · Delivery Access · F&B Zoning Permit · Ceiling detail · Turnover Condition · Parking |
| **03 · How Guests Arrive** (Location) | Map · address/city · arrival basics | Solar Orientation · Pedestrian Flow Metrics · Signage & Visibility · Zoning Classification · Valet/Parking Logistics |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **04 · Around the Table** (Where To?) | POI list · pre/post-dinner + demand anchors | Delivery Radius Coverage · Foot Traffic Peak Hours · Competitor Proximity · Supply Delivery Logistics · Walkability Score |
| **05 · The Engine Room** (Build Plans — collapsed, operator toggle) | Chapter shell/toggle visible | Grease Trap Specs · Extraction Ducting · Gas Line Specs · Electrical Load Capacity · Water & Drainage Routing |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · health-permit history as fact (`[UNVERIFIED]` until asserted) | Precise Room Dimensions · Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive |
| **07 · The Rooms** (Units) | Dining zone/room name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster (event planners lead for Restaurants) | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · CTA · compliance note · **the ONLY place money renders** (owner-verified rent/CUSA + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Invariants:** flood risk never gated · money only in Your Move (owner-verified) · F&B/health/liquor
permits carry `[UNVERIFIED]` until a human asserts · empty hidden fields render "Not recorded", never
invented · Vault = Cluster+, all other panels = Solar+.
