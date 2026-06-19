"use client";

import { useEffect, useRef } from "react";

/**
 * Layer 06 — The Core ("The Climax")
 *
 * The descent arrives at a radiant molten core — a glowing gold/white-hot sphere
 * at the center with energy, heat shimmer, orbiting embers, and intense bloom.
 *
 * Gold arc: Solid crystals (Crust) -> Flowing veins (Mantle) -> Incandescent blazing energy (Core).
 */

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── CORE SHADERS (Pulsar / Molten Sphere) ── */
const CORE_VERT = `
  uniform float uTime;
  uniform float uCrackOpen;
  varying vec3 vN;
  varying vec3 vPos;
  
  float noise(vec3 p) {
    return sin(p.x * 2.5 + uTime * 1.2) * sin(p.y * 2.5 + uTime * 0.8) * sin(p.z * 2.5 + uTime * 1.5);
  }

  void main() {
    vN = normalize(normal);
    vec3 p = position;
    
    float disp = noise(normalize(p)) * (1.2 + uCrackOpen * 2.0); 
    p += vN * disp;
    
    vPos = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const CORE_FRAG = `
  uniform float uTime;
  uniform float uCrackOpen;
  varying vec3 vN;
  varying vec3 vPos;

  float crackNoise(vec3 p) {
    float n = sin(p.x*1.5)*sin(p.y*1.5)*sin(p.z*1.5);
    n += 0.5 * sin(p.x*3.0 - uTime)*sin(p.y*3.0 + uTime)*sin(p.z*3.0);
    return n;
  }

  void main() {
    float d = length(vPos);
    
    // 1. Crust colors (Darker)
    vec3 colDark = vec3(0.05, 0.02, 0.01);
    vec3 colMid = vec3(0.6, 0.1, 0.0);
    vec3 crustColor = mix(colDark, colMid, smoothstep(17.0, 19.0, d));
    
    // 2. Inner Core colors (Pure liquid gold / white hot)
    vec3 pureGold = vec3(1.0, 0.8, 0.2);
    vec3 whiteHot = vec3(1.0, 1.0, 1.0);
    vec3 innerColor = mix(pureGold, whiteHot, smoothstep(18.0, 20.0, d));
    
    // 3. Crack logic
    float cNoise = crackNoise(vPos);
    float crackWidth = 0.02 + uCrackOpen * 2.5; 
    
    float isCrack = smoothstep(crackWidth + 0.1, crackWidth, abs(cNoise));
    
    innerColor += pureGold * (0.5 * sin(uTime * 5.0 * (1.0 + uCrackOpen)));

    vec3 finalColor = mix(crustColor, innerColor, isCrack);
    
    vec3 viewDir = normalize(cameraPosition - vPos);
    float rim = 1.0 - max(dot(viewDir, vN), 0.0);
    finalColor += colMid * smoothstep(0.6, 1.0, rim) * (1.0 - isCrack);
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/* ── HALO SHADER (Heat shimmer / atmospheric bloom) ── */
const HALO_VERT = `
  varying vec3 vN; varying vec3 vV;
  void main() { 
    vN = normalize(normalMatrix * normal); 
    vec4 vp = modelViewMatrix * vec4(position, 1.0); 
    vV = normalize(-vp.xyz); 
    gl_Position = projectionMatrix * vp; 
  }
`;
const HALO_FRAG = `
  uniform vec3 color; 
  uniform float power; 
  uniform float intensity;
  varying vec3 vN; varying vec3 vV;
  void main() { 
    float f = pow(1.0 - max(0.0, dot(vN, vV)), power) * intensity; 
    gl_FragColor = vec4(color, f); 
  }
`;

function createGlowTexture() {
  const W = 512, H = 512;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  const cx = W / 2, cy = H / 2, r = W / 2;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "rgba(255, 200, 100, 1.0)");
  g.addColorStop(0.2, "rgba(255, 120, 20, 0.8)");
  g.addColorStop(0.5, "rgba(150, 40, 5, 0.3)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  return cv;
}

export default function BackgroundCore({ isLoggedIn }) {
  const mountRef = useRef(null);
  const scrimRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false, frameId, renderer, resizeObs;
    const disposables = [];

    /* ── Scroll Listener for Crack/Intensity ── */
    // Real scroll progress for everyone — the core's slide + crack now follow
    // the actual scroll into the inner core (logged-in users only fall back to
    // "fully open" if the page somehow can't scroll).
    let scrollProgress = 0.0;
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) scrollProgress = isLoggedIn ? 1 : 0;
      else scrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    };
    window.addEventListener("scroll", onScroll);
    onScroll(); // initial sync

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x060100, 0.008); // dense warm-black void

      const coreGroup = new THREE.Group();
      coreGroup.position.x = 25; // Shift to the right to balance the dashboard UI
      scene.add(coreGroup);

      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768; // cheaper render on phones
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.5, 2000);

      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: "high-performance" });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3; // slightly brighter for climax
      mount.appendChild(renderer.domElement);

      /* ── THE CORE (Molten/Pulsar Sphere) ── */
      const CORE_R = 18;
      const coreGeo = new THREE.IcosahedronGeometry(CORE_R, 32); // high detail for displacement
      const coreMat = new THREE.ShaderMaterial({
        uniforms: { 
          uTime: { value: 0 },
          uCrackOpen: { value: 0 }
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreGroup.add(coreMesh);
      disposables.push(coreGeo, coreMat);

      /* ── INNER HALO / BLOOM (Additive Sprite) ── */
      const glowTex = new THREE.CanvasTexture(createGlowTexture());
      disposables.push(glowTex);
      const glowMat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowSprite = new THREE.Sprite(glowMat);
      glowSprite.scale.set(CORE_R * 6, CORE_R * 6, 1);
      coreGroup.add(glowSprite);
      disposables.push(glowMat);

      /* ── OUTER ATMOSPHERE (Heat Shimmer) ── */
      const atmGeo = new THREE.SphereGeometry(CORE_R + 1.5, 64, 40);
      const atmMat = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Vector3(1.0, 0.4, 0.05) },
          power: { value: 3.5 },
          intensity: { value: 1.2 }
        },
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const atmMesh = new THREE.Mesh(atmGeo, atmMat);
      coreGroup.add(atmMesh);
      disposables.push(atmGeo, atmMat);

      /* ── ORBITING EMBERS (Points) ── */
      const EMBER_COUNT = 3000;
      const ePos = new Float32Array(EMBER_COUNT * 3);
      const eSize = new Float32Array(EMBER_COUNT);
      const eSpeed = new Float32Array(EMBER_COUNT);
      const eOffset = new Float32Array(EMBER_COUNT); // phase offset
      const eTint = new Float32Array(EMBER_COUNT * 3); // per-ember colour

      /* Same ember count — just a colour mix so the blitz reads as fire +
         white-hot sparks + dark ash, instead of one flat orange. */
      const EMBER_FIRE = [1.0, 0.5, 0.05];   // molten orange-gold
      const EMBER_WHITE = [1.0, 0.96, 0.92]; // white-hot spark
      const EMBER_ASH = [0.04, 0.04, 0.05];  // dark ash / near-black

      for (let i = 0; i < EMBER_COUNT; i++) {
        // distribute mostly in a torus/disc shape around the core
        const angle = rnd(i * 1.1) * Math.PI * 2;
        const radius = CORE_R + 10 + rnd(i * 2.2) * 120;

        // thickness of the disc
        const yDist = (rnd(i * 3.3) - 0.5) * (rnd(i * 4.4) * 40);

        ePos[i * 3] = Math.cos(angle) * radius;
        ePos[i * 3 + 1] = yDist;
        ePos[i * 3 + 2] = Math.sin(angle) * radius;

        eSize[i] = 0.5 + rnd(i * 5.5) * 1.5;
        eSpeed[i] = 0.2 + rnd(i * 6.6) * 1.2;
        eOffset[i] = angle;

        // colour split: mostly fire, with white sparks and dark ash mixed in
        const cr = rnd(i * 7.7);
        const tint = cr < 0.56 ? EMBER_FIRE : cr < 0.78 ? EMBER_WHITE : EMBER_ASH;
        eTint[i * 3] = tint[0];
        eTint[i * 3 + 1] = tint[1];
        eTint[i * 3 + 2] = tint[2];
      }

      const emberGeo = new THREE.BufferGeometry();
      emberGeo.setAttribute("position", new THREE.BufferAttribute(ePos, 3));
      emberGeo.setAttribute("size", new THREE.BufferAttribute(eSize, 1));
      emberGeo.setAttribute("speed", new THREE.BufferAttribute(eSpeed, 1));
      emberGeo.setAttribute("offset", new THREE.BufferAttribute(eOffset, 1));
      emberGeo.setAttribute("aTint", new THREE.BufferAttribute(eTint, 3));

      // Custom Shader for Points so we can animate rotation in the GPU
      const EMBER_V = `
        uniform float uTime;
        uniform float uScroll;
        attribute float size;
        attribute float speed;
        attribute float offset;
        attribute vec3 aTint;
        varying float vAlpha;
        varying vec3 vTint;
        void main() {
          vTint = aTint;
          float actualSpeed = speed * (1.0 + uScroll * 4.0);
          float a = offset + uTime * actualSpeed * 0.2;
          float r = length(position.xz);
          vec3 p = position;
          p.x = cos(a) * r;
          p.z = sin(a) * r;
          
          // bobbing up and down
          p.y += sin(uTime * actualSpeed * 2.0 + offset) * 2.0;

          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = size * (1.0 + uScroll * 1.5) * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          
          // Fade based on distance to core
          vAlpha = smoothstep(150.0, 20.0, r) * (0.8 + uScroll * 0.2);
        }
      `;
      const EMBER_F = `
        varying float vAlpha;
        varying vec3 vTint;
        void main() {
          // Circular particle
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;

          // each ember keeps its own colour (fire / white / ash)
          gl_FragColor = vec4(vTint, vAlpha * (1.0 - (d * 2.0)));
        }
      `;

      const emberMat = new THREE.ShaderMaterial({
        uniforms: { 
          uTime: { value: 0 },
          uScroll: { value: 0 }
        },
        vertexShader: EMBER_V,
        fragmentShader: EMBER_F,
        transparent: true,
        blending: THREE.NormalBlending, // normal (not additive) so dark ash embers are visible
        depthWrite: false,
      });

      const embers = new THREE.Points(emberGeo, emberMat);
      // Tilt the ember disc slightly
      embers.rotation.x = 0.15;
      embers.rotation.z = -0.1;
      coreGroup.add(embers);
      disposables.push(emberGeo, emberMat);

      /* ── DATA PACKETS (Signals shooting up to Mantle) ── */
      const PACKETS = 40; // Reduced amount for casual timing
      const pGeo = new THREE.BoxGeometry(0.4, 15, 0.4);
      const pMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.9, 
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const packets = new THREE.InstancedMesh(pGeo, pMat, PACKETS);
      
      const packetData = [];
      const dummy = new THREE.Object3D();
      for(let i=0; i<PACKETS; i++) {
         packetData.push({
           a: rnd(i*2) * Math.PI * 2,
           r: rnd(i*3) * 10, // Tightly clustered in a beam
           y: CORE_R + rnd(i*4) * 400, // Spread upwards
           speed: 3 + rnd(i*5) * 5, // Fast upward speed
           wait: rnd(i*6) * 300 // Random initial wait frames!
         });
      }
      coreGroup.add(packets);
      disposables.push(pGeo, pMat);

      /* ── LIGHTS ── */
      const coreLight = new THREE.PointLight(0xffaa33, 4.0, 400, 1.5);
      coreGroup.add(coreLight);

      /* ── CAMERA PATH ── */
      const posStart = new THREE.Vector3(0, 300, 0); // Drop straight down from Mantle
      const posEnd = new THREE.Vector3(0, 0, 75); // Stop right in front of the Core
      
      const lookStart = new THREE.Vector3(0, 0, 0);
      const lookEnd = new THREE.Vector3(0, 0, 0);

      const DESCENT_FRAMES = 300; // Fast 5-second cinematic drop
      let progress = 0, idleT = 0;
      let startTime = performance.now();

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        const time = (performance.now() - startTime) * 0.001;

        const scrollVal = scrollProgress;

        // Slide the core from the right (outer core — text sits on the left)
        // toward the left as you scroll down into the inner core.
        coreGroup.position.x = 25 - scrollVal * 50;

        // Keep the legibility scrim on the text side (left → right with scroll)
        // so the moving core never washes out the copy.
        if (scrimRef.current) {
          const sx = (30 + scrollVal * 40).toFixed(1);
          scrimRef.current.style.background =
            "radial-gradient(ellipse 70% 60% at " + sx + "% 50%, rgba(10,5,2,0.85) 0%, rgba(10,5,2,0.5) 45%, rgba(10,5,2,0.05) 80%, rgba(10,5,2,0) 100%)";
        }

        // Update uniforms
        coreMat.uniforms.uTime.value = time;
        coreMat.uniforms.uCrackOpen.value = scrollVal;
        
        emberMat.uniforms.uTime.value = time;
        emberMat.uniforms.uScroll.value = scrollVal;
        
        // Pulse the halo and light
        atmMat.uniforms.intensity.value = 1.0 + Math.sin(time * 3.0) * 0.3 + scrollVal * 1.5;
        coreLight.intensity = 4.0 + Math.sin(time * 3.0) * 0.5 + scrollVal * 3.0;
        glowSprite.scale.setScalar(CORE_R * 6 + Math.sin(time * 3.0) * 5 + scrollVal * 20);

        // Core very slow rotation
        coreMesh.rotation.y = time * 0.1;
        coreMesh.rotation.z = time * 0.05;

        // Shoot data packets upward casually!
        for(let i=0; i<PACKETS; i++) {
           const pd = packetData[i];
           
           if (pd.wait > 0) {
             pd.wait--;
             dummy.position.set(0, -1000, 0); // Hide while waiting
           } else {
             pd.y += pd.speed;
             dummy.position.set(Math.cos(pd.a) * pd.r, pd.y, Math.sin(pd.a) * pd.r);
             
             // If packet shoots past the top, reset it to erupt later with casual timing
             if (pd.y > 400) {
               pd.y = CORE_R;
               // Wait between 1 to 5 seconds (assuming ~60fps) before firing again
               pd.wait = 60 + rnd(i * 7.7 + time) * 240;
             }
           }
           
           dummy.updateMatrix();
           packets.setMatrixAt(i, dummy.matrix);
        }
        packets.instanceMatrix.needsUpdate = true;

        if (progress < 1) {
          progress = Math.min(progress + 1 / DESCENT_FRAMES, 1);
          const t = easeInOut(progress);
          camera.position.lerpVectors(posStart, posEnd, t);
          camera.lookAt(new THREE.Vector3().lerpVectors(lookStart, lookEnd, t));
        } else {
          idleT += 0.001;
          // Very slow, majestic drift around the core
          camera.position.x = posEnd.x + Math.sin(idleT * 0.5) * 8;
          camera.position.y = posEnd.y + Math.sin(idleT * 0.3) * 4;
          camera.position.z = posEnd.z + Math.cos(idleT * 0.5) * 4;
          camera.lookAt(lookEnd);
        }

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
    }).catch((err) => {
      console.error("[BackgroundCore] failed:", err);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeObs) resizeObs.disconnect();
      disposables.forEach((d) => d?.dispose?.());
      if (renderer) {
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {/* Vignette scrim for text legibility — its dark side tracks the text as
          the core slides across (updated each frame in the animation loop). */}
      <div
        ref={scrimRef}
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          background: "radial-gradient(ellipse 70% 60% at 30% 50%, rgba(10,5,2,0.85) 0%, rgba(10,5,2,0.5) 45%, rgba(10,5,2,0.05) 80%, rgba(10,5,2,0) 100%)",
        }}
      />
    </div>
  );
}
