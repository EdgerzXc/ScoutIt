"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { Building2, Camera, Search, CalendarDays, Truck, Wifi, Zap, Droplets, Sparkles } from "lucide-react";
import BackgroundCrust from "@/components/descent/BackgroundCrust";

export default function CrustLayer() {
  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-[#FFB800] selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/metropolis", label: "Metropolis" }}
        next={{ href: "/layer/mantle", label: "Mantle" }}
      />

      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundCrust />
      </div>

      <section className="snap-section section-services relative z-10">
        <div className="services-content">
          <header className="section-header-center">
            <span className="vector-label">Verified Providers</span>
            <h2>The Service Ecosystem</h2>
            <p>
              Verified advisors, photographers, site researchers, and event designers —
              the professionals who make every space decision count.
            </p>
            <div className="layer-mission">
              <h3>Mission</h3>
              <p>The Crust serves as the Trust Layer. It is the solid ground the whole platform rests on — verified advisors, photographers, researchers, and planners — the people who make every space decision real, accountable, and worth committing to.</p>
            </div>
          </header>

          <div className="services-grid">
            <Link href="/brokers" className="service-card live-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Building2 strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge live-badge">LIVE</div>
                <h3 className="service-title">Verified Advisors</h3>
                <p className="service-desc">
                  Licensed real estate professionals who guide you through viewing,
                  negotiating, and closing.
                </p>
                <span className="service-cta">CONNECT WITH ADVISOR &rarr;</span>
              </div>
            </Link>

            <Link href="/photographers" className="service-card live-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Camera strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">PRE-REGISTER</div>
                <h3 className="service-title">Space Photography</h3>
                <p className="service-desc">
                  Interior and architectural photographers who make every space
                  look the way it deserves to.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>

            <Link href="/researchers" className="service-card live-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Search strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">PRE-REGISTER</div>
                <h3 className="service-title">Site Research</h3>
                <p className="service-desc">
                  On-the-ground research, market data, and neighborhood profiles
                  before you commit.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>

            <Link href="/event-planners" className="service-card live-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <CalendarDays strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">PRE-REGISTER</div>
                <h3 className="service-title">Event Design</h3>
                <p className="service-desc">
                  Planners, stylists, and designers who turn great spaces into
                  great events.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>

            <Link href="/movers" className="service-card live-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Truck strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge live-badge">LIVE</div>
                <h3 className="service-title">Movers (Post-Move)</h3>
                <p className="service-desc">
                  Verified moving companies, packers, and logistics fleets to handle your relocation seamlessly.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* The Wire (Utilities & Infrastructure) */}
      <section id="wire" className="snap-section section-services relative z-10" style={{ paddingTop: '60px' }}>
        <div className="services-content">
          <header className="section-header-center">
            <span className="vector-label">Layer 04.5 // The Wire</span>
            <h2>Infrastructure & Utilities</h2>
            <p>
              Settle in. Connect your utilities and activate essential services seamlessly.
              Because our job doesn't end when you sign the lease.
            </p>
          </header>

          <div className="services-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            
            {/* Internet Card */}
            <a href="https://pldthome.com" target="_blank" rel="noreferrer" className="service-card live-card group">
              <div className="service-card-inner">
                <div className="service-icon-wrapper text-gold-accent group-hover:scale-105 transition-transform">
                  <Wifi strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge live-badge">CONNECT</div>
                <h3 className="service-title">Fiber Internet</h3>
                <p className="service-desc">
                  Transfer or apply for PLDT, Globe, or Converge high-speed lines directly to your new address.
                </p>
                <span className="service-cta text-gold-accent">APPLY NOW &rarr;</span>
              </div>
            </a>

            {/* Power Card */}
            <a href="https://company.meralco.com.ph" target="_blank" rel="noreferrer" className="service-card live-card group">
              <div className="service-card-inner">
                <div className="service-icon-wrapper text-gold-accent group-hover:scale-105 transition-transform">
                  <Zap strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge live-badge">CONNECT</div>
                <h3 className="service-title">Power Account</h3>
                <p className="service-desc">
                  Register for a Meralco transfer of service or apply for a brand new electric meter.
                </p>
                <span className="service-cta text-gold-accent">APPLY NOW &rarr;</span>
              </div>
            </a>

            {/* Water Card */}
            <a href="https://www.manilawater.com" target="_blank" rel="noreferrer" className="service-card live-card group">
              <div className="service-card-inner">
                <div className="service-icon-wrapper text-gold-accent group-hover:scale-105 transition-transform">
                  <Droplets strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge live-badge">CONNECT</div>
                <h3 className="service-title">Water Supply</h3>
                <p className="service-desc">
                  Access the Manila Water or Maynilad connection portal for billing and service transfers.
                </p>
                <span className="service-cta text-gold-accent">APPLY NOW &rarr;</span>
              </div>
            </a>

            {/* Deep Cleaning Card */}
            <a href="#" className="service-card coming-soon-card group">
              <div className="service-card-inner">
                <div className="service-icon-wrapper text-gold-accent group-hover:scale-105 transition-transform">
                  <Sparkles strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">COMING SOON</div>
                <h3 className="service-title">Deep Cleaning</h3>
                <p className="service-desc">
                  Schedule pre-move professional sanitization and deep cleaning from vetted partner guilds.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </a>

          </div>
        </div>
      </section>
    </main>
  );
}
