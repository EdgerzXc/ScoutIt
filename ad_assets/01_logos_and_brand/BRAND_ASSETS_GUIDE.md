# 💎 ScoutIt Brand Assets & Style Guide
**Single Source of Truth for Advertisement & Commercial Video Production**

---

## 1. Brand Identity & Visual DNA

ScoutIt is a **Physical Space Intelligence Platform** for Metro Manila and beyond. It bridges high-end architectural precision with everyday utility—giving ordinary renters, home buyers, business owners, and commercial operators transparent, verifiable property intelligence.

* **Primary Visual Aesthetic:** 95% deep obsidian (`#08080A`, `#0D0D0D`, `#121214`) and 5% glowing warm amber gold (`#E8AE3C`, `#F7C64E`).
* **Tactile Vibe:** Glassmorphism (`backdrop-filter: blur(16px)`), architectural reticles, high-contrast typography, and smooth cinematic motion.
* **Never Use:** Generic corporate blue/white bootstrap cards, cartoon isometric houses, or cheesy real estate tropes.

---

## 2. Color Palette & Exact CSS Tokens

| Color Role | HEX Code | RGB Values | CSS Variable | Usage in Video Production |
| :--- | :--- | :--- | :--- | :--- |
| **Obsidian Deep Ground** | `#08080A` | `8, 8, 10` | `--bg-canvas` | Main video background, pillarbox letterbox bars |
| **Obsidian Surface** | `#121214` | `18, 18, 20` | `--bg-surface` | UI card backgrounds, modal containers, video overlays |
| **Primary Amber Gold** | `#E8AE3C` | `232, 174, 60` | `--accent` | Logo marks, primary headings, border highlights |
| **Bright Interactive Gold**| `#F7C64E` | `247, 198, 78` | `--accent-bright` | Button hover states, call-to-action fills, glow halos |
| **Muted Border Gold** | `#6E531A` | `110, 83, 26` | `--accent-muted` | Hairline dividers, subtle radar rings, grid lines |
| **Crisp White Text** | `#FFFFFF` | `255, 255, 255`| `--text-primary`| Primary headlines, wordmark body text |
| **Muted Telemetry Grey** | `#A1A1AA` | `161, 161, 170`| `--text-muted` | Specs labels, coordinates, secondary descriptions |

---

## 3. Typography Rules

1. **Brand Wordmark:**
   - **`S`** (Bright Gold `#F7C64E`)
   - **`cout`** (Crisp White `#FFFFFF`)
   - **`IT`** (Bright Gold `#F7C64E`)
   - Font: `Space Grotesk` or `Syne` (Weight: 800 Bold, tracking: -0.02em).

2. **Telemetry & System Labels:**
   - Uppercase, spaced-out monospace: `JetBrains Mono` or `SF Mono`.
   - Tracking: `+0.12em` to `+0.25em`.
   - Used for coordinates (`14.5547° N, 121.0244° E`), Project NOAH meters, and button captions.

3. **Headlines:**
   - Clean, geometric modern sans: `Inter` or `Space Grotesk`.
   - High contrast, tight leading (1.1x).

---

## 4. Logo File Inventory in this Folder

| File Name | Format | Resolution | Best Use Case |
| :--- | :--- | :--- | :--- |
| `scoutit-mark-gold.svg` | SVG Vector | Infinite | Native motion graphics, After Effects shape layer, Figma |
| `scoutit-mark-white.svg` | SVG Vector | Infinite | Clean monochrome watermark or lower-third icon |
| `scoutit-wordmark-horizontal.svg` | SVG Vector | Infinite | Top navigation bar, website headers, YouTube banner |
| `scoutit-badge-space-intelligence.svg`| SVG Vector | Infinite | Circular seal, intro bumper, end screen brand mark |
| `scoutit-mark-gold-1024x1024.png` | Transparent PNG | 1024 × 1024 | Video intro sting, social avatar, app icon overlay |
| `scoutit-mark-gold-2048x2048.png` | Transparent PNG | 2048 × 2048 (4K)| 4K timeline overlay, high-zoom kinetic animation |
| `scoutit-mark-white-1024x1024.png`| Transparent PNG | 1024 × 1024 | Lower-third transparent watermark |
| `scoutit-mark-gold-on-obsidian-1080x1080.png` | Dark Tile PNG | 1080 × 1080 | Instagram square post, thumbnail background tile |
| `scoutit-wordmark-horizontal-1920x480.png` | Transparent PNG | 1920 × 480 | Video header, widescreen lower-third title card |
| `scoutit-badge-space-intelligence-1080x1080.png` | High-Res PNG | 1080 × 1080 | Official verification seal overlay |
| `scoutit-original-monogram-artwork.png` | Source Render PNG | Original | Source of truth 3D render with specular bevel |
| `scoutit-mascot-friendly-guide.png` | Transparent PNG | 800 × 800 | The approachable ScoutIt guide mascot |

---

## 5. Safe Zones & Video Overlay Guidelines

* **Lower-Third Bug:** Place `scoutit-wordmark-horizontal-1920x480.png` or `scoutit-mark-gold-1024x1024.png` at top-left or bottom-right with 5% margin from edge.
* **Opacity for Watermark:** Set layer opacity to `85%` for solid brand presence, or `50%` for continuous subtle corner telemetry.
* **End Card Duration:** Hold the resolved brand logo for **0.8 to 1.4 seconds** before the video ends (never linger for > 2.5s).
