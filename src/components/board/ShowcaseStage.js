"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES, BOARD_AWARDS } from "@/data/mock/mockShowcase";
import { isLiteMode } from "@/lib/liteMode";
import {
  Trophy,
  Flame,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Bookmark,
  ShieldCheck,
  Building2,
  ExternalLink,
  Sparkles,
  Award,
  TrendingUp,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// COSMIC TIER DEFINITIONS
// ════════════════════════════════════════════════════════════════
const TIER_ORDER = ["universe", "cluster", "solar", "starry"];
const TIERS = {
  universe: {
    label: "① Universe Apex",
    color: "#E8AE3C",
    rgb: "232, 174, 60",
    flash: "rgba(232, 174, 60, 0.85)",
    badge: "Champion #01",
    tag: "Gold Apex",
  },
  cluster: {
    label: "② Cluster Tier",
    color: "#E0E0E0",
    rgb: "224, 224, 224",
    flash: "rgba(220, 225, 240, 0.85)",
    badge: "Runner-Up #02",
    tag: "Silver Tier",
  },
  solar: {
    label: "③ Solar Tier",
    color: "#CD7F32",
    rgb: "205, 127, 50",
    flash: "rgba(205, 127, 50, 0.85)",
    badge: "Contender #03",
    tag: "Bronze Tier",
  },
  starry: {
    label: "④–⑩ Starry Roster",
    color: "#9E9E9E",
    rgb: "158, 158, 158",
    flash: "rgba(20, 40, 90, 0.85)",
    badge: "Ranked Space",
    tag: "High Demand",
  },
};

const rnd = (a, b) => a + Math.random() * (b - a);
const tierForRank = (rank) => (rank === 1 ? "universe" : rank === 2 ? "cluster" : rank === 3 ? "solar" : "starry");

// ════════════════════════════════════════════════════════════════
// 1. SCENE: UNIVERSE (Full-Screen Gold Spiral Galaxy & Flank Nebulae)
// ════════════════════════════════════════════════════════════════
function buildUniverse(W, H) {
  const stars = [], bgGalaxies = [], armParticles = [], dustLanes = [], comets = [], sparkles = [], sideNebulae = [];

  // 1,200 background stars across the entire canvas
  for (let i = 0; i < 1200; i++) {
    const warm = Math.random() < 0.38, cool = Math.random() < 0.28;
    stars.push({
      x: rnd(0, W),
      y: rnd(0, H),
      size: rnd(0.2, 1.8),
      op: rnd(0.12, 0.95),
      tw: rnd(0, Math.PI * 2),
      tws: rnd(0.003, 0.02),
      col: warm
        ? [rnd(240, 255) | 0, rnd(200, 235) | 0, rnd(120, 160) | 0]
        : cool
        ? [rnd(150, 200) | 0, rnd(175, 220) | 0, rnd(225, 255) | 0]
        : [245, 245, 250],
    });
  }

  // 12 background satellite galaxies in the perimeter
  for (let i = 0; i < 12; i++) {
    const onLeft = i % 2 === 0;
    const gx = onLeft ? rnd(0, W * 0.32) : rnd(W * 0.68, W);
    const gy = rnd(0, H);
    bgGalaxies.push({
      x: gx,
      y: gy,
      rx: rnd(12, 32),
      ry: rnd(6, 16),
      angle: rnd(0, Math.PI),
      op: rnd(0.18, 0.45),
      col: [rnd(180, 240) | 0, rnd(160, 210) | 0, rnd(130, 230) | 0],
    });
  }

  // Large glowing side nebulae visible in the left and right sidebars
  sideNebulae.push(
    { x: W * 0.15, y: H * 0.35, r: Math.min(W, H) * 0.42, col: "rgba(232, 174, 60,", op: 0.08 },
    { x: W * 0.18, y: H * 0.70, r: Math.min(W, H) * 0.38, col: "rgba(200, 140, 40,", op: 0.07 },
    { x: W * 0.85, y: H * 0.38, r: Math.min(W, H) * 0.45, col: "rgba(140, 80, 200,", op: 0.075 },
    { x: W * 0.82, y: H * 0.72, r: Math.min(W, H) * 0.40, col: "rgba(247, 198, 78,", op: 0.085 },
    { x: W * 0.50, y: H * 0.10, r: Math.min(W, H) * 0.30, col: "rgba(180, 110, 30,", op: 0.05 }
  );

  // Expansive 4-Arm Spiral Galaxy extending to the very edges of the screen
  const GX = W * 0.5, GY = H * 0.48, numArms = 4, armOffset = (Math.PI * 2) / numArms;
  for (let arm = 0; arm < numArms; arm++) {
    const points = 650;
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = arm * armOffset + t * Math.PI * 4.2 + rnd(-0.18, 0.18);
      const radius = t * Math.max(W, H) * 0.82;
      const scatter = rnd(0, radius * 0.22), scAngle = rnd(0, Math.PI * 2);
      const px = GX + Math.cos(angle) * radius + Math.cos(scAngle) * scatter;
      const py = GY + Math.sin(angle) * radius * 0.52 + Math.sin(scAngle) * scatter * 0.52;
      let r, g, b;
      if (t < 0.15) { r = 255; g = rnd(235, 255) | 0; b = rnd(190, 230) | 0; }
      else if (t < 0.45) { r = rnd(220, 250) | 0; g = rnd(170, 210) | 0; b = rnd(70, 130) | 0; }
      else if (t < 0.75) {
        if (Math.random() < 0.45) { r = rnd(150, 200) | 0; g = rnd(170, 220) | 0; b = rnd(220, 255) | 0; }
        else { r = rnd(220, 245) | 0; g = rnd(170, 210) | 0; b = rnd(90, 140) | 0; }
      } else { r = rnd(140, 190) | 0; g = rnd(160, 210) | 0; b = rnd(230, 255) | 0; }

      armParticles.push({
        x: px, y: py,
        size: t < 0.1 ? rnd(0.8, 2.8) : rnd(0.3, 1.8),
        op: t < 0.1 ? rnd(0.7, 1) : rnd(0.25, 0.9) * (1 - t * 0.3),
        tw: rnd(0, Math.PI * 2), tws: rnd(0.002, 0.018),
        col: [r, g, b],
      });
    }
  }

  // Dust lanes orbiting the arms
  for (let i = 0; i < 6; i++) {
    const onLeft = i % 2 === 0;
    const dx = onLeft ? rnd(W * 0.08, W * 0.30) : rnd(W * 0.70, W * 0.92);
    const dy = rnd(H * 0.2, H * 0.8);
    dustLanes.push({ x: dx, y: dy, r: rnd(40, 90), op: rnd(0.25, 0.5) });
  }

  // Shooting comets streaking through left and right sides
  const newComet = (delay) => {
    const onLeft = Math.random() < 0.5;
    const startX = onLeft ? rnd(-50, W * 0.3) : rnd(W * 0.7, W + 50);
    const startY = rnd(-50, H * 0.3);
    const vx = onLeft ? rnd(0.8, 2.2) : rnd(-2.2, -0.8);
    const vy = rnd(0.6, 2.0);
    return {
      x: startX, y: startY, vx, vy, len: rnd(70, 160), op: rnd(0.45, 0.85),
      size: rnd(1.2, 2.5), delay, col: Math.random() < 0.5 ? "rgba(247, 198, 78," : "rgba(220, 230, 255,",
    };
  };
  for (let i = 0; i < 7; i++) comets.push(newComet(i * 35));

  // Brilliant 4-point diffraction sparkles placed in the visible side margins
  for (let i = 0; i < 18; i++) {
    const onLeft = i % 2 === 0;
    const sx = onLeft ? rnd(W * 0.04, W * 0.28) : rnd(W * 0.72, W * 0.96);
    const sy = rnd(H * 0.08, H * 0.92);
    sparkles.push({
      x: sx, y: sy, size: rnd(1.8, 3.8), op: rnd(0.6, 1),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.04),
      col: [rnd(235, 255) | 0, rnd(225, 255) | 0, rnd(180, 255) | 0],
      vx: rnd(-0.04, 0.04), vy: rnd(-0.04, 0.04),
    });
  }

  return {
    draw(ctx, frame = 0) {
      // Base deep cosmic gradient
      const bg = ctx.createRadialGradient(GX, GY, 0, GX, GY, Math.max(W, H) * 0.9);
      bg.addColorStop(0, "#0a0610");
      bg.addColorStop(0.35, "#06030c");
      bg.addColorStop(0.7, "#030107");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Glowing side nebulae in HUD margins
      sideNebulae.forEach((n) => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.col + `${n.op})`);
        g.addColorStop(0.45, n.col + `${n.op * 0.4})`);
        g.addColorStop(1, n.col + "0)");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Background stars
      stars.forEach((s) => {
        s.tw += s.tws;
        const tw = 0.5 + 0.5 * Math.sin(s.tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`;
        ctx.fill();
      });

      // Satellite galaxies in side margins
      bgGalaxies.forEach((g) => {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.rotate(g.angle);
        ctx.scale(1, g.ry / g.rx);
        const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.rx);
        gg.addColorStop(0, `rgba(255,245,220,${g.op})`);
        gg.addColorStop(0.4, `rgba(${g.col[0]},${g.col[1]},${g.col[2]},${g.op * 0.5})`);
        gg.addColorStop(1, `rgba(${g.col[0]},${g.col[1]},${g.col[2]},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, g.rx, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
        ctx.restore();
      });

      // Expansive spiral arm particles
      armParticles.forEach((p) => {
        p.tw += p.tws;
        const tw = 0.6 + 0.4 * Math.sin(p.tw);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.op * tw).toFixed(2)})`;
        ctx.fill();
      });

      // Cosmic dust clouds
      dustLanes.forEach((d) => {
        const dg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
        dg.addColorStop(0, `rgba(0,0,0,${d.op})`);
        dg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = dg;
        ctx.fill();
      });

      // Brilliant 4-point cross diffraction sparkles
      sparkles.forEach((s) => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0; if (s.y < 0) s.y = H; if (s.y > H) s.y = 0;
        s.tw += s.tws;
        const tw = 0.4 + 0.6 * Math.sin(s.tw);
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 6);
        sg.addColorStop(0, `rgba(255,255,255,${(tw * s.op).toFixed(2)})`);
        sg.addColorStop(0.3, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(tw * s.op * 0.45).toFixed(2)})`);
        sg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 6, 0, Math.PI * 2);
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(tw * s.op).toFixed(2)})`;
        ctx.fill();

        // 4-point diffraction spike
        ctx.save();
        ctx.globalAlpha = tw * s.op * 0.65;
        ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.85)`;
        ctx.lineWidth = 0.6;
        const sl = s.size * 9;
        ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke();
        ctx.restore();
      });

      // Shooting comets
      comets.forEach((cm) => {
        if (frame < cm.delay) return;
        cm.x += cm.vx; cm.y += cm.vy;
        if (cm.x < -200 || cm.x > W + 200 || cm.y < -200 || cm.y > H + 200) Object.assign(cm, newComet(0));
        const ang = Math.atan2(cm.vy, cm.vx), tx = cm.x - Math.cos(ang) * cm.len, ty = cm.y - Math.sin(ang) * cm.len;
        const cg = ctx.createLinearGradient(cm.x, cm.y, tx, ty);
        cg.addColorStop(0, cm.col + cm.op + ")");
        cg.addColorStop(0.3, cm.col + (cm.op * 0.4) + ")");
        cg.addColorStop(1, cm.col + "0)");
        ctx.beginPath(); ctx.moveTo(cm.x, cm.y); ctx.lineTo(tx, ty); ctx.strokeStyle = cg; ctx.lineWidth = 1.6; ctx.stroke();
        const hg = ctx.createRadialGradient(cm.x, cm.y, 0, cm.x, cm.y, cm.size * 5);
        hg.addColorStop(0, "rgba(255,255,255,0.95)"); hg.addColorStop(0.3, cm.col + "0.6)"); hg.addColorStop(1, cm.col + "0)");
        ctx.beginPath(); ctx.arc(cm.x, cm.y, cm.size * 5, 0, Math.PI * 2); ctx.fillStyle = hg; ctx.fill();
        ctx.beginPath(); ctx.arc(cm.x, cm.y, cm.size, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,1)"; ctx.fill();
      });
    },
  };
}

