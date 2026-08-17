"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CAPABILITIES = [
  {
    title: "One account, your whole portfolio",
    body: "A single company account for your organization. Manage your properties, brokers, and internal teams in one place.",
  },
  {
    title: "Invite your team, scope their access",
    body: "Your admin invites colleagues and assigns granular permissions for specific properties and broker relationships.",
  },
  {
    title: "Portfolio-wide updates in one move",
    body: "Publish updates across every property or broker relationship your company manages, without editing each listing one by one.",
  },
];

export default function EnterprisePage() {
  return (
    <div className="directory-layout">
      <Header />
      <main className="enterprise-main">
        <span className="vector-label">SCOUTIT FOR BUSINESS</span>
        <h1 className="enterprise-title">Enterprise Accounts</h1>
        <p className="enterprise-subtitle">
          For developers, brokerages, and property groups managing multi-asset portfolios.
          A company workspace built for collaborative teams.
        </p>

        <div className="enterprise-grid">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="enterprise-card">
              <h2>{c.title}</h2>
              <p>{c.body}</p>
            </div>
          ))}
        </div>

        <div className="enterprise-cta">
          <p>Currently in private preview. Explore the Enterprise Console from your dashboard, or reach out directly to discuss your portfolio.</p>
          <div className="enterprise-cta-row">
            <a href="/dashboard" className="enterprise-cta-btn">
              Preview the Enterprise Console →
            </a>
            <a href="mailto:hello@scoutit.space?subject=Enterprise%20Account%20Inquiry" className="enterprise-cta-secondary">
              Get in touch
            </a>
          </div>
        </div>
      </main>
      <Footer />

      <style jsx global>{`
        .enterprise-main {
          padding: 80px 24px;
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
        }
        .vector-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .enterprise-title {
          font-family: var(--font-display);
          font-size: 48px;
          color: #fff;
          margin: 16px 0;
        }
        .enterprise-subtitle {
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-secondary);
          max-width: 620px;
          margin: 0 auto 56px;
        }
        .enterprise-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          text-align: left;
          margin-bottom: 56px;
        }
        .enterprise-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 28px 24px;
        }
        .enterprise-card h3 {
          font-family: var(--font-display);
          font-size: 17px;
          color: var(--text-primary);
          margin-bottom: 10px;
        }
        .enterprise-card p {
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .enterprise-cta {
          padding: 40px;
          background: linear-gradient(135deg, rgba(232, 174, 60,0.06) 0%, var(--surface) 60%);
          border: 1px solid var(--accent-muted);
          border-radius: var(--radius-md);
        }
        .enterprise-cta p {
          color: var(--text-secondary);
          margin-bottom: 20px;
          font-size: 14px;
        }
        .enterprise-cta-btn {
          display: inline-flex;
          align-items: center;
          background: var(--accent-bright);
          color: var(--bg, #0e0e0e);
          font-weight: 700;
          padding: 14px 30px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          text-decoration: none;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .enterprise-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow);
        }
        .enterprise-cta-btn:active {
          transform: scale(0.96);
        }
        .enterprise-cta-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          align-items: center;
        }
        .enterprise-cta-secondary {
          display: inline-flex;
          align-items: center;
          color: var(--accent);
          border: 1px solid var(--accent-muted);
          padding: 13px 26px;
          border-radius: 4px;
          letter-spacing: 0.04em;
          text-decoration: none;
          font-size: 14px;
          transition: border-color 0.25s ease, background 0.25s ease;
        }
        .enterprise-cta-secondary:hover {
          border-color: var(--accent);
          background: rgba(232, 174, 60, 0.06);
        }
        @media (max-width: 768px) {
          .enterprise-grid { grid-template-columns: 1fr; }
          .enterprise-title { font-size: 34px; }
        }
      `}</style>
    </div>
  );
}
