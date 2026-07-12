"use client";

import { useState, useEffect } from "react";
import { canSee, getCurrentTier } from "@/lib/entitlements";

export default function SpatialVaultWidget({ lumaUrl, matterportUrl, heatmapUrl }) {
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
                <span className="font-label-caps text-[9px] text-gold-accent tracking-widest uppercase mb-4">Premium Subscription Required</span>
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
    </div>
  );
}
