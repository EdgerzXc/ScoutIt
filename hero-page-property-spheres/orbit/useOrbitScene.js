// Orbital scene engine: ONE renderer, ONE scene, ONE camera, six
// globe groups riding a single Catmull-Rom railway (see spline.js).
// Physics lives in refs — React state only changes on committed
// category switches and globe selection.

import { useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CATEGORY_WORLDS, COUNT, worldAt, slotIds, modelUrl } from "./categories";
import {
  SLOT_T,
  COMMIT_DIST,
  FLICK_VEL,
  scaleAt,
  opacityAt,
  zAt,
  sampleCurve,
} from "./spline";

const MODEL_S = 0.68; // uniform author scale — identical glass, identical treatment
const NORM_Y = 0.9; // glass-center height in model space, same for every globe
const VIEW_H = 4.4;
const CAM_Z = 7.0;
const IDLE_SPIN = (Math.PI * 2) / 45; // one revolution ≈45s, barely there
const NUDGE_GAP = 4000;
const WHEEL_COOL = 550;
const WHEEL_STEP = 70;
const INTENT_PX = 8;
const LOCK_RATIO = 1.2;

const easeOutCubic = (k) => 1 - Math.pow(1 - k, 3);

export function useOrbitScene(canvasRef, opts) {
  const { initialIndex, onCommit, onSelect, apiRef, visibleRef, debugRef } = opts;
  const debugEl = () => debugRef?.current ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      opts.onFallback?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
    scene.add(new THREE.HemisphereLight(0xfff4dd, 0x0d0d0d, 1.15));
    const key = new THREE.DirectionalLight(0xffe9c4, 2.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe8ae3c, 1.1);
    rim.position.set(-4, 1.5, -3);
    scene.add(rim);

    let viewW = 2;
    let sizedW = 0;
    let sizedH = 0;
    const frameCamera = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return false; // styles not applied yet — retry next frame
      viewW = VIEW_H * (w / h);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const a = sampleCurve(SLOT_T.active, viewW, VIEW_H);
      camera.position.set(a.x + 0.1, a.y + 0.05, CAM_Z);
      camera.lookAt(a.x, a.y, 0);
      camera.updateProjectionMatrix();
      sizedW = w;
      sizedH = h;
      return true;
    };
    frameCamera();
    window.addEventListener("resize", frameCamera);

    const loader = new GLTFLoader();
    const groups = new Map(); // id -> { outer, spin, mats, points, fade }
    const prog = new Map(); // id -> progress on the railway
    let committed = ((initialIndex % COUNT) + COUNT) % COUNT;
    let trans = null; // { t0, dur, from:Map, to:Map }
    let cancelled = false;
    let lastTouch = 0;
    let nudges = 0;
    let nudgeT = -1;
    let spin = 0;
    let velSpin = 0;
    let dragOffset = 0;
    let dragVel = 0;

    const slotTargets = (c) => {
      const ids = slotIds(c);
      return new Map([
        [ids.prev, SLOT_T.prev],
        [ids.active, SLOT_T.active],
        [ids.next, SLOT_T.next],
        [ids.after, SLOT_T.after],
      ]);
    };

    // Park every world: members on their slots, the rest off-path hidden.
    {
      const t = slotTargets(committed);
      for (const w of CATEGORY_WORLDS) prog.set(w.id, t.get(w.id) ?? 1.35);
    }

    const collectMats = (root) => {
      const mats = new Set();
      root.traverse((o) => {
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
      });
      mats.forEach((m) => {
        m.transparent = true;
      });
      return [...mats];
    };

    const makeDust = () => {
      const n = 70;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const r = 0.4 + Math.random() * 0.7;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = Math.abs(r * Math.cos(ph)) * 0.8 - 0.1;
        pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({
        color: 0xf7c64e, size: 0.022, transparent: true, opacity: 0.75, depthWrite: false,
      });
      const p = new THREE.Points(g, m);
      p.visible = !reduced;
      return p;
    };

    const placeGroup = (id) => {
      const gltf = cache.get(id);
      if (!gltf || groups.has(id)) return;
      const center = new THREE.Box3().setFromObject(gltf.scene).getCenter(new THREE.Vector3());
      const inner = new THREE.Group();
      inner.add(gltf.scene);
      inner.position.set(-center.x, -NORM_Y, -center.z);
      const spinG = new THREE.Group();
      spinG.add(inner);
      const outer = new THREE.Group();
      outer.add(spinG);
      outer.scale.setScalar(MODEL_S);
      const dust = makeDust();
      outer.add(dust);
      scene.add(outer);
      groups.set(id, { outer, spin: spinG, mats: collectMats(outer), dust, fade: 0 });
    };

    const cache = new Map();
    const loadOne = (id) => {
      if (cache.has(id)) {
        placeGroup(id);
        return;
      }
      loader.load(
        modelUrl(CATEGORY_WORLDS.find((w) => w.id === id).slug),
        (gltf) => {
          if (cancelled) return;
          cache.set(id, gltf);
          placeGroup(id);
        },
        undefined,
        () => opts.onFallback?.()
      );
    };

    // Critical path first, the rest while idle.
    {
      const ids = slotIds(committed);
      [ids.active, ids.prev, ids.next].forEach((id) => loadOne(id, true));
      const rest = CATEGORY_WORLDS.map((w) => w.id).filter(
        (id) => id !== ids.active && id !== ids.prev && id !== ids.next
      );
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
      idle(() => rest.forEach((id) => !cancelled && loadOne(id, false)));
    }

    const applyVisual = (id, p, fade) => {
      const g = groups.get(id);
      if (!g) return;
      const s = sampleCurve(p, viewW, VIEW_H);
      g.outer.position.set(s.x, s.y, zAt(p));
      g.outer.scale.setScalar(MODEL_S * scaleAt(p));
      const o = opacityAt(p) * fade;
      g.outer.visible = o > 0.004;
      g.mats.forEach((m) => {
        m.opacity = o;
      });
      if (g.dust) g.dust.material.opacity = 0.75 * o;
    };

    const startTransition = (dir, dur) => {
      const from = new Map(prog);
      const nc = ((committed + dir) % COUNT + COUNT) % COUNT;
      const to = slotTargets(nc);
      // Leavers keep travelling past their end instead of teleporting.
      const old = slotIds(committed);
      if (dir > 0 && !to.has(old.prev)) to.set(old.prev, -0.22);
      if (dir < 0 && !to.has(old.after)) to.set(old.after, 1.3);
      // Joiners slide in from off-path instead of popping.
      for (const [id] of to) {
        const cur = from.get(id);
        const vis = cur !== undefined && cur > -0.2 && cur < 1.28 && opacityAt(cur) > 0.01;
        if (!vis) from.set(id, dir > 0 ? 1.32 : -0.32);
        if (!groups.has(id)) loadOne(id, true);
      }
      // Late loaders appear at their slot (opacity fades them in).
      trans = { t0: performance.now(), dur: reduced ? 300 : dur, from, to };
      committed = nc;
      onCommit(nc);
      lastTouch = Date.now();
    };

    const fling = (dir) => {
      if (trans) return; // one transition at a time
      startTransition(dir > 0 ? 1 : -1, 650);
    };

    if (apiRef) {
      apiRef.current = {
        fling,
        nudgeSpin: (dir) => {
          if (!reduced) velSpin += dir * 0.16;
        },
      };
    }

    // ── gestures: 8px directional lock, then committed axis ──
    let dragging = false;
    let mode = null; // 'rotate' | 'browse' | null
    let moved = 0;
    let downT = 0;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let lastT = 0;
    let vAcc = 0;

    const canvasH = () => canvas.clientHeight || 600;

    const onDown = (e) => {
      dragging = true;
      mode = null;
      moved = 0;
      downT = Date.now();
      lastT = downT;
      startX = lastX = e.clientX;
      startY = lastY = e.clientY;
      velSpin = 0;
      dragOffset = 0;
      dragVel = 0;
      vAcc = 0;
      trans = null; // grab the railway mid-transition
      lastTouch = Date.now();
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = Math.max(moved, Math.hypot(e.clientX - startX, e.clientY - startY));
      const now = Date.now();
      if (!mode && moved > INTENT_PX) {
        const ax = Math.abs(e.clientX - startX);
        const ay = Math.abs(e.clientY - startY);
        if (ax > ay * LOCK_RATIO) mode = "rotate";
        else if (ay > ax * LOCK_RATIO) mode = "browse";
        else if (moved > INTENT_PX * 2) mode = ax >= ay ? "rotate" : "browse";
      }
      if (mode === "rotate") {
        const d = dx * 0.012;
        const g = groups.get(worldAt(committed).id);
        if (g) g.spin.rotation.y += d;
        spin += d;
        velSpin = reduced ? 0 : d;
      } else if (mode === "browse") {
        const dOff = (-dy / canvasH()) * 1.15;
        dragOffset = Math.max(-0.45, Math.min(0.45, dragOffset + dOff));
        const dt = Math.max(1, now - lastT);
        const inst = dOff / dt;
        vAcc = vAcc * 0.7 + inst * 0.3;
        dragVel = vAcc;
      }
      lastT = now;
      lastTouch = now;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (e.type === "pointercancel") {
        dragOffset = 0;
        return;
      }
      if (mode !== "browse" && moved < 6 && Date.now() - downT < 350) {
        dragOffset = 0;
        onSelect(worldAt(committed).id);
        return;
      }
      if (mode === "browse") {
        const o = dragOffset;
        const v = dragVel;
        dragOffset = 0;
        dragVel = 0;
        if (Math.abs(o) > COMMIT_DIST || Math.abs(v) > FLICK_VEL) {
          const dir = (o !== 0 ? Math.sign(o) : Math.sign(v)) || 1;
          startTransition(dir, Math.abs(v) > FLICK_VEL * 1.6 ? 480 : 700);
        } else {
          // Snap back: every travelling world returns, not just members.
          const base = slotTargets(committed);
          const to = new Map(prog);
          for (const [id, t] of base) to.set(id, t);
          trans = { t0: performance.now(), dur: 350, from: new Map(prog), to };
        }
      }
      lastTouch = Date.now();
    };

    let wheelAcc = 0;
    let wheelCool = 0;
    let wheelLast = 0;
    const onWheel = (e) => {
      const now = Date.now();
      if (now < wheelCool) return;
      if (now - wheelLast > 220) wheelAcc = 0;
      wheelLast = now;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > WHEEL_STEP) {
        wheelCool = now + WHEEL_COOL;
        wheelAcc = 0;
        fling(e.deltaY > 0 ? 1 : -1);
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    const onLost = (e) => {
      e.preventDefault();
      opts.onFallback?.();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (document.hidden || !visibleRef.current) {
        clock.getDelta();
        return;
      }
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      const now = Date.now();

      if (trans) {
        const k = Math.min(1, (now - trans.t0) / trans.dur);
        const e = reduced ? k : easeOutCubic(k);
        for (const [id, target] of trans.to) {
          prog.set(id, (trans.from.get(id) ?? target) + (target - (trans.from.get(id) ?? target)) * e);
        }
        if (k >= 1) trans = null;
      }

      // One-time discovery nudge: the peek globe breathes upward.
      let bump = 0;
      if (!reduced && !dragging && !trans && nudges < 2 && now - lastTouch > NUDGE_GAP && lastTouch > 0) {
        if (nudgeT < 0) nudgeT = now;
        const k = (now - nudgeT) / 900;
        if (k >= 1) {
          nudgeT = -1;
          nudges += 1;
        } else {
          bump = Math.sin(k * Math.PI) * 0.035;
        }
      } else if (nudgeT >= 0) {
        nudgeT = -1;
      }

      const base = slotTargets(committed);
      for (const w of CATEGORY_WORLDS) {
        const g = groups.get(w.id);
        if (!g) continue;
        let p = prog.get(w.id) ?? 1.35;
        if (!trans && dragging && mode === "browse" && base.has(w.id)) {
          p = (base.get(w.id) ?? p) + dragOffset + bump;
          prog.set(w.id, p); // commit/snap-back continues from the finger
        } else if (!trans && bump !== 0 && base.has(w.id)) {
          p = (base.get(w.id) ?? p) + bump;
        } else if (!trans && !dragging) {
          // At rest every member sits exactly on its slot.
          if (base.has(w.id)) p = base.get(w.id);
          prog.set(w.id, p);
        }
        if (trans) p = prog.get(w.id) ?? p;
        g.fade = Math.min(1, g.fade + dt * 3.2);
        applyVisual(w.id, p, g.fade);
      }

      // Active globe: idle drift + drag inertia; dust lags behind.
      const activeG = groups.get(worldAt(committed).id);
      if (activeG && !dragging && !reduced) {
        activeG.spin.rotation.y += velSpin + dt * IDLE_SPIN;
        velSpin *= Math.pow(0.94, dt * 60);
        spin = activeG.spin.rotation.y;
      } else if (activeG && reduced) {
        activeG.spin.rotation.y = spin;
      }
      for (const [, g] of groups) {
        if (g.dust) g.dust.rotation.y = (g === activeG ? spin * 0.55 : 0) + t * 0.03;
      }

      // Re-frame if layout arrived late (unstyled mount, late CSS).
      if (canvas.clientWidth !== sizedW || canvas.clientHeight !== sizedH) {
        frameCamera();
      }

      // Temporary mapping diagnostics (removed before owner sign-off).
      const dbg = debugEl();
      if (dbg && now - (tick._dbg || 0) > 500) {
        tick._dbg = now;
        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;
        const ids = slotIds(committed);
        const row = (id) => {
          const p = prog.get(id);
          const s = p === undefined ? null : sampleCurve(p, viewW, VIEW_H);
          return `${id}:p=${p === undefined ? "-" : p.toFixed(3)}${s ? ` x=${s.x.toFixed(2)} y=${s.y.toFixed(2)} sc=${(MODEL_S * scaleAt(p)).toFixed(2)}` : ""}`;
        };
        dbg.textContent =
          `canvas ${cw}x${ch} viewW ${viewW.toFixed(2)} committed ${committed}\n` +
          `slots prev=${SLOT_T.prev.toFixed(3)} active=${SLOT_T.active.toFixed(3)} next=${SLOT_T.next.toFixed(3)}\n` +
          [ids.prev, ids.active, ids.next, ids.after].map(row).join("\n");
      }

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", frameCamera);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("webglcontextlost", onLost);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      renderer.dispose();
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
