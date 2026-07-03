# VISIBILITY MAP — COMMERCIAL (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of a COMMERCIAL
> property page. One file per category — see `VISIBILITY_MAP__*.md` siblings + the master
> `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (commercial) · `chapterConfig.js`
> (COMMERCIAL_CONFIG) · `CategorySpecBlock.js` (commercial).

**Chapter order (as rendered):** The Floor Plate → Access & Logistics → *(The Vault)* → The Workday →
The Block → Fit-Out Potential → The Fine Print → Floors & Suites → Property Universe → Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · The Floor Plate** (The Space) | Story text · Published Rent · Total GLA · Floor Plate · Building Grade · Hand-over Condition · Availability · Min Lease Term · Certification · PEZA | CAMS (CUSA) · A/C Charges · Escalation Rate · Fit-out Allowance · Rent-free Period · Cap Rate · NOI · A/C System · Reserved Parking · Parking Ratio · Backup Power · Floor Loading · Internet Providers · Available Units · Towers/Zones · Ventilation Quality · Noise Level Score · Natural Light Score · Privacy Score · Acoustic Baseline |
| **02 · Access & Logistics** (Location) | Map · address/city · transit basics | Towers/Zones · Parking Ratio · Reserved Parking · Solar Orientation · Pedestrian Flow Metrics |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **03 · The Workday** (Life Here) | Workday/area narrative | Ventilation Quality · Noise Level Score · Natural Light Score · Privacy Score · Acoustic Baseline |
| **04 · The Block** (Where To?) | POI list · lunch/banks/suppliers · demand anchors | Internet Providers · Walkability Score · Peak Hour Traffic Data · Delivery Zone Coverage · Transport Node Coverage |
| **05 · Fit-Out Potential** (Build Plans) | Fit-out narrative | Backup Power · Floor Loading · MEP Specifications · Electrical Load Capacity · Structural Calculations |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · structural caveats-as-facts | Available Units · Office Density Data · Development Pipeline · Historical Transaction Records · Provenance & Ownership Lineage · Original Permit & Blueprint Archive |
| **07 · Floors & Suites** (Units) | Unit/floor name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit; the records panel (06) renders here on the live Commercial flow |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · broker CTA · compliance note · **the ONLY place money renders** (owner-verified rent/price + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Owner ruling note (2026-07-02):** CAMS (CUSA) + A/C Charges are HIDDEN intel per the deepIntelSchema
design — this supersedes the older `PROPERTY_CATEGORY_SOP.md §8` note that marked them free.

**Invariants:** flood risk never gated · money only in Your Move (owner-verified; Published Rent shown as
the owner's published rate) · empty hidden fields render "Not recorded", never invented · Vault = Cluster+,
all other panels = Solar+.
