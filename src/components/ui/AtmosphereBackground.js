const VARIANT_GLOW = {
  dashboard: { "--glow-x": "88%", "--glow-y": "-8%" },
  broker: { "--glow-x": "82%", "--glow-y": "-6%" },
  buyer: { "--glow-x": "75%", "--glow-y": "-10%" },
  exploring: { "--glow-x": "75%", "--glow-y": "-10%" },
  owner: { "--glow-x": "85%", "--glow-y": "-8%" },
  operator: { "--glow-x": "80%", "--glow-y": "-6%" },
  provider: { "--glow-x": "80%", "--glow-y": "-6%" },
  hero: { "--glow-x": "50%", "--glow-y": "-10%" },
  stratosphere: { "--glow-x": "50%", "--glow-y": "-5%" },
  default: { "--glow-x": "88%", "--glow-y": "-8%" },
};

/**
 * Layered dark/gold ambient background (base tone + gold light source + vignette).
 * Purely decorative — drop it as the first child of a 'position: relative' wrapper.
 * 'variant' repositions the glow so it reads as sourced from a natural corner
 * per screen (see globals.css .atmosphere-bg for the layer definitions).
 *
 * Layer 5 Ambient Role Atmosphere per DASHBOARD_ATMOSPHERE_FRAMEWORK.md:
 * - 'broker': Tactical Velocity (directional streaks + signal pulses + deal velocity vectors)
 * - 'buyer' / 'exploring': Spatial Discovery (topographic contour lines + radar focus rings)
 * - 'owner': Architectural Blueprint (precision structural grid lines + alignment datum)
 * - 'operator' / 'provider': Precision Telemetry (fine data coordinates grid + reticles)
 */
