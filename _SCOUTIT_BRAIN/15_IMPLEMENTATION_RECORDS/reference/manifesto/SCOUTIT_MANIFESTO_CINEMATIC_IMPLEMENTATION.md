---
section: "15_IMPLEMENTATION_RECORDS/reference"
status: reference
tags: [manifesto, cinematic, scrollytelling, implementation-brief]
updated: 2026-08-24
related: ["[[MANTLE_MANIFESTO_STORY_SYSTEM]]", "[[08_OPERATIONS_AND_BACKLOG/ACTION/FUTURE]]", "[[00_MASTER_ACTION_PLAN]]"]
---

# ScoutIt Manifesto — Cinematic Experience Implementation Brief

> **Repository handling note — 2026-08-24:** This owner-supplied brief is preserved
> as product source material. Its embedded build instructions and original status
> label do not independently authorize execution. The stable task
> `ORIGIN_STORY_SCROLLYTELLING` remains in `FUTURE.md` until the owner explicitly
> promotes it into one executable Action queue. The canonical design contract is
> `03_DESIGN/MANTLE_MANIFESTO_STORY_SYSTEM.md`.

**Project:** ScoutIt
**Route:** `/about`
**Working Title:** `SCOUTIT_MANIFESTO_CINEMATIC`
**Source Status:** Owner-authored brief for implementation planning and initial build
**Primary Goal:** Transform the current ScoutIt About/Manifesto page into a scroll-driven cinematic experience that begins in the human world, expands into literal outer space, culminates in the existing Golden Horizon black hole, then resolves into clarity.

---

# 1. Core Creative Direction

This is **not** a normal website redesign.

Treat the ScoutIt Manifesto as an **interactive short film controlled by scroll**.

The experience should feel cinematic first and web-like second.

The goal is not to show off WebGL, Three.js, particles, or shaders.

The goal is to make the visitor emotionally understand why ScoutIt exists.

## Central Idea

> **From space as a place → to space as something we understand.**

ScoutIt begins at the human scale:

- cities
- homes
- offices
- restaurants
- venues
- people
- decisions

Then expands toward:

- information
- intelligence
- celestial scale
- networks
- motion
- convergence
- complexity
- clarity

The final emotional realization should be:

> “I thought ScoutIt was about property.
> Then I realized ScoutIt is trying to build a system for understanding space itself.”

---

# 2. Non-Negotiable Directorial Rule

## ONE IDEA OWNS THE SCREEN AT A TIME.

Do not fill the screen with effects just because they are available.

When Metropolis matters, Metropolis dominates.

When one comet matters, one comet dominates.

When a celestial body matters, that celestial body dominates.

When the meteor shower matters, the shower dominates.

When Golden Horizon matters, nothing competes with it.

When silence matters, there should be almost nothing.

Avoid the visual feeling of:

- particle demo
- game HUD
- screensaver
- generic sci-fi landing page
- crypto website
- “AI slop”
- overdesigned space dashboard

The target is cinematic restraint.

---

# 3. Existing ScoutIt Assets / Systems To Reuse

## Golden Horizon

ScoutIt already has an interactive black hole system on the homepage.

It is unlocked through the UFO Easter egg.

The current system includes parameters and behavior for:

- horizon radius
- gravitational lensing strength
- accretion disk inner edge
- accretion disk outer edge
- starfield density
- spin speed
- Doppler beaming
- gas/noise detail
- brightness
- color shift / palette
- pitch
- yaw
- interactive orbit behavior
- spacetime shockwave
- cursor-based light bending

### Rule

**DO NOT BUILD A SECOND BLACK HOLE.**

Golden Horizon should become a reusable cinematic primitive.

Refactor only if needed so it can be controlled by:

1. homepage interactive mode
2. Manifesto cinematic timeline

Conceptual target:

```text
GoldenHorizonEngine
│
├── HomepageInteractiveController
│
└── ManifestoDirectorController
```

The homepage keeps its existing interactive behavior.

The Manifesto drives Golden Horizon programmatically.

---

# 4. `/about` Product Structure

The route should support two ways to consume the Manifesto.

```text
/about
│
├── EXPERIENCE
│   └── cinematic manifesto
│
└── READ
    └── accessible written manifesto
```

## Why

The written version remains important for:

- SEO
- accessibility
- reduced-motion users
- weak devices
- users who dislike cinematic websites
- users who simply want the company philosophy
- fallback behavior if WebGL fails

Do not destroy the current written manifesto.

The cinematic version is the **experience**.

