---
name: ScoutIt
description: The Philippines' first spatial commerce platform — space intelligence, not a listings board.
colors:
  spatial-gold: "#E8AE3C"
  spatial-gold-bright: "#F7C64E"
  spatial-gold-muted: "#6E531A"
  void-black: "#0e0e0e"
  ink-surface: "#161616"
  ink-surface-2: "#1e1e1e"
  ink-surface-3: "#242424"
  paper-white: "#f0ede8"
  soft-grey: "#c8c8c8"
  signal-green: "#4caf7d"
  signal-amber: "#e8c84a"
  signal-red: "#e8644a"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 4vw, 3rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 450
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-mono), 'Courier New', monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.18em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
  xl: "12px"
  pill: "20px"
  full: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.spatial-gold-bright}"
    textColor: "{colors.void-black}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.spatial-gold}"
  chapter-eyebrow:
    textColor: "{colors.spatial-gold}"
    typography: "{typography.label}"
---

# Design System: ScoutIt

## 1. Overview

**Creative North Star: "The Spatial Commerce"**

ScoutIt isn't a real estate listings board wearing a dark theme — it's an intelligence terminal for
Philippine space, built for people deciding whether to trust it enough to act. The system runs on
restraint: 95% void-black canvas, 5% Spatial Gold, and every use of that gold has to earn its
place. Chrome stays quiet so the actual signal — flood risk, verification badges, market data,
category intelligence — can carry the visual weight instead of decoration doing it. The name is
deliberate: this treats real estate, short-term rentals, hospitality, restaurants, and event
venues as one category — "spatial commerce" — not six separate templates bolted together.

This system explicitly rejects: generic PH listing-directory aesthetics (Lamudi/Zillow-style
boards), "common luxury real estate" cliché (gold-and-marble old-money tropes, ornate
serif-everywhere, stock-photo-mansion imagery), and generic AI-template SaaS defaults (gradient
hero, cream/sand backgrounds, identical card grids, reflexive uppercase eyebrows with no system
behind them).

**Key Characteristics:**
- Void-black canvas with tonal surface layering, not pure flat black
- Gold is a signal, not wallpaper — deployed with intent, never decoratively
- Mono-spaced, wide-tracked, uppercase labels for system chrome (eyebrows, badges, metadata)
- Georgia serif for display headlines — editorial weight, not tech-startup sans-everywhere
- Numbered chapter registry on property pages (`01 — THE SPACE`) is a real information
  architecture (ten real chapters per space category), not a decorative section marker
- Scoped, purposeful glassmorphism (4px/12px/20px blur depending on context) — never default

## 2. Colors

The palette is a strict two-role system by design: void-black carries everything, Spatial Gold
punctuates. **Open direction, not yet resolved:** the owner wants a genuine secondary "this is
clickable" accent color distinct from gold, for specific interactive moments — not a replacement
for the black/gold standard, an addition to it. Run `/impeccable colorize` to work through real
candidates; don't invent one here.

### Primary
- **Spatial Gold** (`#E8AE3C`): baseline gold — headline accents, labels, verified badges, the
  color that says "this is ScoutIt," never applied broadly.
- **Spatial Gold Bright** (`#F7C64E`): interactive gold — buttons, CTAs, hover/active nav states.
  The version of gold that means "you can act on this."
- **Spatial Gold Muted** (`#6E531A`): subdued gold — borders, dividers, secondary accents where
  full gold would be too loud.

### Neutral
- **Void Black** (`#0e0e0e`): the base canvas. Not pure `#000` — carries a hair of warmth so it
  reads as considered, not default-dark-mode.
- **Ink Surface** (`#161616` → `#1e1e1e` → `#242424`): three-step tonal layering for cards, panels,
  and raised chrome. Depth comes from these steps plus glow, not drop shadows.
- **Paper White** (`#f0ede8`): primary text. Warm off-white, not pure white — never `#fff` directly.
- **Soft Grey** (`#c8c8c8`): secondary text — labels, metadata, supporting copy.

### Semantic
- **Signal Green** (`#4caf7d`) / **Signal Amber** (`#e8c84a`) / **Signal Red** (`#e8644a`): status
  states (verified, pending, error) — kept desaturated enough to sit quietly next to gold without
  competing with it.

### Named Rules
**The One Signal Rule.** Gold renders on ≤5% of any given screen. If a section reads gold-heavy,
it's decorating, not signaling — pull it back.

**The No-Pure-Black Rule.** Never `#000000` as a surface color; void-black (`#0e0e0e`) always
carries the intended warmth. Pure black reads as an unstyled default, not a deliberate choice.

## 3. Typography

**Display Font:** Georgia, 'Times New Roman', serif
**Body Font:** Geist Sans (via `next/font`), system-ui fallback
**Label/Mono Font:** Geist Mono, 'Courier New' fallback

**Character:** Serif display against a sans body is the system's core typographic contrast —
editorial authority up top, clean readability underneath. The mono label layer is where the
"intelligence terminal" feeling actually lives: every eyebrow, badge, and system-chrome label runs
uppercase and wide-tracked in mono, deliberately looking like instrument-panel text.

### Hierarchy
- **Display** (400 weight, `clamp(1.75rem, 4vw, 3rem)`, 1.2 line-height): hero headlines, property
  titles, section headers. Georgia serif — never sans for these.
