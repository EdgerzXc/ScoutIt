"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Utensils,
  Building2,
  Briefcase,
  Hotel,
  KeyRound,
  CalendarRange,
  ArrowRight,
  CheckCircle2,
  FileText,
  Activity,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";

const VERTICALS = [
  {
    id: "restaurant",
    shortLabel: "Restaurants & F&B",
    title: "Restaurants & F&B Groups",
    code: "VERTICAL 01 // CULINARY & HOSPITALITY FOOTPRINT",
    icon: Utensils,
    summary:
      "Spatial operations for flagship dining rooms, multi-branch commissaries, and high-throughput culinary sites.",
    capabilities: [
      "Floorplan & table/zone mapping across dining, bar, and terrace footprints",
      "Kitchen, exhaust, grease-trap, and MEP utility capacity verification",
      "Acoustic zoning & street-level foot-traffic telemetry overlays",
      "Private dining room & full-buyout event booking readiness",
    ],
    dossierSpecs: [
      "As-built kitchen MEP & exhaust CFM schematics",
      "Seating capacity matrix by zone & fire-code occupancy",
      "Delivery / cold-chain loading bay access spec",
    ],
    telemetryFocus: "Foot-traffic cadence, HVAC/exhaust load, acoustic dB profile",
  },
  {
    id: "developer",
    shortLabel: "Developers",
    title: "Real Estate Developers",
    code: "VERTICAL 02 // MASTER-PLAN & TOWER INVENTORY",
    icon: Building2,
    summary:
      "Portfolio-wide command over multi-tower inventory, construction milestones, and syndicated broker distribution.",
    capabilities: [
      "Multi-tower master-plan inventory with floor-by-floor unit grids",
      "Construction milestone telemetry from excavation through turnover",
      "Bulk CSV & PDF architectural dossier ingestion at portfolio scale",
      "Broker syndicate delegation with controlled unit handshakes",
    ],
    dossierSpecs: [
      "Tower & floor stacking plan (CSV / architectural PDF)",
      "Phase milestone schedule & HLURB / DHSUD permit references",
      "Delegation rules for external brokerage syndicates",
    ],
    telemetryFocus: "Sell-through velocity, milestone completion, unit allocation",
  },
  {
    id: "brokerage",
    shortLabel: "Brokerages",
    title: "Licensed Brokerages & Advisory",
    code: "VERTICAL 03 // DEAL ROOMS & MANDATE RBAC",
    icon: Briefcase,
    summary:
      "Structured agency operations for PRC-licensed advisory desks managing exclusive mandates and deal pipelines.",
    capabilities: [
      "Multi-agent seat RBAC across brokers, leasing directors, and viewers",
      "Delegated mandate claims & owner handshake approvals (DelegationRequests)",
      "Private double-blind deal rooms with sealed identity reveals",
      "Commission, pitch pipeline, and thread tracking per mandate",
    ],
    dossierSpecs: [
      "PRC brokerage license & designated signatory roster",
      "Active authority-to-sell / lease mandate documentation",
      "Team seat role matrix & deal-room routing rules",
    ],
    telemetryFocus: "Pitch conversion rate, active deal threads, mandate SLA",
  },
  {
    id: "hospitality",
    shortLabel: "Hospitality",
    title: "Hospitality & Hotel Groups",
    code: "VERTICAL 04 // KEY HIERARCHY & VIP GATES",
    icon: Hotel,
    summary:
      "Unified spatial intelligence for boutique hotels, serviced residences, and multi-wing resort estates.",
    capabilities: [
      "Suite & room-key hierarchy across wings, penthouses, and annexes",
      "Amenity, spa, F&B, and concierge spatial discovery layers",
      "Seasonal rate & occupancy matrix across room classes",
      "VIP direct-booking gate with verified enterprise inquiry routing",
    ],
    dossierSpecs: [
      "Key count by suite class & connecting-room topology",
      "Amenity operating hours & concierge service directory",
      "Seasonal rack rate & corporate allotment bands",
    ],
    telemetryFocus: "Room-class occupancy, seasonal ADR index, VIP gate inquiries",
  },
  {
    id: "str",
    shortLabel: "STR Operators",
    title: "Short-Term Rental (STR) Operators",
    code: "VERTICAL 05 // MULTI-UNIT SYNC & CHECK-IN",
    icon: KeyRound,
    summary:
      "Operational cadence for distributed urban condo portfolios, serviced villas, and corporate-stay operators.",
    capabilities: [
      "Multi-unit availability & two-way iCal calendar synchronization",
      "Dynamic nightly, weekly, and monthly corporate pricing tiers",
      "Instant verification badges backed by operator dossier audits",
      "Structured guest check-in protocols & building admin clearances",
    ],
    dossierSpecs: [
      "iCal feed URLs & turnover buffer policy per unit",
      "Nightly / monthly rate tiers & minimum-stay rules",
      "Building HOA short-stay clearance & key-fob protocol",
    ],
    telemetryFocus: "Calendar sync health, nightly utilization, turnaround SLA",
  },
  {
    id: "venue",
    shortLabel: "Event Venues",
    title: "Event Venues & Commercial Spaces",
    code: "VERTICAL 06 // CONFIGURABLE CHARTER SPACES",
    icon: CalendarRange,
    summary:
      "Technical specification and charter readiness for convention halls, rooftops, galleries, and flex commercial venues.",
    capabilities: [
      "Configurable capacity layouts for banquet, theater, and cocktail modes",
      "Certified AV, ceiling rigging, truss load, and power drop specs",
      "Hourly, half-day, and full-day charter rate schedules",
      "Vendor load-in logistics, freight elevator, and curfew controls",
    ],
    dossierSpecs: [
      "Floorplate CAD / capacity table across seating configurations",
      "Rigging point load limits, 3-phase power & AV inventory",
      "Service bay dimensions, freight lift schedule & noise curfew",
    ],
    telemetryFocus: "Charter utilization, layout changeover time, load-in slots",
  },
];

