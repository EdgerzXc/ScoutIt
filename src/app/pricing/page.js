"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { Search, Briefcase, Building, Camera, Layers } from "lucide-react";

const PERSONAS = [
  {
    id: "seeker",
    title: "Seekers & Buyers",
    description: "Unlock the Spatial Vault, deep intelligence metrics, and identity reveal controls.",
    icon: Search,
    href: "/pricing/seeker",
    accent: "text-gold-accent",
    bgAccent: "bg-gold-accent/10"
  },
  {
    id: "broker",
    title: "Brokers & Advisors",
    description: "Maximize your listings, unlock priority lead routing, and dominate the intelligence roster.",
    icon: Briefcase,
    href: "/pricing/broker",
    accent: "text-gold-accent",
    bgAccent: "bg-gold-accent/10"
  },
  {
    id: "owner",
    title: "Property Owners",
    description: "Accelerate 3D Spatial generation and manage your multi-asset portfolio with white-glove curation.",
    icon: Building,
    href: "/pricing/owner",
    accent: "text-gold-accent",
    bgAccent: "bg-gold-accent/10"
  },
  {
    id: "creator",
    title: "Photographers & Intel",
    description: "Host your CDN portfolios, access high-priority bounty routing, and connect with Universe Elite brokers.",
    icon: Camera,
    href: "/pricing/creator",
    accent: "text-gold-accent",
    bgAccent: "bg-gold-accent/10"
  }
];

const BUNDLE_CARD = {
  id: "bundles",
  title: "Multi-Role Bundles",
  description: "Wear multiple hats? Bundle Seeker + Broker, Owner + Photographer, or go full Constellation — one plan, every role, up to 20% off.",
  icon: Layers,
  href: "/pricing/bundles",
  accent: "text-gold-accent",
  bgAccent: "bg-gradient-to-br from-gold-accent/10 to-gold-accent/5",
  isBundle: true,
};

export default function PricingHubPage() {
  return (
    <div className="pricing-layout">
      <Header />
      <main className="pricing-main relative overflow-hidden flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* Cinematic Background Glows */}
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-gold-accent/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-surface-alt/20 rounded-full blur-[100px] pointer-events-none"></div>

        <header className="pricing-header z-10 relative text-center mb-16">
          <span className="vector-label text-gold-accent tracking-[0.3em] uppercase text-xs font-bold mb-4 block drop-shadow-md">
            LAYER 08 // INTELLIGENCE TIERS
          </span>
          <h1 className="page-title text-4xl md:text-5xl font-display-md text-white mb-6 drop-shadow-lg max-w-3xl mx-auto">
            Choose Your <span className="text-gold-accent">Role</span> in the Ecosystem
          </h1>
          <p className="page-subtitle text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            ScoutIt monetizes access, intelligence, visibility, and connection — not listings. Select your persona below to view curated subscription tiers designed for your exact needs.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative w-full max-w-5xl px-4">
          {PERSONAS.map((persona) => {
            const Icon = persona.icon;
            return (
              <Link key={persona.id} href={persona.href} className="group relative block rounded-2xl p-[1px] overflow-hidden bg-surface-variant hover:bg-gradient-to-br hover:from-surface-variant hover:to-gold-accent/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(255,184,0,0.1)]">
                <div className="absolute inset-0 bg-surface-alt/80 backdrop-blur-xl group-hover:bg-[#0A0908]/90 transition-colors duration-500 z-0"></div>
                <div className="relative z-10 p-8 flex items-start gap-6 h-full">
                  <div className={`p-4 rounded-xl ${persona.bgAccent} transition-transform duration-500 group-hover:scale-110 flex-shrink-0`}>
                    <Icon className={`w-8 h-8 ${persona.accent}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col h-full">
                    <h2 className="text-2xl font-working-title text-white mb-2 group-hover:text-gold-accent transition-colors duration-300">
                      {persona.title}
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed mb-6 group-hover:text-white/80 transition-colors duration-300">
                      {persona.description}
                    </p>
                    <div className="mt-auto flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-wider group-hover:text-gold-accent transition-colors duration-300">
                      <span>View Pricing</span>
                      <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Bundle card — spans full width */}
          <Link href={BUNDLE_CARD.href} className="group relative block rounded-2xl p-[1px] overflow-hidden md:col-span-2 hover:-translate-y-1 transition-all duration-500 hover:shadow-[0_10px_40px_rgba(255,184,0,0.15)]" style={{background: 'linear-gradient(135deg, rgba(255,184,0,0.35), rgba(255,184,0,0.12), rgba(122,92,0,0.25))'}}>
            <div className="absolute inset-0 bg-[#0A0908]/90 backdrop-blur-xl group-hover:bg-[#0A0908]/95 transition-colors duration-500 z-0 rounded-2xl"></div>
            <div className="relative z-10 p-8 flex items-center gap-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-gold-accent/20 to-gold-accent/5 transition-transform duration-500 group-hover:scale-110 flex-shrink-0">
                <Layers className="w-8 h-8 text-gold-accent" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-working-title text-white group-hover:text-gold-accent transition-colors duration-300">
                    {BUNDLE_CARD.title}
                  </h2>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-gold-accent/20 text-gold-accent border border-gold-accent/30">
                    Save up to 20%
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed group-hover:text-white/80 transition-colors duration-300 max-w-2xl">
                  {BUNDLE_CARD.description}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2 text-xs font-mono text-text-muted uppercase tracking-wider group-hover:text-gold-accent transition-colors duration-300 pr-2">
                <span>View Bundles</span>
                <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
              </div>
            </div>
          </Link>
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
          padding: 100px 0 120px 0;
        }
      `}</style>
    </div>
  );
}
