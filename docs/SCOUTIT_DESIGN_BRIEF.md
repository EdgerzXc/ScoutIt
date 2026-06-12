# ScoutIt — Design & Experience Brief

> One-stop orientation for any AI agent or designer working on ScoutIt.
> Read this first. It explains **what the product is for**, the **visual DNA**,
> the **UX model**, and **how the site is structured**.
>
> Companion docs:
> - `STRUCTURE.md` — plain-English folder/file map of the whole repo.
> - `AGENTS.md` — ⚠️ this is a *modified* Next.js (16.2.7); check
>   `node_modules/next/dist/docs/` before writing framework code.
> - `PROPERTY_ARCHITECTURE.md`, `SCOUTIT_AIRTABLE_SOP.md` — deep dives.
> - `docs/scrollytelling-mission-text.md` — locked copy for the manifesto build.

---

## 1. What ScoutIt is (the purpose)

**ScoutIt is a "Space Intelligence" platform for Philippine real estate.** It
reframes property hunting away from pressure-driven listing sites and toward an
**editorial archive** — turning raw listings into intelligent, briefing-style
content (architectural DNA, design history, location narratives, market intel).

**Tagline:** *"Get lost in spaces that actually inspire you."*
**Positioning line:** SPACE · INTELLIGENCE · TECHNOLOGY.

### Who it's for
- **Dreamers / buyers** — people who want to *feel* a space, not just scan specs.
- **Investors** — who need real market signals, not hype.
- **Researchers** — who want location intelligence and data.
- **The ecosystem** — brokers, photographers, researchers, event planners —
  connected in one place (described as "the first of its kind in the Philippines").

### Core product beliefs (the manifesto)
- A home is more than a spec sheet — it's where life unfolds.
- No guesswork, no gatekeeping: every signal and data point is surfaced.
- Privacy-first: the user's wishlist ("the Ledger") lives **on their device**
  (LocalStorage), with zero server tracking.
- Operations governed by **RA 9646** (PH Real Estate Service Act).

---

## 2. Visual DNA (the brand look)

The single most important aesthetic rule:

> **~95% darkness, ~5% gold.** Gold should feel *rare*, like a precious accent —
> never a constant wash. This is what makes the brand read as luxury.

**Mood words:** premium · mysterious · confident · editorial · architectural ·
cinematic *in restraint*. Motion is **slow and intentional** — luxury moves
slower. Glow is **localized**, never "glowing fog everywhere."

### Color tokens (from `src/app/globals.css` — use the CSS variables, never raw hex)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0e0e0e` | Page canvas (near-black) |
| `--surface` / `--surface2` / `--surface3` | `#161616` / `#1e1e1e` / `#242424` | Raised panels, cards |
| `--border` / `--border-mid` / `--border-solid` | `rgba(255,255,255,.07)` / `.13` / `#262626` | Hairline dividers |
| `--text-primary` | `#f0ede8` (warm off-white) | Headlines, body |
| `--text-secondary` | `rgba(240,237,232,.62)` | Subcopy |
| `--text-muted` | `rgba(240,237,232,.38)` | Captions, hints |
| `--accent` | `#c8a96e` (**champagne gold**) | The signature accent |
| `--accent-rgb` | `200, 169, 110` | For inline `rgba()` |
| `--accent-dim` / `--accent-border` | `rgba(200,169,110,.12)` / `.28` | Gold fills/borders |
| `--green` `--yellow` `--red` | `#4caf7d` `#e8c84a` `#e8644a` | Semantic states (+ `-dim` variants) |
| `--brand` / `--brand-overlay` | `#1a1814` / `rgba(12,11,9,.92)` | Deep brand surfaces/overlays |

### Typography
- `--font-display`: **Georgia, serif** — big editorial headlines (e.g. "The Board").
- `--font-body`: **Geist Sans** (`next/font`) — UI and body copy.
- `--font-mono`: **Geist Mono** — labels, eyebrows, data (e.g. `LAYER 01 //`).
- Eyebrow/label convention: **mono, uppercase, wide letter-spacing** (~0.3–0.45em),
  gold-tinted. Headlines: serif, large, near-white.

