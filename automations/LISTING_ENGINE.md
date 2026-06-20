# ScoutIt — The Listing Engine (Spec)

> The hardest, most valuable operation on the platform: turning a thin source document
> into an almost-complete, **factually honest** property listing. One expensive,
> careful pass at a listing's *birth*; cheap edits after.
>
> Status: **design / spec only — not built.** Build order is at the bottom.
> Cross-reference: `../docs/AIRTABLE_IMPLEMENTATION_PLAN.md`, `../SCOUTIT_BIBLE.md`,
> `../SCOUTIT_PRICING_STRATEGY.md`.

---

## 1. The problem it solves

Reliable property data in the Philippines is scarce, stale, and easy to misattribute
online. A listing needs to be rich and trustworthy anyway. The Listing Engine squeezes
maximum *verifiable* completeness out of a thin starting document (an owner's PDF),
without ever fabricating a fact.

## 2. Where it runs (and what it is NOT)

- This is the **Stage 2, server-side, monetized** pipeline — it runs for property
  owners as a premium feature (the *AI-assisted listing* benefit in the pricing doc:
  Solar / Cluster / Universe owner tiers). The AI cost rides on that subscription.
- It is built **on top of** a simple Phase-1 extractor (PDF → fields → Approval Queue).
  The Council, web research, and Arbiter are layers wrapped around a working extractor —
  not the first thing built.
- Output always lands in `PROPERTIES_CMS` as **unapproved** → the Mission Control
  **Approval Queue**. The engine drafts and verifies; a human approves.

## 3. The one rule everything hangs on

**No source → the field stays blank. The engine weighs evidence; it never invents.**

- Experts guide *what to look for and how to frame it* — they get no licence to fabricate.
- Conflicting sources → flag for human, never silently pick.
- This is non-negotiable; it is the literal expression of the brand promise
  ("No guesswork. The signals are real.").

## 4. Facts vs. Editorial (two layers, handled differently)

| Layer | Example `PROPERTIES_CMS` fields | How it's filled |
|---|---|---|
| **Hard facts** | `FloorSqm`, `LotSqm`, `Beds`, `Baths`, `Parking`, `Floors`, `YearBuilt`, `Tenure`, `TitleStatus`, `Location`, `City`, `PriceRange_Internal`, `FloodRiskScore`, `ConvenienceScore` | Extracted from PDF or **cited** from web. No source → blank. Council only adjudicates *conflicts*. |
| **Editorial / judgment** | `Hook`, `SpaceStory`, `WhereTo`, `AestheticTag`, `SpatialDensity`, `LifestyleVibe`, `BestFor`, `ScoutItVerdict`, `AI_Marketing_Copy`, `AI_Architectural_Style`, feel-scores (`ComfortLevel`, `NaturalLight`, `Privacy`, `SpaceFeel`), `NoiseLevel`, `Ventilation`, `CeilingHeight`, `OutdoorDescription` | Crafted by the Council. This is where multi-perspective debate earns its tokens. |

## 5. The pipeline

```
Owner uploads PDF
   → 1. AI Extractor      fills facts from the PDF (source = PDF)
   → 2. Web Researcher    finds more · cites source + confidence · verifies SAME property
   → 3. The Council       weighs sourced evidence per field (facts: adjudicate; editorial: craft)
   → 4. The Arbiter       final re-check vs hard rules, then routes:
        ├─ ✓ Approved        high confidence + sourced        → Approval Queue (→ live on approval)
        ├─ ↻ Back to Council borderline → rethink             → max 2 rounds, then escalate
        └─ ⚑ Pending → Human conflicting / unsourced / low    → you decide
```

### Routing logic (deterministic, not vibes)
- **High** confidence + every critical field sourced → Approve.
- **Medium** → one more Council round (see loop cap).
- **Low / conflicting / unsourced critical field** → Pending → human.

## 6. The Council

A large **roster**, but a lean **panel per listing**. Two kinds of seats:

### Domain experts (bring knowledge)
- **Design & Architecture Expert** — *permanent.* Reads the building's structure and
  aesthetics; sharpens which design facts to gather.
- **Category Master** — *one seat, chosen by the property's `SpaceCategory`:*
  Residential · Commercial / Land-developer · STR · Hospitality · Culinary / Restaurant ·
  Event-Venue. (Roster can grow — heritage, industrial/warehouse, mixed-use — without
  raising per-listing cost, since only the matching master is convened.)

### Advocates (bring whose interests are served)
- **Owner Advocate** — *permanent.* Ensures the owner is heard, the asset is presented
  fairly, no selling point is missed.
- **Buyer / User Advocate** — *permanent.* Ensures the data is honest and decision-grade,
  the way a serious buyer wants it — and pushes back on hype.

> **Owner vs Buyer is a deliberate checks-and-balance:** presentation pulling against
> honesty. The Arbiter balances them. That tension *is* the ScoutIt brand.

### Convened panel per listing
```
3 permanent core  (Design Expert · Owner Advocate · Buyer Advocate)
+ 1 Category Master (matching the property's category)
+ The Arbiter      (judge — not a council member)
= ~4 voices + Arbiter
```

### Jurisdiction (who has the strongest say)
| Seat | Type | Sits when | Strongest say on |
|---|---|---|---|
| Design & Architecture Expert | Domain | Always | aesthetic tags, architectural style, feel-scores, `SpaceStory` framing |
| Owner Advocate | Perspective | Always | completeness from owner's side, fair presentation, missed selling points |
| Buyer Advocate | Perspective | Always | honesty + usefulness, `BestFor`, "what a buyer still needs to know" |
| Category Master (1 of N) | Domain | Matching category only | category-specific facts & positioning |
| The Arbiter | Judge (not a member) | Always | final ruling, enforces sourcing, routes approve / loop / human |

## 7. Guardrails

1. **Loop cap** — "Back to Council" is limited to **2 rounds**, then forced to Pending →
   human. Prevents endless token burn on a stubborn listing.
2. **Confidence-gated routing** — see §5.
3. **Same-property verification** — before trusting any web detail, confirm it is the
   *same* unit/building, not a namesake. Prevents the worst misattribution errors.
4. **False-consensus defense** — the Council weighs *sourced* evidence; agreement built
   on one bad source is not trust. Sources are compared, not just opinions.

## 8. Fact lifecycle (web is the draft, not the truth)

```
AI-drafted (sourced)  →  Verified by Bounty / owner  →  trusted
```
Web research is the **cold-start draft**. ScoutIt's **Bounty system** (field verification,
"Verified by ScoutIt Community") and **owner confirmation** are what upgrade a drafted
fact to verified over time. The Council doesn't have to be perfect — honest and
improvable.

