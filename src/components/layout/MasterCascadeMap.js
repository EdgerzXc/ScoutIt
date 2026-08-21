"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Layers,
  MapPin,
  Sparkles,
  Shield,
  Briefcase,
  UserCheck,
  AlertTriangle,
  X,
  ChevronRight,
  ExternalLink,
  LifeBuoy,
  CheckCircle2,
  Calendar,
  Radio,
  FileText,
  Activity,
  GitBranch
} from "lucide-react";
import { reportError } from "@/lib/reportError";
import MasterFlowGraph from "@/components/flow/MasterFlowGraph";

// ── Master Spatial Hierarchy & Altitude Levels ────────────────────────
const ALTITUDE_LAYERS = [
  {
    num: "01",
    id: "orbit",
    name: "Orbit",
    label: "Orbit · Planetary Telemetry",
    altitude: "500 km",
    href: "/layer/orbit",
    description: "Macro planetary view of the Philippine Archipelago, macro-economic clusters, and satellite signals.",
    badge: "Macro Spatial",
    color: "#E8AE3C"
  },
  {
    num: "02",
    id: "stratosphere",
    name: "Stratosphere",
    label: "Stratosphere · Radar & News",
    altitude: "50 km",
    href: "/layer/stratosphere",
    description: "40/60 Split-Canvas spatial discovery, live infrastructure news signals, and development milestone timelines.",
    badge: "Intelligence Terminal",
    color: "#F7C64E"
  },
  {
    num: "03",
    id: "metropolis",
    name: "Metropolis",
    label: "Metropolis · Urban Corridors",
    altitude: "10 km",
    href: "/layer/metropolis",
    description: "City-level arterial highways (NLEX, SLEX, CCLEX), PEZA economic zones, and regional corridor analytics.",
    badge: "Corridor Atlas",
    color: "#E8AE3C"
  },
  {
    num: "04",
    id: "crust",
    name: "Crust",
    label: "Crust · Ground Directory",
    altitude: "0 km (Ground)",
    href: "/layer/crust",
    description: "Ground-level spatial directory, unit floorplans, 15-min walk/drive isochrones, and Overpass neighborhood data.",
    badge: "Ground Directory",
    color: "#E8AE3C"
  },
  {
    num: "05",
    id: "mantle",
    name: "Mantle",
    label: "Mantle · Deep Archives",
    altitude: "-5 km (Sub-surface)",
    href: "/layer/mantle",
    description: "Historical transaction logs, deed records, spatial appreciation trends, and archived intelligence dossiers.",
    badge: "Historical Vault",
    color: "#D49B2E"
  },
  {
    num: "06",
    id: "core",
    name: "Core",
    label: "Core · Private Vault",
    altitude: "Center (Core)",
    href: "/layer/core",
    description: "Private user terminal, encrypted Wishlist, identity verification records, and Connects token wallet.",
    badge: "Private Terminal",
    color: "#F7C64E"
  }
];

const CURATED_PORTALS = [
  {
    title: "Orbit Showcase",
    subtitle: "Atmospheric Merit Badges & Distinction Dossiers",
    href: "/showcase",
    category: "Curated Spaces",
    badge: "Special Exhibition",
    icon: Sparkles
  },
  {
    title: "Space Directory",
    subtitle: "Comprehensive Searchable Spatial Index",
    href: "/property",
    category: "Exploration",
    badge: "Live Catalog",
    icon: MapPin
  },
  {
    title: "Wishlist Board",
    subtitle: "Private Encrypted Vault for Saved Properties",
    href: "/wishlist",
    category: "Personal Command",
    badge: "Encrypted",
    icon: Shield
  },
  {
    title: "Off-Market Vault",
    subtitle: "Confidential Institutional & Ultra-Luxury Portfolios",
    href: "/off-market",
    category: "Private Intelligence",
    badge: "Confidential",
    icon: Briefcase
  }
];

const ROLE_WORKSPACES = [
  {
    role: "Seeker / Buyer",
    mode: "buyer",
    href: "/dashboard?mode=buyer",
    desc: "Private property board, active viewing appointments, counter-offers, and deal rooms.",
    badge: "Default"
  },
  {
    role: "Property Owner",
    mode: "owner",
    href: "/dashboard?mode=owner",
    desc: "Draft listings, property verification status, incoming buyer inquiries, and analytics.",
    badge: "Lister Console"
  },
  {
    role: "Verified Broker",
    mode: "broker",
    href: "/dashboard?mode=broker",
    desc: "Licensed representation portal, exclusive client chats, deal pipeline, and commission tools.",
    badge: "PRC Verified"
  }
];

