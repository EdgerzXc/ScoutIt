"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/liteMode";

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── 1. STRATOSPHERE NEBULA & SPACE SHADER ───────────────────────────── */
const SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKY_FRAG = `
  uniform float uTime;
  varying vec3 vDir;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(
      mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
          mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
      mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
          mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z
    );
  }

  float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = p * 2.02;
    f += 0.2500 * noise(p); p = p * 2.03;
    f += 0.1250 * noise(p);
    return f;
  }

  void main() {
    vec3 dir = normalize(vDir);
    vec3 baseColor = vec3(0.015, 0.018, 0.026);

    float nebula = fbm(dir * 2.2 + vec3(0.0, uTime * 0.012, 0.0));
    float goldCloud = pow(max(0.0, nebula - 0.2), 3.0);
    vec3 nebulaColor = vec3(0.91, 0.68, 0.24) * goldCloud * 0.18;

    gl_FragColor = vec4(baseColor + nebulaColor, 1.0);
  }
`;

/* ── 2. HIGH-RES EARTH SURFACE SHADER WITH GOLD ATMOSPHERIC SCATTERING ── */
const EARTH_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vViewDir = normalize(cameraPosition - vWorldPos);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = `
  uniform sampler2D mapTexture;
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying vec3 vViewDir;

  void main() {
    vec4 mapTex = texture2D(mapTexture, vUv);
    vec3 landBase = mapTex.rgb;
    float cityEmission = mapTex.a;

    // View grazing angle
    float camFacing = max(0.0, dot(vNormal, vViewDir));
    float fresnel = pow(1.0 - camFacing, 3.2);

    // Warm golden night lights (#F7C64E / #E8AE3C)
    vec3 goldLight = mix(vec3(0.91, 0.68, 0.24), vec3(0.97, 0.78, 0.31), sin(vUv.x * 20.0 + uTime * 0.8) * 0.5 + 0.5);
    vec3 cityGlow = goldLight * (cityEmission * 1.75);

    // Base surface color
    vec3 color = landBase + cityGlow;

    // Atmospheric limb scattering (Amber Stratospheric rim)
    vec3 atmoGold = vec3(0.92, 0.70, 0.22) * fresnel * 0.75;
    vec3 atmoBlue = vec3(0.18, 0.38, 0.80) * pow(1.0 - camFacing, 5.0) * 0.35;
    color += atmoGold + atmoBlue;

    // Smooth edge fade
    color *= smoothstep(0.0, 0.05, camFacing);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ── 3. ATMOSPHERE HALO SHADER ───────────────────────────────────────── */
const HALO_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const HALO_FRAG = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float intensity = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 3.8);
    vec3 haloColor = mix(vec3(0.2, 0.45, 0.85), vec3(0.92, 0.70, 0.22), 0.55);
    gl_FragColor = vec4(haloColor, intensity * 0.55);
  }
`;

