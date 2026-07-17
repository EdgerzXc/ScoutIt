"use client";

import { useEffect, useRef } from "react";
import { isLiteMode } from "@/lib/liteMode";

/**
 * Layer 04 — Crust ("The Service Ecosystem")
 *
 * THEME 2: Subterranean Fiber-Optic Grid
 * THEME 3: Topographical Node Map
 */

// ---> TOGGLE THEME HERE <--- //
const THEME = 3; 
// --------------------------- //

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export default function BackgroundCrust() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Lite Mode: never start the WebGL scene on low-power devices — the CSS
    // layer background stays, only the animated canvas is skipped.
    if (isLiteMode()) return;

    let cancelled = false, frameId, renderer, resizeObs;
    const disposables = [];

    import("three").then((THREE) => {
      if (cancelled) return;

      const scene = new THREE.Scene();
      const W = mount.clientWidth || window.innerWidth;
      const H = mount.clientHeight || window.innerHeight;
      const isMobile = (W || window.innerWidth) < 768; // cheaper render on phones
      const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);

      renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2));
      mount.appendChild(renderer.domElement);

      const tickFunctions = [];

      if (THEME === 2) {
        // ==========================================
        // THEME 2: SUBTERRANEAN FIBER-OPTIC GRID
        // ==========================================
        camera.position.set(0, 15, 30);
        camera.lookAt(0, 0, -20);
        scene.fog = new THREE.FogExp2(0x020202, 0.025);

        // 1. The Grid
        const gridGeo = new THREE.PlaneGeometry(300, 300, 60, 60);
        const gridMat = new THREE.MeshBasicMaterial({ 
          color: 0x332200, wireframe: true, transparent: true, opacity: 0.12 
        });
        const grid = new THREE.Mesh(gridGeo, gridMat);
        grid.rotation.x = -Math.PI / 2;
        scene.add(grid);
        disposables.push(gridGeo, gridMat);

        // 2. Data Packets (Points moving along grid lines)
        const PACKETS = 250;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(PACKETS * 3);
        const pData = []; 
        for(let i=0; i<PACKETS; i++) {
          const axis = rnd(i) > 0.5 ? 'x' : 'z'; 
          const fixedLine = Math.floor(rnd(i*2)*60 - 30) * 5; 
          const start = rnd(i*3)*300 - 150;
          
          if (axis === 'x') {
            pPos[i*3] = start;
            pPos[i*3+1] = 0.5; 
            pPos[i*3+2] = fixedLine;
          } else {
            pPos[i*3] = fixedLine;
            pPos[i*3+1] = 0.5;
            pPos[i*3+2] = start;
          }

          pData.push({
            axis,
            speed: (0.3 + rnd(i*4)*0.7) * (rnd(i*5) > 0.5 ? 1 : -1)
          });
        }
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({
          color: 0xE8AE3C, size: 2.0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending
        });
        const packets = new THREE.Points(pGeo, pMat);
        scene.add(packets);
        disposables.push(pGeo, pMat);

        // Animation tick
        let time = 0;
        tickFunctions.push(() => {
          time += 0.002;
          const pos = pGeo.attributes.position.array;
          for(let i=0; i<PACKETS; i++) {
            const d = pData[i];
            const idx = d.axis === 'x' ? i*3 : i*3+2;
            pos[idx] += d.speed;
            if (pos[idx] > 150) pos[idx] = -150;
            if (pos[idx] < -150) pos[idx] = 150;
          }
          pGeo.attributes.position.needsUpdate = true;
          
          // Slowly pan camera
          camera.position.x = Math.sin(time) * 15;
          camera.lookAt(Math.sin(time)*5, 0, -20);
        });

      } else {
        // ==========================================
        // THEME 3: CROSS-SECTION EARTH METAPHOR
        // ==========================================
        camera.position.set(0, 0, 55); // Zoomed in heavily on the surface
        camera.lookAt(0, 0, 0);
        scene.fog = new THREE.FogExp2(0x060401, 0.009); // Very dark warm/gold fog for depth

        const surfaceY = 0; // Lowered surface to fill more screen

        // 1. Earth & Mineral Layers (Underground Rocks)
        for(let i=0; i<45; i++) {
           const rockGeo = new THREE.DodecahedronGeometry(3 + rnd(i)*6, 0);
           const rockMat = new THREE.MeshBasicMaterial({ color: 0x1A1000, transparent: true, opacity: 0.4 }); // Subtler depth
           const rock = new THREE.Mesh(rockGeo, rockMat);
           rock.position.set((rnd(i*2)*240)-120, (rnd(i*3)*80)-60, -5 - rnd(i*4)*20);
           rock.rotation.set(rnd(i), rnd(i*2), rnd(i*3));
           scene.add(rock);
           disposables.push(rockGeo, rockMat);
        }

        // 2. The Surface Line (The ground)
        const surfGeo = new THREE.BufferGeometry();
        surfGeo.setAttribute('position', new THREE.Float32BufferAttribute([-150, surfaceY, 0, 150, surfaceY, 0], 3));
        const surfMat = new THREE.LineBasicMaterial({ color: 0x221800, transparent: true, opacity: 0.6 });
        scene.add(new THREE.Line(surfGeo, surfMat));
        disposables.push(surfGeo, surfMat);

        // 3. Properties (City, Mountain, Forest, Ocean)
        const objectPositions = [];
        
        // A dazzling gold moon in the sky!
        const moonGeo = new THREE.SphereGeometry(3.5, 32, 32);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xF7C64E });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        moon.position.set(-35, 25, -20); // Moon in the background sky
        scene.add(moon);
        disposables.push(moonGeo, moonMat);

        // Soft golden lighting
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.15); // Slight base visibility
        // Position the light IN FRONT of the city (z: 20) so it illuminates the faces we see!
        const moonLight = new THREE.PointLight(0xF7C64E, 3.0, 200); 
        moonLight.position.set(-20, 30, 20); 
        scene.add(ambientLight, moonLight);

        // Make the properties dark gray basic material so they are GUARANTEED to be visible silhouettes!
        const propMat = new THREE.MeshBasicMaterial({ 
          color: 0x1F1F1F // Dark grey instead of pitch black, so it pops from the background
        });
        disposables.push(ambientLight, moonLight, propMat);

        for(let i=0; i<45; i++) {
           const type = rnd(i); // Randomize building type
           const x = (rnd(i*2)*240) - 120; // Spread wider across the screen
           
           const group = new THREE.Group();
           group.position.set(x, surfaceY, 0);
           
           // Unique material for the glowing windows
           const reactMat = new THREE.MeshBasicMaterial({ color: 0xE8AE3C, transparent: true, opacity: 0.05 });
           disposables.push(reactMat);

           if (type < 0.4) {
             // Tall Skyscraper
             const h = 20 + rnd(i*3)*30; // Very tall
             const towerGeo = new THREE.BoxGeometry(5, h, 5);
             const tower = new THREE.Mesh(towerGeo, propMat);
             tower.position.y = h / 2;
             group.add(tower);
             disposables.push(towerGeo);
             
             // Scattered individual lit rooms instead of one line
             const numRooms = 4 + Math.floor(rnd(i*2)*6); // 4 to 10 rooms
             for(let w=0; w<numRooms; w++) {
                const roomGeo = new THREE.BoxGeometry(0.8, 1.2, 5.2); // Protrudes slightly
                const room = new THREE.Mesh(roomGeo, reactMat);
                // Random height along the tower, random horizontal placement
                const roomY = 2 + rnd(i*4+w) * (h - 4);
                const roomX = -1.5 + rnd(i*5+w) * 3;
                room.position.set(roomX, roomY, 0);
                group.add(room);
                disposables.push(roomGeo);
             }
           } else if (type < 0.7) {
             // Wide Corporate Block
             const h = 10 + rnd(i*3)*15;
             const width = 12 + rnd(i*4)*10;
             const blockGeo = new THREE.BoxGeometry(width, h, 6);
             const block = new THREE.Mesh(blockGeo, propMat);
             block.position.y = h / 2;
             group.add(block);
             disposables.push(blockGeo);
             
             // Scattered individual lit rooms
             const numRooms = 6 + Math.floor(rnd(i*3)*8); // 6 to 14 rooms
             for(let w=0; w<numRooms; w++) {
                const roomGeo = new THREE.BoxGeometry(1.5, 1.2, 6.2);
                const room = new THREE.Mesh(roomGeo, reactMat);
                const roomY = 2 + rnd(i*4+w) * (h - 4);
                const roomX = -(width/2) + 1.5 + rnd(i*5+w) * (width - 3);
                room.position.set(roomX, roomY, 0);
                group.add(room);
                disposables.push(roomGeo);
             }
           } else {
             // Twin Towers Complex
             const h = 15 + rnd(i*3)*20;
             const tGeo = new THREE.BoxGeometry(3.5, h, 4);
             
             const t1 = new THREE.Mesh(tGeo, propMat);
             t1.position.set(-3, h/2, 0);
             const t2 = new THREE.Mesh(tGeo, propMat);
             t2.position.set(3, h/2, 0);
             group.add(t1, t2);
             disposables.push(tGeo);
             
             // Scattered rooms independently on both towers
             const numRooms = 3 + Math.floor(rnd(i*2)*5);
             for(let w=0; w<numRooms; w++) {
                const roomGeo = new THREE.BoxGeometry(0.8, 1.2, 4.2);
                
                // Room on tower 1
                const r1 = new THREE.Mesh(roomGeo, reactMat);
                const r1Y = 2 + rnd(i*4+w) * (h - 4);
                r1.position.set(-3, r1Y, 0);
                
                // Room on tower 2
                const r2 = new THREE.Mesh(roomGeo, reactMat);
                const r2Y = 2 + rnd(i*5+w) * (h - 4);
                r2.position.set(3, r2Y, 0);
                
                group.add(r1, r2);
                disposables.push(roomGeo);
             }
           }
           scene.add(group);
           objectPositions.push({ pos: new THREE.Vector3(x, surfaceY, 0), mat: reactMat });
        }

        // 4. Roots from Below going UP
        const rootCurves = [];
        objectPositions.forEach((obj, i) => {
           // Root starts deep below
           const rootStart = new THREE.Vector3((rnd(i*4)*40 - 20), -60, 0);
           const control = new THREE.Vector3(obj.pos.x + (rnd(i*5)*20 - 10), -20, 0);
           rootCurves.push(new THREE.QuadraticBezierCurve3(rootStart, control, obj.pos));
        });

        // Draw SOLID connecting root lines (dim background network)
        const rootLinesGeo = new THREE.BufferGeometry();
        const rootLinesPos = [];
        rootCurves.forEach(curve => {
          const pts = curve.getPoints(25);
          for(let i=0; i<25; i++) {
            rootLinesPos.push(pts[i].x, pts[i].y, pts[i].z);
            rootLinesPos.push(pts[i+1].x, pts[i+1].y, pts[i+1].z);
          }
        });
        rootLinesGeo.setAttribute('position', new THREE.Float32BufferAttribute(rootLinesPos, 3));
        const rootLinesMat = new THREE.LineBasicMaterial({ 
          color: 0x6E531A, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending 
        });
        scene.add(new THREE.LineSegments(rootLinesGeo, rootLinesMat));
        disposables.push(rootLinesGeo, rootLinesMat);

        // Overlay bright lines that randomly "grow" up the path
        const animatedRoots = [];
        rootCurves.forEach((curve, i) => {
          const numPoints = 50;
          const pts = curve.getPoints(numPoints);
          const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
          
          const brightMat = new THREE.LineBasicMaterial({ 
            color: 0xE8AE3C, 
            transparent: true, 
            opacity: 0.25,
            blending: THREE.AdditiveBlending 
          });
          
          const lineMesh = new THREE.Line(lineGeo, brightMat);
          lineGeo.setDrawRange(0, 0); // Start completely hidden
          scene.add(lineMesh);
          disposables.push(lineGeo, brightMat);

          animatedRoots.push({ 
            geo: lineGeo, 
            mat: brightMat, // Store material to animate opacity
            maxPoints: numPoints, 
            currentPoints: 0, 
            state: 'waiting', 
            waitTimer: rnd(i*7) * 600, 
            speed: 0.3 + rnd(i*5)*1.0,
            targetMat: objectPositions[i].mat // Store the property material
          });
        });

        // Animation
        let time = 0;
        tickFunctions.push(() => {
          time += 0.01;
          
          // Smoothly decay all property glows back down to ambient darkness
          objectPositions.forEach(obj => {
             if (obj.mat.opacity > 0.02) {
                obj.mat.opacity -= 0.01;
             }
          });

          // Animate the random growing lines and smooth property reactions
          animatedRoots.forEach(root => {
            if (root.state === 'waiting') {
               // Smoothly fade out the root line itself while it waits
               if (root.mat.opacity > 0) root.mat.opacity -= 0.015;
               
               root.waitTimer -= 1;
                if (root.waitTimer <= 0) {
                  root.state = 'growing';
                  root.mat.opacity = 0.25; // Snap back to lower brightness for new growth
                  root.currentPoints = 0;
                  root.geo.setDrawRange(0, 0); // Reset position
                }
             } else if (root.state === 'growing') {
                root.currentPoints += root.speed;
                if (root.currentPoints >= root.maxPoints) {
                  root.currentPoints = root.maxPoints;
                  root.state = 'holding';
                  root.waitTimer = 10 + Math.random()*30; 
                  // The root reached the top! Property glows brilliantly
                  root.targetMat.opacity = 0.5; 
                }
                root.geo.setDrawRange(0, Math.floor(root.currentPoints));
             } else if (root.state === 'holding') {
               // Hold the bright connection for a moment
               root.waitTimer -= 1;
               if (root.waitTimer <= 0) {
                 // Switch to waiting, which will slowly fade the line out naturally!
                 root.state = 'waiting';
                 root.waitTimer = 300 + Math.random() * 600; 
               }
             }
          });

          // Lock camera position to prevent motion sickness
          camera.position.x = 0;
          camera.lookAt(0, 0, 0);
        });
      }

      // ── RENDER LOOP ──
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        tickFunctions.forEach(fn => fn());
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
      console.error("[BackgroundCrust] failed:", err);
    });

    return () => {
      cancelled = true;
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
    <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0, background: "#020202" }}>
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />
      {/* subtle vignette scrim */}
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 70% 60% at 50% 44%, rgba(2,2,2,0.6) 0%, rgba(2,2,2,0.3) 40%, rgba(2,2,2,0) 70%)",
        }}
      />
    </div>
  );
}
