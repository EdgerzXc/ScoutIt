# VISIBILITY MAP — RESIDENTIAL (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of a RESIDENTIAL
> property page. One file per category — see `VISIBILITY_MAP__*.md` siblings + the master
> `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (residential) · `chapterConfig.js`
> (RESIDENTIAL_CONFIG) · `CategorySpecBlock.js` (residential).

**Chapter order (as rendered):** The Space → Location → *(The Vault)* → Life Here → Where To? →
Build Plans → The Fine Print → Units & Spaces → Property Universe → Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · The Space** | Story text · beds · baths · floor sqm · lot sqm · parking · ceiling height · furnishing · outdoor space · Floor Level · View · Turnover · Pet Policy · Studio flag | HOA Reserve Health · Assoc Dues History · Annual Property Tax · Insurance Coverage · Upcoming CapEx · Price/sqm · Payment Terms · Exact Floor Level (when present) · Ventilation Quality · Noise Level Score · Natural Light Score · Privacy Score · Acoustic Baseline |
| **02 · Location** | Map · address/city · transit basics | Solar Orientation · View Protection · Zoning Classification · Flood/Elevation Risk detail · Pedestrian Flow Metrics |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **03 · Life Here** | Neighborhood/vibe narrative | Visual Privacy Rating · Noise Decibel Readings · Lighting Color Temperature · Demographic Shift · Peak Hour Crowd Data |
| **04 · Where To?** | POI list · landmarks + walk/drive times | Walkability Score · Transit Frequency Analysis · Peak Hour Commute Data · School District Quality · Delivery Zone Coverage |
| **05 · Build Plans** | Expansion narrative | MEP Specifications · Structural Calculations · Renovation History · Internet Routing · Backup Power |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · structural caveats-as-facts | Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive · Precise Room Dimensions · Finish & Material Schedule |
| **07 · Units & Spaces** | Unit name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · broker CTA · compliance note · **the ONLY place money renders** (owner-verified price + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Invariants:** flood risk never gated · money only in Your Move (owner-verified) · empty hidden fields
render "Not recorded", never invented · Vault = Cluster+, all other panels = Solar+.
