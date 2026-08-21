---
name: ScoutIt
description: The Philippines' first spatial commerce platform — space intelligence, not a listings board.
colors:
  primary: "#E8AE3C"
  primary-bright: "#F7C64E"
  primary-muted: "#6E531A"
  neutral-bg: "#0e0e0e"
  neutral-surface: "#161616"
  neutral-surface-2: "#1e1e1e"
  neutral-surface-3: "#242424"
  neutral-text: "#f0ede8"
  neutral-text-secondary: "#c8c8c8"
  signal-green: "#4caf7d"
  signal-amber: "#e8c84a"
  signal-red: "#e8644a"
typography:
  display:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
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
    backgroundColor: "{colors.primary-bright}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
  chapter-eyebrow:
    textColor: "{colors.primary}"
    typography: "{typography.label}"
---

# Design System: ScoutIt

## 1. Overview

**Creative North Star: "The Spatial Commerce"**

ScoutIt isn't a real estate listings board wearing a dark theme — it's an intelligence terminal for Philippine space, built for people deciding whether to trust it enough to act. The 95% void-black / 5% gold ratio is the working default, not a cage. Deviation is allowed when a surface earns it — but it must be argued for, not reached for. Depth comes first from tonal surface steps, atmosphere, and motion; blur and gradient are the last tools picked up, not the first.

This system explicitly rejects: generic PH listing-directory aesthetics (Lamudi/Zillow-style boards) and the "common luxury real estate" cliché (gold-and-marble old-money tropes, ornate serif-everywhere, stock-photo-mansion imagery). We lean into high-end modern SaaS aesthetics.

**Key Characteristics:**
- Deep-void canvas. Atmosphere comes from tonal surface steps and real scene lighting (WebGL, glow), not from decorative gradient washes.
- Gold is the signature and carries the accent budget. Sapphire and Emerald are semantic signal colors only (state, verification, AI attribution) — never decorative, never a second brand color.
- Mono-spaced, wide-tracked, uppercase labels for system chrome (eyebrows, badges, metadata)
- Georgia serif for display headlines — editorial weight, always a single solid color. Gradient-clipped text is banned; emphasis comes from weight, size, and color.
- Glassmorphism is a rare, minimal exception — used where a surface genuinely floats over live content (over the WebGL layer backgrounds, a sticky bar over moving media). Never the default card treatment. Lightest blur that achieves the effect.
- Hover physics (scale down, tilt, multi-layered glowing shadows) make the interface feel highly tactile and alive.

## 2. Colors

The palette is a strict two-role system by design: void-black carries everything, Spatial Gold punctuates.

### Primary
- **Spatial Gold** (`#E8AE3C`): baseline gold — headline accents, labels, verified badges, the color that says "this is ScoutIt," never applied broadly.
- **Spatial Gold Bright** (`#F7C64E`): interactive gold — buttons, CTAs, hover/active nav states. The version of gold that means "you can act on this."
- **Spatial Gold Muted** (`#6E531A`): subdued gold — borders, dividers, secondary accents where full gold would be too loud.

### Neutral
- **Void Black** (`#0e0e0e`): the base canvas. Not pure `#000` — carries a hair of warmth so it reads as considered, not default-dark-mode.
- **Ink Surface** (`#161616`): primary raised surface layer. Depth comes from these steps plus glow, not drop shadows.
- **Paper White** (`#f0ede8`): primary text. Warm off-white, not pure white — never `#fff` directly.
- **Soft Grey** (`#c8c8c8`): secondary text — labels, metadata, supporting copy.

### Semantic / Impeccable Accents
- **Signal Green & Emerald** (`#10b981`): Success, verified states.
- **Signal Amber** (`#f59e0b`): Pending, caution.
- **Signal Red** (`#ef4444`): Error, critical alerts.
- **Tech Sapphire** (`#3b82f6`): High-tech intelligence, AI insights, command center data.

### Named Rules
**The Dynamic Canvas Rule.** Pure `#000000` is forbidden. The base canvas is Void Black `#0e0e0e` — warm-leaning, never purple/blue. Depth on high-impact surfaces comes from tonal surface steps and scene lighting first; a radial wash is permitted only where there is no live background doing that job already.

**The Tactile Interface Rule.** All primary interactive surfaces (cards, buttons) must respond physically. Use `active:scale-[0.98]` and multi-layered glow shadows on hover to ensure the app feels alive and premium.

## 3. Typography

**Display Font:** Geist Sans (`--font-display`)
**Body Font:** Geist Sans (via `next/font`), system-ui fallback
**Label/Mono Font:** Geist Mono, 'Courier New' fallback

**Character:** Corrected 2026-08-20 — this section claimed a Georgia serif display face, but `--font-display` in `globals.css` has always resolved to Geist Sans. Nothing on the site rendered Georgia; CSS written as `var(--font-display, Georgia, serif)` never reached the fallback. The real contrast is WEIGHT and TRACKING, not serif-vs-sans: display runs Geist at 500 with tight negative tracking (-0.028em), body runs Geist at 400. The mono label layer is where the "intelligence terminal" feeling actually lives: every eyebrow, badge, and system-chrome label runs uppercase and wide-tracked in mono, deliberately looking like instrument-panel text.

