import dynamic from "next/dynamic";

const SpatialVaultWidget = dynamic(() => import("@/components/property/SpatialVaultWidget"), { ssr: false });

export default function PropertyVaultSection({
  activeTab,
  d,
  intelSourceLabel,
}) {
  return (
    <div className={`chapter-panel ${activeTab === "vault" ? "active" : ""}`} id="panel-vault">
      <div className="panel-content" style={{ maxWidth: "100%" }} tabIndex={0} aria-label="Scrollable Spatial Vault content">
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
            THE VAULT
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px", letterSpacing: "0.01em" }}>
            Floor plans, scans & spatial records
          </div>
          <div style={{ height: "1px", background: "var(--accent)" }} />
        </div>

        <div style={{ marginBottom: "30px" }}>
          <span style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, color: "var(--text-primary)", letterSpacing: "0.01em", lineHeight: 1.2 }}>
            3D Virtual Tours & Blueprints
          </span>
        </div>

        {/* slug drives the server-side entitlement fetch (§45). The
            d.* props arrive EMPTY on a public property page now — they
            are stripped before serialisation — and are kept only for
            callers that already hold entitled data. */}
        <SpatialVaultWidget
          slug={d.slug}
          lumaUrl={d.luma3dMapUrl}
          matterportUrl={d.matterportTourUrl}
          heatmapUrl={d.droneHeatmapUrl}
          floorPlans={d.floorPlans}
          hasVaultMedia={d.premiumAvailable?.includes("vault")}
        />
      </div>
      <div className="panel-sidebar">
        <div className="sidebar-block">
          <div className="sidebar-accent-line" style={{ background: "var(--accent)" }} />
          <div className="sidebar-label" style={{ color: "var(--accent)" }}>Vault Status</div>
          <div className="sidebar-value">Secured</div>
        </div>
        <div className="sidebar-block">
          <div className="sidebar-label">Verification</div>
          <div className="sidebar-value">{intelSourceLabel ? intelSourceLabel(d.last_verified_date) : "Unverified"}</div>
        </div>
        <div className="sidebar-block">
          <div className="sidebar-label">Access</div>
          <div className="sidebar-value">Cluster Tier Only</div>
        </div>
      </div>
    </div>
  );
}
