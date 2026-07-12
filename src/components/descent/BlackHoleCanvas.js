"use client";

import { useEffect, useRef, useState } from "react";
import { isLiteMode, LITE_MODE_EVENT } from "@/lib/liteMode";

// ═══════════════════════════════════════════════════════════════
// Hero black hole — Interactive Mode. Raymarched WebGL (source: owner's
// Dump/Blackhole spec, "Golden Horizon", plus the richer AI Studio build:
// photon ring w/ chromatic split, film grain, mouse-hover gravitational
// lensing, click shockwaves, drag-to-orbit). Reserved for the unlockable
// full experience — Balance mode (EventHorizonCanvas) is what everyone
// else sees; this is heavier and meant to be.
//
// Site conventions honored:
//  - Lite Mode: never initializes, and tears down live on the toggle event
//  - Pauses when scrolled off-screen or the tab is hidden
//  - prefers-reduced-motion: renders ONE static frame, no animation loop
//  - DPR capped (1 on phones, 1.5 desktop) — this is a per-pixel raymarch,
//    resolution is the entire perf budget
//  - No WebGL → renders nothing; the CSS horizon glow behind it remains
// ═══════════════════════════════════════════════════════════════

// Single source of truth for the slider panel's defaults/ranges.
export const DEFAULT_PARAMS = {
  brightness: 1.1,
  lensingStrength: 0.28,
  spinSpeed: 0.8,
  beamingStrength: 0.45,
  diskInner: 0.22,
  diskOuter: 0.70,
  noiseFreq: 1.0,
  starfieldDensity: 0.85,
  colorShift: 0, // 0=Sovereign Gold, 1=Rose Gold, 2=Copper, 3=Platinum, 4=Dark Amber
  mouseLensStrength: 1.0, // 0 = interactive cursor warp off, 2 = strongest (distinct from lensingStrength, which bends the base raymarch)
};

export const COLOR_PALETTE_NAMES = [
  "Sovereign Gold",
  "Stellar Rose Gold",
  "Cosmic Copper",
  "Supernova Platinum",
  "Dark Amber Dust",
];

