"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/app/property/[id]/property-detail.css";
import FloodRiskBadge from "@/components/property/FloodRiskBadge";
import UnitInquiryModal from "@/components/property/UnitInquiryModal";
import SpatialVaultWidget from "@/components/property/SpatialVaultWidget";
import { canSee, getCurrentTier } from "@/lib/entitlements";
import {
  unitCapacity,
  scenarioCapacity,
  unitTypeLabel,
} from "@/lib/unitMasterPage";

// Unit Master Page (SCOUTIT_MASTER_BUILD_SPEC.md §9.3) — each unit gets its own
// page modeled on the property master page's chaptered layout. Photo gallery on
// top, then six condensed chapters tuned for co-working / subdivided-space
// buyers: The Space (with the interactive "This space flexes" subdivision-
// scenario toggle + capacity), The Differentiator, The Unit Vault (Cluster+),
// Terms & Fit-Out, The Building (inherits the parent's macro-intel), Your Move
// (routes to the delegated operator when set). Reuses property-detail.css tokens
// so it matches the parent page's visual language.

const ACCENT = "var(--accent, #E8AE3C)";
const eyebrowStyle = {
  fontFamily: "'Courier New',monospace",
  fontSize: "10px",
  color: ACCENT,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  marginBottom: "10px",
};

function Chapter({ number, title, children }) {
  return (
    <section style={{ marginBottom: "56px" }}>
      <div style={eyebrowStyle}>
        {number} — {title}
      </div>
      {children}
    </section>
  );
}

function SpecCard({ label, value }) {
  if (value == null || value === "") return null;
  return (
    <div className="sidebar-block">
      <div className="sidebar-accent-line" />
      <div className="sidebar-label">{label}</div>
      <div className="sidebar-value">{value}</div>
    </div>
  );
}

