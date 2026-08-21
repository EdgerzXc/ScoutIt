"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/liteMode";

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
function windowColor(seed, alpha) {
  const temperature = rnd(seed + 991);
  if (temperature < 0.08) return `rgba(188, 205, 218, ${Math.min(alpha * 0.55, 0.58).toFixed(2)})`;
  if (temperature < 0.48) return `rgba(255, 224, 176, ${Math.min(alpha, 0.82).toFixed(2)})`;
  return `rgba(232, 174, 60, ${Math.min(alpha * 0.72, 0.68).toFixed(2)})`;
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
    if      (t > 0.52) c = mix(vec3(0.018, 0.020, 0.026), vec3(0.003, 0.004, 0.006), (t-0.52)/0.48);
    else if (t > 0.18) c = mix(vec3(0.17, 0.105, 0.035), vec3(0.018, 0.020, 0.026), (t-0.18)/0.34);
    else               c = mix(vec3(0.56, 0.30, 0.065), vec3(0.17, 0.105, 0.035), t/0.18);

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
    g.addColorStop(0.85, "#241b10");    // warm reflected horizon
    g.addColorStop(1.00, "#8c5b24");    // restrained amber horizon catch
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

    /* Offices illuminate in floor clusters, not independent checkerboard noise. */
    for (let r = 0; r < rows; r++) {
      const floorActivity = rnd(seed + r * 337);
      const floorDensity = density * 0.45 * (floorActivity < 0.28 ? 0.12 : 0.72 + floorActivity * 0.28);
      for (let c = 0; c < cols; c++) {
        const s = seed + r * 131 + c * 17;
        if (rnd(s) < floorDensity) {
          const brightness = 0.36 + rnd(s * 7) * 0.46;
          ctx.fillStyle = windowColor(s, brightness);
          ctx.fillRect(c * CW + 1, r * CH + 1, CW - 2, CH - 2);
        }
      }
    }
  } else {
    /* CONCRETE — dark spandrel base */
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, W, H);
    /* subtle gold wash on lower third */
    const wg = ctx.createLinearGradient(0, H * 0.65, 0, H);
    wg.addColorStop(0, "rgba(232, 174, 60,0)");
    wg.addColorStop(1, "rgba(232, 174, 60,0.07)");
    ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
    /* floor slab lines */
    ctx.fillStyle = "rgba(188, 176, 154, 0.055)";
    for (let r = 0; r <= rows; r++) ctx.fillRect(0, r * CH, W, 1);
    /* Residential and concrete floors retain believable occupancy bands. */
    for (let r = 0; r < rows; r++) {
      const floorActivity = rnd(seed + r * 419);
      const floorDensity = density * (floorActivity < 0.22 ? 0.16 : 0.68 + floorActivity * 0.24);
      for (let c = 0; c < cols; c++) {
        const s = seed + r * 211 + c * 29;
        if (rnd(s) < floorDensity) {
          const brightness = 0.38 + rnd(s * 7) * 0.42;
          ctx.fillStyle = windowColor(s + 41, brightness);
        } else {
          ctx.fillStyle = "rgba(4, 4, 5, 0.96)";
        }
        ctx.fillRect(c * CW + 1, r * CH + 1, CW - 2, CH - 2);
      }
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
    // Lite Mode: never start the WebGL scene on low-power devices — the CSS
    // layer background stays, only the animated canvas is skipped.
    if (isLiteMode() || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false, frameId, renderer, resizeObs;
    const disposables = [];

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      const W = mount.clientWidth  || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768; // cheaper render on phones

      scene.fog = isMobile ? new THREE.Fog(0x100f0c, 42, 245) : new THREE.FogExp2(0x100f0c, 0.0042);

      const camera = new THREE.PerspectiveCamera(isMobile ? 58 : 54, W/H, 0.3, 900);
      camera.position.set(0, 200, 90);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: false,
        depth: true,
        stencil: false,
        powerPreference: "high-performance",
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.25));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.92;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x0d0d0d, 1);
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
      scene.add(new THREE.HemisphereLight(0x1b2029, 0x1b1208, 0.72));
      const sun = new THREE.DirectionalLight(0xf0b45a, 1.18);
      sun.position.set(30, 44, -180); scene.add(sun);
      /* A restrained cool fill separates silhouettes without turning the scene blue. */
      const sunFill = new THREE.DirectionalLight(0x39424c, 0.28);
      sunFill.position.set(-45, 28, 80); scene.add(sunFill);
      scene.add(new THREE.AmbientLight(0x11100e, 0.38));

      const lampSpacing = isMobile ? 56 : 28;

      /* GROUND — glossy dark asphalt reflecting the gold */
      const gGeo = new THREE.PlaneGeometry(900, 900);
      const gMat = isMobile 
        ? new THREE.MeshBasicMaterial({ color: 0x050505 })
        : new THREE.MeshStandardMaterial({ color: 0x080807, roughness: 0.62, metalness: 0.12 });
      const gnd  = new THREE.Mesh(gGeo, gMat);
      gnd.rotation.x = -Math.PI/2;
      scene.add(gnd);
      disposables.push(gGeo, gMat);

      /* MEDIAN STRIP */
      const medGeo = new THREE.BoxGeometry(2.2, 0.28, 320);
      const medMat = isMobile
        ? new THREE.MeshBasicMaterial({ color: 0x142008 })
        : new THREE.MeshStandardMaterial({ color: 0x142008, roughness: 0.98 });
      const med    = new THREE.Mesh(medGeo, medMat);
      med.position.set(0, 0.14, 0); scene.add(med);
      disposables.push(medGeo, medMat);

      /* MEDIAN BUSHES */
      const bushMats = [0x050505, 0x080808, 0x030303].map((c) => {
        const m = isMobile
          ? new THREE.MeshBasicMaterial({ color: c })
          : new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 });
        disposables.push(m); return m;
      });
      const activeBushes = isMobile ? MEDIAN_BUSHES.filter((_, i) => i % 2 === 0) : MEDIAN_BUSHES;
      const bushGeo = new THREE.SphereGeometry(1, 6, 4);
      const bushGroups = bushMats.map(() => []);
      activeBushes.forEach((b, i) => bushGroups[i % bushMats.length].push(b));
      const bushDummy = new THREE.Object3D();
      bushGroups.forEach((group, materialIndex) => {
        if (group.length === 0) return;
        const bushes = new THREE.InstancedMesh(bushGeo, bushMats[materialIndex], group.length);
        group.forEach((b, index) => {
          bushDummy.position.set(b.x, 0.28 + b.r * 0.3, b.z);
          bushDummy.rotation.set(0, 0, 0);
          bushDummy.scale.set(b.r, b.r * 0.55, b.r);
          bushDummy.updateMatrix();
          bushes.setMatrixAt(index, bushDummy.matrix);
        });
        bushes.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        bushes.computeBoundingSphere();
        scene.add(bushes);
      });
      disposables.push(bushGeo);

      /* ROAD MARKINGS — one instanced draw rather than one mesh per dash. */
      const roadPositions = [];
      for (let rz = -140; rz < 165; rz += (isMobile ? 24 : 12)) roadPositions.push(rz);
      const roadGeo = new THREE.PlaneGeometry(0.22, 7);
      const roadMat = isMobile
        ? new THREE.MeshBasicMaterial({ color: 0x221800 })
        : new THREE.MeshBasicMaterial({ color: 0xd3b36f, transparent: true, opacity: 0.22 });
      const roadMarks = new THREE.InstancedMesh(roadGeo, roadMat, roadPositions.length);
      const roadDummy = new THREE.Object3D();
      roadPositions.forEach((rz, index) => {
        roadDummy.position.set(6.5, 0.06, rz);
        roadDummy.rotation.set(-Math.PI / 2, 0, 0);
        roadDummy.scale.set(1, 1, 1);
        roadDummy.updateMatrix();
        roadMarks.setMatrixAt(index, roadDummy.matrix);
      });
      roadMarks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
      roadMarks.computeBoundingSphere();
      scene.add(roadMarks);
      disposables.push(roadGeo, roadMat);

      /* STREET LAMPS */
      const lpMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const lbMat = new THREE.MeshBasicMaterial({ color: 0xe9bd74 });
      const lampLocations = [];
      for (let lz = -120; lz < 160; lz += lampSpacing) {
        lampLocations.push({ x: -17, z: lz }, { x: 17, z: lz });
      }
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.16, 10, 5);
      const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 4, 4);
      const bulbGeo = new THREE.SphereGeometry(0.35, 6, 5);
      const poles = new THREE.InstancedMesh(poleGeo, lpMat, lampLocations.length);
      const arms = new THREE.InstancedMesh(armGeo, lpMat, lampLocations.length);
      const bulbs = new THREE.InstancedMesh(bulbGeo, lbMat, lampLocations.length);
      const lampDummy = new THREE.Object3D();
      lampLocations.forEach(({ x, z }, index) => {
        lampDummy.position.set(x, 5, z);
        lampDummy.rotation.set(0, 0, 0);
        lampDummy.scale.set(1, 1, 1);
        lampDummy.updateMatrix();
        poles.setMatrixAt(index, lampDummy.matrix);

        lampDummy.position.set(x > 0 ? x - 2 : x + 2, 10, z);
        lampDummy.rotation.set(0, 0, Math.PI / 2);
        lampDummy.updateMatrix();
        arms.setMatrixAt(index, lampDummy.matrix);

        lampDummy.position.set(x > 0 ? x - 4 : x + 4, 10, z);
        lampDummy.rotation.set(0, 0, 0);
        lampDummy.updateMatrix();
        bulbs.setMatrixAt(index, lampDummy.matrix);
      });
      [poles, arms, bulbs].forEach((mesh) => {
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        mesh.computeBoundingSphere();
        scene.add(mesh);
      });

      /* Soft, baked pools imply street-light bounce without forcing every
         building material through a bank of expensive point lights. */
      if (!isMobile) {
        const poolCanvas = document.createElement("canvas");
        poolCanvas.width = poolCanvas.height = 64;
        const poolContext = poolCanvas.getContext("2d");
        const poolGradient = poolContext.createRadialGradient(32, 32, 0, 32, 32, 32);
        poolGradient.addColorStop(0, "rgba(255, 220, 160, 0.30)");
        poolGradient.addColorStop(0.35, "rgba(232, 174, 60, 0.13)");
        poolGradient.addColorStop(1, "rgba(232, 174, 60, 0)");
        poolContext.fillStyle = poolGradient;
        poolContext.fillRect(0, 0, 64, 64);
        const poolTexture = new THREE.CanvasTexture(poolCanvas);
        const poolMaterial = new THREE.MeshBasicMaterial({
          map: poolTexture,
          color: 0xffd9a3,
          transparent: true,
          opacity: 0.24,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: true,
        });
        const poolGeometry = new THREE.PlaneGeometry(1, 1);
        const pools = new THREE.InstancedMesh(poolGeometry, poolMaterial, lampLocations.length);
        lampLocations.forEach(({ x, z }, index) => {
          lampDummy.position.set(x > 0 ? x - 4 : x + 4, 0.075, z);
          lampDummy.rotation.set(-Math.PI / 2, 0, 0);
          lampDummy.scale.set(7, 15, 1);
          lampDummy.updateMatrix();
          pools.setMatrixAt(index, lampDummy.matrix);
        });
        pools.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        pools.computeBoundingSphere();
        scene.add(pools);
        disposables.push(poolTexture, poolMaterial, poolGeometry);
      }
      disposables.push(lpMat, lbMat, poleGeo, armGeo, bulbGeo);

      /* ── TREES ── realistic dense canopies ──
         Deep black silhouettes against the gold sky. */
      const trunkMat = new THREE.MeshBasicMaterial({ color: 0x020202 });
      const canopyColors = [0x050505, 0x080808, 0x030303, 0x060606];
      const canopyMats = canopyColors.map((c) => {
        const m = new THREE.MeshBasicMaterial({ color: c });
        disposables.push(m); return m;
      });
      disposables.push(trunkMat);

      const foliageInstances = canopyMats.map(() => []);

      const addFoliageCluster = (cx, cy, cz, radius, matBase, seed) => {
        /* Reuse one low-poly sphere per foliage tone. The layered placement keeps
           the broad acacia silhouette without creating hundreds of draw calls. */
        const blobs = isMobile ? 1 : 3 + Math.floor(rnd(seed) * 2);
        for (let b = 0; b < blobs; b++) {
          const br = radius * (0.45 + rnd(seed + b * 17) * 0.5);
          const a = rnd(seed + b * 7) * Math.PI * 2;
          const rr = rnd(seed + b * 11) * radius * 0.7;
          foliageInstances[(matBase + b) % canopyMats.length].push({
            x: cx + Math.cos(a) * rr,
            y: cy + (rnd(seed + b * 5) - 0.4) * radius * 0.5,
            z: cz + Math.sin(a) * rr,
            sx: br,
            sy: br * 0.85,
            sz: br,
          });
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
          const ringN = isMobile ? 3 : 4 + Math.floor(rnd(t.seed + 3) * 2);
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

      const foliageGeo = new THREE.SphereGeometry(1, 6, 5);
      const foliageDummy = new THREE.Object3D();
      foliageInstances.forEach((instances, materialIndex) => {
        if (!instances.length) return;
        const mesh = new THREE.InstancedMesh(foliageGeo, canopyMats[materialIndex], instances.length);
        instances.forEach(({ x, y, z, sx, sy, sz }, index) => {
          foliageDummy.position.set(x, y, z);
          foliageDummy.rotation.set(0, 0, 0);
          foliageDummy.scale.set(sx, sy, sz);
          foliageDummy.updateMatrix();
          mesh.setMatrixAt(index, foliageDummy.matrix);
        });
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        mesh.computeBoundingSphere();
        scene.add(mesh);
      });
      disposables.push(foliageGeo);

      /* BUILDINGS — style-driven silhouettes */
      const topMat = isMobile
        ? new THREE.MeshBasicMaterial({ color: 0x020202 })
        : new THREE.MeshStandardMaterial({ color: 0x020202, roughness: 0.9 });
      disposables.push(topMat);
      const blinkMeshes = [];
      const roofInstances = [];

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
        const mat = isMobile
          ? new THREE.MeshBasicMaterial({ map: tex }) // Bypass lighting completely on mobile
          : (type === 1
            ? new THREE.MeshStandardMaterial({
                color: 0x0d0d0d, map: tex, emissiveMap: tex,
                emissive: 0xffffff, emissiveIntensity: 0.72,
                roughness: 0.22, metalness: 0.68, // Dark curtain wall, not mirror chrome
              })
            : new THREE.MeshStandardMaterial({
                color: 0x0d0d0d, map: tex, emissiveMap: tex,
                emissive: 0xffffff, emissiveIntensity: 0.68,
                roughness: 0.68, metalness: 0.16, // Concrete reads matte and weighty
              }));
        disposables.push(mat);
        return mat;
      };

      /* one stacked volume (box) with windows on the 4 sides */
      const addVolume = (x, y0, z, w, h, d, type, seed, rot, geomFn) => {
        const mat = makeFacade(Math.max(w, d), h, seed, type);
        const geo = geomFn ? geomFn(w, h, d) : new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y0 + h / 2, z);
        mesh.rotation.y = rot;
        scene.add(mesh); disposables.push(geo);
        if (!geomFn) roofInstances.push({ x, y: y0 + h + 0.015, z, w, d, rot });
        return mesh;
      };

      const goldTrim = (x, y, z, w, d, rot) => {
        const tg = new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4);
        const tm = new THREE.MeshBasicMaterial({ color: 0xE8AE3C });
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
        const n = 1;
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
      const SIGN_COLORS = [0xe8ae3c, 0xf0d8ae, 0xc47b3d, 0x9da7ae];
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
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false })
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
          if (rnd(seed + 101) > 0.65) addRoofClutter(x, y, z, topW, topD, rot, seed + 5);
          if (h > 105 && rnd(seed + 102) > 0.45) addAntenna(x, y, z, seed);

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
          const cm = new THREE.MeshBasicMaterial({ color: 0xE8AE3C });
          const cr = new THREE.Mesh(cg, cm);
          cr.position.set(x, h + 0.4, z);
          scene.add(cr); disposables.push(cg, cm);
          if (h > 105 && rnd(seed + 102) > 0.45) addAntenna(x, h, z, seed);

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
          if (rnd(seed + 101) > 0.65) addRoofClutter(tx, h, tz, tw, td, rot, seed + 9);
          /* podium-top billboard sometimes */
          if (rnd(seed + 17) > 0.82) addBillboard(x, podH + h * 0.18, z, w, d, rot, seed + 21);
          if (h > 80) addAntenna(tx, h, tz, seed);

        } else if (style === 5) {
          /* CROWNED SPIRE — slab + pyramidal cap */
          const bodyH = h * 0.82;
          addVolume(x, 0, z, w, bodyH, d, type, seed, rot);
          const capGeo = new THREE.ConeGeometry(Math.min(w, d) * 0.62, h * 0.18, 4);
          const capMat = new THREE.MeshStandardMaterial({
            color: 0x05050f, emissive: new THREE.Color(0.43, 0.33, 0.1), emissiveIntensity: 0.18,
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
          if (h > 75 && rnd(seed + 44) > 0.55) goldTrim(x, h, z, w, d, rot);
          if (h > 65 && rnd(seed + 101) > 0.55) addRoofClutter(x, h, z, w, d, rot, seed + 7);
          /* low/mid commercial blocks sometimes carry a façade billboard */
          if (h < 60 && rnd(seed + 23) > 0.82) addBillboard(x, h * 0.6, z, w, d, rot, seed + 31);
          if (h > 110 && rnd(seed + 99) > 0.72) addAntenna(x, h, z, seed);
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
        const crownMat = new THREE.MeshBasicMaterial({ color: 0xE8AE3C });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.set(0, hy + 1.75, HERO_Z);
        scene.add(crown); disposables.push(crownGeo, crownMat);
        addAntenna(0, hy + 3.5, HERO_Z, hseed);
        /* Restrained additive halo keeps the crown legible without a global
           point-light pass across the entire skyline. */
        if (!isMobile) {
          const haloGeo = new THREE.PlaneGeometry(topW * 5.5, hh * 1.25);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0xE8AE3C, transparent: true, opacity: 0.055,
            blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.set(0, hh * 0.5, HERO_Z - 8);
          scene.add(halo); disposables.push(haloGeo, haloMat);
        }
      }

      /* A single instanced roof layer hides the facade texture on horizontal
         surfaces while avoiding six material groups for every box volume. */
      if (roofInstances.length) {
        const roofGeo = new THREE.PlaneGeometry(1, 1);
        const roofs = new THREE.InstancedMesh(roofGeo, topMat, roofInstances.length);
        const roofDummy = new THREE.Object3D();
        roofInstances.forEach(({ x, y, z, w, d, rot }, index) => {
          roofDummy.position.set(x, y, z);
          roofDummy.rotation.set(-Math.PI / 2, 0, -rot);
          roofDummy.scale.set(w, d, 1);
          roofDummy.updateMatrix();
          roofs.setMatrixAt(index, roofDummy.matrix);
        });
        roofs.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        roofs.computeBoundingSphere();
        scene.add(roofs);
        disposables.push(roofGeo);
      }

      /* ── ANIMATION (seamless looping fly-through) ──
         Aerial descent → drive down the avenue → arrive at the hero tower →
         fade to black across the seam → restart. */
      const PHASE1 = 0.30;          // fraction of the loop spent on the aerial descent
      const CYCLE_MS = 46000;       // stable duration regardless of display refresh rate
      const FADE = 0.05;            // fraction at the seam used to fade through black
      const HERO_END = -140;        // camera stops this far down the avenue (in front of the hero)

      const p1S = new THREE.Vector3(0, 200, 90);
      const p1E = new THREE.Vector3(4,   4, 42);
      const l1S = new THREE.Vector3(0,   0,  0);
      const l1E = new THREE.Vector3(4,   6, -38);
      const lookTarget = new THREE.Vector3();
      const renderInterval = isMobile ? 1000 / 30 : 1000 / 45;

      let cycle = 0;
      let lastNow = performance.now();
      let renderAccumulator = renderInterval;

      const animate = (now = performance.now()) => {
        frameId = requestAnimationFrame(animate);
        const deltaMs = Math.min(Math.max(now - lastNow, 0), 100);
        lastNow = now;

        /* Keep background work out of hidden tabs and cap the cinematic layer.
           A steady 45/30 fps is smoother than an overloaded, variable 60 fps. */
        if (document.hidden) {
          renderAccumulator = 0;
          return;
        }
        renderAccumulator += deltaMs;
        if (renderAccumulator < renderInterval) return;
        const stepMs = renderAccumulator;
        renderAccumulator %= renderInterval;

        cycle = (cycle + stepMs / CYCLE_MS) % 1;

        if (cycle <= PHASE1) {
          const t1 = easeInOut(cycle / PHASE1);
          camera.position.lerpVectors(p1S, p1E, t1);
          camera.lookAt(lookTarget.lerpVectors(l1S, l1E, t1));
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
        if (!mount || !renderer || !mount.clientWidth || !mount.clientHeight) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth, mount.clientHeight, false);
      });
      resizeObs.observe(mount);
    }).catch(() => {
      if (!cancelled) mount.dataset.webglFallback = "true";
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
