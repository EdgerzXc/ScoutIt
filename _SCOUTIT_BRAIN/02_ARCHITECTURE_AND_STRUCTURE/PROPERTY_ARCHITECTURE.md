# ScoutIT — Property Page Architecture Refactor + Category Content System

> ✅ **STATUS: BUILT.** This refactor is live — `src/components/property/chapterConfig.js` (the
> registry), `CategorySpecBlock.js`, `ResidentialFlow.js` + `CommercialFlow.js` (rendering both
> flows for all 6 categories per `CATEGORY_TO_LAYOUT_MAP`), and `src/lib/deepIntelSchema.js` (the
> per-category × per-chapter hidden-intel field lists) all exist and match this spec. Read this
> file for the *design intent* behind the chapter order/naming per category; for what's public vs
> paid in each chapter, see `04_DATA_AND_SCHEMA/VISIBILITY_MAP__*.md` (one per category) — those
> are the current operational reference, not this file.

Read `CLAUDE.md` and `SCOUTIT_BRAND.md` before starting. This is a major architectural refactor — read everything carefully before touching any code.

---

## CONTEXT

ScoutIT is a Space Intelligence platform for Philippine real estate. The property master page currently has 10 chapters hardcoded in two near-identical components (`ResidentialScrollytelling` and `CommercialFlow`) totaling ~1,600 lines. All six categories (Residential, Commercial, STR, Hospitality, Restaurants, Venues) render the same chapter order and content. This needs to be refactored into a flexible chapter registry system.

---

## STEP 1 — CHAPTER REGISTRY REFACTOR (the enabler)

Refactor the property page into a chapter registry + per-category config system:

**Chapter component signature:**
Every chapter becomes a self-contained component:
```javascript
ChapterComponent({ property, variant, tier, collapsed })
```

**Per-category config shape:**
```javascript
{
  category: 'residential',
  chapters: [
    {
      id: 'the-space',
      component: TheSpaceChapter,
      variant: 'reuse', // reuse | reframe | replace
      title: 'The Space',
      order: 1,
      defaultCollapsed: false,
      fields: {
        bedrooms: { tier: 'needed' },
        bathrooms: { tier: 'needed' },
        comfortLevel: { tier: 'extra' },
        noiseLevel: { tier: 'extra' },
      }
    },
    // ... rest of chapters
  ]
}
```

**The page renders by mapping over config:**
```javascript
config.chapters.map(ch => (
  <ch.component
    property={property}
    variant={ch.variant}
    tier={ch.tier}
    collapsed={ch.defaultCollapsed}
  />
))
```

This means: reordering = reorder an array. Tiering = a flag. Collapsing = a flag. Do not duplicate components.

---

## STEP 2 — PORT EXISTING CHAPTERS

Port all 10 existing chapters into the registry as the Residential baseline. Do not change any visual output — only restructure into the new pattern.

Ten chapters:
1. The Space
2. Location
3. Life Here
4. Where To?
5. Build Plans
6. The Fine Print *(rename from "Hidden Intel" — name now mismatches content)*
7. Units & Spaces
8. Property Universe
9. Services
10. Your Move

---

## STEP 3 — FILL CONFIG FOR ALL 6 CATEGORIES

### Chapter 01 — The Space
- Residential: REUSE — beds/baths/sqm/parking/lot + space story
- Commercial: REFRAME — "The Floor Plate" — sqm, ceiling, frontage, parking ratio
- STR: REFRAME — "The Stay" — guests/bedrooms/beds/baths, experiential story
- Hospitality: REFRAME — "The Grounds" — keys, amenity footprint, architectural style
- Restaurants: REPLACE — "The Kitchen & Dining Room" — covers, seating, sqm, kitchen grade
- Venues: REPLACE — "Production Capacity" — standing/seated capacity, floor load, setup grade

### Chapter 02 — Location
All REFRAME, same map component, different lens:
- Residential: "Location" — transit + CBD commute
- Commercial: "Access & Logistics" — employee commute + delivery routes
- STR: "Getting There" — airport route, tourist arrival
- Hospitality: "The Transfer" — airport time, last-mile quality
- Restaurants: "How Guests Arrive" — foot traffic, parking, ride-hail
- Venues: "Guest Logistics" — drop-off, valet, highway access