const ECOSYSTEM_SPECIALISTS = [
  {
    title: "Licensed Brokers",
    href: "/brokers",
    desc: "PRC-accredited real estate professionals offering representation and localized transaction advisory."
  },
  {
    title: "Spatial Photographers",
    href: "/photographers",
    desc: "Professional architectural & 3D virtual tour capture teams specializing in high-fidelity listings."
  },
  {
    title: "Event & Commercial Planners",
    href: "/event-planners",
    desc: "Experiential curators, popup managers, and commercial lease arrangement specialists."
  },
  {
    title: "Site Researchers & Surveyors",
    href: "/researchers",
    desc: "Independent land title investigators, zoning specialists, and micro-climate site analysts."
  }
];

export default function MasterCascadeMap() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("flowchart"); // 'flowchart' | 'descent' | 'portals' | 'ecosystem' | 'workspaces'
  const [selectedLayer, setSelectedLayer] = useState(null);

  // Bug / Support Dispatch State
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportCategory, setSupportCategory] = useState("bug");
  const [supportText, setSupportText] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportError, setSupportError] = useState(null);

  const modalRef = useRef(null);

  // Keyboard shortcut listener (Press 'M' to toggle Master Map, 'Escape' to close)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        return;
      }
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Determine current active layer based on URL pathname
  useEffect(() => {
    if (pathname.includes("/layer/orbit")) setSelectedLayer("orbit");
    else if (pathname.includes("/layer/stratosphere")) setSelectedLayer("stratosphere");
    else if (pathname.includes("/layer/metropolis")) setSelectedLayer("metropolis");
    else if (pathname.includes("/layer/crust") || pathname.startsWith("/property")) setSelectedLayer("crust");
    else if (pathname.includes("/layer/mantle")) setSelectedLayer("mantle");
    else if (pathname.includes("/layer/core") || pathname.startsWith("/dashboard")) setSelectedLayer("core");
    else setSelectedLayer(null);
  }, [pathname]);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportText.trim()) return;

    setSupportSending(true);
    setSupportError(null);

    try {
      const payload = {
        kind: `master_cascade_${supportCategory}`,
        message: supportText.trim(),
        context: {
          currentPath: pathname,
          activeLayer: selectedLayer,
          timestamp: new Date().toISOString(),
          screenSize: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "unknown"
        }
      };

      const delivered = await reportError(payload);
      if (!delivered) {
        throw new Error("Unable to deliver diagnostic report. Please try again.");
      }

      setSupportSent(true);
      setSupportText("");
      setTimeout(() => {
        setSupportSent(false);
        setSupportOpen(false);
      }, 2500);
    } catch (err) {
      setSupportError(err.message || "Failed to submit report. Please check your connection.");
    } finally {
      setSupportSending(false);
    }
  };

  const handleNavigate = (href) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* ── Persistent Floating HUD Trigger Beacon (Bottom-Left) ── */}
      <div className="master-cascade-trigger-wrap">
        <button
          onClick={() => setIsOpen(true)}
          className="master-cascade-hud-btn"
          aria-label="Open Master Spatial Cascade Map (Press M)"
          title="Master Spatial Navigation Map (Press M)"
        >
          <div className="hud-beacon-pulse" />
          <GitBranch className="hud-icon" size={16} />
          <span className="hud-label">FLOW MAP</span>
          <span className="hud-hotkey">M</span>
        </button>
      </div>

      {/* ── Master Cascade Map Modal Overlay ── */}
      {isOpen && (
        <div
          className="master-cascade-backdrop"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Master Spatial Navigation & Cascading Flow"
        >
          <div className="master-cascade-modal" ref={modalRef}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="header-branding">
                <div className="branding-icon-box">
                  <GitBranch className="text-gold-accent" size={20} />
                </div>
                <div>
                  <h2 className="modal-title">Master Workflow &amp; Flow Map</h2>
                  <p className="modal-subtitle">Interactive visual paths across all layers, deal room loops, and exceptions</p>
                </div>
              </div>

              <div className="header-actions">
                <button
                  onClick={() => setSupportOpen(true)}
                  className="header-action-btn support-btn"
                  title="Report Glitch or Request Staff Review"
                >
                  <LifeBuoy size={14} />
                  <span>Report Glitch</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="close-btn"
                  aria-label="Close Master Map"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Category Navigation Tabs */}
            <div className="tabs-bar">
              <button
                onClick={() => setActiveTab("flowchart")}
                className={`tab-btn ${activeTab === "flowchart" ? "active" : ""}`}
              >
                <GitBranch size={14} />
                <span>Visual Flowchart</span>
              </button>
              <button
                onClick={() => setActiveTab("descent")}
                className={`tab-btn ${activeTab === "descent" ? "active" : ""}`}
              >
                <Layers size={14} />
                <span>6-Layer Altitude Descent</span>
              </button>
              <button
                onClick={() => setActiveTab("portals")}
                className={`tab-btn ${activeTab === "portals" ? "active" : ""}`}
              >
                <Sparkles size={14} />
                <span>Showcase &amp; Portals</span>
              </button>
              <button
                onClick={() => setActiveTab("workspaces")}
                className={`tab-btn ${activeTab === "workspaces" ? "active" : ""}`}
              >
                <Briefcase size={14} />
                <span>Role Workspaces</span>
              </button>
              <button
                onClick={() => setActiveTab("ecosystem")}
                className={`tab-btn ${activeTab === "ecosystem" ? "active" : ""}`}
              >
                <UserCheck size={14} />
                <span>Ecosystem Rosters</span>
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="modal-body">
              
              {/* TAB 0: MASTER SYSTEM GRAPH (DEFAULT) */}
              {activeTab === "flowchart" && (
                <div className="h-[68vh] -m-6 overflow-hidden flex flex-col">
                  <MasterFlowGraph isEmbedded={true} onNavigate={handleNavigate} />
                </div>
              )}

              {/* TAB 1: 6-LAYER ALTITUDE DESCENT */}
              {activeTab === "descent" && (
                <div className="descent-grid">
                  <div className="descent-intro-banner">
                    <span className="banner-kicker">CASCADING SPATIAL DESCENT</span>
                    <p className="banner-desc">
                      ScoutIt structures space across 6 dimensional altitudes. Descend progressively from cosmic orbit down to verified private vaults.
                    </p>
                  </div>

                  <div className="layer-ladder">
                    {ALTITUDE_LAYERS.map((layer) => {
                      const isCurrent = selectedLayer === layer.id;
                      return (
                        <div
                          key={layer.id}
                          className={`layer-card ${isCurrent ? "is-active-layer" : ""}`}
                          onClick={() => handleNavigate(layer.href)}
                        >
                          <div className="layer-card-left">
                            <div className="layer-num-badge">L{layer.num}</div>
                            <div className="layer-altitude-marker">
                              <span className="alt-label">{layer.altitude}</span>
                              <div className="alt-line" />
                            </div>
                          </div>

                          <div className="layer-card-center">
                            <div className="layer-header-row">
                              <h3 className="layer-name">{layer.name}</h3>
                              <span className="layer-type-badge">{layer.badge}</span>
                              {isCurrent && (
                                <span className="current-layer-pill">YOU ARE HERE</span>
                              )}
                            </div>
                            <p className="layer-desc">{layer.description}</p>
                          </div>

                          <div className="layer-card-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(layer.href);
                              }}
                              className="layer-jump-btn"
                            >
                              <span>Enter Layer {layer.num}</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SHOWCASE & PORTALS */}
              {activeTab === "portals" && (
                <div className="portals-grid">
                  {CURATED_PORTALS.map((portal, index) => {
                    const IconComp = portal.icon;
                    return (
                      <div
                        key={index}
                        className="portal-card"
                        onClick={() => handleNavigate(portal.href)}
                      >
                        <div className="portal-card-header">
                          <div className="portal-icon-wrap">
                            <IconComp size={18} />
                          </div>
                          <span className="portal-badge">{portal.badge}</span>
                        </div>
                        <h3 className="portal-title">{portal.title}</h3>
                        <p className="portal-subtitle">{portal.subtitle}</p>
                        <div className="portal-footer">
                          <span className="portal-category">{portal.category}</span>
                          <span className="portal-action-link">Open Portal →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 3: ROLE WORKSPACES */}
              {activeTab === "workspaces" && (
                <div className="workspaces-grid">
                  {ROLE_WORKSPACES.map((ws, index) => (
                    <div
                      key={index}
                      className="workspace-card"
                      onClick={() => handleNavigate(ws.href)}
                    >
                      <div className="workspace-header">
                        <h3 className="workspace-title">{ws.role}</h3>
                        <span className="workspace-badge">{ws.badge}</span>
                      </div>
                      <p className="workspace-desc">{ws.desc}</p>
                      <div className="workspace-footer">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(ws.href);
                          }}
                          className="workspace-enter-btn"
                        >
                          <span>Switch to {ws.role} Mode</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: ECOSYSTEM ROSTERS */}
              {activeTab === "ecosystem" && (
                <div className="ecosystem-grid">
                  {ECOSYSTEM_SPECIALISTS.map((spec, index) => (
                    <div
                      key={index}
                      className="ecosystem-card"
                      onClick={() => handleNavigate(spec.href)}
                    >
                      <div className="ecosystem-header">
                        <h3 className="ecosystem-title">{spec.title}</h3>
                        <ExternalLink size={14} className="ecosystem-ext" />
                      </div>
                      <p className="ecosystem-desc">{spec.desc}</p>
                      <div className="ecosystem-footer">
                        <span className="ecosystem-link-text">Browse Directory →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Diagnostic / Glitch Reporting Modal */}
            {supportOpen && (
              <div className="support-overlay animate-[fadeIn_0.2s_ease]">
                <div className="support-card">
                  <div className="support-header">
                    <div className="support-header-left">
                      <LifeBuoy className="text-gold-accent" size={18} />
                      <h3 className="support-title">Diagnostic &amp; Glitch Incident Report</h3>
                    </div>
                    <button
                      onClick={() => setSupportOpen(false)}
                      className="support-close-btn"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {supportSent ? (
                    <div className="support-success">
                      <CheckCircle2 size={32} className="text-success" />
                      <h4 className="success-title">Telemetry Dispatched</h4>
                      <p className="success-desc">
                        Your report and environment diagnostics have been logged to Mission Control operators.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSupportSubmit} className="support-form">
                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          value={supportCategory}
                          onChange={(e) => setSupportCategory(e.target.value)}
                          className="form-select"
                        >
                          <option value="bug">Technical Glitch / Visual Defect</option>
                          <option value="navigation">Navigation / Layer Cascade Disconnect</option>
                          <option value="deal_room">Deal Room / Viewing Scheduler Issue</option>
                          <option value="connects">Connects Wallet Question</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description &amp; Observed Behavior</label>
                        <textarea
                          value={supportText}
                          onChange={(e) => setSupportText(e.target.value)}
                          placeholder="Describe what happened or what failed so our engineering squad can resolve it..."
                          rows={4}
                          required
                          className="form-textarea"
                        />
                      </div>

                      {supportError && (
                        <div className="form-error">
                          <AlertTriangle size={14} />
                          <span>{supportError}</span>
                        </div>
                      )}

                      <div className="form-actions">
                        <button
                          type="button"
                          onClick={() => setSupportOpen(false)}
                          className="form-btn-cancel"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={supportSending || !supportText.trim()}
                          className="form-btn-submit"
                        >
                          {supportSending ? "Dispatching..." : "Dispatch to Operators"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer Keybind Info */}
            <div className="modal-footer">
              <div className="footer-keys">
                <span className="key-badge">ESC</span>
                <span className="key-text">Close</span>
                <span className="key-sep">·</span>
                <span className="key-badge">M</span>
                <span className="key-text">Toggle Map</span>
              </div>
              <div className="footer-telemetry">
                <span>ACTIVE COORDINATE: {pathname}</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Scoped Styling for the Master Spatial Map HUD ── */}
      <style jsx global>{`
        .master-cascade-trigger-wrap {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 9990;
          pointer-events: auto;
        }

        .master-cascade-hud-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(14, 14, 18, 0.88);
          border: 1px solid rgba(232, 174, 60, 0.35);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 8px 14px;
          border-radius: 9999px;
          color: #f5f3ee;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(232, 174, 60, 0.15);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .master-cascade-hud-btn:hover {
          border-color: var(--accent, #E8AE3C);
          background: rgba(24, 24, 30, 0.96);
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.8), 0 0 25px rgba(232, 174, 60, 0.3);
          transform: translateY(-2px);
        }

        .hud-beacon-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 10px var(--accent, #E8AE3C);
          animation: hudPulse 2s infinite ease-in-out;
        }

        @keyframes hudPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }

        .hud-icon {
          color: var(--accent, #E8AE3C);
        }

        .hud-label {
          font-weight: 600;
          color: #ffffff;
        }

        .hud-hotkey {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          font-size: 10px;
          color: var(--accent, #E8AE3C);
        }

        /* Modal Overlay */
        .master-cascade-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(5, 5, 8, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease-out;
        }

        .master-cascade-modal {
          width: 100%;
          max-width: 980px;
          max-height: 88vh;
          background: #0f0f14;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 18px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(232, 174, 60, 0.08);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(20, 20, 26, 0.6);
        }

        .header-branding {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .branding-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title {
          font-family: var(--font-display, serif);
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          letter-spacing: 0.02em;
        }

        .modal-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 2px 0 0 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .flow-fullscreen-btn {
          background: rgba(232, 174, 60, 0.12);
          border: 1px solid rgba(232, 174, 60, 0.3);
          color: var(--accent, #E8AE3C);
        }

        .flow-fullscreen-btn:hover {
          background: rgba(232, 174, 60, 0.2);
          border-color: var(--accent, #E8AE3C);
        }

        .support-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        .support-btn:hover {
          background: rgba(232, 174, 60, 0.1);
          border-color: rgba(232, 174, 60, 0.3);
          color: var(--accent, #E8AE3C);
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }

        /* Tabs Bar */
        .tabs-bar {
          display: flex;
          overflow-x: auto;
          background: #14141a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0 16px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: rgba(255, 255, 255, 0.55);
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: #ffffff;
        }

        .tab-btn.active {
          color: var(--accent, #E8AE3C);
          border-bottom-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.04);
        }

        /* Modal Body */
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        /* Flowchart Tab Styles */
        .flowchart-tab-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .flowchart-scenarios-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }

        .flowchart-sc-btn {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
        }

        .flowchart-sc-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .flowchart-sc-btn.active {
          background: rgba(232, 174, 60, 0.08);
          border-color: var(--accent, #E8AE3C);
          box-shadow: 0 0 15px rgba(232, 174, 60, 0.1);
        }

        .sc-badge {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }

        .sc-title {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
        }

        .flowchart-controls-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 12px 16px;
          border-radius: 12px;
        }

        .current-scenario-heading {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          display: block;
        }

        .current-scenario-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          display: block;
        }

        .controls-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .simulate-run-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent, #E8AE3C);
          color: #000000;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 15px rgba(232, 174, 60, 0.3);
          transition: all 0.2s ease;
        }

        .simulate-run-btn:hover {
          background: #f7c64e;
        }

        .simulate-reset-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
        }

        .flowchart-ladder {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .flow-step-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .flow-node-item {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 18px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .flow-node-item:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
        }

        .flow-node-item.selected {
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.06);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.15);
        }

        .flow-node-item.sim-active {
          border-color: #f7c64e;
          background: rgba(232, 174, 60, 0.15);
          box-shadow: 0 0 30px rgba(232, 174, 60, 0.35);
          transform: scale(1.01);
        }

        .flow-node-icon {
          font-size: 22px;
          flex-shrink: 0;
        }

        .flow-node-info {
          flex: 1;
        }

        .flow-node-tags {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }

        .step-num {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: var(--accent, #E8AE3C);
          font-weight: 700;
        }

        .cat-tag {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .node-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .node-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin: 3px 0 0 0;
          line-height: 1.4;
        }

        .flow-node-route {
          text-align: right;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .route-url {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
        }

        .node-jump-link {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.25);
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
          text-transform: uppercase;
        }

        .flow-pipe-down {
          height: 18px;
          width: 2px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pipe-line {
          width: 2px;
          height: 100%;
          background: linear-gradient(180deg, var(--accent, #E8AE3C), rgba(255, 255, 255, 0.1));
        }

        .pipe-pulse {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 8px var(--accent, #E8AE3C);
        }

        /* Descent Tab Styles */
        .descent-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .descent-intro-banner {
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(232, 174, 60, 0.05);
          border: 1px solid rgba(232, 174, 60, 0.18);
        }

        .banner-kicker {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 700;
          color: var(--accent, #E8AE3C);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 4px;
        }

        .banner-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        .layer-ladder {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .layer-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .layer-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(232, 174, 60, 0.4);
          transform: translateX(4px);
        }

        .layer-card.is-active-layer {
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.08);
          box-shadow: 0 0 25px rgba(232, 174, 60, 0.12);
        }

        .layer-card-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 100px;
        }

        .layer-num-badge {
          font-family: var(--font-mono, monospace);
          font-size: 13px;
          font-weight: 700;
          color: var(--accent, #E8AE3C);
        }

        .layer-altitude-marker {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alt-label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
        }

        .layer-card-center {
          flex: 1;
          padding: 0 16px;
        }

        .layer-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .layer-name {
          font-family: var(--font-display, serif);
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .layer-type-badge {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .current-layer-pill {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 4px;
          background: rgba(232, 174, 60, 0.25);
          color: var(--accent, #E8AE3C);
          border: 1px solid var(--accent, #E8AE3C);
          animation: hudPulse 2s infinite ease-in-out;
        }

        .layer-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0;
          line-height: 1.4;
        }

        .layer-jump-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.25);
          color: var(--accent, #E8AE3C);
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .layer-jump-btn:hover {
          background: var(--accent, #E8AE3C);
          color: #000000;
        }

        /* Portals Grid */
        .portals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .portal-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .portal-card:hover {
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.05);
          transform: translateY(-2px);
        }

        .portal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .portal-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(232, 174, 60, 0.12);
          color: var(--accent, #E8AE3C);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portal-badge {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
        }

        .portal-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 4px 0;
        }

        .portal-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0 0 16px 0;
          line-height: 1.4;
        }

        .portal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 12px;
        }

        .portal-category {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
        }

        .portal-action-link {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: var(--accent, #E8AE3C);
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Workspaces Grid */
        .workspaces-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .workspace-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .workspace-card:hover {
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.05);
          transform: translateY(-2px);
        }

        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .workspace-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .workspace-badge {
          font-family: var(--font-mono, monospace);
          font-size: 9px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(232, 174, 60, 0.15);
          color: var(--accent, #E8AE3C);
          text-transform: uppercase;
        }

        .workspace-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .workspace-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 12px;
        }

        .workspace-enter-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .workspace-enter-btn:hover {
          background: var(--accent, #E8AE3C);
          color: #000000;
          border-color: var(--accent, #E8AE3C);
        }

        /* Ecosystem Grid */
        .ecosystem-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .ecosystem-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .ecosystem-card:hover {
          border-color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.05);
          transform: translateY(-2px);
        }

        .ecosystem-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .ecosystem-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .ecosystem-ext {
          color: rgba(255, 255, 255, 0.4);
        }

        .ecosystem-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .ecosystem-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding-top: 12px;
        }

        .ecosystem-link-text {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          color: var(--accent, #E8AE3C);
          font-weight: 600;
          text-transform: uppercase;
        }

        /* Support / Glitch Modal */
        .support-overlay {
          position: absolute;
          inset: 0;
          background: rgba(8, 8, 12, 0.9);
          backdrop-filter: blur(14px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 50;
        }

        .support-card {
          width: 100%;
          max-width: 520px;
          background: #14141c;
          border: 1px solid rgba(232, 174, 60, 0.35);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }

        .support-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .support-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .support-title {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }

        .support-close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
        }

        .support-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--accent, #E8AE3C);
          font-weight: 600;
        }

        .form-select, .form-textarea {
          width: 100%;
          background: #0c0c10;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 12px;
          color: #ffffff;
          outline: none;
        }

        .form-select:focus, .form-textarea:focus {
          border-color: var(--accent, #E8AE3C);
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }

        .form-btn-cancel {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .form-btn-submit {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          background: var(--accent, #E8AE3C);
          border: none;
          color: #000000;
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          cursor: pointer;
        }

        .form-btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .support-success {
          text-align: center;
          padding: 24px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .success-title {
          font-size: 16px;
          color: #ffffff;
          margin: 0;
        }

        .success-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          max-width: 320px;
          line-height: 1.5;
          margin: 0;
        }

        /* Modal Footer */
        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 24px;
          background: #111116;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-family: var(--font-mono, monospace);
          font-size: 10px;
        }

        .footer-keys {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .key-badge {
          padding: 1px 5px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--accent, #E8AE3C);
        }

        .key-text {
          color: rgba(255, 255, 255, 0.5);
        }

        .key-sep {
          color: rgba(255, 255, 255, 0.2);
        }

        .footer-telemetry {
          color: rgba(255, 255, 255, 0.35);
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .master-cascade-trigger-wrap {
            bottom: 84px;
            left: 16px;
          }

          .master-cascade-modal {
            max-height: 94vh;
          }

          .modal-header {
            padding: 14px 16px;
          }

          .modal-body {
            padding: 14px 16px;
          }

          .flow-node-item {
            flex-direction: column;
            gap: 8px;
          }

          .flow-node-route {
            align-items: flex-start;
            width: 100%;
          }

          .layer-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .layer-card-left {
            flex-direction: row;
            gap: 10px;
            min-width: auto;
          }

          .layer-card-right {
            width: 100%;
          }

          .layer-jump-btn {
            width: 100%;
            justify-content: center;
          }

          .support-btn span, .flow-fullscreen-btn span {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
