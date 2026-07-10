"use client";

import { useEffect, useRef, useState } from "react";
import { isLiteMode, LITE_MODE_EVENT } from "@/lib/liteMode";

// ═══════════════════════════════════════════════════════════════
// Golden Horizon V3.1 — Interactive Mode's black hole. Exact port of the
// owner's "Golden Horizon: Black Hole Loop Generator" (AI Studio export,
// Apache-2.0): volumetric accretion disk, infalling spiral lanes, ambient
// gold haze corona, chromatically-split photon ring, colored starfield,
// anamorphic flares, film grain. Fully interactive — drag to orbit in 3D
// with momentum + auto-spin drift, click for spacetime shockwave ripples,
// hover for micro gravity-well lensing, hold to dolly-zoom the camera.
// Only ever mounted when Interactive Mode is unlocked (5-click UFO).
//
// Site conventions honored:
//  - Lite Mode: never initializes, tears down live on the toggle event
//  - Pauses when scrolled off-screen or the tab is hidden
//  - prefers-reduced-motion: renders ONE static frame, no loop/interaction
//  - Cleanup deletes GL resources but does NOT force-lose the context —
//    Strict Mode's dev double-mount reuses the same canvas, and a killed
//    context makes every shader compile fail on the remount.
// ═══════════════════════════════════════════════════════════════

export const GOLDEN_PALETTE_NAMES = [
  "Sovereign Gold",
  "Stellar Rose Gold",
  "Cosmic Copper",
  "Supernova Platinum",
  "Dark Amber Dust",
];

// The generator's five curated presets, copied 1:1 from its utils.ts.
export const GOLDEN_PRESETS = [
  {
    id: "gargantua-gold",
    name: "Gargantua Gold",
    description: "Classic deep-space warping with a massive, highly symmetrical golden corona.",
    params: {
      horizonRadius: 0.16, diskInner: 0.22, diskOuter: 0.7, lensingStrength: 0.28,
      spinSpeed: 0.8, beamingStrength: 0.45, brightness: 1.1, bloomIntensity: 1.3,
      colorShift: 0, noiseFreq: 1.0, pitch: 0.12, yaw: 0.0, starfieldDensity: 0.6,
    },
  },
  {
    id: "singularity-prime",
    name: "Singularity Prime",
    description: "A sharp, ultra-dense black core bounded by a razor-thin, brilliant amber ring.",
    params: {
      horizonRadius: 0.12, diskInner: 0.15, diskOuter: 0.35, lensingStrength: 0.12,
      spinSpeed: 0.4, beamingStrength: 0.2, brightness: 1.5, bloomIntensity: 1.6,
      colorShift: 4, noiseFreq: 1.6, pitch: 0.0, yaw: 0.0, starfieldDensity: 0.3,
    },
  },
  {
    id: "sovereign-quasar",
    name: "Quasar Sovereign",
    description: "Vigorous rotation displaying extreme relativistic beaming on the approaching flank.",
    params: {
      horizonRadius: 0.18, diskInner: 0.24, diskOuter: 0.8, lensingStrength: 0.35,
      spinSpeed: 1.6, beamingStrength: 0.85, brightness: 1.3, bloomIntensity: 1.4,
      colorShift: 1, noiseFreq: 1.2, pitch: 0.05, yaw: 0.0, starfieldDensity: 0.8,
    },
  },
  {
    id: "platinum-corona",
    name: "Platinum Nova Flare",
    description: "High-intensity white-hot accretion disk with a majestic, icy stellar glare.",
    params: {
      horizonRadius: 0.14, diskInner: 0.18, diskOuter: 0.6, lensingStrength: 0.22,
      spinSpeed: 0.6, beamingStrength: 0.3, brightness: 1.6, bloomIntensity: 1.8,
      colorShift: 3, noiseFreq: 0.9, pitch: 0.22, yaw: 0.0, starfieldDensity: 0.5,
    },
  },
  {
    id: "cosmic-bronze",
    name: "Ethereal Copper",
    description: "A slow-rolling, highly turbulent gas cloud glowing in deep bronze hues.",
    params: {
      horizonRadius: 0.15, diskInner: 0.2, diskOuter: 0.65, lensingStrength: 0.25,
      spinSpeed: 0.3, beamingStrength: 0.15, brightness: 0.9, bloomIntensity: 0.9,
      colorShift: 2, noiseFreq: 2.2, pitch: 0.15, yaw: 0.0, starfieldDensity: 0.4,
    },
  },
];

