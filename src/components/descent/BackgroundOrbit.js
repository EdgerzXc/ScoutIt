"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/liteMode";

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── 3,000 DEEP SPACE STARS ─────────────────────────────────────────── */
const STAR_COUNT = 3000;
const STAR_POS = new Float32Array(STAR_COUNT * 3);
const STAR_COL = new Float32Array(STAR_COUNT * 3);

for (let i = 0; i < STAR_COUNT; i++) {
  const r = 350 + rnd(i * 5 + 1) * 750;
  const theta = rnd(i * 5 + 2) * Math.PI * 2;
  const phi = Math.acos(2 * rnd(i * 5 + 3) - 1);
  STAR_POS[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  STAR_POS[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  STAR_POS[i * 3 + 2] = r * Math.cos(phi);

  const starType = rnd(i * 5 + 4);
  if (starType > 0.85) {
    // Warm Gold Stars (#E8AE3C)
    STAR_COL[i * 3] = 0.95;
    STAR_COL[i * 3 + 1] = 0.72;
    STAR_COL[i * 3 + 2] = 0.22;
  } else if (starType > 0.45) {
    // Silver White Stars
    STAR_COL[i * 3] = 0.85;
    STAR_COL[i * 3 + 1] = 0.88;
    STAR_COL[i * 3 + 2] = 0.95;
  } else {
    // Dim Stardust
    STAR_COL[i * 3] = 0.35;
    STAR_COL[i * 3 + 1] = 0.38;
    STAR_COL[i * 3 + 2] = 0.5;
  }
}

/* ── 1. SKYBOX NEBULA SHADER ────────────────────────────────────────── */
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
    vec3 d = normalize(vDir);
    vec3 spaceColor = vec3(0.005, 0.005, 0.008);

    float n = fbm(d * 3.0 + vec3(uTime * 0.004, uTime * 0.002, 0.0));
    float nebula = smoothstep(0.42, 0.78, n);
    spaceColor += vec3(0.42, 0.30, 0.08) * nebula * 1.1;

    gl_FragColor = vec4(spaceColor, 1.0);
  }
`;

/* ── 2. NASA BLACK MARBLE REALISTIC EARTH SHADER ─────────────────────── */
const EARTH_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const EARTH_FRAG = `
  uniform sampler2D mapTexture;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(mapTexture, vUv);
    
    // Texture channels:
    // RGB: Base surface texture (deep dark oceans + dark charcoal continents)
    // A: Night city light emission intensity
    
    vec3 surfaceBase = tex.rgb;
    float cityLights = tex.a;

    // Physical sun direction (creates day/night terminator curve across the limb)
    vec3 sunDir = normalize(vec3(-0.85, 0.35, 0.65));
    float sunDot = dot(vNormal, sunDir);
    float sunLit = smoothstep(-0.2, 0.3, sunDot);

    // Camera facing for atmospheric rim
    float camFacing = max(0.0, dot(vNormal, vViewDir));
    float fresnel = pow(1.0 - camFacing, 3.5);

    // Day/Night surface lighting (dark and realistic, not washed out)
    vec3 nightTone = surfaceBase * 0.65;
    vec3 dayTone = surfaceBase * (sunDot * 0.75 + 0.35);
    vec3 color = mix(nightTone, dayTone, sunLit);

    // Glowing Gold City Lights on the Night Hemisphere
    if (cityLights > 0.01) {
      float nightFactor = 1.0 - smoothstep(-0.1, 0.2, sunDot);
      
      // Warm incandescent sodium & gold LED tones (#E8AE3C to #FFF0B8)
      vec3 amberGold = vec3(0.95, 0.68, 0.18);
      vec3 coreWhiteGold = vec3(1.0, 0.92, 0.65);
      vec3 lightColor = mix(amberGold, coreWhiteGold, smoothstep(0.4, 0.9, cityLights));
      
      float twinkle = 0.97 + 0.03 * sin(uTime * 2.0 + vUv.x * 120.0);
      color += lightColor * cityLights * 1.8 * nightFactor * twinkle;
    }

    // Realistic atmospheric Rayleigh scattering along the edge
    vec3 atmoCyan = vec3(0.18, 0.42, 0.90) * fresnel * 0.35;
    vec3 atmoGold = vec3(0.92, 0.70, 0.22) * pow(1.0 - camFacing, 4.5) * 0.55;
    color += atmoCyan + atmoGold;

    // Edge anti-aliasing
    color *= smoothstep(0.0, 0.04, camFacing);

    gl_FragColor = vec4(color, 1.0);
  }