The written version is the **canonical readable document**.

---

# 5. Entry Experience

The default `/about` page should initially stay lightweight.

Do not immediately load the entire cinematic engine.

Suggested entry:

```text
THE SCOUTIT MANIFESTO

Space deserves to be understood.

[ EXPERIENCE ]
[ READ ]
```

Clicking `EXPERIENCE` may:

- initialize WebGL
- lazy-load Three.js / React Three Fiber modules
- load cinematic assets
- initialize audio
- enter cinematic scroll mode

The explicit click also provides a valid user gesture for audio initialization.

---

# 6. Narrative Structure

The Manifesto is one continuous journey.

Do **not** implement it as disconnected website sections.

Suggested emotional progression:

```text
FAMILIAR
↓
NOISE
↓
DISTURBANCE
↓
WONDER
↓
INTELLIGENCE
↓
PEOPLE
↓
EXPERIENCE
↓
SCALE
↓
ACCELERATION
↓
CONVERGENCE
↓
GOLDEN HORIZON
↓
SILENCE
↓
CLARITY
```

---

# 7. Scene 01 — METROPOLIS

## Purpose

Begin with the most familiar interpretation of “space.”

Human space.

Metro Manila / urban Philippines inspiration.

The visitor should feel:

- life
- density
- distance
- possibility
- human presence

Do not begin in outer space.

## Visual

Night.

Dark metropolis.

Not cyberpunk.

Not Blade Runner.

Not futuristic fantasy.

Keep it believable and elegant.

Possible visual ingredients:

- city skyline
- building windows
- distant traffic movement
- subtle atmospheric haze
- warm and cool light variation
- deep sky above the city
- restrained camera motion

The camera should begin somewhere above street level or at mid-building scale.

It should still feel human.

## Initial Text

Possible working lines:

> **Everything happens somewhere.**

Pause.

Then:

> **Yet understanding a space is still harder than it should be.**

Do not finalize copy yet if better existing ScoutIt manifesto wording exists.

---

# 8. Scene 02 — INFORMATION NOISE

The city stays visible.

The environment does not need to transform yet.

Instead, information begins appearing around it.

Possible signals:

- listing price
- address
- location tag
- property image
- broker message
- owner statement
- development announcement
- zoning reference
- review
- map marker
- market signal
- duplicate listing
- contradictory value

At first these signals should feel useful.

Then they gradually become:

- fragmented
- duplicated
- contradictory
- noisy
- incomplete

The visitor should **experience fragmentation** instead of reading a paragraph explaining fragmentation.

## Core Narrative Beat

Working line:

> **The problem was never a lack of information.**

Pause.

> **It was knowing what to trust.**

This is the moment ScoutIt begins conceptually.

---

# 9. Scene 03 — THE FIRST COMET

The city remains visible.

The information noise begins to soften.

Then:

**ONE comet crosses the sky.**

This comet is extremely important.

Do not begin with a meteor shower.

The first comet should feel almost accidental.

## Visual Direction

The comet should have:

- a beautiful luminous head
- long soft tail
- bloom
- layered tail structure
- natural color variation
- cinematic motion blur feel
- depth

Do **not** constrain the comet to ScoutIt black-and-gold branding.

Color freedom is allowed.

Possible palette:

- pearl white
- cyan
- pale blue
- violet
- pink
- peach
- warm gold
- subtle spectral variation

Beauty is more important than strict brand grading during this sequence.

## Timing

The first comet should have breathing room.

Example:

```text
0s      city / still sky
5s      first comet
9s      silence / sky settles
12s     second distant comet
16s     another small event
```

The power comes from timing, not quantity.

---

# 10. Scene 04 — COMETS BEGIN TO BUILD

As the visitor continues scrolling:

- another comet appears
- another appears farther away
- occasionally two cross at different depth layers
- a brighter one eventually crosses a large portion of the sky

Do not create a constant faucet of meteors.

Use:

> **bursts + quiet gaps**

The sky must breathe.

The visitor should gradually start looking upward.

---

# 11. Scene 05 — CAMERA LEAVES METROPOLIS

The camera begins changing orientation.

The city starts occupying less of the frame.

Conceptual transition:

```text
START

CITY
████████████████
       ↑
     camera

            ☄
```

Then:

```text
           ☄
     ✦                ☄

            camera ↑

CITY
████████████████
```

Then:

```text
        ✦
                  ☄

              ◐

        camera ↑

CITY barely visible
────────────────────
```

Avoid a hard cut from city to outer space.