export const GOLDEN_DEFAULT_PARAMS = GOLDEN_PRESETS[0].params;

const VERTEX_SHADER_SRC = `
  attribute vec2 position;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// Fragment shader — copied verbatim from the generator's BlackHoleCanvas.tsx.
const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform vec2 u_resolution;
  uniform float u_time; // Ranges from 0 to 2*PI for seamless looping

  // Parameter Uniforms
  uniform float u_horizonRadius;
  uniform float u_diskInner;
  uniform float u_diskOuter;
  uniform float u_lensing;
  uniform float u_spinSpeed;
  uniform float u_beaming;
  uniform float u_brightness;
  uniform float u_noiseFreq;
  uniform float u_colorShift;
  uniform float u_pitch;
  uniform float u_yaw;
  uniform float u_starfield;

  // New Interactive Uniforms
  uniform vec2 u_mouse;
  uniform float u_mouseHover;
  uniform vec2 u_clickPos;
  uniform float u_clickProgress;
  uniform float u_cameraDistance;
  uniform float u_focalLength;

  // Simple pseudo-random hash
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  // 3D noise function
  float noise(in vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
        mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x),
        f.y
      ),
      mix(
        mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
        mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x),
        f.y
      ),
      f.z
    );
  }

  // Fractional Brownian Motion for gas turbulence
  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = p * 2.02;
    f += 0.2500 * noise(p); p = p * 2.03;
    f += 0.1250 * noise(p); p = p * 2.01;
    f += 0.0625 * noise(p);
    return f / 0.9375;
  }

  // Custom luxury gold color scheme interpolator
  vec3 getGoldColor(float d, float shift) {
    if (shift < 0.5) {
      // Sovereign Gold (Deep Royal Gold)
      return mix(vec3(0.96, 0.72, 0.18), vec3(1.0, 0.94, 0.68), d);
    } else if (shift < 1.5) {
      // Stellar Rose Gold (Warm pinkish golds)
      return mix(vec3(0.92, 0.52, 0.44), vec3(0.99, 0.82, 0.76), d);
    } else if (shift < 2.5) {
      // Cosmic Copper (Warm fiery bronze)
      return mix(vec3(0.86, 0.36, 0.10), vec3(0.99, 0.64, 0.28), d);
    } else if (shift < 3.5) {
      // Supernova Platinum (Icy high-end silver white)
      return mix(vec3(0.65, 0.74, 0.85), vec3(0.96, 0.98, 1.00), d);
    } else {
      // Dark Amber Dust (Sultry golden-honey amber)
      return mix(vec3(0.65, 0.30, 0.01), vec3(0.94, 0.58, 0.10), d);
    }
  }

  void main() {
    vec2 uv = (v_texCoord * 2.0 - 1.0);
    uv.x *= u_resolution.x / u_resolution.y;

    // INTERACTIVE MOUSE GRAVITATIONAL LENSING
    // Warps space directly under the mouse cursor, behaving like a micro gravity well!
    if (u_mouseHover > 0.01) {
      vec2 dMouse = uv - u_mouse;
      float distMouse = length(dMouse);
      if (distMouse > 0.002 && distMouse < 0.8) {
        // High-contrast local spacetime warping that scales with hover intensity
        float localWarp = 0.045 * u_mouseHover * (1.0 - smoothstep(0.002, 0.8, distMouse)) / (distMouse + 0.08);
        uv -= normalize(dMouse) * localWarp;
      }
    }

    // INTERACTIVE COSMIC SHOCKWAVE PULSE (Click spacetime ripple)
    if (u_clickProgress > 0.01) {
      vec2 dClick = uv - u_clickPos;
      float distClick = length(dClick);
      float waveRadius = u_clickProgress * 1.5; // Shockwave expands
      float waveThickness = 0.12;
      float waveDist = abs(distClick - waveRadius);
      if (waveDist < waveThickness) {
        float waveIntensity = (1.0 - waveDist / waveThickness) * (1.0 - u_clickProgress);
        // Spacetime compression ripple wave
        float waveWarp = sin(waveDist * 32.0 - u_time * 12.0) * 0.04 * waveIntensity;
        uv -= normalize(dClick) * waveWarp;
      }
    }

    // Set up camera positioning based on pitch and yaw angles
    float cosP = cos(u_pitch);
    float sinP = sin(u_pitch);
    float cosY = cos(u_yaw);
    float sinY = sin(u_yaw);

    // Camera position - dynamic distance that zooms closer on click!
    vec3 ro = vec3(0.0, u_cameraDistance * sinP, -u_cameraDistance * cosP);

    // Rotate camera around Y-axis (Yaw)
    vec3 temp_ro = ro;
    ro.x = temp_ro.x * cosY - temp_ro.z * sinY;
    ro.z = temp_ro.x * sinY + temp_ro.z * cosY;

    // Target (Focus center is the Singularity)
    vec3 target = vec3(0.0, 0.0, 0.0);
    vec3 forward = normalize(target - ro);

    // Stable look-at reference vector to handle the poles without NaN or glitches
    vec3 up_ref = vec3(0.0, 1.0, 0.0);
    if (abs(forward.y) > 0.99) {
      up_ref = vec3(0.0, 0.0, 1.0);
    }
    vec3 right = normalize(cross(forward, up_ref));
    vec3 up = cross(right, forward);

    // Create Ray Direction with dynamic focal length
    vec3 rd = normalize(uv.x * right + uv.y * up + u_focalLength * forward);

    // Geodesic integration parameters
    vec3 rp = ro;
    float stepSize = 0.080;
    vec3 accColor = vec3(0.0);
    float accAlpha = 0.0;
    bool hitHorizon = false;
    float minR = 999.0;

    // Numerical integration of light ray propagation in curved spacetime
    for (int i = 0; i < 110; i++) {
      float r2 = dot(rp, rp);
      float r = sqrt(r2);

      // Track the closest approach of the light ray to the event horizon
      minR = min(minR, r);

      // Robust Event Horizon intersection (segment-to-sphere distance)
      float t_horizon = -dot(rp, rd);
      t_horizon = clamp(t_horizon, 0.0, stepSize);
      vec3 closest_p = rp + rd * t_horizon;
      if (length(closest_p) < u_horizonRadius) {
        hitHorizon = true;
        break;
      }

      vec3 next_rp = rp + rd * stepSize;

      // 1. INFALLING SPIRAL LANES (Matter being pulled towards the horizon and fading out)
      if (r > u_horizonRadius && r < u_diskOuter) {
        float angle = atan(rp.z, rp.x);

        // Logarithmic spiral math: angle + k * log(r) represents a winding spiral
        float spiralIndex = angle + 2.8 * log(r - u_horizonRadius + 0.005) + u_time * u_spinSpeed * 2.5;

        // High frequency wave for thin, crisp spiral dust trails
        float spiralWaves = smoothstep(0.80, 0.98, sin(spiralIndex * 3.0) * 0.5 + 0.5);

        // Flatten the spirals to align with the accretion disk plane (y = 0)
        float hThickness = 0.16 * r;
        float hPlane = smoothstep(hThickness, 0.0, abs(rp.y));

        // Pull-and-fade behavior: particles fade out as they get pulled extremely close to the horizon
        float pullFade = smoothstep(u_horizonRadius, u_horizonRadius + 0.38, r);

        // Add random clumping / particle noise
        float chunkiness = noise(rp * 4.8 - vec3(0.0, u_time, 0.0));

        float infallDensity = spiralWaves * hPlane * pullFade * (0.2 + 0.8 * chunkiness);
        float infallAlpha = infallDensity * 0.42 * u_brightness;

        // Heat and color shift near the center
        vec3 infallColor = mix(getGoldColor(0.25, u_colorShift), vec3(1.0, 0.96, 0.88), smoothstep(u_diskOuter, u_horizonRadius, r));

        // Accumulate infalling matter
        accColor += (1.0 - accAlpha) * infallColor * infallAlpha;
        accAlpha += (1.0 - accAlpha) * infallAlpha;
      }

      // 2. AMBIENT HAZY GOLD CLOUD (Atmospheric corona fog surrounding the black hole)
      if (r > u_horizonRadius && r < u_diskOuter * 1.6) {
        // High density close to the horizon, falling off beautifully
        float hazeDensity = 0.032 / (pow(r, 1.4) + 0.01);

        // Modulate with slow moving low-frequency turbulence for gas clouds
        float hazeNoise = fbm(rp * 0.65 + vec3(0.0, u_time * 0.12, 0.0)) * 0.5 + 0.5;

        float hazeAlpha = hazeDensity * hazeNoise * u_brightness * stepSize * 2.5;
        vec3 hazeColor = getGoldColor(0.35, u_colorShift);

        accColor += (1.0 - accAlpha) * hazeColor * hazeAlpha;
        accAlpha += (1.0 - accAlpha) * hazeAlpha;
      }

      // 3. Volumetric Accretion Disk (glowing gas torus/plane)
      if (r > u_diskInner && r < u_diskOuter) {
        float thickness = 0.06 * r; // Flares out gently with radius
        float h = abs(rp.y);
        if (h < thickness) {
          // Inside disk volume! Let's compute density
          float density = (1.0 - h / thickness); // Maximum density at plane y = 0

          // Edge clipping and fading for smooth inner/outer boundaries
          float edgeFade = smoothstep(u_diskInner, u_diskInner + 0.08, r) *
                           smoothstep(u_diskOuter, u_diskOuter - 0.20, r);

          float angle = atan(rp.z, rp.x);

          // Seamless spinning orbit mapping
          float spinAngle = angle - u_time * u_spinSpeed;

          // Double-layer 3D noise for high fidelity gas clouds and eddies
          vec3 noiseCoord1 = vec3(rp.x * 2.2, rp.z * 2.2, spinAngle * 2.5);
          vec3 noiseCoord2 = vec3(rp.x * 1.2, rp.z * 1.2, -spinAngle * 1.5 + cos(u_time) * 0.25);
          float n = fbm(noiseCoord1 * u_noiseFreq) * 0.65 + fbm(noiseCoord2 * u_noiseFreq) * 0.35;

          // Relativistic Beaming (Doppler boosting)
          vec3 tangent = vec3(-sin(angle), 0.0, cos(angle));
          float doppler = dot(tangent, -rd);
          float beaming = 1.0 + u_beaming * doppler;
          beaming = max(0.05, beaming * beaming); // Squared for high-contrast intensity change

          float stepDensity = density * edgeFade * (0.12 + n * 0.88) * beaming;
          float alpha = stepDensity * 0.25 * u_brightness; // Scale density accumulation

          // Accretion disk with relativistic chromatic dispersion!
          // Shifts the color gradient lookup radially by channel based on Doppler beaming
          float diskGrad = (r - u_diskInner) / (u_diskOuter - u_diskInner);
          vec3 diskColorR = getGoldColor(clamp(diskGrad - 0.012 * beaming, 0.0, 1.0), u_colorShift);
          vec3 diskColorG = getGoldColor(clamp(diskGrad, 0.0, 1.0), u_colorShift);
          vec3 diskColorB = getGoldColor(clamp(diskGrad + 0.012 * beaming, 0.0, 1.0), u_colorShift);
          vec3 diskColor = vec3(diskColorR.r, diskColorG.g, diskColorB.b);

          // Add hot-spot/temperature gradient towards the center
          float tempFactor = smoothstep(u_diskOuter, u_diskInner, r);
          diskColor = mix(diskColor, vec3(1.0, 0.95, 0.88), tempFactor * 0.4);

          // Accumulate color and opacity
          accColor += (1.0 - accAlpha) * diskColor * alpha;
          accAlpha += (1.0 - accAlpha) * alpha;

          if (accAlpha > 0.98) {
            accAlpha = 1.0;
            break;
          }
        }
      }

      // Gravitational lens bending: gravity force falls off with square of distance r^2
      vec3 toSingularity = -rp;
      vec3 forceDir = toSingularity / (r + 1e-6);

      // Strong gravitational lensing force
      float bendingForce = (1.9 * u_lensing) / (r2 + 0.005);

      // Apply bending to ray direction
      rd = normalize(rd + forceDir * bendingForce * stepSize);

      rp = next_rp;
    }

    vec3 finalColor = vec3(0.0);

    if (hitHorizon) {
      // Event horizon itself is purely pitch black
      finalColor = accColor;
    } else {
      // Background starfield bent by gravitational lensing
      float starVal = noise(rd * 45.0) * 0.6 + noise(rd * 110.0) * 0.4;
      vec3 stars = vec3(0.0);
      if (starVal > 0.72 && u_starfield > 0.02) {
        float starIntensity = smoothstep(0.72, 0.98, starVal) * u_starfield * 2.5;
        // Introduce different colored stars (warm orange, hot white, cool blue)
        vec3 starColor = mix(vec3(0.65, 0.80, 1.0), vec3(1.0, 0.92, 0.78), noise(rd * 15.0));
        stars = starColor * starIntensity;
      }

      // Base cosmic nebula background glow
      vec3 nebulaGlow = getGoldColor(0.5, u_colorShift) * 0.035 * u_brightness;

      // PHOTON RING: A sharp, beautiful, radiant ring of light that bounds the event horizon sphere
      // We apply general-relativistic chromatic aberration near the event horizon by channel-splitting!
      float ringR = smoothstep(0.08, 0.005, minR * 0.992 - u_horizonRadius);
      float ringG = smoothstep(0.08, 0.005, minR - u_horizonRadius);
      float ringB = smoothstep(0.08, 0.005, minR * 1.008 - u_horizonRadius);

      vec3 ringBaseColor = mix(getGoldColor(0.15, u_colorShift), vec3(1.0, 0.97, 0.90), 0.75);
      vec3 photonRing = vec3(
        ringBaseColor.r * ringR,
        ringBaseColor.g * ringG,
        ringBaseColor.b * ringB
      ) * (2.2 * u_brightness);

      finalColor = accColor + (1.0 - accAlpha) * (photonRing + stars + nebulaGlow);
    }

    // CINEMATIC ANAMORPHIC LENS FLARES
    // Creates high-production-value horizontal light streaks reflecting intense gravitationally lensed rays
    float flareFactor = exp(-abs(uv.y) * 22.0) * exp(-abs(uv.x) * 0.15);
    vec3 flareColor = getGoldColor(0.2, u_colorShift) * (flareFactor * 0.65 * u_brightness);
    finalColor += flareColor;

    // High contrast vignettes
    float dCenter = dot(uv, uv);
    float vignette = smoothstep(2.5, 0.4, dCenter);
    finalColor *= vignette;

    // CINEMATIC FILM GRAIN
    float grainNoise = fract(sin(dot(uv * (u_time + 1.2), vec2(12.9898, 78.233))) * 43758.5453);
    vec3 grain = vec3(grainNoise - 0.5) * 0.024;
    finalColor += grain;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function GoldenHorizonCanvas({ params: paramsProp }) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [isCapturing3D, setIsCapturing3D] = useState(false);
  const paramsRef = useRef({ ...GOLDEN_DEFAULT_PARAMS, ...paramsProp });

  // Live HUD readouts (pitch/yaw/zoom) are poked directly into these DOM
  // nodes from the render loop — no per-frame React re-renders.
  const hudPitchRef = useRef(null);
  const hudYawRef = useRef(null);
  const hudZoomRef = useRef(null);

  useEffect(() => {
    paramsRef.current = { ...GOLDEN_DEFAULT_PARAMS, ...paramsProp };
  }, [paramsProp]);

  useEffect(() => {
    if (isLiteMode()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl =
      canvas.getContext("webgl", { preserveDrawingBuffer: true }) ||
      canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true });
    if (!gl) return; // no WebGL — the CSS horizon glow behind stays as the scene

    const compileShader = (src, type) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[GoldenHorizon] shader compile failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(VERTEX_SHADER_SRC, gl.VERTEX_SHADER);
    const fs = compileShader(FRAGMENT_SHADER_SRC, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[GoldenHorizon] program link failed:", gl.getProgramInfoLog(program));
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
    const uHorizonRadius = u("u_horizonRadius");
    const uDiskInner = u("u_diskInner");
    const uDiskOuter = u("u_diskOuter");
    const uLensing = u("u_lensing");
    const uSpinSpeed = u("u_spinSpeed");
    const uBeaming = u("u_beaming");
    const uBrightness = u("u_brightness");
    const uNoiseFreq = u("u_noiseFreq");
    const uColorShift = u("u_colorShift");
    const uPitch = u("u_pitch");
    const uYaw = u("u_yaw");
    const uStarfield = u("u_starfield");
    const uMouse = u("u_mouse");
    const uMouseHover = u("u_mouseHover");
    const uClickPos = u("u_clickPos");
    const uClickProgress = u("u_clickProgress");
    const uCameraDistance = u("u_cameraDistance");
    const uFocalLength = u("u_focalLength");

    // ── Interaction state (all refs-in-closure; the loop reads these) ──
    const camera = { pitch: paramsRef.current.pitch, yaw: paramsRef.current.yaw };
    const drag = { isDragging: false };
    const lastMouse = { x: 0, y: 0 };
    let yawVelocity = 0.001; // Subtle default auto-orbit yaw speed
    let pitchVelocity = 0;
    const mouse = { x: 0, y: 0, hover: false };
    let easedHover = 0;
    const click = { x: 0, y: 0, progress: 0 };
    let easedZoom = 0;
    let time = 0;
    let lastTimestamp = 0;
    let raf = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      // The generator renders at CSS-pixel resolution (DPR 1) — a 110-step
      // per-pixel raymarch; resolution is the whole perf budget.
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const toLocalUv = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const rawY = -(((clientY - rect.top) / rect.height) * 2 - 1);
      const aspect = rect.width / rect.height;
      return { x: rawX * aspect, y: rawY };
    };

    const drawScene = () => {
      const p = paramsRef.current;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time % (2.0 * Math.PI));
      gl.uniform1f(uHorizonRadius, p.horizonRadius);
      gl.uniform1f(uDiskInner, p.diskInner);
      gl.uniform1f(uDiskOuter, p.diskOuter);
      gl.uniform1f(uLensing, p.lensingStrength);
      gl.uniform1f(uSpinSpeed, p.spinSpeed);
      gl.uniform1f(uBeaming, p.beamingStrength);
      gl.uniform1f(uBrightness, p.brightness);
      gl.uniform1f(uNoiseFreq, p.noiseFreq);
      gl.uniform1f(uColorShift, p.colorShift);
      gl.uniform1f(uStarfield, p.starfieldDensity);
      gl.uniform1f(uPitch, camera.pitch);
      gl.uniform1f(uYaw, camera.yaw);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uMouseHover, easedHover);
      gl.uniform2f(uClickPos, click.x, click.y);
      gl.uniform1f(uClickProgress, click.progress);

      // Interactive cinematic zoom: dolly closer + telephoto compression on hold
      const cameraDistance = 4.6 - easedZoom * 1.4;
      const focalLength = 2.4 + easedZoom * 0.5;
      gl.uniform1f(uCameraDistance, cameraDistance);
      gl.uniform1f(uFocalLength, focalLength);

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Poke live HUD readouts without re-rendering React
      if (hudPitchRef.current) hudPitchRef.current.textContent = camera.pitch.toFixed(3);
      if (hudYawRef.current) hudYawRef.current.textContent = camera.yaw.toFixed(3);
      if (hudZoomRef.current) hudZoomRef.current.textContent = `x${focalLength.toFixed(2)}`;
    };

    const loop = (timestamp) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const delta = (timestamp - lastTimestamp) * 0.001;
      lastTimestamp = timestamp;

      // u_time drives the loop angle from 0 to 2*PI (seamless loop boundary)
      time += delta * 0.55;
      if (time >= 2.0 * Math.PI) time -= 2.0 * Math.PI;

      // Animate clicked spacetime pulse ripple (smooth linear expand and fadeout)
      if (click.progress > 0) {
        click.progress += delta * 1.5;
        if (click.progress > 1.0) click.progress = 0;
      }

      // Smoothly ease the mouse lensing intensity
      easedHover += ((mouse.hover ? 1.0 : 0.0) - easedHover) * 0.08;

      // Smoothly ease the camera dolly zoom while the user is holding a drag
      easedZoom += ((drag.isDragging ? 1.0 : 0.0) - easedZoom) * 0.085;

      // 3D orbit physics momentum
      if (!drag.isDragging) {
        yawVelocity *= 0.95;
        pitchVelocity *= 0.95;

        // Momentum faded — settle into the slow elegant auto-spin drift
        if (Math.abs(yawVelocity) < 0.001) {
          yawVelocity += (0.0012 - yawVelocity) * 0.05;
        }
        if (Math.abs(pitchVelocity) < 0.0001) {
          pitchVelocity = 0.0;
        }

        camera.yaw += yawVelocity;
        camera.pitch = Math.max(-1.4, Math.min(1.4, camera.pitch + pitchVelocity));
      }

      drawScene();
      raf = requestAnimationFrame(loop);
    };

    // ── Pointer interaction (mouse + touch, same math as the generator) ──
    const beginDrag = (clientX, clientY) => {
      const { x, y } = toLocalUv(clientX, clientY);
      click.x = x;
      click.y = y;
      click.progress = 0.01; // shockwave begins expanding
      drag.isDragging = true;
      setIsCapturing3D(true);
      lastMouse.x = clientX;
      lastMouse.y = clientY;
      yawVelocity = 0;
      pitchVelocity = 0;
    };

    const moveDrag = (clientX, clientY, speedScale) => {
      const { x, y } = toLocalUv(clientX, clientY);
      mouse.x = x;
      mouse.y = y;
      mouse.hover = true;
      if (!drag.isDragging) return;

      const dx = clientX - lastMouse.x;
      const dy = clientY - lastMouse.y;
      lastMouse.x = clientX;
      lastMouse.y = clientY;

      yawVelocity = dx * speedScale;
      pitchVelocity = -dy * speedScale;
      camera.yaw += yawVelocity;
      camera.pitch = Math.max(-1.4, Math.min(1.4, camera.pitch + pitchVelocity));
    };

    const endDrag = () => {
      drag.isDragging = false;
      mouse.hover = false;
      setIsCapturing3D(false);
    };

    const onMouseDown = (e) => beginDrag(e.clientX, e.clientY);
    const onMouseMove = (e) => moveDrag(e.clientX, e.clientY, 0.005);
    const onTouchStart = (e) => {
      if (e.touches.length === 0) return;
      beginDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 0) return;
      moveDrag(e.touches[0].clientX, e.touches[0].clientY, 0.008);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let running = false;
    let visible = true;
    let killed = false;
    const start = () => {
      if (running || killed || reducedMotion) return;
      running = true;
      lastTimestamp = 0;
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
      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", endDrag);
      canvas.addEventListener("mouseleave", endDrag);
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchend", endDrag);
    }

    resize();
    drawScene(); // paint one frame immediately — also the only frame under reduced motion
    setRevealed(true);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(LITE_MODE_EVENT, onLiteToggle);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", endDrag);
      canvas.removeEventListener("mouseleave", endDrag);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", endDrag);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <div
      className="golden-horizon-wrap"
      style={{
        opacity: revealed ? 1 : 0,
        transition: "opacity 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="golden-horizon-canvas"
        title="Click or drag to send gravity shockwaves and look at the black hole in 3D dimensions"
      />

      {/* Cinematic WebGL Indicator HUD (top-left, appears on hover) */}
      <div className="gh-hud gh-hint" aria-hidden="true">
        <span className="gh-ping" />
        WEBGL CINEMATIC SINGULARITY • DRAG TO ORBIT • CLICK TO RIPPLE
      </div>

      {/* Interactive Holographic HUD Overlay (while dragging in 3D) */}
      {isCapturing3D && (
        <>
          <div className="gh-reticle" aria-hidden="true">
            <div className="gh-ring-outer" />
            <div className="gh-ring-inner"><span className="gh-dot" /></div>
            <div className="gh-cross-h" />
            <div className="gh-cross-v" />
            <div className="gh-label gh-label-top">OBSV_NODE_Z_CENTER</div>
            <div className="gh-label gh-label-bottom">E_HORIZON_PROXIMITY_99.8%</div>
          </div>

          <div className="gh-hud gh-status" aria-hidden="true">
            <span className="gh-ping" />
            <span className="gh-status-title">3D DIMENSION LOCK ACTIVE</span>
            <span className="gh-sep">|</span>
            <span>PITCH: <span ref={hudPitchRef}>0.000</span> rad</span>
            <span className="gh-sep">|</span>
            <span>YAW: <span ref={hudYawRef}>0.000</span> rad</span>
          </div>

          <div className="gh-hud gh-matrix" aria-hidden="true">
            <div className="gh-matrix-title">OBSERVATION COUPLING</div>
            <div className="gh-matrix-row"><span>GRAVITY LENSING:</span><span className="gh-gold">100.0% (ACTIVE)</span></div>
            <div className="gh-matrix-row"><span>DOPPLER BOOSTING:</span><span className="gh-gold">EASED_LOCK</span></div>
            <div className="gh-matrix-row"><span>TELEPHOTO RANGE:</span><span className="gh-gold" ref={hudZoomRef}>x2.40</span></div>
          </div>
        </>
      )}

      <style jsx>{`
        .golden-horizon-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          user-select: none;
        }
        .golden-horizon-canvas {
          width: 100%;
          height: 100%;
          display: block;
          cursor: grab;
          touch-action: pan-y;
        }
        .golden-horizon-canvas:active {
          cursor: grabbing;
        }

        .gh-hud {
          position: absolute;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: 8px;
          font-family: var(--font-mono), 'Courier New', monospace;
          color: rgba(232, 174, 60, 0.9);
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
        }
        .gh-hint {
          top: 16px;
          left: 16px;
          padding: 6px 12px;
          font-size: 10px;
          letter-spacing: 0.18em;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .golden-horizon-wrap:hover .gh-hint {
          opacity: 1;
        }
        .gh-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e8ae3c;
          animation: ghPing 1.2s ease-out infinite;
          flex-shrink: 0;
        }
        @keyframes ghPing {
          0% { box-shadow: 0 0 0 0 rgba(232, 174, 60, 0.6); }
          100% { box-shadow: 0 0 0 8px rgba(232, 174, 60, 0); }
        }

        .gh-reticle {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
        }
        .gh-ring-outer {
          position: absolute;
          width: 192px;
          height: 192px;
          border-radius: 50%;
          border: 1px dashed rgba(232, 174, 60, 0.15);
          animation: ghSpin 12s linear infinite;
        }
        .gh-ring-inner {
          position: absolute;
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 1px solid rgba(232, 174, 60, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gh-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.7);
        }
        .gh-cross-h {
          position: absolute;
          width: 144px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(232, 174, 60, 0.3), transparent);
        }
        .gh-cross-v {
          position: absolute;
          height: 144px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(232, 174, 60, 0.3), transparent);
        }
        .gh-label {
          position: absolute;
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 8px;
          letter-spacing: 0.12em;
          color: rgba(232, 174, 60, 0.4);
        }
        .gh-label-top { transform: translateY(-96px); }
        .gh-label-bottom { transform: translateY(96px); }
        @keyframes ghSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .gh-status {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 16px;
          font-size: 10px;
          border-color: rgba(232, 174, 60, 0.3);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.15);
          animation: ghPulse 2s ease-in-out infinite;
          z-index: 2;
          white-space: nowrap;
        }
        .gh-status-title {
          font-weight: 700;
          letter-spacing: 0.18em;
        }
        .gh-sep { color: rgba(255, 255, 255, 0.2); }
        .gh-status span:not(.gh-status-title):not(.gh-sep):not(.gh-ping) {
          color: rgba(255, 255, 255, 0.55);
        }
        @keyframes ghPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }

        .gh-matrix {
          top: 16px;
          right: 16px;
          padding: 10px 12px;
          font-size: 9px;
          flex-direction: column;
          align-items: stretch;
          gap: 5px;
          color: rgba(255, 255, 255, 0.5);
          z-index: 2;
        }
        .gh-matrix-title {
          color: #e8ae3c;
          font-weight: 700;
          letter-spacing: 0.14em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 4px;
        }
        .gh-matrix-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .gh-gold { color: rgba(232, 174, 60, 0.9); font-weight: 700; }

        @media (max-width: 768px) {
          .gh-matrix, .gh-hint { display: none; }
        }
      `}</style>
    </div>
  );
}
