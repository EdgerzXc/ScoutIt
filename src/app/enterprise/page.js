"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const CAPABILITIES = [
  {
    title: "One account, your whole portfolio",
    body: "A single company account for your organization — your own properties, your own brokers, your own team.",
  },
  {
    title: "Invite your team, scope their access",
    body: "Your super-admin invites named colleagues and grants each exactly what they need — specific properties, specific broker relationships, nothing more.",
  },
  {
    title: "Company-wide updates in one move",
    body: "Push a change across every property or every broker relationship your company manages, instead of one listing at a time.",
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
          For developers, brokerages, and property groups managing more than a handful of listings —
          a company account built for teams, not individuals.
        </p>

        <div className="enterprise-grid">
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="enterprise-card">
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>

        <div className="enterprise-cta">
          <p>Currently in early development. Tell us about your portfolio and we&apos;ll reach out.</p>
          <a href="mailto:hello@scout-it.vercel.app?subject=Enterprise%20Account%20Inquiry" className="enterprise-cta-btn">
            Get in touch →
          </a>
        </div>
      </main>
      <Footer />

      <style>{`
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
          color: #0e0e0e;
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
        @media (max-width: 768px) {
          .enterprise-grid { grid-template-columns: 1fr; }
          .enterprise-title { font-size: 34px; }
        }
      `}</style>
    </div>
  );
}
