"use client";

import { useState } from "react";

export default function ServiceConnectionPortal({ providerName, serviceType }) {
  const [alias, setAlias] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!alias || !email || !intent) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="portal-success">
        <span className="success-icon">🔑</span>
        <h3>Handshake Initialized</h3>
        <p>
          Secure communication portal requested with <strong>{providerName}</strong>. 
          Your credentials have been routed. Verify your comm link at <strong>{email}</strong> for validation coordinates.
        </p>
        <button className="reset-portal-btn" onClick={() => setSubmitted(false)}>
          Submit Another Request
        </button>

        <style>{`
          .portal-success {
            background: rgba(200, 169, 110, 0.04);
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
  }  return (
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
          <h4>Request Roster Channel Clearance</h4>
          <p>Submit security credentials to request a direct connection with this {serviceType}.</p>
        </div>
        
        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group-item">
              <label>Identification Alias</label>
              <input 
                type="text" 
                placeholder="e.g. Project Lead / Brand Director"
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
            <label>Service Intent Brief</label>
            <textarea 
              placeholder={`Outline your target space/project details, aesthetic requirements, and key deliverables timeline...`}
              rows="3" 
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="portal-submit-btn">
            Initialize Channel Request
          </button>
        </form>
      </div>
      <style>{`
        .connection-portal-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .connection-portal-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 40px;
          width: 100%;
        }

        .portal-header {
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 12px;
        }

        .portal-header h4 {
          font-family: var(--font-display);
          font-size: 20px;
          color: #fff;
          margin: 0 0 6px 0;
        }

        .portal-header p {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .portal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-group-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-item label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: bold;
        }

        .form-group-item input,
        .form-group-item textarea {
          background: rgba(0,0,0,0.3);
          border: 1px solid #333;
          border-radius: 4px;
          padding: 12px 16px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 13px;
          outline: none;
          transition: border-color var(--transition-fast);
        }

        .form-group-item input:focus,
        .form-group-item textarea:focus {
          border-color: var(--accent);
        }

        .portal-submit-btn {
          background: var(--accent);
          color: #0e0e0e;
          border: none;
          padding: 14px 28px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          align-self: flex-start;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .portal-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(200,169,110,0.3);
        }

        /* Safety Warning Disclaimer Styles */
        .safety-disclaimer-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(14, 14, 14, 0.6) 100%);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 8px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .safety-disclaimer-box:hover {
          border-color: rgba(245, 158, 11, 0.4);
          box-shadow: 0 8px 32px rgba(245, 158, 11, 0.05);
        }

        .disclaimer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(245, 158, 11, 0.15);
          padding-bottom: 12px;
        }

        .disclaimer-icon {
          font-size: 22px;
          line-height: 1;
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.6));
        }

        .disclaimer-header h5 {
          font-family: var(--font-mono), monospace;
          font-size: 13px;
          font-weight: 700;
          color: #f59e0b; /* Amber */
          letter-spacing: 0.1em;
          margin: 0;
        }

        .disclaimer-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .disclaimer-paragraph {
          font-size: 14px;
          line-height: 1.8;
          color: rgba(240, 237, 232, 0.8);
          margin: 0;
          letter-spacing: 0.02em;
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
          font-size: 11px;
          line-height: 1.6;
          color: rgba(240, 237, 232, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 12px;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}
