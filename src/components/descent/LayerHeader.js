"use client";

import React from "react";

/**
 * Global header for all ScoutIt layers.
 * Places the layer number, main title, description, and mission statement
 * in a consistent, centered layout at the top of the layer page.
 *
 * @param {string} layerNum - e.g. "01"
 * @param {string} layerName - e.g. "Orbit"
 * @param {string} title - e.g. "The Board"
 * @param {string} description - e.g. "The properties Manila is watching..."
 * @param {string} missionText - e.g. "The Orbit serves as the Showcase Layer..."
 */
export default function LayerHeader({ layerNum, layerName, title, description, missionText, ctaText, ctaHref }) {
  return (
    <div className="layer-global-header">
      <div className="layer-global-header-inner">
        
        {/* TOP CENTER: KICKER */}
        <div className="layer-header-top">
          <span className="layer-kicker">
            Layer {layerNum} // {layerName}
          </span>
        </div>

        {/* SPLIT LAYOUT: LEFT (TITLE/DESC) / RIGHT (MISSION) */}
        <div className="layer-header-split">
          
          <div className="layer-header-left">
            <h1 className="layer-title">{title}</h1>
            {description && <p className="layer-desc">{description}</p>}
            {ctaText && ctaHref && (
              <a href={ctaHref} className="layer-primary-cta">{ctaText}</a>
            )}
          </div>

          {missionText && (
            <div className="layer-header-right">
              <div className="layer-mission-block">
                <h3 className="layer-mission-label">MISSION</h3>
                <p className="layer-mission-text">{missionText}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .layer-global-header {
          position: relative;
          z-index: 20;
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 28px 40px;
          background: rgba(13,13,13,0.6);
          backdrop-filter: blur(12px);
        }
        
        .layer-global-header-inner {
          width: 100%;
          display: flex;
          flex-direction: column;
        }

        .layer-header-top {
          text-align: center;
          margin-bottom: 20px;
        }

        .layer-kicker {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.22em;
          color: var(--accent);
          text-transform: uppercase;
          display: inline-block;
        }

        .layer-header-split {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 48px;
        }

        .layer-header-left {
          flex: 1;
          max-width: 680px;
        }

        .layer-header-right {
          flex: 0 0 320px;
        }

        .layer-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 3.5vw, 42px);
          font-weight: 400;
          line-height: 1.1;
          color: #f6efe6;
          margin-bottom: 14px;
          text-shadow: 0 2px 20px rgba(0,0,0,0.5);
        }

        .layer-desc {
          font-family: var(--font-body);
          font-size: clamp(15px, 1.4vw, 17px);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 0;
        }

        .layer-mission-block {
          padding-left: 24px;
          border-left: 1px solid rgba(232, 174, 60, 0.2);
        }

        .layer-mission-label {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--accent);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .layer-mission-text {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
          color: var(--accent);
          opacity: 1;
        }

        .layer-primary-cta {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          border: 1px solid rgba(232, 174, 60, 0.4);
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.22s ease;
          background: rgba(232, 174, 60, 0.06);
          margin-top: 20px;
        }
        .layer-primary-cta:hover {
          color: #1a0d04;
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.4);
        }

        @media (max-width: 768px) {
          .layer-header-split {
            flex-direction: column;
            align-items: flex-start;
            gap: 32px;
          }
          .layer-header-right {
            flex: none;
            width: 100%;
          }
          .layer-mission-block {
            padding-left: 0;
            border-left: none;
            padding-top: 24px;
            border-top: 1px solid rgba(232, 174, 60, 0.2);
          }
        }
      `}} />
    </div>
  );
}
