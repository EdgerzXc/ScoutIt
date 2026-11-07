"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function inferTargetRole(targetRole, serviceType) {
  const raw = String(targetRole || serviceType || "").trim().toLowerCase();
  if (raw.includes("photo")) return "photographer";
  if (raw.includes("design") || raw.includes("event")) return "designer";
  if (raw.includes("research")) return "researcher";
  return "photographer";
}

export default function ServiceConnectionPortal({
  providerId,
  providerName,
  serviceType = "Spatial Photographer",
  targetRole,
  forSlug = "",
  forTitle = "",
  isModal = false,
}) {
  const [user, setUser] = useState(null);
  const [projectTitle, setProjectTitle] = useState(forTitle || "");
  const [intent, setIntent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const resolvedRole = inferTargetRole(targetRole, serviceType);
  const roleHeadline =
    resolvedRole === "photographer"
      ? "Spatial Photographer"
      : resolvedRole === "designer"
        ? "Event & Concept Designer"
        : resolvedRole === "researcher"
          ? "Zoning & Land Researcher"
          : serviceType;

  useEffect(() => {
    let mounted = true;
    async function checkAuth() {
      try {
        const { getSession } = await import("@/lib/authClient");
        const { data: { session } } = await getSession();
        if (session?.user && mounted) {
          setUser(session.user);
        }
      } catch {
        if (mounted) setUser(null);
      }
    }
    checkAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!intent.trim() || submitting) return;

    if (!providerId) {
      setErrorMsg("This professional profile is a public CMS preview without a linked account yet.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const { getSession } = await import("@/lib/authClient");
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setErrorMsg("Please sign in to connect with this Layer 4 professional.");
        setSubmitting(false);
        return;
      }

      const cleanTitle = (projectTitle || forTitle || `${roleHeadline} Booking`).trim();
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          otherPartyEmail: providerId,
          propertySlug: forSlug || null,
          targetRole: resolvedRole,
          serviceTitle: cleanTitle,
          sourceLayer: "layer_4_professionals",
          status: "pending",
          initialMessage: intent.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || "Could not send request. No Connect was spent.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[SERVICE PORTAL FAILED]", err);
      setErrorMsg("Could not reach ScoutIt to send your request. No Connect was spent.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="portal-success">
        <span className="success-icon">✦ 🔑</span>
        <h3>{roleHeadline} Request Sent!</h3>
        <p>
          Your Layer 4 project brief for <strong>{providerName}</strong> has been delivered to their{" "}
          <strong>{roleHeadline} Lens</strong> in Deal Inbox and Master CRM using <strong>1 Connect</strong>.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/dashboard/inbox" className="reset-portal-btn" style={{ textDecoration: "none" }}>
            Open Deal Inbox →
          </Link>
          <button className="reset-portal-btn" onClick={() => setSubmitted(false)}>
            Submit Another Request
          </button>
        </div>

        <style jsx global>{`
          .portal-success {
            background: rgba(var(--accent-rgb), 0.04);
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
            color: var(--on-surface);
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
            font-size: 12px;
            font-weight: 600;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            transition: color var(--transition-fast), background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast), opacity var(--transition-fast), filter var(--transition-fast);
            text-transform: uppercase;
          }

          .reset-portal-btn:hover {
            background: var(--accent);
            color: var(--background);
          }
        `}</style>
      </div>
    );
  }  return (
    <div className={`connection-portal-container ${isModal ? "is-modal" : ""}`}>
      {/* Safety Notice Box FIRST */}
      <div className="safety-disclaimer-box">
        <div className="disclaimer-header">
          <span className="disclaimer-icon">⚠️</span>
          <h2>TRANSACTION INTEGRITY &amp; SECURITY PROTOCOL</h2>
        </div>
        <div className="disclaimer-content">
          <p className="disclaimer-paragraph">
            <strong>ScoutIt operates exclusively as a spatial intelligence platform and service provider index.</strong> Partner profiles, credentials, and license numbers shown here are provided by the partner and checked for completeness at onboarding. However, <span className="highlight-warning">this verification does not constitute an endorsement, guarantee of performance, or warranty of any kind.</span>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>Request {roleHeadline}</h4>
            <span style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--accent)",
              border: "1px solid var(--accent-muted)",
              background: "rgba(var(--accent-rgb), 0.1)",
              padding: "4px 12px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Layer 04 · Needs {roleHeadline} · 1 Connect
            </span>
          </div>
          <p>
            Open a direct Deal Room with <strong>{providerName}</strong> tagged specifically for their{" "}
            <strong>{roleHeadline}</strong> workspace lens.
          </p>
        </div>

        {!user ? (
          <div style={{
            background: "var(--surface2)",
            border: "1px dashed var(--accent-muted)",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
          }}>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--on-surface)", marginBottom: 8 }}>
              Sign In to Request {providerName}
            </h4>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>
              Sign in to send a verified Layer 4 brief to {providerName}&apos;s {roleHeadline} Inbox and Master CRM.
            </p>
            <Link href="/onboarding" className="portal-submit-btn" style={{ display: "inline-block", textDecoration: "none" }}>
              Sign In / Claim Connects →
            </Link>
          </div>
        ) : (
          <form className="portal-form" onSubmit={handleSubmit}>
            {errorMsg && (
              <div
                role="alert"
                style={{
                  background: "rgba(var(--red-rgb, 239, 68, 68), 0.1)",
                  border: "1px solid rgba(var(--red-rgb, 239, 68, 68), 0.35)",
                  color: "var(--red)",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-group-item">
              <label htmlFor="service-project-title">Space or Project Name</label>
              <input
                id="service-project-title"
                type="text"
                placeholder={`e.g. BGC Penthouse Shoot / Makati Showroom (${roleHeadline})`}
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group-item">
              <label htmlFor="service-project-intent">What do you need from this {roleHeadline}?</label>
              <textarea
                id="service-project-intent"
                placeholder="Describe your project: the space, deliverables needed, and target schedule..."
                rows="5"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="portal-submit-btn" disabled={submitting}>
              {submitting ? "Sending Request..." : `Request ${roleHeadline} (1 Connect) →`}
            </button>
          </form>
        )}
      </div>
      <style jsx global>{`
        
        .connection-portal-container.is-modal {
          gap: 32px;
        }

        .connection-portal-container.is-modal .connection-portal-card {
          background: transparent;
          border: none;
          padding: 0;
          box-shadow: none;
        }

        .connection-portal-container.is-modal .safety-disclaimer-box {
          padding: 32px;
        }

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
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 24px;
        }

        .portal-header h4 {
          font-family: var(--font-display);
          font-size: 34px;
          color: var(--on-surface);
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
          background: color-mix(in srgb, var(--bg) 30%, transparent);
          border: 1px solid var(--border-solid);
          border-radius: 6px;
          padding: 18px 24px;
          color: var(--on-surface);
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
          color: var(--background);
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
          box-shadow: 0 4px 16px rgba(var(--accent-rgb), 0.35);
        }

        /* Safety Warning Disclaimer Styles */
        .safety-disclaimer-box {
          background: linear-gradient(135deg, color-mix(in srgb, var(--yellow) 6%, transparent) 0%, color-mix(in srgb, var(--surface) 70%, transparent) 100%);
          border: 1px solid color-mix(in srgb, var(--yellow) 30%, transparent);
          border-radius: 8px;
          padding: 60px 64px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          box-shadow: 0 12px 40px rgba(var(--bg-rgb), 0.6);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
        }

        @media (max-width: 768px) {
          .safety-disclaimer-box {
            padding: 40px 32px;
          }
        }

        .safety-disclaimer-box:hover {
          border-color: color-mix(in srgb, var(--yellow) 45%, transparent);
          box-shadow: 0 12px 40px color-mix(in srgb, var(--yellow) 8%, transparent);
        }

        .disclaimer-header {
          display: flex;
          align-items: center;
          gap: 18px;
          border-bottom: 1px solid color-mix(in srgb, var(--yellow) 20%, transparent);
          padding-bottom: 20px;
        }

        .disclaimer-icon {
          font-size: 34px;
          line-height: 1;
          filter: drop-shadow(0 0 8px color-mix(in srgb, var(--yellow) 70%, transparent));
        }

        .disclaimer-header h2 {
          font-family: var(--font-mono), monospace;
          font-size: 20px;
          font-weight: 700;
          color: var(--yellow);
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
          color: var(--text-primary);
          margin: 0;
          letter-spacing: 0.025em;
        }

        .disclaimer-paragraph strong {
          color: var(--on-surface);
          font-weight: 600;
        }

        .highlight-warning {
          color: var(--accent-bright);
          font-weight: 500;
        }

        .highlight-critical {
          color: var(--red);
          font-weight: 500;
        }

        .disclaimer-footer-compliance {
          font-family: var(--font-mono), monospace;
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          border-top: 1px solid var(--border);
          padding-top: 20px;
          margin-top: 16px;
        }      `}</style>
    </div>
  );
}
