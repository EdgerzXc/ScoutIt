# VISIBILITY MAP — VENUES / EVENT SPACES (Public vs Hidden Intel, per section)

> **Function of this file:** the exact public-vs-hidden ruling for every section of a VENUE
> property page. One file per category — see `VISIBILITY_MAP__*.md` siblings + the master
> `FIELD_VISIBILITY_MAP.md` (rule + invariants). Signed off by owner 2026-07-02.
> Source of truth in code: `src/lib/deepIntelSchema.js` (venues) · `chapterConfig.js` (VENUE_CONFIG) ·
> `CategorySpecBlock.js` (venue).

**Chapter order (experience-led — Event Atmosphere renders FIRST; Back of House is collapsed by default
with a "For operators →" toggle):** Event Atmosphere → Production Capacity → Guest Logistics →
*(The Vault)* → Guest Radius → Back of House → The Fine Print → Space Segmentation → Property Universe →
Services → Your Move

| Section | PUBLIC (white, free) | HIDDEN INTEL (gold, Solar+) |
|---|---|---|
| **01 · Event Atmosphere** (Life Here) | Atmosphere narrative | Acoustic Treatment Grade · Sound Isolation Rating · Lighting Rig Capability · Event AC Capacity · External Noise Penetration |
| **02 · Production Capacity** (The Space) | Story text · Seated Capacity · Standing Capacity · Floor Area · Min Booking Hours · Indoor/Outdoor · Air-conditioned · Catering Policy | Baseline Hire Fee · Max Standing/Seated pax detail · Overtime/Egress Rates · Catering/Corkage Buyouts · Noise Curfew Constraints · Layout Configs · Ceiling detail · AV Equipment · Power Capacity · Parking · Accessibility · Noise Curfew |
| **03 · Guest Logistics** (Location) | Map · address/city · drop-off basics | Truck/Rigging Logistics · Event Parking Logistics · Solar Orientation · Zoning Classification · VIP Ingress Routing |
| **— · The Vault** | Teaser only | 🔒 ENTIRE chapter = **Cluster+**: Luma 3D map · 360 tour · drone heatmap |
| **04 · Guest Radius** (Where To?) | POI list · hotels/transport anchors | Transport Node Coverage · Post-Event Crowd Routing · Hotel Proximity · Security Perimeter · Walkability Score |
| **05 · Back of House** (Build Plans — collapsed, operator toggle) | Chapter shell/toggle visible | Rigging Load Ratings · Floor Load Limit · Power Drops & Distro · Data/Broadcast Lines · Structural Calculations |
| **06 · The Fine Print** | **Flood zone status + risk (NEVER gated)** · title status · fire-safety cert as fact (`[UNVERIFIED]` until asserted) | Precise Room Dimensions · Clear Ceiling Height detail · Historical Event Roster · Provenance & Ownership Lineage · Original Permit & Blueprint Archive |
| **07 · Space Segmentation** (Units) | Segment name · size · floor · features · 1 photo | Owner-tier photo cap: free 1 / PRO 5 per unit |
| **08 · Property Universe** | EVERYTHING — fully free (verdict line stands alone) | ❌ none |
| **09 · Services** | EVERYTHING — brokers/providers roster (event planners lead for Venues) | ❌ none (contacting costs Connects — economy, not visibility) |
| **10 · Your Move** | Reactions · CTA · compliance note · **the ONLY place money renders** (owner-verified rental rate + basis + "✓ Verified by …" badge; else "Price on request") | ❌ none (compliance-gated, not tier-gated) |

**Owner ruling note (2026-07-02):** `VEN_Power_Capacity` is HIDDEN (Airtable "MINOR/paywalled" tag).

**Invariants:** flood risk never gated · money only in Your Move (owner-verified) · fire-safety cert
carries `[UNVERIFIED]` until a human asserts · empty hidden fields render "Not recorded", never invented ·
Vault = Cluster+, all other panels = Solar+.
