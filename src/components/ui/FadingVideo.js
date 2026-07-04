"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FadingVideo({ videos, className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);



  const handleLoadedData = () => {
    setIsPlaying(true);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, 500); // Wait for fade out before changing source
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      <AnimatePresence mode="wait">
        <motion.video
          key={currentIndex}
          ref={videoRef}
          src={videos[currentIndex]}
          autoPlay
          muted
          playsInline
          loop={videos.length === 1} // if only 1 video, just let it loop natively
          onLoadedData={handleLoadedData}
          onEnded={videos.length > 1 ? handleEnded : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: isPlaying ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
    </div>
  );
}