`;

/* ── 3. TIGHT OPTICAL ATMOSPHERE HALO ────────────────────────────────── */
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
    float intensity = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 4.2);
    vec3 haloColor = mix(vec3(0.2, 0.45, 0.9), vec3(0.92, 0.70, 0.22), 0.4);
    gl_FragColor = vec4(haloColor, intensity * 0.4);
  }
`;

/* ── HIGH-RESOLUTION NASA BLACK MARBLE CANVAS TEXTURE ───────────────── */
function generateNasaBlackMarbleTexture() {
  const W = 4096;
  const H = 2048;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");

  // 1. OCEANS: Deep velvety obsidian navy (#020610)
  ctx.fillStyle = "#020610";
  ctx.fillRect(0, 0, W, H);

  const toX = (lon) => ((lon + 180) / 360) * W;
  const toY = (lat) => (1 - (lat + 90) / 180) * H;

  // 2. CONTINENTS: Dark Charcoal / Slate Graphite Landmasses (#0e131b)
  const drawLandmass = (coords) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX(coords[0]), toY(coords[1]));
    for (let i = 2; i < coords.length; i += 2) {
      ctx.lineTo(toX(coords[i]), toY(coords[i + 1]));
    }
    ctx.closePath();
    
    // Dark Charcoal continent base
    ctx.fillStyle = "#0e141c";
    ctx.fill();

    // Subtle dark slate coastline border (noticeable land edge without neon glow)
    ctx.strokeStyle = "#1a2432";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // Geographic continent boundaries
  // Eurasia Mainland
  drawLandmass([
    -9, 36, -9, 44, -2, 48, 5, 54, 10, 58, 18, 60, 28, 71, 60, 76, 100, 78,
    140, 72, 170, 66, 178, 64, 160, 55, 142, 50, 130, 42, 122, 38, 121, 31, 118, 24,
    108, 22, 104, 10, 100, 6, 98, 8, 92, 18, 88, 22, 80, 16, 76, 8, 72, 18,
    68, 24, 60, 26, 50, 30, 36, 32, 26, 36, 14, 38, 0, 36, -9, 36
  ]);

  // Philippine Archipelago (Accurate Islands)
  drawLandmass([120, 18.5, 122, 18.5, 122.5, 16, 124, 14, 123, 13, 120.5, 14, 119.8, 16, 120, 18.5]); // Luzon
  drawLandmass([122, 11.5, 124, 11.5, 124.5, 10, 123, 9.8, 122, 10.5, 122, 11.5]);                   // Visayas
  drawLandmass([122, 8.5, 126, 8.5, 126.5, 6, 124, 5.5, 122, 6.5, 122, 8.5]);                       // Mindanao
  drawLandmass([117, 8.5, 119.5, 11.2, 120, 11.8, 118.5, 9.8, 117, 8.5]);                           // Palawan

  // Japan & East Asia Islands
  drawLandmass([130, 31, 133, 34, 137, 35, 141, 39, 141, 45, 145, 44, 142, 41, 139, 36, 135, 33, 130, 31]);
  drawLandmass([120.5, 25.3, 122, 25, 121.5, 22, 120, 22, 120.5, 25.3]); // Taiwan
  drawLandmass([95, 5, 104, 2, 114, 4, 118, 5, 118, 1, 106, -6, 96, -5, 95, 5]); // Sumatra/Malaya
  drawLandmass([106, -6, 115, -7, 115, -8.5, 106, -8.5, 106, -6]); // Java
  drawLandmass([109, 4, 119, 4, 118, -4, 110, -4, 109, 4]); // Borneo

  // Africa
  drawLandmass([
    -17, 15, -5, 36, 10, 37, 32, 31, 35, 28, 44, 12, 51, 11, 42, -5,
    36, -20, 28, -34, 18, -34, 12, -18, 8, 4, -15, 11, -17, 15
  ]);

  // North America
  drawLandmass([
    -168, 66, -150, 60, -135, 58, -125, 48, -120, 34, -110, 24, -90, 18,
    -80, 25, -80, 32, -70, 42, -65, 45, -60, 52, -75, 62, -100, 70,
    -140, 70, -168, 66
  ]);

  // South America
  drawLandmass([
    -78, 10, -60, 10, -35, -5, -38, -18, -50, -30, -60, -45,
    -70, -55, -75, -45, -72, -18, -80, -2, -78, 10
  ]);

  // Australia
  drawLandmass([
    114, -22, 124, -14, 136, -12, 142, -10, 150, -22,
    152, -32, 146, -38, 136, -36, 124, -34, 114, -30, 114, -22
  ]);

  // 3. NASA NIGHT CITY LIGHTS (Stored in Alpha Channel for clean emission)
  const addCityLight = (lon, lat, radius, intensity) => {
    const cx = toX(lon);
    const cy = toY(lat);

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, `rgba(255, 255, 255, ${intensity.toFixed(2)})`);
    g.addColorStop(0.3, `rgba(255, 255, 255, ${(intensity * 0.6).toFixed(2)})`);
    g.addColorStop(0.7, `rgba(255, 255, 255, ${(intensity * 0.2).toFixed(2)})`);
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

    // Fine-grain arterial highway connections
    ctx.strokeStyle = `rgba(255, 255, 255, ${(intensity * 0.25).toFixed(2)})`;
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rnd(i + lon) * 0.5;
      const len = radius * (1.1 + rnd(i + lat) * 1.3);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
  };

  // PHILIPPINES FOCUS (Crisp Golden City Lights)
  addCityLight(121.05, 14.55, 24, 0.95); // Metro Manila (BGC, Makati, Ortigas)
  addCityLight(120.98, 14.60, 16, 0.85); // Manila Bay Area
  addCityLight(121.15, 14.25, 14, 0.8);  // Laguna / Calabarzon
  addCityLight(120.60, 15.05, 14, 0.75); // Clark / Pampanga
  addCityLight(123.90, 10.31, 18, 0.9);  // Metro Cebu
  addCityLight(125.60, 7.19, 16, 0.85);  // Metro Davao
  addCityLight(122.56, 10.72, 12, 0.7);  // Iloilo
  addCityLight(124.64, 8.48, 12, 0.7);   // Cagayan de Oro

  // ASIA-PACIFIC HUBS
  addCityLight(139.69, 35.68, 30, 0.95); // Tokyo
  addCityLight(135.50, 34.69, 22, 0.9);  // Osaka
  addCityLight(126.97, 37.56, 24, 0.9);  // Seoul
  addCityLight(121.47, 31.23, 26, 0.95); // Shanghai
  addCityLight(114.16, 22.31, 24, 0.92); // Hong Kong
  addCityLight(121.56, 25.03, 20, 0.88); // Taipei
  addCityLight(103.81, 1.35, 22, 0.92);  // Singapore
  addCityLight(100.50, 13.75, 20, 0.88); // Bangkok
  addCityLight(106.84, -6.20, 22, 0.88); // Jakarta
  addCityLight(101.68, 3.13, 18, 0.85);  // Kuala Lumpur

  // GLOBAL METROPOLISES
  addCityLight(0.12, 51.50, 24, 0.9);    // London
  addCityLight(2.35, 48.85, 22, 0.88);   // Paris
  addCityLight(-74.00, 40.71, 28, 0.95); // New York
  addCityLight(-118.24, 34.05, 24, 0.9); // Los Angeles
  addCityLight(55.27, 25.20, 18, 0.85);  // Dubai
  addCityLight(72.87, 19.07, 22, 0.88);  // Mumbai
  addCityLight(151.20, -33.86, 18, 0.82);// Sydney

  // DENSE PINPOINT TERRESTRIAL LIGHTS
  const addScatterDots = (lonMin, lonMax, latMin, latMax, count, intensity) => {
    for (let i = 0; i < count; i++) {
      const lon = lonMin + rnd(i + 100) * (lonMax - lonMin);
      const lat = latMin + rnd(i + 200) * (latMax - latMin);
      const x = toX(lon);
      const y = toY(lat);
      const size = 1.0 + rnd(i + 300) * 1.2;
      const a = intensity * (0.35 + rnd(i + 400) * 0.65);
      ctx.fillStyle = `rgba(255, 255, 255, ${a.toFixed(2)})`;
      ctx.fillRect(x, y, size, size);
    }
  };

  addScatterDots(120, 126, 6, 19, 180, 0.75);  // Philippines corridor
  addScatterDots(100, 145, 15, 45, 450, 0.55); // East Asia
  addScatterDots(95, 125, -10, 20, 350, 0.5);  // Southeast Asia
  addScatterDots(-10, 40, 35, 60, 480, 0.5);   // Europe
  addScatterDots(-125, -70, 28, 50, 520, 0.55);// North America

  return cv;
}

