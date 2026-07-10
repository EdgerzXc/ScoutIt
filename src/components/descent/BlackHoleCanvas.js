"use client";

import { useEffect, useRef, useState } from "react";
import { isLiteMode, LITE_MODE_EVENT } from "@/lib/liteMode";

// ═══════════════════════════════════════════════════════════════
// Hero black hole — raymarched WebGL (source: owner's Dump/Blackhole spec,
// "Golden Horizon"). A gravitationally-lensed accretion disk in the site's
// gold family, replacing the old 2D star-pull canvas.
//
// Site conventions honored:
//  - Lite Mode: never initializes, and tears down live on the toggle event
//  - Pauses when scrolled off-screen or the tab is hidden (same rule the old
//    hero canvas followed)
//  - prefers-reduced-motion: renders ONE static frame, no animation loop
//  - DPR capped (1 on phones, 1.5 desktop) — this is a per-pixel raymarch,
//    resolution is the entire perf budget
//  - No WebGL → renders nothing; the CSS horizon glow behind it remains
// ═══════════════════════════════════════════════════════════════

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
// u_pitch/u_yaw are uniforms (instead of the spec's fixed literals) so the
// camera can breathe and follow the pointer — the cinematic layer.
const FS = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_pitch;
  uniform float u_yaw;

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

  vec3 goldRamp(float d) {
    return mix(vec3(0.96, 0.72, 0.18), vec3(1.0, 0.94, 0.68), d);
  }

  void main() {
    vec2 uv = (v_texCoord * 2.0 - 1.0);
    uv.x *= u_resolution.x / u_resolution.y;
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

    // 96 steps (spec had 48): the camera sits farther back and the longer
    // march lets rays wrap the horizon, which renders the lensed halo.
    for (int i = 0; i < 96; i++) {
      float r2 = dot(rp, rp);
      float r = sqrt(r2);
      if (r < 0.1600) { hitHorizon = true; break; }

      vec3 next_rp = rp + rd * stepSize;
      if (rp.y * next_rp.y < 0.0) {
        float t = -rp.y / (next_rp.y - rp.y + 1e-6);
        vec3 ip = rp + (next_rp.y - rp.y) * t * rd;
        float d = length(ip.xz);

        // distance(ip, ro) guard: real disk hits are ~4+ units away with the
        // camera at 5.0; anything closer is a near-camera artifact that
        // smears pale streaks across the frame edges.
        if (d > 0.2200 && d < 0.7000 && distance(ip, ro) > 2.0) {
          float angle = atan(ip.z, ip.x);
          float spinAngle = angle - u_time * 0.8000;
          vec3 noiseCoord = vec3(d * 2.2, spinAngle * 3.2, cos(u_time) * 0.35);
          vec3 noiseCoord2 = vec3(d * 1.5, spinAngle * 1.8, sin(u_time) * 0.35);
          float n = fbm(noiseCoord) * 0.6 + fbm(noiseCoord2 * 0.5) * 0.4;

          vec3 tangent = vec3(-sin(angle), 0.0, cos(angle));
          float beaming = 1.0 + 0.4500 * dot(tangent, -rd);
          beaming = max(0.08, beaming);

          float edgeClip = smoothstep(0.2200, 0.2500, d) *
                           smoothstep(0.7000, 0.5800, d);

          float intensity = edgeClip * (0.28 + n * 0.72) * beaming;
          vec3 diskColor = goldRamp((d - 0.2200) / 0.4800);

          // Rays that have wrapped the horizon (bent far from their original
          // direction) paint aliased ghost copies of the disk across the
          // frame — fade them out; the primary disk + lensed halo stay.
          float fwd = smoothstep(0.45, 0.85, dot(rd, rd0));

          // 1.43 = the spec's brightness (1.1) x its embed bloom gain (1.3),
          // folded in here since the raw shader has no bloom pass.
          float alpha = intensity * 0.45 * 1.4300 * fwd;
          accColor += (1.0 - accAlpha) * diskColor * alpha;
          accAlpha += (1.0 - accAlpha) * alpha;
          if (accAlpha > 0.98) { accAlpha = 1.0; break; }
        }
      }

      vec3 gravityForce = (-rp / r) * (0.2800 / (r2 + 0.001)) * stepSize;
      rd = normalize(rd + gravityForce);
      rp = next_rp;
    }

    vec3 finalColor = vec3(0.0);
    if (hitHorizon) {
      finalColor = accColor;
    } else {
      float starVal = noise(rd * 14.0);
      vec3 stars = vec3(0.0);
      if (starVal > 0.88) {
        stars = vec3(1.0, 0.92, 0.78) * smoothstep(0.88, 0.98, starVal) * 0.6000 * 1.8;
        // Only show stars on rays that stayed nearly straight — lensed rays
        // sample the star noise as big smeared white arcs around the hole.
        stars *= smoothstep(0.93, 0.985, dot(rd, rd0));
      }
      vec3 nebulaGlow = goldRamp(0.5) * 0.035 * 1.1000;
      finalColor = accColor + (1.0 - accAlpha) * (stars + nebulaGlow);
    }
    // Tighter vignette than the spec (2.5 → 2.1): fades out the near-camera
    // disk-crossing artifacts that show up as pale wedges at the frame edges.
    gl_FragColor = vec4(finalColor * smoothstep(2.1, 0.35, dot(uv, uv)), 1.0);
  }
`;

export default function BlackHoleCanvas() {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

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

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uPitch = gl.getUniformLocation(program, "u_pitch");
    const uYaw = gl.getUniformLocation(program, "u_yaw");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // Raymarch cost scales with pixel count — phones render at 1x.
      const dpr = Math.min(window.devicePixelRatio || 1, rect.width < 768 ? 1 : 1.5);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    // Pointer parallax — the camera leans a few degrees toward the cursor.
    // Eased every frame so it feels like mass, not a mouse-follower.
    let targetYaw = 0;
    let yaw = 0;
    const onPointer = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      targetYaw = nx * 0.06;
    };

    let t = 0;
    let raf = 0;
    const drawFrame = () => {
      t += 0.009;
      if (t >= 2.0 * Math.PI) t -= 2.0 * Math.PI; // seamless loop
      yaw += (targetYaw - yaw) * 0.03;
      // Breathing camera — slow pitch sway. Base pitch is raised from the
      // spec's near-edge-on 0.12 to 0.42 so the full lensed disk reads as
      // the classic ring instead of a thin sliver.
      const pitch = 0.42 + 0.02 * Math.sin(t * 0.35);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1f(uPitch, pitch);
      gl.uniform1f(uYaw, yaw);
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
    if (!reducedMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    resize();
    drawFrame(); // paint one frame immediately — also the only frame under reduced motion
    setRevealed(true);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(LITE_MODE_EVENT, onLiteToggle);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="event-horizon-canvas"
      aria-hidden="true"
      style={{
        opacity: revealed ? 1 : 0,
        transition: "opacity 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    />
  );
}
