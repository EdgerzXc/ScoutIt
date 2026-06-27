# Origin-Story Scrollytelling — Full Spec (PARKED)

> **Status: DESIGNED & PARKED (2026-06-26).** Not being built yet — the owner chose to
> defer until he's more comfortable with the complexity (full Three.js cinematic is a big lift).
> Everything needed to build it later is captured here. Nothing about it has been coded.
>
> When you resume: read this top-to-bottom, then start at **Phase A (graybox)** under "Build plan."

---

## 1. The concept (one paragraph)

A cinematic, scroll-driven origin story that plays **only when the user clicks the UFO** on the
homepage. It rhymes the origin of the universe with the origin of ScoutIt: big bang → civilization →
real estate → **the gap** (the broken, joyless, untrustworthy market) → **ScoutIt** (the answer) →
a real **descent** through the six layers (Orbit → Stratosphere → Metropolis → Crust → Mantle → Core)
→ the core ignites and collapses into a **black hole**, which **is** the existing event-horizon hero.
The story ends exactly where the product begins. Scroll down = descend; scroll up = rewind.

**Why it matters:** in ~30 seconds of scrolling a first-timer goes from "what is this?" to
"they're the intelligence layer for space — everyone else is just listings." It teaches mission +
differentiator + the B2B2C structure with zero bullet points, and it's inherently shareable.

---

## 2. Locked decisions

| Decision | Ruling |
|---|---|
| Trigger | **UFO click only** (opt-in). Keeps first-load fast; this is the "learn about us" deep-dive. |
| Ending | **Resolves into the live hero** (re-use the existing event-horizon canvas — do NOT rebuild it). |
| Render tech | **Full Three.js cinematic** — owner's call: "our only chance to make it go big / unordinary." |
| Architecture | **One continuous 3D world**, scroll-scrubbed camera descending a path. NOT 7 separate canvases. |
| Palette | **Black & gold only.** 95/5 holds. Gold = the only light. No blue/purple nebula clichés. |
| Term | **"Spatial commerce"** (never "e-commerce" — conflicts with RA 9646 "Transactions Never"). |
| Text | **Bright gold `#F7C64E`**, rendered as **HTML overlay** (not 3D text), in a calm darkened pocket. |
| Performance | **Lite Mode = static poster reel** fallback (no live 3D on weak phones). Always skippable. |
| The UFO | Stays. Always. |

---

## 3. The narrative arc / storyboard

Top of scroll = big bang. Bottom = the live hero. Five acts:

- **Act 1 · Origin** — fast 3-beat sweep (big bang → civilization → space becomes value).
- **Act 2 · The Gap** — the problem: chaos, distrust, fake listings, and lost wonder.
- **Act 3 · ScoutIt** — the turn: order forms, inspiration + inclusivity, the promise.
- **Act 4 · The Descent** — the six layers, one beat each (the real descending mechanic).
- **Act 5 · Ignition → Hero** — core brightens → collapses → black-hole burst → lands in the live hero.

---

## 4. THE FULL SCRIPT (every on-screen line — APPROVED by owner)

Tight, serif, one beat per scroll-step. Bright gold. The inspiration + inclusivity thread is woven
into Acts 2–3 at the owner's request (browsing became joyless; every space — small, grand, humble,
rare — is welcome and shown at its best).

**ACT 1 · Origin** *(fast sweep)*
1. "It begins with nothing."
2. "Then — everything."
3. "People came. People needed space."
4. "And space became the most valuable thing we trade."

**ACT 2 · The Gap** *(chaos + lost wonder — names the problem, never blames brokers/owners)*
5. "But somewhere, finding it broke."
6. "Listings you can't trust. Prices that don't add up."
7. "Searching became a chore. The wonder was gone."
8. "A whole market — running on noise instead of signal."

**ACT 3 · ScoutIt** *(order, inspiration, inclusivity)*
9. "So we built the missing layer."
10. "ScoutIt — the Philippines' first spatial commerce platform."
11. "Where every space is seen at its best. The small and the grand. The humble and the rare."
12. "No fake listings. No pressure. Just real signals — and the wonder, back."

**ACT 4 · The Descent** *(six layers, one beat each)*
13. **Orbit** — "First, the board. What the country is watching."
14. **Stratosphere** — "Then the stories — signals before they touch the ground."
15. **Metropolis** — "Every kind of space — home, office, venue, table. One product."
16. **Crust** — "The people you can trust. Verified, rated only by results."
17. **Mantle** — "The deep archive holding it all up."
18. **Core** — "Until it becomes yours."

**ACT 5 · Ignition → Hero** *(the money shot)*
19. "Everything we know about space —"
20. "— in one place." *(core collapses → black-hole burst)*
21. *(resolves into the live hero)* "Welcome to ScoutIt."

> Optional owner idea to consider for line 11: make the inclusivity even more local —
> *"A townhouse in Cavite, a tower in BGC — both belong here."*

---

## 5. Visual mood & direction

- **Look:** deep black void + a **gold Magellanic cloud** (irregular, soft, billowing — a dwarf-galaxy
  shape, not a neat spiral). Scattered gold/white stars. Cinematic, premium, unmistakably ours.
- **Bright-gold serif headlines** sit in a **calm darkened pocket** (vignette) so the busy gas frames
  the words instead of fighting them. The gas is loud at the edges, quiet where you read.
- A static SVG mood frame was shown to the owner and approved as the target feel (black, gold nebula
  upper-right + wisp lower-left, stars, bright-gold headline "It begins with nothing.").

