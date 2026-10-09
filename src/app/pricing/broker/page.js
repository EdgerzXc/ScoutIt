"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConnectsExplainer from "@/components/pricing/ConnectsExplainer";
import PilotPaymentControls, { PilotPaymentNotice } from "@/components/pricing/PilotPaymentControls";
import Link from "next/link";
import { Check } from "lucide-react";
import styles from "@/components/pricing/PricingDetail.module.css";

const TIERS = [
  {
    name: "Starry Closer",
    price: "₱0",
    period: "forever",
    description: "Get listed on the intelligence roster and build your profile.",
    connects: "1 Connect / month",
    features: [
      "3 Active premium listings",
      "Standard Directory Placement",
      "Receive inbound inquiries",
      "PRC License verification badge"
    ],
    highlight: false,
    buttonText: "Current Plan"
  },
  {
    name: "Solar Advisor",
    price: "₱999",
    originalPrice: "₱2,499",
    period: "monthly",
    description: "Boost your visibility and start pitching owners directly.",
    connects: "8 Connects / month",
    features: [
      "Up to 15 active premium listings",
      "Boosted Search Placement",
      "Pitch to Owner Listings via Connects",
      "Downloadable ScoutIt Broker ID Card"
    ],
    highlight: false,
    buttonText: "Upgrade to Solar"
  },
  {
    name: "Cluster Strategist",
    price: "₱1,999",
    originalPrice: "₱6,499",
    period: "monthly",
    description: "Full platform power with priority lead routing.",
    connects: "20 Connects / month",
    features: [
      "Up to 50 active premium listings",
      "Priority Lead Routing from Cluster Buyers",
      "Full Lead Analytics Dashboard",
      "Featured placement on Category Pages",
      "AI-Assisted Listing Copy Optimization"
    ],
    highlight: true,
    buttonText: "Upgrade to Cluster"
  },
  {
    name: "Universe Elite",
    price: "₱7,999",
    originalPrice: "₱18,000",
    period: "monthly",
    description: "Maximum routing eligibility and white-glove curation for large brokerages.",
    connects: "50 Connects / month",
    features: [
      "Unlimited premium listings",
      "White-Glove Listing Curation by ScoutIt",
      "Direct access to Universe Principal buyers",
      "Dedicated account scout",
      "Off-market deal pipeline access"
    ],
    highlight: false,
    buttonText: "Contact Sales"
  }
];

export default function BrokerPricingPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main relative overflow-hidden">
        
        <div className={`${styles.ambient} pricing-detail-ambient absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-gold-accent/10 rounded-full blur-[120px] pointer-events-none`}></div>
        <div className={`${styles.ambient} absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none`}></div>

        <header className="pricing-header z-10 relative">
          <Link href="/pricing" className="text-gold-accent font-mono text-xs uppercase tracking-widest hover:text-on-surface transition-colors mb-8 inline-block">
            ← Back to Personas
          </Link>
          <div className={`${styles.pioneer} mb-8 p-4 rounded-xl inline-block`}>
            <p className="text-gold-bright font-mono text-xs uppercase tracking-widest font-bold">
              ◈ PIONEER COHORT
            </p>
            <p className="text-text-primary text-sm mt-1">
              Lock in <span className="text-gold-accent font-bold">Pioneer Member</span> rates forever. Only 20 slots per role.
            </p>
          </div>
          <span className="vector-label text-gold-accent tracking-[0.12em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // ADVISOR PLANS
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-text-primary mb-6 drop-shadow-lg">
            Connect with <span className="text-gold-accent">Qualified Deals</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            A subscription opens eligibility for ScoutIt&apos;s priority lead routing and direct owner pitches. Your position on the independent Advisor Roster is earned through verified performance, not paid placement.
          </p>
        </header>

        <PilotPaymentNotice />

        <div className="pricing-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-6 relative overflow-hidden cursor-default backdrop-blur-md ${styles.card} ${tier.highlight ? styles.featuredCard : ""}`}
              style={tier.highlight ? { "--pricing-detail-tint": "var(--sapphire-dim)" } : undefined}
            >
              {tier.highlight && (
                <>
                  <div className={`${styles.accentBar} absolute top-0 left-0 w-full h-1`}></div>
                  <div className={`${styles.badge} absolute top-4 right-4 text-[12px] font-bold uppercase tracking-widest px-3 py-1 rounded-full`}>
                    Most Popular
                  </div>
                  <div className={`${styles.ambient} absolute -bottom-24 -right-24 w-48 h-48 bg-gold-accent/10 rounded-full blur-3xl`}></div>
                </>
              )}

              <div className="mb-6">
                <h2 className={`text-2xl font-working-title mb-3 ${tier.highlight ? 'text-gold-accent drop-shadow-sm' : 'text-on-surface'}`}>
                  {tier.name}
                </h2>
                <div className="flex flex-col gap-1 mb-3">
                  {tier.originalPrice && (
                    <span className="text-sm font-mono text-text-muted line-through decoration-red-500/50">
                      {tier.originalPrice}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-display-md text-text-primary">{tier.price}</span>
                    {tier.price !== "₱0" && <span className="text-xs font-mono text-text-muted uppercase tracking-wider">/ {tier.period}</span>}
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed h-10">
                  {tier.description}
                </p>
              </div>

              <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-lg ${styles.connects} ${tier.highlight ? styles.connectsFeatured : ""}`}>
                <span className="text-gold-accent font-mono font-bold text-sm">◈</span>
                <span className={`text-xs font-mono font-semibold ${tier.highlight ? 'text-gold-accent' : 'text-text-secondary'}`}>{tier.connects}</span>
              </div>

              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-gold-accent' : 'text-text-secondary'}`} size={14} strokeWidth={3} />
                    <span className="text-xs text-on-surface leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <PilotPaymentControls role="broker" tier={tier.name} source="pricing-broker" />
              </div>
            </div>
          ))}
        </div>
        <ConnectsExplainer />
      </main>
      <Footer />

      <style jsx>{`
        .pricing-layout {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background: var(--bg);
        }

        .pricing-main {
          flex: 1;
          padding: 60px 0 120px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }
      `}</style>
    </div>
  );
}
