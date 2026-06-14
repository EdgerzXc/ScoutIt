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
      ctx.translate(cx, cy);
      
      ctx.rotate(sp * 0.2); // Slower, more majestic rotation

      // As we descend, stars fly UP past the camera (Z decreases)
      const speedOffset = sp * 2000; 

      stars.forEach(star => {
        let z = star.z - speedOffset;
        while (z <= 0) z += 2000;
        
        const perspective = 800 / z;
        const px = star.x * perspective;
        const py = star.y * perspective;
        const pSize = star.size * perspective;

        if (px > -cx && px < cx && py > -cy && py < cy) {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, pSize), 0, Math.PI * 2);
          if (Math.random() > 0.9) {
            ctx.fillStyle = `rgba(255, 184, 0, ${star.opacity})`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
          }
          ctx.fill();
        }
      });

      // We are descending towards Earth.
      // Earth starts far below the frame and moves UP into view, getting LARGER.
      const scale = 1 + sp * 1.5; // Earth scales up by 250% as we get closer
      const earthRadius = Math.min(w, h) * 0.9 * scale;
      
      // Start Earth low, move it UP (negative Y direction) as sp increases
      const startY = h * 1.2; // Starts 1.2x screen height below center
      const endY = h * 0.4;   // Ends taking up bottom half of screen
      const earthY = startY - (sp * (startY - endY)); 
      
      const earthGradient = ctx.createRadialGradient(0, earthY, earthRadius * 0.7, 0, earthY, earthRadius);
      earthGradient.addColorStop(0, "rgba(25, 25, 30, 1)"); 
      earthGradient.addColorStop(1, "rgba(10, 10, 15, 1)"); 
      
      ctx.beginPath();
      ctx.arc(0, earthY, earthRadius, 0, Math.PI * 2);
      ctx.fillStyle = earthGradient;
      ctx.fill();
      
      ctx.lineWidth = 25 * scale;
      ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
      ctx.stroke();

      ctx.lineWidth = 8 * scale;
      ctx.strokeStyle = "rgba(100, 180, 255, 0.8)";
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, earthY, earthRadius * 1.2, earthRadius * 0.3, Math.PI * 0.05, 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = "rgba(255, 184, 0, 0.6)";
      ctx.stroke();

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