### How it MOVES (never a static background) — five stacked layers
1. **Starfield → parallax.** Thousands of points at varying depths; near stars slide fast, far stars
   barely move as the camera descends. This is the #1 "deep space" trick.
2. **Gold gas → living cloud.** Generated with **flowing/curl noise in a shader** (same math as smoke/
   fire) so it billows and curls on its own, forever. 2–3 cloud layers at different depths drift at
   different speeds.
3. **Bloom.** Soft glow halo on bright gold cores — the "expensive" cinematic look.
4. **Drift + life.** Gentle rotation, dust streaks, occasional comet, barely-there camera sway.
5. **Depth fog** into near-black so far things fade — feels infinite, not a box.

**Two motion engines run at once:** *scroll* drives the camera descending (the story); *time* drives
gas/twinkle/drift (the life). Stop scrolling → it still breathes. Scroll → you fall.

---

## 6. Technical approach (Council Pro's "better route")

> Go big — but disciplined. **One continuous Three.js world**, scroll-scrubbed camera flying a path
> from big-bang → gap → ScoutIt → six layers → core, then **dissolve the core directly into the
> existing event-horizon hero canvas**. Build **graybox-first**. Lite Mode = static poster reel.

### Performance non-negotiables (so "full 3D" survives a ₱8k Android)
- One WebGL context, one render loop (never 7 scene swaps).
- Instanced/`Points` particles; LOD by scroll-depth (fewer particles when not featured).
- `powerPreference: "high-performance"`; pause render when tab hidden / not in viewport.
- Bloom is the heaviest pass — scale it down or drop it on mobile.
- **Lite Mode** (already built: `src/lib/liteMode.js`) → show a curated static poster sequence, not live 3D.
- Always-visible **Skip** control → exits straight to the hero.

### Building blocks that already exist in the repo (reuse, don't rebuild)
- `src/components/scrollytelling/DescentSequence.js` — current UFO-click overlay (the mechanic to evolve).
- `src/components/descent/Background{Orbit,Stratosphere,Metropolis,Crust,Mantle,Core}.js` — the six
  layer scenes (mostly Three.js; Stratosphere is CSS) → source material for the descent acts.
- The homepage **event-horizon canvas** in `src/app/page.js` (2D) — the black-hole **ending**.
- `src/app/descent/page.js` — existing descent page.
- UFO click handler is in `src/app/page.js` (`fireBeam` → `setDescentActive(true)` → renders `DescentSequence`).

---

## 7. Build plan (phased — start here when resuming)

- **Phase A — Graybox.** A scrollable skeleton: real text (Section 4) + the real camera descent, **no
  art**. Goal: feel the pacing and the fall before painting anything. Lock scroll length + beat timing.
- **Phase B — Paint the acts.** Drop in visuals act by act: starfield+parallax → gold gas shader →
  bloom → the gap's fracture/rift → ScoutIt's "order from chaos" → the six descent layers.
- **Phase C — The hero hand-off.** The core collapse → black-hole burst → seamless dissolve into the
  live event-horizon hero. (This single transition is ~half the polish budget — get it perfect.)
- **Phase D — Lite Mode + Skip + mobile.** Static poster fallback, skip button, touch-scroll tuning,
  reduced-motion respect.
- **Phase E — Polish.** Easing, timing, audio (optional), OG share poster.

---

## 8. Connectors / external help

- **Nothing needed to start.** The entire cosmic look is **procedural Three.js** (math + shaders) —
  no external assets required for the graybox or the core look.
- **Later, optional:** for extra richness (a nebula skybox/HDRI, a city-lights texture, a planet
  surface), a **Gemini / Google Labs image-generation connector** would help generate textures.
  Flag the owner when we reach Phase B and decide we want custom textures. (The connected **Stitch**
  tool is for UI mockups, not 3D — not useful here.)

---

## 9. Open questions to confirm before building

1. Line 11 wording — keep generic ("small/grand/humble/rare") or localize ("townhouse in Cavite,
   tower in BGC")?
2. Audio? A subtle ambient drone + one swell at the black-hole burst is a big upgrade, but optional.
3. Does the descent reuse the actual `Background*` scenes, or stylized cosmic stand-ins for continuity?
   (Pro leans: stylized stand-ins inside the one continuous world, for seamlessness.)
4. First-time auto-play vs strictly UFO-only forever? (Currently locked: UFO-only.)

---

## 10. Council record (who decided what)

- **Strategist:** category creation made visible; keep UFO-gated. Endorsed.
- **Advocate:** the inspiration/lost-wonder thread is the heartbeat; inclusivity beat at the center.
- **Operator:** must be skippable and hand off to a CTA (the hero). Brand, not conversion.
- **Builder:** one continuous world, not 7 canvases. Biggest build to date.
- **Arbiter:** OK vs locked rules given Lite fallback + "spatial commerce" + UFO survive.
- **Brand & Voice:** short serif lines, black-heavy, gold once per beat.
- **Motion & Cinematics:** never cut — one unbroken camera descent; the core→hero transition is the money shot.
- **Performance:** full 3D is safe only with one scene + instancing + LOD + Lite poster fallback.
- **Growth:** shareable asset; add an OG poster + "share the descent" later.
- **★ Council Pro:** "Go big the disciplined way" — one continuous Three.js world, scroll-scrubbed
  camera, reuse the hero, graybox-first, Lite poster fallback. **This is the better route.**
