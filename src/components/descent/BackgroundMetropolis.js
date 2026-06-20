"use client";

import { useEffect, useRef } from "react";

/**
 * Layer 03 — Metropolis (dark gold ascent)
 *
 * Phase 1: Aerial descent over a tree-lined boulevard at dusk.
 * Phase 2: Street-level drive — gold-lit towers, lush canopy trees.
 */

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── SKY ── deep space black fading into a glowing gold horizon down the avenue. */
const SKY_VERT = `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const SKY_FRAG = `
  varying vec3 vDir;
  void main() {
    vec3 d = normalize(vDir);
    float t = d.y * 0.5 + 0.5;
    vec3 c;
    if      (t > 0.50) c = mix(vec3(0.02, 0.02, 0.02), vec3(0.00, 0.00, 0.00), (t-0.50)/0.50);
    else if (t > 0.20) c = mix(vec3(0.12, 0.09, 0.00), vec3(0.02, 0.02, 0.02), (t-0.20)/0.30);
    else               c = mix(vec3(1.00, 0.72, 0.00), vec3(0.12, 0.09, 0.00), t/0.20);

    gl_FragColor = vec4(c, 1.0);
  }
`;

/* ── BUILDINGS ──
   Each building gets a STYLE that drives a distinct silhouette so the
   skyline reads as individual structures rather than a row of clones:
     0 plain slab      1 stepped setback tower   2 tapered glass tower
     3 podium + slim tower   4 rotated/twisted slab   5 crowned spire   */
/* one row of buildings along the avenue.
   baseOffset pushes the row further back from the road so we can stack
   several rows into a deep, dense skyline. hBoost raises back rows so the
   city builds up toward the horizon instead of looking like a flat strip. */
function genStrip(side, startSeed, baseOffset = 0, hBoost = 0, zStart = -180) {
  const out = [];
  let z = zStart, s = startSeed;
  while (z < 200) {
    const gap   = 2  + rnd(s++) * 9;     // tighter packing
    const width = 14 + rnd(s++) * 46;
    const depth = 14 + rnd(s++) * 30;
    const setbk = baseOffset + 3 + rnd(s++) * 16;
    const h     = 8  + hBoost + rnd(s++) * 105;
    const type  = rnd(s++) < 0.32 ? 1 : 0; // glass vs concrete window tint
    /* assign style: taller buildings lean toward fancier silhouettes */
    const r = rnd(s++);
    let style;
    if (h < 28)       style = r < 0.7 ? 0 : 4;                 // low-rise: slab or rotated
    else if (h < 70)  style = r < 0.4 ? 0 : r < 0.7 ? 1 : 3;   // mid: slab / setback / podium
    else              style = r < 0.3 ? 1 : r < 0.6 ? 2 : r < 0.85 ? 3 : 5; // tall: fancy
    const rot = (rnd(s++) - 0.5) * (style === 4 ? 0.5 : 0.12);
    const cx = side === 'L' ? -(13 + setbk + width/2) : (13 + setbk + width/2);
    out.push({ x: cx, z: z + gap + width/2, w: width, d: depth, h, type, style, rot, seed: s*7 });
    z += gap + width; s += 4;
  }
  return out;
}
/* Front row lines the road; successive rows recede and rise to fill the
   skyline so the scene reads as a dense CBD, not a sparse strip. */
const SPECS = [
  /* front row — along the sidewalks */
  ...genStrip('L', 100, 0,  0),
  ...genStrip('R', 300, 0,  0),
  /* second row — set back, a bit taller */
  ...genStrip('L', 700, 46, 25),
  ...genStrip('R', 920, 46, 25),
];

/* ── TREES ── denser canopies for a more realistic silhouette */
function genTreeRow(xBase, startSeed, zStart = -135) {
  const trees = [];
  let z = zStart, s = startSeed;
  while (z < 165) {
    const spacing = 8 + rnd(s++) * 8;
    const isPalm  = rnd(s++) < 0.18;
    trees.push({
      x: xBase + (rnd(s++) - 0.5) * 2.5,
      z,
      trunkH:  isPalm ? 13 + rnd(s++) * 9 : 5 + rnd(s++) * 5,
      canopyR: isPalm ? 1.3 + rnd(s++) * 0.7 : 3.4 + rnd(s++) * 3.2,
      palm: isPalm,
      lean:  (rnd(s++) - 0.5) * 0.18,
      seed:  s * 13,
    });
    z += spacing; s++;
  }
  return trees;
}
const STREET_TREES = [...genTreeRow(-16, 500), ...genTreeRow(16, 600, -133)];

const MEDIAN_BUSHES = Array.from({ length: 55 }, (_, i) => ({
  x: (rnd(i*5+700) - 0.5) * 1.4,
  z: -120 + i*5 + rnd(i*5+701)*3,
  r: 0.5 + rnd(i*5+702)*0.7,
}));

/* ── FACADE TEXTURE ── realistic curtain wall, self-illuminated for dusk.
   Canvas y=0 = top of building (CanvasTexture flipY maps it to the top).
   Glass towers bake a dusk-sky reflection: cool indigo at the crown fading
   to a warm golden band at the base where they catch the setting sun.
   Concrete towers get punched windows over a dark spandrel with a warm
   wash low down. Used as an emissiveMap with emissive=white. */
function makeFacadeCanvas(fw, fh, density, seed, type, isMobile) {
  const scale = isMobile ? 4.4 : 2.2;
  const cols = Math.max(3, Math.round(fw / scale));
  const rows = Math.max(6, Math.round(fh / (scale * 0.86)));
  const CW = isMobile ? 12 : 6, CH = isMobile ? 12 : 6;                 // px per window cell
  const W = cols * CW, H = rows * CH;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");

  if (type === 1) {
    /* GLASS — dark sky reflection gradient (top→bottom) */
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, "#030303");    // deep black zenith
    g.addColorStop(0.60, "#080808");    // dark grey
    g.addColorStop(0.85, "#332400");    // dark gold band
    g.addColorStop(1.00, "#FFB800");    // glowing gold horizon catch
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* faint vertical sheen variation across panels */
    for (let c = 0; c < cols; c++) {
      if (rnd(seed + c * 53) < 0.5) {
        ctx.fillStyle = `rgba(255,255,255,${0.02 + rnd(seed + c) * 0.04})`;
        ctx.fillRect(c * CW, 0, CW, H);
      }
    }
    /* mullion grid */
    ctx.fillStyle = "rgba(0,0,0,0.40)";
    for (let c = 0; c <= cols; c++) ctx.fillRect(c * CW, 0, 1, H);
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * CH, W, 1);

    /* scattered warm interior lights behind the glass */
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const s = seed + r * 131 + c * 17;
      if (rnd(s) < density * 0.45) {
        const br = (0.50 + rnd(s * 7) * 0.5).toFixed(2);
        ctx.fillStyle = `rgba(255,184,0,${br})`; // True ScoutIt Gold
        ctx.fillRect(c * CW + 1, r * CH + 1, CW - 2, CH - 2);
      }
    }
  } else {
    /* CONCRETE — dark spandrel base */
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    /* subtle gold wash on lower third */
    const wg = ctx.createLinearGradient(0, H * 0.65, 0, H);
    wg.addColorStop(0, "rgba(255,184,0,0)");
    wg.addColorStop(1, "rgba(255,184,0,0.15)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    /* floor slab lines */
    ctx.fillStyle = "rgba(255,184,0,0.06)";
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * CH, W, 1);
    /* punched windows, lit warm */
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const s = seed + r * 211 + c * 29;
      if (rnd(s) < density) {
        const br = (0.6 + rnd(s * 7) * 0.4).toFixed(2);
        ctx.fillStyle = `rgba(255,184,0,${br})`; // True ScoutIt Gold
      } else {
        ctx.fillStyle = "rgba(5,5,5,0.95)";
      }
      ctx.fillRect(c * CW + 1, r * CH + 1, CW - 2, CH - 2);
    }
  }
  return cv;
}

/* ── COMPONENT ── */
export default function BackgroundMetropolis() {
  const mountRef = useRef(null);
  const fadeRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false, frameId, renderer, resizeObs;
    const disposables = [];

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      const scene = new THREE.Scene();
      const W = mount.clientWidth  || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768; // cheaper render on phones

      scene.fog = isMobile ? new THREE.Fog(0x0a0a0a, 40, 260) : new THREE.FogExp2(0x0a0a0a, 0.0035); // Dark grey/black fog

      const camera = new THREE.PerspectiveCamera(60, W/H, 0.3, 900);
      camera.position.set(0, 200, 90);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
      renderer.setSize(W, H);
      renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      mount.appendChild(renderer.domElement);

      /* SKY */
      const skyGeo = new THREE.SphereGeometry(550, 24, 12);
      skyGeo.scale(-1, 1, 1);
      const skyMat = new THREE.ShaderMaterial({
        vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
        side: THREE.BackSide, depthWrite: false,
      });
      scene.add(new THREE.Mesh(skyGeo, skyMat));
      disposables.push(skyGeo, skyMat);

      /* LIGHTS — pure gold and pitch black */
      scene.add(new THREE.HemisphereLight(0x111111, 0x1a1500, 1.5)); // Dark grey/gold hemisphere
      const sun = new THREE.DirectionalLight(0xFFB800, 1.80); // Bright pure gold horizon
      sun.position.set(30, 40, -180); scene.add(sun);
      /* strong gold rim fill from down the avenue */
      const sunFill = new THREE.DirectionalLight(0x7A5C00, 0.80);
      sunFill.position.set(0, 15, -200); scene.add(sunFill);
      scene.add(new THREE.AmbientLight(0x0d0d0d, 1.0)); // Pitch black ambient

      const mkP = (x, y, z, c, i, d) => {
        const l = new THREE.PointLight(c, i, d);
        l.position.set(x, y, z); scene.add(l);
      };
      const lampSpacing = isMobile ? 56 : 28;
      for (let lz = -120; lz < 160; lz += lampSpacing) {
        mkP(-17, 9, lz, 0xFFE4A0, 1.8, 55);
        mkP( 17, 9, lz, 0xFFE4A0, 1.8, 55);
      }

      /* GROUND — glossy dark asphalt reflecting the gold */
      const gGeo = new THREE.PlaneGeometry(900, 900);
      const gMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2, metalness: 0.8 });
      const gnd  = new THREE.Mesh(gGeo, gMat);
      gnd.rotation.x = -Math.PI/2;
      scene.add(gnd);
      disposables.push(gGeo, gMat);

      /* MEDIAN STRIP */
      const medGeo = new THREE.BoxGeometry(2.2, 0.28, 320);
      const medMat = new THREE.MeshStandardMaterial({ color: 0x142008, roughness: 0.98 });
      const med    = new THREE.Mesh(medGeo, medMat);
      med.position.set(0, 0.14, 0); scene.add(med);
      disposables.push(medGeo, medMat);

      /* MEDIAN BUSHES */
      const bushMats = [0x050505, 0x080808, 0x030303].map((c) => {
        const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 });
        disposables.push(m); return m;
      });
      const activeBushes = isMobile ? MEDIAN_BUSHES.filter((_, i) => i % 2 === 0) : MEDIAN_BUSHES;
      activeBushes.forEach((b, i) => {
        const bg = new THREE.SphereGeometry(b.r, 6, 4);
        const bsh = new THREE.Mesh(bg, bushMats[i % bushMats.length]);
        bsh.scale.set(1, 0.55, 1);
        bsh.position.set(b.x, 0.28 + b.r*0.3, b.z);
        scene.add(bsh); disposables.push(bg);
      });

      /* ROAD MARKINGS */
      for (let rz = -140; rz < 165; rz += (isMobile ? 24 : 12)) {
        const dg = new THREE.PlaneGeometry(0.22, 7);
        const dm = isMobile
          ? new THREE.MeshBasicMaterial({ color: 0x221800 }) // Opaque dark gold, much cheaper
          : new THREE.MeshBasicMaterial({ color: 0xFFB800, transparent: true, opacity: 0.15 }); // Glowing gold road lines
        const d  = new THREE.Mesh(dg, dm);
        d.rotation.x = -Math.PI/2;
        d.position.set(6.5, 0.06, rz); scene.add(d);
        disposables.push(dg, dm);
      }

      /* STREET LAMPS */
      const lpMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
      const lbMat = new THREE.MeshBasicMaterial({ color: 0xFFB800 });
      disposables.push(lpMat, lbMat);
      for (let lz = -120; lz < 160; lz += lampSpacing) {
        [-17, 17].forEach((sx) => {
          const pg = new THREE.CylinderGeometry(0.1, 0.16, 10, 5);
          const p  = new THREE.Mesh(pg, lpMat);
          p.position.set(sx, 5, lz); scene.add(p); disposables.push(pg);

          const ag = new THREE.CylinderGeometry(0.06, 0.06, 4, 4);
          const arm = new THREE.Mesh(ag, lpMat);
          arm.rotation.z = Math.PI/2;
          arm.position.set(sx > 0 ? sx - 2 : sx + 2, 10, lz);
          scene.add(arm); disposables.push(ag);

          const bg = new THREE.SphereGeometry(0.35, 6, 5);
          const bl = new THREE.Mesh(bg, lbMat);
          bl.position.set(sx > 0 ? sx - 4 : sx + 4, 10, lz);
          scene.add(bl); disposables.push(bg);
        });
      }

      /* ── TREES ── realistic dense canopies ──
         Deep black silhouettes against the gold sky. */
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 1 });
      const canopyColors = [0x050505, 0x080808, 0x030303, 0x060606];
      const canopyMats = canopyColors.map((c) => {
        const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true });
        disposables.push(m); return m;
      });
      disposables.push(trunkMat);

      const addFoliageCluster = (cx, cy, cz, radius, matBase, seed) => {
        /* a clump = 4-6 small spheres jittered around a centre, or just 1 on mobile */
        const blobs = isMobile ? 1 : 4 + Math.floor(rnd(seed) * 3);
        for (let b = 0; b < blobs; b++) {
          const br = radius * (0.45 + rnd(seed + b * 17) * 0.5);
          const bg = new THREE.SphereGeometry(br, 6, 5);
          const mat = canopyMats[(matBase + b) % canopyMats.length];
          const m = new THREE.Mesh(bg, mat);
          const a = rnd(seed + b * 7) * Math.PI * 2;
          const rr = rnd(seed + b * 11) * radius * 0.7;
          m.position.set(
            cx + Math.cos(a) * rr,
            cy + (rnd(seed + b * 5) - 0.4) * radius * 0.5,
            cz + Math.sin(a) * rr,
          );
          m.scale.set(1, 0.85, 1);
          scene.add(m); disposables.push(bg);
        }
      };

      const activeTrees = isMobile ? STREET_TREES.filter((_, i) => i % 2 === 0) : STREET_TREES;
      activeTrees.forEach((t, i) => {
        if (t.palm) {
          /* PALM — curved trunk + radiating frond spheres */
          const seg = 4;
          for (let g = 0; g < seg; g++) {
            const tg = new THREE.CylinderGeometry(0.13, 0.22 - g * 0.02, t.trunkH / seg + 0.4, 6);
            const tk = new THREE.Mesh(tg, trunkMat);
            const yy = (t.trunkH / seg) * (g + 0.5);
            tk.position.set(t.x + t.lean * yy * 0.4, yy, t.z);
            tk.rotation.z = -t.lean;
            scene.add(tk); disposables.push(tg);
          }
          const topX = t.x + t.lean * t.trunkH * 0.4;
          const fronds = isMobile ? 4 : 7;
          for (let f = 0; f < fronds; f++) {
            const angle = (f / fronds) * Math.PI * 2;
            const fg = new THREE.SphereGeometry(t.canopyR * 0.7, 5, 4);
            const frond = new THREE.Mesh(fg, canopyMats[(i + f) % canopyMats.length]);
            frond.scale.set(0.5, 0.2, 1.6);
            frond.rotation.y = angle;
            frond.rotation.z = 0.5;
            frond.position.set(
              topX + Math.cos(angle) * t.canopyR * 1.3,
              t.trunkH + 0.4 - Math.abs(Math.sin(angle)) * 0.6,
              t.z + Math.sin(angle) * t.canopyR * 1.3,
            );
            scene.add(frond); disposables.push(fg);
          }
        } else {
          /* SHADE TREE — tapered trunk that forks, then a broad layered crown */
          const tg = new THREE.CylinderGeometry(0.18, 0.42, t.trunkH, 6);
          const tk = new THREE.Mesh(tg, trunkMat);
          tk.position.set(t.x, t.trunkH / 2, t.z);
          tk.rotation.z = t.lean * 0.5;
          scene.add(tk); disposables.push(tg);

          /* a couple of branch stubs angling out */
          for (let br = 0; br < 3; br++) {
            const ba = (br / 3) * Math.PI * 2 + rnd(t.seed + br) * 1.5;
            const blen = t.canopyR * 0.8;
            const bgm = new THREE.CylinderGeometry(0.08, 0.16, blen, 5);
            const bm = new THREE.Mesh(bgm, trunkMat);
            bm.position.set(
              t.x + Math.cos(ba) * blen * 0.3,
              t.trunkH * 0.85,
              t.z + Math.sin(ba) * blen * 0.3,
            );
            bm.rotation.z = Math.cos(ba) * 0.9;
            bm.rotation.x = Math.sin(ba) * 0.9;
            scene.add(bm); disposables.push(bgm);
          }

          /* broad crown: a ring of foliage clusters + a central cap,
             wider than tall → the classic acacia umbrella */
          const crownY = t.trunkH + t.canopyR * 0.35;
          const ringN = isMobile ? 3 : 5 + Math.floor(rnd(t.seed + 3) * 3);
          for (let c = 0; c < ringN; c++) {
            const a = (c / ringN) * Math.PI * 2 + rnd(t.seed + c) * 0.5;
            const rr = t.canopyR * (0.75 + rnd(t.seed + c * 9) * 0.35);
            addFoliageCluster(
              t.x + Math.cos(a) * rr,
              crownY + (rnd(t.seed + c * 13) - 0.5) * t.canopyR * 0.4,
              t.z + Math.sin(a) * rr,
              t.canopyR * (0.55 + rnd(t.seed + c * 5) * 0.3),
              (i + c) % canopyColors.length,
              t.seed + c * 31,
            );
          }
          /* central top cap */
          addFoliageCluster(t.x, crownY + t.canopyR * 0.45, t.z, t.canopyR * 0.8, i % canopyColors.length, t.seed + 200);
        }
      });

      /* BUILDINGS — style-driven silhouettes */
      const topMat = new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.9 });
      disposables.push(topMat);
      const blinkMeshes = [];

      /* facade material for a given footprint slice */
      const makeFacade = (w, h, seed, type) => {
        let density = 0.22 + rnd(seed + 8) * 0.38 + (h > 60 ? 0.10 : 0);
        if (isMobile) density *= 0.25; // 75% fewer lit windows on mobile to reduce texture high-values

        const cv  = makeFacadeCanvas(w, h, density, seed, type, isMobile);
        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        disposables.push(tex);
        /* baked canvas drives emission;
           glossy black diffuse lets the gold directional sun add a premium sheen */
        const mat = type === 1
          ? new THREE.MeshStandardMaterial({
              color: 0x0d0d0d, map: tex, emissiveMap: tex,
              emissive: 0xffffff, emissiveIntensity: isMobile ? 0.4 : 1.0,
              roughness: 0.05, metalness: 0.95, // Highly reflective black glass
            })
          : new THREE.MeshStandardMaterial({
              color: 0x0d0d0d, map: tex, emissiveMap: tex,
              emissive: 0xffffff, emissiveIntensity: isMobile ? 0.4 : 0.95,
              roughness: 0.40, metalness: 0.50, // Dark matte metallic
            });
        disposables.push(mat);
        return mat;
      };

      /* one stacked volume (box) with windows on the 4 sides */
      const addVolume = (x, y0, z, w, h, d, type, seed, rot, geomFn) => {
        const mat = makeFacade(Math.max(w, d), h, seed, type);
        const geo = geomFn ? geomFn(w, h, d) : new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, geomFn ? mat : [mat, mat, topMat, topMat, mat, mat]);
        mesh.position.set(x, y0 + h / 2, z);
        mesh.rotation.y = rot;
        scene.add(mesh); disposables.push(geo);
        return mesh;
      };

      const goldTrim = (x, y, z, w, d, rot) => {
        const tg = new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4);
        const tm = new THREE.MeshBasicMaterial({ color: 0xFFB800 });
        const tr = new THREE.Mesh(tg, tm);
        tr.position.set(x, y + 0.25, z); tr.rotation.y = rot;
        scene.add(tr); disposables.push(tg, tm);
      };

      const addAntenna = (x, topY, z, seed) => {
        if (isMobile) return;
        const antH = 12 + rnd(seed + 100) * 14;
        const ag   = new THREE.CylinderGeometry(0.07, 0.14, antH, 4);
        const am   = new THREE.MeshBasicMaterial({ color: 0x888898 });
        const ant  = new THREE.Mesh(ag, am);
        ant.position.set(x, topY + antH / 2, z);
        scene.add(ant); disposables.push(ag, am);

        const blg = new THREE.SphereGeometry(0.36, 5, 5);
        const blm = new THREE.MeshBasicMaterial({ color: 0xFF3300 });
        const bl  = new THREE.Mesh(blg, blm);
        bl.position.set(x, topY + antH + 0.36, z);
        scene.add(bl); disposables.push(blg, blm);
      };

      /* rooftop clutter — water tanks, AC plant boxes, vents on a flat roof */
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 });
      disposables.push(roofMat);
      const addRoofClutter = (x, topY, z, w, d, rot, seed) => {
        if (isMobile) return;
        const n = 1 + Math.floor(rnd(seed + 1) * 3);
        for (let i = 0; i < n; i++) {
          const bw = 1.2 + rnd(seed + i * 7) * Math.min(4, w * 0.25);
          const bd = 1.2 + rnd(seed + i * 11) * Math.min(4, d * 0.25);
          const bh = 0.8 + rnd(seed + i * 13) * 3;
          const lx = (rnd(seed + i * 3) - 0.5) * (w - bw) * 0.8;
          const lz = (rnd(seed + i * 5) - 0.5) * (d - bd) * 0.8;
          const bg = new THREE.BoxGeometry(bw, bh, bd);
          const bm = new THREE.Mesh(bg, roofMat);
          bm.position.set(x + lx * Math.cos(rot) - lz * Math.sin(rot), topY + bh / 2,
                          z + lx * Math.sin(rot) + lz * Math.cos(rot));
          bm.rotation.y = rot;
          scene.add(bm); disposables.push(bg);
        }
      };

      /* glowing billboard sign mounted on a building face */
      const SIGN_COLORS = [0xff3d6e, 0x35d0ff, 0xffd23d, 0x7dff5a, 0xff7a26];
      const addBillboard = (x, y, z, w, d, rot, seed) => {
        const col = SIGN_COLORS[Math.floor(rnd(seed + 9) * SIGN_COLORS.length)];
        const sw = 2 + rnd(seed) * 4, sh = 3 + rnd(seed + 1) * 6;
        const sg = new THREE.PlaneGeometry(sw, sh);
        const sm = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, fog: true });
        const sign = new THREE.Mesh(sg, sm);
        /* mount on the +x or -x face, facing outward */
        const faceX = rnd(seed + 2) < 0.5 ? 1 : -1;
        sign.position.set(x + faceX * (w / 2 + 0.1) * Math.cos(rot), y, z + faceX * (w / 2 + 0.1) * Math.sin(rot));
        sign.rotation.y = rot + (faceX > 0 ? Math.PI / 2 : -Math.PI / 2);
        scene.add(sign); disposables.push(sg, sm);
        /* faint glow backing */
        if (!isMobile) {
          const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(sw * 1.6, sh * 1.6),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false })
          );
          glow.position.copy(sign.position);
          glow.rotation.copy(sign.rotation);
          scene.add(glow); disposables.push(glow.geometry, glow.material);
        }
      };

      const activeSpecs = isMobile ? SPECS.filter(s => Math.abs(s.x) < 60) : SPECS;
      activeSpecs.forEach((s) => {
        const { x, z, w, d, h, type, style, rot, seed } = s;

        if (style === 1) {
          /* STEPPED SETBACK — 3 stacked boxes shrinking as they rise */
          const tiers = 3;
          let y = 0;
          for (let t = 0; t < tiers; t++) {
            const frac = 1 - t * 0.24;
            const th = h * (t === tiers - 1 ? 0.34 : 0.33);
            addVolume(x, y, z, w * frac, th, d * frac, type, seed + t * 50, rot);
            y += th;
          }
          const topW = w * (1 - (tiers - 1) * 0.24), topD = d * (1 - (tiers - 1) * 0.24);
          goldTrim(x, y, z, topW, topD, rot);
          addRoofClutter(x, y, z, topW, topD, rot, seed + 5);
          if (h > 80) addAntenna(x, y, z, seed);

        } else if (style === 2) {
          /* TAPERED GLASS TOWER — a cylinder narrowing toward the top */
          const rB = Math.min(w, d) / 2;
          const mat = makeFacade(w, h, seed, 1);
          const geo = new THREE.CylinderGeometry(rB * 0.6, rB, h, 12, 1);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, h / 2, z); mesh.rotation.y = rot;
          scene.add(mesh); disposables.push(geo);
          /* glowing crown ring */
          const cg = new THREE.CylinderGeometry(rB * 0.62, rB * 0.62, 0.8, 12);
          const cm = new THREE.MeshBasicMaterial({ color: 0xFFB800 });
          const cr = new THREE.Mesh(cg, cm);
          cr.position.set(x, h + 0.4, z);
          scene.add(cr); disposables.push(cg, cm);
          if (h > 80) addAntenna(x, h, z, seed);

        } else if (style === 3) {
          /* PODIUM + SLIM TOWER — wide base, narrow tower offset on top */
          const podH = h * 0.22;
          addVolume(x, 0, z, w, podH, d, type, seed, rot);
          const tw = w * (0.4 + rnd(seed + 5) * 0.18);
          const td = d * (0.55 + rnd(seed + 6) * 0.2);
          const offX = (rnd(seed + 7) - 0.5) * (w - tw) * 0.6;
          const towerH = h - podH;
          const tx = x + offX * Math.cos(rot), tz = z + offX * Math.sin(rot);
          addVolume(tx, podH, tz, tw, towerH, td, type, seed + 30, rot);
          goldTrim(tx, h, tz, tw, td, rot);
          addRoofClutter(tx, h, tz, tw, td, rot, seed + 9);
          /* podium-top billboard sometimes */
          if (rnd(seed + 17) > 0.6) addBillboard(x, podH + h * 0.18, z, w, d, rot, seed + 21);
          if (h > 80) addAntenna(tx, h, tz, seed);

        } else if (style === 5) {
          /* CROWNED SPIRE — slab + pyramidal cap */
          const bodyH = h * 0.82;
          addVolume(x, 0, z, w, bodyH, d, type, seed, rot);
          const capGeo = new THREE.ConeGeometry(Math.min(w, d) * 0.62, h * 0.18, 4);
          const capMat = new THREE.MeshStandardMaterial({
            color: 0x05050f, emissive: new THREE.Color(1, 0.72, 0.2), emissiveIntensity: 0.55,
            roughness: 0.4, metalness: 0.3,
          });
          disposables.push(capGeo, capMat);
          const cap = new THREE.Mesh(capGeo, capMat);
          cap.position.set(x, bodyH + h * 0.09, z);
          cap.rotation.y = rot + Math.PI / 4;
          scene.add(cap);
          addAntenna(x, h, z, seed);

        } else {
          /* 0 plain slab / 4 rotated slab — single box, varied proportions */
          addVolume(x, 0, z, w, h, d, type, seed, rot);
          if (h > 50) goldTrim(x, h, z, w, d, rot);
          if (h > 30) addRoofClutter(x, h, z, w, d, rot, seed + 7);
          /* low/mid commercial blocks sometimes carry a façade billboard */
          if (h < 60 && rnd(seed + 23) > 0.55) addBillboard(x, h * 0.6, z, w, d, rot, seed + 31);
          if (h > 90 && rnd(seed + 99) > 0.55) addAntenna(x, h, z, seed);
        }
      });

      /* ── HERO BUILDING — the landmark tower that caps the avenue and gives
         the loop a climax (replaces the old empty-black ending). Centered on
         the vanishing point at the far end of the boulevard. ── */
      const HERO_Z = -210;
      {
        const hw = 60, hd = 60, hh = 300, hseed = 4242, tiers = 4;
        let hy = 0;
        for (let t = 0; t < tiers; t++) {
          const frac = 1 - t * 0.15;          // gentle setback taper
          const th = hh * 0.25;
          addVolume(0, hy, HERO_Z, hw * frac, th, hd * frac, 1, hseed + t * 60, 0);
          hy += th;
        }
        const topW = hw * (1 - (tiers - 1) * 0.15);
        goldTrim(0, hy, HERO_Z, topW, topW, 0);
        /* glowing gold crown ring */
        const crownGeo = new THREE.CylinderGeometry(topW * 0.5, topW * 0.5, 3.5, 18);
        const crownMat = new THREE.MeshBasicMaterial({ color: 0xFFB800 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, hy + 1.75, HERO_Z);
        scene.add(crown); disposables.push(crownGeo, crownMat);
        addAntenna(0, hy + 3.5, HERO_Z, hseed);
        /* dedicated beacon light + additive halo so it reads from far off */
        if (!isMobile) {
          const heroLight = new THREE.PointLight(0xFFC929, 3.4, 460, 1.1);
          heroLight.position.set(0, hh * 0.7, HERO_Z + 36);
          scene.add(heroLight);
          const haloGeo = new THREE.PlaneGeometry(topW * 5.5, hh * 1.25);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0xFFB800, transparent: true, opacity: 0.1,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.set(0, hh * 0.5, HERO_Z - 8);
          scene.add(halo); disposables.push(haloGeo, haloMat);
        }
      }

      /* ── ANIMATION (seamless looping fly-through) ──
         Aerial descent → drive down the avenue → arrive at the hero tower →
         fade to black across the seam → restart. */
      const PHASE1 = 0.30;          // fraction of the loop spent on the aerial descent
      const CYCLE_FRAMES = 2400;    // full loop length (~40s at 60fps)
      const FADE = 0.05;            // fraction at the seam used to fade through black
      const HERO_END = -140;        // camera stops this far down the avenue (in front of the hero)

      const p1S = new THREE.Vector3(0, 200, 90);
      const p1E = new THREE.Vector3(4,   4, 42);
      const l1S = new THREE.Vector3(0,   0,  0);
      const l1E = new THREE.Vector3(4,   6, -38);

      let cycle = 0, tick = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tick++;

        cycle += 1 / CYCLE_FRAMES;
        if (cycle >= 1) cycle -= 1;           // loop

        if (cycle <= PHASE1) {
          const t1 = easeInOut(cycle / PHASE1);
          camera.position.lerpVectors(p1S, p1E, t1);
          camera.lookAt(new THREE.Vector3().lerpVectors(l1S, l1E, t1));
        } else {
          const t2 = easeInOut((cycle - PHASE1) / (1 - PHASE1));
          const camZ = 42 + t2 * (HERO_END - 42);   // drive 42 → -140
          const sway = Math.sin(t2 * Math.PI * 1.6) * 0.7;
          const bob  = Math.sin(t2 * Math.PI * 9) * 0.05;
          /* drift to road centre and lock onto the hero, tilting up as it looms */
          camera.position.set(4 * (1 - t2) + sway, 3.8 + bob, camZ);
          camera.lookAt(sway * 0.2, 5.5 + t2 * 22, HERO_Z + 20);
        }

        /* fade to black across the loop seam (end + start) to hide the reset */
        let fade = 0;
        if (cycle > 1 - FADE)  fade = (cycle - (1 - FADE)) / FADE;
        else if (cycle < FADE) fade = 1 - cycle / FADE;
        if (fadeRef.current) fadeRef.current.style.opacity = fade.toFixed(3);

        renderer.render(scene, camera);
      };
      animate();

      resizeObs = new ResizeObserver(() => {
        if (!mount || !renderer) return;
        camera.aspect = mount.clientWidth/mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight);
      });
      resizeObs.observe(mount);
    });

    return () => {
      cancelled = true;
      if (frameId)   cancelAnimationFrame(frameId);
      if (resizeObs) resizeObs.disconnect();
      disposables.forEach((d) => d?.dispose?.());
      if (renderer) {
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {/* fade-to-black overlay driven by the animation loop to hide the seam */}
      <div ref={fadeRef} className="absolute inset-0" style={{ background: "#000", opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}