The transition should feel continuous.

Possible techniques:

- camera tilt
- vertical dolly
- horizon fade
- atmospheric haze reduction
- city parallax slowing
- sky increasing in exposure/depth
- transition from 2.5D city to full WebGL environment
- masked video/WebGL handoff if needed

The viewer should feel like they physically left the human scale.

---

# 12. Scene 06 — CELESTIAL SCALE

Now we enter literal outer space.

This is where the experience becomes astronomical.

## Important Rule

Do not show five planets at once.

One celestial body should own the composition.

Possible sequence:

- large moon enters frame
- only part of the moon is visible at first
- its curvature slowly reveals scale
- a comet crosses behind it
- another comet crosses in front
- camera continues moving
- moon exits
- darkness
- distant planet
- faint nebula
- deep starfield

The purpose is to establish scale.

A comet over an empty canvas looks like a particle.

A comet passing behind an enormous moon feels astronomical.

---

# 13. Scene 07 — INTELLIGENCE

The current ScoutIt manifesto contains ideas around Intelligence.

Do not turn this into a feature card.

Represent Intelligence as the discovery of relationships.

Start with many distant points.

Initially random.

Then subtle structure appears:

- clustering
- alignment
- connection
- constellation-like relationships
- spatial grouping

ScoutIt does not create the stars.

ScoutIt reveals the constellation.

Possible working copy:

> **Information is everywhere.**

Then:

> **Intelligence is knowing how it connects.**

Keep text minimal.

---

# 14. Scene 08 — PEOPLE

The ScoutIt ecosystem should appear as connected signals, not profile cards.

Possible roles:

- seeker
- owner
- broker
- researcher
- photographer
- planner

These may be represented as:

- nodes
- signals
- routes
- orbiting markers
- emitting light
- paths between objects

Do not over-label everything.

The concept should be:

> **Space is never understood alone.**

The visitor should understand that ScoutIt connects people around a space.

---

# 15. Scene 09 — EXPERIENCE

One celestial body is encountered differently.

Instead of simply passing it:

the viewer approaches.

Possible cues:

- surface detail increases
- parallax increases
- lighting changes
- scale becomes intimate
- environmental sound becomes clearer

This represents ScoutIt’s belief that a space should not merely be listed.

It should be understood.

Possible working copy:

> **A listing tells you that a space exists.**

Then:

> **Understanding tells you whether it belongs in your life.**

---

# 16. Scene 10 — THE METEOR SHOWER RETURNS

The comet motif returns.

Earlier it was:

- one
- two
- three

Now the sky begins building toward something much larger.

Suggested progression:

```text
1 meteor
pause

2 meteors
pause

3 meteors

5 meteors

8–12 meteors

larger depth variation

increasing velocity

increasing brightness

increasing density
```

Do not instantly jump to 100 particles.

The viewer must feel escalation.

---

# 17. Scene 11 — GRAVITY APPEARS BEFORE THE BLACK HOLE

This is a crucial directorial beat.

Do not immediately show Golden Horizon.

First show its **effects**.

The visitor should notice:

- meteor trajectories start bending
- dust begins curving
- distant light subtly distorts
- star positions appear warped
- celestial motion feels wrong
- objects begin sharing a destination

The viewer should think:

> “What is pulling everything?”

Only after that question exists should the black hole reveal itself.

---

# 18. Scene 12 — GOLDEN HORIZON REVEAL

A faint accretion disk appears near the edge of frame.

Not centered immediately.

Do not make the reveal feel like a UI component entering.

The camera should discover it.

Progression example:

```text
65%
light distortion

70%
faint accretion glow

74%
black hole silhouette becomes readable

78%
lensing becomes obvious

82%
meteors curve more strongly

86%
Golden Horizon dominates composition

90%
large-scale convergence

94%
near-event-horizon

96%
full visual climax

98%
crossing / blackout
```

These percentages are provisional.

Tune by feel.

---

# 19. Scene 13 — GOLDEN HORIZON CLIMAX

Reuse the existing Golden Horizon engine.

Manifesto mode should control its parameters.

Possible timeline mapping:

```text
REVEAL
brightness          low
lensingStrength     low
spinSpeed           restrained
starfieldDensity    medium

BUILD
brightness          increases
lensingStrength     increases
spinSpeed           increases
beamingStrength     increases

CLIMAX
brightness          high
lensingStrength     high
camera distance     closes rapidly
meteor convergence  maximum
audio intensity     maximum
```

