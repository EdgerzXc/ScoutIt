"use client";

import { useEffect, useRef } from "react";
import useDescentProgress from "@/hooks/useDescentProgress";
import { MoveDown } from "lucide-react";

export default function Layer1Orbit() {
  const layerRef = useDescentProgress();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    let stars = [];

    const initStar = () => ({
      x: (Math.random() - 0.5) * 2000,
      y: (Math.random() - 0.5) * 2000,
      z: Math.random() * 2000,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.8 + 0.2
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      stars = Array.from({ length: 400 }, initStar);
    };

    let raf;
    const draw = () => {
      ctx.fillStyle = "#0d0d0d"; // ScoutIt Deep Black
      ctx.fillRect(0, 0, w, h);

      // Read CSS variable dynamically for zero-time rendering
      const spRaw = getComputedStyle(canvas.parentElement).getPropertyValue("--sp").trim();
      const sp = parseFloat(spRaw) || 0;

      // FIX: Since Layer 1 is at the very top of the page, when scrollY=0, its rect.top is 0.
      // The hook's formula (vh - top)/(vh + height) with h=150vh evaluates to (vh - 0)/(vh + 1.5vh) = 0.4.
      // So sp starts at 0.4 and goes to 1.0. We normalize this to a 0->1 range (t).
      const t = Math.max(0, (sp - 0.4) / 0.6);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Starfield (moves past camera as --sp increases)
      ctx.save();
      ctx.translate(cx, cy);
      
      const speedOffset = t * 2000; 

      stars.forEach(star => {
        let z = star.z - speedOffset;
        // Wrap around
        while (z < 1) z += 2000;
        while (z > 2000) z -= 2000;

        const k = 1000 / z;
        const px = star.x * k;
        const py = star.y * k;
        const pSize = star.size * k;

        if (Math.abs(px) < w/2 && Math.abs(py) < h/2) {
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(240, 237, 232, ${star.alpha * Math.min(1, 2000 / z)})`;
          ctx.fill();
        }
      });
      ctx.restore();

      // Draw Earth (Scale up MASSIVELY to "descend" into atmosphere)
      // At sp=0, Earth is in distance. At sp=1, it covers the screen.
      ctx.save();
      ctx.translate(cx, cy);
      
      // Calculate scale: base radius is 15% of screen width.
      // As sp approaches 1, it needs to expand to > 150% of screen to "swallow" us.
      const earthBaseRadius = Math.min(w, h) * 0.2;
      const scale = 1 + Math.pow(t * 8, 3); // Exponential zoom
      const r = earthBaseRadius * scale;
      
      // Earth glow (Atmosphere)
      const grad = ctx.createRadialGradient(0, 0, r * 0.8, 0, 0, r * 1.1);
      grad.addColorStop(0, "rgba(255, 184, 0, 0.4)"); // Gold accent
      grad.addColorStop(0.5, "rgba(255, 184, 0, 0.1)");
      grad.addColorStop(1, "rgba(255, 184, 0, 0)");
      
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Earth body (Solid Black/Charcoal with gold trim)
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "#050505";
      ctx.fill();
      
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = "rgba(255, 184, 0, 0.3)";
      ctx.stroke();

      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section 
      ref={layerRef} 
      data-descent-layer="1"
      className="relative w-full h-[150vh] bg-[#0d0d0d] flex items-start justify-center"
      style={{ zIndex: 10 }}
    >
      {/* Sticky container to hold the canvas in view while scrolling the 150vh section */}
      <div className="sticky top-0 w-full h-screen overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Opacity fades out as we descend */}
          <div 
            className="flex flex-col items-center text-center px-4"
            style={{ 
              opacity: `calc(1 - max(0, (var(--sp) - 0.4) / 0.6) * 4)`,
              transform: `translateY(calc(max(0, (var(--sp) - 0.4) / 0.6) * -100px))`
            }}
          >
            <h1 className="text-6xl md:text-8xl font-display text-white tracking-tight mb-6" style={{ textShadow: '0 0 40px rgba(255,184,0,0.3)' }}>
              SCOUT<span className="text-accent">IT</span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary max-w-2xl font-light mb-12">
              The Space Intelligence Platform.
            </p>
            
            <div className="flex flex-col items-center gap-4 mt-8 animate-pulse opacity-60">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-accent">Initiate Descent</span>
              <MoveDown className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
