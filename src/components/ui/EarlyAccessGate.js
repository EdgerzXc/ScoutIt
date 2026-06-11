"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────
// RESTRICTED ACCESS BANNER
// Replaces the ugly "COMING SOON" banner on listing pages.
// Signals deliberate niche strategy, not an unfinished product.
// ─────────────────────────────────────────────────────────────────
export function RestrictedAccessBanner({ rosterLabel = "This Roster", openDate = "Q4 2026" }) {
  return (
    <div className="restricted-banner">
      <div className="restricted-banner-inner">
        <div className="restricted-icon-col">
          <div className="restricted-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </div>
        <div className="restricted-text-col">
          <span className="restricted-label">CLOSED BETA · BY REFERRAL ONLY</span>
          <p className="restricted-desc">
            {rosterLabel} is currently available to referred partners only.
            Full public access opens {openDate}. Profiles shown are previews of verified members.
          </p>
        </div>
        <div className="restricted-signal">
          <span className="signal-dot active" />
          <span className="signal-dot" style={{ animationDelay: "0.3s" }} />
          <span className="signal-dot" style={{ animationDelay: "0.6s" }} />
          <span className="restricted-status">VETTING ACTIVE</span>
        </div>
      </div>
      <style>{`
        .restricted-banner {
          background: linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(18,14,8,0.98) 100%);
          border: 1px solid rgba(200,169,110,0.2);
          border-left: 3px solid var(--accent, #c8a96e);
          border-radius: 4px;
          padding: 18px 24px;
          margin-bottom: 36px;
        }
        .restricted-banner-inner {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .restricted-icon-col { flex-shrink: 0; }
        .restricted-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(200,169,110,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent, #c8a96e);
        }
        .restricted-text-col { flex: 1; }
        .restricted-label {
          display: block;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--accent, #c8a96e);
          font-weight: 700;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .restricted-desc {
          font-size: 13px;
          color: var(--text-secondary, #888);
          margin: 0;
          line-height: 1.6;
        }
        .restricted-signal {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .signal-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(200,169,110,0.2);
        }
        .signal-dot.active {
          background: var(--accent, #c8a96e);
          animation: signalPulse 1.5s ease-in-out infinite;
        }
        .restricted-status {
          font-family: var(--font-mono, monospace);
          font-size: 8px;
          letter-spacing: 0.12em;
          color: var(--text-muted, #555);
          text-transform: uppercase;
          margin-top: 4px;
        }
        @keyframes signalPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }
        @media (max-width: 700px) {
          .restricted-signal { display: none; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CARD INTERCEPT HOOK
// Use this in place of a normal Link when a card is restricted.
// Renders the card children + handles click → shows access modal.
// ─────────────────────────────────────────────────────────────────
export function RestrictedCardWrapper({ children, rosterType = "this roster" }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="restricted-card-wrap"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setShowModal(true)}
      >
        {children}
        <div className="restricted-card-tag">RESTRICTED ACCESS</div>
      </div>

      {showModal && (
        <EarlyAccessModal
          rosterType={rosterType}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        .restricted-card-wrap {
          position: relative;
          cursor: pointer;
        }
        .restricted-card-wrap:focus {
          outline: 1px solid var(--accent, #c8a96e);
          outline-offset: 2px;
        }
        .restricted-card-tag {
          position: absolute;
          top: 12px;
          left: 12px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent, #c8a96e);
          background: rgba(14,14,14,0.92);
          border: 1px solid rgba(200,169,110,0.35);
          padding: 4px 10px;
          border-radius: 2px;
          z-index: 10;
          font-family: var(--font-mono, monospace);
          backdrop-filter: blur(4px);
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// EARLY ACCESS MODAL
// The gate UI — renders over the page on card click or on the
// detail page as a full overlay gate strip.
// ─────────────────────────────────────────────────────────────────
export function EarlyAccessModal({ rosterType = "this roster", onClose }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // In production: POST to your waitlist endpoint / Airtable
    // For now: simulate success
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setEmail("");
      onClose?.();
    }, 3000);
  };

  return (
    <div className="gate-modal-overlay" onClick={onClose}>
      <div className="gate-modal" onClick={(e) => e.stopPropagation()}>
        <button className="gate-close-btn" onClick={onClose} aria-label="Close">✕</button>

        <div className="gate-lock-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <span className="gate-kicker">CLOSED BETA · BY REFERRAL</span>
        <h2 className="gate-title">Access Restricted</h2>
        <p className="gate-desc">
          {`The ${rosterType} is currently open to referred and vetted members only. 
          Register your interest to be notified when public access opens.`}
        </p>

        <div className="gate-divider" />

        {!sent ? (
          <form className="gate-form" onSubmit={handleSubmit}>
            <label className="gate-field-label">NOTIFY ME WHEN OPEN</label>
            <div className="gate-input-row">
              <input
                type="email"
                className="gate-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="gate-submit-btn">
                Register Interest →
              </button>
            </div>
          </form>
        ) : (
          <div className="gate-success">
            <span className="gate-success-icon">✓</span>
            <span>Registered. We&apos;ll notify you at launch.</span>
          </div>
        )}

        <p className="gate-footnote">
          Already have a referral code?{" "}
          <a href="mailto:hello@scout-it.vercel.app" className="gate-footnote-link">
            Contact the team directly →
          </a>
        </p>
      </div>

      <style>{`
        .gate-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(8px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: gateFadeIn 0.22s ease;
        }
        @keyframes gateFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .gate-modal {
          background: #0e0e0e;
          border: 1px solid rgba(200,169,110,0.25);
          border-top: 3px solid var(--accent, #c8a96e);
          border-radius: 6px;
          padding: 48px 44px;
          max-width: 480px;
          width: 100%;
          position: relative;
          animation: gateSlideUp 0.26s ease;
          text-align: center;
        }
        @keyframes gateSlideUp {
          from { transform: translateY(24px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .gate-close-btn {
          position: absolute;
          top: 16px;
          right: 20px;
          background: none;
          border: none;
          color: var(--text-muted, #555);
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          transition: color 0.2s;
        }
        .gate-close-btn:hover { color: var(--text-primary, #f0ede8); }
        .gate-lock-icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          border: 1px solid rgba(200,169,110,0.25);
          background: rgba(200,169,110,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent, #c8a96e);
          margin: 0 auto 20px;
        }
        .gate-kicker {
          display: block;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.18em;
          color: var(--accent, #c8a96e);
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .gate-title {
          font-family: var(--font-display, Georgia, serif);
          font-size: 28px;
          font-weight: 500;
          color: #fff;
          margin: 0 0 14px 0;
        }
        .gate-desc {
          font-size: 14px;
          color: var(--text-secondary, #888);
          line-height: 1.7;
          margin: 0;
        }
        .gate-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 28px 0;
        }
        .gate-field-label {
          display: block;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--accent, #c8a96e);
          text-align: left;
          margin-bottom: 10px;
        }
        .gate-input-row {
          display: flex;
          gap: 10px;
        }
        .gate-input {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          padding: 12px 16px;
          color: #fff;
          font-size: 13px;
          font-family: var(--font-body, system-ui);
          outline: none;
          transition: border-color 0.2s;
        }
        .gate-input:focus { border-color: var(--accent, #c8a96e); }
        .gate-submit-btn {
          background: var(--accent, #c8a96e);
          color: #0e0e0e;
          border: none;
          border-radius: 4px;
          padding: 12px 18px;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.04em;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s, transform 0.2s;
        }
        .gate-submit-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .gate-success {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: rgba(76,175,125,0.08);
          border: 1px solid rgba(76,175,125,0.2);
          border-radius: 4px;
          color: #4caf7d;
          font-size: 13px;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.04em;
          animation: gateFadeIn 0.3s ease;
        }
        .gate-success-icon {
          font-size: 16px;
        }
        .gate-footnote {
          margin-top: 20px;
          font-size: 12px;
          color: var(--text-muted, #555);
        }
        .gate-footnote-link {
          color: var(--accent, #c8a96e);
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .gate-footnote-link:hover { opacity: 0.75; }
        @media (max-width: 520px) {
          .gate-modal { padding: 36px 24px; }
          .gate-input-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DETAIL PAGE ACCESS GATE
// Renders as a top-of-page banner on [slug] detail pages.
// Content beneath is still visible (blur is optional) — the gate
// sits as a prominent strip above the content with a CTA.
// ─────────────────────────────────────────────────────────────────
export function DetailPageAccessGate({ rosterType = "this profile", providerName = "this provider" }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="detail-gate-strip">
        <div className="detail-gate-inner">
          <div className="detail-gate-left">
            <div className="detail-gate-lock">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <span className="detail-gate-kicker">ACCESS RESTRICTED — CLOSED BETA</span>
              <p className="detail-gate-msg">
                Full profile access for{" "}
                <strong style={{ color: "var(--accent, #c8a96e)" }}>{providerName}</strong>{" "}
                requires referral clearance. You are viewing a preview profile.
              </p>
            </div>
          </div>
          <button className="detail-gate-cta" onClick={() => setShowModal(true)}>
            Request Access →
          </button>
        </div>
      </div>

      {showModal && (
        <EarlyAccessModal
          rosterType={rosterType}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        .detail-gate-strip {
          background: linear-gradient(135deg, rgba(12,10,6,0.99) 0%, rgba(20,16,8,0.99) 100%);
          border: 1px solid rgba(200,169,110,0.2);
          border-left: 3px solid var(--accent, #c8a96e);
          border-radius: 4px;
          padding: 18px 28px;
          margin-bottom: 48px;
        }
        .detail-gate-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .detail-gate-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .detail-gate-lock {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(200,169,110,0.25);
          background: rgba(200,169,110,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent, #c8a96e);
          flex-shrink: 0;
        }
        .detail-gate-kicker {
          display: block;
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          letter-spacing: 0.14em;
          color: var(--accent, #c8a96e);
          text-transform: uppercase;
          margin-bottom: 5px;
          font-weight: 700;
        }
        .detail-gate-msg {
          font-size: 13px;
          color: var(--text-secondary, #888);
          margin: 0;
          line-height: 1.5;
        }
        .detail-gate-cta {
          background: transparent;
          border: 1px solid var(--accent, #c8a96e);
          color: var(--accent, #c8a96e);
          padding: 12px 24px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .detail-gate-cta:hover {
          background: var(--accent, #c8a96e);
          color: #0e0e0e;
        }
        @media (max-width: 640px) {
          .detail-gate-strip { padding: 16px 18px; }
          .detail-gate-cta { width: 100%; text-align: center; }
        }
      `}</style>
    </>
  );
}