## 9. Integration with the existing base

- Writes to **`PROPERTIES_CMS`** with `Approved_For_ScoutIt = false`.
- **Fields to add in Phase 2** (not yet created):
  - `Verification_Status` (single select: Drafted / Rules passed / Council passed / Needs human / Verified)
  - `Source_Citations` (long text or attachments — the receipts for web-found facts)
  - per-critical-field confidence (mechanism TBD)
- **Agent Activity Log** — record what each seat did/decided and why a listing escalated,
  so a human reviewing the Approval Queue sees the full history, not a black box.
- Geocoding stays in the app (`src/app/api/cms/route.js`) — the engine only needs the
  `Location` string.

## 10. Cost model

- ~4 model voices per listing + research + arbiter = **dollars per listing, not cents** —
  deliberately. A listing is a real asset and deserves the rigor.
- **One-time at creation;** updates afterward are light.
- **Rides on the paid owner tier** — the expensive pass only fires where a paying
  customer is on the other side.
- Keep the panel lean (3 core + 1 master) and cap research depth to control spend.

## 11. Build sequencing

1. **Phase 1 — the extractor (build first).** Plain PDF → fields → `PROPERTIES_CMS`
   unapproved → Approval Queue. Interactive, runs on the existing Claude plan, no new
   cost. Proves extraction quality and the field-mapping rules.
2. **Phase 2 — wrap the engine.** Add Web Researcher → Council → Arbiter → routing loop
   around the proven extractor. Server-side, monetized.
3. Add the `Verification_Status` / `Source_Citations` fields and the Agent Activity Log
   when Phase 2 starts.

## 12. Open decisions

- **Launch category masters:** all six, or start with the 2–3 highest-volume categories
  and add the rest later? _(pending)_
- Council size per panel — confirm 3 core + 1 master (vs. adding a second category master
  for mixed-use properties).
- Confidence mechanism for per-field gating.
- Exact web-research source allow-list (which sites count as citable).
