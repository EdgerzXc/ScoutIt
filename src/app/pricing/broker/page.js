"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Check } from "lucide-react";

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
    description: "Top-of-roster placement for massive brokerages.",
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
        
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="pricing-header z-10 relative">
          <Link href="/pricing" className="text-blue-400 font-mono text-xs uppercase tracking-widest hover:text-white transition-colors mb-8 inline-block">
            ← Back to Personas
          </Link>
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-400/30 inline-block">
            <p className="text-blue-300 font-mono text-xs uppercase tracking-widest font-bold">
              🚀 PIONEER COHORT
            </p>
            <p className="text-white text-sm mt-1">
              Lock in <span className="text-blue-400 font-bold">Pioneer Member</span> rates forever. Only 20 slots per role.
            </p>
          </div>
          <span className="vector-label text-blue-400 tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // ADVISOR TIERS
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-white mb-6 drop-shadow-lg">
            Dominate The <span className="text-blue-400">Intelligence Roster</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Stop paying for generic leads. Upgrade your tier to boost your algorithms, unlock priority lead routing from our wealthiest buyers, and pitch directly to property owners.
          </p>
        </header>

        <div className="pricing-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-6 relative overflow-hidden transition-all duration-500 cursor-default ${
                tier.highlight 
                  ? 'bg-gradient-to-br from-[#1A1C24] to-[#0A0908] border border-blue-400/50 shadow-[0_0_40px_rgba(96,165,250,0.15)] hover:shadow-[0_0_60px_rgba(96,165,250,0.25)] hover:border-blue-400 transform hover:-translate-y-2' 
                  : 'bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 hover:bg-surface-alt/60 hover:border-text-primary/30'
              }`}
            >
              {tier.highlight && (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-300 shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
                  <div className="absolute top-4 right-4 bg-blue-400 text-[#0A0908] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.3)]">
                    Most Popular
                  </div>
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>
                </>
              )}

              <div className="mb-6">
                <h2 className={`text-2xl font-working-title mb-3 ${tier.highlight ? 'text-blue-400 drop-shadow-sm' : 'text-on-surface'}`}>
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

              <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-lg ${tier.highlight ? 'bg-blue-400/10 border border-blue-400/20' : 'bg-white/5 border border-white/10'}`}>
                <span className="text-gold-accent font-mono font-bold text-sm">◈</span>
                <span className={`text-xs font-mono font-semibold ${tier.highlight ? 'text-blue-400' : 'text-text-secondary'}`}>{tier.connects}</span>
              </div>

              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-blue-400' : 'text-text-secondary'}`} size={14} strokeWidth={3} />
                    <span className="text-xs text-on-surface leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <div
                  aria-disabled="true"
                  title="Subscriptions launch soon"
                  className={`block w-full text-center py-3 rounded font-working-title text-xs uppercase tracking-widest font-bold cursor-not-allowed opacity-70 ${
                    tier.highlight
                      ? 'bg-blue-400 text-[#0A0908] hover:bg-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:shadow-[0_0_30px_rgba(96,165,250,0.4)]'
                      : 'bg-transparent border border-surface-variant text-text-secondary hover:text-white hover:border-text-primary'
                  }`}
                >
                  Coming Soon
                </div>
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
