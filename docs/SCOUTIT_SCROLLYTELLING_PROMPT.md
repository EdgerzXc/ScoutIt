# SCOUTIT SCROLLYTELLING — MASTER BUILD PROMPT
# Copy everything below this line into Claude Code exactly as written.
# Do not modify, reorder, or summarize before pasting.
─────────────────────────────────────────────────────────────────────

Read CLAUDE.md and SCOUTIT_BRAND.md before touching any code.

We are building the ScoutIT scrollytelling experience as one new isolated component. Do not touch any existing files until you have presented a plan and I have approved it.

═══════════════════════════════════════
CONCEPT SUMMARY
═══════════════════════════════════════

The user clicks the UFO on the hero. A golden beam fires, the wordmark glows, and the page smooth-scrolls into a 600vh scrollytelling track. Inside the track, a gold kintsugi lightning crack grows downward as the user scrolls, blooming at 6 waypoints. At each waypoint a layer of text (label + title + one-line mission) scales up toward the user. Hazy particles drift around the crack and part around the pointer. A vignette frames everything. Six signature details finish the experience. At the end, a gold white-hole flash navigates to /about.

Everything inside the track is driven ONLY by scroll position. The click is just a cinematic entrance. Scrolling backward must reverse everything seamlessly.

═══════════════════════════════════════
STATE MODEL — understand this before writing a single line
═══════════════════════════════════════

Three states only:

1. IDLE — user is on the hero. Page background: #0e0e0e.
2. SCROLLY — scrollytelling track is in the viewport. Page background: #000000. ESC button visible. Telemetry HUD visible.
3. EXITING — white hole has fired. Navigation to /about pending. All input ignored.

State transitions:
- IDLE → SCROLLY: when the track enters the viewport. Use IntersectionObserver on the outer track div. NOT triggered by the click. This matters because a user can scroll into the track naturally without ever clicking the UFO. The experience must work identically either way.
- SCROLLY → IDLE: user scrolls back above the track, or clicks ESC.
- SCROLLY → EXITING: scroll progress reaches 1.0. Guard with a hasNavigated ref so navigation fires exactly once.

Background color transitions between #0e0e0e and #000000 over 0.6s ease — tied to state, never to the click.

═══════════════════════════════════════
ASSETS
═══════════════════════════════════════

Both already in /public:
- scout-ufo.png — hamster UFO mascot. CRITICAL: this PNG has residual white/gray around the dome. Apply style={{ mixBlendMode: 'screen' }} to the img element everywhere it appears. Do not attempt to edit or reprocess the image file.
- event-horizon.png — cosmic background for the track.

═══════════════════════════════════════
PHASE 0: HERO PREREQUISITE
Check this before anything else. Report findings before writing any code.
═══════════════════════════════════════

Inspect the hero component and report exactly what exists there.

The UFO may be missing — it was removed in a previous rollback. If it is missing, add it to the hero WITHOUT restructuring any existing hero code:
- Absolutely positioned img using scout-ufo.png
- Width 220–280px, centered horizontally
- Positioned in the upper-middle area, must not cover the wordmark
- style={{ mixBlendMode: 'screen' }}
- Idle animation: gentle vertical bob translateY 0 to -16px, 3.5s ease-in-out infinite, PLUS subtle rotate sway -3deg to 3deg, 5s ease-in-out infinite. Different durations so the motion feels organic, not robotic.
- cursor: pointer
- z-index above hero background, below any hero navigation

If the UFO already exists, do not touch it — only attach the click handler.

═══════════════════════════════════════
PHASE 1: THE CLICK TRIGGER (cinematic entrance only)
═══════════════════════════════════════

On UFO click, run this exact timed sequence. CSS class swaps and setTimeout chaining only. Zero animation libraries.

t=0ms      Add class "beam-firing" to a beam div absolutely positioned below the UFO. The beam is a vertical bar: gradient rgba(255,215,0,0.9) at top fading to transparent at bottom. Height grows from 0 to reach the wordmark over 400ms via CSS transition. Width pulses between 4px and 8px.