export default function AtmosphereBackground({ variant = "default" }) {
  const style = VARIANT_GLOW[variant] || VARIANT_GLOW.default;
  return (
    <>
      <div className="atmosphere-bg" style={style} aria-hidden="true" />

      {variant === "broker" && (
        <div className="atmosphere-broker" aria-hidden="true" data-testid="atmosphere-broker">
          <svg
            className="atmosphere-vector-overlay"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Tactical Pursuit Velocity Tracks */}
            <g stroke="currentColor" strokeWidth="1">
              <path
                d="M-40,240 L320,240 L460,140 L940,140 L1100,280 L1480,280"
                strokeOpacity="0.18"
              />
              <path
                className="atmosphere-trace-pulse"
                d="M-40,240 L320,240 L460,140 L940,140 L1100,280 L1480,280"
                stroke="var(--accent-bright)"
                strokeOpacity="0.75"
                strokeWidth="1.5"
              />
              <path
                d="M120,440 L480,440 L640,320 L1180,320 L1320,200 L1480,200"
                strokeOpacity="0.14"
              />
              <path
                className="atmosphere-trace-pulse"
                style={{ animationDelay: "-8s", animationDuration: "20s" }}
                d="M120,440 L480,440 L640,320 L1180,320 L1320,200 L1480,200"
                stroke="var(--accent-bright)"
                strokeOpacity="0.6"
                strokeWidth="1.25"
              />
            </g>
            {/* Active Network Deal Nodes */}
            <g>
              <circle cx="460" cy="140" r="3.5" fill="var(--accent-bright)" className="atmosphere-node-breathe" />
              <circle cx="940" cy="140" r="3" fill="var(--accent)" stroke="currentColor" strokeOpacity="0.4" />
              <circle cx="1100" cy="280" r="4" fill="var(--accent-bright)" className="atmosphere-node-breathe" style={{ animationDelay: "-3s" }} />
              <circle cx="640" cy="320" r="3" fill="var(--accent)" />
              <circle cx="1180" cy="320" r="3.5" fill="var(--accent-bright)" className="atmosphere-node-breathe" style={{ animationDelay: "-5s" }} />
            </g>
            {/* Velocity and pipeline telemetry tags */}
            <g fill="currentColor" fillOpacity="0.32" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.12em">
              <text x="475" y="135">DEAL VELOCITY // VIA-01</text>
              <text x="1115" y="275">NETWORK CLOSING 94%</text>
              <text x="130" y="432">PIPELINE ROUTE // POSITION ZERO</text>
            </g>
          </svg>
        </div>
      )}

      {(variant === "buyer" || variant === "exploring") && (
        <div className="atmosphere-buyer" aria-hidden="true" data-testid="atmosphere-buyer">
          <svg
            className="atmosphere-vector-overlay"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Topographic elevation contours */}
            <g className="atmosphere-contour-drift" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1">
              <path d="M-60,180 Q320,120 720,220 T1500,160" />
              <path d="M-60,250 Q340,190 740,290 T1500,230" strokeOpacity="0.22" />
              <path d="M-60,320 Q360,260 760,360 T1500,300" strokeOpacity="0.14" />
              <path d="M-60,390 Q380,330 780,430 T1500,370" strokeOpacity="0.18" />
              <path d="M-60,460 Q400,400 800,500 T1500,440" strokeOpacity="0.12" />
            </g>
            {/* Focal radar sweep rings */}
            <g transform="translate(1080, 180)">
              <circle r="90" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
              <circle r="180" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="3 6" />
              <circle r="270" stroke="currentColor" strokeOpacity="0.09" strokeWidth="1" />
              <circle r="360" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="6 12" />
              <line x1="-380" y1="0" x2="380" y2="0" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.75" />
              <line x1="0" y1="-380" x2="0" y2="380" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="3.5" fill="var(--accent-bright)" className="atmosphere-node-breathe" />
              <text x="12" y="-12" fill="currentColor" fillOpacity="0.32" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.14em">
                SPATIAL RADAR // BGC 14°33&apos;N
              </text>
            </g>
            {/* Spatial discovery coordinate crosshairs */}
            <g stroke="currentColor" strokeOpacity="0.28" strokeWidth="1">
              <path d="M235,160 H245 M240,155 V165" />
              <path d="M525,480 H535 M530,475 V485" />
              <path d="M885,620 H895 M890,615 V625" />
            </g>
            <text x="250" y="164" fill="currentColor" fillOpacity="0.25" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.1em">
              DATUM E-01
            </text>
            <text x="540" y="484" fill="currentColor" fillOpacity="0.25" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.1em">
              DATUM S-04
            </text>
          </svg>
        </div>
      )}

      {variant === "owner" && (
        <div className="atmosphere-owner" aria-hidden="true" data-testid="atmosphere-owner">
          <svg
            className="atmosphere-vector-overlay"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Structural Column Grid Axes */}
            <g stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.8">
              <line x1="160" y1="0" x2="160" y2="900" />
              <line x1="520" y1="0" x2="520" y2="900" />
              <line x1="880" y1="0" x2="880" y2="900" />
              <line x1="1240" y1="0" x2="1240" y2="900" />
              <line x1="0" y1="140" x2="1440" y2="140" />
              <line x1="0" y1="460" x2="1440" y2="460" />
              <line x1="0" y1="780" x2="1440" y2="780" />
            </g>
            {/* Column intersection crosshairs */}
            <g stroke="currentColor" strokeOpacity="0.4" strokeWidth="1">
              <path d="M152,140 H168 M160,132 V148" />
              <path d="M512,140 H528 M520,132 V148" />
              <path d="M872,140 H888 M880,132 V148" />
              <path d="M1232,140 H1248 M1240,132 V148" />
              <path d="M152,460 H168 M160,452 V468" />
              <path d="M512,460 H528 M520,452 V468" />
              <path d="M872,460 H888 M880,452 V468" />
              <path d="M1232,460 H1248 M1240,452 V468" />
            </g>
            {/* Blueprint Grid Axis Callouts */}
            <g fill="currentColor" fillOpacity="0.32" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.12em">
              <text x="170" y="132">AXIS A-01 // CADASTRE</text>
              <text x="530" y="132">AXIS B-02 // CORE</text>
              <text x="890" y="132">AXIS C-03 // LEASEWAY</text>
              <text x="1250" y="132">AXIS D-04 // ELEVATION</text>
              <text x="170" y="452">DATUM +18.4M</text>
              <text x="890" y="452">LOAD CAP 100%</text>
            </g>
            {/* Precision Dimension Brackets */}
            <path d="M155,120 H140 V160 H155" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
            <path d="M1245,120 H1260 V160 H1245" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
          </svg>
        </div>
      )}

      {(variant === "operator" || variant === "provider") && (
        <div className="atmosphere-operator" aria-hidden="true" data-testid="atmosphere-operator">
          <svg
            className="atmosphere-vector-overlay"
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Telemetry Ruler Ticks along header and right border */}
            <g stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.8">
              {Array.from({ length: 24 }).map((_, i) => (
                <line key={`th-${i}`} x1={80 + i * 56} y1="20" x2={80 + i * 56} y2={i % 4 === 0 ? "34" : "27"} />
              ))}
              {Array.from({ length: 16 }).map((_, i) => (
                <line key={`tv-${i}`} x1="1400" y1={80 + i * 48} x2={i % 4 === 0 ? "1386" : "1393"} y2={80 + i * 48} />
              ))}
            </g>
            {/* Precision Technical Reticles */}
            <g stroke="currentColor" strokeOpacity="0.38" strokeWidth="1">
              <g transform="translate(260, 240)">
                <circle r="14" strokeDasharray="3 3" />
                <path d="M-20,0 H20 M0,-20 V20" />
                <text x="24" y="4" fill="currentColor" fillOpacity="0.3" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.1em">
                  NODE [01-B] ONLINE
                </text>
              </g>
              <g transform="translate(860, 190)">
                <circle r="14" strokeDasharray="3 3" />
                <path d="M-20,0 H20 M0,-20 V20" />
                <text x="24" y="4" fill="currentColor" fillOpacity="0.3" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.1em">
                  TELEMETRY LATENCY 12MS
                </text>
              </g>
              <g transform="translate(1160, 560)">
                <circle r="14" strokeDasharray="3 3" />
                <path d="M-20,0 H20 M0,-20 V20" />
                <text x="24" y="4" fill="currentColor" fillOpacity="0.3" fontSize="8" fontFamily="var(--font-mono)" letterSpacing="0.1em">
                  OPS DESK SYNCED
                </text>
              </g>
            </g>
            <text x="80" y="55" fill="currentColor" fillOpacity="0.35" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="0.14em">
              OPERATIONS MATRIX // LAYER 05 AMBIENT TELEMETRY
            </text>
          </svg>
        </div>
      )}
    </>
  );
}