/* ── HIGH-RESOLUTION PHILIPPINES ARCHIPELAGO TEXTURE GENERATOR ───────── */
function generateZoomedArchipelagoTexture() {
  const W = 4096;
  const H = 2048;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");

  // 1. OCEANS: Deep obsidian indigo navy (#02050e)
  ctx.fillStyle = "#02050e";
  ctx.fillRect(0, 0, W, H);

  const toX = (lon) => ((lon + 180) / 360) * W;
  const toY = (lat) => (1 - (lat + 90) / 180) * H;

  // Landmass drawing helper
  const drawLandmass = (coords, color = "#0d131c", strokeColor = "#1e293b", lineWidth = 1.5) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0]), toY(coords[1]));
    for (let i = 2; i < coords.length; i += 2) {
      ctx.lineTo(toX(coords[i]), toY(coords[i + 1]));
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();
  };

  // Asian Mainland & surrounding islands (Global context)
  drawLandmass([
    100, 22, 108, 22, 118, 24, 121, 31, 122, 38, 130, 42, 142, 50,
    140, 72, 100, 78, 60, 76, 50, 30, 80, 16, 92, 18, 98, 8, 104, 10, 100, 22
  ]); // Asia Mainland
  drawLandmass([130, 31, 137, 35, 141, 39, 145, 44, 139, 36, 130, 31]); // Japan
  drawLandmass([120, 25.5, 122, 25, 121.5, 21.8, 120, 22, 120, 25.5]); // Taiwan
  drawLandmass([109, 7, 119, 7, 119, -4, 109, -4, 109, 7]); // Borneo
  drawLandmass([95, 5, 104, 2, 114, 4, 118, 1, 106, -6, 95, 5]); // Sumatra
  drawLandmass([106, -6, 115, -7, 115, -8.8, 106, -8.8, 106, -6]); // Java
  drawLandmass([125, -8, 130, -8, 130, -10, 125, -10, 125, -8]); // Timor

  // ── DETAILED PHILIPPINE ARCHIPELAGO ISLANDS ──
  // 1. LUZON (Northern & Central Philippines)
  drawLandmass([
    120.5, 18.6, 121.5, 18.6, 122.3, 18.2, 122.5, 16.8, 122.2, 15.6,
    123.8, 14.3, 124.2, 13.8, 123.6, 13.0, 122.5, 13.6, 121.4, 13.7,
    120.6, 14.3, 120.9, 14.6, 120.5, 14.8, 120.2, 15.8, 119.8, 16.4,
    120.4, 17.5, 120.5, 18.6
  ], "#121a26", "#2d3e56", 2.2);

  // 2. MINDORO
  drawLandmass([120.4, 13.5, 121.5, 13.3, 121.6, 12.3, 121.0, 12.2, 120.4, 13.5], "#121a26", "#2d3e56", 1.8);

  // 3. PALAWAN (El Nido / Coron / Puerto Princesa Archipelago)
  drawLandmass([
    117.0, 8.4, 118.0, 9.2, 119.0, 10.2, 119.6, 11.4, 119.4, 11.6,
    118.5, 10.4, 117.6, 9.4, 117.0, 8.4
  ], "#121a26", "#2d3e56", 2.0);
  drawLandmass([120.0, 12.2, 120.4, 12.0, 120.2, 11.6, 119.8, 11.8, 120.0, 12.2], "#121a26", "#2d3e56", 1.6); // Busuanga / Coron

  // 4. VISAYAS ISLAND CHAIN
  drawLandmass([121.8, 11.8, 123.1, 11.6, 122.9, 10.5, 122.0, 10.5, 121.8, 11.8], "#121a26", "#2d3e56", 1.8); // Panay (Iloilo / Boracay)
  drawLandmass([122.5, 10.8, 123.5, 10.8, 123.2, 9.1, 122.4, 9.4, 122.5, 10.8], "#121a26", "#2d3e56", 1.8); // Negros
  drawLandmass([123.5, 11.2, 124.0, 10.5, 123.9, 9.5, 123.3, 9.8, 123.5, 11.2], "#121a26", "#3b82f6", 2.2); // CEBU (Highlighted)
  drawLandmass([123.8, 10.0, 124.5, 10.0, 124.4, 9.6, 123.8, 9.6, 123.8, 10.0], "#121a26", "#2d3e56", 1.6); // Bohol
  drawLandmass([124.3, 11.5, 125.1, 11.3, 124.8, 10.2, 124.3, 11.5], "#121a26", "#2d3e56", 1.6); // Leyte
  drawLandmass([124.4, 12.6, 125.6, 12.4, 125.7, 11.1, 124.8, 11.5, 124.4, 12.6], "#121a26", "#2d3e56", 1.6); // Samar

  // 5. MINDANAO & SIARGAO
  drawLandmass([
    122.0, 8.6, 124.2, 8.8, 125.5, 9.8, 126.3, 8.2, 126.5, 6.4,
    125.5, 5.6, 124.2, 6.0, 123.4, 7.4, 122.0, 7.0, 122.0, 8.6
  ], "#121a26", "#2d3e56", 2.2);
  drawLandmass([126.0, 10.0, 126.2, 9.8, 126.1, 9.6, 125.9, 9.7, 126.0, 10.0], "#162234", "#E8AE3C", 2.0); // SIARGAO ISLAND

  // ── NASA HIGH-DENSITY METROPOLIS CITY LIGHTS (ALPHA CHANNEL) ──
  const addCityGlow = (lon, lat, radius, intensity, pulseSpeed = 1.0) => {
    const cx = toX(lon);
    const cy = toY(lat);

    // Radial gradient glow in alpha channel
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(255, 255, 255, ${intensity.toFixed(2)})`);
    g.addColorStop(0.25, `rgba(255, 255, 255, ${(intensity * 0.75).toFixed(2)})`);
    g.addColorStop(0.65, `rgba(255, 255, 255, ${(intensity * 0.25).toFixed(2)})`);
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    // Arterial transit lines branching outward
    ctx.strokeStyle = `rgba(255, 255, 255, ${(intensity * 0.35).toFixed(2)})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2 + rnd(i + lon) * 0.4;
      const len = radius * (1.2 + rnd(i + lat) * 1.5);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
  };

  // ── PHILIPPINES METROPOLITAN CENTERS (HIGH DEFINITION) ──
  // Metro Manila Core (BGC, Makati, Ortigas, Quezon City, Bay Area)
  addCityGlow(121.05, 14.56, 32, 1.0);
  addCityGlow(120.98, 14.59, 22, 0.9);  // Manila Bay Shore
  addCityGlow(121.12, 14.65, 20, 0.85); // Quezon City / Marikina
  addCityGlow(121.02, 14.38, 22, 0.88); // Alabang / Cavite Corridor
  addCityGlow(121.15, 14.20, 18, 0.82); // Laguna Tech Corridor
  addCityGlow(120.58, 15.15, 20, 0.85); // Clark Freeport / Angeles
  addCityGlow(120.30, 14.85, 16, 0.75); // Subic Bay Corridor
  addCityGlow(120.60, 16.42, 16, 0.78); // Baguio City

  // Central Visayas / Cebu Metropolitan Hub
  addCityGlow(123.89, 10.31, 26, 0.95); // Metro Cebu (IT Park, BPO Corridors)
  addCityGlow(123.96, 10.31, 16, 0.85); // Mactan Island
  addCityGlow(122.56, 10.72, 18, 0.82); // Iloilo City
  addCityGlow(122.95, 10.68, 16, 0.78); // Bacolod
  addCityGlow(123.85, 9.65, 14, 0.72);  // Tagbilaran / Panglao

  // Siargao & Tourism Centers
  addCityGlow(126.15, 9.78, 14, 0.9);   // General Luna, Siargao
  addCityGlow(119.40, 11.18, 14, 0.88); // El Nido, Palawan
  addCityGlow(120.20, 11.98, 12, 0.75); // Coron, Palawan
  addCityGlow(118.74, 9.75, 16, 0.8);   // Puerto Princesa
  addCityGlow(121.92, 11.96, 14, 0.85); // Boracay Island
  addCityGlow(120.32, 16.62, 14, 0.78); // San Juan, La Union

  // Mindanao Metropolitan Centers
  addCityGlow(125.60, 7.19, 24, 0.92);  // Metro Davao
  addCityGlow(124.64, 8.48, 18, 0.82);  // Cagayan de Oro
  addCityGlow(125.17, 6.11, 16, 0.78);  // General Santos

  // Major Regional Asian Hubs (for peripheral glow)
  addCityGlow(121.56, 25.03, 26, 0.9);  // Taipei
  addCityGlow(114.16, 22.31, 30, 0.95); // Hong Kong
  addCityGlow(103.81, 1.35, 28, 0.92);  // Singapore
  addCityGlow(100.50, 13.75, 26, 0.88); // Bangkok
  addCityGlow(106.84, -6.20, 28, 0.88); // Jakarta

  // Dense highway artery points across Luzon and Visayas
  const addExpressways = (lon1, lat1, lon2, lat2, count = 25) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(toX(lon1), toY(lat1));
    ctx.lineTo(toX(lon2), toY(lat2));
    ctx.stroke();

    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const lon = lon1 + (lon2 - lon1) * t + (rnd(i + lon1) - 0.5) * 0.04;
      const lat = lat1 + (lat2 - lat1) * t + (rnd(i + lat1) - 0.5) * 0.04;
      const x = toX(lon);
      const y = toY(lat);
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  };

  // Luzon Spinal Expressways (NLEX, SCTEX, SLEX, STAR)
  addExpressways(120.98, 14.59, 120.58, 15.15, 24); // Manila to Clark
  addExpressways(120.58, 15.15, 120.60, 16.42, 28); // Clark to Baguio
  addExpressways(121.05, 14.56, 121.15, 13.75, 22); // Manila to Batangas
  addExpressways(121.05, 14.56, 121.60, 14.05, 18); // Manila to Quezon

  return cv;
}