t=400ms    Add class "beam-hit" to the ScoutIT wordmark element: color #ffd700, text-shadow 0 0 24px rgba(255,215,0,0.8) and 0 0 80px rgba(212,175,55,0.4), letter-spacing pulses slightly. Run 3 pulses over 1.2s via CSS keyframes.

t=1600ms   Remove beam-firing class. Beam fades out over 300ms.

t=1800ms   window.scrollTo({ top: trackTopOffset, behavior: 'smooth' }) where trackTopOffset is the measured offsetTop of the outer track div.

The IntersectionObserver flips state to SCROLLY automatically when the track enters view. Do NOT set state from within the click handler.

Guard: if the user clicks the UFO while the sequence is already running, ignore the second click entirely.

═══════════════════════════════════════
PHASE 2: THE TRACK STRUCTURE
═══════════════════════════════════════

Outer div: id="scrolly-track", position relative, height 600vh, background #000000.
Inner div: the "camera" — position sticky, top 0, height 100vh, width 100%, overflow hidden.

useScrollProgress hook:
- progress = clamp((window.scrollY - trackTop) / (trackScrollHeight - viewportHeight), 0, 1)
- trackScrollHeight = track offsetHeight
- Listen to scroll with requestAnimationFrame throttling — one rAF per scroll event, not one per pixel
- Returns a number 0.0 to 1.0

Z-index stack inside the camera, bottom to top:
  z-index 0  — event-horizon.png background, object-fit cover, opacity 0.45 so pure black dominates
  z-index 1  — vignette overlay
  z-index 2  — particle field
  z-index 3  — kintsugi crack SVG
  z-index 4  — bloom glows
  z-index 5  — layer content
  z-index 9  — film grain overlay
  z-index 10 — white hole overlay

Outside the camera, position fixed:
  z-index 100 — ESC button (top right)
  z-index 100 — telemetry HUD (bottom left)

═══════════════════════════════════════
PHASE 3: PROGRESS MAP — single source of truth
═══════════════════════════════════════

Hardcode this as a constant. Every visual in the project reads from this and nothing else.

  Layer 1:    progress 0.00 – 0.15
  Layer 2:    progress 0.15 – 0.30
  Layer 3:    progress 0.30 – 0.45
  Layer 4:    progress 0.45 – 0.60
  Layer 5:    progress 0.60 – 0.75
  Layer 6:    progress 0.75 – 0.90
  White hole: progress 0.90 – 1.00

Within each layer's slice, three sub-phases:
- ENTER (first 25% of slice): opacity 0→1, scale 0.85→1.0
- HOLD (middle 50%): opacity 1, scale 1.0
- EXIT (last 25%): opacity 1→0, scale 1.0→0.92
Exception: Layer 6 has no EXIT. It holds at full opacity until the white hole consumes it.

All of these are computed with direct linear interpolation from the progress value. Do NOT use CSS transitions for scroll-driven values. Direct mapping means scrubbing backward reverses perfectly for free.

Crack bloom node positions inside the camera viewport (as % of viewport dimensions):
  Node 1: x 48%, y 14%
  Node 2: x 53%, y 27%
  Node 3: x 47%, y 40%
  Node 4: x 54%, y 53%
  Node 5: x 48%, y 66%
  Node 6: x 51%, y 79%

The crack tip reaches node N exactly when progress enters layer N's slice.

═══════════════════════════════════════
PHASE 4: THE VIGNETTE
═══════════════════════════════════════

Absolutely positioned div filling the entire camera. NOT position fixed (must not bleed onto the hero).

background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.92) 100%)

Opacity of the vignette div itself scales with progress:
- At progress 0.0: div opacity 0.7
- At progress 1.0: div opacity 1.0
Linear interpolation. Updated directly from the progress value in the rAF loop. No CSS transition.

