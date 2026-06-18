"use client";

import { useEffect, useRef } from "react";

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── 4 000 STARS ─────────────────────────────────────────────────────── */
const STAR_COUNT = 4000;
const STAR_POS   = new Float32Array(STAR_COUNT * 3);
const STAR_COL   = new Float32Array(STAR_COUNT * 3);
for (let i = 0; i < STAR_COUNT; i++) {
  const r     = 220 + rnd(i*5+1)*620;
  const theta = rnd(i*5+2)*Math.PI*2;
  const phi   = Math.acos(2*rnd(i*5+3)-1);
  STAR_POS[i*3]   = r*Math.sin(phi)*Math.cos(theta);
  STAR_POS[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
  STAR_POS[i*3+2] = r*Math.cos(phi);
  const warm = rnd(i*5+4) < 0.60;
  const bright = !warm && rnd(i*5+4) > 0.85;
  if (warm)      { STAR_COL[i*3]=0.48; STAR_COL[i*3+1]=0.36; STAR_COL[i*3+2]=0.0; } // Muted Gold
  else if (bright) { STAR_COL[i*3]=1.0; STAR_COL[i*3+1]=0.72; STAR_COL[i*3+2]=0.0; } // Primary Gold
  else           { STAR_COL[i*3]=0.2; STAR_COL[i*3+1]=0.2; STAR_COL[i*3+2]=0.25; } // Dim white/blue
}

/* ── SHADERS ─────────────────────────────────────────────────────────── */
const SKY_VERT = `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const SKY_FRAG = `
uniform float uTime;
varying vec3 vDir;

float hash(float n) { return fract(sin(n) * 43758.5453123); }
float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n +   0.0), hash(n +   1.0), f.x),
                   mix(hash(n +  57.0), hash(n +  58.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
}
float fbm(vec3 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = p * 2.02;
    f += 0.2500 * noise(p); p = p * 2.03;
    f += 0.1250 * noise(p); p = p * 2.01;
    f += 0.0625 * noise(p);
    return f;
}

void main(){
  vec3 d = normalize(vDir);
  
  /* 95% Deep Black Space */
  vec3 c = vec3(0.03, 0.03, 0.035);
  
  /* Magellanic Cloud (Nebula) Structure */
  float n1 = fbm(d * 3.5 + vec3(uTime * 0.02, uTime * 0.01, 0.0));
  
  /* Tight threshold ensures most of the sky remains black */
  float cloud1 = smoothstep(0.35, 0.70, n1); 
  c += vec3(0.48, 0.36, 0.0) * cloud1 * 1.5; // Muted gold (#7A5C00)
  
  /* Inner glowing gold filaments */
  float core = smoothstep(0.55, 0.85, n1);
  c += vec3(1.0, 0.72, 0.0) * core * 2.5; // Primary gold (#FFB800)

  gl_FragColor=vec4(c,1.);
}`;

/* Night-side Earth — limb darkening, city lights primary visual */
const EARTH_VERT = `
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main(){
    vUv=uv;
    vN=normalize(normalMatrix*normal);
    vec4 vp=modelViewMatrix*vec4(position,1.); vV=normalize(-vp.xyz);
    gl_Position=projectionMatrix*vp;
  }`;
const EARTH_FRAG = `
  uniform sampler2D nightMap;
  uniform float uTime;
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main(){
    vec4 tex=texture2D(nightMap,vUv);
    vec3 col=tex.rgb;
    float lum=dot(col,vec3(0.3,0.59,0.11));

    /* 3D Volume lighting — makes the sphere look solid instead of hollow */
    vec3 fakeLightDir = normalize(vec3(-0.8, 0.6, 1.0));
    float diffuse = max(0.0, dot(normalize(vN), fakeLightDir));
    float facing = max(0.0, dot(normalize(vN), normalize(vV)));
    float limb = pow(facing, 0.22);
    
    /* Base solid sphere color (ocean/ambient land) */
    vec3 volumeColor = vec3(0.01, 0.02, 0.04) + vec3(0.02, 0.05, 0.09) * diffuse;
    
    /* Ensure the earth never drops below this solid volume color */
    col = max(volumeColor, col);

    /* lift the land/city textures */
    float lift=smoothstep(0.0,0.14,lum);
    col=mix(col*0.8, col*1.6, lift);

    /* extra warmth boost on bright city/land pixels */
    float bright=smoothstep(0.12,0.45,lum);
    col+=vec3(0.28,0.14,0.01)*bright;

    /* Aurora Borealis & Australis */
    float nPole = smoothstep(0.82, 0.88, vUv.y) * smoothstep(0.96, 0.88, vUv.y);
    float sPole = smoothstep(0.18, 0.12, vUv.y) * smoothstep(0.04, 0.12, vUv.y);
    float auroraArea = nPole + sPole;
    
    if (auroraArea > 0.0) {
      float aNoise = sin(vUv.x * 40.0 + uTime * 0.8) * sin(vUv.x * 15.0 - uTime * 0.4);
      aNoise = max(0.0, aNoise);
      float curtain = sin(vUv.x * 150.0 + uTime * 2.0) * 0.5 + 0.5;
      vec3 auroraColor = vec3(0.1, 0.9, 0.5); // Bright neon green
      col += auroraColor * auroraArea * aNoise * (curtain * 0.5 + 0.5) * 3.0 * limb; 
    }

    /* softer edge vignette — keeps lights visible near rim but prevents harsh jagged edges */
    col*=mix(0.0,1.0,smoothstep(0.0,0.08,facing));

    gl_FragColor=vec4(col,1.);
  }`;

/* Atmosphere Fresnel */
const ATM_VERT = `
  varying vec3 vN; varying vec3 vV;
  void main(){ vN=normalize(normalMatrix*normal); vec4 vp=modelViewMatrix*vec4(position,1.); vV=normalize(-vp.xyz); gl_Position=projectionMatrix*vp; }`;
const ATM_FRAG = `
  uniform vec3 color; uniform float power; uniform float intensity;
  varying vec3 vN; varying vec3 vV;
  void main(){ float f=pow(1.-max(0.,dot(vN,vV)),power)*intensity; gl_FragColor=vec4(color,f); }`;

/* ── EARTH TEXTURES ──────────────────────────────────────────────────── */
function createNightCanvas() {
  const W=2048, H=1024;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const ctx=cv.getContext("2d");

  /* LAYER 1: deep navy ocean */
  ctx.fillStyle="#030c1a"; ctx.fillRect(0,0,W,H);

  /* LAYER 2: land masses — prominent dark slate blue */
  const landBlob=(x,y,rx,ry,a)=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    g.addColorStop(0,   `rgba(15,35,60,${a})`);
    g.addColorStop(0.5, `rgba(10,25,45,${(a*0.5).toFixed(2)})`);
    g.addColorStop(1,   "rgba(3,12,26,0)");
    ctx.fillStyle=g; ctx.fillRect(x-rx,y-ry,rx*2,ry*2);
  };
  /* North America */ landBlob(225,335, 115,90, 0.55);
  /* South America */ landBlob(288,562,  58,98, 0.50);
  /* Europe */        landBlob(548,328,  55,42, 0.58);
  /* Africa */        landBlob(568,482,  80,112,0.52);
  /* Middle East */   landBlob(632,412,  44,40, 0.50);
  /* India */         landBlob(688,470,  38,54, 0.50);
  /* SE Asia */       landBlob(778,492,  50,32, 0.48);
  /* East Asia */     landBlob(762,372,  72,58, 0.52);
  /* Australia */     landBlob(842,620,  70,54, 0.50);
  /* Russia */        landBlob(722,278, 185,58, 0.45);
  /* Equatorial Africa */ landBlob(548,515,  72,88, 0.48);
  /* SE Asia islands */   landBlob(790,535,  55,38, 0.46);
  /* Central America */   landBlob(205,462,  30,24, 0.44);

  /* LAYER 4: city lights — small scattered dots, soft glow only at dense centres */
  const cluster=(x,y,r,a)=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,  `rgba(255,210,80,${(a*0.55).toFixed(2)})`);
    g.addColorStop(0.4,`rgba(255,175,35,${(a*0.22).toFixed(2)})`);
    g.addColorStop(1,  "rgba(200,120,0,0)");
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  };
  const dot=(x,y,s,a)=>{ ctx.fillStyle=`rgba(255,205,70,${a})`; ctx.fillRect(x,y,s,s); };

  /* Europe — dense scattered dots, soft centre glow */
  cluster(560,342,40,0.70);
  for(let i=0;i<140;i++) dot(475+rnd(i+1000)*200,285+rnd(i+1001)*110,1,0.18+rnd(i+1003)*0.35);
  /* UK */
  cluster(520,308,18,0.60);
  for(let i=0;i<30;i++) dot(500+rnd(i+1050)*40,290+rnd(i+1051)*38,1,0.18+rnd(i+1052)*0.30);
  /* East coast US */
  cluster(222,370,28,0.55); cluster(198,355,14,0.50);
  for(let i=0;i<80;i++) dot(148+rnd(i+1100)*155,328+rnd(i+1101)*100,1,0.14+rnd(i+1103)*0.28);
  /* Japan */
  cluster(808,352,22,0.62);
  for(let i=0;i<45;i++) dot(784+rnd(i+1200)*52,330+rnd(i+1201)*44,1,0.18+rnd(i+1203)*0.28);
  /* East China/Korea */
  cluster(762,388,28,0.58);
  for(let i=0;i<60;i++) dot(710+rnd(i+1300)*105,348+rnd(i+1301)*80,1,0.14+rnd(i+1303)*0.25);
  /* India */
  cluster(684,460,22,0.52);
  for(let i=0;i<40;i++) dot(645+rnd(i+1400)*88,438+rnd(i+1401)*88,1,0.12+rnd(i+1402)*0.22);
  /* SE Asia */  cluster(768,500,16,0.48);
  /* Middle East */ cluster(628,406,16,0.46);
  for(let i=0;i<20;i++) dot(608+rnd(i+1500)*48,390+rnd(i+1501)*40,1,0.14+rnd(i+1502)*0.22);
  /* West Africa */ cluster(512,492,12,0.36);
  /* Brazil */    cluster(298,588,14,0.40); cluster(270,608,10,0.34);
  for(let i=0;i<30;i++) dot(248+rnd(i+1800)*80,570+rnd(i+1801)*80,1,0.12+rnd(i+1802)*0.22);
  /* West US */   cluster(158,386,14,0.44);
  for(let i=0;i<25;i++) dot(138+rnd(i+1600)*55,370+rnd(i+1601)*50,1,0.12+rnd(i+1602)*0.20);
  /* South Africa */ cluster(584,678,12,0.38);
  for(let i=0;i<18;i++) dot(564+rnd(i+1900)*48,662+rnd(i+1901)*36,1,0.12+rnd(i+1902)*0.20);
  /* Australia */ cluster(882,638,14,0.42);
  for(let i=0;i<20;i++) dot(862+rnd(i+1700)*44,618+rnd(i+1701)*40,1,0.14+rnd(i+1702)*0.22);
  /* Equatorial Africa — Nairobi, Lagos, Cairo coastal band */
  cluster(556,530,14,0.40); cluster(532,508,10,0.35);
  for(let i=0;i<50;i++) dot(490+rnd(i+2000)*140,475+rnd(i+2001)*110,1,0.10+rnd(i+2002)*0.20);
  /* SE Asia equatorial — Jakarta, KL, Manila, Singapore */
  cluster(780,540,18,0.50); cluster(806,524,12,0.46);
  for(let i=0;i<55;i++) dot(750+rnd(i+2100)*100,510+rnd(i+2101)*70,1,0.12+rnd(i+2102)*0.24);
  /* Indian subcontinent south — Chennai, Colombo, Mumbai coast */
  cluster(672,510,16,0.48);
  for(let i=0;i<35;i++) dot(640+rnd(i+2200)*75,492+rnd(i+2201)*70,1,0.10+rnd(i+2202)*0.20);
  /* Central America / Caribbean */
  cluster(210,460,10,0.38);
  for(let i=0;i<22;i++) dot(188+rnd(i+2300)*60,445+rnd(i+2301)*40,1,0.10+rnd(i+2302)*0.18);

  /* GLOBAL SCATTER — full-longitude band so every camera angle sees lights */
  /* Covers y=380-680 (mid-lat north through mid-lat south), all x=0-2048   */
  for(let i=0;i<320;i++){
    const gx=rnd(i+3000)*2048;
    const gy=380+rnd(i+3001)*300;
    /* cluster lights near known continent x-bands, sparse over ocean */
    const onLand=(gx<420)||(gx>470&&gx<680)||(gx>600&&gx<900)||
                 (gx>1600&&gx<2048)||(gx>0&&gx<150);
    const a=onLand ? 0.12+rnd(i+3002)*0.22 : 0.06+rnd(i+3003)*0.10;
    dot(gx,gy,1,a);
  }
  /* Dense equatorial coastal arcs — y=460-560, every 60px longitude band */
  for(let i=0;i<180;i++){
    const gx=rnd(i+3100)*2048;
    const gy=460+rnd(i+3101)*100;
    dot(gx,gy,1,0.08+rnd(i+3102)*0.14);
  }

  /* LAYER 5: clouds — bright white/grey, prominent swirling formations */
  const cloudMass=(x,y,rx,ry,rot,a)=>{
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
    const g=ctx.createRadialGradient(0,0,0,0,0,Math.max(rx,ry));
    const reducedA = a * 0.25; // Lessen cloud opacity significantly
    g.addColorStop(0,   `rgba(195,210,235,${reducedA})`);
    g.addColorStop(0.35,`rgba(160,178,210,${(reducedA*0.75).toFixed(2)})`);
    g.addColorStop(0.65,`rgba(110,130,168,${(reducedA*0.38).toFixed(2)})`);
    g.addColorStop(1,   "rgba(50,65,100,0)");
    ctx.fillStyle=g;
    ctx.scale(1, ry/rx);
    ctx.beginPath(); ctx.arc(0,0,rx,0,Math.PI*2); ctx.fill();
    ctx.restore();
  };
  /* large swirling systems — like the reference */
  cloudMass(640,500, 260,85,  0.28, 0.82);  // Mediterranean/Atlantic swirl
  cloudMass(460,445, 210,68, -0.18, 0.76);  // Atlantic mass
  cloudMass(770,465, 190,60,  0.42, 0.72);  // Asian coast system
  cloudMass(320,415, 155,50, -0.30, 0.68);  // N Atlantic
  cloudMass(580,595, 145,48,  0.15, 0.65);  // African front
  cloudMass(840,540, 130,44,  0.25, 0.62);  // Pacific edge
  cloudMass(190,475, 120,40, -0.12, 0.60);  // Western Atlantic
  cloudMass(950,430, 105,38,  0.32, 0.58);  // Far east
  cloudMass(700,355, 100,32,  0.08, 0.55);  // Northern band
  cloudMass(420,560, 115,38,  0.20, 0.58);  // S Atlantic

  return cv;
}

/* ── COMPONENT ───────────────────────────────────────────────────────── */
const EARTH_R = 58;

export default function BackgroundOrbit() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled=false, frameId, renderer, resizeObs;
    const disposables=[];

    import("three").then((THREE)=>{
      if(cancelled) return;

      const scene=new THREE.Scene();
      const W=mount.clientWidth||window.innerWidth;
      const H=mount.clientHeight||window.innerHeight;
      const camera=new THREE.PerspectiveCamera(55,W/H,0.5,2000);
      camera.position.set(0,15,560); camera.lookAt(0,0,0);

      renderer=new THREE.WebGLRenderer({antialias:true});
      renderer.setSize(W,H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure=1.1;
      mount.appendChild(renderer.domElement);

      /* SKY */
      const skyGeo=new THREE.SphereGeometry(1400,24,14);
      skyGeo.scale(-1,1,1);
      const skyMat=new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader:SKY_VERT,fragmentShader:SKY_FRAG,side:THREE.BackSide,depthWrite:false
      });
      scene.add(new THREE.Mesh(skyGeo,skyMat)); disposables.push(skyGeo,skyMat);

      /* STARS */
      const starGeo=new THREE.BufferGeometry();
      starGeo.setAttribute("position",new THREE.BufferAttribute(STAR_POS.slice(),3));
      starGeo.setAttribute("color",   new THREE.BufferAttribute(STAR_COL.slice(),3));
      const starMat=new THREE.PointsMaterial({size:1.1,vertexColors:true,transparent:true,opacity:0.90,sizeAttenuation:false});
      scene.add(new THREE.Points(starGeo,starMat)); disposables.push(starGeo,starMat);

      /* VERY DIM AMBIENT — just enough to show curvature, no sun */
      scene.add(new THREE.AmbientLight(0x0a1428,0.18));
      /* Faint fill from viewer direction so sphere reads as 3D */
      const fillLight=new THREE.PointLight(0x1428a0,0.25,900);
      scene.add(fillLight);

      /* DISTANT PLANETS (no sun) */
      [{pos:[160,-30,-280],r:5,col:0xB84820},{pos:[-95,55,-340],r:9,col:0xC89A50}].forEach(({pos,r,col})=>{
        const m=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),new THREE.MeshStandardMaterial({color:col,roughness:0.8}));
        m.position.set(...pos); scene.add(m); disposables.push(m.geometry,m.material);
      });

      /* EARTH — night side only */
      const nightTex=new THREE.CanvasTexture(createNightCanvas());
      nightTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
      disposables.push(nightTex);

      const earthMat=new THREE.ShaderMaterial({
        uniforms:{ 
          nightMap:{value:nightTex},
          uTime:{value:0} 
        },
        vertexShader:EARTH_VERT, fragmentShader:EARTH_FRAG,
      });
      const earthGeo=new THREE.SphereGeometry(EARTH_R,80,50);
      const earthMesh=new THREE.Mesh(earthGeo,earthMat);
      scene.add(earthMesh); disposables.push(earthGeo,earthMat);

      /* ATMOSPHERE — thicker, more visible limb glow */
      const mkAtm=(r,col,power,intensity)=>{
        const m=new THREE.Mesh(
          new THREE.SphereGeometry(r,64,40),
          new THREE.ShaderMaterial({
            uniforms:{color:{value:new THREE.Vector3(...col)},power:{value:power},intensity:{value:intensity}},
            vertexShader:ATM_VERT,fragmentShader:ATM_FRAG,
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
          })
        );
        scene.add(m); disposables.push(m.geometry,m.material); return m;
      };
      /* Single hazy atmosphere ring — subtle limb glow only */
      mkAtm(EARTH_R+6, [0.15,0.38,0.90], 6.0, 0.40);

      /* MOON — dark, crescent-facing */
      const moonMat=new THREE.MeshStandardMaterial({color:0x2a2620,roughness:1.0,metalness:0});
      const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(13,22,16),moonMat);
      /* very faint earthshine on moon */
      scene.add(new THREE.AmbientLight(0x050810,0.8));
      scene.add(moonMesh); disposables.push(moonMesh.geometry,moonMat);

      /* CAMERA PATH
         Start : far out, Earth is a small sphere centered in frame
         End   : close + directly above, looking down at horizon —
                 Earth fills bottom half of screen as a curved surface,
                 top half is pure star field                            */
      const posStart=new THREE.Vector3( 0,  18, 560);
      /* End: pulled back so Earth face is visible, not just the limb */
      const posEnd  =new THREE.Vector3( 0,  38, 105);
      const latStart=new THREE.Vector3( 0,   0,   0);
      const latEnd  =new THREE.Vector3( 0,  10,   0);  // look at equatorial face, not top
      const FRAMES=3200;
      let progress=0, idleT=0, tick=0;

      /* FOV: stays moderate — we're pulled back so Earth fills bottom 40% */
      const FOV_START=55, FOV_END=48;

      const animate=()=>{
        frameId=requestAnimationFrame(animate); tick++;
        const time = tick * 0.016;

        earthMesh.rotation.y+=0.00016;
        earthMat.uniforms.uTime.value = time;
        skyMat.uniforms.uTime.value = time;
        fillLight.position.copy(camera.position);

        const moonAngle=tick*0.0006;
        moonMesh.position.set(Math.cos(moonAngle)*170, Math.sin(moonAngle*0.25)*18, Math.sin(moonAngle)*170);

        if(progress<1){
          progress=Math.min(progress+1/FRAMES,1);
          const t=easeInOut(progress);
          camera.position.lerpVectors(posStart,posEnd,t);
          camera.lookAt(new THREE.Vector3().lerpVectors(latStart,latEnd,t));
          camera.fov=FOV_START+(FOV_END-FOV_START)*t;
          camera.updateProjectionMatrix();
        } else {
          /* idle: very slow drift, hold bottom-40% horizon framing */
          idleT+=0.00007;
          camera.position.set(
            Math.sin(idleT)*5   + posEnd.x,
            Math.sin(idleT*0.4)*3 + posEnd.y,
            posEnd.z
          );
          camera.lookAt(Math.sin(idleT*0.25)*3, latEnd.y, 0);
        }
        renderer.render(scene,camera);
      };
      animate();

      resizeObs=new ResizeObserver(()=>{
        if(!mount||!renderer) return;
        camera.aspect=mount.clientWidth/mount.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mount.clientWidth,mount.clientHeight);
      });
      resizeObs.observe(mount);
    });

    return ()=>{
      cancelled=true;
      if(frameId) cancelAnimationFrame(frameId);
      if(resizeObs) resizeObs.disconnect();
      disposables.forEach(d=>d?.dispose?.());
      if(renderer){ renderer.dispose(); if(mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement); }
    };
  },[]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{zIndex:0}} />;
}
