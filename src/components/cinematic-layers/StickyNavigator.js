"use client";

import React from "react";
import { motion, useTransform } from "framer-motion";

export default function StickyNavigator({ scrollYProgress }) {
  const handleScroll = (num) => {
    const el = document.getElementById(`layer-0${num}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center gap-4">
      <div className="h-16 w-[1px] bg-[rgba(255,255,255,0.1)]" />
      {[1, 2, 3, 4, 5].map((num, i) => {
        // Each layer occupies 0.2 of the scroll progress
        const start = i * 0.2;
        const end = start + 0.2;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const opacity = useTransform(
          scrollYProgress,
          [Math.max(0, start - 0.1), start, end, Math.min(1, end + 0.1)],
          [0.3, 1, 1, 0.3]
        );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const scale = useTransform(
          scrollYProgress,
          [Math.max(0, start - 0.1), start, end, Math.min(1, end + 0.1)],
          [1, 1.2, 1.2, 1]
        );
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const color = useTransform(
          scrollYProgress,
          [Math.max(0, start - 0.1), start, end, Math.min(1, end + 0.1)],
          ["rgba(255,255,255,0.4)", "#FFB800", "#FFB800", "rgba(255,255,255,0.4)"]
        );

        return (
          <React.Fragment key={num}>
            <motion.button
              onClick={() => handleScroll(num)}
              style={{ opacity, scale, color }}
              className="font-mono text-[10px] font-bold cursor-pointer hover:text-[#FFB800] transition-colors focus:outline-none"
              whileHover={{ scale: 1.3 }}
            >
              0{num}
            </motion.button>
            {i < 4 && <div className="w-[3px] h-[3px] rounded-full bg-[rgba(255,255,255,0.1)]" />}
          </React.Fragment>
        );
      })}
      <div className="h-16 w-[1px] bg-[rgba(255,255,255,0.1)]" />
    </div>
  );
}