The existing interactive control panel must not appear in Manifesto mode.

The visitor should experience a directed cinematic state.

---

# 20. Scene 14 — EVENT HORIZON / SILENCE

Everything falls inward.

Then:

**BLACK.**

Hold it.

Do not immediately play another effect.

Aim for approximately 1.5–2.5 seconds of near-silence depending on pacing.

No stars.

No particles.

No gold.

No UI except maybe hidden navigation accessibility.

This silence is part of the composition.

Possible working copy around the climax:

> **Complexity is inevitable.**

Then after convergence:

> **Confusion isn’t.**

Copy is not final.

---

# 21. Scene 15 — GRAVITATIONAL RESOLUTION

Do not explode out of the black hole.

The resolution should be calm.

Possible sequence:

- thin line of light
- subtle gravitational lensing
- distortion begins opening the image
- stars slowly reappear
- space becomes clean
- motion becomes slow
- sound becomes minimal

The emotional effect should be:

**clarity after complexity**

---

# 22. Scene 16 — EARTH / FINAL RESOLUTION

End on Earth.

Not immediately inside Metropolis.

Earth floats quietly in space.

Potential visual:

- slow sunrise along curvature
- restrained atmosphere
- extremely clean starfield
- calm camera
- minimal movement

The final world should feel understandable.

Possible working lines:

> **Every decision begins with a space.**

Then:

> **We believe you should understand it before you choose it.**

Then:

# ScoutIt

**SPACE · INTELLIGENCE · TECHNOLOGY**

Possible closing statement:

> **Scout the space.
> Understand the signal.
> Make your move.**

Final actions:

```text
[ EXPLORE SCOUTIT ]
[ READ THE MANIFESTO ]
```

---

# 23. Visual Technology Strategy

Do not force everything to be procedurally coded.

Use the best medium for each shot.

The visitor should not know or care whether an effect is:

- WebGL
- Three.js
- React Three Fiber
- GLSL
- pre-rendered video
- image sequence
- 2.5D parallax
- shader effect
- HTML/CSS typography
- particle simulation
- sprite system

Use real-time rendering only where it adds value.

## Suggested Division

### Metropolis

Possible:

- pre-rendered environment
- 2.5D layered parallax
- lightweight Three.js geometry
- hybrid video + WebGL

Do not build a giant detailed 3D city unless necessary.

### Celestial Bodies

Possible:

- high-resolution rendered textures
- sphere geometry
- NASA-style textures if licensing permits
- custom art assets
- pre-rendered celestial imagery with parallax

### Comets / Meteor Shower

Prefer real-time WebGL / Three.js.

Need control over:

- spawn timing
- tail length
- trajectory
- depth
- curvature
- gravity pull
- density
- speed
- color
- bloom
- convergence

### Golden Horizon

Reuse existing implementation.

### Gravitational Lensing

Prefer shader-based effect.

### Typography

Normal HTML / CSS above the scene.

Do not texture-map important text into WebGL unless required.

---

# 24. Recommended Technical Architecture

Suggested structure:

```text
/app/about
│
├── page
│
├── ManifestoEntry
│
├── ManifestoReadMode
│
└── ManifestoExperience
     │
     ├── Director
     ├── ScrollTimeline
     ├── AudioDirector
     ├── QualityManager
     ├── SceneRenderer
     │
     ├── scenes/
     │   ├── MetropolisScene
     │   ├── InformationNoiseScene
     │   ├── CometScene
     │   ├── CelestialJourneyScene
     │   ├── IntelligenceScene
     │   ├── PeopleScene
     │   ├── ExperienceScene
     │   ├── ConvergenceScene
     │   ├── GoldenHorizonScene
     │   └── ResolutionScene
     │
     ├── effects/
     │   ├── CometTail
     │   ├── MeteorField
     │   ├── GravitationalDistortion
     │   ├── Starfield
     │   └── Nebula
     │
     └── overlays/
         ├── ManifestoTypography
         └── CinematicNavigation
```

Exact file structure may differ based on the existing ScoutIt repository.

First inspect the current codebase before creating files.

---

# 25. Scroll Director

Create a single normalized progress value:

```text
0.0 → 1.0
```

Every cinematic state should derive from this value.

Avoid large numbers of disconnected scroll listeners.

Suggested conceptual timeline:

