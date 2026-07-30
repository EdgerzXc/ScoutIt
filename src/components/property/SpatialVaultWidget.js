"use client";

import { useState, useEffect } from "react";
import { canSee, getCurrentTier } from "@/lib/entitlements";

export default function SpatialVaultWidget({ lumaUrl, matterportUrl, heatmapUrl, floorPlans = [] }) {
  // Tier-gated: the Vault unlocks at Cluster+. SSR-safe — locked until the client reads the viewer's tier.
  // NOTE: client-trusted for now; server-authoritative enforcement is the later security pass.
  const [hasSubscription, setHasSubscription] = useState(false);
  useEffect(() => { setHasSubscription(canSee("vault", getCurrentTier())); }, []);

  return (
    <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {lumaUrl && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-1">
            3D Spatial Map
          </h4>
          <p className="font-headline-editorial italic text-[11px] text-text-secondary mb-3">
            Illustrative capture — this property&apos;s own 3D scan is in progress
          </p>
          <div className="relative w-full h-[400px] rounded overflow-hidden border border-surface-variant">
            <iframe src={hasSubscription ? lumaUrl : undefined} className={`w-full h-full border-none ${hasSubscription ? '' : 'blur-sm brightness-50'}`} title="3D Spatial Map" />
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
      {matterportUrl && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-1">
            360° AR Room Tour
          </h4>
          <p className="font-headline-editorial italic text-[11px] text-text-secondary mb-3">
            Illustrative tour — this property&apos;s own 360° capture is in progress
          </p>
          <div className="relative w-full h-[400px] rounded overflow-hidden border border-surface-variant">
            <iframe src={hasSubscription ? matterportUrl : undefined} className={`w-full h-full border-none ${hasSubscription ? '' : 'blur-sm brightness-50'}`} title="360 Tour" />
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
      {heatmapUrl && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-3">
            Drone Heatmap Analysis
          </h4>
          <div className="relative w-full h-[200px] rounded overflow-hidden border border-surface-variant">
            <div className={`w-full h-full bg-[#111] ${hasSubscription ? '' : 'blur-sm brightness-50'}`} />
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
      {floorPlans.length > 0 && (
        <div className="vault-item">
          <h4 className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-3">
            Floor Plans{floorPlans.length > 1 ? ` · ${floorPlans.length}` : ""}
          </h4>
          <div className="relative rounded overflow-hidden border border-surface-variant">
            <div className={hasSubscription ? "" : "blur-sm brightness-50 pointer-events-none"}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#111]">
                {floorPlans.map((plan) => {
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
                             className="w-full h-[160px] object-contain bg-[#0d0d0d]" />
                      ) : (
                        <div className="w-full h-[160px] flex items-center justify-center bg-[#0d0d0d]">
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
