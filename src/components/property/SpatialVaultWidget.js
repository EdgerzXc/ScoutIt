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
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
            3D Spatial Map
          </h4>
          <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "11px", color: "var(--text-muted, #c8c8c8)", marginBottom: "12px" }}>
            Illustrative capture — this property&apos;s own 3D scan is in progress
          </p>
          <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <iframe src={hasSubscription ? lumaUrl : undefined} style={{ width: "100%", height: "100%", border: "none", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} title="3D Spatial Map" />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px", color: "#E8AE3C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>Premium Subscription Required</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", display: "inline-block" }}>
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      {matterportUrl && (
        <div className="vault-item">
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
            360° AR Room Tour
          </h4>
          <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "11px", color: "var(--text-muted, #c8c8c8)", marginBottom: "12px" }}>
            Illustrative tour — this property&apos;s own 360° capture is in progress
          </p>
          <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <iframe src={hasSubscription ? matterportUrl : undefined} style={{ width: "100%", height: "100%", border: "none", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} title="360 Tour" />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", marginTop: "12px", display: "inline-block" }}>
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      {heatmapUrl && (
        <div className="vault-item">
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>
            Drone Heatmap Analysis
          </h4>
          <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <div style={{ width: "100%", height: "100%", background: "#111", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", marginTop: "12px", display: "inline-block" }}>
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