### Spacing / radius / motion (tokens)
- Spacing scale: `--space-xs..3xl` = 4 / 8 / 16 / 24 / 32 / 48 / 64 px.
- Radius: `--radius-sm..xl` = 3 / 4 / 6 / 12 px, `--radius-pill` 20, `--radius-full` 50%.
- Motion: `--transition` 0.38s, `-fast` 0.25s, `-slow` 0.6s, all
  `cubic-bezier(0.4,0,0.2,1)`.
- Shadows: `--shadow-sm/md/lg` + `--shadow-glow` (soft gold halo).

### Signature visual elements
- **Cosmic event-horizon hero** — a `<canvas>` "pull field": ~150 twinkling
  stars, glowing bodies spiraling inward, dust, comets with gold tails,
  breathing rings, a black-hole darkness pulse, and a gold core. (Not a photo.)
- **Film grain overlay** — `.grain` fixed layer at `z-index:9999`, opacity ~0.03
  (in `globals.css` + `layout.js`), gives everything a filmic texture.
- **The UFO** — a clickable SVG saucer with green portholes that fires a gold
  **tractor beam** onto the **ScoutIT wordmark** (white "Scout" + gold "IT").
- **Champagne-gold accents** on outline buttons, eyebrows, active states.

---

## 3. UX model (how the site behaves)

### The homepage is a vertical "descent" through numbered Layers
The homepage (`src/app/page.js`) is **one full-screen, scroll-snapping journey**.
Each section announces itself with a mono eyebrow `LAYER 0X // …`. This narrative
spine ("descend through the intelligence") is the heart of the brand experience.

> ⚠️ **Scroll-snap caution (learned the hard way):** the scroll container uses
> `scroll-snap-type: y proximity` and must **never** use `mandatory` or
> `scroll-behavior: smooth` — that combination froze rendering for 30s+ on wheel
> scroll. The hero canvas also pauses (IntersectionObserver) when off-screen.

### Homepage layers in order
| Section | Eyebrow | What it's for |
|---|---|---|
| **Hero** | SPACE · INTELLIGENCE · TECHNOLOGY | Identity + emotion. The cosmic hero, UFO beam, wordmark, tagline. |
| **The Board** | LAYER 01 // THE BOARD | A live leaderboard of most-inquired properties (a #01 "champion" + ranked list). "Raise the ceiling of PH real estate." → `/showcase` |
| **Curated Sectors** | LAYER 02 // PROPERTY EXPERIENCES | Category menu (Residential / Commercial / STR / Hospitality / Restaurants / Venues) + searchable preview cards. → property detail pages |
| **Discovery Feed** | LAYER 03 // DISCOVERY & INTELLIGENCE | Property spotlights, linked intel articles, news & stories, curated collections. → `/discover`, `/intel` |
| **Ecosystem Services** | LAYER 04 // ECOSYSTEM SERVICES | The vetted professional network (advisors LIVE; photographers/researchers/event design "coming soon"). |
| **Your Board** | LAYER 05 // YOUR BOARD | The personal "Ledger" — a privacy-first wishlist with 4 reaction tags (Potential Fit / Interested / Inspired Me / Save), stored on-device. → `/wishlist` |
| **About** | LAYER 06 // ABOUT US | The manifesto. → `/about` |
| Footer | — | Platform / Services / Company columns, RA 9646 notice. |

### Key interaction patterns
- **Category tabs** drive live-filtered preview streams (Residential, etc.).
- **Reaction tags** ("Ledger") let users mark properties; persisted in
  LocalStorage (no account, no cloud).
- **Outline-gold CTAs** ("SEE THE SHOWCASE →", "BEGIN EXPLORING →") are the
  consistent call-to-action style.
- **Scroll position is remembered** across navigation (sessionStorage), so users
  return to where they were.

---

## 4. Information architecture (routes)

App Router — folders in `src/app/` are URLs. `[slug]`/`[id]` = detail pages.

| Route | Purpose |
|---|---|
| `/` | Homepage descent (all layers above). |
| `/about` | Full manifesto / story. |
| `/discover` (+ `DiscoverClient.js`) | Discovery hub. |
| `/intel` , `/intel/[article-slug]` | Editorial intel articles. |
| `/property` , `/property/[id]` | Property briefings (deep editorial pages). |
| `/property/[id]/brokers` | Brokers attached to a property. |
| `/showcase` | The ranked board / showcase stage. |
| `/dashboard` | User dashboard. |
| `/wishlist` | The Ledger (saved properties). |
| `/brokers` , `/brokers/[broker-slug]` , `/brokers/portal` | Broker listings/profiles + portal. |
| `/photographers` , `/researchers` , `/event-planners` (+ `[slug]`) | Ecosystem service rosters + profiles. |
| `/api/cms` , `/api/reactions` , `/api/showcase` | Backend endpoints. |