// ════════════════════════════════════════════════════════════════
// 2. SCENE: CLUSTER (Dual Silver Clusters & Blue Nebular Flanks)
// ════════════════════════════════════════════════════════════════
function buildCluster(W, H) {
  const silver = () => {
    const t = Math.random();
    if (t < 0.35) return [rnd(205, 235) | 0, rnd(215, 245) | 0, rnd(235, 255) | 0];
    if (t < 0.7) return [rnd(225, 255) | 0, rnd(230, 255) | 0, rnd(235, 255) | 0];
    return [rnd(190, 220) | 0, rnd(200, 230) | 0, rnd(230, 255) | 0];
  };

  const stars = [], leftCore = [], rightCore = [], closeStars = [], streamers = [], gasClouds = [];

  for (let i = 0; i < 700; i++) {
    stars.push({
      x: rnd(0, W), y: rnd(0, H), size: rnd(0.15, 1.4), op: rnd(0.12, 0.65),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.018), col: silver(),
    });
  }

  // Left Cluster Center (visible in left HUD & margin)
  const leftX = W * 0.16, leftY = H * 0.48;
  for (let i = 0; i < 600; i++) {
    const angle = rnd(0, Math.PI * 2);
    const dist = Math.abs(rnd(0, 1) + rnd(0, 1) - 1) * Math.min(W, H) * 0.38;
    const x = leftX + Math.cos(angle) * dist;
    const y = leftY + Math.sin(angle) * dist;
    const prox = 1 - Math.min(dist / (Math.min(W, H) * 0.38), 1);
    leftCore.push({
      x, y,
      size: prox > 0.6 ? rnd(0.5, 2.4) : rnd(0.2, 1.3),
      op: prox > 0.6 ? rnd(0.65, 1) : rnd(0.25, 0.7),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.005, 0.03), col: silver(),
    });
  }

  // Right Cluster Center (visible in right HUD & margin)
  const rightX = W * 0.84, rightY = H * 0.52;
  for (let i = 0; i < 600; i++) {
    const angle = rnd(0, Math.PI * 2);
    const dist = Math.abs(rnd(0, 1) + rnd(0, 1) - 1) * Math.min(W, H) * 0.38;
    const x = rightX + Math.cos(angle) * dist;
    const y = rightY + Math.sin(angle) * dist;
    const prox = 1 - Math.min(dist / (Math.min(W, H) * 0.38), 1);
    rightCore.push({
      x, y,
      size: prox > 0.6 ? rnd(0.5, 2.4) : rnd(0.2, 1.3),
      op: prox > 0.6 ? rnd(0.65, 1) : rnd(0.25, 0.7),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.005, 0.03), col: silver(),
    });
  }

  // Shimmering blue & violet gas nebulae on the flanks
  gasClouds.push(
    { x: W * 0.12, y: H * 0.38, r: Math.min(W, H) * 0.45, col: "rgba(50, 90, 200,", op: 0.085 },
    { x: W * 0.22, y: H * 0.70, r: Math.min(W, H) * 0.38, col: "rgba(80, 50, 170,", op: 0.075 },
    { x: W * 0.88, y: H * 0.35, r: Math.min(W, H) * 0.44, col: "rgba(40, 110, 210,", op: 0.08 },
    { x: W * 0.80, y: H * 0.72, r: Math.min(W, H) * 0.40, col: "rgba(70, 70, 190,", op: 0.07 }
  );

  const newClose = () => {
    const onLeft = Math.random() < 0.5;
    const sx = onLeft ? rnd(W * 0.03, W * 0.28) : rnd(W * 0.72, W * 0.97);
    return {
      x: sx, y: rnd(0, H), size: rnd(1.6, 4.2), op: rnd(0.45, 0.95),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.01, 0.04), vx: rnd(-0.2, 0.2), vy: rnd(-0.15, 0.15),
      scale: rnd(0.8, 1.2), scaleV: rnd(0.0002, 0.0008), col: silver(),
    };
  };
  for (let i = 0; i < 45; i++) closeStars.push(newClose());

  const newStreamer = () => {
    const onLeft = Math.random() < 0.5;
    const sx = onLeft ? rnd(W * 0.02, W * 0.3) : rnd(W * 0.7, W * 0.98);
    return {
      x: sx, y: rnd(0, H), len: rnd(30, 110),
      angle: rnd(-Math.PI * 0.2, Math.PI * 0.2) + (Math.random() < 0.5 ? 0 : Math.PI),
      op: rnd(0.08, 0.28), speed: rnd(0.4, 1.5), col: silver(), life: rnd(0, 100),
    };
  };
  for (let i = 0; i < 30; i++) streamers.push(newStreamer());

  return {
    draw(ctx, frame = 0) {
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.88);
      bg.addColorStop(0, "#050712");
      bg.addColorStop(0.4, "#020408");
      bg.addColorStop(0.8, "#010204");
      bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Gas clouds in the flanks
      gasClouds.forEach((g) => {
        const gg = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        gg.addColorStop(0, g.col + `${g.op})`);
        gg.addColorStop(0.5, g.col + `${g.op * 0.4})`);
        gg.addColorStop(1, g.col + "0)");
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
      });

      // Background stars
      stars.forEach((s) => {
        s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`;
        ctx.fill();
      });

      // Velocity streamers
      streamers.forEach((st) => {
        st.life += st.speed;
        const fi = Math.min(st.life / 20, 1), fo = st.life > 80 ? 1 - (st.life - 80) / 20 : 0, alpha = st.op * (fi - fo);
        if (st.life > 100) { Object.assign(st, newStreamer()); st.life = 0; return; }
        const ex = st.x + Math.cos(st.angle) * st.len, ey = st.y + Math.sin(st.angle) * st.len;
        const sg = ctx.createLinearGradient(st.x, st.y, ex, ey);
        sg.addColorStop(0, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},0)`);
        sg.addColorStop(0.5, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},${Math.max(0, alpha).toFixed(2)})`);
        sg.addColorStop(1, `rgba(${st.col[0]},${st.col[1]},${st.col[2]},0)`);
        ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(ex, ey); ctx.strokeStyle = sg; ctx.lineWidth = 1.0; ctx.stroke();
      });

      // Dual core clusters on left and right
      [leftCore, rightCore].forEach((core) => {
        core.forEach((p) => {
          p.tw += p.tws; const tw = 0.5 + 0.5 * Math.sin(p.tw);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.col[0]},${p.col[1]},${p.col[2]},${(p.op * tw).toFixed(2)})`;
          ctx.fill();
        });
      });

      // Foreground sparkling diamond stars with lens flares
      closeStars.forEach((s) => {
        s.x += s.vx; s.y += s.vy; s.scale += s.scaleV;
        if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20 || s.scale > 2.5) { Object.assign(s, newClose()); s.scale = 0.8; }
        s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw), sz = s.size * s.scale;
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, sz * 5);
        sg.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.4).toFixed(2)})`);
        sg.addColorStop(1, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0)`);
        ctx.beginPath(); ctx.arc(s.x, s.y, sz * 5, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
        ctx.beginPath(); ctx.arc(s.x, s.y, sz, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${(s.op * tw).toFixed(2)})`; ctx.fill();

        ctx.save(); ctx.globalAlpha = s.op * tw * 0.6;
        ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.85)`; ctx.lineWidth = 0.6;
        const sl = sz * 8;
        ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke();
        ctx.restore();
      });
    },
  };
}

