---
section: "01_IDENTITY_AND_VISION"
status: active
tags: [brand-voice, copy-guide, tone, anti-cliche, geo, typography]
updated: 2026-08-25
related:
  - "[[SCOUTIT_BIBLE]]"
  - "[[ABOUT_PAGE_AND_FOUNDER_VOICE]]"
  - "[[PRODUCT_STRATEGY_PILLARS]]"
  - "[[08_OPERATIONS_AND_BACKLOG/ACTION/00_MASTER_ACTION_PLAN|00_MASTER_ACTION_PLAN]]"
---

# ScoutIt Voice & Copy Guide

> **The rule:** ScoutIt sounds like a precise, confident Philippine space intelligence platform written by people who know the physical property—not a generic luxury generator or an AI marketing copy mill.

---

## 1. Core Brand Tone Principles

1. **Architectural & Spatial Precision**
   - Ground descriptions in physical reality: orientations, floor plates, column spacing, ceiling heights, natural lighting, setbacks, zoning classifications, and actual transit accessibility.
   - Describe a space as an architect, surveyor, or urban researcher would, not a hype promoter.

2. **Absolute Grounding (No Invented Claims)**
   - Only state facts on record from the property owner, official titles, or verified spatial sensors.
   - If a measurement is missing, state it honestly or omit it; never synthesize estimated square meters, fake views, or non-existent finishes.

3. **No Manufactured Urgency or Sales Pressure**
   - Banned: "Hurry!", "Won't last long!", "Exclusive opportunity of a lifetime!", "Rare gem!".
   - ScoutIt provides intelligence first. We do not broker, push, or rush the user.

4. **Honest Sample / Projection Transparency**
   - Sample or mock data retained for invited human testing must always be visibly marked: `"Sample data — for human testing"`.
   - Demand models or algorithmic projections are clearly labeled as projections, never as historical live transactions.

---

## 2. Banned Clichés & Replacement Table

The following AI marketing clichés and lazy luxury buzzwords are strictly prohibited across all ScoutIt surfaces and AI prompts:

| Banned Cliché / AI-ism | Why It Fails | Truthful Replacement / Architectural Phrasing |
|---|---|---|
| *the Philippines' first* (unsubstantiated) | Uncited superlative; sounds like marketing vaporware | "Property & space intelligence across the Philippines" |
| *bespoke* | Overused AI filler; adds zero information | "Custom-built", "architect-designed", or name specific materials |
| *curated* | Vague pretence of exclusivity | "Selected", "indexed", "structured", or state exact criteria |
| *panoramic* | Generic buzzword often applied to standard windows | "Floor-to-ceiling glazing", "unobstructed north-facing views" |
| *seamless* | Vague tech-marketing filler | "Direct", "integrated", or describe the actual connection |
| *prestige / prestigious* | Hollow status signalling | Name the exact district, developer, or building classification (e.g., "Grade A Makati CBD") |
| *uncompromising* | Meaningless puffery | State exact structural specifications or build standards |
| *oasis / haven / sanctuary* | Cliché retreat metaphor | "Low-density residential enclave", "private garden setback" |
| *nestled in the heart of* | Universal real-estate cliché | "Located in [District/City]", "Adjacent to [Transit/Road]" |
| *boasts / featuring* | Lazy filler attributing pride to concrete | "Includes", "contains", "provides", or state the specification directly |
| *breathtaking / stunning* | Subjective filler substituting for real visual data | High-resolution photography, exact orientation, floor level |
| *epitome of luxury / opulent* | Empty luxury padding | Detail the actual finishes (e.g., "travertine marble flooring, solid teak joinery") |
| *embark on a journey* | AI narrative tell | "Explore spaces", "search the directory", "review the briefing" |
| *testament to* | Grandiose AI formulation | "Demonstrates", "reflects", or state the direct cause |
| *verified intelligence* (blanket) | Inaccurate when data is unverified user draft | "Structured facts", "spatial signals", or "owner-attested listing" |
| *VERIFIED SPACE DOSSIER* / *VERIFIED SPECIFICATIONS* (as a template) | The badge decided nothing: a draft, a sample and a listing ScoutIt has never confirmed all printed it | The claim vocabulary below, chosen from the listing's own record |

---

## 2.1 The verification claim vocabulary (A-235, 2026-10-20)

**One predicate decides what a listing may be called.** It is
`src/lib/listingVerification.js`, it reads only data that already exists, and
every promotional surface takes its wording from it. A surface that writes the
word "verified" on its own is a defect.

