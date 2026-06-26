"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConnectsExplainer from "@/components/pricing/ConnectsExplainer";
import Link from "next/link";
import { Check, Layers } from "lucide-react";

const BUNDLES = [
  {
    id: "binary",
    name: "Binary",
    tagline: "The Deal-Hunter",
    roles: ["Seeker", "Broker"],
    roleColors: ["text-gold-accent", "text-gold-accent"],
    price: "₱2,199",
    rawPrice: "₱2,498",
    savings: "₱299",
    savingsPct: "12%",
    connects: 38,
    connectsBonus: 3,
    description: "Scout the market as a buyer and pitch directly to owners as a broker. One subscription, both sides of every deal.",
    features: [
      "Cluster Seeker — Vault, Heatmaps, Identity Shield",
      "Cluster Broker — 50 listings, Priority Lead Routing",
      "38 Connects / month (3 loyalty bonus)",
      "Full Lead Analytics Dashboard",
      "Anonymous browsing + proxy contact enabled",
      "Featured Broker placement on property pages"
    ],
    accent: "from-gold-accent to-gold-accent",
    glowColor: "rgba(232, 174, 60,0.15)",
    glowHover: "rgba(232, 174, 60,0.25)",
    borderColor: "border-gold-accent/50",
    highlight: false,
  },
  {
    id: "eclipse",
    name: "Eclipse",
    tagline: "The Asset Commander",
    roles: ["Seeker", "Owner"],
    roleColors: ["text-gold-accent", "text-gold-accent"],
    price: "₱2,599",
    rawPrice: "₱2,998",
    savings: "₱399",
    savingsPct: "13%",
    connects: 36,
    connectsBonus: 3,
    description: "List your properties with full intelligence tools while scouting the market yourself. Only ₱100 more than Owner Cluster alone.",
    features: [
      "Cluster Owner — 20 listings, QuestIT Spatial Scanning",
      "Cluster Seeker — Vault, 3D Maps, Drone Heatmaps",
      "36 Connects / month (3 loyalty bonus)",
      "Market Intelligence for your portfolio area",
      "AI copy optimization on all your listings",
      "Identity Reveal Control + Anonymity Shield"
    ],
    accent: "from-gold-accent to-gold-accent",
    glowColor: "rgba(232, 174, 60,0.15)",
    glowHover: "rgba(232, 174, 60,0.25)",
    borderColor: "border-gold-accent/50",
    highlight: true,
  },
  {
    id: "orbit",
    name: "Orbit",
    tagline: "The Self-Producer",
    roles: ["Owner", "Photographer"],
    roleColors: ["text-gold-accent", "text-gold-accent"],
    price: "₱2,699",
    rawPrice: "₱3,098",
    savings: "₱399",
    savingsPct: "13%",
    connects: 33,
    connectsBonus: 3,
    description: "List your properties and shoot them yourself. Full media stack — CDN-hosted, verified, and intelligence-ready.",
    features: [
      "Cluster Owner — 20 listings, full intelligence suite",
      "Cluster Photographer — 100 photos, CDN delivery",
      "33 Connects / month (3 loyalty bonus)",
      "Priority Bounty Task Access for your own properties",
      "Full Job & Portfolio Analytics",
      "Read access to Deep Intel for research"
    ],
    accent: "from-gold-accent to-gold-accent",
    glowColor: "rgba(232, 174, 60,0.15)",
    glowHover: "rgba(232, 174, 60,0.25)",
    borderColor: "border-gold-accent/50",
    highlight: false,
  },
  {
    id: "constellation",
    name: "Constellation",
    tagline: "The Full Operator",
    roles: ["Seeker", "Owner", "Broker"],
    roleColors: ["text-gold-accent", "text-gold-accent", "text-gold-accent"],
    price: "₱3,999",
    rawPrice: "₱4,997",
    savings: "₱998",
    savingsPct: "20%",
    connects: 60,
    connectsBonus: 7,
    description: "Every angle of the ecosystem in one plan. List, broker, and scout simultaneously — the platform's most embedded power users.",
    features: [
      "Cluster Owner — 20 listings + QuestIT Spatial",
      "Cluster Broker — 50 listings + Priority Lead Routing",
      "Cluster Seeker — Vault, Heatmaps, Identity Shield",
      "60 Connects / month (7 loyalty bonus)",
      "Market Intelligence + Full Analytics across all roles",
      "AI copy optimization + Priority Bounty Access"
    ],
    accent: "from-gold-accent via-gold-accent to-gold-accent",
    glowColor: "rgba(232, 174, 60,0.12)",
    glowHover: "rgba(232, 174, 60,0.22)",
    borderColor: "border-gold-accent/60",
    highlight: false,
    flagship: true,
  },
];