### Hierarchy
- **Display** (500 weight, `clamp(32px, 5vw, 60px)`, 1.06 line-height, -0.028em tracking): hero headlines, layer titles, section headers. These are Layer 01 Orbit's values (`.orbit-hero-title`) — Layer 02 matches them exactly so the descent reads as one system.
- **Headline** (400 weight, 24px, 1.4 line-height): sub-headlines and editorial text.
- **Title** (600 weight, 20px, 1.2 line-height): working titles, section headings.
- **Body** (450 weight, 16px, 1.65 line-height): all prose copy.
- **Label** (500 weight, 10px, 0.18em letter-spacing, uppercase): chapter eyebrows (`01 — THE SPACE`), badges, system metadata. Mono only — never body or display fonts here.

### Named Rules
**The Instrument-Label Rule.** Any UI chrome that isn't a headline or body copy — eyebrows, badges, metadata, status labels — is mono, uppercase, and wide-tracked. This is the system's most recognizable signature; don't substitute a sans label "for variety."

## 4. Elevation

Flat by default, tonal layering for depth. Surfaces step through `void-black` → `ink-surface` → `ink-surface-2` → `ink-surface-3` rather than relying on drop shadows to imply stacking order. Shadows exist but stay subtle (25–45% opacity, neutral black) — they mark real state changes (raised panels, active cards), not ambient decoration. The one exception is **glow**: a gold-tinted shadow reserved for accent elements that are actively interactive or currently focused, functioning as a signal rather than a depth cue.

### Shadow & Glass Vocabulary
- **sm** (`0 2px 8px rgba(0,0,0,0.25)`): subtle lift, list items.
- **md** (`0 4px 16px rgba(0,0,0,0.35)`): standard dropdowns.
- **glass-panel** (rare): `rgba(14,14,14,0.72)` background, `10px` blur, 1px hairline border. Reserved for surfaces that genuinely float over live/moving content. Not for static cards.
- **glow** (`0 0 24px rgba(247,198,78,0.55)`): active/focused accent elements, vibrant hover states.
- **sapphire-glow** (`0 0 32px rgba(59,130,246,0.35)`): Used for AI or deep-insight elements.

### Named Rules
**The Glass Restraint Rule.** Opaque tonal surfaces are the default for all cards, KPI strips, and containers. `glass-panel` is permitted only when something live is moving behind the surface and must remain legible through it — at most one or two such surfaces per screen. If you cannot name what is moving behind it, use an opaque surface.

## 5. Components

### Buttons
- **Shape:** `border-radius: 4px` (`--radius-md`) — sharp enough to feel precise, not pill-shaped-friendly-app-default.
- **Primary:** Spatial Gold Bright background (`#F7C64E`), void-black text, `10px 24px` padding — the system's one loud interactive element.
- **Hover / Focus:** background shifts toward baseline Spatial Gold; glow pulse pauses and hands off to a lift + brighter static glow; `:focus-visible` gets a 1.5px gold outline with 2px offset.
- **Secondary / Ghost / Tertiary (if applicable):** transparent background, gold-muted border — used where a primary CTA would be too loud for the context.

### Chips
- **Style:** Background void-black, text paper white, border hairline solid.
- **State:** Selected state gets gold text.

### Cards / Containers
- **Corner Style:** `4px`–`6px` radius.
- **Background:** `ink-surface` steps (`#161616` to `#242424`).
- **Shadow Strategy:** Subtle neutral lift (`sm` or `md`), hover triggers gold glow for interactive cards (`hov-card`, `hov-glow`).
- **Border:** hairline (`rgba(255,255,255,0.07–0.13)`), not a visible stroke.
- **Internal Padding:** `16px` to `24px`.

### Inputs / Fields
- **Style:** 1px border solid, `void-black` background, `4px` radius.
- **Focus:** 1.5px gold outline, offset 2px.
- **Error / Disabled:** red tint for error, muted grey for disabled.

### Navigation
- **Style:** mono uppercase labels for nav pills, Georgia serif for the wordmark.
- **Hover/Active:** Active nav item gets Spatial Gold Bright + subtle glow; inactive stays soft-grey.

### Chapter Eyebrow
The numbered chapter marker (`01 — THE SPACE`, `02 — LOCATION`, ...) that opens every section of a property page. Mono, uppercase, wide-tracked, Spatial Gold or soft-grey depending on active state, followed by a full-width hairline divider. 

## 6. Do's and Don'ts

### Do:
- **Do** set major page titles in a single solid color — Paper White with a gold accent span where emphasis is needed.
- **Do** use the mono/uppercase/wide-tracked treatment for every piece of system chrome (eyebrows, badges, labels).
- **Do** build depth from tonal surface steps (`#0e0e0e` → `#161616` → `#1e1e1e` → `#242424`). Reach for `glass-panel` only when live content moves behind the surface.
- **Do** ensure physical, tactile feedback on all interactive elements via `active:scale-[0.98]` and expansive hover glows.

### Don't:
- **Don't** build generic PH listing sites (Lamudi/Zillow-style directory boards).
- **Don't** use the "common luxury real estate" cliché (gold-and-marble old-money tropes).
- **Don't** use pure `#000000` or `#FFFFFF` for any backgrounds.
- **Don't** make flat interfaces; if a primary card has no hover physics, it's a bug.
## Owner-approved surface baseline

Some high-risk public surfaces are protected by `npm run verify:surfaces`. The lock is deliberately stricter than a style guideline: it detects any source drift in the approved Showcase, Metropolis foreground, and Metropolis background files. The manifest checksum represents owner acceptance, not merely a passing build.

Do not “fix” a lock failure by regenerating its checksum. Restore the accepted source unless the owner requested the visual change, reviewed the local result at desktop and mobile widths, and explicitly approved replacing the baseline. Performance work on a locked WebGL background must preserve its composition and art direction unless the approval says otherwise.