const VS = `
  attribute vec2 position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Tuning constants baked from the owner's spec: horizon 0.16, disk 0.22–0.70,
// lensing 0.28, spin 0.8, beaming 0.45, brightness 1.1, pitch 0.12, stars 0.6.
// Most of those are now uniforms (slider-controlled in Interactive mode)
// instead of literals. Horizon radius and the camera/composition constants
// stay fixed so the hero text stays framed no matter what the sliders do.
const FS = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_pitch;
  uniform float u_yaw;

  uniform float u_brightness;
  uniform float u_lensing;
  uniform float u_spinSpeed;
  uniform float u_beaming;
  uniform float u_diskInner;
  uniform float u_diskOuter;
  uniform float u_noiseFreq;
  uniform float u_starfield;
  uniform float u_colorShift;

  uniform vec2 u_mouse;
  uniform float u_mouseHover;
  uniform float u_mouseLensStrength;
  uniform vec2 u_clickPos;
  uniform float u_clickProgress;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(p+vec3(0,0,0)), hash(p+vec3(1,0,0)), f.x),
                   mix(hash(p+vec3(0,1,0)), hash(p+vec3(1,1,0)), f.x), f.y),
               mix(mix(hash(p+vec3(0,0,1)), hash(p+vec3(1,0,1)), f.x),
                   mix(hash(p+vec3(0,1,1)), hash(p+vec3(1,1,1)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = p * 2.02;
    f += 0.2500 * noise(p); p = p * 2.03;
    f += 0.1250 * noise(p); p = p * 2.01;
    f += 0.0625 * noise(p);
    return f / 0.9375;
  }

  // 5 luxury gold-family palettes, selected by u_colorShift (0-4).
  vec3 palette(float d, float shift) {
    if (shift < 0.5) return mix(vec3(0.96, 0.72, 0.18), vec3(1.0, 0.94, 0.68), d);
    else if (shift < 1.5) return mix(vec3(0.92, 0.52, 0.44), vec3(0.99, 0.82, 0.76), d);
    else if (shift < 2.5) return mix(vec3(0.86, 0.36, 0.10), vec3(0.99, 0.64, 0.28), d);
    else if (shift < 3.5) return mix(vec3(0.65, 0.74, 0.85), vec3(0.96, 0.98, 1.00), d);
    else return mix(vec3(0.65, 0.30, 0.01), vec3(0.94, 0.58, 0.10), d);
  }

  void main() {
    vec2 uv = (v_texCoord * 2.0 - 1.0);
    uv.x *= u_resolution.x / u_resolution.y;

    // INTERACTIVE MOUSE GRAVITATIONAL LENSING — warps space under the
    // cursor like a micro gravity well. Toggleable (side option in the
    // interactive panel); purely a screen-space warp, doesn't touch the
    // real raymarch bending below.
    if (u_mouseLensStrength > 0.01 && u_mouseHover > 0.01) {
      vec2 dMouse = uv - u_mouse;
      float distMouse = length(dMouse);
      if (distMouse > 0.002 && distMouse < 0.8) {
        float localWarp = 0.05 * u_mouseLensStrength * u_mouseHover * (1.0 - smoothstep(0.002, 0.8, distMouse)) / (distMouse + 0.08);
        uv -= normalize(dMouse) * localWarp;
      }
    }

    // Click shockwave ripple
    if (u_clickProgress > 0.01) {
      vec2 dClick = uv - u_clickPos;
      float distClick = length(dClick);
      float waveRadius = u_clickProgress * 1.6;
      float waveThickness = 0.12;
      float waveDist = abs(distClick - waveRadius);
      if (waveDist < waveThickness) {
        float waveIntensity = (1.0 - waveDist / waveThickness) * (1.0 - u_clickProgress);
        float waveWarp = sin(waveDist * 32.0 - u_time * 12.0) * 0.04 * waveIntensity;
        uv -= normalize(dClick) * waveWarp;
      }
    }

    // Composition: place the hole above screen center so the ring frames the
    // UFO + wordmark block, leaving the taglines/CTAs on near-black below.
    uv.y -= 0.20;

    float cosP = cos(u_pitch); float sinP = sin(u_pitch);
    float cosY = cos(u_yaw); float sinY = sin(u_yaw);

    // Camera pulled back from the spec's 3.8 to 5.0 — smaller ring, room for
    // the hero content around it.
    vec3 ro = vec3(0.0, 5.0 * sinP, -5.0 * cosP);
    vec3 temp_ro = ro;
    ro.x = temp_ro.x * cosY - temp_ro.z * sinY;
    ro.z = temp_ro.x * sinY + temp_ro.z * cosY;

    vec3 forward = normalize(-ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    vec3 rd = normalize(uv.x * right + uv.y * up + 2.2 * forward);

    vec3 rp = ro;
    vec3 rd0 = rd; // initial ray direction — used to reject wrap-around ghosts
    float stepSize = 0.075;
    vec3 accColor = vec3(0.0);
    float accAlpha = 0.0;
    bool hitHorizon = false;
    float minR = 999.0;

    // 96 steps (spec had 48): the camera sits farther back and the longer
    // march lets rays wrap the horizon, which renders the lensed halo.
    for (int i = 0; i < 96; i++) {
      float r2 = dot(rp, rp);
      float r = sqrt(r2);
      minR = min(minR, r);
      if (r < 0.1600) { hitHorizon = true; break; }

      vec3 next_rp = rp + rd * stepSize;
      if (rp.y * next_rp.y < 0.0) {
        float t = -rp.y / (next_rp.y - rp.y + 1e-6);
        vec3 ip = rp + (next_rp.y - rp.y) * t * rd;
        float d = length(ip.xz);

        // distance(ip, ro) guard: real disk hits are ~4+ units away with the
        // camera at 5.0; anything closer is a near-camera artifact that
        // smears pale streaks across the frame edges.
        if (d > u_diskInner && d < u_diskOuter && distance(ip, ro) > 2.0) {
          float angle = atan(ip.z, ip.x);
          float spinAngle = angle - u_time * u_spinSpeed;
          vec3 noiseCoord = vec3(d * 2.2, spinAngle * 3.2, cos(u_time) * 0.35);
          vec3 noiseCoord2 = vec3(d * 1.5, spinAngle * 1.8, sin(u_time) * 0.35);
          float n = fbm(noiseCoord * u_noiseFreq) * 0.6 + fbm(noiseCoord2 * u_noiseFreq * 0.5) * 0.4;

          vec3 tangent = vec3(-sin(angle), 0.0, cos(angle));
          float beaming = 1.0 + u_beaming * dot(tangent, -rd);
          beaming = max(0.08, beaming);

          float edgeClip = smoothstep(u_diskInner, u_diskInner + 0.03, d) *
                           smoothstep(u_diskOuter, u_diskOuter - 0.12, d);

          float intensity = edgeClip * (0.28 + n * 0.72) * beaming;
          vec3 diskColor = palette((d - u_diskInner) / (u_diskOuter - u_diskInner), u_colorShift);

          // Rays that have wrapped the horizon (bent far from their original
          // direction) paint aliased ghost copies of the disk across the
          // frame — fade them out; the primary disk + lensed halo stay.
          float fwd = smoothstep(0.45, 0.85, dot(rd, rd0));

          // 1.43 = the spec's brightness (1.1) x its embed bloom gain (1.3),
          // folded in here since the raw shader has no bloom pass.
          float alpha = intensity * 0.45 * 1.4300 * fwd * u_brightness;
          accColor += (1.0 - accAlpha) * diskColor * alpha;
          accAlpha += (1.0 - accAlpha) * alpha;
          if (accAlpha > 0.98) { accAlpha = 1.0; break; }
        }
      }

      vec3 gravityForce = (-rp / r) * (u_lensing / (r2 + 0.001)) * stepSize;
      rd = normalize(rd + gravityForce);
      rp = next_rp;
    }

    vec3 finalColor = vec3(0.0);
    if (hitHorizon) {
      finalColor = accColor;
    } else {
      float starVal = noise(rd * 14.0);
      vec3 stars = vec3(0.0);
      if (starVal > 0.82 && u_starfield > 0.02) {
        stars = vec3(1.0, 0.92, 0.78) * smoothstep(0.82, 0.97, starVal) * u_starfield * 2.0;
        // Only show stars on rays that stayed nearly straight — lensed rays
        // sample the star noise as big smeared white arcs around the hole.
        stars *= smoothstep(0.85, 0.97, dot(rd, rd0));
      }
      vec3 nebulaGlow = palette(0.5, u_colorShift) * 0.035 * u_brightness;

      // PHOTON RING — a thin, chromatically-split ring at the closest
      // approach of the ray to the horizon (relativistic light-bending edge).
      float ringR = smoothstep(0.10, 0.01, minR * 0.985 - 0.16);
      float ringG = smoothstep(0.10, 0.01, minR - 0.16);
      float ringB = smoothstep(0.10, 0.01, minR * 1.015 - 0.16);
      vec3 ringBase = mix(palette(0.15, u_colorShift), vec3(1.0, 0.97, 0.90), 0.7);
      vec3 photonRing = vec3(ringBase.r * ringR, ringBase.g * ringG, ringBase.b * ringB) * (1.8 * u_brightness);

      finalColor = accColor + (1.0 - accAlpha) * (photonRing + stars + nebulaGlow);
    }

    // Tighter vignette than the spec (2.5 → 2.1): fades out the near-camera
    // disk-crossing artifacts that show up as pale wedges at the frame edges.
    finalColor *= smoothstep(2.1, 0.35, dot(uv, uv));

    // Cinematic film grain
    float grainNoise = fract(sin(dot(uv * (u_time + 1.2), vec2(12.9898, 78.233))) * 43758.5453);
    finalColor += vec3(grainNoise - 0.5) * 0.018;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function BlackHoleCanvas({ params: paramsProp, onSnapshotReady } = {}) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const paramsRef = useRef({ ...DEFAULT_PARAMS, ...paramsProp });

  // Keep the latest params in a ref so the render loop (which doesn't
  // re-subscribe every frame) always reads the current slider values.
  useEffect(() => {
    paramsRef.current = { ...DEFAULT_PARAMS, ...paramsProp };
  }, [paramsProp]);

  useEffect(() => {
    if (isLiteMode()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return; // no WebGL — the CSS horizon glow stays as the scene

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[BlackHole] shader compile failed:", gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[BlackHole] program link failed:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const u = (name) => gl.getUniformLocation(program, name);
    const uResolution = u("u_resolution");
    const uTime = u("u_time");
    const uPitch = u("u_pitch");
    const uYaw = u("u_yaw");
    const uBrightness = u("u_brightness");
    const uLensing = u("u_lensing");
    const uSpinSpeed = u("u_spinSpeed");
    const uBeaming = u("u_beaming");
    const uDiskInner = u("u_diskInner");
    const uDiskOuter = u("u_diskOuter");
    const uNoiseFreq = u("u_noiseFreq");
    const uStarfield = u("u_starfield");
    const uColorShift = u("u_colorShift");
    const uMouse = u("u_mouse");
    const uMouseHover = u("u_mouseHover");
    const uMouseLensStrength = u("u_mouseLensStrength");
    const uClickPos = u("u_clickPos");
    const uClickProgress = u("u_clickProgress");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Raymarch cost scales with pixel count — phones render at 1x.
      const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 768 ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    // Pointer parallax — the camera leans a few degrees toward the cursor
    // when idle. Dragging overrides this with direct orbit control, then
    // springs back to the scripted lean/breathing once released so the
    // composition (ring framing the wordmark) never drifts away for good.
    let targetYaw = 0;
    let yaw = 0;
    let dragYawOffset = 0;
    let dragPitchOffset = 0;
    let isDragging = false;
    let lastPointer = { x: 0, y: 0 };

    const toLocalUv = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      const aspect = rect.width / rect.height;
      return { x: nx * aspect, y: ny };
    };

    const mouse = { x: 0, y: 0, hover: false };
    const easedHover = { v: 0 };
    const click = { x: 0, y: 0, progress: 0 };

    const onPointerMove = (e) => {
      const { x, y } = toLocalUv(e.clientX, e.clientY);
      mouse.x = x; mouse.y = y; mouse.hover = true;
      targetYaw = x * 0.06;
      if (isDragging) {
        const dx = e.clientX - lastPointer.x;
        const dy = e.clientY - lastPointer.y;
        lastPointer = { x: e.clientX, y: e.clientY };
        dragYawOffset += dx * 0.004;
        dragPitchOffset = Math.max(-0.5, Math.min(0.5, dragPitchOffset - dy * 0.004));
      }
    };
    const onPointerLeave = () => { mouse.hover = false; isDragging = false; };
    const onPointerDown = (e) => {
      isDragging = true;
      lastPointer = { x: e.clientX, y: e.clientY };
      const { x, y } = toLocalUv(e.clientX, e.clientY);
      click.x = x; click.y = y; click.progress = 0.01;
    };
    const onPointerUp = () => { isDragging = false; };

    let t = 0;
    let raf = 0;
    const drawFrame = () => {
      const p = paramsRef.current;
      // Loop clock stays constant — spin speed itself is a shader uniform
      // (u_spinSpeed), so it doesn't need to scale the clock too.
      t += 0.009;
      if (t >= 2.0 * Math.PI) t -= 2.0 * Math.PI;
      yaw += (targetYaw - yaw) * 0.03;
      // Drag offsets spring back toward 0 when the pointer isn't down, so
      // the camera always returns to the scripted composition.
      if (!isDragging) {
        dragYawOffset *= 0.93;
        dragPitchOffset *= 0.93;
      }
      // Breathing camera — slow pitch sway. Base pitch is raised from the
      // spec's near-edge-on 0.12 to 0.42 so the full lensed disk reads as
      // the classic ring instead of a thin sliver.
      const pitch = 0.42 + 0.02 * Math.sin(t * 0.35) + dragPitchOffset;

      easedHover.v += ((mouse.hover ? 1 : 0) - easedHover.v) * 0.08;
      if (click.progress > 0) {
        click.progress += 0.028;
        if (click.progress > 1) click.progress = 0;
      }

      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uPitch, pitch);
      gl.uniform1f(uYaw, yaw + dragYawOffset);
      gl.uniform1f(uBrightness, p.brightness);
      gl.uniform1f(uLensing, p.lensingStrength);
      gl.uniform1f(uSpinSpeed, p.spinSpeed);
      gl.uniform1f(uBeaming, p.beamingStrength);
      gl.uniform1f(uDiskInner, p.diskInner);
      gl.uniform1f(uDiskOuter, p.diskOuter);
      gl.uniform1f(uNoiseFreq, p.noiseFreq);
      gl.uniform1f(uStarfield, p.starfieldDensity);
      gl.uniform1f(uColorShift, p.colorShift);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseHover, easedHover.v);
      gl.uniform1f(uMouseLensStrength, p.mouseLensStrength);
      gl.uniform2f(uClickPos, click.x, click.y);
      gl.uniform1f(uClickProgress, click.progress);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let running = false;
    let visible = true;
    let killed = false;
    const loop = () => {
      drawFrame();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || killed || reducedMotion) return;
      running = true;
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
    window.addEventListener("resize", resize);
    if (!reducedMotion) {
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointerleave", onPointerLeave);
    }

    resize();
    drawFrame(); // paint one frame immediately — also the only frame under reduced motion
    setRevealed(true);
    start();
    if (onSnapshotReady) onSnapshotReady(() => canvas.toDataURL("image/png"));

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(LITE_MODE_EVENT, onLiteToggle);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      // Deliberately NOT calling WEBGL_lose_context here. React Strict Mode
      // (on by default in Next dev) double-invokes this effect — mount,
      // cleanup, mount again — and force-losing the context on that first
      // cleanup leaves the second mount's getContext('webgl') call
      // permanently dead (Chrome then paints the canvas solid white).
      // Deleting the program/shaders/buffer below is sufficient GPU cleanup
      // without poisoning the canvas for the remount that follows.
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [onSnapshotReady]);

  return (
    <canvas
      ref={canvasRef}
      className="event-horizon-canvas"
      aria-hidden="true"
      style={{
        opacity: revealed ? 1 : 0,
        transition: "opacity 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
        cursor: "grab",
        touchAction: "pan-y",
        // The shared .event-horizon-canvas class sets pointer-events: none
        // (so the decorative Balance-mode canvas never steals clicks from
        // buttons on top of it). Interactive mode needs the opposite —
        // override it here, scoped to just this canvas, so hover lensing,
        // click shockwaves, and drag-to-orbit can actually receive input.
        pointerEvents: "auto",
      }}
    />
  );
}
