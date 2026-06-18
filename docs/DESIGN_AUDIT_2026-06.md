# ScoutIt Design Audit — June 2026 (Premium Design Pass)

Senior-designer review of the full codebase prior to the gold-system upgrade.
Branch: `feature/premium-design-pass` (baseline checkpoint `dd51405`).

---

## A. SYSTEMIC FINDINGS (affect every page)

### A1. Three diverging color systems — the #1 problem
The brand gold is defined in **three places that don't agree**:
1. `src/app/globals.css` → `--accent: #c8a96e` (champagne gold tokens).
2. `tailwind.config.js` → a second, Material-Design-style palette used by the
   dashboard: `gold-accent: #c8a96e`, `primary: #e5c487`, `primary-fixed: #ffdea3`,
   `gold-muted: #8a754d`, plus off-brand blue `tertiary: #bac7f2` ramps.
3. **181 raw `#c8a96e` hex literals** scattered across 37 files (plus ~190 raw
   `rgba(200,169,110,…)`) that bypass the token system entirely — direct
   violation of the design brief's "use the CSS variables, never raw hex" rule.

**Consequence:** changing the brand gold requires touching 40 files. Any new
component picks whichever gold its author saw last. The dashboard literally
renders a different gold than the homepage.

### A2. The gold is muted and disappears
- `#c8a96e` (champagne) reads as *beige* on `#0e0e0e` at small sizes (10–11px
  uppercase labels). It lacks the luminance to register as "gold."
- Glow treatments are nearly invisible: `--shadow-glow` is `rgba(…, 0.08)` —
  8% alpha. Card hover glows are 0.08–0.12. CTA hover glow is 0.2. None of
  these survive a real monitor at typical brightness.
- The Tailwind `gold-muted: #8a754d` is brown, not gold.

### A3. Body/secondary text is washed out
- **165 occurrences of `#8a8a8a`** used as body/caption text (worst offenders:
  `CommercialFlow.js` ×67, `ResidentialScrollytelling.js` ×50,
  `property-detail.css` ×17, `brokers.css` ×10). On near-black this is ~3.9:1
  contrast — fails WCAG AA for small text and reads as "cheap gray."
- Footer hardcodes its own gray ramp: `#888888`, `#666666`, `#444444`,
  `#a0a0a0` — none of them tokens.
- `--text-secondary` at 62% alpha is fine for captions but is widely used for
  full body paragraphs, where it's too faint.

### A4. Motion is inconsistent
Transitions are a lottery: `0.2s ease`, `0.25s ease`, `0.3s ease`,
`var(--transition-fast)`, `0.6s cubic-bezier` all coexist, frequently within
one component. There's a token system (`--transition*`) but half the code
ignores it.

### A5. Typography drift
- `ReactionButtons.js` (the *core conversion element*) uses
  `font-family: system-ui` — not the brand's Geist/Georgia stack.
- The Tailwind dashboard config specifies **Inter**, a font that isn't loaded
  anywhere (`layout.js` loads Geist Sans/Mono only) — silently falls back.
- Micro-labels go down to 8–9px (`service-cta` at 8px on mobile,
  `.tile-label` 9px, `.dropdown-brand` 8px) — below legibility floor and too
  weak to act as hierarchy anchors.

---

## B. INTERACTIVE-STATE FINDINGS

### B1. Missing focus/keyboard support on key controls
- `ReactionButtons.js` renders clickable **`<div>`s** — no `role="button"`, no
  `tabIndex`, no Enter/Space handling, no `:focus-visible` style. The single
  most important conversion action on the site is mouse-only.
