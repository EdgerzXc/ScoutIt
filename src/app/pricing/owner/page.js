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
    name: "Starry Holder",
    price: "₱0",
    period: "forever",
    description: "Get your first space on the map.",
    connects: "1 Connect / month",
    features: [
      "1 active listing",
      "Basic fields & Google Drive photos",
      "Attach up to 2 brokers",
      "Receive broker pitches"
    ],
    highlight: false,
    buttonText: "Current Plan"
  },
  {
    name: "Solar Landlord",
    price: "₱899",
    originalPrice: "₱1,999",
    period: "monthly",
    description: "Serious about your asset visibility.",
    connects: "6 Connects / month",
    features: [
      "Up to 5 active listings",
      "Full 10-chapter edit capacity",
      "Attach unlimited brokers",
      "Spatial Queue Priority Level 3"
    ],
    highlight: false,
    buttonText: "Upgrade to Solar"
  },
  {
    name: "Cluster Developer",
    price: "₱2,499",
    originalPrice: "₱7,999",
    period: "monthly",
    description: "Multi-asset management with deep intelligence.",
    connects: "18 Connects / month",
    features: [
      "Up to 20 active listings",
      "Accelerated QuestIT Spatial Scanning",
      "Full inquiry analytics & lead funnel",
      "Market intelligence for your area",
      "AI copy optimization on all listings"
    ],
    highlight: true,
    buttonText: "Upgrade to Cluster"
  },
  {
    name: "Universe Portfolio",
    price: "₱9,999",
    originalPrice: "₱25,000",
    period: "monthly",
    description: "Institutional-grade presence.",
    connects: "40 Connects / month",
    features: [
      "Unlimited active listings",
      "Dedicated white-glove curation officer",
      "Off-market listing option",
      "Universe Principal buyer direct access",
      "CDN-hosted media for massive portfolios"
    ],
    highlight: false,
    buttonText: "Contact Sales"
  }
];

export default function OwnerPricingPage() {
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
            LAYER 08 // OWNER PLANS
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-text-primary mb-6 drop-shadow-lg">
            Manage Your <span className="text-gold-accent">Properties</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Publish your spaces with verified accuracy. Higher tiers add multi-property management, 3D floor plan conversion, inquiry analytics, and direct broker collaboration.
          </p>
        </header>

        <PilotPaymentNotice />

        <div className="pricing-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-6 relative overflow-hidden cursor-default backdrop-blur-md ${styles.card} ${tier.highlight ? styles.featuredCard : ""}`}
              style={tier.highlight ? { "--pricing-detail-tint": "var(--green-dim)" } : undefined}
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
                <PilotPaymentControls role="owner" tier={tier.name} source="pricing-owner" />
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