- **Body** (450 weight, 16px / 15px mobile / 14px small-mobile, 1.65 line-height): all prose copy.
- **Label** (500 weight, 10px, 0.18em letter-spacing, uppercase): chapter eyebrows
  (`01 — THE SPACE`), badges, system metadata. Mono only — never body or display fonts here.

### Named Rules
**The Instrument-Label Rule.** Any UI chrome that isn't a headline or body copy — eyebrows,
badges, metadata, status labels — is mono, uppercase, and wide-tracked. This is the system's most
recognizable signature; don't substitute a sans label "for variety."

## 4. Elevation

Flat by default, tonal layering for depth. Surfaces step through `void-black` →
`ink-surface` → `ink-surface-2` → `ink-surface-3` rather than relying on drop shadows to imply
stacking order. Shadows exist but stay subtle (25–45% opacity, neutral black) — they mark real
state changes (raised panels, active cards), not ambient decoration. The one exception is
**glow**: a gold-tinted shadow reserved for accent elements that are actively interactive or
currently focused, functioning as a signal rather than a depth cue.

### Shadow Vocabulary
- **sm** (`0 2px 8px rgba(0,0,0,0.25)`): subtle lift, list items, small raised chips.
- **md** (`0 4px 16px rgba(0,0,0,0.35)`): cards, panels, dropdowns.
- **lg** (`0 12px 40px rgba(0,0,0,0.45)`): modals, the toolbox panel, anything meant to feel
  above everything else.
- **glow** (`0 0 18px rgba(232,174,60,0.45)`) / **glow-soft** (`0 0 24px rgba(232,174,60,0.18)`):
  gold-tinted — active/focused accent elements only, never applied to neutral surfaces.

### Named Rules
**The Glow-Is-a-Signal Rule.** Gold glow means "interactive and currently relevant," not
"decorative flourish." If glow shows up on something static, it's misused.

## 5. Components

### Buttons
- **Shape:** `border-radius: 4px` (`--radius-md`) — sharp enough to feel precise, not
  pill-shaped-friendly-app-default.
- **Primary:** Spatial Gold Bright background, void-black text, `10px 24px` padding — the
  system's one loud interactive element.
- **Hover/Focus:** background shifts toward baseline Spatial Gold; `:focus-visible` gets a
  1.5px gold outline with 2px offset, system-wide (`--accent` outline, not browser default blue).
- **Ghost/Secondary:** transparent background, gold-muted border — used where a primary CTA
  would be too loud for the context (secondary actions inside a panel).

### Cards / Panels
- **Corner style:** `4px`–`6px` radius, never fully rounded/pill except pills themselves
  (`--radius-pill: 20px`) and true circular elements (`--radius-full`).
- **Background:** `ink-surface` steps, occasionally with `backdrop-filter: blur(4–20px)` for true
  overlay/floating chrome (the dev toolbox panel, modals) — glassmorphism is scoped to genuinely
  floating UI, never applied to static content cards.
- **Border:** hairline (`rgba(255,255,255,0.07–0.13)`), not a visible stroke — depth comes from
  the surface-step + shadow combination, the border is a whisper.

### Chapter Eyebrow (signature component)
The numbered chapter marker (`01 — THE SPACE`, `02 — LOCATION`, ...) that opens every section of a
property page. Mono, uppercase, wide-tracked, Spatial Gold or soft-grey depending on active state,
followed by a full-width hairline divider. This is a real navigational/informational system (ten
real chapters, reframed per space category) — not a decorative section marker, and should not be
flattened into a generic pattern.

### Navigation
- **Style:** mono uppercase labels for nav pills, Georgia serif for the wordmark ("ScoutIT," gold
  "S" and "IT" bracketing a white "cout").
- **States:** active nav item gets Spatial Gold Bright + subtle glow; inactive stays soft-grey.

## 6. Do's and Don'ts

### Do:
- **Do** keep gold to ≤5% of any screen — it's a signal, not a theme color.
- **Do** use the mono/uppercase/wide-tracked treatment for every piece of system chrome
  (eyebrows, badges, labels) — this is the system's core signature.
- **Do** use tonal surface-stepping (`ink-surface` → `ink-surface-3`) plus subtle neutral shadows
  for depth; reserve gold glow for genuinely interactive/focused elements only.
- **Do** treat the numbered chapter registry as real information architecture — it's earned by
  actually having ten sequential chapters, not applied as decoration.
- **Do** scope glassmorphism to genuinely floating chrome (toolbox, modals) — never static content.

### Don't:
- **Don't** read as a generic PH listings directory (Lamudi/Zillow-style board) — ScoutIt sells
  intelligence, not inventory count.
- **Don't** reach for "common luxury real estate" clichés — gold-and-marble old-money framing,
  ornate serif-everywhere, stock-photo-mansion imagery. The brand wants to feel new and
  category-defining, not like a polished version of an existing luxury template.
- **Don't** use pure `#000000` as a surface — void-black (`#0e0e0e`) always carries its intended
  warmth.
- **Don't** apply gold decoratively (backgrounds, large fills, borders-for-the-sake-of-borders) —
  every gold use should be a deliberate signal.
- **Don't** use `border-left`/`border-right` as a colored accent stripe on cards or list items.
- **Don't** use gradient text (`background-clip: text` + gradient).
- **Don't** apply the numbered-chapter/eyebrow pattern reflexively outside the property-page
  chapter system — it's a locked, specific signature there, not a general-purpose section marker
  for every new surface built.
