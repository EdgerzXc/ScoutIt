"use client";

import { useEffect, useRef } from "react";

/**
 * Layer 05 — Mantle ("The Deep Archive")
 *
 * Reimagined from magma to a massive, dark, highly structured Data Silo.
 * This represents ScoutIt's thickest layer: the massive database and intelligence reservoir.
 * Descent straight down a high-tech server shaft lined with glowing gold data nodes.
 */

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const TUBE_R = 75;
const TUBE_H = 1800;

export default function BackgroundMantle() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cancelled = false, frameId, renderer, resizeObs;
    const disposables = [];

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050402, 0.005); // Very dark brown/gold fog

      const W = mount.clientWidth  || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const camera = new THREE.PerspectiveCamera(65, W / H, 0.5, 2000);
      camera.position.set(0, TUBE_H * 0.45, 0); // Looking straight down the silo

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      mount.appendChild(renderer.domElement);

      /* ── CENTRAL DATA TRUNK (The Core Beam) ── */
      const beamGeo = new THREE.CylinderGeometry(4, 4, TUBE_H, 24);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xFFB800,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      scene.add(beam); disposables.push(beamGeo, beamMat);

      const coreGlowGeo = new THREE.CylinderGeometry(15, 15, TUBE_H, 24);
      const coreGlowMat = new THREE.MeshBasicMaterial({
        color: 0xFF9900,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      });
      const coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
      scene.add(coreGlow); disposables.push(coreGlowGeo, coreGlowMat);

      /* ── THE DATA SILO WALLS (Endless Shelves) ── */
      const RINGS_COUNT = 90;
      const RING_SPACING = 20;

      // Group to hold all active lights so we can pulse them
      const activeDataNodes = [];

      for(let r=0; r<RINGS_COUNT; r++) {
         const y = (TUBE_H / 2) - (r * RING_SPACING);
         const ringGroup = new THREE.Group();
         ringGroup.position.y = y;
         
         // Base structural shelf
         const shelfGeo = new THREE.TorusGeometry(TUBE_R, 1.5, 8, 48);
         const shelfMat = new THREE.MeshStandardMaterial({ 
           color: 0x090909, 
           roughness: 0.8, 
           metalness: 0.5 
         });
         const shelf = new THREE.Mesh(shelfGeo, shelfMat);
         shelf.rotation.x = Math.PI / 2;
         ringGroup.add(shelf);
         disposables.push(shelfGeo, shelfMat);
         
         // Server Data Blocks on this shelf
         const numBlocks = 16 + Math.floor(rnd(r) * 20);
         for(let b=0; b<numBlocks; b++) {
            const a = rnd(r*10 + b) * Math.PI * 2;
            const w = 3 + rnd(r+b)*10;
            const h = 5 + rnd(r*2+b)*15;
            const d = 4 + rnd(r*3+b)*8;
            
            const isActive = rnd(r*5+b) > 0.85; // 15% of blocks are active processing nodes
            
            const blockGeo = new THREE.BoxGeometry(w, h, d);
            const blockMat = new THREE.MeshStandardMaterial({ 
              color: isActive ? 0xFFC929 : 0x0D0D0D,
              emissive: isActive ? 0xFFB800 : 0x000000,
              emissiveIntensity: isActive ? 0.8 : 0,
              roughness: 0.5,
              metalness: 0.8
            });
            const block = new THREE.Mesh(blockGeo, blockMat);
            
            const rOffset = TUBE_R - (d/2) + rnd(r)*3;
            block.position.set(Math.cos(a) * rOffset, h/2, Math.sin(a) * rOffset);
            block.rotation.y = -a; // Face the center
            
            ringGroup.add(block);
            disposables.push(blockGeo, blockMat);

            if (isActive) {
               activeDataNodes.push({ mesh: block, material: blockMat, seed: rnd(r*b) });
            }
         }
         scene.add(ringGroup);
      }

      /* ── LIGHTING ── */
      scene.add(new THREE.AmbientLight(0xFFFFFF, 0.05)); // Extremely dark, only highlights geometry

      const cameraLight = new THREE.PointLight(0xFFB800, 2.5, 250); // Illuminates the shaft as we fall
      scene.add(cameraLight);

      // Core light pouring up from the bottom
      const yBot = -TUBE_H / 2;
      const coreLight = new THREE.PointLight(0xFFC929, 5.0, 600);
      coreLight.position.set(0, yBot + 100, 0);
      scene.add(coreLight);

      /* ── RAW MAGMA AT THE BOTTOM ── */
      // Glowing magma pool at the base of the silo so it feels like a real earth mantle
      const poolGeo = new THREE.CircleGeometry(TUBE_R * 1.5, 48);
      const poolMat = new THREE.MeshBasicMaterial({
        color: 0xff3a00, // Deep hot magma red/orange
        transparent: true, 
        opacity: 0.8,
        blending: THREE.AdditiveBlending, 
        depthWrite: false
      });
      const pool = new THREE.Mesh(poolGeo, poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = yBot + 5;
      scene.add(pool); disposables.push(poolGeo, poolMat);

      // Huge outer halo of magma heat
      const haloGeo = new THREE.CircleGeometry(TUBE_R * 2.5, 48);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xff1a00, 
        transparent: true, 
        opacity: 0.3,
        blending: THREE.AdditiveBlending, 
        depthWrite: false
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = yBot + 2;
      scene.add(halo); disposables.push(haloGeo, haloMat);

      // Rugged molten rock cavern walls surrounding the magma pool
      const rockGroup = new THREE.Group();
      rockGroup.position.y = yBot + 5;
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x0a0300, 
        roughness: 0.9,
        emissive: 0x2a0500, // Faint red heat from the magma
        emissiveIntensity: 0.6
      });
      for(let i=0; i<45; i++) {
        const a = rnd(i*3.1) * Math.PI * 2;
        const rOff = TUBE_R * 0.85 + rnd(i*2.2) * 15;
        const h = 30 + rnd(i*1.5) * 90; // Jagged varying heights
        const rockGeo = new THREE.ConeGeometry(15 + rnd(i)*10, h, 6);
        const rock = new THREE.Mesh(rockGeo, rockMat);
        
        rock.position.set(Math.cos(a) * rOff, h/2 - 10, Math.sin(a) * rOff);
        
        // Tilt the rocks inward slightly to form a rough crater
        rock.lookAt(0, h/2 - 10, 0);
        rock.rotation.x -= Math.PI/4;
        
        rockGroup.add(rock);
        disposables.push(rockGeo);
      }
      scene.add(rockGroup); disposables.push(rockMat);

      /* ── DATA PACKETS (Shooting up and down the beam) ── */
      const PACKETS = 150;
      const pGeo = new THREE.BoxGeometry(0.5, 12, 0.5);
      const pMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF, 
        transparent: true, 
        opacity: 0.8, 
        blending: THREE.AdditiveBlending 
      });
      const packets = new THREE.InstancedMesh(pGeo, pMat, PACKETS);
      disposables.push(pGeo, pMat);

      const packetData = [];
      const dummy = new THREE.Object3D();
      for(let i=0; i<PACKETS; i++) {
         const isUp = rnd(i) > 0.5;
         packetData.push({
           a: rnd(i*2) * Math.PI * 2,
           r: 8 + rnd(i*3) * 15, // Hugging the central beam
           y: yBot + rnd(i*4) * TUBE_H,
           speed: (isUp ? 1 : -1) * (2 + rnd(i*5) * 4)
         });
      }
      scene.add(packets);

      /* ── ANIMATION ── descend down the silo ── */
      const DESCENT_FRAMES = 2400;
      const yStart = TUBE_H * 0.42;
      const yEnd   = yBot + 150;
      let progress = 0, tick = 0;

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tick++;

        // Pulse the active server nodes
        activeDataNodes.forEach(node => {
          // Subtle pulse between 0.4 and 1.0 intensity
          node.material.emissiveIntensity = 0.7 + Math.sin(tick * 0.05 + node.seed * 100) * 0.3;
        });

        // Move Data Packets
        const camY = camera.position.y;
        for(let i=0; i<PACKETS; i++) {
           const pd = packetData[i];
           pd.y += pd.speed;
           
           // Wrap around camera
           if (pd.speed > 0 && pd.y > camY + 200) pd.y = camY - 600 - rnd(i)*200;
           if (pd.speed < 0 && pd.y < camY - 600) pd.y = camY + 200 + rnd(i)*200;

           dummy.position.set(Math.cos(pd.a) * pd.r, pd.y, Math.sin(pd.a) * pd.r);
           dummy.updateMatrix();
           packets.setMatrixAt(i, dummy.matrix);
        }
        packets.instanceMatrix.needsUpdate = true;

        // Camera Descent
        if (progress < 1) {
          progress = Math.min(progress + 1 / DESCENT_FRAMES, 1);
        }
        const t = easeInOut(progress);
        const currentY = yStart + (yEnd - yStart) * t;

        // Slow rotation looking down the shaft
        const yaw = t * Math.PI * 1.5;
        
        // Camera spirals slightly away from absolute center to see the beam
        camera.position.set(Math.sin(yaw) * 15, currentY, Math.cos(yaw) * 15);
        
        // Always look down towards the core
        camera.lookAt(0, currentY - 100, 0);
        
        // The light follows the camera to illuminate the shelves as we pass them
        cameraLight.position.copy(camera.position);

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
      console.error("[BackgroundMantle] failed:", err);
    });

    return () => {
      cancelled = true;
      if (frameId)   cancelAnimationFrame(frameId);
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
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 72% 62% at 50% 44%, rgba(10,5,2,0.80) 0%, rgba(10,5,2,0.48) 38%, rgba(10,5,2,0.06) 72%, rgba(10,5,2,0) 100%)",
        }}
      />
    </div>
  );
}
