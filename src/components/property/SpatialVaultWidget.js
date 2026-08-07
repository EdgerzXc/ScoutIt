"use client";

import { useState } from "react";
import { usePremiumFields } from "@/lib/usePremiumFields";

// ── §25.1 / §45: SERVER-ENFORCED ──
// The Vault unlocks at Cluster+. This used to call
// `canSee("vault", getCurrentTier())` — localStorage — and the asset URLs were
// serialised into the page for everyone regardless. That mattered more here
// than anywhere else: these are URLs to hosted 3D scans and drone captures, so
// leaking one doesn't just bypass the paywall for a session, it hands over a
// permanent direct link to the asset.
//
// URLs now arrive only from /api/property/premium, which checks the tier
// server-side. `lumaUrl` / `matterportUrl` / `heatmapUrl` / `floorPlans` props
// are still accepted as a fallback for callers that already hold entitled data
// (e.g. an owner viewing their own listing in the dashboard), but for a public
// property page they arrive empty.
export default function SpatialVaultWidget({ slug, lumaUrl, matterportUrl, heatmapUrl, floorPlans = [] }) {
  const { fields } = usePremiumFields(slug);
  const [heatmapFailed, setHeatmapFailed] = useState(false);

  // Server value wins; the prop is only a fallback for already-entitled callers.
  const realLuma      = fields.luma3dMapUrl     || lumaUrl       || "";
  const realMatterport= fields.matterportTourUrl|| matterportUrl || "";
  const realHeatmap   = fields.droneHeatmapUrl  || heatmapUrl    || "";
  const realFloorPlans= (fields.floorPlans && fields.floorPlans.length ? fields.floorPlans : floorPlans) || [];

  // "Unlocked" is now a statement about what the SERVER returned, not about
  // what the browser claims to be.
  const hasSubscription = Boolean(
    realLuma || realMatterport || realHeatmap || realFloorPlans.length,
  );

  return (
    <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      { (realLuma || !hasSubscription) && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-1">
            3D Spatial Map
          </h4>
          <p className="font-headline-editorial italic text-[11px] text-text-secondary mb-3">
            Illustrative capture — this property&apos;s own 3D scan is in progress
          </p>
          <div className="relative w-full h-[400px] rounded overflow-hidden border border-surface-variant">
            <iframe src={hasSubscription ? realLuma : undefined} className={`w-full h-full border-none ${hasSubscription ? '' : 'blur-sm brightness-50'}`} title="3D Spatial Map" />
            {!hasSubscription && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                <span className="font-headline-editorial text-base text-on-surface mb-2">Unlock The Spatial Vault</span>
                <span className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-4">Premium Subscription Required</span>
                <a href="/pricing/seeker" className="font-label-caps uppercase tracking-widest text-[11px] font-bold text-background bg-gold-accent hover:opacity-90 px-6 py-3 rounded transition-opacity">
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      { (realMatterport || !hasSubscription) && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-1">
            360° AR Room Tour
          </h4>
          <p className="font-headline-editorial italic text-[11px] text-text-secondary mb-3">
            Illustrative tour — this property&apos;s own 360° capture is in progress
          </p>
          <div className="relative w-full h-[400px] rounded overflow-hidden border border-surface-variant">
            <iframe src={hasSubscription ? realMatterport : undefined} className={`w-full h-full border-none ${hasSubscription ? '' : 'blur-sm brightness-50'}`} title="360 Tour" />
            {!hasSubscription && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                <span className="font-headline-editorial text-base text-on-surface mb-2">Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" className="font-label-caps uppercase tracking-widest text-[11px] font-bold text-background bg-gold-accent hover:opacity-90 px-6 py-3 rounded transition-opacity mt-3">
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      { (realHeatmap || !hasSubscription) && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-3">
            Drone Heatmap Analysis
          </h4>
          <div className="relative w-full h-[240px] rounded overflow-hidden border border-surface-variant">
            <div className={`w-full h-full ${hasSubscription ? '' : 'blur-sm brightness-50'}`}>
              {realHeatmap && !heatmapFailed ? (
                realHeatmap.includes('.png') || realHeatmap.includes('.jpg') || realHeatmap.includes('.jpeg') || realHeatmap.includes('.webp') || realHeatmap.includes('.svg') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={realHeatmap} alt="Drone Heatmap Analysis" className="w-full h-full object-cover" onError={() => setHeatmapFailed(true)} />
                ) : (
                  <iframe src={realHeatmap} className="w-full h-full border-none" title="Drone Heatmap Analysis" onError={() => setHeatmapFailed(true)} />
                )
              ) : (
                <DroneThermalVisualizer />
              )}
            </div>
            {!hasSubscription && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                <span className="font-headline-editorial text-base text-on-surface mb-2">Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" className="font-label-caps uppercase tracking-widest text-[11px] font-bold text-background bg-gold-accent hover:opacity-90 px-6 py-3 rounded transition-opacity mt-3">
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Floor plans — FIXED 2026-07-30 (finding F2). Specced as a Cluster+
          Vault benefit and uploadable by owners, but never read from Airtable
          or rendered, so subscribers were billed for something the site could
          not display. Unlike the other Vault items these are ATTACHMENTS (an
          array), and they are images or PDFs, so each gets a thumbnail and a
          download rather than an iframe. */}
      { (realFloorPlans.length > 0 || !hasSubscription) && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-3">
            Floor Plans{realFloorPlans.length > 1 ? ` · ${realFloorPlans.length}` : ""}
          </h4>
          <div className="relative rounded overflow-hidden border border-surface-variant">
            <div className={hasSubscription ? "" : "blur-sm brightness-50 pointer-events-none"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#111]">
                {realFloorPlans.map((plan) => {
                  const isImage = (plan.type || "").startsWith("image/");
                  return (
                    <a
                      key={plan.url}
                      // Locked viewers must not be able to reach the asset by
                      // tabbing to the link behind the blur.
                      href={hasSubscription ? plan.url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      tabIndex={hasSubscription ? 0 : -1}
                      aria-hidden={!hasSubscription}
                      className="block rounded overflow-hidden border border-surface-variant bg-background hover:border-gold-accent transition-colors"
                    >
                      {isImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={hasSubscription ? plan.url : ""} alt={plan.name}
                             className="w-full h-[160px] object-contain bg-[var(--surface2)]" />
                      ) : (
                        <div className="w-full h-[160px] flex items-center justify-center bg-[var(--surface2)]">
                          <span className="font-label-caps text-[10px] text-text-secondary tracking-widest uppercase">
                            PDF
                          </span>
                        </div>
                      )}
                      <span className="block px-3 py-2 font-label-caps text-[10px] text-text-secondary tracking-widest uppercase truncate">
                        {plan.name}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
            {!hasSubscription && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
                <span className="font-headline-editorial text-base text-on-surface mb-2">Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" className="font-label-caps uppercase tracking-widest text-[11px] font-bold text-background bg-gold-accent hover:opacity-90 px-6 py-3 rounded transition-opacity mt-3">
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DroneThermalVisualizer() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0c0d12", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "16px", overflow: "hidden" }}>
      {/* Background Thermal Radiance Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle at 45% 40%, rgba(220,38,38,0.35) 0%, rgba(245,158,11,0.25) 25%, rgba(5,150,105,0.2) 50%, rgba(12,16,43,0.9) 80%)",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }} />

      {/* Grid Pattern */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        pointerEvents: "none",
      }} />

      {/* Top Telemetry Header */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "#E8AE3C", letterSpacing: "1px", fontWeight: "bold" }}>
            🚁 RADIOMETRIC FLIR DRONE SCAN
          </span>
          <span style={{ fontSize: "9px", fontFamily: "var(--font-mono, monospace)", background: "rgba(16,185,129,0.15)", border: "0.5px solid #10B981", color: "#10B981", padding: "2px 6px", borderRadius: "3px" }}>
            LIVE SENSOR AT 120m AGL
          </span>
        </div>
        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "#888", display: "flex", gap: "12px" }}>
          <span>ACCURACY: ±0.5°C</span>
          <span>SOLAR FLUX: 940 W/m²</span>
        </div>
      </div>

      {/* Center Target Crosshair & Heatmap Reading */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", alignItems: "center", flex: 1, margin: "12px 0" }}>
        <div style={{ border: "1px dashed rgba(232,174,60,0.5)", borderRadius: "50%", width: "110px", height: "110px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "12px", textAlign: "center" }}>
          <span style={{ fontSize: "9px", fontFamily: "var(--font-mono, monospace)", color: "#888" }}>PEAK ROOF TEMP</span>
          <span style={{ fontSize: "20px", fontFamily: "var(--font-body)", color: "#F7C64E", fontWeight: "bold" }}>34.8°C</span>
          <span style={{ fontSize: "8px", fontFamily: "var(--font-mono, monospace)", color: "#10B981" }}>NOMINAL SHADING</span>
        </div>
      </div>

      {/* Bottom Thermal Spectrum Bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-mono, monospace)", color: "#aaa" }}>
          <span>20°C (COATING)</span>
          <span>26°C (SHADOW)</span>
          <span>32°C (SURFACE)</span>
          <span>38°C (WHITE HOT)</span>
        </div>
        <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "linear-gradient(to right, #0c102b, #059669, #f59e0b, #dc2626, #ffffff)" }} />
      </div>
    </div>
  );
}
