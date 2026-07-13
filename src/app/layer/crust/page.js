"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useState } from "react";
import { Building2, Camera, Search, CalendarDays } from "lucide-react";
import BackgroundCrust from "@/components/descent/BackgroundCrust";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";

const SERVICE_CATEGORIES = [
  { key: "advisors", label: "Verified Advisors" },
  { key: "photography", label: "Space Photography" },
  { key: "research", label: "Site Research" },
  { key: "events", label: "Event Design" },
];

const SERVICE_DATA = {
  advisors: {
    icon: Building2,
    status: "LIVE",
    statusClass: "live-badge",
    title: "Verified Advisors",
    desc: "Licensed real estate professionals who guide you through viewing, negotiating, and closing.",
    cta: "CONNECT WITH ADVISOR →",
    href: "/brokers",
  },
  photography: {
    icon: Camera,
    status: "PRE-REGISTER",
    statusClass: "soon-badge",
    title: "Space Photography",
    desc: "Interior and architectural photographers who make every space look the way it deserves to.",
    cta: "EXPLORE ROSTER →",
    href: "/photographers",
  },
  research: {
    icon: Search,
    status: "PRE-REGISTER",
    statusClass: "soon-badge",
    title: "Site Research",
    desc: "On-the-ground research, market data, and neighborhood profiles before you commit.",
    cta: "EXPLORE ROSTER →",
    href: "/researchers",
  },
  events: {
    icon: CalendarDays,
    status: "PRE-REGISTER",
    statusClass: "soon-badge",
    title: "Event Design",
    desc: "Planners, stylists, and designers who turn great spaces into great events.",
    cta: "EXPLORE ROSTER →",
    href: "/event-planners",
  },
};

export default function CrustLayer() {
  const [activeCategory, setActiveCategory] = useState("advisors");
  const service = SERVICE_DATA[activeCategory];
  const Icon = service.icon;

  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-gold-accent selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/metropolis", label: "Metropolis" }}
        next={{ href: "/layer/mantle", label: "Mantle" }}
      />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundCrust />
      </div>

      <div className="layer-pane relative z-10">
        <LayerHeader 
          layerNum="04" 
          layerName="Crust" 
          title="The Service Ecosystem" 
          description="Verified advisors, photographers, site researchers, and event designers — the professionals who make every space decision count." 
          missionText="The Crust serves as the Trust Layer. It is the solid ground the whole platform rests on — verified advisors, photographers, researchers, and planners — the people who make every space decision real, accountable, and worth committing to." 
          ctaText="Meet Our Advisors →"
          ctaHref="/brokers"
        />

        <div className="descent-split">
          {/* ── LEFT SIDEBAR ── */}
          <aside className="descent-sidebar">
            <nav className="descent-nav">
              {SERVICE_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className={`descent-cat${activeCategory === c.key ? " on" : ""}`}
                  onClick={() => setActiveCategory(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* ── RIGHT CONTENT ── */}
          <div className="descent-content">
            <Link href={service.href} className="service-card live-card" style={{ display: "block", textDecoration: "none" }}>
              <div className="service-card-inner">
                <div className="service-icon-wrapper">
                  <Icon strokeWidth={1.5} size="1em" />
                </div>
                <div className={`service-status-badge ${service.statusClass}`}>{service.status}</div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.desc}</p>
                <span className="service-cta">{service.cta}</span>
              </div>
            </Link>
          </div>
        </div>

        <LayerTransition 
          nextNum="05" 
          nextName="Mantle" 
          nextHref="/layer/mantle" 
          teaser="Dig beneath the surface. The deep archive holds everything." 
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .service-card {
          border: 1px solid rgba(232, 174, 60, 0.1);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
          background: rgba(18, 18, 18, 0.6);
          max-width: 480px;
        }
        .service-card:hover {
          border-color: rgba(232, 174, 60, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        }
        .service-card-inner {
          padding: 32px;
        }
        .service-icon-wrapper {
          font-size: 28px;
          color: var(--accent);
          margin-bottom: 16px;
        }
        .service-status-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 3px;
          margin-bottom: 14px;
        }
        .live-badge {
          background: rgba(232, 174, 60, 0.15);
          color: var(--accent);
          border: 1px solid rgba(232, 174, 60, 0.3);
        }
        .soon-badge {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .service-title {
          font-family: var(--font-display);
          font-size: 22px;
          color: #f6efe6;
          margin-bottom: 10px;
        }
        .service-desc {
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-secondary);
          margin-bottom: 20px;
        }
        .service-cta {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
        }
      `}} />
    </main>
  );
}
