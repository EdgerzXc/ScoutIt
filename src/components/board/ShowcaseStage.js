"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES, BOARD_AWARDS } from "@/data/mockShowcase";

// ════════════════════════════════════════════════════════════════
// Tier definitions
// ════════════════════════════════════════════════════════════════
const TIER_ORDER = ["universe", "cluster", "solar", "starry"];
const TIERS = {
  universe: { label: "① Universe", color: "#E8AE3C", rgb: "232, 174, 60", flash: "rgba(232, 174, 60,0.85)", badge: "Universe" },
  cluster:  { label: "② Cluster",  color: "#C0C0C0", rgb: "192,192,192", flash: "rgba(220,225,240,0.85)", badge: "Cluster" },
  solar:    { label: "③ Solar",    color: "#CD7F32", rgb: "205,127,50",  flash: "rgba(205,127,50,0.85)",  badge: "Solar" },
  starry:   { label: "④–⑩ Starry", color: "#888888", rgb: "136,136,136", flash: "rgba(15,30,80,0.85)",    badge: "Looking Up" },
};
const rnd = (a, b) => a + Math.random() * (b - a);
const tierForRank = (rank) => (rank === 1 ? "universe" : rank === 2 ? "cluster" : rank === 3 ? "solar" : "starry");

// ════════════════════════════════════════════════════════════════
// SCENE: UNIVERSE (gold spiral galaxy)
// ════════════════════════════════════════════════════════════════
function buildUniverse(W, H) {
  const stars = [], bgGalaxies = [], armParticles = [], dustLanes = [], comets = [], sparkles = [];
  for (let i = 0; i < 900; i++) {
    const warm = Math.random() < 0.35, cool = Math.random() < 0.3;
    stars.push({ x: rnd(0, W), y: rnd(0, H), size: rnd(0.15, 1.8), op: rnd(0.1, 0.9), tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.02),
      col: warm ? [rnd(240, 255) | 0, rnd(200, 230) | 0, rnd(120, 160) | 0] : cool ? [rnd(150, 200) | 0, rnd(170, 220) | 0, rnd(220, 255) | 0] : [rnd(230, 255) | 0, rnd(230, 255) | 0, rnd(230, 255) | 0] });
  }
  for (let i = 0; i < 8; i++) bgGalaxies.push({ x: rnd(0, W), y: rnd(0, H), rx: rnd(6, 20), ry: rnd(3, 10), angle: rnd(0, Math.PI), op: rnd(0.15, 0.4), col: [rnd(150, 220) | 0, rnd(140, 210) | 0, rnd(160, 240) | 0] });
  const GX = W * 0.52, GY = H * 0.48, numArms = 3, armOffset = Math.PI * 2 / numArms;
  for (let arm = 0; arm < numArms; arm++) {
    const points = 700;
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = arm * armOffset + t * Math.PI * 3.8 + rnd(-0.15, 0.15);
      const radius = t * Math.min(W, H) * 0.52;
      const scatter = rnd(0, radius * 0.18), scAngle = rnd(0, Math.PI * 2);
      const px = GX + Math.cos(angle) * radius + Math.cos(scAngle) * scatter;
      const py = GY + Math.sin(angle) * radius * 0.42 + Math.sin(scAngle) * scatter * 0.42;
      let r, g, b;
      if (t < 0.15) { r = 255; g = rnd(230, 250) | 0; b = rnd(180, 220) | 0; }
      else if (t < 0.4) { r = rnd(200, 240) | 0; g = rnd(160, 200) | 0; b = rnd(80, 130) | 0; }
      else if (t < 0.7) { if (Math.random() < 0.45) { r = rnd(140, 190) | 0; g = rnd(160, 210) | 0; b = rnd(210, 255) | 0; } else { r = rnd(200, 240) | 0; g = rnd(170, 210) | 0; b = rnd(100, 150) | 0; } }
      else { r = rnd(130, 180) | 0; g = rnd(160, 210) | 0; b = rnd(220, 255) | 0; }
      armParticles.push({ x: px, y: py, size: t < 0.08 ? rnd(0.8, 2.5) : rnd(0.2, 1.4), op: t < 0.1 ? rnd(0.7, 1) : rnd(0.2, 0.85) * (1 - t * 0.4), tw: rnd(0, Math.PI * 2), tws: rnd(0.002, 0.015), col: [r, g, b] });
    }
  }
  for (let i = 0; i < 3; i++) {
    const t = rnd(0.2, 0.7), angle = i * (Math.PI * 2 / 3) + rnd(-0.3, 0.3) + t * Math.PI * 3, radius = t * Math.min(W, H) * 0.45;
    dustLanes.push({ x: GX + Math.cos(angle) * radius, y: GY + Math.sin(angle) * radius * 0.42, r: rnd(20, 45), op: rnd(0.3, 0.55) });
  }
  const newComet = (delay) => {
    const sides = [[rnd(0, W), -10, rnd(-0.3, 0.3), rnd(0.6, 1.8)], [W + 10, rnd(0, H), rnd(-1.8, -0.6), rnd(-0.3, 0.3)], [rnd(0, W), H + 10, rnd(-0.3, 0.3), rnd(-1.8, -0.6)], [-10, rnd(0, H), rnd(0.6, 1.8), rnd(-0.3, 0.3)]];
    const s = sides[Math.floor(rnd(0, 4))];
    return { x: s[0], y: s[1], vx: s[2], vy: s[3], len: rnd(50, 130), op: rnd(0.4, 0.8), size: rnd(1, 2.2), delay, col: Math.random() < 0.5 ? "rgba(220,210,255," : "rgba(200,230,255," };
  };
  for (let i = 0; i < 5; i++) comets.push(newComet(i * 40));
  for (let i = 0; i < 12; i++) sparkles.push({ x: rnd(0, W), y: rnd(0, H), size: rnd(1.5, 3.5), op: rnd(0.5, 1), tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.04), col: [rnd(220, 255) | 0, rnd(220, 255) | 0, rnd(200, 255) | 0], vx: rnd(-0.05, 0.05), vy: rnd(-0.04, 0.04) });

  const core = (ctx, gx, gy) => {
    [{ r: 8, c: "rgba(255,255,240,0.95)" }, { r: 18, c: "rgba(255,230,160,0.5)" }, { r: 35, c: "rgba(230,180,80,0.2)" }, { r: 60, c: "rgba(200,140,50,0.1)" }, { r: 100, c: "rgba(180,110,30,0.05)" }, { r: 160, c: "rgba(160,90,20,0.025)" }].forEach((l) => {
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, l.r); g.addColorStop(0, l.c); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(gx, gy, l.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    });
  };

  return {
    draw(ctx, frame) {
      const bg = ctx.createRadialGradient(W * 0.52, H * 0.48, 0, W * 0.52, H * 0.48, Math.max(W, H) * 0.8);
      bg.addColorStop(0, "#08040e"); bg.addColorStop(0.3, "#040208"); bg.addColorStop(0.7, "#020106"); bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      [{ x: W * 0.7, y: H * 0.3, r: 200, c: "rgba(80,40,140," }, { x: W * 0.3, y: H * 0.6, r: 180, c: "rgba(40,60,160," }, { x: W * 0.55, y: H * 0.5, r: 250, c: "rgba(160,90,30," }, { x: W * 0.15, y: H * 0.2, r: 130, c: "rgba(100,40,120," }, { x: W * 0.85, y: H * 0.75, r: 140, c: "rgba(30,80,160," }].forEach((n) => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r); g.addColorStop(0, n.c + "0.055)"); g.addColorStop(0.5, n.c + "0.02)"); g.addColorStop(1, n.c + "0)");
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });
      stars.forEach((s) => { s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw); ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`; ctx.fill(); });
      bgGalaxies.forEach((g) => { ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.angle); ctx.scale(1, g.ry / g.rx); const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.rx); gg.addColorStop(0, `rgba(255,245,220,${g.op})`); gg.addColorStop(0.4, `rgba(${g.col[0]},${g.col[1]},${g.col[2]},${g.op * 0.5})`); gg.addColorStop(1, `rgba(${g.col[0]},${g.col[1]},${g.col[2]},0)`); ctx.beginPath(); ctx.arc(0, 0, g.rx, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill(); ctx.restore(); });
      armParticles.forEach((p) => { p.tw += p.tws; const tw = 0.6 + 0.4 * Math.sin(p.tw); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.op * tw).toFixed(2)})`; ctx.fill(); });
      dustLanes.forEach((d) => { const dg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r); dg.addColorStop(0, `rgba(0,0,0,${d.op})`); dg.addColorStop(1, "rgba(0,0,0,0)"); ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fillStyle = dg; ctx.fill(); });
      core(ctx, W * 0.52, H * 0.48);
      sparkles.forEach((s) => {
        s.x += s.vx; s.y += s.vy; if (s.x < 0) s.x = W; if (s.x > W) s.x = 0; if (s.y < 0) s.y = H; if (s.y > H) s.y = 0; s.tw += s.tws; const tw = 0.4 + 0.6 * Math.sin(s.tw);
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 5); sg.addColorStop(0, `rgba(255,255,255,${(tw * s.op).toFixed(2)})`); sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size * 5, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${(tw * s.op).toFixed(2)})`; ctx.fill();
        if (s.size > 2) { ctx.save(); ctx.globalAlpha = tw * s.op * 0.5; ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.7)`; ctx.lineWidth = 0.5; const sl = s.size * 8; ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke(); ctx.restore(); }
      });
      comets.forEach((cm) => {
        if (frame < cm.delay) return; cm.x += cm.vx; cm.y += cm.vy;
        if (cm.x < -200 || cm.x > W + 200 || cm.y < -200 || cm.y > H + 200) Object.assign(cm, newComet(0));
        const ang = Math.atan2(cm.vy, cm.vx), tx = cm.x - Math.cos(ang) * cm.len, ty = cm.y - Math.sin(ang) * cm.len;
        const cg = ctx.createLinearGradient(cm.x, cm.y, tx, ty); cg.addColorStop(0, cm.col + cm.op + ")"); cg.addColorStop(0.3, cm.col + (cm.op * 0.4) + ")"); cg.addColorStop(1, cm.col + "0)");
        ctx.beginPath(); ctx.moveTo(cm.x, cm.y); ctx.lineTo(tx, ty); ctx.strokeStyle = cg; ctx.lineWidth = 1.5; ctx.stroke();
        const hg = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.size * 5); hg.addColorStop(0, "rgba(255,255,255,0.9)"); hg.addColorStop(0.3, cm.col + "0.5)"); hg.addColorStop(1, cm.col + "0)");
        ctx.beginPath(); ctx.arc(cm.x, cm.y, cm.size * 5, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
        ctx.beginPath(); ctx.arc(cm.x, cm.y, cm.size, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
      });
    },
  };
}

