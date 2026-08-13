<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🤖 MASTER AI SYSTEM PROMPT
**ATTENTION ALL AI AGENTS:** If you are reading this, you are working on the **ScoutIt Space Intelligence Platform**. You must adhere to the following strict architectural and design rules at all times.

## 1. PROJECT IDENTITY & DESIGN DNA
- **What this is:** ScoutIt is a premium, ultra-luxury commercial and residential real estate directory. Do not treat it as a generic property app.
- **The Design Rule:** You must ALWAYS use Dark Mode. The visual aesthetic is 95% deep black (`#0d0d0d`, `#121212`) and 5% glowing gold accents. Gold system (refined June 26 2026 — warmer amber, less yellow): primary gold `#E8AE3C` (`--accent`), interactive gold `#F7C64E` (`--accent-bright`, for buttons/CTAs/hover), muted gold `#6E531A` (`--accent-muted`, for borders/dividers). Glow rgb tuples: `232, 174, 60` / `247, 198, 78`. Always use the CSS variables, never raw hex.
- **Typography:** Always use uppercase, spaced-out, mono-spaced fonts (`var(--font-mono)`) for small labels, buttons, and system metrics.
- **Feel:** Use glassmorphism (`backdrop-filter: blur`), subtle micro-animations, and high-end cinematic visuals. **Never output generic white/blue Bootstrap-style components.**

## 2. THE DUAL-CMS GOLDEN RULE
ScoutIt uses two separate databases for two different jobs. **Do not mix them up.**
1. **AIRTABLE = Public Read-Only Content.** All public properties, articles, and brokers displayed on the website are fetched from Airtable via the central proxy `src/app/api/cms/route.js`.
2. **SUPABASE = Private User Data & Submissions.** Supabase handles User Authentication and stores private dashboard state (saved properties). When an Owner submits a new property via the Dashboard, it goes to Supabase, NOT Airtable.
3. **The bridge (publish):** when an owner PUBLISHES, `/api/dashboard/publish` syncs the Supabase row to Airtable automatically. Airtable's `Slug` is currently a **formula field** (computed from Title, not writable), so Airtable is the source of the **first-publication canonical slug**. Read that initial slug back and save it to Supabase. After first publication the public URL is owner-locked and must never change silently when the display title changes. The current formula still recomputes on Title edits; until the schema supports an immutable canonical slug, block live title edits or use a staff-controlled migration with slug history and a permanent redirect. Never write `Slug` in an Airtable payload, invent an app-side published slug, recycle a former slug, or discard an old URL mapping (slug drift broke the Contact button on 3 live properties; fixed 2026-07-11).
4. **Publishing authority:** the owner is the primary source of truth. Owner-authored manual, advanced, and owner-reviewed CSV listings publish after owner attestation without staff approval. If ScoutIt creates the structured listing from an owner PDF, that PDF-assisted draft alone must be verified against the source document before publication. Later owner edits publish directly and enter background audit/freshness checks.

## 3. MAPBOX & GEOCODING
- Owners do not manually type Coordinates into Airtable.
- The `api/cms/route.js` proxy intercepts string locations (e.g., "BGC, Taguig") and automatically dynamically geocodes them using the **Mapbox Geocoding API** behind the scenes.
- Radius Filters on the frontend use a custom mathematical **Haversine Distance Formula** inside the Javascript API route to filter Airtable data locally.

## 4. CRITICAL DOCUMENTATION
Before writing complex code or modifying data structures, you must immediately read:
- `_SCOUTIT_BRAIN/02_ARCHITECTURE_AND_STRUCTURE/STRUCTURE.md` for the folder and architecture map.
- `_SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/DATA_DICTIONARY.md` for exact Airtable/Supabase column schemas.
- `_SCOUTIT_BRAIN/07_FEATURES_AND_FLOWS/USER_FLOWS.md` for how the pages connect and user psychology.

> All knowledge/strategy/handoff docs now live in ONE home: `_SCOUTIT_BRAIN/`. Start at
> `_SCOUTIT_BRAIN/00_START_HERE.md`. (Consolidated 2026-06-24 — root/docs/automations no longer hold doc copies.)
