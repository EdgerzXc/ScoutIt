"use client";

/* The real ScoutIT event-horizon pull field — stars, heavenly bodies,
   dust, comets and breathing rings spiralling into a black-hole core.
   Extracted from the homepage hero so it can be reused (e.g. the descent).
   Pauses when off-screen or the tab is hidden; respects reduced-motion. */

import { useEffect, useRef } from "react";

export default function EventHorizon({ className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
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
    const initStar = () => ({ angle: rand(0, Math.PI * 2), radius: edgeRadius(), size: rand(0.4, 1.8), baseOpacity: rand(0.3, 0.9), pull: rand(0.0003, 0.0012), twPhase: rand(0, Math.PI * 2), twSpeed: rand(0.6, 1.8) });
    const BODY_COLORS = [
      () => `rgba(255,184,0,${rand(0.3, 0.6).toFixed(2)})`,
      () => `rgba(240,237,232,${rand(0.2, 0.4).toFixed(2)})`,
      () => `rgba(136,136,170,${rand(0.2, 0.4).toFixed(2)})`,
    ];
    const initBody = () => ({ angle: rand(0, Math.PI * 2), radius: edgeRadius(), size: rand(2, 6), pull: rand(0.0004, 0.0009), angVel: rand(-0.0009, 0.0009), color: BODY_COLORS[Math.floor(Math.random() * BODY_COLORS.length)]() });
    const initDust = () => ({ angle: rand(0, Math.PI * 2), radius: edgeRadius(), length: rand(8, 20), opacity: rand(0.1, 0.2), pull: rand(0.0004, 0.0011), warm: Math.random() > 0.5 });
    const initComet = (spread = true) => ({ angle: rand(0, Math.PI * 2), radius: spread ? rand(maxR * 0.45, maxR * 1.05) : edgeRadius(), speed: rand(0.8, 2), tail: rand(40, 100), size: rand(1.5, 2.5), angVel: Math.random() < 0.5 ? rand(-0.001, 0.001) : 0, delay: rand(0, 5) });

    const buildScene = () => {
      stars = Array.from({ length: Math.round(rand(150, 180)) }, initStar);
      bodies = Array.from({ length: Math.round(rand(8, 10)) }, initBody);
      dust = Array.from({ length: Math.round(rand(4, 6)) }, initDust);
      comets = Array.from({ length: Math.round(rand(4, 6)) }, () => initComet(true));
      pulseRings = [];
      nextPulseAt = t + rand(2, 3);
      const base = Math.min(w, h);
      rings = [0.16, 0.27, 0.4, 0.56].map((f, i) => ({ r: base * f, phase: rand(0, Math.PI * 2), speed: rand(0.4, 0.9), lo: 0.03, hi: 0.07, inner: i === 0, outer: i === 3 }));
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

      const coreOp = 0.08 + 0.04 * Math.sin(t * 1.5);
      const coreR = Math.min(w, h) * 0.22;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(255,184,0,${coreOp.toFixed(3)})`);
      coreGrad.addColorStop(1, "rgba(255,184,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fillStyle = coreGrad; ctx.fill();

      const darkF = 0.5 + 0.5 * Math.sin((t - 2.5) * (2 * Math.PI / 5));
      const darkR = Math.min(w, h) * (0.10 + 0.14 * darkF);
      const darkGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, darkR);
      darkGrad.addColorStop(0, `rgba(0,0,0,${(0.7 * darkF).toFixed(3)})`);
      darkGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(cx, cy, darkR, 0, Math.PI * 2); ctx.fillStyle = darkGrad; ctx.fill();

      if (t >= nextPulseAt) { pulseRings.push({ age: 0 }); nextPulseAt = t + rand(3, 4); }
      for (let i = pulseRings.length - 1; i >= 0; i--) {
        const pr = pulseRings[i]; pr.age += dt;
        const p = pr.age / 2.5;
        if (p >= 1) { pulseRings.splice(i, 1); continue; }
        const eased = 1 - Math.pow(1 - p, 2);
        const r = 40 + (300 - 40) * eased;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,184,0,${(0.12 * (1 - p)).toFixed(3)})`;
        ctx.lineWidth = 2; ctx.stroke();
      }

      rings.forEach((ring) => {
        let op, lw = 1;
        if (ring.outer) {
          const f = 0.5 + 0.5 * Math.sin(t * (2 * Math.PI / 4));
          op = 0.05 + 0.30 * f; lw = 1 + 1.5 * f;
        } else {
          op = ring.lo + (ring.hi - ring.lo) * (0.5 + 0.5 * Math.sin(t * ring.speed + ring.phase));
        }
        ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,184,0,${op.toFixed(3)})`; ctx.lineWidth = lw; ctx.stroke();
        if (ring.inner) {
          const a0 = (t * 0.25) % (Math.PI * 2);
          ctx.beginPath(); ctx.arc(cx, cy, ring.r, a0, a0 + Math.PI * 0.6);
          ctx.strokeStyle = `rgba(255,184,0,${(op * 2.4).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.stroke();
        }
      });

      dust.forEach((d) => {
        d.radius *= (1 - d.pull);
        if (d.radius < 30) Object.assign(d, initDust(), { radius: edgeRadius() });
        const x = cx + Math.cos(d.angle) * d.radius, y = cy + Math.sin(d.angle) * d.radius;
        const x2 = cx + Math.cos(d.angle) * (d.radius + d.length), y2 = cy + Math.sin(d.angle) * (d.radius + d.length);
        const fade = Math.min(1, d.radius / (maxR * 0.6));
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2);
        ctx.strokeStyle = d.warm ? `rgba(240,237,232,${(d.opacity * fade).toFixed(3)})` : `rgba(255,184,0,${(d.opacity * fade).toFixed(3)})`;
        ctx.lineWidth = 1; ctx.stroke();
      });

      stars.forEach((s) => {
        s.radius *= (1 - s.pull);
        if (s.radius < 30) Object.assign(s, initStar(), { radius: edgeRadius() });
        const x = cx + Math.cos(s.angle) * s.radius, y = cy + Math.sin(s.angle) * s.radius;
        const tw = 0.75 + 0.25 * Math.sin(t * s.twSpeed + s.twPhase);
        ctx.beginPath(); ctx.arc(x, y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,237,232,${(s.baseOpacity * tw).toFixed(3)})`; ctx.fill();
      });

      bodies.forEach((b) => {
        b.radius *= (1 - b.pull); b.angle += b.angVel;
        if (b.radius < 30) Object.assign(b, initBody(), { radius: edgeRadius() });
        const x = cx + Math.cos(b.angle) * b.radius, y = cy + Math.sin(b.angle) * b.radius;
        const haloR = b.size * 2.5;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, haloR);
        grad.addColorStop(0, b.color); grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(x, y, haloR, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, b.size, 0, Math.PI * 2); ctx.fillStyle = b.color; ctx.fill();
      });

      comets.forEach((c) => {
        if (c.delay > 0) { c.delay -= dt; return; }
        c.radius -= c.speed * dt * 60; c.angle += c.angVel;
        if (c.radius < 30) { Object.assign(c, initComet(false), { delay: rand(0.5, 4) }); return; }
        const hx = cx + Math.cos(c.angle) * c.radius, hy = cy + Math.sin(c.angle) * c.radius;
        const tx = cx + Math.cos(c.angle) * (c.radius + c.tail), ty = cy + Math.sin(c.angle) * (c.radius + c.tail);
        const grad = ctx.createLinearGradient(hx, hy, tx, ty);
        grad.addColorStop(0, "rgba(255,184,0,0.8)"); grad.addColorStop(1, "rgba(255,184,0,0)");
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty);
        ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.lineCap = "round"; ctx.stroke();
        ctx.beginPath(); ctx.arc(hx, hy, c.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,250,235,0.95)"; ctx.shadowColor = "rgba(255,184,0,0.9)"; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
      });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      resize(); draw(0);
      const onResize = () => { resize(); draw(0); };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    let last = performance.now();
    const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; draw(dt); raf = requestAnimationFrame(loop); };
    let running = false, visible = true;
    const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const syncRunning = () => { if (visible && !document.hidden) start(); else stop(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncRunning(); });
    observer.observe(canvas);
    const onVisibility = () => syncRunning();
    document.addEventListener("visibilitychange", onVisibility);

    resize(); draw(0); start();
    window.addEventListener("resize", resize);
    return () => {
      stop(); observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className={`event-horizon-canvas ${className}`} aria-hidden="true" />;
}
