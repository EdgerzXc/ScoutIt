"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ComparisonMatrix({ properties, onClose }) {
  if (!properties || properties.length === 0) return null;

  return (
    <motion.div 
      className="matrix-overlay" 
      onClick={onClose}
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="matrix-modal" 
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="matrix-header">
          <h2 className="matrix-title">Asset Comparison</h2>
          <button className="matrix-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="matrix-scroll-container">
          <div className="matrix-grid" style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(250px, 1fr))` }}>
            
            {/* Visual Row */}
            <div className="matrix-cell row-header sticky-col"></div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell">
                <div 
                  className="matrix-image" 
                  style={{ backgroundImage: `url(${p.image || ''})` }}
                >
                  {!p.image && <span className="no-image">No Image</span>}
                </div>
                <h3 className="matrix-prop-title">{p.title}</h3>
                <Link href={`/property/${p.slug}`} className="matrix-link">View Full Briefing →</Link>
              </div>
            ))}

            {/* Price Row */}
            <div className="matrix-cell row-header sticky-col">Est. Valuation</div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell data-cell highlight">
                {p.listed_price ? `₱${Number(p.listed_price).toLocaleString()}` : "Upon Request"}
              </div>
            ))}

            {/* Category & Aesthetic */}
            <div className="matrix-cell row-header sticky-col">Classification</div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell data-cell">
                <span className="spec-badge">{p.spaceCategory}</span>
                {p.aestheticTag && <span className="spec-badge">{p.aestheticTag}</span>}
              </div>
            ))}

            {/* Location */}
            <div className="matrix-cell row-header sticky-col">Location</div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell data-cell">
                {p.location || p.city || "Undisclosed"}
              </div>
            ))}

            {/* Size / Specs */}
            <div className="matrix-cell row-header sticky-col">Key Specs</div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell data-cell">
                {p.floor_sqm ? `${p.floor_sqm} sqm` : "—"}
                {p.beds > 0 && ` • ${p.beds} Bed`}
                {p.baths > 0 && ` • ${p.baths} Bath`}
                {p.seating_capacity && ` • ${p.seating_capacity} seats`}
              </div>
            ))}

            {/* Verdict / Hook */}
            <div className="matrix-cell row-header sticky-col">ScoutIt Verdict</div>
            {properties.map((p) => (
              <div key={p.id} className="matrix-cell data-cell italic-hook">
                &quot;{p.hook || "Premium curated property briefing."}&quot;
              </div>
            ))}

          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .matrix-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease-out;
        }

        .matrix-modal {
          background: #0d0d0d;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 8px;
          width: 100%;
          max-width: 1100px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
          overflow: hidden;
        }

        .matrix-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #121212;
        }

        .matrix-title {
          font-family: var(--font-display, serif);
          color: #f0ede8;
          font-size: 1.5rem;
          margin: 0;
        }

        .matrix-close {
          background: none;
          border: none;
          color: #888;
          font-size: 1.2rem;
          cursor: pointer;
          transition: color 0.2s;
        }

        .matrix-close:hover {
          color: #E8AE3C;
        }

        .matrix-scroll-container {
          overflow-x: auto;
          overflow-y: auto;
          padding: 20px;
        }

        .matrix-grid {
          display: grid;
          gap: 1px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .matrix-cell {
          background: #121212;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .row-header {
          font-family: var(--font-mono, monospace);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #888;
          justify-content: center;
          background: #0d0d0d;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 10;
        }

        .matrix-image {
          width: 100%;
          height: 160px;
          background-size: cover;
          background-position: center;
          background-color: #1a1a1a;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .no-image {
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: #555;
        }

        .matrix-prop-title {
          font-family: var(--font-display, serif);
          color: #f0ede8;
          font-size: 1.2rem;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .matrix-link {
          font-family: var(--font-mono, monospace);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #E8AE3C;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .matrix-link:hover {
          opacity: 0.7;
        }

        .data-cell {
          font-family: var(--font-body, sans-serif);
          font-size: 0.95rem;
          color: #ccc;
          justify-content: center;
        }

        .highlight {
          color: #f0ede8;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .spec-badge {
          display: inline-block;
          font-family: var(--font-mono, monospace);
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.05);
          color: #aaa;
          padding: 4px 8px;
          border-radius: 4px;
          margin-right: 8px;
          margin-bottom: 8px;
        }

        .italic-hook {
          font-style: italic;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </motion.div>
  );
}