/* ── 3D STRATOSPHERE SCENE CONFIGURATION ──────────────────────────────── */
export default function BackgroundStratosphere() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    if (isLiteMode() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let cancelled = false;
    let frameId;
    let renderer;
    let resizeObs;
    const disposables = [];

    // Cursor flight parallax
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetParallaxX = normX * 0.045;
      targetParallaxY = normY * 0.03;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768;

      // ── CAMERA (ZOOMED STRATOSPHERE ORBITAL POV) ──
      const camera = new THREE.PerspectiveCamera(48, W / H, 1, 4000);
      camera.position.set(0, 45, 220);
      camera.lookAt(0, -10, 0);

      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      mount.appendChild(renderer.domElement);

      /* 1. SKYBOX NEBULA DOME */
      const skyGeo = new THREE.SphereGeometry(2200, 24, 14);
      skyGeo.scale(-1, 1, 1);
      const skyMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(skyGeo, skyMat));
      disposables.push(skyGeo, skyMat);

      /* 2. STARS */
      const STAR_COUNT = 1400;
      const STAR_POS = new Float32Array(STAR_COUNT * 3);
      for (let i = 0; i < STAR_COUNT; i++) {
        const r = 600 + rnd(i * 3 + 1) * 1200;
        const theta = rnd(i * 3 + 2) * Math.PI * 2;
        const phi = Math.acos(2 * rnd(i * 3 + 3) - 1);
        STAR_POS[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        STAR_POS[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        STAR_POS[i * 3 + 2] = r * Math.cos(phi);
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(STAR_POS, 3));
      const starMat = new THREE.PointsMaterial({
        size: 1.3,
        color: 0xE8AE3C,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: false,
      });
      scene.add(new THREE.Points(starGeo, starMat));
      disposables.push(starGeo, starMat);

      /* 3. ZOOMED-IN PHILIPPINE ARCHIPELAGO GLOBE */
      // Earth scaled up and positioned closer to simulate the Stratosphere altitude descent
      const EARTH_RADIUS = 360;
      const earthTex = new THREE.CanvasTexture(generateZoomedArchipelagoTexture());
      earthTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      earthTex.wrapS = THREE.RepeatWrapping;
      earthTex.wrapT = THREE.ClampToEdgeWrapping;
      disposables.push(earthTex);

      const earthMat = new THREE.ShaderMaterial({
        uniforms: {
          mapTexture: { value: earthTex },
          uTime: { value: 0 },
        },
        vertexShader: EARTH_VERT,
        fragmentShader: EARTH_FRAG,
      });

      const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 128, 96);
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);

      // Position Earth lower so the curved Philippine island horizon occupies the viewport
      earthMesh.position.set(0, -280, -30);
      
      // Orientation focused directly on the Philippine Archipelago (Lon ~121.5°E, Lat ~14°N)
      earthMesh.rotation.y = 0.55;
      earthMesh.rotation.x = 0.28;
      scene.add(earthMesh);
      disposables.push(earthGeo, earthMat);

      /* 4. STRATOSPHERIC ATMOSPHERE HALO */
      const haloMat = new THREE.ShaderMaterial({
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const haloGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 64, 48);
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(earthMesh.position);
      scene.add(haloMesh);
      disposables.push(haloGeo, haloMat);

      /* 5. STRATOSPHERIC HIGH-ALTITUDE CLOUD STRATA */
      const CLOUD_COUNT = 45;
      const cloudPositions = new Float32Array(CLOUD_COUNT * 3);
      for (let i = 0; i < CLOUD_COUNT; i++) {
        // Form a curved ribbon of clouds across the archipelago
        const angle = -0.4 + (i / CLOUD_COUNT) * 0.9 + (rnd(i * 4 + 1) - 0.5) * 0.15;
        const rad = EARTH_RADIUS + 8 + rnd(i * 4 + 2) * 12;
        cloudPositions[i * 3] = Math.sin(angle) * (rad * 0.75);
        cloudPositions[i * 3 + 1] = Math.cos(angle) * (rad * 0.45) - 160;
        cloudPositions[i * 3 + 2] = 20 + rnd(i * 4 + 3) * 40;
      }
      const cloudGeo = new THREE.BufferGeometry();
      cloudGeo.setAttribute("position", new THREE.BufferAttribute(cloudPositions, 3));

      // Procedural soft cloud texture
      const cCv = document.createElement("canvas");
      cCv.width = 128;
      cCv.height = 128;
      const cctx = cCv.getContext("2d");
      const cgrad = cctx.createRadialGradient(64, 64, 4, 64, 64, 60);
      cgrad.addColorStop(0, "rgba(255, 235, 190, 0.35)");
      cgrad.addColorStop(0.5, "rgba(232, 174, 60, 0.14)");
      cgrad.addColorStop(1, "transparent");
      cctx.fillStyle = cgrad;
      cctx.fillRect(0, 0, 128, 128);
      const cloudTex = new THREE.CanvasTexture(cCv);
      disposables.push(cloudTex);

      const cloudMat = new THREE.PointsMaterial({
        size: 75,
        map: cloudTex,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const cloudMesh = new THREE.Points(cloudGeo, cloudMat);
      scene.add(cloudMesh);
      disposables.push(cloudGeo, cloudMat);

      /* ── ANIMATION LOOP ── */
      let tick = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tick++;
        const time = tick * 0.016;

        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.04;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.04;

        // Subtle island planetary rotation & float
        earthMesh.rotation.y += 0.00008;
        earthMat.uniforms.uTime.value = time;
        skyMat.uniforms.uTime.value = time;

        // High-altitude cloud drift
        cloudMesh.rotation.z = Math.sin(time * 0.05) * 0.02;
        cloudMesh.position.x = Math.sin(time * 0.08) * 6;

        // Camera flight sway with responsive cursor parallax
        camera.position.x = currentParallaxX * 22;
        camera.position.y = 45 - currentParallaxY * 15;
        camera.lookAt(0, -10, 0);

        renderer.render(scene, camera);
      };

      animate();

      /* ── RESIZE OBSERVER ── */
      resizeObs = new ResizeObserver(() => {
        if (!mount || !renderer) return;
        const newW = mount.clientWidth;
        const newH = mount.clientHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      });
      resizeObs.observe(mount);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("mousemove", onMouseMove);
      if (resizeObs) resizeObs.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      disposables.forEach((item) => {
        if (item && typeof item.dispose === "function") {
          item.dispose();
        }
      });
      if (mount && mount.firstChild) {
        mount.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