- Global `:focus-visible` exists (good) but several styled-jsx components
  suppress outlines via `outline: none` on `:focus` (inputs replicate their own
  focus ring — acceptable — but buttons mostly don't).

### B2. Hover states exist but are too quiet
Most cards/buttons *do* have hover rules (163 `:hover` rules found), but:
- Border shifts of `rgba(gold, 0.28→0.4)` and background fills at 0.02 alpha
  are barely perceptible.
- `.service-cta` resting color is `--text-muted` (38% alpha) — a CTA that
  whispers.
- The homepage has 23 hover rules for ~50+ interactive class types; several
  inline-styled elements (mini-cards, tags) rely on globals.css
  `[style*=…]` attribute-selector hacks, which is fragile and leaves gaps.

### B3. Inline-style architecture on the homepage
`page.js` (143 KB single file) styles many elements inline, which is why
`globals.css` contains brittle selectors like
`[style*="grid-template-columns"]` and `[style*="height: '140px'"]` to patch
responsiveness after the fact. These hacks are time bombs (they match string
representations of inline styles and break on any reformat).

---

## C. PAGE-BY-PAGE NOTES

| Area | Verdict | Issues |
|---|---|---|
| **Header** | Good | Solid hover/dropdown; gold tap-highlight; raw rgba golds ×5; back-button text shrinks to 8px at 480px. |
| **Footer** | OK | Has hovers + translateY; but 6 hardcoded grays, no tokens; social links `href="#"` (dead links); Terms/Privacy `href="#"` (dead). |
| **Homepage** (`page.js`) | Strong concept, quiet execution | Outline CTAs correct pattern but glow 0.2; service-cta 11px muted; collection-btn glow 0.08 invisible; inline-style hacks (B3). |
| **Property directory** (`property.css`) | Well built | Card hover good (lift + border + img de-grayscale); search focus glow 0.1 too faint; checkbox/checked states good. |
| **Property detail** (`property-detail.css`, 41 KB) | — | 17× `#8a8a8a` body text; raw golds ×6. |
| **Ecosystem rosters** (brokers/photographers/researchers/event-planners) | OK | Tier system uses intentional cyan/silver/bronze badge colors (Diamond/Silver tiers) — *kept as semantic*, but tier-1 cyan glow animation competes with brand gold on otherwise-gold pages. |
| **Dashboard** (Tailwind island) | Inconsistent | Separate palette (A1), Inter font not loaded (A5), blue `tertiary` ramp off-brand. |
| **ReactionButtons** | Needs work | B1 accessibility; system-ui font; `#6a6a6a` 9px labels; gray confirm text. |
| **Wishlist / Intel / Discover** | OK structure | Same muted-gold + gray-text systemic issues. |

---

## D. UX FRICTION

1. **Dead links in the footer** (socials, Terms, Privacy → `#`) — undermines
   the premium claim instantly.
2. **Reaction feedback is faint**: 12px gray "Noted. Your board has been
   updated." — the one moment the product should feel rewarding.
3. **CTA hierarchy is flat**: every gold outline button has the same weight;
   nothing on a page reads as *the* primary action.
4. **8px labels on mobile** (back button, service CTAs) are illegible and
   weaken affordance.

---

## E. REMEDIATION PLAN (implemented in this pass)

1. **Single source of truth:** upgrade `globals.css` tokens to the new gold
   system — `--accent: #FFB800` (primary), `--accent-bright: #FFC929`
   (interactive), `--accent-muted: #7A5C00` (borders/dividers),
   `--shadow-glow: 0 0 18px rgba(255,184,0,0.45)` (CTA glow),
   `--text-secondary: #C8C8C8` (body).
2. **Eliminate drift:** replace all raw `#c8a96e` → `#ffb800` and
   `rgba(200,169,110,…)` → `rgba(255,184,0,…)` repo-wide (works in both CSS
   and canvas-drawing code); align `tailwind.config.js` golds to the same
   values.
3. **Fix washed-out text:** `#8a8a8a` → `#c8c8c8` repo-wide.
4. **Louder interactive states:** primary CTAs get `--accent-bright` fill +
   glow on hover; card hover borders/glows raised to perceptible alphas.
5. **ReactionButtons:** keyboard + focus-visible support, brand fonts,
   brighter active/confirm feedback.
6. Raise 8px mobile micro-labels to a 10px floor.

Deferred (flagged, not done in this pass): refactoring `page.js` inline-style
hacks; consolidating the dashboard's Tailwind palette into CSS-variable
references; real footer link destinations (needs owner content).
