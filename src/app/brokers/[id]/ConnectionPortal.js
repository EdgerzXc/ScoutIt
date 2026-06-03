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
  }

  return (
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
            rows="3" 
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            required
          ></textarea>
        </div>

        <button type="submit" className="portal-submit-btn">
          Initialize Roster Handshake
        </button>
      </form>

      <style>{`
        .connection-portal-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
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
      `}</style>
    </div>
  );
}