| Claim the listing can carry | When it applies | What the surface says |
|---|---|---|
| Confirmed | The owner re-confirmed the listing within 30 days | "SCOUTIT-VERIFIED SPACE DOSSIER", "SCOUTIT-VERIFIED SPECIFICATIONS", "ScoutIt-verified signals on record", and the date the claim was made |
| Owner-submitted | Real, but not re-confirmed (never confirmed, stale, or no confirmation date) | "OWNER-SUBMITTED SPACE DOSSIER", "RECORDED SPECIFICATIONS", "Owner-submitted signals on record" |
| Sample | The listing is a demo | "SAMPLE SPACE DOSSIER", "SAMPLE LISTING · NOT A REAL SPACE" |
| Unpublished | The listing is still a draft | "UNPUBLISHED SPACE DOSSIER", "DRAFT SPECIFICATIONS" |

**Rules that travel with the vocabulary.**

- A claim never travels without its date. "Verified" alone is a slogan; the
  re-confirmation date is the evidence.
- A tracked-partner link says **partner**, never "verified". The promoter's
  eligibility is checked server-side; the space is not thereby confirmed.
- A delegated child unit has its own record and its own confirmation date. It
  can never inherit its parent's claim, and a unit with no date is
  owner-submitted, not confirmed.
- A verified claim describes **the listing's own record**. It is never a
  statement about title, licensing or a closed transaction, and the
  transaction-completion wording follows the Brain's two-handshake rule
  (`platform_outcome_confirmed` vs `transaction_independently_verified`).

---

## 3. Surface Copy Patterns

### A. Property Briefings (`/property/[id]`)
- **Title:** The true building or unit name (e.g., `One E-Com Center`, `Cyber Sigma Tower 3`).
- **Lead Sentence:** Declarative summary: `[Floor Area] [Space Category] located in [District, City].`
- **Specs List:** Grouped clearly: Floor area (sqm), Floor level, Building grade, Fit-out condition, Title status, Parking allocation.
- **Your Move Section:** Codified statutory statement under R.A. 9646 §31:
  - *Badge:* `• RA 9646 COMPLIANT · DISPLAY-ONLY`
  - *Statutory Notice:* `ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646, all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed real estate brokers and their accredited salespersons under direct broker supervision.`
  - *CTA Button:* `Connect with an Authorized Broker or Representative →`
  - *Guidance Text:* `Ready for introduction. Connect with an authorized broker or accredited representative to arrange a private walkthrough or review commercial lease terms.`
  - *Ergonomics:* Maintain 80px bottom clearance on mobile to prevent occlusion by the fixed bottom navigation dock.

### B. Intel Briefings (`/intel`)
- **Headline:** Specific, informative news trigger (e.g., `LEED-Mandated Office Conversions in Makati CBD`).
- **Disclosure:** Real editorial vs sample testing data: real articles have no badge; demo dispatches display `Sample data — for human testing`.
- **Content:** Factual urban movement, zoning changes, infrastructure milestones, and transit development data.

### C. Professional Directory (`/brokers`, `/photographers`, etc.)
- **Authority:** Differentiate ScoutIt verified transaction record (primary, read-only) from broker self-reported career history (secondary, labelled).
- **No Manufactured Rankings:** Avoid "Top 1% Broker" or "Best in Taguig" unless backed by published, verifiable registry data.

### D. Legal & Compliance (`/terms`, `/privacy`)
- Clear, precise statutory references (e.g., RA 9646 Real Estate Service Act, Civil Code Art. 1327).
- Plain statements of entity status and data retention without fictitious corporate claims.

### E. Homepage Hero & Spatial Commerce (`/`)
- **Discipline Badge:** `SPACE INTELLIGENCE TECHNOLOGY` (mono uppercase, instrument-panel aesthetic).
- **Value Proposition:** `Space intelligence technology and spatial commerce for the Philippines. Architectural briefings, verified ground data, and named sources.`
- **Display Tagline:** `Get lost in spaces that inspire you.` (stripped of the AI tell "actually", warm display typography).
- **Secondary Chrome:** `SPATIAL COMMERCE · PHILIPPINE PROPERTY`.
- **No Unnecessary Tooltips:** Hero surfaces stay clean and visually unobstructed; tooltip explanations belong on complex dense forms, not in the luxury brand showcase.

---

## 4. Display Typography Stance

- **Font Family System:**
  - Display: `--font-display: var(--font-geist-sans), system-ui, -apple-system, sans-serif;`
  - Body: `--font-body: var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif;`
  - Monospace / Metrics: `--font-mono: var(--font-geist-mono), 'Courier New', monospace;`
- **Rationale:**
  - Loaded once via `next/font/google` with zero CLS (`display: swap`).
  - Full native support for Philippine naming conventions (e.g., `ñ`, `Ñ`, accented Spanish-Filipino orthography).
  - High scannability and structural authority across dark-mode glassmorphism.
