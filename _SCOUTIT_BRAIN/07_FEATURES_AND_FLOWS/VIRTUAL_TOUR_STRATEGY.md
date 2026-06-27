# ScoutIt — Virtual Tour Strategy

> Last updated: 2026-06-27

## Decision Summary

We explored multiple 3D and 360° virtual tour technologies to find the right fit for ScoutIt's
property listing workflow. The goal: let scouts capture an interior room tour using just a phone,
with minimal cost and effort, that can be embedded on a ScoutIt property page.

---

## Technology Landscape

### Matterport
- **How it works:** Dedicated LiDAR camera scans a room from multiple positions. Uploads to
  Matterport Cloud which stitches scans into a 3D mesh with floor plans, dollhouse view, and
  measurements.
- **Output:** Full 3D walkthrough, accurate floor plans, room measurements, embeddable iframe
- **Cost:** Camera ~$5,500 + subscription $69–$309/mo
- **Verdict:** Gold standard. Save for scale. Use the operator/partner model — do NOT buy cameras.

### Luma AI
- **How it works:** Records a video on phone → AI uses Gaussian Splatting to reconstruct a
  photorealistic 3D scene
- **Output:** Explorable 3D scene, embeddable, photorealistic
- **Best for:** Exterior scenes, objects, outdoor spaces
- **Weakness:** Poor on plain interior walls — flat surfaces cause blurry/foggy artifacts
- **Verdict:** Exteriors ONLY. Not suited for standard room interiors.

### Zillow 3D Home
- **How it works:** Free iPhone app. Stand in center of room, slowly rotate 360°. App stitches
  into a panoramic tour. Repeat per room, link rooms together.
- **Output:** Room-to-room 360° panoramic walkthrough
- **Cost:** Free
- **Weakness:** Tours hosted on Zillow — always has Zillow branding, data not owned by ScoutIt
- **Verdict:** Right V1 move. Zero cost, any iPhone, proven technology. Validate engagement before
  investing further.

### Polycam
- **How it works:** Uses iPhone LiDAR sensor. Walk through a room while scanning. Generates 3D
  mesh + floor plan automatically in under a minute.
- **Output:** 3D walkthrough, floor plan with measurements, shareable link, embeddable
- **Cost:** Free tier (limited) → Pro ~$12–27/mo
- **Weakness:** Requires iPhone 12 Pro or newer (Pro line only) for LiDAR mode
- **Verdict:** V2 upgrade from Zillow. ScoutIt-branded embed, floor plans, own the data.

---

## ScoutIt Rollout Roadmap

### Phase 1 — Launch (Now)
**Tool: Zillow 3D Home**
- Cost: $0
- Hardware: Any iPhone
- Scout workflow: Download app → spin in each room → upload → paste link into ScoutIt listing
- Limitation: Zillow branded, data on their platform
- Goal: Validate that users engage with virtual tours before investing further

### Phase 2 — Growth
**Tool: Polycam Pro**
- Cost: ~$12–27/mo per account (or per scout)
- Hardware: iPhone 12 Pro or newer required
- Scout workflow: Open app → walk through property → auto-generates 3D tour + floor plan → share
  embed link to ScoutIt
- Upgrade over Zillow: ScoutIt-branded embed, floor plans, owns the data
- Goal: Higher quality tours, own the content, add floor plan value

### Phase 3 — Exterior Showcase
**Tool: Luma AI**
- Cost: Free
- Hardware: Any phone
- Scout workflow: Walk around exterior of property recording video → upload to Luma AI app → get
  embeddable 3D exterior scene
- Use case: Complement interior Polycam tour with a photorealistic exterior 3D capture
- Goal: Differentiated exterior presentation for premium listings

### Phase 4 — Scale (Operator Model)
**Tool: Matterport**
- Cost: Camera ~$5,500 + subscription (per org) — absorbed by operators, not ScoutIt
- Model: Source certified Matterport Service Partners (operators) per city. ScoutIt does NOT buy
  cameras. Operators bring the Pro3, scan the property, upload to ScoutIt's Matterport org —
  ScoutIt owns the digital twin.
- Output: Full 3D mesh, floor plans, measurements, dollhouse view, professional embed
- Source operators via: Matterport Service Partner Program (matterport.com/partners)
- Goal: Premium tier offering for commercial properties and high-value residential

---

## Quick Reference

| Phase | Tool            | Cost         | Device needed         | Output quality               |
|-------|-----------------|--------------|----------------------|------------------------------|
| V1    | Zillow 3D Home  | Free         | Any iPhone           | Good — 360° room-to-room     |
| V2    | Polycam         | $12–27/mo    | iPhone 12 Pro+ only  | Better + floor plan          |
| V3    | Luma AI         | Free         | Any phone            | Photorealistic exterior only |
| V4    | Matterport (op) | Per scan     | Dedicated camera     | Gold standard                |

---

## Key Decisions

- **Virtual tours are a V1.5 feature.** Launch with great photos first, add tours once traction is
  proven.
- **Do not invest in Matterport hardware.** Use the operator/partner model when ready.
- **Luma AI is for exteriors only** — not suited for plain-walled interiors.
- **Zillow 3D Home is the right V1 move** — free, fast, no training needed, any iPhone.
- **The Vault widget** (`matterportTourUrl` / `luma3dMapUrl` / `droneHeatmapUrl`) is already wired
  on the listing display side. The gap is the owner-submission→Vault field connection, which is
  Phase 2 work (see `06_MONETIZATION/VAULT_LISTING_LIFECYCLE.md`).
