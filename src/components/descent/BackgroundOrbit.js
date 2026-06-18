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
  const warm = rnd(i*5+4) < 0.22;
  const blue = !warm && rnd(i*5+4) > 0.82;
  if (warm)      { STAR_COL[i*3]=1; STAR_COL[i*3+1]=0.82; STAR_COL[i*3+2]=0.45; }
  else if (blue) { STAR_COL[i*3]=0.68; STAR_COL[i*3+1]=0.84; STAR_COL[i*3+2]=1; }
  else           { STAR_COL[i*3]=1; STAR_COL[i*3+1]=1; STAR_COL[i*3+2]=1; }
}

/* ── SHADERS ─────────────────────────────────────────────────────────── */
const SKY_VERT = `varying vec3 vDir; void main(){ vDir=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const SKY_FRAG = `
varying vec3 vDir;
void main(){
  vec3 d=normalize(vDir), c=vec3(0.005,0.002,0.012);
  float g=max(0.,dot(d,normalize(vec3(-0.75,0.28,-0.60))));
  c+=vec3(0.10,0.06,0.01)*pow(g,2.2)+vec3(0.04,0.02,0.0)*pow(g,1.0);
  float b=max(0.,dot(d,normalize(vec3(0.65,0.10,0.50))));
  c+=vec3(0.02,0.01,0.07)*pow(b,3.0);
  c+=vec3(0.02,0.00,0.04)*pow(max(0.,-d.y),2.0);
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
  varying vec3 vN; varying vec3 vV; varying vec2 vUv;
  void main(){
    vec4 night=texture2D(nightMap,vUv);
    /* limb darkening: edges of sphere go darker */
    float facing=max(0.,dot(vN,vV));
    float limb=pow(facing,0.55);
    /* city lights stay bright, ocean gets darker at edges */
    vec3 lights=night.rgb;
    float lum=dot(lights,vec3(0.3,0.59,0.11));
    /* brighten light areas, darken ocean toward limb */
    vec3 col=mix(lights*limb*0.7, lights*1.1, smoothstep(0.0,0.25,lum));
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
  ctx.fillStyle="#010307"; ctx.fillRect(0,0,W,H);

  /* city light cluster helper */
  const cluster=(x,y,r,a)=>{
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,`rgba(255,195,55,${a})`);
    g.addColorStop(0.35,`rgba(255,172,38,${(a*0.55).toFixed(2)})`);
    g.addColorStop(1,"rgba(255,145,20,0)");
    ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
  };
  const dot=(x,y,s,a)=>{ ctx.fillStyle=`rgba(255,195,65,${a})`; ctx.fillRect(x,y,s,s); };

  /* Western Europe */
  cluster(560,342,62,0.95);
  for(let i=0;i<90;i++) dot(490+rnd(i+1000)*170,298+rnd(i+1001)*96,1+rnd(i+1002)*2,0.38+rnd(i+1003)*0.58);
  /* UK */
  cluster(520,308,28,0.80);
  /* East coast US */
  cluster(222,370,50,0.90); cluster(198,355,22,0.82); cluster(248,385,18,0.75);
  for(let i=0;i<60;i++) dot(160+rnd(i+1100)*130,340+rnd(i+1101)*90,1+rnd(i+1102)*2,0.35+rnd(i+1103)*0.55);
  /* Japan */
  cluster(806,358,38,0.88); cluster(814,344,18,0.78);
  for(let i=0;i<40;i++) dot(780+rnd(i+1200)*55,336+rnd(i+1201)*44,1+rnd(i+1202)*2,0.38+rnd(i+1203)*0.5);
  /* East China coast */
  cluster(762,390,46,0.82);
  for(let i=0;i<50;i++) dot(720+rnd(i+1300)*90,360+rnd(i+1301)*70,1+rnd(i+1302)*2,0.30+rnd(i+1303)*0.48);
  /* India */
  cluster(684,462,36,0.76); cluster(700,490,22,0.65);
  for(let i=0;i<35;i++) dot(650+rnd(i+1400)*80,440+rnd(i+1401)*80,1,0.28+rnd(i+1402)*0.45);
  /* SE Asia */
  cluster(768,502,28,0.68);
  /* Korea */
  cluster(794,368,20,0.72);
  /* Middle East */
  cluster(628,408,24,0.65);
  /* West Africa */
  cluster(512,490,18,0.48);
  /* Brazil coast */
  cluster(298,590,20,0.52); cluster(270,610,14,0.44);
  /* West coast US */
  cluster(158,388,22,0.62);
  /* Mexico City area */
  cluster(192,428,18,0.58);
  /* South Africa */
  cluster(584,680,16,0.50);

  /* Cloud layer drawn into the night texture — slightly lighter wisps */
  ctx.globalCompositeOperation="screen";
  const cloudWisp=(x,y,rx,ry,rot,a)=>{
    ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
    const g=ctx.createRadialGradient(0,0,0,0,0,Math.max(rx,ry));
    g.addColorStop(0,`rgba(22,38,68,${a})`);
    g.addColorStop(0.5,`rgba(14,26,50,${(a*0.4).toFixed(2)})`);
    g.addColorStop(1,"rgba(8,16,32,0)");
    ctx.fillStyle=g;
    ctx.scale(1,ry/rx); ctx.beginPath(); ctx.arc(0,0,rx,0,Math.PI*2); ctx.fill();
    ctx.restore();
  };
  cloudWisp(640,480,220,70, 0.3,0.55);  // Mediterranean swirl
  cloudWisp(500,430,180,55,-0.2,0.48);
  cloudWisp(750,450,160,50, 0.5,0.44);  // Asian coast cloud
  cloudWisp(680,530,140,45, 0.1,0.40);
  cloudWisp(340,400,130,40,-0.3,0.38);
  cloudWisp(820,510,110,38, 0.2,0.35);
  cloudWisp(560,580,100,35, 0.4,0.32);
  cloudWisp(440,500, 90,30,-0.1,0.30);
  ctx.globalCompositeOperation="source-over";
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
      const skyMat=new THREE.ShaderMaterial({vertexShader:SKY_VERT,fragmentShader:SKY_FRAG,side:THREE.BackSide,depthWrite:false});
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
        uniforms:{nightMap:{value:nightTex}},
        vertexShader:EARTH_VERT, fragmentShader:EARTH_FRAG,
      });
      const earthGeo=new THREE.SphereGeometry(EARTH_R,80,50);
      const earthMesh=new THREE.Mesh(earthGeo,earthMat);
      scene.add(earthMesh); disposables.push(earthGeo,earthMat);

      /* ATMOSPHERE — orange limb (matches Stratosphere) */
      const mkAtm=(r,col,power,intensity)=>{
        const m=new THREE.Mesh(
          new THREE.SphereGeometry(r,48,30),
          new THREE.ShaderMaterial({
            uniforms:{color:{value:new THREE.Vector3(...col)},power:{value:power},intensity:{value:intensity}},
            vertexShader:ATM_VERT,fragmentShader:ATM_FRAG,
            transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
          })
        );
        scene.add(m); disposables.push(m.geometry,m.material); return m;
      };
      mkAtm(EARTH_R+4.5, [1.0,0.58,0.22], 3.8, 1.5);  // warm orange
      mkAtm(EARTH_R+9.0, [0.28,0.52,1.0], 5.5, 0.80); // blue Rayleigh

      /* MOON — dark, crescent-facing */
      const moonMat=new THREE.MeshStandardMaterial({color:0x2a2620,roughness:1.0,metalness:0});
      const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(13,22,16),moonMat);
      /* very faint earthshine on moon */
      scene.add(new THREE.AmbientLight(0x050810,0.8));
      scene.add(moonMesh); disposables.push(moonMesh.geometry,moonMat);

      /* CAMERA PATH */
      const posStart=new THREE.Vector3(0,15,560);
      const posEnd  =new THREE.Vector3(0,22, 90);
      const latStart=new THREE.Vector3(0, 0,  0);
      const latEnd  =new THREE.Vector3(0, 8,  0);
      const FRAMES=2800;
      let progress=0, idleT=0, tick=0;

      const animate=()=>{
        frameId=requestAnimationFrame(animate); tick++;

        earthMesh.rotation.y+=0.00018;
        fillLight.position.copy(camera.position); // fill always from viewer

        const moonAngle=tick*0.0007;
        moonMesh.position.set(Math.cos(moonAngle)*158, Math.sin(moonAngle*0.28)*20, Math.sin(moonAngle)*158);

        if(progress<1){
          progress=Math.min(progress+1/FRAMES,1);
          const t=easeInOut(progress);
          camera.position.lerpVectors(posStart,posEnd,t);
          camera.lookAt(new THREE.Vector3().lerpVectors(latStart,latEnd,t));
        } else {
          idleT+=0.00016;
          camera.position.set(Math.sin(idleT)*10+posEnd.x, posEnd.y+Math.sin(idleT*0.7)*2.5, posEnd.z);
          camera.lookAt(Math.sin(idleT*0.45)*4, latEnd.y, 0);
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