```text
0.00–0.10  Metropolis
0.10–0.20  Information Noise
0.20–0.27  First Comets
0.27–0.36  Camera Leaves City
0.36–0.48  Celestial Scale
0.48–0.57  Intelligence
0.57–0.64  People
0.64–0.70  Experience
0.70–0.81  Meteor Escalation
0.81–0.89  Gravitational Distortion
0.89–0.96  Golden Horizon
0.96–0.98  Event Horizon / Black
0.98–1.00  Resolution
```

This is a starting model.

Do not treat these numbers as sacred.

Tune visually.

---

# 26. Comet Rendering Requirements

The comet system is a major quality bar.

Do not use simple CSS lines.

Each comet should support:

- bright nucleus/head
- layered luminous tail
- soft outer bloom
- internal hot filament
- variable tail length
- variable width
- depth-based scale
- depth-based speed
- subtle color gradients
- natural motion
- curved trajectories
- gravity-driven path bending
- staggered spawn timing

Optional:

- tiny tail debris
- secondary filaments
- subtle chromatic bloom
- heat shimmer
- volumetric-looking haze

Do not make every comet identical.

---

# 27. Celestial Color Direction

ScoutIt’s normal product palette is black / gold.

The Manifesto is allowed to expand beyond it.

Allowed celestial colors include:

- pearl white
- cyan
- deep blue
- lavender
- violet
- magenta
- peach
- amber
- pale green
- warm gold

ScoutIt gold should still appear strategically.

Do not grade the entire universe black-and-gold.

The experience should feel like **outer space first, ScoutIt second**.

Golden Horizon naturally becomes the strongest ScoutIt-branded celestial moment.

---

# 28. Audio Direction

Audio should eventually be built as a layered score, not one inflexible MP3.

Possible layers:

```text
Layer 1 — atmospheric space bed
Layer 2 — distant city ambience
Layer 3 — flute motif
Layer 4 — strings
Layer 5 — low pulse / tension
Layer 6 — orchestral expansion
Layer 7 — climax
Layer 8 — post-horizon resolution
```

Scroll progress controls intensity and crossfades.

Do not implement full audio until the visual pacing is stable.

However, architecture should leave room for:

```text
AudioDirector.setProgress(progress)
```

Audio must only initialize after user interaction.

---

# 29. Device / Performance Strategy

This cinematic experience must be optional and adaptive.

Suggested levels:

## ULTRA

Desktop with strong GPU.

- full resolution
- full particles
- post-processing
- high comet density
- advanced lensing
- high-quality celestial textures

## HIGH

Normal desktop / laptop.

- full story
- reduced particle counts
- moderate post-processing

## MEDIUM

Modern phones / tablets.

- reduced DPR
- fewer meteors
- simplified shaders
- lower texture resolution
- limited post-processing

## LOW

Weak devices.

- pre-rendered assets
- minimal WebGL
- simplified comet system

## FALLBACK

WebGL unavailable / reduced-motion enabled.

- written manifesto
- optional lightweight cinematic image sequence
- no forced motion

---

# 30. Performance Rules

Do not sacrifice normal ScoutIt performance for the Manifesto.

Requirements:

- lazy-load experience
- code-split cinematic engine
- no large WebGL bundle on normal homepage load
- no preload of huge media before user chooses EXPERIENCE
- adaptive DPR
- cap particle counts
- reuse geometries/materials
- use instancing where appropriate
- dispose Three.js resources correctly
- suspend animation when page hidden
- avoid unnecessary React re-renders inside render loop
- use refs / render-loop state for high-frequency animation
- monitor GPU memory
- test mobile Safari
- test Android Chrome
- respect reduced motion

---

# 31. SEO / Accessibility

The cinematic experience must not replace semantic content.

Requirements:

- written manifesto remains crawlable
- meaningful headings remain in HTML
- important copy is not available only in canvas
- keyboard-accessible entry and exit
- visible skip option
- reduced-motion fallback
- screen-reader-friendly written mode
- do not autoplay audio without user action
- provide mute control
- preserve page title / metadata
- ensure experience can be exited without refresh

---

# 32. First Engineering Task — DO THIS BEFORE BUILDING NEW VISUALS

Codex should first perform a repository audit.

## Audit Targets

Find:

1. `/about` implementation
2. existing Golden Horizon component(s)
3. interactive mode state logic
4. UFO 5-click unlock logic
5. black hole shader / renderer
6. starfield implementation
7. current meteor / drifting object logic
8. lite-mode implementation
9. reduced-motion logic
10. global performance utilities
11. current Three.js / React Three Fiber dependencies
12. post-processing dependencies
13. any existing scroll timeline libraries
14. any existing audio utilities
15. current design tokens

