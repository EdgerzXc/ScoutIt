# Product

## Register

brand

## Users

Buyers/seekers, brokers, property owners, and ecosystem providers (photographers, researchers,
event designers) across the Philippines evaluating premium residential, commercial, STR,
hospitality, restaurant, and event space. They arrive asking "can I trust this enough to act,"
not just "show me listings" — the design has to earn credibility, not just display inventory.

## Product Purpose

ScoutIt is the Philippines' first spatial commerce platform — an intelligence layer over six space
categories, not a listings board. Buyers get editorial-grade property intelligence (verified data,
flood risk, market signals); brokers/owners get a professional toolset (delegation, notifications,
Mission Control). Success means becoming the trusted category-defining standard for how premium PH
space gets scouted — not just another directory competing on inventory count.

## Brand Personality

Intelligent, Luxury, New. Confident and data-fluent, and deliberately category-defining rather than
derivative — the site should read as inventing its own genre ("Bloomberg for space"), not as a
polished version of an existing real-estate template.

## Anti-references

- **Generic PH listing sites** (Lamudi/Zillow-style directory boards) — ScoutIt is intelligence,
  not a listings board; avoid anything that reads as "just another directory."
- **"Common luxury real estate" cliché** — gold-and-marble old-money tropes, ornate serif-everywhere,
  stock-photo-mansion aesthetic. The brand wants to feel NEW and category-breaking, not like a
  conventional luxury template.
- **Generic AI-template SaaS defaults** — gradient hero, cream/sand backgrounds, identical card
  grids, an uppercase eyebrow above every section used as reflex rather than intent.

## Design Principles

1. **Category-defining, not derivative** — the design should feel like it's establishing the
   standard for PH spatial commerce, not imitating existing real-estate sites.
2. **Intelligence over persuasion** — data-dense signals (flood risk, market intel, verification
   badges) are part of the aesthetic, not an afterthought bolted onto a pretty template.
3. **Restraint carries luxury** — 95% near-black / 5% gold is a deliberate discipline (locked in
   `AGENTS.md`); luxury is expressed through restraint and precision, not ornamentation.
4. **Register per surface, not one blanket rule** — the public/marketing site (homepage, property
   pages, `/enterprise`, `/pricing`) is brand register; the dashboard (owner/broker/operator tools)
   is product register. Name the surface explicitly when invoking a command (e.g.
   `/impeccable critique dashboard` vs `/impeccable critique property page`) rather than relying on
   this file's single default.
5. **Deliberate signature systems survive the anti-pattern bans** — the mono-uppercase chapter
   eyebrows (`01 — THE SPACE`) and numbered chapter registry on property pages are a locked,
   consistent brand system (`AGENTS.md`), not reflexive AI scaffolding. Don't let generic
   anti-pattern guidance flatten them into something generic.

## Accessibility & Inclusion

WCAG AA baseline. No specialized accessibility requirements beyond that, but per the owner:
accessibility should serve the "new category standard" ambition — a genuinely usable site, not a
decoratively-premium one that happens to also check a box.

## Roadmap Notes (captured, not yet built)

Two initiatives approved-in-direction as of 2026-07-03, not yet implemented — full detail lives
in `_SCOUTIT_BRAIN`, not duplicated here:

- **Dashboard atmosphere overhaul** — the dashboard (product register, principle #4 above) is
  getting its own structural + atmospheric framework: mandatory Identity → Status → **Scout
  Insight** (AI-driven recommendations — the platform's core differentiator, without it ScoutIt
  reads as a CMS not an intelligence platform) → Workspace → per-role ambient atmosphere, still
  within the locked 95/5 black/gold system. Spec: `_SCOUTIT_BRAIN/03_DESIGN/
  DASHBOARD_ATMOSPHERE_FRAMEWORK.md`.
- **In-house CRM** — framed as "relationship intelligence, not contact management": lead stages,
  deal pipeline, notes, reminders, interaction history, follow-up recommendations, evaluated
  through a "Workflow Gravity" lens (does it drive Entry/Dependency/Workflow-Centralization/
  Network-Lock-in/Intelligence-Quality). Not a CRM-feature-parity play. Spec:
  `_SCOUTIT_BRAIN/08_OPERATIONS_AND_BACKLOG/CRM_INITIATIVE.md`.