const CORE_CAPABILITIES = [
  {
    title: "Verified Enterprise Intake Routing",
    body: "Every vertical intake routes through Turnstile-protected business onboarding controls and lands directly in the Mission Control operations queue with vertical triage tags.",
  },
  {
    title: "Granular Team Seat RBAC",
    body: "Provision Admin, Broker, Listing Manager, F&B / Venue Manager, Hospitality GM, Leasing Director, and Viewer seats with scoped property access.",
  },
  {
    title: "Single-Source Spatial Dossiers",
    body: "Maintain private unit inventories, delegation handshakes, and public CMS publication from one unified portfolio workspace.",
  },
];

export default function EnterprisePage() {
  const [activeId, setActiveId] = useState(VERTICALS[0].id);
  const tabRefs = useRef([]);

  const activeIndex = VERTICALS.findIndex((v) => v.id === activeId);
  const activeVertical = VERTICALS[activeIndex] || VERTICALS[0];
  const ActiveIcon = activeVertical.icon;

  const handleSwitcherKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % VERTICALS.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + VERTICALS.length) % VERTICALS.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = VERTICALS.length - 1;
    }
    if (nextIndex !== null) {
      e.preventDefault();
      setActiveId(VERTICALS[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="directory-layout enterprise-page-shell">
      <Header />
      <main className="enterprise-main">
        <div className="enterprise-hero">
          <span className="vector-label">
            <ScoutItWordmark /> FOR BUSINESS // 6-VERTICAL SPATIAL OPERATIONS
          </span>
          <h1 className="enterprise-title">Enterprise Spatial Operations</h1>
          <p className="enterprise-subtitle">
            Six specialized operational verticals built on one verified spatial engine. Select your
            business vertical to inspect intake dossier specs, live telemetry capabilities, and
            dedicated onboarding routes.
          </p>
        </div>

        {/* Interactive 6-Vertical Switcher */}
        <section aria-label="Business Verticals" className="enterprise-switcher-section">
          <div className="enterprise-switcher-header">
            <span className="enterprise-mono-label">Select Business Vertical</span>
            <span className="enterprise-mono-muted">
              Use arrow keys or tap to inspect intake dossier &amp; telemetry
            </span>
          </div>

          <div className="enterprise-vertical-tabs" role="group" aria-label="Enterprise business verticals">
            {VERTICALS.map((vertical, index) => {
              const Icon = vertical.icon;
              const isSelected = vertical.id === activeVertical.id;
              return (
                <button
                  key={vertical.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveId(vertical.id)}
                  onKeyDown={(e) => handleSwitcherKeyDown(e, index)}
                  className={`enterprise-vertical-tab min-h-11 ${
                    isSelected ? "enterprise-vertical-tab--active" : ""
                  }`}
                >
                  <Icon size={16} aria-hidden="true" />
                  <span>{vertical.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active Vertical Dossier Panel */}
          <div className="enterprise-vertical-panel" role="region" aria-live="polite" aria-label={activeVertical.title}>
            <div className="enterprise-vertical-top">
              <div className="enterprise-vertical-badge-row">
                <span className="enterprise-icon-box" aria-hidden="true">
                  <ActiveIcon size={20} />
                </span>
                <div>
                  <span className="enterprise-mono-label">{activeVertical.code}</span>
                  <h2 className="enterprise-vertical-heading">{activeVertical.title}</h2>
                </div>
              </div>
              <p className="enterprise-vertical-summary">{activeVertical.summary}</p>
            </div>

            <div className="enterprise-vertical-columns">
              <div className="enterprise-spec-card">
                <div className="enterprise-spec-title">
                  <ShieldCheck size={16} aria-hidden="true" />
                  <span>Operational Capabilities</span>
                </div>
                <ul className="enterprise-spec-list">
                  {activeVertical.capabilities.map((cap) => (
                    <li key={cap}>
                      <CheckCircle2 size={15} className="enterprise-check-icon" aria-hidden="true" />
                      <span>{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="enterprise-spec-card">
                <div className="enterprise-spec-title">
                  <FileText size={16} aria-hidden="true" />
                  <span>Required Intake Dossier</span>
                </div>
                <ul className="enterprise-spec-list">
                  {activeVertical.dossierSpecs.map((spec) => (
                    <li key={spec}>
                      <CheckCircle2 size={15} className="enterprise-check-icon" aria-hidden="true" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                <div className="enterprise-telemetry-box">
                  <div className="enterprise-telemetry-label">
                    <Activity size={14} aria-hidden="true" />
                    <span>Telemetry &amp; Form Alignment</span>
                  </div>
                  <p className="enterprise-telemetry-value">{activeVertical.telemetryFocus}</p>
                </div>
              </div>
            </div>

            <div className="enterprise-cta-row enterprise-cta-row--panel">
              <Link
                href={`/contact?topic=enterprise&vertical=${activeVertical.id}`}
                className="enterprise-cta-btn min-h-11"
              >
                <span>Start Enterprise Intake</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/dashboard" className="enterprise-cta-secondary min-h-11">
                <span>Open Mission Control</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Platform Architecture */}
        <section aria-label="Core Enterprise Architecture" className="enterprise-grid">
          {CORE_CAPABILITIES.map((c) => (
            <div key={c.title} className="enterprise-card">
              <h2>{c.title}</h2>
              <p>{c.body}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />

      <style jsx global>{`
        .enterprise-page-shell {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100dvh;
        }
        .enterprise-main {
          padding: 96px 24px 80px;
          max-width: 1040px;
          margin: 0 auto;
        }
        .enterprise-hero {
          text-align: center;
          margin-bottom: 44px;
        }
        .vector-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: var(--accent);
          text-transform: uppercase;
        }
        .enterprise-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 5vw, 48px);
          line-height: 1.1;
          color: var(--text-primary);
          margin: 16px 0;
        }
        .enterprise-subtitle {
          font-size: 16px;
          line-height: 1.65;
          color: var(--text-secondary);
          max-width: 680px;
          margin: 0 auto;
        }
        .enterprise-switcher-section {
          margin-bottom: 44px;
        }
        .enterprise-switcher-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .enterprise-mono-label {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          display: block;
        }
        .enterprise-mono-muted {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .enterprise-vertical-tabs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 10px;
          margin-bottom: 20px;
        }
        .enterprise-vertical-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--surface);
          border: 1px solid var(--border-solid);
          color: var(--text-secondary);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .enterprise-vertical-tab:hover {
          border-color: var(--accent-muted);
          color: var(--text-primary);
          background: var(--surface2);
        }
        .enterprise-vertical-tab:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 2px;
        }
        .enterprise-vertical-tab--active {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: var(--accent-bright);
          box-shadow: var(--shadow-glow-soft);
        }
        .enterprise-vertical-panel {
          background: var(--surface);
          border: 1px solid var(--accent-muted);
          border-radius: var(--radius-md);
          padding: 28px;
          backdrop-filter: blur(12px);
        }
        .enterprise-vertical-top {
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
          margin-bottom: 24px;
        }
        .enterprise-vertical-badge-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }
        .enterprise-icon-box {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--accent-dim);
          border: 1px solid var(--accent-muted);
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .enterprise-vertical-heading {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--text-primary);
          margin: 4px 0 0;
        }
        .enterprise-vertical-summary {
          font-size: 15px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }
        .enterprise-vertical-columns {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
          margin-bottom: 28px;
        }
        .enterprise-spec-card {
          background: var(--surface2);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .enterprise-spec-title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .enterprise-spec-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .enterprise-spec-list li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-primary);
        }
        .enterprise-check-icon {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 3px;
        }
        .enterprise-telemetry-box {
          margin-top: auto;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }
        .enterprise-telemetry-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .enterprise-telemetry-value {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }
        .enterprise-cta-row {
          display: flex;
          gap: 14px;
          justify-content: flex-start;
          flex-wrap: wrap;
          align-items: center;
        }
        .enterprise-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          background: var(--accent-fill);
          color: var(--on-accent);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 12px 24px;
          border-radius: 4px;
          letter-spacing: 0.08em;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .enterprise-cta-btn:hover {
          transform: translateY(-1px);
          background: var(--accent-fill-hover);
          box-shadow: var(--shadow-glow);
        }
        .enterprise-cta-btn:focus-visible,
        .enterprise-cta-secondary:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 2px;
        }
        .enterprise-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          color: var(--accent);
          border: 1px solid var(--accent-muted);
          padding: 12px 24px;
          border-radius: 4px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.2s ease, background-color 0.2s ease;
        }
        .enterprise-cta-secondary:hover {
          border-color: var(--accent);
          background: var(--accent-dim);
        }
        .enterprise-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          text-align: left;
        }
        .enterprise-card {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          padding: 24px;
        }
        .enterprise-card h2 {
          font-family: var(--font-display);
          font-size: 17px;
          color: var(--text-primary);
          margin: 0 0 10px;
        }
        .enterprise-card p {
          font-size: 14px;
          line-height: 1.65;
          color: var(--text-secondary);
          margin: 0;
        }
        @media (max-width: 768px) {
          .enterprise-vertical-columns,
          .enterprise-grid {
            grid-template-columns: 1fr;
          }
          .enterprise-vertical-panel {
            padding: 20px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .enterprise-vertical-tab,
          .enterprise-cta-btn,
          .enterprise-cta-secondary {
            transition: none;
          }
          .enterprise-cta-btn:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