// ════════════════════════════════════════════════════════════════
// SCENE: CLUSTER (silver star cluster, travel-through)
// ════════════════════════════════════════════════════════════════
function buildCluster(W, H) {
  const silver = () => { const t = Math.random(); if (t < 0.3) return [rnd(200, 230) | 0, rnd(210, 240) | 0, rnd(230, 255) | 0]; if (t < 0.6) return [rnd(220, 255) | 0, rnd(225, 255) | 0, rnd(230, 255) | 0]; if (t < 0.8) return [rnd(180, 210) | 0, rnd(195, 225) | 0, rnd(220, 250) | 0]; return [rnd(210, 240) | 0, rnd(220, 245) | 0, rnd(240, 255) | 0]; };
  const stars = [], core = [], closeStars = [], streamers = [];
  for (let i = 0; i < 500; i++) stars.push({ x: rnd(0, W), y: rnd(0, H), size: rnd(0.15, 1.2), op: rnd(0.1, 0.55), tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.018), col: silver() });
  const cx = W / 2, cy = H / 2;
  for (let i = 0; i < 1000; i++) {
    const angle = rnd(0, Math.PI * 2), dist = Math.abs(rnd(0, 1) + rnd(0, 1) + rnd(0, 1) - 1.5) * Math.min(W, H) * 0.45;
    const x = cx + Math.cos(angle) * dist, y = cy + Math.sin(angle) * dist, prox = 1 - Math.min(dist / (Math.min(W, H) * 0.45), 1);
    core.push({ x, y, size: prox > 0.7 ? rnd(0.4, 2.2) : prox > 0.4 ? rnd(0.2, 1.4) : rnd(0.15, 0.8), op: prox > 0.7 ? rnd(0.6, 1) : prox > 0.4 ? rnd(0.3, 0.8) : rnd(0.1, 0.4), tw: rnd(0, Math.PI * 2), tws: rnd(0.005, 0.03), col: silver(), prox });
  }
  const newClose = () => ({ x: rnd(0, W), y: rnd(0, H), size: rnd(1.5, 4.5), op: rnd(0.4, 0.9), tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.04), vx: rnd(-0.3, 0.3), vy: rnd(-0.2, 0.2), scale: rnd(0.8, 1.2), scaleV: rnd(0.0002, 0.0008), col: silver() });
  const newStreamer = () => ({ x: rnd(0, W), y: rnd(0, H), len: rnd(20, 80), angle: rnd(-Math.PI * 0.15, Math.PI * 0.15) + (Math.random() < 0.5 ? 0 : Math.PI), op: rnd(0.05, 0.2), speed: rnd(0.3, 1.2), col: silver(), life: rnd(0, 100) });
  for (let i = 0; i < 35; i++) closeStars.push(newClose());
  for (let i = 0; i < 20; i++) streamers.push(newStreamer());

  return {
    draw(ctx, frame) {
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
      bg.addColorStop(0, "#060810"); bg.addColorStop(0.3, "#030508"); bg.addColorStop(0.7, "#010203"); bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      let neb = ctx.createRadialGradient(W * 0.4, H * 0.4, 0, W * 0.4, H * 0.4, W * 0.5); neb.addColorStop(0, "rgba(60,80,160,0.04)"); neb.addColorStop(1, "rgba(60,80,160,0)"); ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
      neb = ctx.createRadialGradient(W * 0.65, H * 0.6, 0, W * 0.65, H * 0.6, W * 0.4); neb.addColorStop(0, "rgba(40,60,140,0.035)"); neb.addColorStop(1, "rgba(40,60,140,0)"); ctx.fillStyle = neb; ctx.fillRect(0, 0, W, H);
      stars.forEach((s) => { s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw); ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`; ctx.fill(); });
      streamers.forEach((st) => { st.life += st.speed; const fi = Math.min(st.life / 20, 1), fo = st.life > 80 ? 1 - (st.life - 80) / 20 : 0, alpha = st.op * (fi - fo); if (st.life > 100) { Object.assign(st, newStreamer()); st.life = 0; return; } const ex = st.x + Math.cos(st.angle) * st.len, ey = st.y + Math.sin(st.angle) * st.len; const sg = ctx.createLinearGradient(st.x, st.y, ex, ey); sg.addColorStop(0, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},0)`); sg.addColorStop(0.5, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},${Math.max(0, alpha).toFixed(2)})`); sg.addColorStop(1, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},0)`); ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(ex, ey); ctx.strokeStyle = sg; ctx.lineWidth = 0.8; ctx.stroke(); });
      core.forEach((p) => { p.tw += p.tws; const tw = 0.5 + 0.5 * Math.sin(p.tw); ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.op * tw).toFixed(2)})`; ctx.fill(); });
      const cg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 140); cg.addColorStop(0, `rgba(220,230,255,${0.12 + 0.04 * Math.sin(frame * 0.02)})`); cg.addColorStop(0.3, "rgba(180,200,240,0.05)"); cg.addColorStop(0.7, "rgba(140,170,220,0.02)"); cg.addColorStop(1, "rgba(100,140,200,0)"); ctx.beginPath(); ctx.arc(W / 2, H / 2, 140, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();
      closeStars.forEach((s) => { s.x += s.vx; s.y += s.vy; s.scale += s.scaleV; if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20 || s.scale > 2.5) { Object.assign(s, newClose()); s.scale = 0.8; } s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw), sz = s.size * s.scale; const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 5); sg.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.35).toFixed(2)})`); sg.addColorStop(1, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0)`); ctx.beginPath(); ctx.arc(s.x, s.y, sz * 5, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill(); ctx.beginPath(); ctx.arc(s.x, s.y, sz, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${(s.op * tw).toFixed(2)})`; ctx.fill(); if (sz > 2.5) { ctx.save(); ctx.globalAlpha = s.op * tw * 0.5; ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.8)`; ctx.lineWidth = 0.5; const sl = sz * 7; ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke(); ctx.restore(); } });
    },
  };
}

// ════════════════════════════════════════════════════════════════
// SCENE: SOLAR (bronze solar system)
// ════════════════════════════════════════════════════════════════
function buildSolar(W, H) {
  const stars = [], orbitals = [], asteroids = [], flares = [];
  for (let i = 0; i < 300; i++) stars.push({ x: rnd(0, W), y: rnd(0, H), size: rnd(0.15, 1.2), op: rnd(0.1, 0.5), tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.015), col: Math.random() < 0.5 ? [rnd(200, 240) | 0, rnd(150, 190) | 0, rnd(60, 100) | 0] : [rnd(220, 255) | 0, rnd(210, 240) | 0, rnd(180, 220) | 0] });
  const cx = W / 2, cy = H / 2;
  const rings = [{ r: 70, count: 1, size: [6, 10], speed: 0.008, col: [[180, 100, 30], [200, 130, 60]] }, { r: 110, count: 1, size: [4, 7], speed: 0.005, col: [[140, 160, 180], [160, 180, 200]] }, { r: 155, count: 1, size: [8, 13], speed: 0.0035, col: [[160, 120, 60], [180, 140, 80]] }, { r: 200, count: 2, size: [3, 5], speed: 0.0025, col: [[100, 130, 160], [120, 150, 180]] }, { r: 255, count: 1, size: [11, 16], speed: 0.0018, col: [[140, 100, 60], [160, 120, 80]] }];
  rings.forEach((ring) => { for (let j = 0; j < ring.count; j++) { const c = ring.col[j % ring.col.length]; orbitals.push({ radius: ring.r, angle: rnd(0, Math.PI * 2) + j * (Math.PI * 2 / ring.count), speed: ring.speed * (Math.random() > 0.5 ? 1 : -1), size: rnd(ring.size[0], ring.size[1]), col: c, hasMoon: Math.random() > 0.5, moonAngle: rnd(0, Math.PI * 2), moonSpeed: rnd(0.015, 0.03), moonSize: rnd(1.5, 3), hasRing: ring.r > 180 && Math.random() > 0.4, tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.03), col2: [Math.min(c[0] + 30, 255), Math.min(c[1] + 20, 255), Math.min(c[2] + 15, 255)] }); } });
  for (let i = 0; i < 60; i++) { const angle = rnd(0, Math.PI * 2), r = rnd(170, 195); asteroids.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r * 0.6, angle, r, speed: rnd(0.001, 0.003) * (Math.random() > 0.5 ? 1 : -1), size: rnd(0.5, 2), op: rnd(0.3, 0.7), col: [rnd(120, 160) | 0, rnd(100, 140) | 0, rnd(80, 120) | 0] }); }
  for (let i = 0; i < 6; i++) flares.push({ angle: rnd(0, Math.PI * 2), len: rnd(20, 50), width: rnd(3, 8), op: rnd(0.3, 0.7), speed: rnd(0.005, 0.015), phase: rnd(0, Math.PI * 2) });

  const drawPlanet = (ctx, x, y, size, col, col2, hasRing) => {
    let pg = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size); pg.addColorStop(0, `rgba(${col2[0]},${col2[1]},${col2[2]},1)`); pg.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},1)`); pg.addColorStop(1, `rgba(${Math.max(col[0] - 40, 0)},${Math.max(col[1] - 40, 0)},${Math.max(col[2] - 30, 0)},1)`);
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();
    const ag = ctx.createRadialGradient(x, y, size * 0.8, x, y, size * 1.6); ag.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},0.15)`); ag.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`); ctx.beginPath(); ctx.arc(x, y, size * 1.6, 0, Math.PI * 2); ctx.fillStyle = ag; ctx.fill();
    if (hasRing) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.3); ctx.beginPath(); ctx.arc(0, 0, size * 2.2, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.3)`; ctx.lineWidth = size * 0.6; ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, size * 2.8, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.15)`; ctx.lineWidth = size * 0.3; ctx.stroke(); ctx.restore(); }
  };

  return {
    draw(ctx, frame) {
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9); bg.addColorStop(0, "#0e0600"); bg.addColorStop(0.2, "#080400"); bg.addColorStop(0.5, "#040200"); bg.addColorStop(1, "#000000"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      [{ x: cx * 0.4, y: cy * 0.5, r: 200, c: "rgba(160,80,20,0.04)" }, { x: cx * 1.6, y: cy * 1.4, r: 180, c: "rgba(140,60,10,0.03)" }, { x: cx * 1.3, y: cy * 0.4, r: 150, c: "rgba(180,100,20,0.025)" }, { x: cx * 0.5, y: cy * 1.5, r: 160, c: "rgba(120,70,15,0.03)" }].forEach((n) => { const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r); g.addColorStop(0, n.c); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
      stars.forEach((s) => { s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw); ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`; ctx.fill(); });
      [70, 110, 155, 200, 255].forEach((r) => { ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.6, 0, 0, Math.PI * 2); ctx.strokeStyle = "rgba(205,127,50,0.06)"; ctx.lineWidth = 0.8; ctx.stroke(); });
      asteroids.forEach((a) => { a.angle += a.speed; a.x = cx + Math.cos(a.angle) * a.r; a.y = cy + Math.sin(a.angle) * a.r * 0.6; ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fillStyle = `rgba(${a.col[0]},${a.col[1]},${a.col[2]},${a.op})`; ctx.fill(); });
      orbitals.forEach((o) => { o.angle += o.speed; const ox = cx + Math.cos(o.angle) * o.radius, oy = cy + Math.sin(o.angle) * o.radius * 0.6; drawPlanet(ctx, ox, oy, o.size, o.col, o.col2, o.hasRing); if (o.hasMoon) { o.moonAngle += o.moonSpeed; const mx = ox + Math.cos(o.moonAngle) * o.size * 2.8, my = oy + Math.sin(o.moonAngle) * o.size * 2.8 * 0.5; ctx.beginPath(); ctx.arc(mx, my, o.moonSize, 0, Math.PI * 2); ctx.fillStyle = "rgba(200,190,170,0.85)"; ctx.fill(); const mg = ctx.createRadialGradient(mx, my, 0, mx, my, o.moonSize * 2); mg.addColorStop(0, "rgba(200,190,170,0.1)"); mg.addColorStop(1, "rgba(200,190,170,0)"); ctx.beginPath(); ctx.arc(mx, my, o.moonSize * 2, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill(); } });
      flares.forEach((f) => { f.phase += f.speed; const fo = f.op * (0.5 + 0.5 * Math.sin(f.phase)); const fx1 = cx + Math.cos(f.angle) * (22 + f.len * 0.3), fy1 = cy + Math.sin(f.angle) * (22 + f.len * 0.3), fx2 = cx + Math.cos(f.angle) * (22 + f.len), fy2 = cy + Math.sin(f.angle) * (22 + f.len); const fg = ctx.createLinearGradient(fx1, fy1, fx2, fy2); fg.addColorStop(0, `rgba(255,200,60,${fo})`); fg.addColorStop(0.5, `rgba(255,140,20,${fo * 0.5})`); fg.addColorStop(1, "rgba(255,100,0,0)"); ctx.beginPath(); ctx.moveTo(fx1, fy1); ctx.lineTo(fx2, fy2); ctx.strokeStyle = fg; ctx.lineWidth = f.width; ctx.stroke(); f.angle += 0.0003; });
      [{ r: 200, c: "rgba(255,120,0,0.02)" }, { r: 130, c: "rgba(255,150,20,0.04)" }, { r: 80, c: "rgba(255,180,40,0.08)" }, { r: 50, c: "rgba(255,200,80,0.15)" }, { r: 30, c: "rgba(255,220,120,0.35)" }].forEach((l) => { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, l.r); g.addColorStop(0, l.c); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.beginPath(); ctx.arc(cx, cy, l.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); });
      const sunG = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 22); sunG.addColorStop(0, "rgba(255,255,220,1)"); sunG.addColorStop(0.4, "rgba(255,230,100,1)"); sunG.addColorStop(0.7, "rgba(255,180,40,1)"); sunG.addColorStop(1, "rgba(230,120,0,0.9)"); ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fillStyle = sunG; ctx.fill();
      const pulseR = 30 + 8 * Math.sin(frame * 0.04); const pr = ctx.createRadialGradient(cx, cy, 20, cx, cy, pulseR); pr.addColorStop(0, `rgba(255,200,60,${0.08 + 0.04 * Math.sin(frame * 0.04)})`); pr.addColorStop(1, "rgba(255,150,0,0)"); ctx.beginPath(); ctx.arc(cx, cy, pulseR, 0, Math.PI * 2); ctx.fillStyle = pr; ctx.fill();
    },
  };
}

// ════════════════════════════════════════════════════════════════
// SCENE: STARRY EARTH (Earth POV — sky, land, sea)
// ════════════════════════════════════════════════════════════════
function buildStarry(W, H) {
  const skyH = H * 0.62;
  const stars = [], sparkles = [], swirls = [];
  for (let i = 0; i < 500; i++) { const warm = Math.random() < 0.3, cool = Math.random() < 0.35; stars.push({ x: rnd(0, W), y: rnd(0, skyH), r: rnd(0.15, 1.4), op: rnd(0.15, 0.9), tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.022), col: warm ? [rnd(220, 255) | 0, rnd(195, 228) | 0, rnd(135, 175) | 0] : cool ? [rnd(155, 205) | 0, rnd(172, 222) | 0, rnd(218, 255) | 0] : [rnd(225, 255) | 0, rnd(225, 255) | 0, rnd(225, 255) | 0] }); }
  for (let i = 0; i < 10; i++) sparkles.push({ x: rnd(0, W), y: rnd(0, skyH * 0.85), r: rnd(1.5, 3.0), op: rnd(0.55, 0.95), tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.032), col: [rnd(215, 255) | 0, rnd(215, 255) | 0, rnd(200, 255) | 0] });
  for (let s = 0; s < 6; s++) { const pts = []; let cx = rnd(0, W), cy = rnd(skyH * 0.05, skyH * 0.55); for (let p = 0; p < 80; p++) { pts.push({ x: cx, y: cy }); cx += rnd(-8, 8) + rnd(3, 7); cy += rnd(-5, 5); cy = Math.max(5, Math.min(skyH - 5, cy)); if (cx > W + 60) cx = -60; } swirls.push({ pts, op: rnd(0.012, 0.032), col: Math.random() < 0.5 ? [rnd(100, 160) | 0, rnd(130, 190) | 0, rnd(200, 240) | 0] : [rnd(80, 130) | 0, rnd(100, 160) | 0, rnd(180, 220) | 0], phase: rnd(0, Math.PI * 2), speed: rnd(0.003, 0.008) }); }

  return {
    draw(ctx, frame) {
      // Sky
      let g = ctx.createLinearGradient(0, 0, 0, H * 0.62); g.addColorStop(0, "#000308"); g.addColorStop(0.3, "#000510"); g.addColorStop(0.7, "#010818"); g.addColorStop(1, "#020c22"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.62);
      let mw = ctx.createLinearGradient(W * 0.1, 0, W * 0.7, H * 0.6); mw.addColorStop(0, "rgba(80,90,140,0)"); mw.addColorStop(0.2, "rgba(80,95,155,0.06)"); mw.addColorStop(0.45, "rgba(100,110,175,0.09)"); mw.addColorStop(0.65, "rgba(80,90,150,0.055)"); mw.addColorStop(1, "rgba(60,70,130,0)"); ctx.fillStyle = mw; ctx.fillRect(0, 0, W, H * 0.62);
      [["rgba(232, 174, 60,", W * 0.22, H * 0.08, W * 0.18, 0.055, 0.022], ["rgba(192,200,230,", W * 0.52, H * 0.12, W * 0.14, 0.042, 0.018], ["rgba(205,127,50,", W * 0.8, H * 0.1, W * 0.12, 0.048, 0.018]].forEach(([c, x, y, r, a, b]) => { const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, c + a + ")"); gg.addColorStop(0.5, c + b + ")"); gg.addColorStop(1, c + "0)"); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H * 0.62); });
      const moonX = W * 0.78, moonY = H * 0.14, moonR = Math.min(W, H) * 0.038;
      let mg = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, 0, moonX, moonY, moonR); mg.addColorStop(0, "rgba(240,238,220,0.82)"); mg.addColorStop(0.6, "rgba(210,208,185,0.55)"); mg.addColorStop(1, "rgba(180,175,150,0)"); ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();
      let mh = ctx.createRadialGradient(moonX, moonY, moonR * 0.7, moonX, moonY, moonR * 3.5); mh.addColorStop(0, "rgba(220,215,180,0.07)"); mh.addColorStop(1, "rgba(220,215,180,0)"); ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 3.5, 0, Math.PI * 2); ctx.fillStyle = mh; ctx.fill();
      // Swirls
      swirls.forEach((sw) => { sw.phase += sw.speed; const pulse = 0.6 + 0.4 * Math.sin(sw.phase); ctx.beginPath(); ctx.moveTo(sw.pts[0].x, sw.pts[0].y); for (let i = 1; i < sw.pts.length - 2; i++) { const mx = (sw.pts[i].x + sw.pts[i + 1].x) / 2, my = (sw.pts[i].y + sw.pts[i + 1].y) / 2; ctx.quadraticCurveTo(sw.pts[i].x, sw.pts[i].y, mx, my); } ctx.strokeStyle = `rgba(${sw.col[0]},${sw.col[1]},${sw.col[2]},${sw.op * pulse})`; ctx.lineWidth = 2.5; ctx.stroke(); });
      // Stars
      stars.forEach((s) => { s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw); if (s.y > skyH) return; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`; ctx.fill(); });
      sparkles.forEach((s) => { if (s.y > skyH) return; s.tw += s.tws; const tw = 0.4 + 0.6 * Math.sin(s.tw); const gg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5); gg.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.28).toFixed(2)})`); gg.addColorStop(1, "rgba(0,0,0,0)"); ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill(); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${(s.op * tw).toFixed(2)})`; ctx.fill(); ctx.save(); ctx.globalAlpha = s.op * tw * 0.4; ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.65)`; ctx.lineWidth = 0.5; const sl = s.r * 8; ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke(); ctx.restore(); });
      // Land
      const horizonY = H * 0.62, landH = H * 0.10;
      ctx.beginPath(); ctx.moveTo(0, horizonY + landH); ctx.lineTo(0, horizonY + landH * 0.6);
      ctx.bezierCurveTo(W * 0.08, horizonY + landH * 0.2, W * 0.15, horizonY + landH * 0.4, W * 0.22, horizonY + landH * 0.35);
      ctx.bezierCurveTo(W * 0.3, horizonY + landH * 0.28, W * 0.38, horizonY + landH * 0.5, W * 0.45, horizonY + landH * 0.45);
      ctx.bezierCurveTo(W * 0.52, horizonY + landH * 0.38, W * 0.58, horizonY + landH * 0.55, W * 0.65, horizonY + landH * 0.48);
      ctx.bezierCurveTo(W * 0.72, horizonY + landH * 0.42, W * 0.80, horizonY + landH * 0.6, W * 0.88, horizonY + landH * 0.52);
      ctx.bezierCurveTo(W * 0.94, horizonY + landH * 0.44, W * 0.98, horizonY + landH * 0.55, W, horizonY + landH * 0.5);
      ctx.lineTo(W, horizonY + landH); ctx.closePath();
      let lg = ctx.createLinearGradient(0, horizonY, 0, horizonY + landH); lg.addColorStop(0, "#0a0e0a"); lg.addColorStop(0.5, "#060a06"); lg.addColorStop(1, "#030603"); ctx.fillStyle = lg; ctx.fill();
      let hg = ctx.createLinearGradient(0, horizonY - H * 0.04, 0, horizonY + H * 0.04); hg.addColorStop(0, "rgba(20,35,60,0)"); hg.addColorStop(0.5, "rgba(25,45,75,0.18)"); hg.addColorStop(1, "rgba(10,20,35,0)"); ctx.fillStyle = hg; ctx.fillRect(0, horizonY - H * 0.04, W, H * 0.08);
      // Sea
      const seaY = H * 0.72, seaHh = H - seaY;
      let sg = ctx.createLinearGradient(0, seaY, 0, H); sg.addColorStop(0, "#020810"); sg.addColorStop(0.4, "#010508"); sg.addColorStop(1, "#000204"); ctx.fillStyle = sg; ctx.fillRect(0, seaY, W, seaHh);
      stars.forEach((s) => { if (s.op < 0.4) return; const tw = 0.5 + 0.5 * Math.sin(s.tw); const reflY = seaY + (H * 0.62 - s.y) * 0.18; if (reflY > H) return; const waveX = s.x + Math.sin(frame * 0.025 + s.x * 0.04) * 2.5; ctx.beginPath(); ctx.ellipse(waveX, reflY, s.r * 0.6, s.r * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.18).toFixed(2)})`; ctx.fill(); });
      const moonReflY = seaY + H * 0.04;
      for (let i = 0; i < 12; i++) { const ry = moonReflY + i * ((H - moonReflY) / 12), rx = moonX + Math.sin(frame * 0.03 + i * 0.6) * (3 + i * 1.2), rw = 2 + i * 1.5, rop = (0.12 - i * 0.008) * Math.max(0, 0.5 + 0.5 * Math.sin(frame * 0.02 + i * 0.4)); ctx.beginPath(); ctx.ellipse(rx, ry, rw, 1.2, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(220,215,180,${rop.toFixed(2)})`; ctx.fill(); }
      for (let w = 0; w < 5; w++) { const wy = seaY + seaHh * (0.1 + w * 0.18), wop = 0.04 - w * 0.006; ctx.beginPath(); ctx.moveTo(0, wy); for (let x = 0; x <= W; x += 4) { const dy = Math.sin(x * 0.018 + frame * 0.022 + w * 0.8) * 1.8; ctx.lineTo(x, wy + dy); } ctx.strokeStyle = `rgba(60,100,160,${wop})`; ctx.lineWidth = 0.8; ctx.stroke(); }
    },
  };
}

const BUILDERS = { universe: buildUniverse, cluster: buildCluster, solar: buildSolar, starry: buildStarry };

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ShowcaseStage({ mode = "full" }) {
  const stageRef = useRef(null);
  const bgRef = useRef(null);
  const warpRef = useRef(null);
  const cardRef = useRef(null);
  const menuRef = useRef(null);

  const sceneRef = useRef(null);
  const tierRef = useRef("universe");
  const dimRef = useRef({ W: 0, H: 0 });
  const transRef = useRef(null);      // active transition state
  const warpParticles = useRef([]);

  const [entries, setEntries] = useState([]);
  const [award, setAward] = useState("Most Inquired");
  const [category, setCategory] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [activeRank, setActiveRank] = useState(1);
  const [activeTier, setActiveTier] = useState("universe");
  const [menuOpen, setMenuOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);

  // Load showcase entries
  useEffect(() => {
    let alive = true;
    fetch("/api/showcase").then((r) => r.json()).then((d) => { if (alive && d.entries) setEntries(d.entries); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Close the platform menu on outside click
  useEffect(() => {
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Drag-to-reposition any card on the stage; it stays where you drop it.
  const [cardPos, setCardPos] = useState({});
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current; if (!d) return;
      const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
      setCardPos((p) => ({ ...p, [d.id]: { x: d.ox + dx, y: d.oy + dy } }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);
  const startDrag = (id, e) => { movedRef.current = false; const cur = cardPos[id] || { x: 0, y: 0 }; dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: cur.x, oy: cur.y }; };
  const swallowDragClick = (e) => { if (movedRef.current) { e.preventDefault(); e.stopPropagation(); return true; } return false; };
  const posStyle = (id, extra) => {
    const p = cardPos[id];
    return p ? { ...extra, transform: `translate(${p.x}px, ${p.y}px)`, animation: "none" } : extra;
  };

  const ranked = useMemo(() => rankBoard(entries, { award, category }), [entries, award, category]);
  const active = ranked.find((e) => e.rank === activeRank) || ranked[0] || null;
  const restRanks = ranked.filter((e) => e.rank >= 4);
  const promoUnlocked = !!active && active.rank <= 3;

  // Resize canvases to the stage
  const sizeCanvases = useCallback(() => {
    const stage = stageRef.current; if (!stage) return;
    const W = stage.clientWidth, H = stage.clientHeight;
    dimRef.current = { W, H };
    [bgRef.current, warpRef.current].forEach((c) => { if (c) { c.width = W; c.height = H; } });
    sceneRef.current = BUILDERS[tierRef.current](W, H);
  }, []);

  // Animation loop
  useEffect(() => {
    sizeCanvases();
    const bg = bgRef.current, warp = warpRef.current;
    if (!bg || !warp) return;
    const ctx = bg.getContext("2d"), wctx = warp.getContext("2d");
    let raf = 0, frame = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw); frame++;
      const { W, H } = dimRef.current;
      if (!W || !H) return;
      const tr = transRef.current;
      let scale = 1;
      if (tr) {
        const now = performance.now(), p = Math.min((now - tr.start) / tr.dur, 1);
        // scale: zoom in (up) toward 1.15 then back to 1; zoom out (down) toward 0.85 then back
        const target = tr.dir === "up" ? 1.15 : 0.85;
        scale = p < 0.45 ? 1 + (target - 1) * (p / 0.45) : target + (1 - target) * ((p - 0.45) / 0.55);
        // swap tier at flash peak
        if (!tr.swapped && p >= 0.42) { tr.swapped = true; tierRef.current = tr.to; sceneRef.current = BUILDERS[tr.to](W, H); setActiveTier(tr.to); setActiveRank(tr.toRank); }
        // card fade out (warp) / in (reveal)
        if (cardRef.current) cardRef.current.style.opacity = p < 0.42 ? String(1 - p / 0.42) : String((p - 0.45) / 0.55);
        if (p >= 1) transRef.current = null;
      } else if (cardRef.current) {
        cardRef.current.style.opacity = "1";
      }

      // base black
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(scale, scale); ctx.translate(-W / 2, -H / 2);
      if (sceneRef.current) sceneRef.current.draw(ctx, frame);
      ctx.restore();

      // warp overlay + flash
      wctx.clearRect(0, 0, W, H);
      if (tr) {
        const now = performance.now(), p = Math.min((now - tr.start) / tr.dur, 1);
        const cx = W / 2, cy = H / 2;
        // warp particles rushing to center, elongating
        if (p < 0.6) {
          const intensity = p / 0.6;
          warpParticles.current.forEach((wp) => {
            const dx = cx - wp.x, dy = cy - wp.y;
            wp.x += dx * (0.02 + intensity * 0.08); wp.y += dy * (0.02 + intensity * 0.08);
            const tx = wp.x - dx * 0.04 * (1 + intensity * 4), ty = wp.y - dy * 0.04 * (1 + intensity * 4);
            wctx.beginPath(); wctx.moveTo(wp.x, wp.y); wctx.lineTo(tx, ty);
            wctx.strokeStyle = `rgba(${tr.fromRgb},${(0.5 * (1 - p)).toFixed(2)})`; wctx.lineWidth = 1.4; wctx.stroke();
          });
        }
        // flash 0.45..0.62 peak
        if (p > 0.4 && p < 0.75) {
          const fp = (p - 0.4) / 0.35; // 0..1
          const a = Math.sin(fp * Math.PI); // up then down
          wctx.fillStyle = tr.flash.replace(/0\.85\)$/, `${(0.85 * a).toFixed(2)})`);
          wctx.fillRect(0, 0, W, H);
        }
      }
    };
    raf = requestAnimationFrame(draw);
    const onResize = () => sizeCanvases();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [sizeCanvases]);

  // Transition trigger
  const goToTier = useCallback((toTier, toRank) => {
    if (transRef.current) return;
    const from = tierRef.current;
    if (from === toTier && toRank === activeRank) return;
    const dir = TIER_ORDER.indexOf(toTier) > TIER_ORDER.indexOf(from) ? "up" : "down";
    const { W, H } = dimRef.current;
    // spawn warp particles from edges
    warpParticles.current = Array.from({ length: 200 }, () => {
      const edge = Math.floor(rnd(0, 4));
      return edge === 0 ? { x: rnd(0, W), y: 0 } : edge === 1 ? { x: W, y: rnd(0, H) } : edge === 2 ? { x: rnd(0, W), y: H } : { x: 0, y: rnd(0, H) };
    });
    transRef.current = {
      start: performance.now(), dur: 1700, dir, to: toTier, toRank, swapped: false,
      fromRgb: TIERS[from].rgb, flash: TIERS[toTier].flash,
    };
  }, [activeRank]);

  const selectRank = useCallback((rank) => {
    const e = ranked.find((x) => x.rank === rank); if (!e) return;
    goToTier(e.tier, rank);
  }, [ranked, goToTier]);

  const step = useCallback((dir) => {
    if (!active) return;
    const next = Math.min(Math.max(active.rank + dir, 1), ranked.length);
    if (next !== active.rank) selectRank(next);
  }, [active, ranked.length, selectRank]);

  // Reset to rank 1 (Universe) when the award or category changes
  useEffect(() => {
    if (entries.length === 0) return;
    tierRef.current = "universe";
    setActiveTier("universe");
    setActiveRank(1);
    setCardPos({});
    transRef.current = null;
    sceneRef.current = BUILDERS.universe(dimRef.current.W || 1, dimRef.current.H || 1);
  }, [award, category, entries]);

  const tierMeta = TIERS[activeTier] || TIERS.universe;

  return (
    <div className={`sc-stage ${mode}`} ref={stageRef}>
      <canvas ref={bgRef} className="sc-canvas-bg" />
      <canvas ref={warpRef} className="sc-canvas-warp" />

      {/* Top bar: context (left) · logo (center) · menu (right) */}
      <div className="sc-topbar">
        <span className="sc-topbar-cat" style={{ color: tierMeta.color }}>{category === "All" ? "Overall" : category} · {award}</span>
        <Link href="/" className="sc-logo"><span className="sc-logo-scout">Scout</span><span className="sc-logo-it">IT</span></Link>
        <nav className="sc-menu" ref={menuRef}>
          <button className="sc-menu-btn" aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 4h12M2 8h12M2 12h12" /></svg>
          </button>
          <div className={`sc-menu-drop ${menuOpen ? "open" : ""}`}>
            <span className="sc-menu-brand">ScoutIT</span>
            <Link href="/">Home</Link>
            <Link href="/discover">Discover</Link>
            <Link href="/showcase">The Board</Link>
            <Link href="/brokers">Brokers</Link>
            <Link href="/photographers">Photographers</Link>
            <Link href="/researchers">Researchers</Link>
            <Link href="/event-planners">Event Planners</Link>
            <Link href="/wishlist">Your Board</Link>
            <Link href="/about">About</Link>
          </div>
        </nav>
      </div>

      {/* LEFT — filter toggle + sliding panel (awards horizontal, categories vertical) */}
      <button className={`sc-edge sc-edge-left ${filterOpen ? "on" : ""}`} onClick={() => setFilterOpen((v) => !v)}>
        {filterOpen ? "✕ Close" : "≡ Filter"}
      </button>
      <div className={`sc-filter-panel ${filterOpen ? "open" : ""}`}>
        <div className="sc-fp-title">Award</div>
        <div className="sc-fp-awards">
          {BOARD_AWARDS.map((a) => (
            <button key={a} className={`sc-fp-award ${award === a ? "on" : ""}`} onClick={() => setAward(a)}>{a}</button>
          ))}
        </div>
        <div className="sc-fp-title">Category</div>
        <div className="sc-fp-cats">
          {BOARD_CATEGORIES.map((c) => (
            <button key={c} className={`sc-fp-cat ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>{c === "All" ? "All Properties" : c}</button>
          ))}
        </div>
      </div>

      {/* RIGHT — promo toggle (privilege of the peak: top 3 only) */}
      {promoUnlocked && (
        <>
          <button className={`sc-edge sc-edge-right ${promoOpen ? "on" : ""}`} onClick={() => setPromoOpen((v) => !v)} style={{ color: tierMeta.color, borderColor: `rgba(${tierMeta.rgb},0.6)` }}>
            {promoOpen ? "✕ Close" : "▶ Showcase"}
          </button>
          <div className={`sc-promo-panel ${promoOpen ? "open" : ""}`}>
            <div className="sc-promo-head" style={{ color: tierMeta.color }}>▶ Showcase Reel · #{active.rank} {tierMeta.badge}</div>
            {active.walkthrough_url ? (
              <div className="sc-promo-embed"><iframe src={active.walkthrough_url} title="Showcase reel" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
            ) : (
              <div className="sc-promo-soon">This podium spot has earned a showcase reel — coming soon.</div>
            )}
            <Link href={`/property/${active.property_slug}`} className="sc-promo-cta">View Full Briefing →</Link>
            <Link href={`/property/${active.property_slug}/brokers`} className="sc-promo-cta">Connect with Broker →</Link>
          </div>
        </>
      )}

      {/* Spotlight card */}
      {active ? (
        <div className="sc-overlay">
          <div className="sc-rank-badge" style={{ borderColor: `rgba(${tierMeta.rgb},0.6)`, color: tierMeta.color }}>
            #{active.rank} · {active.award_type} · {tierMeta.badge}
          </div>
          <div className="sc-card" ref={cardRef} onPointerDown={(e) => startDrag("spotlight", e)}
            style={posStyle("spotlight", { borderColor: `rgba(${tierMeta.rgb},0.65)`, "--tg": `rgba(${tierMeta.rgb},0.5)` })}>
            <div className="sc-photo" style={active.photo ? { backgroundImage: `url(${active.photo})` } : undefined}>
              {!active.photo && <span className="sc-photo-txt">Property Photo</span>}
              <span className="sc-card-cue" style={{ color: tierMeta.color, borderColor: `rgba(${tierMeta.rgb},0.6)` }}>Drag to place ✦</span>
            </div>
            <div className="sc-body">
              <div className="sc-cat" style={{ color: tierMeta.color }}>{active.category}</div>
              <div className="sc-name">{active.name}</div>
              {active.location && <div className="sc-loc">{active.location}</div>}
              <div className="sc-divider" />
              <div className="sc-stats">
                {[["Inquiries", active.inquiry_count], ["Views", active.views], ["Saves", active.saves]].filter(([, v]) => v != null && v !== 0).map(([l, v]) => (
                  <div className="sc-stat" key={l}><div className="sc-stat-num" style={{ color: tierMeta.color }}>{v}</div><div className="sc-stat-lbl">{l}</div></div>
                ))}
              </div>
              <Link href={`/property/${active.property_slug}`} className="sc-cta" onClick={swallowDragClick}>View Full Briefing <span>→</span></Link>
            </div>
          </div>
          <div className="sc-platform" style={{ borderColor: `rgba(${tierMeta.rgb},0.25)`, boxShadow: `0 0 22px rgba(${tierMeta.rgb},0.22)` }} />
        </div>
      ) : (
        <div className="sc-overlay"><div className="sc-empty">No ranked spaces in this filter yet.</div></div>
      )}

      {/* Bottom cluster: tier pills → ranks 4-10 → prev/next */}
      <div className="sc-bottom">
        <div className="sc-tier-nav">
          {["universe", "cluster", "solar"].map((t, i) => {
            const m = TIERS[t]; const on = activeTier === t;
            return (
              <button key={t} className="sc-pill" onClick={() => selectRank(i + 1)}
                style={{ color: on ? m.color : `rgba(${m.rgb},0.45)`, borderColor: on ? `rgba(${m.rgb},0.7)` : `rgba(${m.rgb},0.22)` }}>
                {m.label}
              </button>
            );
          })}
          <button className="sc-pill" onClick={() => selectRank(4)}
            style={{ color: activeTier === "starry" ? TIERS.starry.color : "rgba(138,138,138,0.45)", borderColor: activeTier === "starry" ? "rgba(138,138,138,0.6)" : "rgba(138,138,138,0.22)" }}>
            ④–⑩ Starry
          </button>
        </div>

        {/* Ranks 4-10 — collapsed by default; Next/Prev is the primary nav */}
        {listOpen && restRanks.length > 0 && (
          <div className="sc-rest">
            <div className="sc-rest-label">The Contenders · Ranks 4–{ranked.length}</div>
            <div className="sc-rest-row">
              {restRanks.map((e) => {
                const m = TIERS[e.tier];
                return (
                  <button key={e.rank} draggable={false}
                    className={`sc-rest-card ${active && active.rank === e.rank ? "on" : ""}`}
                    onPointerDown={(ev) => startDrag(`rest-${e.rank}`, ev)}
                    onClick={(ev) => { if (swallowDragClick(ev)) return; selectRank(e.rank); }}
                    style={posStyle(`rest-${e.rank}`, { "--tc": m.color, "--tg": `rgba(${m.rgb},0.5)` })}>
                    <div className="sc-rest-photo" style={e.photo ? { backgroundImage: `url(${e.photo})` } : undefined}>
                      <span className="sc-rest-rank">#{String(e.rank).padStart(2, "0")}</span>
                      <span className="sc-rest-showcase">Showcase →</span>
                    </div>
                    <div className="sc-rest-info">
                      <div className="sc-rest-cat">{e.category}</div>
                      <div className="sc-rest-name">{e.name}</div>
                      <div className="sc-rest-stat">{e.inquiry_count} inquiries</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="sc-controls">
          {ranked.length > 1 && (
            <>
              <button className="sc-arrow" onClick={() => step(-1)} disabled={!active || active.rank <= 1}>← Prev</button>
              <span className="sc-arrow-count">{active ? active.rank : 0} / {ranked.length}</span>
              <button className="sc-arrow" onClick={() => step(1)} disabled={!active || active.rank >= ranked.length}>Next →</button>
            </>
          )}
          {restRanks.length > 0 && (
            <button className={`sc-list-toggle ${listOpen ? "on" : ""}`} onClick={() => setListOpen((v) => !v)}>
              {listOpen ? "Hide Ranks ▴" : `All Ranks 4–${ranked.length} ▾`}
            </button>
          )}
        </div>
      </div>

      {mode === "homepage" && <Link href="/showcase" className="sc-seeall">See Full Board →</Link>}

      <style jsx>{`
        .sc-stage { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; }
        .sc-canvas-bg, .sc-canvas-warp { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        .sc-canvas-warp { z-index: 2; pointer-events: none; }

        .sc-topbar { position: absolute; top: 0; left: 0; width: 100%; z-index: 7; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 16px 24px; background: linear-gradient(to bottom, rgba(0,0,0,0.72), rgba(0,0,0,0)); pointer-events: none; }
        .sc-topbar-cat { justify-self: start; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
        :global(.sc-logo) { justify-self: center; font-family: Georgia, serif; font-size: 30px; letter-spacing: 3px; line-height: 1; text-decoration: none; pointer-events: auto; }
        :global(.sc-logo .sc-logo-scout) { color: #f5f3ee; }
        :global(.sc-logo .sc-logo-it) { color: #E8AE3C; transition: text-shadow 0.3s ease; }
        :global(.sc-logo:hover .sc-logo-it) { text-shadow: 0 0 14px rgba(232, 174, 60,0.55); }
        .sc-menu { justify-self: end; position: relative; pointer-events: auto; }
        .sc-menu-btn { width: 42px; height: 42px; border-radius: 50%; border: 1px solid #2a2a2a; background: rgba(0,0,0,0.5); color: #E8AE3C; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .sc-menu-btn svg { width: 17px; height: 17px; }
        .sc-menu-btn:hover { border-color: rgba(232, 174, 60,0.5); background: rgba(232, 174, 60,0.08); }
        .sc-menu-drop { position: absolute; top: 50px; right: 0; min-width: 188px; background: rgba(8,8,9,0.96); backdrop-filter: blur(14px); border: 1px solid #1a1a1a; padding: 10px 0; display: flex; flex-direction: column; opacity: 0; visibility: hidden; transform: translateY(-6px); transition: opacity 0.2s, transform 0.2s, visibility 0.2s; }
        .sc-menu-drop.open { opacity: 1; visibility: visible; transform: translateY(0); }
        .sc-menu-brand { font-family: Georgia, serif; font-size: 16px; color: #E8AE3C; padding: 6px 18px 10px; border-bottom: 1px solid #1a1a1a; margin-bottom: 6px; }
        .sc-menu-drop :global(a) { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #999; text-decoration: none; padding: 9px 18px; transition: color 0.15s, background 0.15s; }
        .sc-menu-drop :global(a):hover { color: #f0ede8; background: rgba(255,255,255,0.03); }

        /* Edge toggle tabs */
        .sc-edge { position: absolute; top: 50%; transform: translateY(-50%); z-index: 9; writing-mode: vertical-rl; text-orientation: mixed; font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; padding: 20px 9px; background: rgba(0,0,0,0.62); backdrop-filter: blur(8px); border: 1px solid #1f1f1f; color: #aaa; cursor: pointer; transition: color 0.2s, background 0.2s; }
        .sc-edge:hover { background: rgba(0,0,0,0.8); color: #f0ede8; }
        .sc-edge-left { left: 0; border-left: none; }
        .sc-edge-right { right: 0; border-right: none; }
        .sc-edge.on { color: #E8AE3C; }

        /* Filter panel (slides from left) */
        .sc-filter-panel { position: absolute; top: 0; left: 0; height: 100%; width: 300px; z-index: 8; background: rgba(8,8,9,0.95); backdrop-filter: blur(18px); border-right: 1px solid #1a1a1a; padding: 78px 26px 28px; transform: translateX(-100%); transition: transform 0.38s cubic-bezier(0.16,1,0.3,1); overflow-y: auto; }
        .sc-filter-panel.open { transform: translateX(0); }
        .sc-fp-title { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.22em; color: #555; text-transform: uppercase; margin: 20px 0 12px; }
        .sc-fp-awards { display: flex; flex-wrap: wrap; gap: 8px; }
        .sc-fp-award { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; color: #888; background: none; border: 1px solid #242424; padding: 9px 12px; cursor: pointer; transition: all 0.2s; }
        .sc-fp-award:hover { color: #f0ede8; }
        .sc-fp-award.on { color: #E8AE3C; border-color: rgba(232, 174, 60,0.6); background: rgba(232, 174, 60,0.08); }
        .sc-fp-cats { display: flex; flex-direction: column; gap: 2px; }
        .sc-fp-cat { text-align: left; font-family: Georgia, serif; font-size: 17px; color: #c8c8c8; background: none; border-left: 2px solid transparent; padding: 11px 14px; cursor: pointer; transition: all 0.2s; }
        .sc-fp-cat:hover { color: #f0ede8; }
        .sc-fp-cat.on { color: #E8AE3C; border-left-color: #E8AE3C; background: rgba(232, 174, 60,0.06); }

        /* Promo panel (slides from right) */
        .sc-promo-panel { position: absolute; top: 0; right: 0; height: 100%; width: 360px; z-index: 8; background: rgba(8,8,9,0.95); backdrop-filter: blur(18px); border-left: 1px solid #1a1a1a; padding: 78px 26px 28px; transform: translateX(100%); transition: transform 0.38s cubic-bezier(0.16,1,0.3,1); display: flex; flex-direction: column; gap: 14px; }
        .sc-promo-panel.open { transform: translateX(0); }
        .sc-promo-head { font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; }
        .sc-promo-embed { position: relative; width: 100%; aspect-ratio: 16/9; background: #000; }
        .sc-promo-embed :global(iframe) { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .sc-promo-soon { font-family: Georgia, serif; font-style: italic; font-size: 15px; color: #777; padding: 30px 4px; text-align: center; line-height: 1.6; }
        :global(.sc-promo-cta) { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #999; text-decoration: none; }
        :global(.sc-promo-cta:hover) { color: #E8AE3C; }

        /* Spotlight card (enlarged) */
        .sc-overlay { position: absolute; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding-bottom: 240px; pointer-events: none; }
        .sc-empty { font-family: Georgia, serif; font-style: italic; font-size: 22px; color: #666; }
        .sc-rank-badge { font-family: 'Courier New', monospace; font-size: 13px; letter-spacing: 0.28em; padding: 8px 22px; text-transform: uppercase; border: 1px solid; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); }
        .sc-card { width: 330px; border: 1px solid; background: rgba(6,6,7,0.6); backdrop-filter: blur(16px); overflow: hidden; pointer-events: all; user-select: none; cursor: grab; touch-action: none; animation: scFloat 4.5s ease-in-out infinite; transition: box-shadow 0.3s ease; }
        .sc-card:hover { animation-play-state: paused; box-shadow: 0 0 0 1px var(--tg), 0 24px 60px -22px var(--tg); }
        .sc-card:active { cursor: grabbing; }
        @keyframes scFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .sc-photo { position: relative; width: 100%; height: 184px; background: rgba(10,10,10,0.6); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: transform 0.55s ease; -webkit-user-drag: none; }
        .sc-card:hover .sc-photo { transform: scale(1.05); }
        .sc-card-cue { position: absolute; bottom: 12px; right: 12px; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 6px 12px; border: 1px solid; background: rgba(0,0,0,0.62); backdrop-filter: blur(6px); opacity: 0; transform: translateY(6px); transition: opacity 0.28s ease, transform 0.28s ease; }
        .sc-card:hover .sc-card-cue { opacity: 1; transform: translateY(0); }
        .sc-photo-txt { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 2px; color: #2a2a2a; text-transform: uppercase; }
        .sc-body { padding: 22px; }
        .sc-cat { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px; }
        .sc-name { font-family: Georgia, serif; font-size: 25px; color: #f0ede8; margin-bottom: 4px; line-height: 1.25; }
        .sc-loc { font-family: 'Courier New', monospace; font-size: 10px; color: #666; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
        .sc-divider { height: 1px; background: #222; margin-bottom: 14px; }
        .sc-stats { display: flex; gap: 26px; margin-bottom: 16px; }
        .sc-stat { display: flex; flex-direction: column; gap: 2px; }
        .sc-stat-num { font-family: Georgia, serif; font-size: 27px; }
        .sc-stat-lbl { font-family: 'Courier New', monospace; font-size: 10px; color: #555; letter-spacing: 0.18em; text-transform: uppercase; }
        :global(.sc-cta) { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.16em; color: #999; text-transform: uppercase; cursor: pointer; display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #1c1c1c; text-decoration: none; }
        :global(.sc-cta:hover) { color: #E8AE3C; }
        .sc-platform { width: 330px; height: 13px; border-radius: 50%; border: 1px solid; background: transparent; margin-top: 6px; animation: scPlat 3s ease-in-out infinite; }
        @keyframes scPlat { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

        /* Bottom cluster */
        .sc-bottom { position: absolute; bottom: 0; left: 0; width: 100%; z-index: 5; display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 18px 20px 22px; background: linear-gradient(to top, rgba(0,0,0,0.88) 55%, transparent); pointer-events: none; }
        .sc-tier-nav { display: flex; gap: 14px; pointer-events: all; }
        .sc-pill { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; padding: 8px 18px; border: 1px solid; cursor: pointer; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); transition: all 0.3s; }
        .sc-rest { width: 100%; max-width: 1120px; pointer-events: all; }
        .sc-rest-label { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.22em; color: #666; text-transform: uppercase; margin-bottom: 9px; text-align: center; }
        .sc-rest-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; overflow: visible; padding: 2px 4px 6px; }
        .sc-rest-card { flex: 0 0 auto; width: 176px; text-align: left; background: rgba(10,10,12,0.85); backdrop-filter: blur(8px); border: 1px solid rgba(120,120,120,0.25); padding: 0; overflow: hidden; cursor: grab; user-select: none; -webkit-user-drag: none; touch-action: none; transition: border-color 0.25s ease, box-shadow 0.25s ease; }
        .sc-rest-card:active { cursor: grabbing; }
        .sc-rest-card:hover { transform: translateY(-4px); border-color: var(--tg); box-shadow: 0 14px 32px -16px var(--tg); }
        .sc-rest-card.on { border-color: var(--tc); }
        .sc-rest-photo { position: relative; height: 84px; background: #161616; background-size: cover; background-position: center; overflow: hidden; transition: transform 0.45s ease; }
        .sc-rest-card:hover .sc-rest-photo { transform: scale(1.07); }
        .sc-rest-rank { position: absolute; top: 8px; left: 8px; font-family: 'Courier New', monospace; font-size: 12px; color: var(--tc); background: rgba(0,0,0,0.62); padding: 2px 8px; }
        .sc-rest-showcase { position: absolute; bottom: 7px; right: 7px; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,0.6); padding: 3px 7px; opacity: 0; transition: opacity 0.25s; }
        .sc-rest-card:hover .sc-rest-showcase { opacity: 1; }
        .sc-rest-info { padding: 11px 12px 13px; }
        .sc-rest-cat { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--tc); margin-bottom: 5px; }
        .sc-rest-name { font-family: Georgia, serif; font-size: 15px; color: #e8e6e2; line-height: 1.25; }
        .sc-rest-stat { font-family: 'Courier New', monospace; font-size: 10px; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 6px; }
        .sc-controls { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; pointer-events: all; }
        .sc-arrow { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #999; background: none; border: 1px solid #2a2a2a; padding: 9px 18px; cursor: pointer; transition: all 0.2s; }
        .sc-list-toggle { font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: #888; background: rgba(0,0,0,0.4); border: 1px solid #2a2a2a; padding: 9px 16px; cursor: pointer; transition: all 0.2s; }
        .sc-list-toggle:hover, .sc-list-toggle.on { color: #E8AE3C; border-color: rgba(232, 174, 60,0.5); }
        .sc-arrow:hover:not(:disabled) { color: #E8AE3C; border-color: rgba(232, 174, 60,0.5); }
        .sc-arrow:disabled { opacity: 0.3; cursor: default; }
        .sc-arrow-count { font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.1em; color: #777; }

        :global(.sc-seeall) { position: absolute; top: 18px; right: 22px; z-index: 6; font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 3px; color: #E8AE3C; text-transform: uppercase; text-decoration: none; border: 1px solid rgba(232, 174, 60,0.4); padding: 8px 16px; background: rgba(0,0,0,0.5); }
        :global(.sc-seeall:hover) { background: rgba(232, 174, 60,0.12); }

        @media (max-width: 768px) {
          .sc-filter-panel, .sc-promo-panel { width: 86%; }
          .sc-card { width: 290px; }
          .sc-rest-row { justify-content: flex-start; }
          /* Tier pills were wider than the phone screen and got clipped —
             let them scroll sideways within their own row instead. */
          .sc-tier-nav {
            max-width: 100%;
            overflow-x: auto;
            gap: 8px;
            padding: 0 12px 4px;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .sc-tier-nav::-webkit-scrollbar { display: none; }
          .sc-pill { flex: 0 0 auto; padding: 8px 12px; min-height: 40px; }
        }
      `}</style>
    </div>
  );
}