/* ── 3D SCENE CONFIGURATION ─────────────────────────────────────────── */
const EARTH_RADIUS = 145;

export default function BackgroundOrbit() {
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

    // Cursor parallax
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const onMouseMove = (e) => {
      const normX = (e.clientX / window.innerWidth - 0.5) * 2;
      const normY = (e.clientY / window.innerHeight - 0.5) * 2;
      targetParallaxX = normX * 0.035;
      targetParallaxY = normY * 0.02;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768;

      const camera = new THREE.PerspectiveCamera(46, W / H, 1, 3500);
      camera.position.set(0, 30, 240);
      camera.lookAt(0, -15, 0);

      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      mount.appendChild(renderer.domElement);

      /* 1. SKYBOX */
      const skyGeo = new THREE.SphereGeometry(1800, 24, 14);
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

      /* 2. STARFIELD */
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(STAR_POS.slice(), 3));
      starGeo.setAttribute("color", new THREE.BufferAttribute(STAR_COL.slice(), 3));
      const starMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: false,
      });
      scene.add(new THREE.Points(starGeo, starMat));
      disposables.push(starGeo, starMat);

      /* 3. EARTH MESH */
      const earthTex = new THREE.CanvasTexture(generateNasaBlackMarbleTexture());
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

      const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 120, 80);
      const earthMesh = new THREE.Mesh(earthGeo, earthMat);

      // Position Earth lower so the curved horizon sweeps across the background
      earthMesh.position.set(0, -118, -25);
      // Pre-orient towards the Western Pacific / Philippine Archipelago (Lon ~121°E, Lat ~14°N)
      earthMesh.rotation.y = 0.54;
      earthMesh.rotation.x = 0.22;
      scene.add(earthMesh);
      disposables.push(earthGeo, earthMat);

      /* 4. TIGHT ATMOSPHERE HALO */
      const haloMat = new THREE.ShaderMaterial({
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const haloGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.01, 64, 40);
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(earthMesh.position);
      scene.add(haloMesh);
      disposables.push(haloGeo, haloMat);

      let tick = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tick++;
        const time = tick * 0.016;

        currentParallaxX += (targetParallaxX - currentParallaxX) * 0.04;
        currentParallaxY += (targetParallaxY - currentParallaxY) * 0.04;

        // Smooth planetary rotation
        earthMesh.rotation.y += 0.00012;
        earthMat.uniforms.uTime.value = time;
        skyMat.uniforms.uTime.value = time;

        camera.position.x = currentParallaxX * 18;
        camera.position.y = 30 - currentParallaxY * 12;
        camera.lookAt(0, -15, 0);

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
      window.removeEventListener("mousemove", onMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeObs) resizeObs.disconnect();
      disposables.forEach((d) => d?.dispose?.());
      if (renderer) {
        renderer.dispose();
        if (mount.contains(renderer.domElement)) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />;
}
