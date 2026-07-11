"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConnectsExplainer from "@/components/pricing/ConnectsExplainer";
import Link from "next/link";
import { Check } from "lucide-react";

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
        
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-gold-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="pricing-header z-10 relative">
          <Link href="/pricing" className="text-gold-accent font-mono text-xs uppercase tracking-widest hover:text-white transition-colors mb-8 inline-block">
            ← Back to Personas
          </Link>
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[#1A1710]/80 to-[#101820]/80 border border-gold-accent/30 inline-block">
            <p className="text-gold-bright font-mono text-xs uppercase tracking-widest font-bold">
              🚀 PIONEER COHORT
            </p>
            <p className="text-white text-sm mt-1">
              Lock in <span className="text-gold-accent font-bold">Pioneer Member</span> rates forever. Only 20 slots per role.
            </p>
          </div>
          <span className="vector-label text-gold-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // PORTFOLIO TIERS
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-white mb-6 drop-shadow-lg">
            Command Your <span className="text-gold-accent">Assets</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Take control of your properties. Upgrade your tier to accelerate QuestIT 3D Spatial generation, access deep market intelligence, and manage multi-asset portfolios.
          </p>
        </header>

        <div className="pricing-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-6 relative overflow-hidden transition-all duration-500 cursor-default ${
                tier.highlight 
                  ? 'bg-gradient-to-br from-[#1A241F] to-[#0A0908] border border-gold-accent/50 shadow-[0_0_40px_rgba(232,174,60,0.15)] hover:shadow-[0_0_60px_rgba(232,174,60,0.25)] hover:border-gold-accent transform hover:-translate-y-2' 
                  : 'bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 hover:bg-surface-alt/60 hover:border-text-primary/30'
              }`}
            >
              {tier.highlight && (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-accent to-gold-bright shadow-[0_0_15px_rgba(232,174,60,0.8)]"></div>
                  <div className="absolute top-4 right-4 bg-gold-accent text-background text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(232,174,60,0.3)]">
                    Most Popular
                  </div>
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gold-accent/10 rounded-full blur-3xl"></div>
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
                    <span className="text-3xl font-display-md text-white">{tier.price}</span>
                    {tier.price !== "₱0" && <span className="text-xs font-mono text-text-muted uppercase tracking-wider">/ {tier.period}</span>}
                  </div>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed h-10">
                  {tier.description}
                </p>
              </div>

              <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-lg ${tier.highlight ? 'bg-gold-accent/10 border border-gold-accent/20' : 'bg-white/5 border border-white/10'}`}>
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
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("scoutit:open-waitlist", { detail: { role: "owner", tier: tier.name, source: "pricing-owner" } }))}
                  className={`block w-full text-center py-3 rounded font-working-title text-xs uppercase tracking-widest font-bold cursor-pointer transition-all ${
                    tier.highlight
                      ? 'bg-gold-accent text-background hover:bg-gold-bright shadow-[0_0_20px_rgba(232,174,60,0.2)] hover:shadow-[0_0_30px_rgba(232,174,60,0.4)]'
                      : 'bg-transparent border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/10'
                  }`}
                >
                  Join the Waitlist
                </button>
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
          display: flex;
          flex-direction: column;
          background: #0A0908;
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
