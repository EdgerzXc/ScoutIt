"use client";

import Link from "next/link";

/**
 * Shared "Continue Descent" transition placed at the bottom of every layer
 * (except Core). Enforces the manifesto rule: "The ending of one layer
 * should hint at the beginning of another."
 *
 * @param {string} nextNum   - e.g. "02"
 * @param {string} nextName  - e.g. "Stratosphere"
 * @param {string} nextHref  - e.g. "/layer/stratosphere"
 * @param {string} teaser    - one-line poetic hint about the next layer
 */
export default function LayerTransition({ nextNum, nextName, nextHref, teaser }) {
  return (
    <div className="layer-transition">
      <div className="layer-transition-inner">
        <div className="layer-transition-divider" />
        <span className="layer-transition-kicker">
          Continue Descent
        </span>
        <Link href={nextHref} className="layer-transition-link">
          <span className="layer-transition-num">Layer {nextNum}</span>
          <span className="layer-transition-name">{nextName}</span>
          <span className="layer-transition-teaser">{teaser}</span>
          <span className="layer-transition-arrow">↓</span>
        </Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .layer-transition {
          position: relative;
          z-index: 10;
          width: 100%;
          padding: 60px 40px 80px;
          display: flex;
          justify-content: center;
        }
        .layer-transition-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 480px;
          text-align: center;
        }
        .layer-transition-divider {
          width: 1px;
          height: 48px;
          background: linear-gradient(180deg, transparent 0%, var(--accent) 100%);
          opacity: 0.4;
          margin-bottom: 8px;
        }
        .layer-transition-kicker {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.7;
        }
        .layer-transition-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          padding: 20px 32px;
          border: 1px solid rgba(232, 174, 60, 0.12);
          border-radius: 8px;
          background: rgba(232, 174, 60, 0.03);
          transition: all 0.3s ease;
          width: 100%;
        }
        .layer-transition-link:hover {
          border-color: rgba(232, 174, 60, 0.35);
          background: rgba(232, 174, 60, 0.06);
          box-shadow: 0 0 30px rgba(232, 174, 60, 0.1);
          transform: translateY(-2px);
        }
        .layer-transition-num {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.6;
        }
        .layer-transition-name {
          font-family: var(--font-display);
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 400;
          color: #f6efe6;
          line-height: 1.2;
        }
        .layer-transition-teaser {
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.5);
          max-width: 360px;
        }
        .layer-transition-arrow {
          font-size: 20px;
          color: var(--accent);
          opacity: 0.5;
          animation: transitionPulse 2s ease-in-out infinite;
        }
        @keyframes transitionPulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(4px); }
        }
      `}} />
    </div>
  );
}
