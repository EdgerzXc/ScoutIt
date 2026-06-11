# ScoutIt — Master Folder Structure

Plain-English guide to what every folder and file is for. This is the **one
master folder** used by both AIs (Claude Code and Antigravity). When either
AI opens the project, it opens **this folder** (`C:\Users\jerze\ScoutIt`).

---

## The two files that tell the AIs who they are

| File | Who reads it | What it's for |
|---|---|---|
| **`AGENTS.md`** | Both AIs (shared) | The shared brain — facts BOTH must know about this project (it's a modified Next.js; read the local docs before coding; etc.). |
| **`CLAUDE.md`** | Claude only | Claude's own instructions. Right now it just imports `AGENTS.md`, so Claude reads the shared facts. Add Claude-specific rules here. |

> Antigravity keeps *its* own rules inside Antigravity's settings, separate
> from these. The shared truth both agents shoud agree on lives in `AGENTS.md`.

---

## Top-level files

| File | What it is |
|---|---|
| `package.json` | The project's ID card: its name, scripts (`npm run dev`, `build`, `start`), and list of dependencies. |
| `package-lock.json` | Exact locked versions of every dependency. Don't edit by hand. |
| `next.config.mjs` | Next.js configuration (currently minimal). |
| `jsconfig.json` | Sets up the `@/` shortcut so imports like `@/components/...` point at `src/`. |
| `eslint.config.mjs` | Code-style/linting rules. |
| `vercel.json` | Settings for the Vercel deployment. |
| `.gitignore` | Lists files git should NOT track (node_modules, build output, the `reference/` photos, secrets). |
| `README.md` | Standard project readme. |
| `STRUCTURE.md` | **This file.** |
| `PROPERTY_ARCHITECTURE.md`, `SCOUTIT_AIRTABLE_SOP.md` | Existing project notes (property page design, Airtable how-to). |
| `structure.txt` | An older auto-generated tree dump (informational). |

---

## The website code — `src/`

This is the actual site. Next.js App Router: **folders inside `src/app/`
become URLs.**

### `src/app/` — pages & routes
- `layout.js` — the shell wrapped around every page (fonts, global CSS, the film-grain overlay).
- `page.js` — the **homepage** (the cosmic event-horizon hero + sections). Large file; its styles are self-contained.
- `globals.css` — site-wide design tokens: colors, fonts, spacing variables, resets. The shared style foundation.
- `about/page.js` — the manifesto page.
- `discover/`, `intel/`, `property/`, `showcase/`, `dashboard/`, `wishlist/` — the main sections. A folder named `[slug]` or `[id]` is a **detail page** (e.g. one property, one article).
- `brokers/`, `photographers/`, `researchers/`, `event-planners/` — the people/services, each with a listing page and `[slug]` detail pages.
- `api/` — backend endpoints (`cms`, `reactions`, `showcase`) the site calls for data.

### `src/components/` — reusable building blocks (organized by purpose)
- `layout/` — `Header` (the top nav, used across the site).
- `ui/` — small shared UI bits — `ReactionButtons`.
- `board/` — `BoardPodium`, `ShowcaseStage` (the ranked-board feature).
- `connection/` — `ConnectionPortal`, `ServiceConnectionPortal` (the "get in touch" panels on detail pages).
- `property/` — everything for property detail pages: `InteractiveMap`, `LedgerButtons`, `EcosystemActionBar`, `CommercialFlow`, `ResidentialScrollytelling`, `chapterConfig`.
- `scrollytelling/` — **reserved & empty.** The future scrollytelling build goes here. Kept empty so it can't collide with anything.

### `src/data/` — the content
`mockProperties`, `mockArticles`, `mockBrokers`, `mockPhotographers`,
`mockResearchers`, `mockEventPlanners`, `mockShowcase` — sample/fallback data
the pages show when the live Airtable CMS isn't reachable.

### `src/lib/` — helpers (no visuals)
- `airtable.js` — fetches live content from Airtable.
- `regions.js` — maps cities to regions.

### `src/hooks/` — reserved & empty
Custom React hooks will live here later (e.g. a `useScrollProgress` for the
scrollytelling build).

---

## Your stuff — `docs/` and `reference/`

| Folder | What goes in it |
|---|---|
| **`docs/`** | Your plans and prompts (the `SCOUTIT_*_PROMPT.md` files, notes). The "what we intend to build" paperwork. |
| **`reference/`** | **Your guide photos** for how things should look. Git-ignored (stays on your machine, never deployed). See `reference/README.md`. |

---

## Folders you can ignore (the machinery)

| Folder | What it is |
|---|---|
| `node_modules/` | All third-party code the project depends on. Huge, auto-installed by `npm install`, never edited or committed. |
| `.next/` | Build output the dev server generates. Disposable. |
| `.git/` | The full version history + the safety backup (`git stash`). This is what connects to GitHub and Vercel. |
| `public/` | Static files served as-is (images, icons). |
| `.claude/` | Local tooling config for Claude Code (e.g. how to launch the dev server). |

---

## How the two AIs should share this without fighting

1. **One agent at a time** finishes a chunk, then **commits it to git** (a clean checkpoint).
2. The other agent starts from that clean, committed state — no guessing what's finished vs. abandoned.
3. Optionally, each works on its own git **branch** and merges deliberately.
4. `AGENTS.md` is the only shared memory between them — keep it current.

> The mess that built up earlier came from *uncommitted* work being left
> behind. Committing at clean points is the fix.
