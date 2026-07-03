# VISIBILITY MAP — STR / SHORT-TERM RENTAL (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of an STR
> property page. One file per category — see `VISIBILITY_MAP__*.md` siblings + the master
> `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (str) · `chapterConfig.js` (STR_CONFIG) ·
> `CategorySpecBlock.js` (str).

**Chapter order (experience-led — The Experience renders FIRST):** The Experience → The Stay →
Getting There → *(The Vault)* → The Radius → Operating Context → The Fine Print → Rooms & Beds →
Property Universe → Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · The Experience** (Life Here) | Stay/experience narrative | Cleaning Turnover Time · Noise Decibel Readings · Lighting Color Temperature · Visual Privacy Rating · Guest Demographic Bias |
| **02 · The Stay** (The Space) | Story text · Max Guests · **Avg Guest Rating (PUBLIC — owner 2026-07-02)** · beds · baths · Min Stay · Check-in/out · ceiling height · furnishing · outdoor space | ADR Projections · Occupancy Rate History · HOA Airbnb Rules · Cleaning Fee Average · Property Mgmt Split · Weekend Rate · Bed Config · Self Check-in · House Rules · Cancellation Policy · Permit/Accreditation (stays paid — owner final call; `[UNVERIFIED]`-flagged, re-verify quarterly) · WiFi Speed |
| **03 · Getting There** (Location) | Map · address/city · arrival route basics | Tourist Hub Proximity · Seasonality Metrics · Guest Parking Logistics · Solar Orientation · Zoning Classification |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **04 · The Radius** (Where To?) | POI list · attractions + times | Walkability Score · Airport/Transit Routing · Delivery Zone Coverage · Luggage Drop Logistics · Nightlife Proximity |
| **05 · Operating Context** (Build Plans) | Conversion/operating narrative · short-let legality block (`[UNVERIFIED]` until asserted) | Keyless Entry System · WiFi Speed & Reliability · Fixed Equipment Specs · Finish & Material Schedule · MEP Specifications |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · structural caveats-as-facts | Precise Room Dimensions · Competitor Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive |
| **07 · Rooms & Beds** (Units) | Room name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster (photographers lead for STR) | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · CTA · compliance note · **the ONLY place money renders** (owner-verified nightly rate/cleaning fee + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Invariants:** flood risk never gated · money only in Your Move (owner-verified) · STR legality
re-verified quarterly · empty hidden fields render "Not recorded", never invented · Vault = Cluster+,
all other panels = Solar+.
