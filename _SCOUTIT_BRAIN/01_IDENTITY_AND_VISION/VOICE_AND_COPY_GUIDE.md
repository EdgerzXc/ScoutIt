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

---

## 3. Surface Copy Patterns

### A. Property Briefings (`/property/[id]`)
- **Title:** The true building or unit name (e.g., `One E-Com Center`, `Cyber Sigma Tower 3`).
- **Lead Sentence:** Declarative summary: `[Floor Area] [Space Category] located in [District, City].`
- **Specs List:** Grouped clearly: Floor area (sqm), Floor level, Building grade, Fit-out condition, Title status, Parking allocation.
- **Your Move Section:** Honest legal statement that ScoutIt does not broker or handle escrow; financial terms and viewings happen directly with retained licensed professionals.

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
