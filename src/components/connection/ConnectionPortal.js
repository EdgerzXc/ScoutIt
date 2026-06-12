"use client";

import { useState } from "react";

export default function ConnectionPortal({ brokerName }) {
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!alias || !email || !intent) return;
    
    // Save to local leads mock inbox (optionally) or just simulate success
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="portal-success">
        <span className="success-icon">🔑</span>
        <h3>Handshake Initialized</h3>
        <p>
          Secure communication portal requested with <strong>{brokerName}</strong>. 
          Your credentials have been routed. Verify your comm link at <strong>{email}</strong> for validation coordinates.
        </p>
        <button className="reset-portal-btn" onClick={() => setSubmitted(false)}>
          Submit Another Request
        </button>

        <style>{`
          .portal-success {
            background: rgba(255, 184, 0, 0.04);
            border: 1px solid var(--accent-border);
            border-radius: var(--radius-md);
            padding: 40px;
            text-align: center;
            max-width: 600px;
            margin: 0 auto;
            animation: fadeIn 0.4s ease-out forwards;
          }

          .success-icon {
            font-size: 32px;
            display: block;
            margin-bottom: 16px;
          }

          .portal-success h3 {
            font-family: var(--font-display);
            font-size: 22px;
            color: #fff;
            margin: 0 0 12px 0;
          }

          .portal-success p {
            font-size: 14px;
            line-height: 1.7;
            color: var(--text-secondary);
            margin-bottom: 24px;
          }

          .reset-portal-btn {
            background: transparent;
            border: 1px solid var(--accent);
            color: var(--accent);
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            transition: all var(--transition-fast);
            text-transform: uppercase;
          }

          .reset-portal-btn:hover {
            background: var(--accent);
            color: #0e0e0e;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="connection-portal-container">
      {/* Safety Notice Box FIRST */}
      <div className="safety-disclaimer-box">
        <div className="disclaimer-header">
          <span className="disclaimer-icon">⚠️</span>
          <h5>TRANSACTION INTEGRITY &amp; SECURITY PROTOCOL</h5>
        </div>
        <div className="disclaimer-content">
          <p className="disclaimer-paragraph">
            <strong>ScoutIt operates exclusively as a spatial intelligence platform and verified service provider index.</strong> All partner profiles, credentials, and license numbers displayed on this platform undergo baseline verification at the time of onboarding. However, <span className="highlight-warning">this verification does not constitute an endorsement, guarantee of performance, or warranty of any kind.</span>
          </p>
          <p className="disclaimer-paragraph">
            <strong>Users are solely responsible for conducting independent due diligence</strong> prior to entering into any financial transaction, contractual agreement, or professional engagement with any broker, photographer, researcher, or service provider listed on this platform.
          </p>
          <p className="disclaimer-paragraph">
            <span className="highlight-critical">ScoutIt does not facilitate, process, store, or hold any client payments, escrow arrangements, deposit agreements, or project contracts.</span> ScoutIt assumes <strong>no liability</strong> for the outcome, quality, or legality of any engagement initiated through this platform.
          </p>
          <p className="disclaimer-paragraph">
            By submitting an inquiry through ScoutIt, you acknowledge that your communication is directed solely to the listed service provider and that ScoutIt serves only as the introduction channel. <strong>All negotiations, agreements, and transactions occur exclusively between the user and the service provider.</strong>
          </p>
          <p className="disclaimer-paragraph">
            For disputes arising from any engagement, users are advised to seek independent legal counsel.
          </p>
          <div className="disclaimer-footer-compliance">
            ScoutIt is a display-only platform operating in compliance with <strong>Republic Act No. 9646 (Real Estate Service Act of the Philippines)</strong>.
          </div>
        </div>
      </div>

      {/* Connection Portal Card LAST */}
      <div className="connection-portal-card">
        <div className="portal-header">
          <h4>Request Contact Portal Clearance</h4>
          <p>Submit security credentials to request a direct communication channel with this advisor.</p>
        </div>
        
        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group-item">
              <label>Identification Alias</label>
              <input 
                type="text" 
                placeholder="e.g. Buyer Lead / Private Equity"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                required 
              />
            </div>
            <div className="form-group-item">
              <label>Secure Comm Link (Email)</label>
              <input 
                type="email" 
                placeholder="name@organization.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>
              <div className="form-group-item">
            <label>Acquisition Intent Brief</label>
            <textarea 
              placeholder="Outline your acquisition criteria, spatial sectors, and target deployment timeline..."
              rows="5" 
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="portal-submit-btn">
            Initialize Roster Handshake
          </button>
        </form>
      </div>

      <style>{`
        .connection-portal-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .connection-portal-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 60px 64px;
          width: 100%;
        }

        .portal-header {
          margin-bottom: 40px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 24px;
        }

        .portal-header h4 {
          font-family: var(--font-display);
          font-size: 34px;
          color: #fff;
          margin: 0 0 12px 0;
          letter-spacing: 0.01em;
        }

        .portal-header p {
          font-size: 18px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.65;
        }

        .portal-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .connection-portal-card {
            padding: 40px 32px;
          }
        }

        .form-group-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .form-group-item label {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: bold;
        }

        .form-group-item input,
        .form-group-item textarea {
          background: rgba(0,0,0,0.3);
          border: 1px solid #333;
          border-radius: 6px;
          padding: 18px 24px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 18px;
          outline: none;
          transition: border-color var(--transition-fast);
          line-height: 1.65;
        }

        .form-group-item input:focus,
        .form-group-item textarea:focus {
          border-color: var(--accent);
        }

        .portal-submit-btn {
          background: var(--accent);
          color: #0e0e0e;
          border: none;
          padding: 18px 44px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          align-self: flex-start;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .portal-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255,184,0,0.35);
        }

        /* Safety Warning Disclaimer Styles */
        .safety-disclaimer-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(14, 14, 14, 0.7) 100%);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 60px 64px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
        }

        @media (max-width: 768px) {
          .safety-disclaimer-box {
            padding: 40px 32px;
          }
        }

        .safety-disclaimer-box:hover {
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 12px 40px rgba(245, 158, 11, 0.08);
        }

        .disclaimer-header {
          display: flex;
          align-items: center;
          gap: 18px;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
          padding-bottom: 20px;
        }

        .disclaimer-icon {
          font-size: 34px;
          line-height: 1;
          filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.7));
        }

        .disclaimer-header h5 {
          font-family: var(--font-mono), monospace;
          font-size: 20px;
          font-weight: 700;
          color: #f59e0b; /* Amber */
          letter-spacing: 0.12em;
          margin: 0;
        }

        .disclaimer-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .disclaimer-paragraph {
          font-size: 18px;
          line-height: 1.9;
          color: rgba(240, 237, 232, 0.9);
          margin: 0;
          letter-spacing: 0.025em;
        }

        .disclaimer-paragraph strong {
          color: #fff;
          font-weight: 600;
        }

        .highlight-warning {
          color: #fcd34d; /* Light amber/yellow */
          font-weight: 500;
        }

        .highlight-critical {
          color: #f87171; /* Soft red/coral for high criticality statements */
          font-weight: 500;
        }

        .disclaimer-footer-compliance {
          font-family: var(--font-mono), monospace;
          font-size: 14px;
          line-height: 1.7;
          color: rgba(240, 237, 232, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 20px;
          margin-top: 16px;
        }      `}</style>
    </div>
  );
}
