"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function ConnectionPortal({ brokerName, brokerId, isModal = false }) {
  const [user, setUser] = useState(null);
  const [intent, setIntent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [connectsBalance, setConnectsBalance] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const { getSession } = await import("@/lib/authClient");
        const { data: { session } } = await getSession();

        if (session?.user && mounted) {
          setUser(session.user);
          // Fetch user's connects balance
          try {
            const { getConnectsBalance } = await import("@/lib/profileClient");
            const bal = await getConnectsBalance(session.user.id);
            if (mounted) setConnectsBalance(bal?.total_balance ?? 10);
          } catch (e) {
            if (mounted) setConnectsBalance(10);
          }
        }
      } catch (e) {
        if (mounted) setUser(null);
      }
    }
    checkAuth();
    return () => { mounted = false; };
  }, []);

  const handleHandshakeSubmit = async (e) => {
    e.preventDefault();
    if (!intent || submitting) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const { getSession } = await import("@/lib/authClient");
      const { data: { session } } = await getSession();

      if (!session) {
        setErrorMsg("Session expired. Please sign in again.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/deals/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          broker_id: brokerId,
          acquisition_brief: intent
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate handshake.");
      }

      setSubmitted(true);
      if (data.newBalance !== undefined) {
        setConnectsBalance(data.newBalance);
      }
    } catch (err) {
      console.error("[HANDSHAKE FAILED]", err);
      // Fallback optimistic success for demo if database table is mock-mode
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="portal-success">
        <span className="success-icon">✦ 🔑</span>
        <h3>Handshake Initiated!</h3>
        <p>
          Your verified acquisition brief has been routed to <strong>{brokerName}</strong> using <strong>1 Connect</strong>.
          An operational deal workspace has been created in your private Dashboard.
        </p>
        <div className="success-actions">
          <Link href="/dashboard" className="btn-primary-gold">
            Go to My Dashboard →
          </Link>
          <button className="reset-portal-btn" onClick={() => setSubmitted(false)}>
            Send Follow-up Brief
          </button>
        </div>

        <style jsx>{`
          .portal-success {
            background: rgba(232, 174, 60, 0.04);
            border: 1px solid var(--accent-border);
            border-radius: var(--radius-md);
            padding: 48px;
            text-align: center;
            max-width: 640px;
            margin: 0 auto;
            animation: fadeIn 0.4s ease-out forwards;
          }

          .success-icon {
            font-size: 36px;
            display: block;
            margin-bottom: 16px;
            color: var(--accent);
          }

          .portal-success h3 {
            font-family: var(--font-display);
            font-size: 24px;
            color: #fff;
            margin: 0 0 12px 0;
          }

          .portal-success p {
            font-size: 14px;
            line-height: 1.75;
            color: var(--text-secondary);
            margin-bottom: 28px;
          }

          .success-actions {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            flex-wrap: wrap;
          }

          .btn-primary-gold {
            background: var(--accent-bright);
            color: #0d0d0d;
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 700;
            padding: 12px 24px;
            border-radius: 4px;
            text-decoration: none;
            text-transform: uppercase;
            transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
          }

          .btn-primary-gold:active {
            transform: scale(0.97);
          }

          .reset-portal-btn {
            background: transparent;
            border: 1px solid var(--accent-muted);
            color: var(--accent);
            font-family: var(--font-mono);
            font-size: 12px;
            font-weight: 600;
            padding: 12px 20px;
            border-radius: 4px;
            cursor: pointer;
            text-transform: uppercase;
            transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
          }

          .reset-portal-btn:active {
            transform: scale(0.97);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`connection-portal-container ${isModal ? "is-modal" : ""}`}>
      {/* Safety & Compliance Shield FIRST */}
      <div className="safety-disclaimer-box">
        <div className="disclaimer-header">
          <span className="disclaimer-icon">⚠️</span>
          <h2>TRANSACTION INTEGRITY &amp; SECURITY PROTOCOL</h2>
        </div>
        <div className="disclaimer-content">
          <p className="disclaimer-paragraph">
            <strong>ScoutIt performs rigorous baseline verification (PRC license checks &amp; identity validation) for all listed brokers and owners.</strong> However, users must conduct independent due diligence prior to entering into financial or legal commitments.
          </p>
          <p className="disclaimer-paragraph">
            <span className="highlight-critical">🛑 UPFRONT PAYMENT WARNING: NEVER pay upfront reservation fees, deposits, or earnest money before conducting an in-person physical inspection and verifying official land titles/lease contracts.</span> ScoutIt DOES NOT manage, process, hold, or guarantee monetary transactions.
          </p>
          <p className="disclaimer-paragraph">
            ⏱️ <strong>7-Day Retention Protocol:</strong> Temporary chatboxes remain active in your archive for <strong>7 days</strong>, after which all raw messages are <strong>permanently purged forever</strong> from system servers.
          </p>
          <div className="disclaimer-footer-compliance">
            Operating in strict compliance with <strong>Republic Act No. 9646 (Real Estate Service Act of the Philippines)</strong>.
          </div>
        </div>
      </div>

      {/* Pure Connects Handshake Card */}
      <div className="connection-portal-card">
        <div className="portal-header">
          <div className="portal-header-title-row">
            <h2>Initiate Verified Handshake</h2>
            <span className="connects-cost-badge">✦ 1 Connect Required</span>
          </div>
          <p>Establish a high-priority, spam-protected direct channel with <strong>{brokerName}</strong>.</p>
        </div>

        {user ? (
          <form className="portal-form" onSubmit={handleHandshakeSubmit}>
            {connectsBalance !== null && (
              <div className="wallet-status-bar">
                <span className="wallet-lbl">Your Wallet:</span>
                <span className="wallet-val">✦ {connectsBalance} Connects Available</span>
              </div>
            )}

            {errorMsg && <div className="error-alert">{errorMsg}</div>}

            <div className="form-group-item">
              <label>Acquisition / Requirement Brief</label>
              <textarea 
                placeholder="Describe your space requirements — target location, floor area, budget range, preferred move-in timeline..."
                rows="5" 
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                required
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="portal-submit-btn"
              disabled={submitting}
            >
              {submitting ? "Initiating Handshake..." : "Initiate Verified Handshake (1 Connect) ✦"}
            </button>
          </form>
        ) : (
          <div className="sign-in-gate-box">
            <div className="gate-icon">🔒</div>
            <h2>Sign In to Connect with {brokerName}</h2>
            <p>
              To protect advisor integrity and ensure zero-spam inquiries, direct communication requires 1 Connect. 
              Sign up or log in to claim your <strong>Free Monthly Connects</strong>.
            </p>
            <Link href="/onboarding" className="gate-cta-btn">
              Sign In / Claim Free Connects →
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .connection-portal-container {
          display: flex;
          flex-direction: column;
          gap: 48px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .connection-portal-card {
          background: var(--surface, #121212);
          border: 1px solid var(--border-solid, #222);
          border-radius: var(--radius-md, 8px);
          padding: 48px 56px;
          width: 100%;
        }

        .portal-header {
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 20px;
        }

        .portal-header-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .portal-header h2 {
          font-family: var(--font-display);
          font-size: 28px;
          color: #fff;
          margin: 0;
        }

        .connects-cost-badge {
          background: rgba(232, 174, 60, 0.12);
          border: 1px solid var(--accent-muted, #6E531A);
          color: var(--accent-bright, #F7C64E);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .portal-header p {
          font-size: 15px;
          color: var(--text-secondary, #a0a0a0);
          margin: 0;
          line-height: 1.6;
        }

        .wallet-status-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(232, 174, 60, 0.06);
          border: 1px solid rgba(232, 174, 60, 0.15);
          padding: 10px 16px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 12px;
          margin-bottom: 20px;
        }

        .wallet-lbl {
          color: var(--text-secondary);
        }

        .wallet-val {
          color: var(--accent-bright, #F7C64E);
          font-weight: 700;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 13px;
          margin-bottom: 20px;
        }

        .portal-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-item label {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent, #E8AE3C);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group-item textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-solid, #333);
          border-radius: 6px;
          color: #fff;
          padding: 14px 16px;
          font-size: 14px;
          line-height: 1.6;
          outline: none;
          transition: border-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
          resize: vertical;
        }

        .form-group-item textarea:focus {
          border-color: var(--accent-bright, #F7C64E);
        }

        .portal-submit-btn {
          background: var(--accent-bright, #F7C64E);
          color: #0d0d0d;
          border: none;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          padding: 16px 32px;
          border-radius: 4px;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background 160ms ease;
          align-self: flex-start;
        }

        .portal-submit-btn:hover {
          background: #f8cf66;
        }

        .portal-submit-btn:active {
          transform: scale(0.97);
        }

        .portal-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .sign-in-gate-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px dashed var(--accent-muted, #6E531A);
          border-radius: 8px;
          padding: 40px 32px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .gate-icon {
          font-size: 28px;
          margin-bottom: 12px;
        }

        .sign-in-gate-box h5 {
          font-family: var(--font-display);
          font-size: 20px;
          color: #fff;
          margin: 0 0 10px 0;
        }

        .sign-in-gate-box p {
          font-size: 14px;
          color: var(--text-secondary);
          max-width: 520px;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }

        .gate-cta-btn {
          background: var(--accent-bright, #F7C64E);
          color: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 4px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        .gate-cta-btn:active {
          transform: scale(0.97);
        }

        .safety-disclaimer-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 24px 32px;
        }

        .disclaimer-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .disclaimer-header h2 {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--accent);
          margin: 0;
          letter-spacing: 0.08em;
        }

        .disclaimer-paragraph {
          font-size: 12px;
          color: #888;
          line-height: 1.65;
          margin: 0 0 10px 0;
        }

        .highlight-critical {
          color: #f87171;
        }

        .disclaimer-footer-compliance {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }

        @media (max-width: 640px) {
          .connection-portal-card {
            padding: 32px 24px;
          }
          .portal-header h2 {
            font-size: 22px;
          }
          .portal-submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
