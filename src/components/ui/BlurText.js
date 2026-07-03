"use client";

import React from "react";
import { motion } from "framer-motion";

export default function BlurText({ text, className = "", delay = 0 }) {
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.h2
      className={`flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {words.map((word, index) => (
        <motion.span variants={child} key={index} className="mr-[0.25em] mb-[0.1em]">
          {word}
        </motion.span>
      ))}
    </motion.h2>
  );
}
