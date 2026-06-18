"use client";

import { useEffect, useRef } from "react";

/**
 * Layer 03 — Metropolis
 *
 * Phase 1: Aerial descent looking down at a real boulevard —
 *   tree-lined avenue, irregular building setbacks, open spaces.
 * Phase 2: Street-level drive through the same avenue.
 *
 * Inspired by tropical CBD streets: wide road, canopy trees lining
 * both sides, buildings set at varied distances, median with hedging.
 */

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── SKY ── */
const SKY_VERT = `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const SKY_FRAG = `
  varying vec3 vDir;
  void main() {
    float t = vDir.y * 0.5 + 0.5;
    vec3 c;
    if      (t > 0.70) c = mix(vec3(0.02,0.01,0.10), vec3(0.01,0.00,0.05), (t-0.70)/0.30);
    else if (t > 0.50) c = mix(vec3(0.18,0.04,0.28), vec3(0.02,0.01,0.10), (t-0.50)/0.20);
    else if (t > 0.34) c = mix(vec3(0.48,0.07,0.22), vec3(0.18,0.04,0.28), (t-0.34)/0.16);
    else if (t > 0.20) c = mix(vec3(0.72,0.20,0.05), vec3(0.48,0.07,0.22), (t-0.20)/0.14);
    else               c = mix(vec3(0.92,0.55,0.10), vec3(0.72,0.20,0.05), t/0.20);
    gl_FragColor = vec4(c, 1.0);
  }
