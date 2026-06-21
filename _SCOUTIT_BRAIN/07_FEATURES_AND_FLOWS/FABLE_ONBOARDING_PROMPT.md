# Onboarding prompt — paste this into a fresh agent session

Copy everything in the box below into a new chat to fully orient an agent on ScoutIt.

---

You're joining the **ScoutIt** project (a "Space Intelligence" platform for
Philippine real estate). Before doing anything, read these files in this order
and tell me, in plain language, that you understand the product, its design, and
the current task. **Do not write or change any code yet.**

Read, in order:
1. `docs/SCOUTIT_DESIGN_BRIEF.md` — the master overview: what the site is for,
   the visual DNA (95% black / 5% gold, exact tokens), the UX "descent through
   Layers" model, every route, and the in-progress scrollytelling manifesto.
2. `STRUCTURE.md` — plain-English map of every folder and file.
3. `AGENTS.md` — ⚠️ this is a **modified** Next.js (16.2.7); check
   `node_modules/next/dist/docs/` before writing framework code.
4. `docs/scrollytelling-mission-text.md` — the six locked manifesto messages.
5. `src/components/scrollytelling/DescentSequence.js` — the current build.
6. `src/app/page.js` — the homepage (how the descent is triggered + the Layers).
7. `src/app/globals.css` — the design tokens.

Hard rules you must follow:
- **The owner is non-technical.** Explain in plain language, do the heavy
  lifting, and show visuals/previews rather than asking them to read code.
- **Never push to `main` / deploy to Vercel without asking.** Build features on a
  branch; keep `main` deployable. The live site is `scoutit.vercel.app`.
- **Never invent the centerpiece visual** — it comes from the owner's reference
  photos in `reference/` (the gold asset is `reference/golden liquid.jpeg`,
  served from `public/scrollytelling/golden-liquid.jpeg`).
- **Respect the brand:** 95% darkness / 5% gold, localized glow (never "glowing
  fog"), slow and restrained motion. Build in 2D (CSS/SVG/canvas), **not** React
  Three Fiber.
- **Don't re-break scrolling:** the homepage scroll container must stay
  `scroll-snap-type: y proximity` with **no** `scroll-behavior: smooth` and
  **no** `mandatory` snap (that combo froze rendering). After changes, verify
  every route returns 200 and the hero scrolls smoothly.

Current task / where we are:
- Branch `feature/scrollytelling-descent` (NOT merged). Building the
  scrollytelling manifesto: UFO click → darkening descent → molten-gold crack
  reveal (driven by a single `progress` 0→1 value) → six mission messages ignite
  at nodes → finale → `/about`. Stages 1–2 (descent + gold reveal + molten
  motion) are done; **Stage 3 (the six mission messages igniting along the
  crack) and Stage 4 (the finale) are next.**

After you've read everything, summarize back: (1) what ScoutIt is for, (2) the
visual/UX rules, and (3) what Stage 3 needs to do — then wait for my go-ahead.

---
