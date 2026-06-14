"use client";

import { useEffect, useRef } from "react";

export default function BackgroundOrbit() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w, h, animationFrameId;
    let stars = [];

    const initStars = () => {
      stars = Array.from({ length: 800 }, () => ({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        z: Math.random() * 2000,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.9 + 0.3
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      w = parent.clientWidth;
      h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      initStars();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      
      const spRaw = getComputedStyle(canvas.parentElement).getPropertyValue("--sp").trim();
      const sp = parseFloat(spRaw) || 0;
      
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();

      // --- 1. STARS ---
      // 150 stars scattered in upper 70% of canvas
      stars.forEach(star => {
        let z = star.z - (sp * 500); // slight forward movement
        while (z <= 0) z += 2000;
        
        const perspective = 800 / z;
        const px = cx + star.x * perspective;
        const py = (h * 0.35) + star.y * perspective; // bias towards upper canvas
        const pSize = star.size * perspective;

        if (px > 0 && px < w && py > 0 && py < h * 0.7) { // limit to upper 70%
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, pSize), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
          ctx.fill();
        }
      });

      // --- 2. EARTH SPHERE ---
      const earthRadius = Math.min(w, h) * 0.7;
      // Start at h*1.1, rise up by 5% of height as sp increases
      const earthY = (h * 1.1) - (sp * h * 0.05);

      // Atmosphere Glow
      const atmosRadius = earthRadius * 1.15;
      const atmosGradient = ctx.createRadialGradient(cx, earthY, earthRadius * 0.9, cx, earthY, atmosRadius);
      atmosGradient.addColorStop(0, "rgba(80,140,255,0.3)");
      atmosGradient.addColorStop(1, "transparent");
      
      ctx.beginPath();
      ctx.arc(cx, earthY, atmosRadius, 0, Math.PI * 2);
      ctx.fillStyle = atmosGradient;
      ctx.fill();

      // Earth Body
      const earthGradient = ctx.createRadialGradient(cx, earthY, 0, cx, earthY, earthRadius);
      earthGradient.addColorStop(0, "rgba(30,80,180,0.9)");
      earthGradient.addColorStop(1, "rgba(10,30,80,0.4)");
      
      ctx.beginPath();
      ctx.arc(cx, earthY, earthRadius, 0, Math.PI * 2);
      ctx.fillStyle = earthGradient;
      ctx.fill();

      // Terminator Line (Day/Night boundary suggestion)
      ctx.beginPath();
      ctx.arc(cx, earthY, earthRadius, Math.PI * 1.1, Math.PI * 1.9); // Top arc
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,200,100,0.4)";
      ctx.stroke();

      // City Lights (40-60 dots scattered on the top half of the sphere)
      // We'll generate pseudo-random points based on the radius
      ctx.fillStyle = "rgba(255,220,100,0.7)";
      for (let i = 0; i < 50; i++) {
        // pseudo-random deterministic positions so they don't flicker
        const angle = (i * 137.5) * Math.PI / 180; 
        const r = earthRadius * ((i % 100) / 100) * 0.9; 
        
        const lx = cx + Math.cos(angle) * r;
        const ly = earthY + Math.sin(angle) * r;

        // Only draw if it's on the upper half of the globe
        if (ly < earthY) {
          ctx.beginPath();
          ctx.arc(lx, ly, (i % 3) * 0.5 + 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-[#0b0b12] to-[#050508]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(100,150,255,0.06),transparent_60%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mix-blend-screen" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
    </div>
  );
}