// ════════════════════════════════════════════════════════════════
// 3. SCENE: SOLAR (Wide Orbital Planetary System Across Sidebars)
// ════════════════════════════════════════════════════════════════
function buildSolar(W, H) {
  const stars = [], orbitals = [], asteroids = [], flares = [], bronzeNebulae = [];

  for (let i = 0; i < 500; i++) {
    stars.push({
      x: rnd(0, W), y: rnd(0, H), size: rnd(0.15, 1.4), op: rnd(0.12, 0.6),
      tw: rnd(0, Math.PI * 2), tws: rnd(0.003, 0.015),
      col: Math.random() < 0.5 ? [rnd(210, 245) | 0, rnd(160, 200) | 0, rnd(70, 110) | 0] : [rnd(230, 255) | 0, rnd(215, 245) | 0, rnd(190, 230) | 0],
    });
  }

  const cx = W * 0.5, cy = H * 0.5;

  // Bronze & amber glow clouds in the corners and flanks
  bronzeNebulae.push(
    { x: W * 0.14, y: H * 0.35, r: Math.min(W, H) * 0.45, col: "rgba(205, 127, 50,", op: 0.08 },
    { x: W * 0.18, y: H * 0.75, r: Math.min(W, H) * 0.40, col: "rgba(180, 90, 20,", op: 0.07 },
    { x: W * 0.86, y: H * 0.32, r: Math.min(W, H) * 0.46, col: "rgba(230, 140, 40,", op: 0.08 },
    { x: W * 0.82, y: H * 0.70, r: Math.min(W, H) * 0.42, col: "rgba(160, 70, 15,", op: 0.075 }
  );

  // 5 Giant Wide Orbital Tracks spanning the entire width so planets sweep past the sidebars
  const tracks = [
    { rx: W * 0.28, ry: H * 0.24, speed: 0.008, size: 8, col: [210, 120, 40], col2: [240, 150, 70], name: "Vulcan", hasRing: false },
    { rx: W * 0.42, ry: H * 0.34, speed: 0.0055, size: 10, col: [100, 160, 220], col2: [140, 190, 250], name: "Terra", hasMoon: true, moonSize: 2.5 },
    { rx: W * 0.58, ry: H * 0.44, speed: 0.0035, size: 16, col: [190, 140, 70], col2: [220, 170, 90], name: "Saturnia", hasRing: true },
    { rx: W * 0.74, ry: H * 0.54, speed: 0.0022, size: 12, col: [70, 180, 160], col2: [100, 210, 190], name: "Aethel", hasMoon: true, moonSize: 3 },
    { rx: W * 0.90, ry: H * 0.64, speed: 0.0015, size: 14, col: [130, 90, 190], col2: [160, 120, 220], name: "Obsidian", hasRing: true }
  ];

  tracks.forEach((tr, idx) => {
    orbitals.push({
      rx: tr.rx,
      ry: tr.ry,
      angle: idx * (Math.PI * 0.42) + rnd(0, 0.5),
      speed: tr.speed * (Math.random() > 0.5 ? 1 : -1),
      size: tr.size,
      col: tr.col,
      col2: tr.col2,
      hasMoon: !!tr.hasMoon,
      moonAngle: rnd(0, Math.PI * 2),
      moonSpeed: rnd(0.02, 0.04),
      moonSize: tr.moonSize || 2,
      hasRing: !!tr.hasRing,
    });
  });

  // Wide Asteroid Belt (100 asteroids circling across the left & right margins)
  for (let i = 0; i < 100; i++) {
    const angle = rnd(0, Math.PI * 2);
    const arx = rnd(W * 0.46, W * 0.54);
    const ary = rnd(H * 0.36, H * 0.44);
    asteroids.push({
      arx, ary, angle,
      speed: rnd(0.001, 0.003) * (Math.random() > 0.5 ? 1 : -1),
      size: rnd(0.6, 2.2),
      op: rnd(0.35, 0.8),
      col: [rnd(140, 190) | 0, rnd(110, 150) | 0, rnd(70, 110) | 0],
    });
  }

  for (let i = 0; i < 8; i++) {
    flares.push({ angle: rnd(0, Math.PI * 2), len: rnd(35, 80), width: rnd(4, 10), op: rnd(0.35, 0.75), speed: rnd(0.005, 0.015), phase: rnd(0, Math.PI * 2) });
  }

  const drawPlanet = (ctx, x, y, size, col, col2, hasRing) => {
    let pg = ctx.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size);
    pg.addColorStop(0, `rgba(${col2[0]},${col2[1]},${col2[2]},1)`);
    pg.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},1)`);
    pg.addColorStop(1, `rgba(${Math.max(col[0] - 50, 0)},${Math.max(col[1] - 50, 0)},${Math.max(col[2] - 40, 0)},1)`);
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

    const ag = ctx.createRadialGradient(x, y, size * 0.8, x, y, size * 2.0);
    ag.addColorStop(0, `rgba(${col2[0]},${col2[1]},${col2[2]},0.28)`);
    ag.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
    ctx.beginPath(); ctx.arc(x, y, size * 2.0, 0, Math.PI * 2); ctx.fillStyle = ag; ctx.fill();

    if (hasRing) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.35); ctx.scale(1, 0.3);
      ctx.beginPath(); ctx.arc(0, 0, size * 2.6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${col2[0]},${col2[1]},${col2[2]},0.45)`; ctx.lineWidth = size * 0.7; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, size * 3.3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},0.25)`; ctx.lineWidth = size * 0.4; ctx.stroke();
      ctx.restore();
    }
  };

  return {
    draw(ctx, frame = 0) {
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.9);
      bg.addColorStop(0, "#100600"); bg.addColorStop(0.25, "#0a0400"); bg.addColorStop(0.6, "#040200"); bg.addColorStop(1, "#000000");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Bronze nebulae in the flanks
      bronzeNebulae.forEach((n) => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.col + `${n.op})`);
        g.addColorStop(0.5, n.col + `${n.op * 0.4})`);
        g.addColorStop(1, n.col + "0)");
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      });

      // Background stars
      stars.forEach((s) => {
        s.tw += s.tws; const tw = 0.5 + 0.5 * Math.sin(s.tw);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`;
        ctx.fill();
      });

      // Visible Wide Orbital Rings
      tracks.forEach((tr) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, tr.rx, tr.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(205, 127, 50, 0.12)";
        ctx.lineWidth = 1.0;
        ctx.stroke();
      });

      // Wide Asteroid Belt
      asteroids.forEach((a) => {
        a.angle += a.speed;
        const ax = cx + Math.cos(a.angle) * a.arx;
        const ay = cy + Math.sin(a.angle) * a.ary;
        ctx.beginPath(); ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${a.col[0]},${a.col[1]},${a.col[2]},${a.op})`; ctx.fill();
      });

      // Orbiting planets sweeping through the screen
      orbitals.forEach((o) => {
        o.angle += o.speed;
        const ox = cx + Math.cos(o.angle) * o.rx;
        const oy = cy + Math.sin(o.angle) * o.ry;
        drawPlanet(ctx, ox, oy, o.size, o.col, o.col2, o.hasRing);
        if (o.hasMoon) {
          o.moonAngle += o.moonSpeed;
          const mx = ox + Math.cos(o.moonAngle) * o.size * 3.0;
          const my = oy + Math.sin(o.moonAngle) * o.size * 3.0 * 0.5;
          ctx.beginPath(); ctx.arc(mx, my, o.moonSize, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(230, 220, 200, 0.95)"; ctx.fill();
          const mg = ctx.createRadialGradient(mx, my, 0, mx, my, o.moonSize * 2.5);
          mg.addColorStop(0, "rgba(230, 220, 200, 0.25)"); mg.addColorStop(1, "rgba(230, 220, 200, 0)");
          ctx.beginPath(); ctx.arc(mx, my, o.moonSize * 2.5, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();
        }
      });

      // Central Solar Prominences & Flares
      flares.forEach((f) => {
        f.phase += f.speed;
        const fo = f.op * (0.5 + 0.5 * Math.sin(f.phase));
        const fx1 = cx + Math.cos(f.angle) * (30 + f.len * 0.3), fy1 = cy + Math.sin(f.angle) * (30 + f.len * 0.3);
        const fx2 = cx + Math.cos(f.angle) * (30 + f.len), fy2 = cy + Math.sin(f.angle) * (30 + f.len);
        const fg = ctx.createLinearGradient(fx1, fy1, fx2, fy2);
        fg.addColorStop(0, `rgba(255, 200, 60, ${fo})`);
        fg.addColorStop(0.5, `rgba(255, 130, 20, ${fo * 0.5})`);
        fg.addColorStop(1, "rgba(255, 90, 0, 0)");
        ctx.beginPath(); ctx.moveTo(fx1, fy1); ctx.lineTo(fx2, fy2); ctx.strokeStyle = fg; ctx.lineWidth = f.width; ctx.stroke();
        f.angle += 0.0003;
      });

      // Pulsing Star Halo
      const pulseR = 40 + 10 * Math.sin(frame * 0.04);
      const pr = ctx.createRadialGradient(cx, cy, 26, cx, cy, pulseR);
      pr.addColorStop(0, `rgba(255, 200, 60, ${0.12 + 0.04 * Math.sin(frame * 0.04)})`);
      pr.addColorStop(1, "rgba(255, 140, 0, 0)");
      ctx.beginPath(); ctx.arc(cx, cy, pulseR, 0, Math.PI * 2); ctx.fillStyle = pr; ctx.fill();
    },
  };
}

// ════════════════════════════════════════════════════════════════
// 4. SCENE: STARRY (Dark Night Beach & Starry Night Horizon)
// ════════════════════════════════════════════════════════════════
function buildStarry(W, H) {
  const skyH = H * 0.64;
  const stars = [], sparkles = [], swirls = [], gasPockets = [];

  // 800 twinkling stars across the night sky
  for (let i = 0; i < 800; i++) {
    const warm = Math.random() < 0.3, cool = Math.random() < 0.35;
    stars.push({
      x: rnd(0, W),
      y: rnd(0, skyH),
      r: rnd(0.18, 1.5),
      op: rnd(0.15, 0.95),
      tw: rnd(0, Math.PI * 2),
      tws: rnd(0.003, 0.022),
      col: warm
        ? [rnd(225, 255) | 0, rnd(200, 235) | 0, rnd(140, 180) | 0]
        : cool
        ? [rnd(160, 210) | 0, rnd(180, 225) | 0, rnd(225, 255) | 0]
        : [240, 242, 250],
    });
  }

  // Large glowing gas clouds on the left and right flanks
  gasPockets.push(
    { x: W * 0.14, y: H * 0.18, r: Math.min(W, H) * 0.38, col: "rgba(40, 75, 160,", op: 0.08 },
    { x: W * 0.22, y: H * 0.45, r: Math.min(W, H) * 0.32, col: "rgba(232, 174, 60,", op: 0.06 },
    { x: W * 0.84, y: H * 0.22, r: Math.min(W, H) * 0.42, col: "rgba(100, 60, 180,", op: 0.075 },
    { x: W * 0.88, y: H * 0.48, r: Math.min(W, H) * 0.35, col: "rgba(30, 110, 170,", op: 0.07 }
  );

  // 6 Van Gogh style Starry Night swirling filaments
  for (let s = 0; s < 6; s++) {
    const pts = [];
    let cx = rnd(0, W), cy = rnd(skyH * 0.05, skyH * 0.65);
    for (let p = 0; p < 80; p++) {
      pts.push({ x: cx, y: cy });
      cx += rnd(-8, 8) + rnd(3, 8);
      cy += rnd(-6, 6);
      cy = Math.max(5, Math.min(skyH - 5, cy));
      if (cx > W + 60) cx = -60;
    }
    swirls.push({
      pts,
      op: rnd(0.016, 0.038),
      col: Math.random() < 0.5
        ? [rnd(100, 160) | 0, rnd(140, 200) | 0, rnd(210, 255) | 0]
        : [rnd(180, 230) | 0, rnd(160, 210) | 0, rnd(90, 150) | 0],
      phase: rnd(0, Math.PI * 2),
      speed: rnd(0.003, 0.008),
    });
  }

  // 16 Sparkling cross diffraction stars in visible margins
  for (let i = 0; i < 16; i++) {
    const onLeft = i % 2 === 0;
    const sx = onLeft ? rnd(W * 0.04, W * 0.28) : rnd(W * 0.72, W * 0.96);
    sparkles.push({
      x: sx,
      y: rnd(0, skyH * 0.88),
      r: rnd(1.6, 3.2),
      op: rnd(0.55, 0.95),
      tw: rnd(0, Math.PI * 2),
      tws: rnd(0.01, 0.032),
      col: [rnd(220, 255) | 0, rnd(225, 255) | 0, rnd(210, 255) | 0],
    });
  }

  return {
    draw(ctx, frame = 0) {
      // 1. Deep Midnight Sky Gradient
      let skyG = ctx.createLinearGradient(0, 0, 0, skyH);
      skyG.addColorStop(0, "#000308");
      skyG.addColorStop(0.3, "#000510");
      skyG.addColorStop(0.7, "#010818");
      skyG.addColorStop(1, "#020c22");
      ctx.fillStyle = skyG;
      ctx.fillRect(0, 0, W, skyH);

      // Milky Way haze
      let mw = ctx.createLinearGradient(W * 0.08, 0, W * 0.85, skyH);
      mw.addColorStop(0, "rgba(80, 90, 140, 0)");
      mw.addColorStop(0.2, "rgba(80, 95, 155, 0.055)");
      mw.addColorStop(0.48, "rgba(100, 110, 175, 0.085)");
      mw.addColorStop(0.75, "rgba(80, 90, 150, 0.05)");
      mw.addColorStop(1, "rgba(60, 70, 130, 0)");
      ctx.fillStyle = mw;
      ctx.fillRect(0, 0, W, skyH);

      // Side gas nebulae
      gasPockets.forEach((gp) => {
        const gg = ctx.createRadialGradient(gp.x, gp.y, 0, gp.x, gp.y, gp.r);
        gg.addColorStop(0, gp.col + `${gp.op})`);
        gg.addColorStop(0.5, gp.col + `${gp.op * 0.4})`);
        gg.addColorStop(1, gp.col + "0)");
        ctx.beginPath();
        ctx.arc(gp.x, gp.y, gp.r, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();
      });

      // Luminous Full/Crescent Moon on upper right
      const moonX = W * 0.84, moonY = H * 0.12, moonR = Math.min(W, H) * 0.036;
      let mg = ctx.createRadialGradient(moonX - moonR * 0.2, moonY - moonR * 0.2, 0, moonX, moonY, moonR);
      mg.addColorStop(0, "rgba(255, 252, 235, 0.95)");
      mg.addColorStop(0.6, "rgba(225, 220, 195, 0.65)");
      mg.addColorStop(1, "rgba(190, 185, 160, 0)");
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fillStyle = mg;
      ctx.fill();

      // Moon outer coronal glow
      let mh = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 4.0);
      mh.addColorStop(0, "rgba(235, 230, 195, 0.09)");
      mh.addColorStop(0.5, "rgba(215, 210, 175, 0.035)");
      mh.addColorStop(1, "rgba(200, 195, 160, 0)");
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 4.0, 0, Math.PI * 2);
      ctx.fillStyle = mh;
      ctx.fill();

      // Swirling filaments
      swirls.forEach((sw) => {
        sw.phase += sw.speed;
        const pulse = 0.6 + 0.4 * Math.sin(sw.phase);
        ctx.beginPath();
        ctx.moveTo(sw.pts[0].x, sw.pts[0].y);
        for (let i = 1; i < sw.pts.length - 2; i++) {
          const mx = (sw.pts[i].x + sw.pts[i + 1].x) / 2;
          const my = (sw.pts[i].y + sw.pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(sw.pts[i].x, sw.pts[i].y, mx, my);
        }
        ctx.strokeStyle = `rgba(${sw.col[0]},${sw.col[1]},${sw.col[2]},${(sw.op * pulse).toFixed(3)})`;
        ctx.lineWidth = 2.8;
        ctx.stroke();
      });

      // Stars
      stars.forEach((s) => {
        s.tw += s.tws;
        const tw = 0.5 + 0.5 * Math.sin(s.tw);
        if (s.y > skyH) return;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw).toFixed(2)})`;
        ctx.fill();
      });

      // Constellation Sparkles with 4-point cross diffraction spikes
      sparkles.forEach((s) => {
        if (s.y > skyH) return;
        s.tw += s.tws;
        const tw = 0.4 + 0.6 * Math.sin(s.tw);
        const gg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
        gg.addColorStop(0, `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.35).toFixed(2)})`);
        gg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = gg;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(s.op * tw).toFixed(2)})`;
        ctx.fill();

        ctx.save();
        ctx.globalAlpha = s.op * tw * 0.5;
        ctx.strokeStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},0.75)`;
        ctx.lineWidth = 0.5;
        const sl = s.r * 8;
        ctx.beginPath(); ctx.moveTo(s.x - sl, s.y); ctx.lineTo(s.x + sl, s.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s.x, s.y - sl); ctx.lineTo(s.x, s.y + sl); ctx.stroke();
        ctx.restore();
      });

      // 2. Coastal Beach Silhouette / Island Land Line
      const horizonY = skyH, landH = H * 0.08;
      ctx.beginPath();
      ctx.moveTo(0, horizonY + landH);
      ctx.lineTo(0, horizonY + landH * 0.6);
      ctx.bezierCurveTo(W * 0.08, horizonY + landH * 0.2, W * 0.15, horizonY + landH * 0.4, W * 0.22, horizonY + landH * 0.35);
      ctx.bezierCurveTo(W * 0.3, horizonY + landH * 0.28, W * 0.38, horizonY + landH * 0.5, W * 0.45, horizonY + landH * 0.45);
      ctx.bezierCurveTo(W * 0.52, horizonY + landH * 0.38, W * 0.58, horizonY + landH * 0.55, W * 0.65, horizonY + landH * 0.48);
      ctx.bezierCurveTo(W * 0.72, horizonY + landH * 0.42, W * 0.80, horizonY + landH * 0.6, W * 0.88, horizonY + landH * 0.52);
      ctx.bezierCurveTo(W * 0.94, horizonY + landH * 0.44, W * 0.98, horizonY + landH * 0.55, W, horizonY + landH * 0.5);
      ctx.lineTo(W, horizonY + landH);
      ctx.closePath();
      let lg = ctx.createLinearGradient(0, horizonY, 0, horizonY + landH);
      lg.addColorStop(0, "#080c08");
      lg.addColorStop(0.5, "#050805");
      lg.addColorStop(1, "#020402");
      ctx.fillStyle = lg;
      ctx.fill();

      // Atmospheric Horizon Glow
      let hg = ctx.createLinearGradient(0, horizonY - H * 0.04, 0, horizonY + H * 0.04);
      hg.addColorStop(0, "rgba(20, 35, 60, 0)");
      hg.addColorStop(0.5, "rgba(25, 45, 75, 0.2)");
      hg.addColorStop(1, "rgba(10, 20, 35, 0)");
      ctx.fillStyle = hg;
      ctx.fillRect(0, horizonY - H * 0.04, W, H * 0.08);

      // 3. Deep Midnight Sea & Water Reflections
      const seaY = horizonY + landH * 0.7, seaHh = H - seaY;
      let sg = ctx.createLinearGradient(0, seaY, 0, H);
      sg.addColorStop(0, "#020810");
      sg.addColorStop(0.4, "#010508");
      sg.addColorStop(1, "#000204");
      ctx.fillStyle = sg;
      ctx.fillRect(0, seaY, W, seaHh);

      // Star reflections rippling on the water
      stars.forEach((s) => {
        if (s.op < 0.4) return;
        const tw = 0.5 + 0.5 * Math.sin(s.tw);
        const reflY = seaY + (skyH - s.y) * 0.2;
        if (reflY > H) return;
        const waveX = s.x + Math.sin(frame * 0.025 + s.x * 0.04) * 2.5;
        ctx.beginPath();
        ctx.ellipse(waveX, reflY, s.r * 0.6, s.r * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col[0]},${s.col[1]},${s.col[2]},${(s.op * tw * 0.18).toFixed(2)})`;
        ctx.fill();
      });

      // Luminous Moon Reflection Column on the Water
      const moonReflY = seaY + H * 0.03;
      for (let i = 0; i < 14; i++) {
        const ry = moonReflY + i * ((H - moonReflY) / 14);
        const rx = moonX + Math.sin(frame * 0.03 + i * 0.6) * (3 + i * 1.4);
        const rw = 3 + i * 1.8;
        const rop = (0.14 - i * 0.008) * Math.max(0, 0.5 + 0.5 * Math.sin(frame * 0.02 + i * 0.4));
        ctx.beginPath();
        ctx.ellipse(rx, ry, rw, 1.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 230, 195, ${rop.toFixed(2)})`;
        ctx.fill();
      }

      // Rolling Ocean Waves
      for (let w = 0; w < 6; w++) {
        const wy = seaY + seaHh * (0.08 + w * 0.16);
        const wop = 0.05 - w * 0.006;
        ctx.beginPath();
        ctx.moveTo(0, wy);
        for (let x = 0; x <= W; x += 4) {
          const dy = Math.sin(x * 0.016 + frame * 0.022 + w * 0.8) * 2.0;
          ctx.lineTo(x, wy + dy);
        }
        ctx.strokeStyle = `rgba(60, 100, 160, ${wop})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
    },
  };
}

const BUILDERS = { universe: buildUniverse, cluster: buildCluster, solar: buildSolar, starry: buildStarry };

// ════════════════════════════════════════════════════════════════
// COMPONENT: ARCHITECTURAL COMMAND STAGE
// ════════════════════════════════════════════════════════════════
export default function ShowcaseStage({ mode = "full" }) {
  const stageRef = useRef(null);
  const bgRef = useRef(null);
  const warpRef = useRef(null);
  const sceneRef = useRef(null);
  const tierRef = useRef("universe");
  const dimRef = useRef({ W: 0, H: 0 });
  const transRef = useRef(null);
  const warpParticles = useRef([]);

  // Drag-to-scroll refs for Category Rail
  const catRailRef = useRef(null);
  const isCatDragging = useRef(false);
  const catStartX = useRef(0);
  const catScrollLeft = useRef(0);
  const [isCatRailDragging, setIsCatRailDragging] = useState(false);

  // Drag-to-scroll refs for Leaderboard Tray
  const trayStripRef = useRef(null);
  const isTrayDragging = useRef(false);
  const trayStartX = useRef(0);
  const trayScrollLeft = useRef(0);
  const [isTrayStripDragging, setIsTrayStripDragging] = useState(false);

  const [entries, setEntries] = useState([]);
  const [award, setAward] = useState("Most Inquired");
  const [category, setCategory] = useState("All");
  const [activeRank, setActiveRank] = useState(1);
  const [activeTier, setActiveTier] = useState("universe");
  const [savedSlugs, setSavedSlugs] = useState(new Set());
  const [mediaMode, setMediaMode] = useState("photo");

  // Fetch entries
  useEffect(() => {
    let alive = true;
    fetch("/api/showcase")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.entries) setEntries(d.entries);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const ranked = useMemo(() => rankBoard(entries, { award, category }), [entries, award, category]);
  const active = ranked.find((e) => e.rank === activeRank) || ranked[0] || null;

  const categoryCounts = useMemo(() => {
    const counts = { All: entries.length };
    BOARD_CATEGORIES.forEach((c) => {
      if (c !== "All") {
        counts[c] = entries.filter((e) => e.category === c).length;
      }
    });
    return counts;
  }, [entries]);

  // Size canvases with window dimensions
  const sizeCanvases = useCallback(() => {
    const stage = stageRef.current;
    const W = stage ? stage.clientWidth : window.innerWidth;
    const H = stage ? stage.clientHeight : window.innerHeight;
    dimRef.current = { W, H };
    [bgRef.current, warpRef.current].forEach((c) => {
      if (c) {
        c.width = W;
        c.height = H;
      }
    });
    sceneRef.current = BUILDERS[tierRef.current](W, H);
  }, []);

  // Animation & Transition loop
  useEffect(() => {
    if (isLiteMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    sizeCanvases();
    const bg = bgRef.current, warp = warpRef.current;
    if (!bg || !warp) return;
    const ctx = bg.getContext("2d"), wctx = warp.getContext("2d");
    let raf = 0, frame = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      frame++;
      const { W, H } = dimRef.current;
      if (!W || !H) return;

      const tr = transRef.current;
      let scale = 1;
      if (tr) {
        const now = performance.now(), p = Math.min((now - tr.start) / tr.dur, 1);
        const target = tr.dir === "up" ? 1.15 : 0.85;
        scale = p < 0.45 ? 1 + (target - 1) * (p / 0.45) : target + (1 - target) * ((p - 0.45) / 0.55);

        if (!tr.swapped && p >= 0.42) {
          tr.swapped = true;
          tierRef.current = tr.to;
          sceneRef.current = BUILDERS[tr.to](W, H);
          setActiveTier(tr.to);
          setActiveRank(tr.toRank);
        }
        if (p >= 1) transRef.current = null;
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(scale, scale);
      ctx.translate(-W / 2, -H / 2);
      if (sceneRef.current) sceneRef.current.draw(ctx, frame);
      ctx.restore();

      // Warp streaks & celestial flash overlay during tier switch
      wctx.clearRect(0, 0, W, H);
      if (tr) {
        const now = performance.now(), p = Math.min((now - tr.start) / tr.dur, 1);
        const cx = W / 2, cy = H / 2;
        if (p < 0.6) {
          const intensity = p / 0.6;
          warpParticles.current.forEach((wp) => {
            const dx = cx - wp.x, dy = cy - wp.y;
            wp.x += dx * (0.02 + intensity * 0.08);
            wp.y += dy * (0.02 + intensity * 0.08);
            const tx = wp.x - dx * 0.04 * (1 + intensity * 4);
            const ty = wp.y - dy * 0.04 * (1 + intensity * 4);
            wctx.beginPath();
            wctx.moveTo(wp.x, wp.y);
            wctx.lineTo(tx, ty);
            wctx.strokeStyle = `rgba(${tr.fromRgb || "232, 174, 60"},${(0.5 * (1 - p)).toFixed(2)})`;
            wctx.lineWidth = 1.4;
            wctx.stroke();
          });
        }
        if (p > 0.35 && p < 0.75) {
          const fp = (p - 0.35) / 0.4;
          const a = Math.sin(fp * Math.PI);
          wctx.fillStyle = tr.flash.replace(/0\.85\)$/, `${(0.85 * a).toFixed(2)})`);
          wctx.fillRect(0, 0, W, H);
        }
      }
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", sizeCanvases);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", sizeCanvases);
    };
  }, [sizeCanvases]);

  // Cosmic Warp Tier Transition Trigger
  const goToTier = useCallback((toTier, toRank) => {
    if (transRef.current) return;
    const from = tierRef.current;
    if (from === toTier && toRank === activeRank) return;
    const dir = TIER_ORDER.indexOf(toTier) > TIER_ORDER.indexOf(from) ? "up" : "down";
    const { W, H } = dimRef.current;
    warpParticles.current = Array.from({ length: 200 }, () => {
      const edge = Math.floor(rnd(0, 4));
      return edge === 0
        ? { x: rnd(0, W), y: 0 }
        : edge === 1
        ? { x: W, y: rnd(0, H) }
        : edge === 2
        ? { x: rnd(0, W), y: H }
        : { x: 0, y: rnd(0, H) };
    });
    transRef.current = {
      start: performance.now(),
      dur: 600,
      dir,
      to: toTier,
      toRank,
      swapped: false,
      fromRgb: TIERS[from]?.rgb || "232, 174, 60",
      flash: TIERS[toTier]?.flash || "rgba(232, 174, 60, 0.85)",
    };
  }, [activeRank]);

  const selectRank = useCallback(
    (rank) => {
      const target = ranked.find((x) => x.rank === rank);
      if (!target) return;
      setMediaMode("photo");
      const targetTier = target.tier || tierForRank(rank);
      goToTier(targetTier, rank);
    },
    [ranked, goToTier]
  );

  const stepRank = useCallback(
    (dir) => {
      if (!active) return;
      const next = Math.min(Math.max(active.rank + dir, 1), ranked.length);
      if (next !== active.rank) selectRank(next);
    },
    [active, ranked.length, selectRank]
  );

  // Reset when award or category changes
  useEffect(() => {
    if (entries.length === 0) return;
    tierRef.current = "universe";
    setActiveTier("universe");
    setActiveRank(1);
    setMediaMode("photo");
    transRef.current = null;
    sceneRef.current = BUILDERS.universe(dimRef.current.W || window.innerWidth, dimRef.current.H || window.innerHeight);
  }, [award, category, entries]);

  const toggleSave = (slug, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const currentCatIndex = BOARD_CATEGORIES.indexOf(category);
  const hasPrevCat = currentCatIndex > 0;
  const hasNextCat = currentCatIndex < BOARD_CATEGORIES.length - 1;

  const stepCategory = (dir) => {
    const nextIndex = currentCatIndex + dir;
    if (nextIndex < 0 || nextIndex >= BOARD_CATEGORIES.length) return;
    const nextCat = BOARD_CATEGORIES[nextIndex];
    setCategory(nextCat);
    selectRank(1);
    if (catRailRef.current && catRailRef.current.children[nextIndex]) {
      catRailRef.current.children[nextIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  };

  // Drag-to-scroll handlers for Top Category Rail
  const onCatMouseDown = (e) => {
    if (!catRailRef.current) return;
    isCatDragging.current = true;
    setIsCatRailDragging(true);
    catStartX.current = e.pageX - catRailRef.current.offsetLeft;
    catScrollLeft.current = catRailRef.current.scrollLeft;
  };
  const onCatMouseMove = (e) => {
    if (!isCatDragging.current || !catRailRef.current) return;
    e.preventDefault();
    const x = e.pageX - catRailRef.current.offsetLeft;
    const walk = (x - catStartX.current) * 1.5;
    catRailRef.current.scrollLeft = catScrollLeft.current - walk;
  };
  const onCatMouseUpOrLeave = () => {
    isCatDragging.current = false;
    setIsCatRailDragging(false);
  };

  // Drag-to-scroll handlers for Bottom Leaderboard Strip
  const onTrayMouseDown = (e) => {
    if (!trayStripRef.current) return;
    isTrayDragging.current = true;
    setIsTrayStripDragging(true);
    trayStartX.current = e.pageX - trayStripRef.current.offsetLeft;
    trayScrollLeft.current = trayStripRef.current.scrollLeft;
  };
  const onTrayMouseMove = (e) => {
    if (!isTrayDragging.current || !trayStripRef.current) return;
    e.preventDefault();
    const x = e.pageX - trayStripRef.current.offsetLeft;
    const walk = (x - trayStartX.current) * 1.5;
    trayStripRef.current.scrollLeft = trayScrollLeft.current - walk;
  };
  const onTrayMouseUpOrLeave = () => {
    isTrayDragging.current = false;
    setIsTrayStripDragging(false);
  };

  const tierMeta = TIERS[activeTier] || TIERS.universe;
  const isSaved = active ? savedSlugs.has(active.property_slug) : false;
  const hasVideoReel = !!active?.walkthrough_url;

  return (
    <div className={`sc-stage-container ${mode}`} ref={stageRef}>
      <canvas ref={bgRef} className="sc-canvas-bg" />
      <canvas ref={warpRef} className="sc-canvas-warp" />

      {/* ── 1. TOP COMMAND GLASS HEADER ── */}
      <header className="sc-top-command-bar">
        {/* ROW 1: BRAND, DESKTOP AWARDS, & ORBIT RETURN */}
        <div className="sc-top-primary-row">
          <div className="sc-top-brand-block">
            <Link href="/" className="sc-brand-logo" aria-label="ScoutIT — home">
              <span className="brand-s">S</span>
              <span className="brand-scout">cout</span>
              <span className="brand-it">IT</span>
            </Link>
            <div className="sc-telemetry-chip">
              <span className="sc-pulse-dot" />
              <span className="sc-telemetry-text">
                <span className="sc-telemetry-full">Demand Rankings · </span>
                <span className="sc-telemetry-short">Rank </span>
                #{active ? String(active.rank).padStart(2, "0") : "01"}
              </span>
            </div>
          </div>

          <div className="sc-top-center-awards">
            <div className="sc-award-selector">
              {BOARD_AWARDS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`sc-award-pill ${award === a ? "is-active" : ""}`}
                  onClick={() => setAward(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="sc-top-actions">
            <Link
              href="/layer/orbit"
              className="sc-orbit-return-btn"
              aria-label="Back to Orbit"
              title="Back to Orbit"
            >
              <ChevronLeft size={14} aria-hidden="true" />
              <span>Back to Orbit</span>
            </Link>
          </div>
        </div>

        {/* MOBILE AWARDS STRIP (Visible only on mobile/tablet screens) */}
        <div className="sc-mobile-awards-row">
          <div className="sc-award-selector">
            {BOARD_AWARDS.map((a) => (
              <button
                key={a}
                type="button"
                className={`sc-award-pill ${award === a ? "is-active" : ""}`}
                onClick={() => setAward(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: DEDICATED DRAGGABLE & SWIPEABLE CATEGORY RAIL */}
        <div className="sc-category-row-wrapper">
          <button
            type="button"
            className="sc-rail-nav-btn sc-rail-nav-prev"
            onClick={() => stepCategory(-1)}
            disabled={!hasPrevCat}
            aria-label="Previous space category"
          >
            <ChevronLeft size={16} />
          </button>

          <nav
            ref={catRailRef}
            className={`sc-category-drag-track ${isCatRailDragging ? "is-dragging" : ""}`}
            onMouseDown={onCatMouseDown}
            onMouseMove={onCatMouseMove}
            onMouseUp={onCatMouseUpOrLeave}
            onMouseLeave={onCatMouseUpOrLeave}
            aria-label="Space Categories"
          >
            {BOARD_CATEGORIES.map((c, idx) => {
              const count = categoryCounts[c] || 0;
              const isActive = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  className={`sc-cat-pill ${isActive ? "is-active" : ""}`}
                  onClick={() => {
                    setCategory(c);
                    selectRank(1);
                    if (catRailRef.current && catRailRef.current.children[idx]) {
                      catRailRef.current.children[idx].scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "center",
                      });
                    }
                  }}
                >
                  <span className="sc-cat-label">{c === "All" ? "All Spaces" : c}</span>
                  <span className="sc-cat-count">{count}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            className="sc-rail-nav-btn sc-rail-nav-next"
            onClick={() => stepCategory(1)}
            disabled={!hasNextCat}
            aria-label="Next space category"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {/* ── 2. ARCHITECTURAL COMMAND STAGE ── */}
      {active ? (
        <main className="sc-command-stage">
          {/* CENTER STAGE: Widescreen Architectural Viewport */}
          <section className="sc-viewport-stage" style={{ "--glow-color": tierMeta.rgb }}>
            <div className="sc-viewport-glass">
              {mediaMode === "video" && hasVideoReel ? (
                <div className="sc-video-container">
                  <iframe
                    src={active.walkthrough_url}
                    title={`${active.name} Walkthrough`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div
                  className="sc-photo-container"
                  style={active.photo ? { backgroundImage: `url(${active.photo})` } : undefined}
                >
                  <div className="sc-photo-vignette" />
                  {!active.photo && (
                    <div className="sc-no-photo">
                      <Building2 size={40} className="text-white/70" />
                      <span>Verified Spatial Vault Asset</span>
                    </div>
                  )}
                </div>
              )}

              {/* Viewport Top Bezel */}
              <div className="sc-viewport-top-badge">
                <span className="sc-tier-indicator-dot" style={{ background: tierMeta.color }} />
                <span className="sc-viewport-tier-name" style={{ color: tierMeta.color }}>
                  {tierMeta.badge}
                </span>
                <span className="sc-viewport-divider">/</span>
                <span className="sc-viewport-month">Sample data &mdash; for human testing</span>
              </div>

              {/* Media Switcher for Top 3 */}
              {hasVideoReel && (
                <div className="sc-media-switcher">
                  <button
                    type="button"
                    className={`sc-switcher-pill ${mediaMode === "photo" ? "is-active" : ""}`}
                    onClick={() => setMediaMode("photo")}
                  >
                    <ImageIcon size={13} />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    className={`sc-switcher-pill ${mediaMode === "video" ? "is-active" : ""}`}
                    onClick={() => setMediaMode("video")}
                  >
                    <Play size={13} />
                    <span>4K Reel</span>
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* LEFT HUD: Demand Telemetry */}
          <section className="sc-hud-card sc-hud-left">
            <div>
              <div className="sc-tier-banner" style={{ borderColor: tierMeta.color, color: tierMeta.color }}>
                <Trophy size={13} />
                <span>#{String(active.rank).padStart(2, "0")} · {tierMeta.tag}</span>
              </div>

              <div className="sc-prop-identity">
                <span className="sc-prop-cat" style={{ color: tierMeta.color }}>{active.category}</span>
                <h1 className="sc-prop-name">{active.name}</h1>
                <p className="sc-prop-loc">{active.location || "Prime District, Philippines"}</p>
              </div>

              {/* Demand Velocity Gauge */}
              <div className="sc-velocity-panel">
                <div className="sc-velocity-header">
                  <span className="sc-velocity-label">Projected Inquiry Velocity</span>
                  <strong className="sc-velocity-val" style={{ color: tierMeta.color }}>
                    {active.rank === 1 ? "98.4%" : active.rank === 2 ? "94.1%" : active.rank === 3 ? "89.6%" : "82.0%"}
                  </strong>
                </div>
                <div className="sc-meter-track">
                  <div
                    className="sc-meter-fill"
                    style={{
                      width: active.rank === 1 ? "98.4%" : active.rank === 2 ? "94.1%" : active.rank === 3 ? "89.6%" : "82.0%",
                      background: tierMeta.color,
                    }}
                  />
                </div>

                <div className="sc-stat-grid">
                  <div className="sc-stat-cell">
                    <strong className="sc-stat-num">{active.inquiry_count}</strong>
                    <span className="sc-stat-lbl">Inquiries / mo (sample)</span>
                  </div>
                  <div className="sc-stat-cell">
                    <strong className="sc-stat-num">{active.saves || Math.round(active.inquiry_count * 1.8)}</strong>
                    <span className="sc-stat-lbl">Private saves (sample)</span>
                  </div>
                  <div className="sc-stat-cell">
                    <strong className="sc-stat-num">{active.views || active.inquiry_count * 8}</strong>
                    <span className="sc-stat-lbl">View signals (sample)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sc-hud-left-footer">
              <button
                type="button"
                onClick={(e) => toggleSave(active.property_slug, e)}
                className={`sc-save-board-btn ${isSaved ? "is-saved" : ""}`}
              >
                <Bookmark size={15} />
                <span>{isSaved ? "Saved to Board" : "Save to Board"}</span>
              </button>
            </div>
          </section>

          {/* RIGHT HUD: Showcase Distinctions & Merits */}
          <section className="sc-hud-card sc-hud-right">
            <div>
              <div className="sc-distinction-header">
                <div className="sc-distinction-badge-title">
                  <Sparkles size={14} style={{ color: tierMeta.color }} />
                  <span className="sc-distinction-title">Showcase Distinction</span>
                </div>
                <div className="sc-verified-tag">
                  <Award size={13} className="text-gold-accent" />
                  <span>Curated Merit</span>
                </div>
              </div>

              {/* Distinction Cards List */}
              <div className="sc-distinction-cards">
                <div className="sc-merit-card">
                  <div className="sc-merit-icon-wrap" style={{ color: tierMeta.color }}>
                    <Trophy size={14} />
                  </div>
                  <div className="sc-merit-content">
                    <span className="sc-merit-kicker">Demand Standing</span>
                    <p className="sc-merit-headline">
                      Ranked #{active.rank} in {active.category}
                    </p>
                    <span className="sc-merit-sub">Top Tier Space across Metro Manila</span>
                  </div>
                </div>

                <div className="sc-merit-card">
                  <div className="sc-merit-icon-wrap text-gold-accent">
                    <TrendingUp size={14} />
                  </div>
                  <div className="sc-merit-content">
                    <span className="sc-merit-kicker">Inquiry Momentum</span>
                    <p className="sc-merit-headline">
                      {active.inquiry_count} Inquiries / Month
                    </p>
                    <span className="sc-merit-sub">High organic market traction</span>
                  </div>
                </div>

                <div className="sc-merit-card">
                  <div className="sc-merit-icon-wrap" style={{ color: tierMeta.color }}>
                    <Award size={14} />
                  </div>
                  <div className="sc-merit-content">
                    <span className="sc-merit-kicker">Curation Standard</span>
                    <p className="sc-merit-headline">
                      Human-Curated Architectural Merits
                    </p>
                    <span className="sc-merit-sub">Illustrative evaluation for invited testing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="sc-hud-right-actions">
              <Link href={`/property/${active.property_slug}`} className="sc-primary-vault-btn">
                <span>Explore Full Briefing</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        </main>
      ) : (
        <div className="sc-empty-container">
          <Building2 size={36} className="text-white/70 mb-3" />
          <p>No properties found in this category.</p>
        </div>
      )}

      {/* ── 3. BOTTOM LEADERBOARD NAVIGATION TRAY ── */}
      <footer className="sc-bottom-tray">
        <div className="sc-tray-header">
          <div className="sc-tray-telemetry">
            <Flame size={14} className="text-gold-accent" />
            <span>Leaderboard · {active ? `${active.rank} of ${ranked.length} Ranked` : "0 Spaces"}</span>
          </div>

          <div className="sc-tray-nav-arrows">
            <button
              type="button"
              className="sc-arrow-btn"
              onClick={() => stepRank(-1)}
              disabled={!active || active.rank <= 1}
              aria-label="Previous property"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="sc-arrow-btn"
              onClick={() => stepRank(1)}
              disabled={!active || active.rank >= ranked.length}
              aria-label="Next property"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal Leaderboard Cards (Draggable & Swipeable) */}
        <div
          ref={trayStripRef}
          className={`sc-leaderboard-strip ${isTrayStripDragging ? "is-dragging" : ""}`}
          onMouseDown={onTrayMouseDown}
          onMouseMove={onTrayMouseMove}
          onMouseUp={onTrayMouseUpOrLeave}
          onMouseLeave={onTrayMouseUpOrLeave}
        >
          {ranked.map((item) => {
            const isCurrent = active && active.rank === item.rank;
            const theme = TIERS[item.tier] || TIERS.starry;
            return (
              <button
                key={item.property_slug || item.rank}
                type="button"
                className={`sc-tray-card ${isCurrent ? "is-selected" : ""}`}
                onClick={() => selectRank(item.rank)}
                style={{ "--item-color": theme.color }}
              >
                <div
                  className="sc-tray-thumb"
                  style={item.photo ? { backgroundImage: `url(${item.photo})` } : undefined}
                >
                  <span className="sc-tray-rank" style={{ borderColor: theme.color, color: theme.color }}>
                    #{String(item.rank).padStart(2, "0")}
                  </span>
                </div>
                <div className="sc-tray-info">
                  <span className="sc-tray-cat" style={{ color: theme.color }}>{item.category}</span>
                  <h4 className="sc-tray-name">{item.name}</h4>
                  <span className="sc-tray-inq">{item.inquiry_count} inq/mo</span>
                </div>
              </button>
            );
          })}
        </div>
      </footer>

      <style jsx>{`
        .sc-stage-container {
          position: relative;
          min-height: 100dvh;
          width: 100%;
          background: #000;
          display: flex;
          flex-direction: column;
          color: #f5f3ee;
          font-family: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          -webkit-tap-highlight-color: transparent;
        }

        @media (min-width: 1025px) {
          .sc-stage-container {
            position: fixed;
            inset: 0;
            height: 100dvh;
            overflow: hidden;
          }
        }

        .sc-canvas-bg, .sc-canvas-warp {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          display: block;
          z-index: 1;
          pointer-events: none;
        }
        .sc-canvas-warp {
          z-index: 2;
        }

        /* ── 1. TOP COMMAND BAR ── */
        .sc-top-command-bar {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: clamp(10px, 1.4vw, 14px) clamp(14px, 2.5vw, 28px);
          background: rgba(10, 10, 14, 0.94);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(24px);
          flex-shrink: 0;
        }

        /* Top Row (Brand, Award Selector, Action) */
        .sc-top-primary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .sc-top-brand-block {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        :global(.sc-brand-logo) {
          font-family: var(--font-display), var(--font-geist-sans), sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }
        :global(.sc-brand-logo .brand-scout) { color: #f5f3ee; }
        :global(.sc-brand-logo .brand-s),
        :global(.sc-brand-logo .brand-it) { color: var(--accent); }

        .sc-telemetry-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 11px;
          border-radius: 9999px;
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.3);
        }

        .sc-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
          animation: scPulse 2s infinite ease-in-out;
        }

        @keyframes scPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
        }

        .sc-telemetry-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--accent-bright);
          letter-spacing: 0.02em;
        }

        .sc-top-center-awards {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .sc-award-selector {
          display: inline-flex;
          gap: 4px;
          background: rgba(18, 18, 22, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 4px;
          border-radius: 9px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .sc-award-selector::-webkit-scrollbar { display: none; }

        .sc-award-pill {
          appearance: none;
          border: 0;
          background: transparent;
          color: #b5b3ad;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.01em;
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sc-award-pill:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.05);
        }

        .sc-award-pill.is-active {
          background: rgba(232, 174, 60, 0.18);
          color: var(--accent-bright);
          border: 1px solid rgba(232, 174, 60, 0.45);
          font-weight: 700;
        }

        .sc-top-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        :global(.sc-orbit-return-btn) {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 12px;
          font-weight: 600;
          color: #f5f3ee;
          text-decoration: none;
          transition: all 0.15s ease;
          min-height: 36px;
          flex-shrink: 0;
        }
        :global(.sc-orbit-return-btn:hover) {
          background: rgba(232, 174, 60, 0.16);
          border-color: var(--accent);
          color: var(--accent-bright);
        }

        /* ROW 2: DEDICATED DRAGGABLE & SWIPEABLE CATEGORY RAIL */
        .sc-category-row-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
        }

        .sc-rail-nav-btn {
          width: 32px;
          height: 36px;
          border-radius: 8px;
          background: rgba(20, 20, 26, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #d8d6cf;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .sc-rail-nav-btn:hover:not(:disabled) {
          color: var(--accent-bright);
          border-color: var(--accent);
          background: rgba(232, 174, 60, 0.18);
        }
        .sc-rail-nav-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .sc-category-drag-track {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding: 2px 2px;
          cursor: grab;
          user-select: none;
        }
        .sc-category-drag-track::-webkit-scrollbar { display: none; }
        .sc-category-drag-track.is-dragging {
          cursor: grabbing;
        }

        .sc-cat-pill {
          appearance: none;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(18, 18, 24, 0.85);
          color: #d8d6cf;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 9999px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
          transition: all 0.16s ease;
          min-height: 36px;
          flex-shrink: 0;
        }

        .sc-cat-count {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          padding: 2px 6px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.08);
          color: #b5b3ad;
        }

        .sc-cat-pill:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.28);
          background: rgba(28, 28, 36, 0.95);
        }

        .sc-cat-pill.is-active {
          background: var(--accent-bright);
          color: #0d0d0d;
          font-weight: 700;
          border-color: var(--accent-bright);
          box-shadow: 0 2px 12px rgba(232, 174, 60, 0.4);
        }
        .sc-cat-pill.is-active .sc-cat-count {
          background: rgba(0, 0, 0, 0.22);
          color: #0d0d0d;
        }

        /* ── 2. COMMAND STAGE ── */
        .sc-command-stage {
          position: relative;
          z-index: 5;
          flex: 1;
          display: grid;
          grid-template-columns: 310px minmax(0, 1fr) 310px;
          grid-template-areas: "left center right";
          gap: 20px;
          padding: 16px clamp(14px, 2.5vw, 28px) 14px;
          align-items: stretch;
          max-width: 1520px;
          margin: 0 auto;
          width: 100%;
        }

        .sc-hud-left { grid-area: left; }
        .sc-viewport-stage { grid-area: center; }
        .sc-hud-right { grid-area: right; }

        /* HUD CARDS */
        .sc-hud-card {
          background: rgba(13, 13, 17, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 22px;
          backdrop-filter: blur(20px);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Left HUD */
        .sc-tier-banner {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px;
          border-radius: 7px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          align-self: flex-start;
          margin-bottom: 14px;
        }

        .sc-prop-identity {
          margin-bottom: 16px;
        }

        .sc-prop-cat {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .sc-prop-name {
          font-family: var(--font-display), var(--font-geist-sans), sans-serif;
          font-size: clamp(22px, 2.2vw, 26px);
          font-weight: 600;
          line-height: 1.22;
          color: #ffffff;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .sc-prop-loc {
          font-size: 13.5px;
          color: #d8d6cf;
          line-height: 1.4;
          margin: 0;
          font-weight: 400;
        }

        .sc-velocity-panel {
          background: rgba(22, 22, 28, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .sc-velocity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .sc-velocity-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #d8d6cf;
        }

        .sc-velocity-val {
          font-family: var(--font-mono), monospace;
          font-size: 13.5px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .sc-meter-track {
          height: 5px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .sc-meter-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .sc-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sc-stat-cell {
          display: flex;
          flex-direction: column;
        }

        .sc-stat-num {
          font-family: var(--font-mono), monospace;
          font-size: 19px;
          font-weight: 700;
          color: #ffffff;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }

        .sc-stat-lbl {
          font-size: 12px;
          font-weight: 500;
          color: #a8a69f;
          margin-top: 3px;
          line-height: 1.3;
        }

        .sc-save-board-btn {
          width: 100%;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f3ee;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .sc-save-board-btn:hover {
          border-color: var(--accent);
          color: var(--accent-bright);
          background: rgba(232, 174, 60, 0.12);
        }

        .sc-save-board-btn.is-saved {
          background: var(--accent);
          color: #0d0d0d;
          border-color: var(--accent);
          font-weight: 700;
        }

        .sc-telemetry-short {
          display: none;
        }
        .sc-telemetry-full {
          display: inline;
        }

        /* ── CENTER WIDESCREEN VIEWPORT ── */
        .sc-viewport-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 0;
        }

        .sc-viewport-glass {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          background: #09090c;
          border: 1px solid rgba(255, 255, 255, 0.14);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(232, 174, 60, 0.08);
          aspect-ratio: 16 / 9;
          width: 100%;
          max-height: 68vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sc-photo-container {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.4s ease;
        }

        .sc-photo-vignette {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(10,10,14,0.92) 100%);
        }

        .sc-no-photo {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #a8a69f;
        }

        .sc-video-container {
          position: absolute;
          inset: 0;
          background: #000;
        }

        .sc-video-container iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }

        .sc-viewport-top-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          font-size: 12px;
          font-weight: 600;
        }

        .sc-tier-indicator-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .sc-viewport-divider {
          color: rgba(255, 255, 255, 0.35);
        }

        .sc-viewport-month {
          color: #a8a69f;
        }

        .sc-media-switcher {
          position: absolute;
          bottom: 14px;
          right: 14px;
          z-index: 4;
          display: inline-flex;
          gap: 6px;
          background: rgba(0, 0, 0, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 4px;
          border-radius: 9px;
          backdrop-filter: blur(10px);
        }

        .sc-switcher-pill {
          appearance: none;
          border: 0;
          background: transparent;
          color: #d8d6cf;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
          min-height: 32px;
        }

        .sc-switcher-pill:hover {
          color: #fff;
        }

        .sc-switcher-pill.is-active {
          background: var(--accent-bright);
          color: #0d0d0d;
          font-weight: 700;
        }

        /* ── RIGHT HUD: SHOWCASE DISTINCTIONS ── */
        .sc-distinction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .sc-distinction-badge-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sc-distinction-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #e5e2e1;
        }

        .sc-verified-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--accent-bright);
          font-weight: 600;
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.25);
          padding: 3px 8px;
          border-radius: 9999px;
        }

        .sc-distinction-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }

        .sc-merit-card {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(18, 18, 24, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 10px 12px;
          transition: all 0.15s ease;
        }

        .sc-merit-card:hover {
          border-color: rgba(232, 174, 60, 0.3);
          background: rgba(22, 22, 30, 0.85);
        }

        .sc-merit-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
          margin-top: 1px;
        }

        .sc-merit-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .sc-merit-kicker {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          color: #a8a69f;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sc-merit-headline {
          font-family: var(--font-display), var(--font-geist-sans), sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #f7f5f0;
          margin: 0;
          line-height: 1.35;
        }

        .sc-merit-sub {
          font-size: 12px;
          color: #8c8a82;
          line-height: 1.3;
        }

        .sc-hud-right-actions {
          margin-top: auto;
        }

        :global(.sc-primary-vault-btn) {
          width: 100%;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #f7c64e, #e8ae3c);
          color: #0d0d0d;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(232, 174, 60, 0.35);
          transition: all 0.18s cubic-bezier(0.23, 1, 0.32, 1);
        }
        :global(.sc-primary-vault-btn:hover) {
          background: linear-gradient(135deg, #ffe082, #f7c64e);
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(232, 174, 60, 0.45);
        }

        /* ── 3. BOTTOM LEADERBOARD TRAY ── */
        .sc-bottom-tray {
          position: relative;
          z-index: 10;
          background: rgba(10, 10, 14, 0.94);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 8px clamp(14px, 2.5vw, 28px) clamp(10px, 2vw, 14px);
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        .sc-tray-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sc-tray-telemetry {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 600;
          color: #d8d6cf;
        }

        .sc-tray-nav-arrows {
          display: flex;
          gap: 6px;
        }

        .sc-arrow-btn {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #e5e2e1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sc-arrow-btn:hover:not(:disabled) {
          background: rgba(232, 174, 60, 0.18);
          border-color: var(--accent);
          color: var(--accent-bright);
        }

        .sc-arrow-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }

        .sc-leaderboard-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 2px;
          cursor: grab;
          user-select: none;
        }
        .sc-leaderboard-strip::-webkit-scrollbar { display: none; }
        .sc-leaderboard-strip.is-dragging {
          cursor: grabbing;
        }

        .sc-tray-card {
          flex: 0 0 auto;
          width: 190px;
          background: rgba(18, 18, 24, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          padding: 6px 9px;
          text-align: left;
          cursor: pointer;
          display: flex;
          gap: 9px;
          align-items: center;
          transition: all 0.16s ease;
          min-height: 52px;
        }

        .sc-tray-card:hover {
          border-color: var(--item-color, var(--accent));
          background: rgba(26, 26, 34, 0.95);
          transform: translateY(-1px);
        }

        .sc-tray-card.is-selected {
          border-color: var(--item-color, var(--accent-bright));
          background: rgba(30, 30, 40, 0.98);
          box-shadow: 0 0 14px rgba(232, 174, 60, 0.3);
        }

        .sc-tray-thumb {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 6px;
          background: #141416;
          background-size: cover;
          background-position: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .sc-tray-rank {
          position: absolute;
          top: 2px;
          left: 2px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.88);
          border: 1px solid;
          padding: 1px 3px;
          border-radius: 3px;
          line-height: 1;
        }

        .sc-tray-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .sc-tray-cat {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sc-tray-name {
          font-family: var(--font-display), var(--font-geist-sans), sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #f7f5f0;
          margin: 1px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sc-tray-inq {
          font-size: 12px;
          color: #a8a69f;
        }

        .sc-empty-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 5;
          color: var(--text-secondary);
        }

        /* Default desktop state for mobile awards row */
        .sc-mobile-awards-row {
          display: none;
        }

        /* ── RESPONSIVE BREAKPOINTS ── */
        @media (max-width: 1024px) {
          .sc-command-stage {
            grid-template-columns: 1fr 1fr;
            grid-template-areas:
              "center center"
              "left right";
            padding-bottom: 20px;
          }
          .sc-viewport-glass {
            min-height: 300px;
            max-height: 380px;
          }
        }

        @media (max-width: 900px) {
          .sc-top-command-bar {
            padding: 8px 12px;
            gap: 6px;
          }
          .sc-top-primary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            gap: 8px;
          }
          .sc-top-center-awards {
            display: none;
          }
          .sc-mobile-awards-row {
            display: flex;
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding: 1px 0;
          }
          .sc-mobile-awards-row::-webkit-scrollbar { display: none; }
          .sc-mobile-awards-row .sc-award-selector {
            width: auto;
            min-width: 100%;
            display: flex;
            gap: 6px;
            padding: 3px 4px;
          }
          .sc-mobile-awards-row .sc-award-pill {
            font-size: 12px;
            padding: 5px 13px;
            flex-shrink: 0;
            white-space: nowrap;
          }
          .sc-top-brand-block {
            gap: 8px;
          }
          :global(.sc-brand-logo) {
            font-size: 19px;
          }
          .sc-telemetry-chip {
            padding: 4px 9px;
            gap: 5px;
          }
          .sc-telemetry-text {
            font-size: 12px;
          }
          :global(.sc-orbit-return-btn) {
            padding: 5px 11px;
            font-size: 12px;
            min-height: 32px;
            gap: 5px;
          }

          /* Hide desktop chevrons on mobile/tablet so the swipe track has full width */
          .sc-rail-nav-btn {
            display: none;
          }
          .sc-category-row-wrapper {
            gap: 0;
          }
          .sc-category-drag-track {
            padding: 1px 0;
            gap: 6px;
          }
          .sc-cat-pill {
            font-size: 12px;
            padding: 5px 12px;
            min-height: 32px;
            gap: 6px;
          }
          .sc-cat-count {
            font-size: 12px;
            padding: 1px 5px;
          }
        }

        @media (max-width: 600px) {
          .sc-telemetry-full {
            display: none;
          }
          .sc-telemetry-short {
            display: inline;
          }
        }

        @media (max-width: 768px) {
          .sc-stage-container {
            padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          }
          .sc-command-stage {
            grid-template-columns: 1fr;
            grid-template-areas:
              "center"
              "left"
              "right";
            gap: 12px;
            padding: 10px 12px 14px;
          }
          .sc-viewport-glass {
            min-height: 200px;
            max-height: 240px;
            border-radius: 14px;
          }
          .sc-hud-card {
            padding: 14px 14px;
            border-radius: 14px;
            gap: 12px;
          }
          .sc-distinction-cards {
            gap: 8px;
            margin-bottom: 12px;
          }
          .sc-merit-card {
            padding: 8px 10px;
            gap: 8px;
          }
          .sc-merit-headline {
            font-size: 12px;
          }
          .sc-bottom-tray {
            position: relative;
            z-index: 20;
            margin: 6px 12px calc(80px + env(safe-area-inset-bottom, 0px)) 12px;
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
}