## Output

Before major code changes, produce:

```text
MANIFESTO_IMPLEMENTATION_AUDIT.md
```

Include:

- existing reusable components
- duplication risks
- recommended refactor boundaries
- missing dependencies
- expected performance risks
- proposed file architecture
- lowest-risk first prototype

---

# 33. First Prototype — DO NOT BUILD THE FULL MANIFESTO YET

The first visual milestone should be:

## METROPOLIS + ONE BEAUTIFUL COMET

Nothing else.

Goal:

Prove that the visual language works.

Build:

- city / metropolis opening
- cinematic sky
- one high-quality comet
- beautiful tail
- camera behavior
- basic scroll control
- desktop + mobile preview

Do not build:

- full meteor shower
- Intelligence scene
- People scene
- Golden Horizon integration
- final audio
- entire manifesto timeline

until the first shot works.

## Acceptance Question

> Does one comet crossing above Metropolis already feel cinematic?

If not, do not continue adding effects.

Fix the shot first.

---

# 34. Second Prototype

After the first shot is approved:

## BUILD THE COMET ESCALATION

Requirements:

- one comet
- pause
- distant second comet
- varying depth
- gradual build
- no constant stream
- controlled visual rhythm
- scroll-based timing
- camera begins looking upward

---

# 35. Third Prototype

## METROPOLIS → OUTER SPACE

Build the continuous transition.

Acceptance criteria:

- no obvious hard cut
- viewer feels vertical departure
- city slowly loses dominance
- celestial scale increases
- scene remains performant

---

# 36. Fourth Prototype

## GOLDEN HORIZON INTEGRATION

Only after the journey works:

- expose Golden Horizon controls to Manifesto Director
- disable interactive UI in Manifesto mode
- add gravitational pre-reveal
- bend meteor trajectories
- reveal Golden Horizon
- approach event horizon
- blackout

---

# 37. Fifth Prototype

## RESOLUTION

Build:

- silence
- lensing transition
- Earth
- final typography
- final CTA
- written manifesto return path

---

# 38. Definition of Done

The experience is successful when:

### Narrative

- it feels like one continuous journey
- the visitor understands ScoutIt emotionally before being asked to understand it technically

### Visual

- Metropolis feels grounded
- first comet feels beautiful
- celestial scale feels large
- meteor escalation feels intentional
- Golden Horizon feels earned
- resolution feels calm

### Technical

- no duplicate black-hole engine
- `/about` written mode still works
- experience lazy-loads
- mobile has an appropriate quality tier
- reduced motion works
- no major memory leaks
- no severe layout shift
- experience can be exited

### Emotional

The intended reaction is closer to:

> “What did I just experience?”

not:

> “Nice particle effects.”

---

# 39. Things Codex Must NOT Do

Do not:

- rebuild Golden Horizon from scratch
- delete the readable manifesto
- turn every section into a card
- fill the screen with particles constantly
- use gold everywhere
- build a full 3D city before proving the shot
- add dozens of dependencies without justification
- create a generic sci-fi HUD
- optimize prematurely before profiling
- ignore mobile
- autoplay audio without user action
- bury the user inside an unskippable experience
- continue building later scenes if the first Metropolis + comet shot still looks weak

---

# 40. Creative Quality Bar

Reference mindset:

- cinematic animation
- astronomical scale
- museum-quality interactive experience
- high-end title sequence
- NASA-style celestial depth
- emotionally paced anime-film sky moments
- restrained award-site interaction

Do not copy any copyrighted scene, composition, character, or exact visual sequence.

Use references only for:

- pacing
- emotional escalation
- sense of wonder
- scale
- tail beauty
- atmospheric depth
- restraint

---

# 41. Founder Intent

ScoutIt should not feel like a property portal with a space skin.

The Manifesto should reveal the deeper philosophy:

**Space is where life happens.**

ScoutIt exists to help people understand it.

From a room,

to a building,

to a neighborhood,

to a city,

to an entire network of places and people,

the same principle applies:

> **clarity before commitment.**

The cosmic journey is not decoration.

It is the metaphor.

---

# 42. Codex Starting Instruction

Begin by auditing the current implementation.

Do not immediately rewrite `/about`.

Do not recreate Golden Horizon.

Identify what is already reusable.

Then build the smallest meaningful cinematic proof:

## **Metropolis + one beautiful comet.**

Use browser verification.

Inspect the result visually.

Iterate until the single shot is strong enough to justify expanding the experience.

Only then move to the next milestone.
