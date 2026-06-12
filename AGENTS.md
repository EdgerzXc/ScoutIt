<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 MASTER AI SYSTEM PROMPT
**ATTENTION ALL AI AGENTS:** If you are reading this, you are working on the **ScoutIt Space Intelligence Platform**. You must adhere to the following strict architectural and design rules at all times.

## 1. PROJECT IDENTITY & DESIGN DNA
- **What this is:** ScoutIt is a premium, ultra-luxury commercial and residential real estate directory. Do not treat it as a generic property app.
- **The Design Rule:** You must ALWAYS use Dark Mode. The visual aesthetic is 95% deep black (`#0d0d0d`, `#121212`) and 5% glowing gold accents (`#c8a96e`).
- **Typography:** Always use uppercase, spaced-out, mono-spaced fonts (`var(--font-mono)`) for small labels, buttons, and system metrics. 
- **Feel:** Use glassmorphism (`backdrop-filter: blur`), subtle micro-animations, and high-end cinematic visuals. **Never output generic white/blue Bootstrap-style components.**

## 2. THE DUAL-CMS GOLDEN RULE
ScoutIt uses two separate databases for two different jobs. **Do not mix them up.**
1. **AIRTABLE = Public Read-Only Content.** All public properties, articles, and brokers displayed on the website are fetched from Airtable via the central proxy `src/app/api/cms/route.js`.
2. **SUPABASE = Private User Data & Submissions.** Supabase handles User Authentication and stores private dashboard state (saved properties). When an Owner submits a new property via the Dashboard, it goes to Supabase, NOT Airtable.

## 3. MAPBOX & GEOCODING
- Owners do not manually type Coordinates into Airtable.
- The `api/cms/route.js` proxy intercepts string locations (e.g., "BGC, Taguig") and automatically dynamically geocodes them using the **Mapbox Geocoding API** behind the scenes.
- Radius Filters on the frontend use a custom mathematical **Haversine Distance Formula** inside the Javascript API route to filter Airtable data locally.

## 4. CRITICAL DOCUMENTATION
Before writing complex code or modifying data structures, you must immediately read:
- `STRUCTURE.md` for the folder and architecture map.
- `docs/DATA_DICTIONARY.md` for exact Airtable/Supabase column schemas.
- `docs/USER_FLOWS.md` for how the pages connect and user psychology.