### Chapter 03 — Life Here
All REFRAME, experience-led categories lead with this chapter:
- Residential: "Life Here" — comfort/light/privacy/noise + safety + community
- Commercial: "The Workday" — noise floor, natural light, after-hours feel
- STR: "The Experience" — sleep quality, privacy, screenshot moments
- Hospitality: "The Guest Experience" — service ratio, quiet, privacy levels
- Restaurants: "The Vibe" — acoustic profile, lighting temperature, table intimacy
- Venues: "Event Atmosphere" — sound isolation, acoustic treatment, lighting capability

### Chapter 04 — Where To?
All REFRAME, same POI map, different POI sets:
- Residential: "Where To?" — schools/malls/hospitals
- Commercial: "The Block" — lunch/banks/suppliers + demand anchors
- STR: "The Radius" — attractions, activities
- Hospitality: "The Radius" — cultural centers, dining, recreation
- Restaurants: "Around the Table" — pre/post-dinner anchors + demand anchors
- Venues: "Guest Radius" — hotels, airport, transport

### Chapter 05 — Build Plans
- Residential: REUSE — "Build Plans" — expansion, zoning, developer, architect
- Commercial: REFRAME — "Fit-Out Potential" — floor load, MEP capacity, subdivision
- STR: REFRAME — "Operating Context" — conversion potential + short-let legality block
- Hospitality: REFRAME — "The Operational Shell" — BOH, expansion, housekeeping routing
- Restaurants: REPLACE — "The Engine Room" — ventilation, grease/exhaust, electrical load. **defaultCollapsed: true** with "For operators →" toggle
- Venues: REFRAME — "Back of House" — rigging, load-in/out, green rooms, vendor docks. **defaultCollapsed: true**

### Chapter 06 — The Fine Print
All REUSE — flood zone, title status, structural caveats. Facts: needed (free). Scores: extra (paid).

### Chapter 07 — Units & Spaces
All REFRAME, same component, different vocabulary:
- Residential: "Units & Spaces" — rooms/beds/baths/sqm
- Commercial: "Floors & Suites"
- STR: "Rooms & Beds"
- Hospitality: "Room Types"
- Restaurants: "The Rooms" — dining zones, bar, private rooms
- Venues: "Space Segmentation"

### Chapter 08 — Property Universe
All REUSE. Keep fully free. Verdict line stands alone.

### Chapter 09 — Services
All REUSE — reorder which professional leads:
- Residential/Commercial: brokers first
- STR/Hospitality: photographers first
- Restaurants/Venues: event planners first

### Chapter 10 — Your Move
All REUSE. CTA noun changes per category.

---

## CHAPTER ORDERING RULES

Experience-led categories (Restaurants, Hospitality, STR, Venues):
- Chapter 03 (Vibe/Experience/Atmosphere) → position 1
- Chapter 01 (The Space) → position 2
- All others follow normal order

Decision-led (Residential, Commercial): default order 01–10.

---

## STEP 4 — THE 9 REAL CELLS (actual new component code)

1. **01 × Restaurants** — Kitchen & Dining Room stat block (covers, kitchen grade)
2. **01 × Venues** — Production Capacity stat block (capacity, setup grade)
3. **05 × Restaurants** — Engine Room component (collapsed by default)
4. **05 × STR** — Operating Context with short-let legality block
5. **03 × STR** — The Experience (sleep quality, privacy, screenshot moments)
6. **03 × Hospitality** — The Guest Experience
7. **03 × Restaurants** — The Vibe (acoustic, lighting, intimacy)
8. **03 × Venues** — Event Atmosphere
9. **04 × Restaurants/Venues** — demand anchor data point

---

## TIER SYSTEM

Every field has a tier flag: `needed` (free) or `extra` (paid).

**Always free:** Hard diligence facts, authorized price, The Fine Print chapter, Property Universe verdict line.

**Always paid:** Comfort level, noise level, natural light score, privacy score, AI-assisted metrics.
Paid fields: blurred + "Unlock with Verified Scout →" CTA. Empty paid fields do not render at all.

---

## GLOBAL RULES
- Do not change any visual design during this refactor
- Do not break existing Residential or Commercial pages
- Test every category renders correctly after each step
- Commit after each step with a clear message
- Deploy to Vercel only after Step 4 is complete and tested
- Airtable field additions are LAST — do not touch Airtable until all 4 steps are done
