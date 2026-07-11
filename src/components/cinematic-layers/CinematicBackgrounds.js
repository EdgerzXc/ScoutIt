"use client";

import React from "react";
import { motion, useTransform, useReducedMotion } from "framer-motion";

export default function CinematicBackgrounds({ scrollYProgress }) {
  const prefersReducedMotion = useReducedMotion();

  // Layer 01: Orbit (Visible 0 - 0.25)
  const orbitOpacity = useTransform(scrollYProgress, [0, 0.2, 0.25], [1, 1, 0]);
  const earthScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.15]);
  const earthY = useTransform(scrollYProgress, [0, 0.2], ["10%", "25%"]);

  // Layer 02: Stratosphere (Visible 0.15 - 0.5)
  const stratoOpacity = useTransform(scrollYProgress, [0.15, 0.25, 0.45, 0.5], [0, 1, 1, 0]);
  const stratoY = useTransform(scrollYProgress, [0.15, 0.5], ["10%", "-10%"]);

  // Layer 03: Metropolis (Visible 0.4 - 0.75)
  const metroOpacity = useTransform(scrollYProgress, [0.4, 0.5, 0.7, 0.75], [0, 1, 1, 0]);
  const gridScale = useTransform(scrollYProgress, [0.4, 0.75], [1, 1.1]);

  // Layer 04: Crust (Visible 0.65 - 0.95)
  const crustOpacity = useTransform(scrollYProgress, [0.65, 0.75, 0.9, 0.95], [0, 1, 1, 0]);
  const crustY = useTransform(scrollYProgress, [0.65, 0.95], ["5%", "-5%"]);

  // Layer 05: Core (Visible 0.85 - 1.0)
  const coreOpacity = useTransform(scrollYProgress, [0.85, 0.95, 1], [0, 1, 1]);
  const coreRotate = useTransform(scrollYProgress, [0.85, 1], [0, 45]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0a] overflow-hidden">
      
      {/* LAYER 01: ORBIT */}
      <motion.div style={{ opacity: orbitOpacity }} className="absolute inset-0 flex items-center justify-center">
        {/* Subtle twinkling stars */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(232, 174, 60,0.05) 0%, transparent 60%)' }} />
        {/* Glowing Earth */}
        <motion.div 
          style={{ 
            scale: prefersReducedMotion ? 1 : earthScale, 
            y: prefersReducedMotion ? 0 : earthY 
          }}
          className="absolute bottom-[-40%] w-[150vw] h-[150vw] max-w-[1200px] max-h-[1200px] rounded-full"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-[rgba(232,174,60,0.05)] to-[rgba(232,174,60,0.15)] blur-2xl" />
          <div className="absolute inset-0 rounded-full border-t border-[rgba(232,174,60,0.3)] blur-[2px]" />
        </motion.div>
      </motion.div>

      {/* LAYER 02: STRATOSPHERE */}
      <motion.div style={{ opacity: stratoOpacity, y: prefersReducedMotion ? 0 : stratoY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[rgba(232,174,60,0.08)] to-[#0a0a0a]" />
        {/* Soft floating particles / light rays */}
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[60%] bg-[rgba(232,174,60,0.05)] blur-[100px] rounded-full" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[50%] bg-[rgba(232,174,60,0.03)] blur-[80px] rounded-full" />
      </motion.div>

      {/* LAYER 03: METROPOLIS */}
      <motion.div style={{ opacity: metroOpacity }} className="absolute inset-0 flex flex-col justify-end">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(232,174,60,0.08)_0%,transparent_60%)]" />
        {/* Glowing Golden Grid */}
        <motion.div 
          style={{ scale: prefersReducedMotion ? 1 : gridScale }}
          className="w-full h-[60vh] origin-bottom relative"
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="50" y1="0" x2="0" y2="100" stroke="#E8AE3C" strokeWidth="0.5" style={{ opacity: 0.3 }} />
            <line x1="50" y1="0" x2="25" y2="100" stroke="#E8AE3C" strokeWidth="0.5" style={{ opacity: 0.3 }} />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#E8AE3C" strokeWidth="0.5" style={{ opacity: 0.3 }} />
            <line x1="50" y1="0" x2="75" y2="100" stroke="#E8AE3C" strokeWidth="0.5" style={{ opacity: 0.3 }} />
            <line x1="50" y1="0" x2="100" y2="100" stroke="#E8AE3C" strokeWidth="0.5" style={{ opacity: 0.3 }} />
            {/* Horizontal lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="#E8AE3C" strokeWidth="0.3" style={{ opacity: 0.2 }} />
            <line x1="0" y1="45" x2="100" y2="45" stroke="#E8AE3C" strokeWidth="0.3" style={{ opacity: 0.2 }} />
            <line x1="0" y1="75" x2="100" y2="75" stroke="#E8AE3C" strokeWidth="0.3" style={{ opacity: 0.2 }} />
          </svg>
        </motion.div>
      </motion.div>

      {/* LAYER 04: CRUST */}
      <motion.div style={{ opacity: crustOpacity, y: prefersReducedMotion ? 0 : crustY }} className="absolute inset-0">
        <div className="absolute inset-0 bg-[#0d0d0d]" />
        {/* Slow glowing gold veins */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M10,0 Q20,30 50,50 T90,100" fill="none" stroke="#E8AE3C" strokeWidth="0.5" />
          <path d="M40,0 Q30,40 60,70 T80,100" fill="none" stroke="#E8AE3C" strokeWidth="0.3" />
          <path d="M80,0 Q60,20 30,60 T10,100" fill="none" stroke="#E8AE3C" strokeWidth="0.4" />
        </svg>
      </motion.div>

      {/* LAYER 05: CORE */}
      <motion.div style={{ opacity: coreOpacity }} className="absolute inset-0 flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(232,174,60,0.12)_0%,transparent_50%)]" />
        {/* Rotating geometric matrix */}
        <motion.div 
          style={{ rotate: prefersReducedMotion ? 0 : coreRotate }}
          className="w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] border border-[rgba(232,174,60,0.2)] rounded-lg flex items-center justify-center"
        >
          <div className="w-[70%] h-[70%] border border-[rgba(232,174,60,0.4)] rounded-full flex items-center justify-center">
            <div className="w-[40%] h-[40%] bg-[rgba(232,174,60,0.1)] blur-md rounded-full" />
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}