export default function BundlesPricingPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main relative overflow-hidden">

        {/* Background glows */}
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] bg-gold-accent/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-gold-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-gold-accent/5 rounded-full blur-[100px] pointer-events-none" />

        <header className="pricing-header z-10 relative">
          <Link href="/pricing" className="text-gold-accent font-mono text-xs uppercase tracking-widest hover:text-white transition-colors mb-8 inline-block">
            ← Back to Personas
          </Link>

          <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-[#1A1710]/80 to-[#101820]/80 border border-gold-accent/30 inline-block">
            <p className="text-gold-accent font-mono text-xs uppercase tracking-widest font-bold">
              ✦ MULTI-ROLE BUNDLES
            </p>
            <p className="text-white text-sm mt-1">
              Hold multiple roles — pay as one. Pioneer rates locked forever.
            </p>
          </div>

          <span className="vector-label text-gold-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // ECOSYSTEM BUNDLES
          </span>
          <h1 className="page-title text-5xl md:text-6xl font-display-md text-white mb-6 drop-shadow-lg">
            Every Role. <span className="text-gold-accent">One Plan.</span>
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Most serious players in real estate wear more than one hat. Bundles give you Cluster-tier access across all your roles — with a loyalty Connect bonus and genuine savings versus buying separately.
          </p>
        </header>

        <div className="bundles-grid z-10 relative w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 mb-16">
          {BUNDLES.map((bundle) => (
            <div
              key={bundle.id}
              className={`flex flex-col rounded-2xl p-7 relative overflow-hidden transition-all duration-500 cursor-default
                ${bundle.highlight
                  ? `bg-gradient-to-br from-[#1A1810] to-[#0A0908] ${bundle.borderColor} border shadow-[0_0_40px_${bundle.glowColor}] hover:shadow-[0_0_60px_${bundle.glowHover}] hover:border-gold-accent transform hover:-translate-y-2`
                  : `bg-surface-alt/40 backdrop-blur-md ${bundle.borderColor} border hover:bg-surface-alt/60 hover:border-opacity-80 hover:-translate-y-1`
                } transition-transform`}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${bundle.accent} opacity-80`} />

              {bundle.flagship && (
                <div className="absolute top-4 right-4 bg-gradient-to-r from-gold-accent to-[#F7C64E] text-[#0A0908] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Best Value
                </div>
              )}
              {bundle.highlight && !bundle.flagship && (
                <div className="absolute top-4 right-4 bg-gold-accent text-[#0A0908] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}

              {/* Bundle name + roles */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-3xl font-working-title text-white">{bundle.name}</h2>
                </div>
                <p className="text-xs font-mono text-text-muted uppercase tracking-widest mb-3">{bundle.tagline}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {bundle.roles.map((role, i) => (
                    <span key={role} className={`text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current/30 bg-current/5 ${bundle.roleColors[i]}`}>
                      {role}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{bundle.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6 p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs font-mono text-text-muted line-through block mb-1">
                      {bundle.rawPrice} if separate
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display-md text-white">{bundle.price}</span>
                      <span className="text-xs font-mono text-text-muted uppercase tracking-wider">/ mo</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-text-muted uppercase block">You save</span>
                    <span className="text-lg font-bold text-gold-accent">{bundle.savings}</span>
                    <span className="text-xs text-gold-accent/70 font-mono block">({bundle.savingsPct} off)</span>
                  </div>
                </div>

                {/* Connects badge */}
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <span className="text-gold-accent font-mono font-bold text-sm">◈ {bundle.connects}</span>
                  <span className="text-xs text-text-muted">Connects / month</span>
                  <span className="ml-auto text-xs font-mono text-gold-accent/60 bg-gold-accent/10 px-2 py-0.5 rounded">
                    +{bundle.connectsBonus} loyalty bonus
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="flex flex-col gap-3 flex-1 mb-7">
                {bundle.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="mt-0.5 flex-shrink-0 text-gold-accent/70" size={13} strokeWidth={3} />
                    <span className="text-xs text-on-surface leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("scoutit:open-waitlist", { detail: { role: null, tier: bundle.name, source: "pricing-bundles" } }))}
                className="block w-full text-center py-3 rounded font-working-title text-xs uppercase tracking-widest font-bold cursor-pointer transition-all bg-transparent border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/10"
              >
                Join the Waitlist
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="z-10 relative text-center max-w-xl mx-auto px-4 pb-8">
          <p className="text-xs text-text-muted font-mono leading-relaxed">
            All bundles are at <span className="text-gold-accent">Cluster tier</span> for every included role. Connects pool is shared across roles. Pioneer rates are locked for the lifetime of your account.
          </p>
          <Link href="/pricing" className="inline-block mt-4 text-xs font-mono text-text-muted uppercase tracking-widest hover:text-gold-accent transition-colors">
            ← View single-role pricing
          </Link>
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
          padding: 60px 0 80px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .pricing-header {
          text-align: center;
          margin-bottom: 60px;
        }
        .bundles-grid {
          max-width: 1100px;
        }
      `}</style>
    </div>
  );
}
