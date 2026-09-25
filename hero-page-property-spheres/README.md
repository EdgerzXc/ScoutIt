# Hero Page Property Spheres — PARKED (2026-09-22)

Owner call: the rail rendered too small vs. the paint reference and the
back-and-forth wasn't converging. Parked whole, nothing deleted, to be
re-implemented better later.

## What is stored here

- `CategoryOrbit.js` — hero rail shell (tier decision, labels, keyboard,
  devour-to-`/property?type=X`, `?orbitdebug` overlay, all styles inline)
- `orbit/categories.js` — 6-world registry (routes reuse `?type=`)
- `orbit/spline.js` — one measured Catmull-Rom railway, slot progress
  values, scale/opacity/z curves, commit thresholds
- `orbit/useOrbitScene.js` — single renderer/scene/camera, 6 globe
  groups, ref-only physics, directional-lock gestures, gold-dust
  particles, discovery nudge, reduced-motion + off-screen guards
- `orbit/LiteOrbit.js` — still-image tier (prev/active/peek, 12s cycle)
- `planets/` — 6 GLBs (~330–390KB) + 6 transparent PNG stills.
  Blender source lives OUTSIDE the repo:
  `Documents/scoutit-planets.blend`

## Restore steps

1. Move `CategoryOrbit.js` → `src/components/hero/`
2. Move `orbit/` → `src/components/hero/orbit/`
3. Move `planets/` → `public/planets/`
4. In `src/app/HomeClient.js`: dynamic-import CategoryOrbit (ssr:false),
   render `<CategoryOrbit counts={{...}} />` inside a positioned
   `.planet-rail-wrap` div in the hero section, add the rail CSS.
   (This work was never committed, so git history does NOT have the
   removed block — rewire by hand following steps 1–4.)
5. `npm run verify:surfaces`, eslint the touched files, check `/`
   on a ≥1400px screen with Lite Mode OFF.

## Known state at park time

- Spline math, slot spread, CSS sizes, and prod build all verified;
  lite tier pixel-checked headless. Owner's screen repeatedly showed
  small globes — never reproduced on a clean load; prime suspect was
  torn Turbopack-HMR chunks in a long-lived tab, never proven.
- Open design gap: owner wants ~300px+ globes per the paint sketch;
  last sizes were scaled toward that but never owner-confirmed.
- `?orbitdebug` overlay still in the shell for next time.
