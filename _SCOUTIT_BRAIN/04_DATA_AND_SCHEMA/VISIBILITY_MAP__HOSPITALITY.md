# VISIBILITY MAP — HOSPITALITY (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of a HOSPITALITY
> (hotel/resort/lodge) property page. One file per category — see `VISIBILITY_MAP__*.md` siblings +
> the master `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (hospitality) · `chapterConfig.js`
> (HOSPITALITY_CONFIG) · `CategorySpecBlock.js` (hospitality).

**Chapter order (experience-led — Guest Experience renders FIRST):** The Guest Experience → The Grounds →
The Transfer → *(The Vault)* → The Radius → The Operational Shell → The Fine Print → Room Types →
Property Universe → Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · The Guest Experience** (Life Here) | Guest-experience narrative | Cleaning Turnover Time · Noise Decibel Readings · Lighting Color Temperature · Visual Privacy Rating · Guest Demographic Bias |
| **02 · The Grounds** (The Space) | Story text · Room Count · Star Rating · F&B Outlets · Function Rooms · Operator/Brand · Room Types summary · Built/Renovated year | Baseline RevPAR · GOPPAR Projections · FF&E Transfer Value · Star Rating Equivalent · Franchise Viability · ADR · Occupancy Rate · RevPAR · Cap Rate · GFA · Land Area |
| **03 · The Transfer** (Location) | Map · address/city · airport-transfer basics | Tourist Hub Proximity · Seasonality Metrics · Coach/Bus Logistics · Solar Orientation · Zoning Classification |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **04 · The Radius** (Where To?) | POI list · cultural/dining/recreation anchors | Walkability Score · Airport/Transit Routing · Delivery Zone Coverage · Supply Chain Logistics · MICE Proximity |
| **05 · The Operational Shell** (Build Plans) | BOH/expansion narrative | PMS Integration Specs · Backup Power · Commercial Kitchen Specs · Finish & Material Schedule · MEP Specifications |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · structural caveats-as-facts | Precise Room Dimensions · Competitor Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive |
| **07 · Room Types** (Units) | Room-type name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster (photographers lead for Hospitality) | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · CTA · compliance note · **the ONLY place money renders** (owner-verified price + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Invariants:** flood risk never gated · money only in Your Move (owner-verified) · empty hidden fields
render "Not recorded", never invented · Vault = Cluster+, all other panels = Solar+ (ADR/Occupancy/RevPAR/
Cap Rate/GFA/Land Area carry "DEEP-INTEL"/"MINOR" tags in Airtable).