═══════════════════════════════════════
PHASE 5: THE KINTSUGI CRACK
═══════════════════════════════════════

One SVG element. viewBox matches the viewport aspect ratio. preserveAspectRatio="none" so it scales on all screen sizes.

PATH GENERATION — run once on mount using a seeded deterministic random function. Same seed every time = same crack every visit = no hydration mismatch.

Main trunk:
- Starts at x 50%, y 0%
- Ends at x 50%, y 86%
- Passes through all 6 node coordinates from Phase 3
- Between each pair of nodes, subdivide into 6–10 segments with hard angular zigzag displacement perpendicular to the direction of travel
- Maximum displacement per segment: 4% of viewport width
- These are sharp direction changes — NOT smooth curves, NOT bezier. Fractured gold, not a river.

Branches at each node:
- 2–3 branches per node
- Each splits off at a sharp angle 35–70 degrees from the trunk
- Length 8–15% of viewport height
- Each branch gets its own jagged subdivision (same technique as trunk)
- Each branch gets 1–2 sub-branches (one level deeper, shorter, same technique)
- Branches are separate SVG path elements

RENDERING — each path element is drawn 4 times stacked. Four separate path copies per crack segment:
  Copy 1: stroke #b8860b, strokeWidth 28, opacity 0.12 — SVG filter: gaussianBlur stdDeviation 2
  Copy 2: stroke #d4af37, strokeWidth 14, opacity 0.25 — SVG filter: gaussianBlur stdDeviation 2
  Copy 3: stroke #ffd700, strokeWidth 6,  opacity 0.65 — no blur
  Copy 4: stroke #fff0a0, strokeWidth 2,  opacity 0.95 — no blur (this is the hot core)

All gold-yellow. No white tones anywhere. Molten gold, not electricity.

DRAW-ON-SCROLL:
Main trunk: measure total path length via getTotalLength() after mount.
  strokeDasharray = totalLength
  strokeDashoffset = totalLength * (1 - drawProgress)
  drawProgress = clamp(progress / 0.90, 0, 1)
  The trunk finishes drawing exactly when the white hole begins.

Branches at node N: their stroke-dashoffset animates from full (hidden) to 0 across the first 30% of layer N's slice. Before that slice, fully hidden with strokeDashoffset = branchLength.

BLOOM at each node:
A div with background radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 100%), width and height 180px, centered on the node coordinates.
Opacity and scale follow layer N's ENTER/HOLD/EXIT sub-phases from Phase 3.
Peak opacity 0.5. Updated directly from progress via inline style.

═══════════════════════════════════════
PHASE 6: THE PARTICLE SYSTEM
═══════════════════════════════════════

Hazy atmosphere. Felt, not seen. Never competes with the crack or layer text.

Count: 60 particles on desktop, 30 on mobile. Detect with matchMedia('(max-width: 768px)') on mount.

Each particle structure — TWO nested divs (critical for Phase 6B):
- OUTER div: absolutely positioned at the particle's base location. Receives ONLY JS interaction transforms from Phase 6B.
- INNER div: the visible element. border-radius 50%, filter blur(18px), no hard edges. Runs ONLY the CSS drift keyframe.

Sizes: random 40–120px per particle.
Colors: half the particles rgba(180,140,20,0.08), other half rgba(30,22,8,0.10).
Spawn x: random between 30% and 70% of viewport width (clustered near the crack path).
Spawn y: random across the full camera height.
Max opacity any particle ever reaches: 0.12. Hard limit.

CSS drift keyframe per particle:
- translateY: random 40–80px range, direction alternating
- translateX: random -30 to 30px range, direction alternating
- Duration: random 8–16s per particle
- animation-delay: randomized so particles never synchronize
- animation-direction: alternate
- animation-iteration-count: infinite

Generate all particle data once in useEffect (client-side only) using the same seeded random approach as the crack. Prevents hydration mismatch.