`;

/* ── ORGANIC BUILDING STRIPS ───────────────────────────────────────────
   Buildings are placed irregularly along both sides of the avenue.
   Each has a random setback from the road edge, random width, height.  */
function genStrip(side, startSeed) {
  const out = [];
  let z = -140;
  let s = startSeed;

  while (z < 160) {
    const gap    = 5  + rnd(s++) * 20;    // irregular gap before building
    const width  = 16 + rnd(s++) * 52;    // varied widths
    const depth  = 14 + rnd(s++) * 30;
    const setbk  = 14 + rnd(s++) * 26;    // distance from road edge (x=13)
    const h      = 8  + rnd(s++) * 105;   // wildly varied heights
    const type   = rnd(s++) < 0.30 ? 1 : 0; // 30% glass towers

    const cx = side === 'L'
      ? -(13 + setbk + width / 2)
      :  (13 + setbk + width / 2);

    out.push({ x: cx, z: z + gap + width / 2, w: width, d: depth, h, type, seed: s * 7 });
    z += gap + width;
    s += 4;
  }
  return out;
}

const SPECS = [...genStrip('L', 100), ...genStrip('R', 300)];

/* ── STREET TREES ──────────────────────────────────────────────────────
   Two rows of canopy trees along the sidewalk (x ≈ ±16).
   A few palms mixed in. Median hedging at x ≈ 0.                      */
function genTreeRow(xBase, startSeed, zStart = -135) {
  const trees = [];
  let z = zStart;
  let s = startSeed;
  while (z < 165) {
    const spacing = 9 + rnd(s++) * 9;
    const isPalm  = rnd(s++) < 0.20;
    trees.push({
      x: xBase + (rnd(s++) - 0.5) * 2.5,
      z,
      trunkH: isPalm ? 14 + rnd(s++) * 8 : 5 + rnd(s++) * 5,
      canopyR: isPalm ? 1.2 + rnd(s++) * 0.8 : 3 + rnd(s++) * 3,
      palm: isPalm,
      seed: s,
    });
    z += spacing;
    s++;
  }
  return trees;
}

const STREET_TREES = [
  ...genTreeRow(-16, 500),
  ...genTreeRow( 16, 600, -133),
];

const MEDIAN_BUSHES = Array.from({ length: 55 }, (_, i) => ({
  x: (rnd(i * 5 + 700) - 0.5) * 1.4,
  z: -120 + i * 5 + rnd(i * 5 + 701) * 3,
  r: 0.5 + rnd(i * 5 + 702) * 0.7,
}));

/* ── WINDOW TEXTURE ──────────────────────────────────────────────────── */
function makeFacadeCanvas(fw, fh, density, seed, type) {
  const PX = 4;
  const WC = Math.max(2, Math.floor(fw / 2.4));
  const WR = Math.max(3, Math.floor(fh / 2.4));
  const cv = document.createElement("canvas");
  cv.width = WC * PX; cv.height = WR * PX;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = type === 1 ? "#04080f" : "#04040a";
  ctx.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < WR; r++) {
    for (let c = 0; c < WC; c++) {
      const s = seed + r * 997 + c * 31;
      if (rnd(s) < density) {
        const br = (0.50 + rnd(s * 7) * 0.50).toFixed(2);
        if (type === 1) {
          const rv = 150 + Math.floor(rnd(s * 3) * 70);
          const gv = 195 + Math.floor(rnd(s * 5) * 60);
          ctx.fillStyle = `rgba(${rv},${gv},255,${br})`;
        } else {
          const gv = 165 + Math.floor(rnd(s * 3) * 62);
          ctx.fillStyle = `rgba(255,${gv},34,${br})`;
        }
        ctx.fillRect(c * PX + 0.5, r * PX + 0.5, PX - 1, PX - 1.5);
      }
    }
  }
  return cv;
}

/* ── COMPONENT ───────────────────────────────────────────────────────── */
export default function BackgroundMetropolis() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false;
    let frameId, renderer, resizeObs;
    const disposables = [];

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x140620, 0.0032);

      const W = mount.clientWidth  || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.3, 900);
      camera.position.set(0, 200, 90);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

      /* LIGHTS */
      scene.add(new THREE.HemisphereLight(0x280840, 0xa03808, 0.70));
      const sun = new THREE.DirectionalLight(0xff7428, 1.1);
      sun.position.set(60, 45, -20); scene.add(sun);
      scene.add(new THREE.AmbientLight(0x080510, 0.85));

      const mkP = (x, y, z, c, i, d) => {
        const l = new THREE.PointLight(c, i, d);
        l.position.set(x, y, z); scene.add(l);
      };
      // Street lamp pools (match the lamp positions below)
      for (let lz = -120; lz < 160; lz += 28) {
        mkP(-17, 9, lz, 0xFFE4A0, 1.8, 55);
        mkP( 17, 9, lz, 0xFFE4A0, 1.8, 55);
      }

      /* GROUND — asphalt */
      const gGeo = new THREE.PlaneGeometry(900, 900);
      const gMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.97 });
      const gnd  = new THREE.Mesh(gGeo, gMat);
      gnd.rotation.x = -Math.PI / 2;
      scene.add(gnd);
      disposables.push(gGeo, gMat);

      /* MEDIAN STRIP */
      const medGeo = new THREE.BoxGeometry(2.2, 0.28, 320);
      const medMat = new THREE.MeshStandardMaterial({ color: 0x142008, roughness: 0.98 });
      const med    = new THREE.Mesh(medGeo, medMat);
      med.position.set(0, 0.14, 0); scene.add(med);
      disposables.push(medGeo, medMat);

      /* MEDIAN BUSHES */
      const bushMats = [0x162608, 0x1e3010, 0x122006].map(
        (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 }); disposables.push(m); return m; }
      );
      MEDIAN_BUSHES.forEach((b, i) => {
        const bg = new THREE.SphereGeometry(b.r, 6, 4);
        const bm = bushMats[i % bushMats.length];
        const bsh = new THREE.Mesh(bg, bm);
        bsh.scale.set(1, 0.55, 1);
        bsh.position.set(b.x, 0.28 + b.r * 0.3, b.z);
        scene.add(bsh); disposables.push(bg);
      });

      /* ROAD MARKINGS */
      for (let rz = -140; rz < 165; rz += 12) {
        const dg = new THREE.PlaneGeometry(0.22, 7);
        const dm = new THREE.MeshBasicMaterial({ color: 0xeeeecc, transparent: true, opacity: 0.18 });
        const d  = new THREE.Mesh(dg, dm);
        d.rotation.x = -Math.PI / 2;
        d.position.set(6.5, 0.06, rz); scene.add(d);   // right lane divider
        disposables.push(dg, dm);
      }

      /* STREET LAMPS */
      const lpMat = new THREE.MeshStandardMaterial({ color: 0x505560, roughness: 0.8 });
      const lbMat = new THREE.MeshBasicMaterial({ color: 0xFFEEB8 });
      disposables.push(lpMat, lbMat);
      for (let lz = -120; lz < 160; lz += 28) {
        [-17, 17].forEach((sx) => {
          const pg = new THREE.CylinderGeometry(0.1, 0.16, 10, 5);
          const p  = new THREE.Mesh(pg, lpMat);
          p.position.set(sx, 5, lz); scene.add(p); disposables.push(pg);

          const ag = new THREE.CylinderGeometry(0.06, 0.06, 4, 4);
          const arm = new THREE.Mesh(ag, lpMat);
          arm.rotation.z = Math.PI / 2;
          arm.position.set(sx > 0 ? sx - 2 : sx + 2, 10, lz);
          scene.add(arm); disposables.push(ag);

          const bg = new THREE.SphereGeometry(0.35, 6, 5);
          const bl = new THREE.Mesh(bg, lbMat);
          bl.position.set(sx > 0 ? sx - 4 : sx + 4, 10, lz);
          scene.add(bl); disposables.push(bg);
        });
      }

      /* SIDEWALK TREES */
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 1 });
      const canopyMats = [0x142a08, 0x1e3a10, 0x102208, 0x1a3010, 0x0e2006].map(
        (c) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.96 }); disposables.push(m); return m; }
      );
      disposables.push(trunkMat);

      STREET_TREES.forEach((t, i) => {
        const tg = new THREE.CylinderGeometry(0.14, 0.24, t.trunkH, 5);
        const tk = new THREE.Mesh(tg, trunkMat);
        tk.position.set(t.x, t.trunkH / 2, t.z);
        scene.add(tk); disposables.push(tg);

        const cm = canopyMats[i % canopyMats.length];

        if (t.palm) {
          // Palm: a few small spheres fanning at the top
          for (let f = 0; f < 5; f++) {
            const angle = (f / 5) * Math.PI * 2;
            const fg = new THREE.SphereGeometry(t.canopyR * 0.7, 5, 4);
            const frond = new THREE.Mesh(fg, cm);
            frond.scale.set(0.6, 0.25, 1.4);
            frond.rotation.z = 0.4;
            frond.position.set(
              t.x + Math.cos(angle) * t.canopyR * 1.2,
              t.trunkH + 0.5,
              t.z + Math.sin(angle) * t.canopyR * 1.2,
            );
            scene.add(frond); disposables.push(fg);
          }
        } else {
          // Rain tree / acacia: 3-4 wide flat canopy layers
          const layers = 2 + Math.floor(rnd(t.seed) * 3);
          for (let l = 0; l < layers; l++) {
            const cr = t.canopyR * (0.65 + rnd(t.seed + l * 7) * 0.5);
            const cg = new THREE.SphereGeometry(cr, 7, 5);
            const cv = new THREE.Mesh(cg, canopyMats[(i + l) % canopyMats.length]);
            cv.scale.set(1 + rnd(t.seed + l * 3) * 0.4, 0.38 + rnd(t.seed + l * 5) * 0.22, 1 + rnd(t.seed + l * 4) * 0.4);
            cv.position.set(
              t.x + (rnd(t.seed + l * 9) - 0.5) * cr * 0.8,
              t.trunkH + cr * 0.28 + l * cr * 0.18,
              t.z + (rnd(t.seed + l * 11) - 0.5) * cr * 0.8,
            );
            scene.add(cv); disposables.push(cg);
          }
        }
      });

      /* BUILDINGS */
      const topMat = new THREE.MeshStandardMaterial({ color: 0x05050e, roughness: 1 });
      disposables.push(topMat);
      const blinkMeshes = [];

      SPECS.forEach((s) => {
        const density = 0.22 + rnd(s.seed + 8) * 0.38 + (s.h > 60 ? 0.10 : 0);
        const cv  = makeFacadeCanvas(s.w, s.h, density, s.seed, s.type);
        const tex = new THREE.CanvasTexture(cv);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        disposables.push(tex);

        const fMat = s.type === 1
          ? new THREE.MeshStandardMaterial({
              color: 0x06101e, emissiveMap: tex,
              emissive: new THREE.Color(0.44, 0.68, 1.0), emissiveIntensity: 0.72,
              roughness: 0.12, metalness: 0.80,
            })
          : new THREE.MeshStandardMaterial({
              color: 0x05050f, emissiveMap: tex,
              emissive: new THREE.Color(1, 0.67, 0.15), emissiveIntensity: 0.88,
              roughness: 0.68, metalness: 0.22,
            });
        disposables.push(fMat);

        const geo  = new THREE.BoxGeometry(s.w, s.h, s.d);
        const mesh = new THREE.Mesh(geo, [fMat, fMat, topMat, topMat, fMat, fMat]);
        mesh.position.set(s.x, s.h / 2, s.z);
        scene.add(mesh); disposables.push(geo);

        if (s.h > 50) {
          const tg = new THREE.BoxGeometry(s.w + 0.4, 0.5, s.d + 0.4);
          const tm = new THREE.MeshBasicMaterial({ color: 0xFFB800 });
          const tr = new THREE.Mesh(tg, tm);
          tr.position.set(s.x, s.h + 0.25, s.z);
          scene.add(tr); disposables.push(tg, tm);
        }

        if (s.h > 90 && rnd(s.seed + 99) > 0.55) {
          const antH = 14 + rnd(s.seed + 100) * 12;
          const ag   = new THREE.CylinderGeometry(0.07, 0.14, antH, 4);
          const am   = new THREE.MeshBasicMaterial({ color: 0x888898 });
          const ant  = new THREE.Mesh(ag, am);
          ant.position.set(s.x, s.h + antH / 2, s.z);
          scene.add(ant); disposables.push(ag, am);

          const blg = new THREE.SphereGeometry(0.36, 5, 5);
          const blm = new THREE.MeshBasicMaterial({ color: 0xFF3300 });
          const bl  = new THREE.Mesh(blg, blm);
          bl.position.set(s.x, s.h + antH + 0.36, s.z);
          bl.userData = { phase: rnd(s.seed + 88) * Math.PI * 2 };
          scene.add(bl); blinkMeshes.push(bl); disposables.push(blg, blm);
        }
      });

      /* ── ANIMATION ── */
      const PHASE1  = 0.42;
      const FRAMES  = 3000;

      const p1S = new THREE.Vector3(0, 200, 90);
      const p1E = new THREE.Vector3(4,   4, 42);
      const l1S = new THREE.Vector3(0,   0,  0);
      const l1E = new THREE.Vector3(4,   6, -38);

      let progress = 0, idleZ = -90, idleT = 0, tick = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tick++;

        if (progress < 1) {
          progress = Math.min(progress + 1 / FRAMES, 1);

          if (progress <= PHASE1) {
            const t1 = easeInOut(progress / PHASE1);
            camera.position.lerpVectors(p1S, p1E, t1);
            camera.lookAt(new THREE.Vector3().lerpVectors(l1S, l1E, t1));
          } else {
            const t2   = easeInOut((progress - PHASE1) / (1 - PHASE1));
            const camZ = 42 - t2 * 132;
            // slight gentle sway like driving on a real road
            const sway = Math.sin(t2 * Math.PI * 1.8) * 0.8;
            const bob  = Math.sin(t2 * Math.PI * 9)   * 0.05;
            camera.position.set(4 + sway, 3.8 + bob, camZ);
            camera.lookAt(4 + sway * 0.2, 5.5, camZ - 75);
            idleZ = camZ;
          }
        } else {
          idleT += 0.00055;
          idleZ -= 0.055;
          const sway = Math.sin(idleT * 0.65) * 1.5;
          const bob  = Math.sin(idleT * 8)    * 0.05;
          camera.position.set(4 + sway, 3.8 + bob, idleZ);
          camera.lookAt(4 + sway * 0.25, 5.5, idleZ - 75);
        }

        blinkMeshes.forEach((m) => {
          const on = Math.sin(tick * 0.042 + m.userData.phase) > 0.68;
          m.material.color.setHex(on ? 0xFF3300 : 0x180600);
        });

        renderer.render(scene, camera);
      };
      animate();

      resizeObs = new ResizeObserver(() => {
        if (!mount || !renderer) return;
        camera.aspect = mount.clientWidth / mount.clientHeight;
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
    <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
  );
}
