# STORYBOARD: ScoutIt Space Intelligence Film (15s)

## 1. Problem, Audience, Goal, Emotion (PAGE)
* **Problem:** Commercial real estate platforms are generic, static image boards plagued by outdated listings, zero physical risk intelligence, and fragmented broker communications.
* **Audience:** Institutional real estate investors, corporate real estate executives, and premier brokers managing high-value assets in Metro Manila (Makati CBD, BGC, Ortigas).
* **Goal:** Demonstrate that ScoutIt is not a listing site—it is an authoritative Space Intelligence Platform delivering live GIS hazard envelopes, authenticated broker pipelines, and instant institutional dossiers.
* **Emotion:** Cinematic confidence, high-conviction clarity, tactile velocity.

---

## 2. Brand Inventory
* **Logo Shape:** Architectural precision crosshair reticle merging with the geometric wordmark `SCOUT` + glowing amber `IT`.
* **Core Control:** Real-time GIS hazard layer toggles (NOAH flood zone, fault line proximity buffer, 800m pedestrian walk ring) and one-click institutional dossier export.
* **Material:** 95% deep obsidian (`#0D0E12`, `#08080A`), dark glassmorphism (`rgba(22, 24, 30, 0.85)` with subtle borders), and 5% glowing warm amber gold (`#E8AE3C`, `#F7C64E`).
* **Key Verb:** *Scout. Verify. Transact.*
* **Success Moment:** An institutional broker inquiry instantly verified, hazard-cleared, and exported into a diligence dossier in under one second.
* **Voice:** Concise, authoritative, analytical, institutional. Never salesy, never fluffy.
* **What We Never Do:** No cartoon isometric illustrations, no generic blue/zinc bootstrap cards, no fake sci-fi HUD timecodes, no bouncy cartoon springs, no dead black fades.

---

## 3. Four-Beat Structure (15 Seconds / 450 Frames @ 30 FPS)

| Beat | Frames | Time | Role | Buys | Hero Visual | Motion & Mechanics |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Hook** | 0 – 96 | 0.0s – 3.2s | Hook | Instant physical reality: ScoutIt targets specific prime assets with geospatial precision. | Macro coordinate reticle locking onto *The Estate Makati* (`14.5547° N, 121.0244° E`). | Reticle enters mid-motion (scale 3.2 to 1.0 via `snapSettle`), coordinates resolve, subtle drift into building silhouette, accelerates into cut with `gentleIn`. |
| **2. Turn** | 96 – 216 | 3.2s – 7.2s | Turn | Spatial risk intelligence: Beyond photos, ScoutIt computes flood risk, fault buffers, and transit walks. | Magnified 3-tier GIS Intelligence Envelope (`data-ui="captured"`). | Cut lands mid-motion. Scanner beam sweeps across blueprint wireframe. 3 live hazard meters snap: Flood Zone 0, 6.8km Fault Buffer, 800m Walk Ring. Camera glides subtly. |
| **3. Proof** | 216 – 360 | 7.2s – 12.0s | Proof | Verified velocity: Institutional credential verification and 1-click dossier export. | Magnified Pipeline Console (`data-ui="captured"`) with capital counter and export trigger. | Cursor enters oversized (3.2x), parks, clicks `EXPORT ASSET PACKAGE`. Counter steps from ₱180M to ₱340M committed capital. Instant confirmation: `DOSSIER GENERATED (PDF + CSV)`. |
| **4. CTA** | 360 – 450 | 12.0s – 15.0s | CTA | Authoritative brand imprint and invitation. | Monolithic `SCOUTIT // SPACE INTELLIGENCE` wordmark on obsidian ground with amber radial glow. | Wordmark crashes in from 3.0x scale with `snapSettle`, subline slides in with `softLand`, continuous subtle drift scale 1.0 to 0.96 to the final frame. |

---

## 4. Gates Checklist
* [x] **G0 Render Exists:** Decodes, 450 frames @ 30fps (15.0s), verified by `look.py`.
* [x] **G1 Proof Readable:** Magnified UI cards >= 0.55 W, text >= 0.04 H, high-contrast dark palette.
* [x] **G2 No Empty Frame:** No run of >3 consecutive flat frames (continuous drift across all 4 beats).
* [x] **G3 End Card Short:** Beat 4 is 90 frames (3.0s = 20% of 15s <= 25%), resolved hold < 1.4s with active drift.
* [x] **G4 One Hero Per Frame:** 1 dominant hero element per scene.
* [x] **G5 No Page Chrome:** All UI elements enclosed in `data-ui="captured"`; zero timecode HUDs, zero zinc greys, zero generic deck layouts.
