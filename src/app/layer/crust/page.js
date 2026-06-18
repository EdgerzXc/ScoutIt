"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { Building2, Camera, Search, CalendarDays } from "lucide-react";
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
            <span className="vector-label">Layer 04 // Crust</span>
            <h2>The Service Ecosystem</h2>
            <p>
              Verified advisors, photographers, site researchers, and event designers —
              the professionals who make every space decision count.
            </p>
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

            <Link href="/photographers" className="service-card coming-soon-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Camera strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">COMING SOON</div>
                <h3 className="service-title">Space Photography</h3>
                <p className="service-desc">
                  Interior and architectural photographers who make every space
                  look the way it deserves to.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>

            <Link href="/researchers" className="service-card coming-soon-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Search strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">COMING SOON</div>
                <h3 className="service-title">Site Research</h3>
                <p className="service-desc">
                  On-the-ground research, market data, and neighborhood profiles
                  before you commit.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>

            <Link href="/event-planners" className="service-card coming-soon-card">
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <CalendarDays strokeWidth={1.5} size="1em" />
                </div>
                <div className="service-status-badge soon-badge">COMING SOON</div>
                <h3 className="service-title">Event Design</h3>
                <p className="service-desc">
                  Planners, stylists, and designers who turn great spaces into
                  great events.
                </p>
                <span className="service-cta">EXPLORE ROSTER &rarr;</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