---

## 5. Component & data structure

### Components — `src/components/` (grouped by purpose)
- **`layout/`** — `Header` (top nav), `Footer`.
- **`ui/`** — `ReactionButtons` (the Ledger tags), `EarlyAccessGate`.
- **`board/`** — `BoardPodium` (ranked leaderboard), `ShowcaseStage`.
- **`connection/`** — `ConnectionPortal`, `ServiceConnectionPortal`
  (the "get in touch" panels on detail pages).
- **`property/`** — property-detail building blocks: `InteractiveMap`,
  `LedgerButtons`, `EcosystemActionBar`, `CommercialFlow`,
  `ResidentialScrollytelling`, `chapterConfig`.
- **`cinematic/`** — `CinematicJourney` (currently dormant in the hero beam flow).
- **`scrollytelling/`** — `DescentSequence` (the new manifesto build — see §6).

### Data — `src/data/` (mock + fallback content)
`mockProperties`, `mockArticles`, `mockBrokers`, `mockPhotographers`,
`mockResearchers`, `mockEventPlanners`, `mockShowcase`. Pages render instantly
from these, then merge live Airtable data on top.

### Live content — `src/lib/`
- `airtable.js` — fetches the Airtable CMS via `/api/cms`.
- `regions.js` — maps cities → regions.
- **Note:** locally Airtable returns 401 (no key) and the site **falls back to
  mock data** — this is expected, not a bug.

### Tech stack
Next.js **16.2.7** (App Router, Turbopack) · React 19 · plain JavaScript ·
CSS via design tokens (no Tailwind) · Airtable CMS w/ mock fallback ·
deployed on Vercel (repo `EdgerzXc/ScoutIt`, `origin/main`).

---

## 6. In-progress: the Scrollytelling Manifesto ("Descent")

**Goal:** a cinematic, wow-factor moment that also *teaches new users what ScoutIt
is*. Lives on the homepage (in place — not a separate route).

**Flow:** click the UFO → gold beam fires → background deepens to near-black while
the homepage stays faintly visible → a **molten-gold crack** (the user's asset
`reference/golden liquid.jpeg`, served from `public/scrollytelling/`) grows along
its diagonal as you scroll → at each node, one **mission message** ignites
("The Board", "Property Intelligence", "Discovery", "The Ecosystem", "The Ledger",
then the finale "This Was Never About Us / It was always about you") → hands off
to `/about`. Scrubbing back up reverses everything.

**Architecture (important):** a **single `progress` value 0→1** (accumulated from
wheel/touch) drives *every* visual — darkness, gold reveal, glow, node reveals,
finale. This is what makes reverse-scrubbing free of bugs. Built in **2D
(CSS/SVG/canvas)** — **not** React Three Fiber (too heavy, and the failure mode of
WebGL is the exact "glowing fog" the brand bans).

**Design rules carried in:** 95% black / 5% gold · localized bloom (the crack
glows, not the screen) · slow heavy motion · the centerpiece visual comes from a
**user-supplied reference**, never AI-invented (a hard rule after an earlier failed
"laser/kintsugi" attempt). Mobile gets a **simplified** version.

**Locked copy:** `docs/scrollytelling-mission-text.md`.
**Component:** `src/components/scrollytelling/DescentSequence.js` (lazy-loaded,
zero cost until the UFO is clicked).

---

## 7. Working principles for agents on this project

1. **Commit at clean checkpoints; build features on branches.** Uncommitted mess
   is what caused past pain. `main` must stay deployable. Never push to Vercel
   (i.e. to `main`) without asking — the owner is non-technical.
2. **Verify every route still returns 200** after changes; the homepage hero and
   scroll must stay smooth (see the scroll-snap caution in §3).
3. **The owner is non-technical** — explain in plain language, do the heavy
   lifting, and show visuals rather than asking them to read code.
4. **Never invent the centerpiece visual** — it comes from the owner's reference
   photos in `reference/` (git-ignored, never deployed).
5. **Respect the 95/5 gold rule and slow, restrained motion** in anything new.
