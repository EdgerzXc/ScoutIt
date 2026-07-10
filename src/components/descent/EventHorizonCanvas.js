"use client";

import { useEffect, useRef } from "react";
import { isLiteMode, LITE_MODE_EVENT } from "@/lib/liteMode";

// ═══════════════════════════════════════════════════════════════
// Hero black hole — Balance mode. Plain 2D canvas "event-horizon pull
// field": stars, heavenly bodies, dust trails, and comets pulled inward,
// plus breathing rings and shockwave pulses. This is the pre-raymarch hero
// (restored from git history at a76b81a, pulled into its own component
// instead of living inline in page.js) — no WebGL, no shader compile, no
// per-pixel cost. This is what everyone sees by default; the WebGL
// raymarched BlackHoleCanvas is reserved for Interactive Mode.
//
// Site conventions honored (same as BlackHoleCanvas):
//  - Lite Mode: never initializes, and tears down live on the toggle event
//  - Pauses when scrolled off-screen or the tab is hidden
// ═══════════════════════════════════════════════════════════════

export default function EventHorizonCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isLiteMode()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rand = (min, max) => min + Math.random() * (max - min);
    let w = 0, h = 0, cx = 0, cy = 0, maxR = 0, dpr = 1;
    let stars = [], bodies = [], dust = [], rings = [], comets = [];
    let pulseRings = [];
    let nextPulseAt = 2.5;
    let raf = 0;
    let t = 0;

    const edgeRadius = () => maxR * rand(0.75, 1.05);

    const initStar = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      size: rand(0.4, 1.8),
      baseOpacity: rand(0.3, 0.9),
      pull: rand(0.0003, 0.0012),
      twPhase: rand(0, Math.PI * 2),
      twSpeed: rand(0.6, 1.8),
    });
    const BODY_COLORS = [
      () => `rgba(232, 174, 60,${rand(0.3, 0.6).toFixed(2)})`,   // gold
      () => `rgba(240,237,232,${rand(0.2, 0.4).toFixed(2)})`,   // warm white
      () => `rgba(136,136,170,${rand(0.2, 0.4).toFixed(2)})`,   // cool blue
    ];
    const initBody = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      size: rand(2, 6),
      pull: rand(0.0004, 0.0009),
      angVel: rand(-0.0009, 0.0009),     // gentle arc / lensing curve
      color: BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)](),
    });
    const initDust = () => ({
      angle: rand(0, Math.PI * 2),
      radius: edgeRadius(),
      length: rand(8, 20),
      opacity: rand(0.1, 0.2),
      pull: rand(0.0004, 0.0011),
      warm: Math.random() > 0.5,
    });
    const initComet = (spread = true) => ({
      angle: rand(0, Math.PI * 2),
      // spread along the path on first build so arrivals are staggered
      radius: spread ? rand(maxR * 0.45, maxR * 1.05) : edgeRadius(),
      speed: rand(0.8, 2),                                   // px per frame @60fps
      tail: rand(40, 100),
      size: rand(1.5, 2.5),
      angVel: Math.random() < 0.5 ? rand(-0.001, 0.001) : 0, // some curve slightly
      delay: rand(0, 5),                                     // stagger first appearance (s)
    });

    const buildScene = () => {
      const starCount = Math.round(rand(150, 180));
      const bodyCount = Math.round(rand(8, 10));
      const dustCount = Math.round(rand(4, 6));
      stars = Array.from({ length: starCount }, initStar);
      bodies = Array.from({ length: bodyCount }, initBody);
      dust = Array.from({ length: dustCount }, initDust);
      comets = Array.from({ length: Math.round(rand(4, 6)) }, () => initComet(true));
      pulseRings = [];
      nextPulseAt = t + rand(2, 3);
      const base = Math.min(w, h);
      rings = [0.16, 0.27, 0.4, 0.56].map((f, i) => ({
        r: base * f,
        phase: rand(0, Math.PI * 2),
        speed: rand(0.4, 0.9),
        lo: 0.03, hi: 0.07,
        inner: i === 0,
        outer: i === 3,
      }));
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h / 2;
      maxR = Math.hypot(w, h) / 2 * 1.05;
      buildScene();
    };

    const draw = (dt) => {
      t += dt;
      ctx.clearRect(0, 0, w, h);

      // Inner core breath — central glow opacity oscillates (~4s cycle)
      const coreOp = 0.08 + 0.04 * Math.sin(t * 1.5);
      const coreR = Math.min(w, h) * 0.22;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(232, 174, 60,${coreOp.toFixed(3)})`);
      coreGrad.addColorStop(1, "rgba(232, 174, 60,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Black-hole darkness pulse — expands to pull light in, contracts to release it.
      // 5s cycle, offset 2.5s from the outer ring so they alternate (dark center while
      // outer ring brightens, then center glows while outer ring dims).
      const darkF = 0.5 + 0.5 * Math.sin((t - 2.5) * (2 * Math.PI / 5));
      const darkR = Math.min(w, h) * (0.10 + 0.14 * darkF);
      const darkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, darkR);
      darkGrad.addColorStop(0, `rgba(0,0,0,${(0.7 * darkF).toFixed(3)})`);
      darkGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, darkR, 0, Math.PI * 2);
      ctx.fillStyle = darkGrad;
      ctx.fill();

      // Pulse shockwave rings — emanate every 3-4s, decelerating as they expand
      if (t >= nextPulseAt) {
        pulseRings.push({ age: 0 });
        nextPulseAt = t + rand(3, 4);
      }
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const pr = pulseRings[i];
        pr.age += dt;
        const p = pr.age / 2.5;
        if (p >= 1) { pulseRings.splice(i, 1); continue; }
        const eased = 1 - Math.pow(1 - p, 2);          // shockwave: fast then slows
        const r = 40 + (300 - 40) * eased;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 174, 60,${(0.12 * (1 - p)).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Event-horizon rings (subtle breathing) + rotating lensing arc
      rings.forEach((ring) => {
        let op, lw = 1;
        if (ring.outer) {
          // Bold 4s breathe: opacity 0.05→0.35, stroke 1→2.5px
          const f = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 4));
          op = 0.05 + 0.30 * f;
          lw = 1 + 1.5 * f;
        } else {
          op = ring.lo + (ring.hi - ring.lo) * (0.5 + 0.5 * Math.sin(t * ring.speed + ring.phase));
        }
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 174, 60,${op.toFixed(3)})`;
        ctx.lineWidth = lw;
        ctx.stroke();
        if (ring.inner) {
          const a0 = (t * 0.25) % (Math.PI * 2);
          ctx.beginPath();
          ctx.arc(cx, cy, ring.r, a0, a0 + Math.PI * 0.6);
          ctx.strokeStyle = `rgba(232, 174, 60,${(op * 2.4).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      });

      // Dust trails — radial streaks, fading as they fall in
      dust.forEach((d) => {
        d.radius *= (1 - d.pull);
        if (d.radius < 30) Object.assign(d, initDust(), { radius: edgeRadius() });
        const x = cx + Math.cos(d.angle) * d.radius;
        const y = cy + Math.sin(d.angle) * d.radius;
        const x2 = cx + Math.cos(d.angle) * (d.radius + d.length);
        const y2 = cy + Math.sin(d.angle) * (d.radius + d.length);
        const fade = Math.min(1, d.radius / (maxR * 0.6));
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        ctx.strokeStyle = d.warm
          ? `rgba(240,237,232,${(d.opacity * fade).toFixed(3)})`
          : `rgba(232, 174, 60,${(d.opacity * fade).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Stars — slow straight pull toward center + gentle twinkle
      stars.forEach((s) => {
        s.radius *= (1 - s.pull);
        if (s.radius < 30) Object.assign(s, initStar(), { radius: edgeRadius() });
        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;
        const tw = 0.75 + 0.25 * Math.sin(t * s.twSpeed + s.twPhase);
        ctx.beginPath();
        ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,237,232,${(s.baseOpacity * tw).toFixed(3)})`;
        ctx.fill();
      });

      // Heavenly bodies — curved (spiral) infall with soft glow halo
      bodies.forEach((b) => {
        b.radius *= (1 - b.pull);
        b.angle += b.angVel;
        if (b.radius < 30) Object.assign(b, initBody(), { radius: edgeRadius() });
        const x = cx + Math.cos(b.angle) * b.radius;
        const y = cy + Math.sin(b.angle) * b.radius;
        const haloR = b.size * 2.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      });

      // Comets — bright heads with gold tails, pulled straight toward center
      comets.forEach((c) => {
        if (c.delay > 0) { c.delay -= dt; return; }
        c.radius -= c.speed * dt * 60;
        c.angle += c.angVel;
        if (c.radius < 30) {
          Object.assign(c, initComet(false), { delay: rand(0.5, 4) });
          return;
        }
        const hx = cx + Math.cos(c.angle) * c.radius;
        const hy = cy + Math.sin(c.angle) * c.radius;
        const tx = cx + Math.cos(c.angle) * (c.radius + c.tail);
        const ty = cy + Math.sin(c.angle) * (c.radius + c.tail);
        const grad = ctx.createLinearGradient(hx, hy, tx, ty);
        grad.addColorStop(0, "rgba(232, 174, 60,0.8)");
        grad.addColorStop(1, "rgba(232, 174, 60,0)");
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hx, hy, c.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,250,235,0.95)";
        ctx.shadowColor = "rgba(232, 174, 60,0.9)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };

    // Only animate while the hero canvas is actually on screen — once the user
    // scrolls to lower sections, a 60fps canvas keeps competing with the
    // scroll/snap animation for frame time.
    let running = false;
    let visible = true;
    let killed = false;
    const start = () => {
      if (running || killed) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const syncRunning = () => {
      if (visible && !document.hidden) start();
      else stop();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncRunning();
    });
    observer.observe(canvas);
    const onVisibility = () => syncRunning();
    document.addEventListener("visibilitychange", onVisibility);
    const onLiteToggle = (e) => {
      if (e.detail?.on) { killed = true; stop(); }
      else { killed = false; syncRunning(); }
    };
    window.addEventListener(LITE_MODE_EVENT, onLiteToggle);

    resize();
    draw(0);                 // paint one frame immediately (no blank flash before rAF)
    start();
    window.addEventListener("resize", resize);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(LITE_MODE_EVENT, onLiteToggle);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="event-horizon-canvas" aria-hidden="true" />;
}