export default function UnitMasterPage({ slug, unitId }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryPrefill, setInquiryPrefill] = useState("");
  const [unlockedVault, setUnlockedVault] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  useEffect(() => {
    setUnlockedVault(canSee("vault", getCurrentTier()));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms");
        const data = await res.json();
        const match = (data.properties || []).find(
          (p) =>
            (p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()) ||
            (p.id && p.id === slug)
        );
        if (!cancelled) setProperty(match || null);
      } catch (e) {
        console.error("Failed to load property for unit page", e);
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #0e0e0e)" }}>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#c8c8c8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Loading Unit Intelligence…
        </span>
      </div>
    );
  }

  const unit = property?.units_inventory?.find((u) => u.id === unitId);

  if (!property || !unit) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg, #0e0e0e)", gap: "16px" }}>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "20px", color: "#f0ede8" }}>This unit could not be found.</p>
        {property?.slug && (
          <Link href={`/property/${property.slug}`} style={{ color: ACCENT, fontFamily: "'Courier New',monospace", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ← Back to {property.title}
          </Link>
        )}
      </div>
    );
  }

  const d = unit.details || {};
  const scenarios = Array.isArray(unit.subdivision_scenarios) ? unit.subdivision_scenarios : [];
  const operatorName = unit.operator_display_name || null;

  const photos = Array.isArray(unit.photos) && unit.photos.filter(Boolean).length
    ? unit.photos.filter(Boolean)
    : (unit.image || unit.photo ? [unit.image || unit.photo] : []);
  const mainPhoto = photos[Math.min(activePhoto, photos.length - 1)] || "";

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0] || null;

  const cap = unitCapacity(unit);
  const features = Array.isArray(unit.features) ? unit.features : [];
  const inclusions = Array.isArray(d.lease_inclusions) ? d.lease_inclusions.filter(Boolean) : [];

  const availabilityLabel =
    unit.availability_status === "occupied" ? "Currently Occupied"
      : unit.availability_status === "coming_soon" ? "Coming Soon"
        : "Available";

  const openInquiry = (prefill) => {
    setInquiryPrefill(prefill || "");
    setIsInquiryOpen(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg, #0e0e0e)", paddingBottom: "96px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 24px" }}>
        <Link
          href={`/property/${property.slug}`}
          style={{ display: "inline-block", marginBottom: "20px", color: "#c8c8c8", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          ← {property.title}
        </Link>

        {/* ── Hero: photo gallery + identity ── */}
        <div style={{ marginBottom: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
            {d.unit_type && (
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: ACCENT, border: `0.5px solid ${ACCENT}`, borderRadius: "3px", padding: "4px 9px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {unitTypeLabel(d.unit_type)}
              </span>
            )}
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#c8c8c8", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {availabilityLabel}
            </span>
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "40px", color: "#f0ede8", margin: "0 0 20px 0", lineHeight: 1.1 }}>{unit.name}</h1>

          {mainPhoto ? (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "8px", overflow: "hidden", border: "0.5px solid #262626", marginBottom: "10px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainPhoto} alt={unit.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "8px", border: "0.5px solid #262626", background: "linear-gradient(145deg, #161616, #0d0d0d)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px" }}>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#6a6a6a", letterSpacing: "0.12em", textTransform: "uppercase" }}>No unit photo yet</span>
            </div>
          )}

          {photos.length > 1 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {photos.map((p, i) => (
                <button
                  key={p + i}
                  onClick={() => setActivePhoto(i)}
                  style={{ width: "88px", height: "56px", borderRadius: "4px", overflow: "hidden", border: i === activePhoto ? `1px solid ${ACCENT}` : "0.5px solid #262626", padding: 0, cursor: "pointer", background: "none", opacity: i === activePhoto ? 1 : 0.6, transition: "opacity 150ms" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt={`${unit.name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 01 — The Space (specs + capacity + flex toggle) ── */}
        <Chapter number="01" title="The Space">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px", marginBottom: features.length || scenarios.length ? "28px" : 0 }}>
            <SpecCard label="Unit Size" value={unit.size ? `${unit.size} sqm` : null} />
            <SpecCard label="Floor" value={unit.floor ? `Level ${unit.floor}` : null} />
            <SpecCard label="Type" value={d.unit_type ? unitTypeLabel(d.unit_type) : null} />
            <SpecCard label="Capacity" value={cap ? `${cap.estimated ? "~" : ""}${cap.value} seats${cap.estimated ? " (est.)" : ""}` : null} />
            <SpecCard label="Fit-Out" value={d.fit_out_status || null} />
            <SpecCard label="Listed Rate" value={unit.price || null} />
          </div>

          {features.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: scenarios.length ? "28px" : 0 }}>
              {features.map((f) => (
                <span key={f} style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#f0ede8", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", padding: "7px 13px" }}>
                  {f}
                </span>
              ))}
            </div>
          )}

          {/* Interactive "This space flexes" — subdivision scenarios */}
          {scenarios.length > 0 && activeScenario && (
            <div style={{ background: "linear-gradient(145deg, #141414, #0d0d0d)", border: "0.5px solid #262626", borderRadius: "8px", padding: "22px" }}>
              <div style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
                This space flexes ✦
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                {scenarios.map((s) => {
                  const active = s.id === activeScenario.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveScenarioId(s.id)}
                      style={{
                        fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "8px 14px", borderRadius: "4px", cursor: "pointer",
                        background: active ? ACCENT : "transparent",
                        color: active ? "#0e0e0e" : "#c8c8c8",
                        border: active ? `1px solid ${ACCENT}` : "0.5px solid #333",
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {s.label || "Layout"}{s.recommended ? " ★" : ""}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", alignItems: "start" }}>
                <SpecCard label="Configuration" value={activeScenario.cuts ? `${activeScenario.cuts} × ${activeScenario.sqm_each || "?"} sqm` : (activeScenario.sqm_each ? `${activeScenario.sqm_each} sqm` : null)} />
                {(() => {
                  const sc = scenarioCapacity(activeScenario);
                  return <SpecCard label="Capacity / cut" value={sc ? `${sc.estimated ? "~" : ""}${sc.value} seats${sc.estimated ? " (est.)" : ""}` : null} />;
                })()}
                <SpecCard label="Indicative Rate" value={activeScenario.price_each || null} />
                {activeScenario.recommended && <SpecCard label="ScoutIt Note" value="★ Recommended layout" />}
              </div>

              {activeScenario.floor_plan_2d_url && (
                <div style={{ marginTop: "16px", width: "100%", borderRadius: "6px", overflow: "hidden", border: "0.5px solid #262626" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeScenario.floor_plan_2d_url} alt={`${activeScenario.label} layout`} style={{ width: "100%", display: "block" }} />
                </div>
              )}

              <button onClick={() => openInquiry(`I'm interested in the "${activeScenario.label}" layout (${activeScenario.cuts ? `${activeScenario.cuts} × ${activeScenario.sqm_each} sqm` : ""}).`)} className="move-cta" style={{ marginTop: "18px", width: "auto", display: "inline-block", textDecoration: "none" }}>
                Enquire about this layout →
              </button>
            </div>
          )}
        </Chapter>

        {/* ── 02 — The Differentiator ── */}
        {d.differentiator && (
          <Chapter number="02" title="The Differentiator">
            <p style={{ fontFamily: "Georgia,serif", fontSize: "17px", color: "#e8e4dd", lineHeight: 1.65, margin: "0 0 16px 0", maxWidth: "680px" }}>
              {d.differentiator}
            </p>
          </Chapter>
        )}

        {/* ── 03 — The Unit Vault (Cluster+) ── */}
        <Chapter number="03" title="The Unit Vault">
          {unlockedVault ? (
            <SpatialVaultWidget
              lumaUrl={d.floor_plan_3d_data || unit.luma_url}
              matterportUrl={unit.matterport_url}
              heatmapUrl={d.floor_plan_2d_url || unit.heatmap_url}
            />
          ) : (
            <div style={{ position: "relative", width: "100%", padding: "24px", borderRadius: "8px", background: "rgba(22,22,22,0.5)", border: "0.5px solid #262626", overflow: "hidden", minHeight: "180px" }}>
              <div style={{ filter: "blur(6px)", opacity: 0.4, pointerEvents: "none" }}>
                <div style={{ width: "100%", height: "20px", background: "#333", marginBottom: "8px", borderRadius: "2px" }} />
                <div style={{ width: "80%", height: "20px", background: "#333", marginBottom: "8px", borderRadius: "2px" }} />
                <div style={{ width: "90%", height: "20px", background: "#333", borderRadius: "2px" }} />
              </div>
              <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center", padding: "20px" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "15px", color: "#f0ede8", maxWidth: "360px" }}>
                  Interactive 3D floor plan {"&"} unit-specific spatial media.
                </span>
                <a href="/pricing/cluster" style={{ textDecoration: "none", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: ACCENT, padding: "10px 16px", borderRadius: "2px", color: "#0e0e0e", fontWeight: "bold" }}>
                  Unlock the Unit Vault // Cluster+
                </a>
              </div>
            </div>
          )}
        </Chapter>

        {/* ── 04 — Terms & Fit-Out ── */}
        {(d.operating_hours || inclusions.length > 0 || d.min_term || d.deposit || d.fit_out_status || d.house_rules) && (
          <Chapter number="04" title="Terms & Fit-Out">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
              <SpecCard label="Availability" value={availabilityLabel} />
              <SpecCard label="Operating Hours" value={d.operating_hours || null} />
              <SpecCard label="Minimum Term" value={d.min_term || null} />
              <SpecCard label="Deposit" value={d.deposit || null} />
              <SpecCard label="Fit-Out Rules" value={d.fit_out_status || null} />
            </div>
            {inclusions.length > 0 && (
              <div style={{ marginTop: "18px" }}>
                <div style={{ ...eyebrowStyle, color: "#c8c8c8" }}>What&apos;s Included</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {inclusions.map((inc) => (
                    <span key={inc} style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#f0ede8", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", padding: "7px 13px" }}>
                      ✓ {inc}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.house_rules && (
              <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6, marginTop: "18px", maxWidth: "680px" }}>
                {d.house_rules}
              </p>
            )}
          </Chapter>
        )}

        {/* ── 05 — The Building (inherited macro-intel) ── */}
        <Chapter number="05" title="The Building">
          <p style={{ fontFamily: "Georgia,serif", fontSize: "18px", color: "#f0ede8", margin: "0 0 14px 0" }}>{property.title}</p>
          <FloodRiskBadge floodRiskScore={property.flood_risk_score} floodZoneStatus={property.flood_zone_status} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginTop: "16px" }}>
            <SpecCard label="Location" value={property.location || null} />
            <SpecCard label="Building Grade" value={property.building_grade || property.cm_building_grade || null} />
            <SpecCard label="Public Transport" value={property.public_transport || null} />
            <SpecCard label="Nearest Highway" value={property.nearest_highway || null} />
          </div>
          <Link href={`/property/${property.slug}`} style={{ display: "inline-block", marginTop: "16px", color: ACCENT, fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            View full building intelligence →
          </Link>
        </Chapter>

        {/* ── 06 — Your Move (routes to operator when delegated) ── */}
        <Chapter number="06" title="Your Move">
          <div className="broker-card" style={{ marginBottom: "16px" }}>
            <div className="broker-avatar">{(operatorName || property.broker_name || "S")[0]}</div>
            <div className="broker-info">
              <div className="broker-name-el">{operatorName || property.broker_name || "Building Owner"}</div>
              <div className="broker-meta">{operatorName ? "Delegated Operator" : "Direct Listing"}</div>
            </div>
          </div>
          <button onClick={() => openInquiry("")} className="move-cta" style={{ width: "100%", textDecoration: "none" }}>
            Contact {operatorName ? "This Operator" : "The Owner"} →
          </button>
          <button
            onClick={() => openInquiry("I'd like to request a custom cut / configuration for this space that isn't listed above.")}
            style={{ marginTop: "12px", width: "100%", background: "transparent", border: "0.5px solid #333", color: "#c8c8c8", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px", borderRadius: "4px", cursor: "pointer" }}
          >
            None of these fit? Request a custom cut →
          </button>
        </Chapter>
      </div>

      <UnitInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        propertyTitle={property.title}
        propertySlug={property.slug}
        unitId={unit.id}
        unitName={unit.name}
        operatorDisplayName={operatorName}
        prefillMessage={inquiryPrefill}
      />
    </div>
  );
}
