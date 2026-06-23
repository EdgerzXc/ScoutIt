# ScoutIt — CSV & AI Assimilation Engines (Playbook)

This document outlines the two distinct pipelines for handling bulk data in ScoutIt:
1. **The Unit Inventory Engine (Semi-Interactive)**: Used in the Live Editor to upload 100+ internal units for a *single* property.
2. **The Global Portfolio Importer (AI Assimilation)**: Used on the Owner Dashboard to upload an entire portfolio, creating *multiple separate properties* completely automatically.

---

## PART 1: The Unit Inventory Engine (Live Editor)

> Built for properties like Condominiums or Commercial Towers where an owner needs to upload 100+ internal units for a SINGLE property. The goal is to map their custom CSV headers into the `units_inventory` array of the current property draft in the Live Editor.
>
> Runs **semi-interactively**. To save token costs, the AI only reads the first 3 rows to generate a blueprint, and local Javascript executes the blueprint for the remaining thousands of rows.

---

## 1. Scope — what it DOES and does NOT do

**Does:**
- Accept a raw `.csv` file.
- Read only the Headers and the first 3 data rows to understand context.
- Create a strict JSON mapping blueprint (e.g., `{"T&B": "Baths", "Size Sqm": "FloorSqm", "Unit Price": "Price"}`).
- Push the mass-mapped rows directly into the `formData.details.units_inventory` array of the currently edited property in the Live Editor.

**Does NOT:**
- Parse all 500 rows using AI (too expensive).
- Create 500 entirely separate properties in the database (this is what the Global Portfolio Importer does). This engine only adds units *inside* one property.
- Guess missing values. If "Parking" isn't a column, all 500 units will have a blank `Parking` field.

---

## 2. The Blueprint Rule (Cost Saver)

**Never process the whole file.** 
The system parses the CSV in the browser using `PapaParse`, extracts `Row 0` (Headers) and `Rows 1-3` (Sample Data), and sends ONLY that chunk to the AI model. 

The AI's only job is to return a `Blueprint JSON`.

Example Output:
```json
{
  "source_columns": ["Unit No", "BR", "T&B", "Area", "Status"],
  "mapping": {
    "Unit No": "Title",
    "BR": "Beds",
    "T&B": "Baths",
    "Area": "FloorSqm",
    "Status": "Turnover_Date"
  },
  "unmapped": ["Status"],
  "confidence": "High"
}
```

---

## 3. Field Mapping Definitions

When analyzing the sample rows, the AI must map the chaotic developer columns to these strict ScoutIt fields:

| Chaotic Example | Target ScoutIt Field | Data Type |
|---|---|---|
| Name, Unit, Tower 1 Unit 4 | `Title` | String |
| Size, Area, Sqm, Flr Area | `FloorSqm` | Number (Strip units) |
| Price, TCP, Amount, PhP | `PriceRange_Internal` | String |
| BR, Beds, Bedrooms | `Beds` | Number |
| T&B, Baths, Toilets | `Baths` | Number |
| Carpark, Slots, Parking | `Parking` | Number |
| Level, Flr, Story | `Floor_Level` | String (Paywalled) |

---

## 4. The UI / UX Flow

1. **The Drop:** Owner drags a `.csv` file into the `LiveEditorWorkspace.js` dropzone.
2. **The Blueprint Phase:** The frontend extracts the top 3 rows and sends them to the Bulk Engine AI. UI shows: *"AI is mapping your columns... ✦"*
3. **The Preview Table:** The AI returns the JSON blueprint. The frontend uses the blueprint to map all 500 rows locally and displays a preview table.
4. **The Owner Verification:** The owner checks the preview table. If the AI mapped "Lot Area" to `size` by mistake, the owner can manually correct the dropdown header.
5. **The Push:** Owner clicks "Submit Bulk Inventory". The 500 JSON objects are bulk-inserted into the `units_inventory` array on the frontend, ready to be saved with the rest of the property draft.

---

## 5. Guardrails

1. **No Silent Overwrites:** If a column contains data that doesn't fit any ScoutIt field, add it to the `unmapped` array so the owner is aware it will be dropped.
2. **Type Enforcement:** If the AI maps "Area" to `FloorSqm`, the frontend must strip "sqm" from the string and cast it to an integer before sending to Supabase.
3. **Data Escrow Readiness:** All properties generated this way still follow the Churned Escrow Rule. Even though they are bulk uploaded, they will eventually receive QuestIT 3D scanning based on the owner's subscription tier.

---

## PART 2: The Global Portfolio Importer (AI Assimilation Engine)

> Used when an Owner wants to onboard their entire portfolio (e.g. 50 different properties across the city) at once from the main Dashboard.

**The Workflow:**
1. **Silent Extraction:** The owner drops their raw CSV/Excel file. `PapaParse` reads it instantly in the browser and converts it to JSON. The user *never sees* PapaParse or any column-mapping dropdowns.
2. **AI Assimilation (`/api/ai/assimilate`):** The raw JSON payload is sent to the Council AI.
3. **Intelligent Mapping:** The LLM receives a strict system prompt to map chaotic developer columns (like "Sz (Sqm)" or "Rate / mo") into ScoutIt's strict Supabase Draft schema (`floor_sqm`, `price_php`, etc.).
4. **Draft Generation:** The AI returns a clean array of property drafts. These are immediately created as separate property entries in the owner's portfolio.

**Why this matters:**
This is ultra-luxury UX. We do not force owners to manually map columns. The Council AI handles the messy data normalization, dropping the friction of onboarding large portfolios to zero.