═══════════════════════════════════════
PHASE 6B: PARTICLE POINTER INTERACTION
═══════════════════════════════════════

Particles part around the mouse on desktop and around the finger on mobile. The haze disturbs, then lazily reforms.

This uses the TWO-div structure from Phase 6. The OUTER div is moved by JS. The INNER div runs CSS. They never touch the same transform.

POINTER TRACKING:
- One pointermove listener on the camera div (covers mouse and touch with one API).
- Handler does ONE thing only: store { x, y } in a ref. No other work in the event handler.
- On pointerleave and touchend: set stored pointer to null.
- NEVER call preventDefault anywhere in pointer handling. Native scroll must remain untouched.

INTERACTION LOOP:
One requestAnimationFrame loop. Runs only while state is SCROLLY. Cancel on state exit.

Each frame, for each particle:
  If pointer ref is null:
    targetOffsetX = 0, targetOffsetY = 0
  Else:
    dx = pointer.x - particle.baseX
    dy = pointer.y - particle.baseY
    distance = Math.sqrt(dx*dx + dy*dy)
    If distance < 180:
      strength = (1 - distance / 180) * 60
      targetOffsetX = -(dx / distance) * strength
      targetOffsetY = -(dy / distance) * strength
    Else:
      targetOffsetX = 0, targetOffsetY = 0

  Apply lerp:
    currentOffsetX += (targetOffsetX - currentOffsetX) * 0.08
    currentOffsetY += (targetOffsetY - currentOffsetY) * 0.08

  Write directly to OUTER div element ref:
    outerEl.style.transform = `translate3d(${currentOffsetX}px, ${currentOffsetY}px, 0)`

The 0.08 lerp factor is what makes motion feel like smoke. Do not raise it above 0.12.

PERFORMANCE RULES — non-negotiable:
- Store all particle base positions and current offsets in plain arrays and refs. Zero React state updates per frame.
- Write transforms directly via element refs, never via setState.
- translate3d only. Never animate top or left.
- If prefers-reduced-motion is set: skip this loop entirely. Particles remain static.

═══════════════════════════════════════
PHASE 7: THE 6 CONTENT LAYERS
═══════════════════════════════════════

Each layer: absolutely positioned centered block inside the camera. max-width 640px. text-align center. z-index 5. pointer-events none.

Opacity and scale driven entirely by the sub-phase interpolation from Phase 3. Direct inline style updates. No CSS transitions.

