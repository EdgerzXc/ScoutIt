"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Starry Lens",
    price: "₱0",
    period: "forever",
    description: "Start contributing and verifying platform intelligence.",
    connects: "1 Connect / month + earn per submission",
    features: [
      "Up to 5 portfolio photos / 2 active jobs",
      "Access basic bounty tasks",
      "Earn Connects per verified submission",
      "Basic roster placement"
    ],
    highlight: false,
    buttonText: "Current Plan"
  },
  {
    name: "Solar Shooter",
    price: "₱199",
    originalPrice: "₱499",
    period: "monthly",
    description: "Build your client base with a verified identity.",
    connects: "5 Connects / month + earn per submission",
    features: [
      "Up to 30 portfolio photos / 10 active jobs",
      "Priority Bounty Task Access",
      "Downloadable Verified Creator ID Card",
      "Pitch directly to owner listings"
    ],
    highlight: false,
    buttonText: "Upgrade to Solar"
  },
  {
    name: "Cluster Architect",
    price: "₱599",
    originalPrice: "₱1,499",
    period: "monthly",
    description: "For serious visual professionals & data officers.",
    connects: "12 Connects / month + earn per submission",
    features: [
      "Up to 100 portfolio photos / 30 active jobs",
      "CDN-Hosted Portfolio Delivery",
      "Priority Roster Placement",
      "Full Job Analytics Dashboard",
      "Read access to Deep Intel (for research)"
    ],
    highlight: true,
    buttonText: "Upgrade to Cluster"
  },
  {
    name: "Universe Visual",
    price: "₱1,499",
    originalPrice: "₱3,499",
    period: "monthly",
    description: "The backbone of ScoutIt intelligence & visuals.",
    connects: "25 Connects / month + earn per submission",
    features: [
      "Unlimited portfolio photos / active jobs",
      "Video & 360 Virtual Tour support",
      "Direct pipeline to ScoutIt Editorial Team",
      "Universe Principal client referrals",
      "Bounty creation rights"
    ],
    highlight: false,
    buttonText: "Contact Sales"
  }
];

export default function CreatorPricingPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main relative overflow-hidden">
        
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="pricing-header z-10 relative">
          <Link href="/pricing" className="text-purple-400 font-mono text-xs uppercase tracking-widest hover:text-white transition-colors mb-8 inline-block">
            ← Back to Personas
          </Link>
          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border border-purple-400/30 inline-block">
            <p className="text-purple-300 font-mono text-xs uppercase tracking-widest font-bold">
              🚀 PIONEER COHORT
            </p>
            <p className="text-white text-sm mt-1">
              Lock in <span className="text-purple-400 font-bold">Pioneer Member</span> rates forever. Only 20 slots per role.
            </p>
          </div>
          <span className="vector-label text-purple-400 tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // SERVICE TIERS
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-white mb-6 drop-shadow-lg">
            Verify The <span className="text-purple-400">Intelligence</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            You are the data workforce of ScoutIt. Upgrade your tier to host your CDN portfolios, unlock priority job referrals, and build a verified institutional presence.
          </p>
        </header>

        <div className="pricing-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
          {TIERS.map((tier) => (
            <div 
              key={tier.name} 
              className={`flex flex-col rounded-2xl p-6 relative overflow-hidden transition-all duration-500 cursor-default ${
                tier.highlight 
                  ? 'bg-gradient-to-br from-[#1E1A24] to-[#0A0908] border border-purple-400/50 shadow-[0_0_40px_rgba(192,132,252,0.15)] hover:shadow-[0_0_60px_rgba(192,132,252,0.25)] hover:border-purple-400 transform hover:-translate-y-2' 
                  : 'bg-surface-alt/40 backdrop-blur-md border border-surface-variant/50 hover:bg-surface-alt/60 hover:border-text-primary/30'
              }`}
            >
              {tier.highlight && (
                <>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-fuchsia-300 shadow-[0_0_15px_rgba(192,132,252,0.8)]"></div>
                  <div className="absolute top-4 right-4 bg-purple-400 text-[#0A0908] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(192,132,252,0.3)]">
                    Most Popular
                  </div>
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl"></div>
                </>
              )}

              <div className="mb-6">
                <h2 className={`text-2xl font-working-title mb-3 ${tier.highlight ? 'text-purple-400 drop-shadow-sm' : 'text-on-surface'}`}>
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

              <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-lg ${tier.highlight ? 'bg-purple-400/10 border border-purple-400/20' : 'bg-white/5 border border-white/10'}`}>
                <span className="text-gold-accent font-mono font-bold text-sm">◈</span>
                <span className={`text-xs font-mono font-semibold ${tier.highlight ? 'text-purple-400' : 'text-text-secondary'}`}>{tier.connects}</span>
              </div>

              <ul className="flex flex-col gap-3 flex-1 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-purple-400' : 'text-text-secondary'}`} size={14} strokeWidth={3} />
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
                      ? 'bg-purple-400 text-[#0A0908] hover:bg-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.2)] hover:shadow-[0_0_30px_rgba(192,132,252,0.4)]'
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
