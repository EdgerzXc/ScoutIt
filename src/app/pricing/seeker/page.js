"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConnectsExplainer from "@/components/pricing/ConnectsExplainer";
import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Starry Wanderer",
    price: "₱0",
    period: "forever",
    description: "Basic access to standard property data and public listings.",
    connects: "1 Connect / month",
    features: [
      "View public photos & descriptions",
      "Full editorial property intel",
      "Unlimited private saves — no account needed",
      "Anonymous on-device board"
    ],
    highlight: false,
    buttonText: "Current Plan"
  },
  {
    name: "Solar Seeker",
    price: "₱149",
    period: "monthly",
    description: "Unlock Deep Intelligence metrics and enhanced visuals.",
    connects: "6 Connects / month",
    features: [
      "Deep Intel (Cap Rates, Noise Levels)",
      "Enhanced property photos unlocked",
      "Guide Wizard full access",
      "Anonymous connect proxy enabled"
    ],
    highlight: false,
    buttonText: "Upgrade to Solar"
  },
  {
    name: "Cluster Scout",
    price: "₱499",
    period: "monthly",
    description: "Unlock the Spatial Vault and total Identity Reveal Control.",
    connects: "15 Connects / month",
    features: [
      "The Vault Unlocked (Luma 3D Maps)",
      "Unlock Drone Heatmaps & Spatial intel",
      "Identity reveal control (Anonymity shield)",
      "Priority broker matching",
      "Bounty task participation"
    ],
    highlight: true,
    buttonText: "Upgrade to Cluster"
  },
  {
    name: "Universe Principal",
    price: "₱2,499",
    period: "monthly",
    description: "White-glove intelligence for corporate scouts.",
    connects: "40 Connects / month",
    features: [
      "Everything in Cluster Scout",
      "Exclusive Universe-only listings",
      "Custom briefing requests",
      "Dedicated space curator",
      "Full off-market pipeline view"
    ],
    highlight: false,
    buttonText: "Contact Sales"
  }
];

export default function SeekerPricingPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main relative overflow-hidden">
        
        {/* Cinematic Background Glows */}
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-gold-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="pricing-header z-10 relative">
          <span className="vector-label text-gold-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 09 // DEMAND-SIDE INTELLIGENCE
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-white mb-6 drop-shadow-lg">
            Unlock The <span className="text-gold-accent">Spatial Vault</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Standard data is free. Deep Intelligence is a premium asset. Upgrade your account to bypass the Escrow paywalls and access immersive 3D maps, heatmaps, and classified coordinates.
          </p>
        </header>

        <div className="pricing-grid z-10 relative w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-8 relative overflow-hidden transition-all duration-500 cursor-default ${
                tier.highlight 
                  ? 'bg-gradient-to-br from-[#1A1814] to-[#0A0908] border border-gold-accent/50 shadow-[0_0_40px_rgba(255,184,0,0.15)] hover:shadow-[0_0_60px_rgba(255,184,0,0.25)] hover:border-gold-accent transform hover:-translate-y-2' 
                  : 'bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 hover:bg-surface-alt/60 hover:border-text-primary/30'
              }`}
            >
              {tier.highlight && (
                <>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold-accent to-[#FFC929] shadow-[0_0_15px_rgba(255,184,0,0.8)]"></div>
                  <div className="absolute top-4 right-4 bg-gold-accent text-[#0A0908] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(255,184,0,0.3)]">
                    Most Popular
                  </div>
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-gold-accent/10 rounded-full blur-3xl"></div>
                </>
              )}

              <div className="mb-8">
                <h2 className={`text-3xl font-working-title mb-4 ${tier.highlight ? 'text-gold-accent drop-shadow-sm' : 'text-on-surface'}`}>
                  {tier.name}
                </h2>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-display-md text-white">{tier.price}</span>
                  <span className="text-sm font-mono text-text-muted uppercase tracking-wider">/ {tier.period}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed h-12">
                  {tier.description}
                </p>
              </div>

              <div className={`flex items-center gap-2 mb-6 px-3 py-2 rounded-lg ${tier.highlight ? 'bg-gold-accent/10 border border-gold-accent/20' : 'bg-white/5 border border-white/10'}`}>
                <span className="text-gold-accent font-mono font-bold text-sm">◈</span>
                <span className={`text-xs font-mono font-semibold ${tier.highlight ? 'text-gold-accent' : 'text-text-secondary'}`}>{tier.connects}</span>
              </div>

              <ul className="flex flex-col gap-4 flex-1 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-gold-accent' : 'text-text-secondary'}`} size={16} strokeWidth={3} />
                    <span className="text-sm text-on-surface leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <div
                  aria-disabled="true"
                  title="Subscriptions launch soon"
                  className={`block w-full text-center py-4 rounded font-working-title text-sm uppercase tracking-widest font-bold cursor-not-allowed select-none ${
                    tier.highlight
                      ? 'bg-gold-accent/30 text-[#0A0908]/70 border border-gold-accent/40'
                      : 'bg-transparent border border-surface-variant/60 text-text-muted'
                  }`}
                >
                  Coming Soon
                </div>
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
          padding: 100px 0 120px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 80px;
        }
      `}</style>
    </div>
  );
}