Each layer contains three elements stacked vertically:

  GHOST NUMERAL (z-index below label/title/body):
  - The layer number (01, 02, 03...) in Georgia serif
  - font-size clamp(180px, 28vw, 320px)
  - color rgba(212,175,55,0.04)
  - absolutely positioned, centered behind the text block
  - pointer-events none
  - Its visible opacity = 0.04 * layerOpacity (where layerOpacity is the layer's current interpolated opacity value from Phase 3)

  LABEL:
  - 12px system monospace, uppercase, letter-spacing 0.3em, color #c8a96e
  - Followed immediately by a HAIRLINE RULE: a 1px tall div, color #c8a96e, max-width 120px, centered, margin 8px auto
  - Rule width interpolates 0 → 120px across the layer's ENTER sub-phase only. Holds at 120px during HOLD. Collapses back to 0 during EXIT.
  - Updated directly from progress. No CSS transition.

  TITLE:
  - Georgia serif, clamp(36px, 6vw, 64px), color #ffffff, font-weight 400

  BODY:
  - 16px system sans-serif, line-height 1.7, color rgba(255,255,255,0.65)

Layer content:

Layer 01
  Label: 01 — THE BOARD
  Title: The Board
  Body: We raise the ceiling of what Philippine real estate can be. Every player ranked, every listing set to a new standard. The market will never be stale again.

Layer 02
  Label: 02 — PROPERTY INTELLIGENCE
  Title: Property Intelligence
  Body: Every detail, every signal, every data point — so any user can walk into a decision with full confidence. No guesswork. No gatekeeping. Ever.

Layer 03
  Label: 03 — DISCOVERY
  Title: Discovery
  Body: Not just headlines. Real insights, real data, real location intelligence — for users, investors, and researchers who need to understand the market, not just follow it.

Layer 04
  Label: 04 — THE ECOSYSTEM
  Title: The Ecosystem
  Body: The first of its kind in the Philippines. A platform that connects buyers, owners, brokers, photographers, researchers — everyone the market needs, in one place.

Layer 05
  Label: 05 — THE LEDGER
  Title: The Ledger
  Body: For the dreamers. A living wishlist that keeps your goals in view, your options tracked, and your ceiling moving — because wanting more is where it all starts.

Layer 06
  Label: 06 — ABOUT US
  Title: This Was Never About Us.
  Body: It was always about you.

═══════════════════════════════════════
PHASE 8: THE WHITE HOLE EXIT
═══════════════════════════════════════

A full-camera overlay div. z-index 10. pointer-events none until progress >= 0.90.

background: radial-gradient(circle at center, #fff0a0 0%, #ffd700 35%, rgba(255,215,0,0.0) 70%)

From progress 0.90 to 1.00:
- opacity: interpolate 0 → 1
- transform: scale() interpolate 0.3 → 2.5
Both driven directly from progress. No CSS transition.

Navigation guard:
- When progress >= 0.995 AND hasNavigated ref is false:
  Set hasNavigated = true
  Set a timeout for 1200ms
  After timeout: router.push('/about')
- If the user scrolls back up before the timeout fires: clear the timeout, set hasNavigated = false
- Navigation fires exactly once. It cannot fire twice.

═══════════════════════════════════════
PHASE 9: ESCAPE
═══════════════════════════════════════

Position fixed. top 24px, right 24px. z-index 100. Rendered only when state is SCROLLY.

Style:
- Label: ESC
- background: transparent
- border: 1px solid #c8a96e
- color: #c8a96e
- font: 11px system monospace, uppercase, letter-spacing 0.2em
- padding: 8px 16px
- border-radius: 0
- No hover background fill — only border and text color shift to #ffd700 on hover

On click:
- Clear any pending white hole navigation timeout
- Reset hasNavigated to false
- window.scrollTo({ top: 0, behavior: 'smooth' })
- State flips to IDLE automatically via IntersectionObserver when track leaves viewport

Also handle keyboard: when state is SCROLLY, the Escape key triggers the same reset.

═══════════════════════════════════════
PHASE 10: SIGNATURE DETAILS
Six details. Small and disciplined. Do not expand them. Do not add others.
═══════════════════════════════════════

10.1 — FILM GRAIN
A full-camera overlay div. z-index 9. pointer-events none.
Generate an inline SVG data URI using feTurbulence (type fractalNoise, baseFrequency 0.9) and set it as the background-image, tiled.
opacity: 0.035
mix-blend-mode: overlay
Do not animate. Do not make it visible at a glance. If grain is noticeable at first look, it is too strong — reduce opacity.

10.2 — TELEMETRY HUD
Position fixed. bottom 24px, left 24px. z-index 100. Visible only in SCROLLY state.
Two lines of text. 10px system monospace. letter-spacing 0.25em. uppercase. color rgba(200,169,110,0.45). No background. No border.

  Line 1: DEPTH 047%
    — progress * 100, zero-padded to 3 digits, no decimal
    — Example at progress 0.47: DEPTH 047%
  Line 2: current layer label
    — During Layer 1: 01 — THE BOARD
    — During Layer 2: 02 — PROPERTY INTELLIGENCE
    — (and so on for layers 3–6)
    — During white hole range (progress 0.90–1.00): EXIT — MANIFESTO

Update both lines by direct DOM mutation (element.textContent) inside the same rAF loop as scroll progress. Never via React state. Zero re-renders per frame.

10.3 — GHOST NUMERALS
Already specified in Phase 7. Included here for completeness — the large background number behind each layer title.

10.4 — HAIRLINE RULE
Already specified in Phase 7. The 1px animated gold line under each label.

10.5 — MOLTEN CORE SHIMMER
On the hot core stroke only (the #fff0a0 2px path, trunk only — not branches):
CSS keyframe: opacity oscillates between 0.85 and 1.0. Duration 4s. ease-in-out. infinite.
This is imperceptible as a conscious effect. The goal is that the crack feels alive and molten rather than static.
Disable entirely under prefers-reduced-motion.

10.6 — DESCENT HINT
Visible only while progress < 0.04. Fades out by progress 0.06. Opacity driven directly from progress.
Centered horizontally. bottom 48px of the camera.

  Text: SCROLL TO DESCEND
  — 10px system monospace, letter-spacing 0.35em, uppercase
  — color rgba(200,169,110,0.55)

  Below the text: a 1px wide, 32px tall vertical div, color #c8a96e
  — CSS keyframe: scaleY 0 → 1, transform-origin top, 1.6s ease-in-out infinite
  — A quiet falling line. Not decorative — it tells the user which direction to move.

═══════════════════════════════════════
DESIGN RULES — no exceptions, ever
═══════════════════════════════════════

Colors:
- Background during scrollytelling: #000000 pure black only
- Rest of site: #0e0e0e
- Gold palette only: #ffd700, #d4af37, #c8a96e, #b8860b, #fff0a0
- White text on layers: #ffffff for titles, rgba(255,255,255,0.65) for body
- Nothing outside this palette

Typography:
- Titles: Georgia serif, font-weight 400
- Labels and HUD: system monospace
- Body: system sans-serif

Visual rules:
- No box shadows on any UI element
- No border-radius on any UI element
- Gradients allowed only on: crack glow, bloom nodes, vignette, beam, white hole, film grain
- The event-horizon.png background opacity must stay at or below 0.45 — pure black must dominate

Technical rules:
- No animation libraries. No GSAP. No Framer Motion. No Lenis. No scroll-jacking libraries.
- No scroll hijacking. Never call preventDefault on wheel, scroll, or touch events.
- No CSS transitions on scroll-driven values. Direct interpolation only.
- All random generation happens client-side in useEffect. Never on the server. Never during render.
- The component must be a Next.js client component ('use client').
- All per-frame updates go through element refs and direct DOM mutation. Never through React setState.
- GPU compositing only: translate3d, not top/left.

Accessibility:
- Respect prefers-reduced-motion at all times:
  — Disable particle drift CSS animations
  — Disable particle pointer interaction loop
  — Disable UFO idle animation
  — Disable molten core shimmer
  — Disable descent hint animation
  — Keep all scroll-driven reveals (user-controlled, not auto-playing)

Mobile:
- Touch scrolling must work natively at all times
- Particle count: 30 on mobile (matchMedia max-width 768px, set on mount)
- All pointer interaction works via touch (pointermove covers both)
- All font sizes use clamp() for mobile scaling
- The SVG crack must be legible on a 375px viewport

═══════════════════════════════════════
EXECUTION ORDER
Confirm completion of each step with me before starting the next.
Never skip, reorder, or combine steps.
═══════════════════════════════════════

Step 1:
Read CLAUDE.md and SCOUTIT_BRAND.md in full.
Inspect the existing hero component.
Report: project structure, all relevant existing files, whether the UFO exists on the hero, its current code if present.
Wait for my confirmation before proceeding.

Step 2:
Present the full file plan:
- Which new files will be created and where
- Which existing files will be modified and exactly what will change
- The component name and import location
Wait for my approval before writing any file.

Step 3 — Phase 0:
Add the UFO to the hero if missing (or confirm it exists).
Attach the click handler stub (does nothing yet — just logs "clicked").
Apply mix-blend-mode: screen.
Add idle bob and sway animations.
I verify the UFO appears correctly on the dark background with no white box, and animates gently.

Step 4 — Phase 2:
Build the track skeleton (600vh outer, sticky camera inner).
Build the useScrollProgress hook.
Log the progress value to the console as the user scrolls.
I verify: scroll from top to bottom of track, confirm console logs 0.0 → 1.0 cleanly.

Step 5 — Phase 4 + State:
Add the IntersectionObserver state switching.
Add the vignette overlay.
Wire background color #0e0e0e ↔ #000000 transition to state.
I verify: hero is dark gray, scrolling into track switches to pure black, scrolling back out reverts.

Step 6 — Phase 5 (static):
Build the kintsugi crack SVG with the full path — all 4 stroke layers, all branches, all bloom node positions.
Do NOT wire draw-on-scroll yet. Show the full completed crack statically.
I judge the shape, branching, and glow quality before we animate it.
Adjust if needed. Only proceed when I approve the shape.

Step 7 — Phase 5 (animated):
Wire stroke-dashoffset to scroll progress for the main trunk.
Wire branch reveal to their layer slice entries.
Wire bloom node opacity/scale to the sub-phase interpolation.
I verify by scrubbing slowly — crack grows, branches appear, blooms pulse.

Step 8 — Phase 3 + Phase 7:
Build the progress map constant.
Build all 6 content layers with ENTER/HOLD/EXIT interpolation.
Include ghost numerals and hairline rules (Phases 10.3 and 10.4).
I verify each layer by scrolling through slowly, confirm smooth scale/opacity in and out.
Confirm Layer 6 holds without EXIT.

Step 9 — Phase 6 + Phase 6B:
Build the particle system (Phase 6).
I verify particles are present, hazy, and non-intrusive.
Then build pointer interaction (Phase 6B).
I verify haze parts around mouse on desktop and around finger on mobile, without affecting scroll at all.

Step 10 — Phase 1:
Build the UFO click trigger sequence (beam, wordmark glow, smooth scroll).
I verify the full cinematic entrance plays correctly.
I verify clicking twice does nothing the second time.

Step 11 — Phase 8:
Build the white hole exit.
Build the navigation guard (hasNavigated ref, timeout, cancel on scroll-back).
I verify: scroll to end, white hole fires, /about navigation happens once.
I verify: scroll back before timeout, navigation cancels cleanly.

Step 12 — Phase 9:
Build the ESC button.
Wire Escape keyboard key to the same reset.
I verify: ESC during scrollytelling resets to hero, background reverts, all state clears.
I verify rapid ESC spam does not cause errors.

Step 13 — Phase 10:
Build all six signature details in order:
  10.1 Film grain — I verify it is invisible at a glance
  10.2 Telemetry HUD — I verify DEPTH counter and layer name are accurate at all 6 boundaries
  10.5 Molten core shimmer — I verify it is subtle, not distracting
  10.6 Descent hint — I verify it fades exactly at progress 0.06
(10.3 ghost numerals and 10.4 hairline rules already built in Step 8)

Step 14 — Full review:
Test every scenario in this order:
1. Desktop: full scroll through all 6 layers to /about
2. Desktop: scroll back through all 6 layers from bottom to top (every animation reverses)
3. Desktop: click UFO, watch beam sequence, verify smooth scroll entrance
4. Desktop: click UFO twice in quick succession (second click ignored)
5. Desktop: reach white hole, scroll back before timeout (navigation cancelled)
6. Desktop: rapid ESC spam (no errors or broken state)
7. Desktop: prefers-reduced-motion enabled (particles still, UFO still, crack still draws)
8. Mobile: full scroll through on a 375px viewport
9. Mobile: touch drag, verify particles part around finger
10. Mobile: ESC button tap
11. Telemetry HUD accuracy at every layer boundary transition

Do not mark the build complete until all 11 scenarios pass.
