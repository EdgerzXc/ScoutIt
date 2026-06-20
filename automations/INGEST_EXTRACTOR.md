# ScoutIt — PDF Ingest Extractor (Phase 1 Spec / Playbook)

> The **foundation** of the Listing Engine. Reads a property PDF/doc, extracts what's
> literally there, writes it to `PROPERTIES_CMS` as **unapproved**, and flags gaps.
> No web research, no Council, no approving — those are Phase 2 (`LISTING_ENGINE.md`).
>
> Runs **interactively on the existing Claude plan — no new cost.** This is the recipe
> Claude follows so you never re-explain it: drop a file, say *"run the ingest extractor."*

---

## 1. Scope — what it DOES and does NOT do

**Does:**
- Read a PDF/doc containing one or many properties.
- Extract **facts that are literally present** in the document.
- Create one `PROPERTIES_CMS` record per property, `Approved_For_ScoutIt = false`.
- Flag every field it could not fill.

**Does NOT (these are Phase 2 / the Council):**
- Search the web for missing details.
- Write the editorial / crafted fields (Space Story, marketing copy, verdict, feel-scores).
- Approve anything. A human always approves in the Mission Control Approval Queue.
- Invent or estimate a fact. **No source in the document → leave the field blank.**

---

## 2. The core rule (inherited from the Listing Engine)

**Only fill a field if the value is actually in the document.** If a PDF doesn't state
the floor area, `FloorSqm` stays empty and is listed in the gap report. A blank is
honest; a guess is banned.

---

## 3. Field mapping (source concept → `PROPERTIES_CMS`)

### Phase-1 fields (extract if present)
| In the document | Field | Notes |
|---|---|---|
| Property name | `Title` | required; if missing, skip the record and report it |
| One-line hook / tagline | `Hook` | only if literally present |
| City | `City` | |
| Full address / location string | `Location` | app geocodes lat/lng later — string is enough |
| Type (condo, house, office, lot, restaurant…) | `SpaceCategory` | map to an existing choice; unknown → blank + flag |
| Freehold / leasehold | `Tenure` | existing choice only |
| Year built | `YearBuilt` | |
| Furnishing | `Furnishing` | existing choice only |
| Bedrooms | `Beds` | number |
| Bathrooms | `Baths` | number |
| Floor area (sqm) | `FloorSqm` | number; strip units |
| Lot area (sqm) | `LotSqm` | number |
| Parking slots | `Parking` | number |
| Floors / storeys | `Floors` | |
| Price / range | `PriceRange_Internal` | keep as text (internal only) |
| Title status | `TitleStatus` | |
| Photo URLs | `Photos` | comma/newline-separated URLs |
| Photo files | `Vision_Uploads` | if the doc carries actual images |
| "Best for" tags | `BestFor` | existing multi-select choices only |
| Any raw description text | `Broker_Input_Notes` | store verbatim — do NOT rewrite it (that's Phase 2) |

### Status fields to set on write
| Field | Set to |
|---|---|
| `Approved_For_ScoutIt` | **false** (always) |
| `Pipeline_Status` | your "draft/needs-review" choice (confirm exact label) |
| `AI_Draft_Notes` | the **gap report** — list of fields left blank and why |

### Left for Phase 2 (do not touch in Phase 1)
`SpaceStory`, `WhereTo`, `AI_Marketing_Copy`, `AI_Architectural_Style`,
`AI_Extracted_Features`, `ScoutItVerdict`, `AestheticTag`, `SpatialDensity`,
`LifestyleVibe`, feel-scores (`ComfortLevel`, `NaturalLight`, `Privacy`, `SpaceFeel`),
`NoiseLevel`, `Ventilation`, `CeilingHeight`, `OutdoorDescription`, `FloodRiskScore`,
`ConvenienceScore`.

---

## 4. Process

1. Read the document; detect how many properties it contains.
2. For each property, build a row using the mapping above — **facts present only**.
3. Compile a per-record **gap report** into `AI_Draft_Notes` (which fields are blank).
4. For `singleSelect` / `multipleSelects` fields, match an **existing choice** only;
   never create a new choice silently — if no match, leave blank and flag.
5. Write the records to `PROPERTIES_CMS` with `Approved_For_ScoutIt = false`
   (batch in chunks to respect Airtable's ~5 req/sec limit).
6. Report back: how many records created, and a summary of common gaps.
7. They appear in **Mission Control → Approval Queue → "Needs approval."**

---

## 5. Validation checklist (before writing)

- [ ] Every record has a `Title`.
- [ ] No numeric field contains stray units or text.
- [ ] No select field uses a value that isn't an existing choice.
- [ ] No fact was filled without being in the document.
- [ ] `Approved_For_ScoutIt = false` on every record.

---

## 6. Handoff to Phase 2

Records produced here are deliberately *incomplete and honest*. The Listing Engine
(`LISTING_ENGINE.md`) later picks them up — Web Researcher fills sourced gaps, the
Council crafts the editorial layer — and the Arbiter routes them. Phase 1 is the clean,
cheap floor that everything else stands on.

---

## 7. To confirm before the first run

- Exact `Pipeline_Status` choice to use for AI drafts (e.g., "Draft" / "Needs Review").
- Whether multi-property PDFs are common (affects how aggressively to split records).
- A real sample PDF, to validate extraction quality on actual data.
