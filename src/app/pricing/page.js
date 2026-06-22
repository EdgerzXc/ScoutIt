"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Diamond",
    price: "₱150,000",
    period: "annually",
    description: "The apex tier for elite brokerages managing multi-billion peso portfolios.",
    features: [
      "Unlimited premium property listings",
      "Unlimited 'Data Quests' to the QuestIT network",
      "Dedicated account manager",
      "Priority positioning on the Intelligence Roster",
      "Access to highly-classified unlisted off-market deals"
    ],
    highlight: true,
  },
  {
    name: "Platinum",
    price: "₱85,000",
    period: "annually",
    description: "For high-volume brokers demanding consistent visibility and analytics.",
    features: [
      "Up to 50 active premium listings",
      "100 Connects per month for direct pitches",
      "Advanced engagement analytics dashboard",
      "Featured placement on ScoutIt searches"
    ],
    highlight: false,
  },
  {
    name: "Gold",
    price: "₱45,000",
    period: "annually",
    description: "The standard for verified professionals building their portfolio.",
    features: [
      "Up to 20 active listings",
      "40 Connects per month",
      "Standard profile verification",
      "Basic insights on listing performance"
    ],
    highlight: false,
  },
  {
    name: "Silver",
    price: "₱15,000",
    period: "annually",
    description: "An entry point into the ScoutIt Space Intelligence network.",
    features: [
      "Up to 5 active listings",
      "10 Connects per month",
      "Public profile on the Advisor directory"
    ],
    highlight: false,
  },
  {
    name: "Bronze",
    price: "Free",
    period: "forever",
    description: "For independent agents starting their luxury real estate journey.",
    features: [
      "1 active listing",
      "3 Connects per month",
      "Basic public profile"
    ],
    highlight: false,
  }
];

export default function PricingPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main">
        <header className="pricing-header">
          <span className="vector-label">LAYER 08 // PARTNERSHIP TIERS</span>
          <h1 className="page-title">Intelligence Access Plans</h1>
          <p className="page-subtitle">Secure your position in the premier Philippine real estate verification platform.</p>
        </header>

        <div className="pricing-grid">
          {TIERS.map((tier) => (
            <div key={tier.name} className={`pricing-card ${tier.highlight ? "highlight-card" : ""}`}>
              {tier.highlight && <div className="highlight-badge">MOST POPULAR</div>}
              <div className="pricing-card-header">
                <h2 className="tier-name">{tier.name}</h2>
                <div className="tier-price-wrap">
                  <span className="tier-price">{tier.price}</span>
                  <span className="tier-period">/ {tier.period}</span>
                </div>
                <p className="tier-desc">{tier.description}</p>
              </div>

              <ul className="tier-features">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <Check className="check-icon" size={16} strokeWidth={2.5} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="card-footer">
                <Link href="/onboarding" className="btn-select-tier">
                  Select {tier.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />

      <style jsx>{`
        .pricing-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0d0d0d;
        }

        .pricing-main {
          flex: 1;
          padding: 80px 24px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 64px;
          max-width: 600px;
        }

        .vector-label {
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 16px;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 42px;
          color: #fff;
          margin-bottom: 16px;
        }

        .page-subtitle {
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .pricing-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: center;
          align-items: stretch;
          width: 100%;
        }

        .pricing-card {
          background: rgba(20, 20, 20, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: var(--radius-lg, 12px);
          padding: 40px 32px;
          width: calc(33.333% - 16px);
          min-width: 300px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;
        }

        .pricing-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-muted);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
        }

        .highlight-card {
          border-color: var(--accent-muted);
          background: linear-gradient(180deg, rgba(255, 184, 0, 0.05) 0%, rgba(20, 20, 20, 0.8) 100%);
        }

        .highlight-card:hover {
          border-color: var(--accent);
          box-shadow: 0 16px 40px rgba(255, 184, 0, 0.08);
        }

        .highlight-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--accent);
          color: #0d0d0d;
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 6px 16px;
          border-radius: 20px;
          box-shadow: 0 4px 12px rgba(255, 184, 0, 0.3);
        }

        .pricing-card-header {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--accent-muted);
        }

        .tier-name {
          font-family: var(--font-display);
          font-size: 24px;
          color: #fff;
          margin-bottom: 12px;
        }

        .tier-price-wrap {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tier-price {
          font-family: var(--font-display);
          font-size: 36px;
          color: #fff;
        }

        .tier-period {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .tier-desc {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 0 0 40px 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .check-icon {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .card-footer {
          margin-top: auto;
        }

        .btn-select-tier {
          display: block;
          width: 100%;
          text-align: center;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 16px 24px;
          border-radius: var(--radius-sm, 4px);
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-select-tier:hover {
          background: var(--accent);
          color: #0d0d0d;
          border-color: var(--accent);
        }

        .highlight-card .btn-select-tier {
          background: var(--accent);
          color: #0d0d0d;
        }

        .highlight-card .btn-select-tier:hover {
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 184, 0, 0.2);
        }

        @media (max-width: 1024px) {
          .pricing-card {
            width: calc(50% - 12px);
          }
        }

        @media (max-width: 768px) {
          .pricing-card {
            width: 100%;
          }
          .page-title {
            font-size: 32px;
          }
        }
      `}</style>
    </div>
  );
}
