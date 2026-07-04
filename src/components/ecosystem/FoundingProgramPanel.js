"use client";

import Link from "next/link";

// Pre-launch recruitment panel for ecosystem services that aren&apos;t open to buyers yet.
// Turns "coming soon" into an on-ramp: recruit the supply side now (portfolio + ID card +
// founding pricing), while telling buyers the service is on its way.
export default function FoundingProgramPanel({
  icon = "✦",
  serviceName = "This service",
  foundingTitle = "Become a Founding Member",
  supplyBlurb = "",
  perks = [],
  ctaLabel = "Claim Founding Status",
  ctaHref = "/onboarding",
  pricingHref = "/pricing/creator",
}) {
  return (
    <div className="founding-panel">
      <div className="founding-icon">{icon}</div>
      <span className="founding-badge">FOUNDING MEMBER · PRE-LAUNCH</span>
      <h2 className="founding-title">{foundingTitle}</h2>
      <p className="founding-blurb">{supplyBlurb}</p>

      {perks.length > 0 && (
        <ul className="founding-perks">
          {perks.map((p) => (
            <li key={p}><span className="founding-check">✓</span>{p}</li>
          ))}
        </ul>
      )}

      <div className="founding-cta-row">
        <Link href={ctaHref} className="founding-cta">{ctaLabel} →</Link>
        <Link href={pricingHref} className="founding-cta-secondary">See founding pricing</Link>
      </div>

      <div className="founding-divider" />
      <p className="founding-buyer">
        Looking to hire? {serviceName} goes live with the platform launch — and you&apos;ll be the first to know.
      </p>

      <style>{`
        .founding-panel {
          padding: 56px 40px;
          background: linear-gradient(135deg, rgba(232, 174, 60,0.06) 0%, var(--surface) 60%);
          border: 1px solid var(--accent-muted);
          border-radius: var(--radius-md);
          text-align: center;
          margin-top: 20px;
        }
        .founding-icon { font-size: 44px; margin-bottom: 18px; }
        .founding-badge {
          display: inline-block;
          font-family: var(--font-mono), monospace;
          font-size: 10px; font-weight: 700; letter-spacing: 0.18em;
          color: var(--accent);
          border: 1px solid var(--accent-muted);
          border-radius: 3px; padding: 5px 12px; margin-bottom: 18px;
        }
        .founding-title { font-family: var(--font-display); font-size: 32px; color: #fff; margin-bottom: 14px; }
        .founding-blurb { color: var(--text-secondary); max-width: 560px; margin: 0 auto 28px; line-height: 1.65; }
        .founding-perks {
          list-style: none; padding: 0; margin: 0 auto 32px;
          max-width: 430px; text-align: left;
          display: flex; flex-direction: column; gap: 12px;
        }
        .founding-perks li { display: flex; align-items: flex-start; gap: 10px; color: var(--text-primary); font-size: 14px; line-height: 1.5; }
        .founding-check { color: var(--accent); font-weight: 700; flex-shrink: 0; }
        .founding-cta-row { display: flex; gap: 16px; justify-content: center; align-items: center; flex-wrap: wrap; margin-bottom: 30px; }
        .founding-cta {
          display: inline-flex; align-items: center;
          background: var(--accent-bright); color: #0e0e0e; font-weight: 700;
          padding: 14px 30px; border-radius: 4px; letter-spacing: 0.04em; text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .founding-cta:hover { transform: translateY(-2px); box-shadow: var(--shadow-glow); }
        .founding-cta-secondary { color: var(--text-secondary); font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
        .founding-cta-secondary:hover { color: var(--accent); }
        .founding-divider { height: 1px; background: var(--border); max-width: 320px; margin: 0 auto 22px; }
        .founding-buyer { color: var(--text-muted); font-size: 13px; max-width: 480px; margin: 0 auto; line-height: 1.6; }
        @media (max-width: 600px) {
          .founding-panel { padding: 40px 22px; }
          .founding-title { font-size: 26px; }
        }
      `}</style>
    </div>
  );
}
