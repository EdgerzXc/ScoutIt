"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "@/app/property/[id]/property-detail.css";
import FloodRiskBadge from "@/components/property/FloodRiskBadge";
import UnitInquiryModal from "@/components/property/UnitInquiryModal";

// Unit Master Page (SCOUTIT_MASTER_BUILD_SPEC.md §9.3) — each delegated or
// undelegated unit gets its own page instead of just a card on the parent
// property. Five condensed chapters: The Space, The Differentiator, Terms &
// Amenities, The Building (pulls the parent property's macro-intel), Your
// Move. Deliberately a simpler single-scroll layout rather than replicating
// ResidentialFlow/CommercialFlow's full horizontal chapter-scroll system —
// this page is "sound on its own" per spec, not a peer of the full property
// flows. Reuses property-detail.css's shared tokens (sidebar-block,
// broker-card, move-cta) so it matches the parent page's visual language.
export default function UnitMasterPage({ slug, unitId }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

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
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0e0e0e" }}>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#c8c8c8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Loading Unit Intelligence…
        </span>
      </div>
    );
  }

  const unit = property?.units_inventory?.find((u) => u.id === unitId);

  if (!property || !unit) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0e0e0e", gap: "16px" }}>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "20px", color: "#f0ede8" }}>This unit could not be found.</p>
        {property?.slug && (
          <Link href={`/property/${property.slug}`} style={{ color: "#E8AE3C", fontFamily: "'Courier New',monospace", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ← Back to {property.title}
          </Link>
        )}
      </div>
    );
  }

  const photo = unit.photo || unit.image || (Array.isArray(unit.photos) ? unit.photos.find(Boolean) : "") || "";
  const specs = [
    unit.size ? `${unit.size} sqm` : null,
    unit.floor ? `Floor ${unit.floor}` : null,
    unit.price ? String(unit.price) : null,
  ].filter(Boolean);
  const features = Array.isArray(unit.features) ? unit.features : [];
  const operatorName = unit.operator_display_name || null;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px" }}>
        <Link
          href={`/property/${property.slug}`}
          style={{ display: "inline-block", marginBottom: "24px", color: "#c8c8c8", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase" }}
        >
          ← {property.title}
        </Link>

        {/* ── Chapter 1: The Space ── */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
            The Space
          </div>
          <h1 style={{ fontFamily: "Georgia,serif", fontSize: "36px", color: "#f0ede8", marginBottom: "16px" }}>{unit.name}</h1>
          {photo && (
            <div style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: "6px", overflow: "hidden", marginBottom: "16px", border: "0.5px solid #262626" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={unit.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          {specs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {specs.map((s) => (
                <span key={s} style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#c8c8c8", border: "0.5px solid #262626", borderRadius: "3px", padding: "5px 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Chapter 2: The Differentiator ── */}
        {features.length > 0 && (
          <div style={{ marginBottom: "48px" }}>
            <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
              The Differentiator
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {features.map((f) => (
                <span key={f} style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#f0ede8", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", padding: "8px 14px" }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Chapter 3: Terms & Amenities ── */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
            Terms &amp; Amenities
          </div>
          <div className="sidebar-block">
            <div className="sidebar-accent-line" />
            <div className="sidebar-label">Availability</div>
            <div className="sidebar-value">
              {unit.availability_status === "occupied" ? "Currently Occupied"
                : unit.availability_status === "coming_soon" ? "Coming Soon"
                : "Available"}
            </div>
          </div>
        </div>

        {/* ── Chapter 4: The Building ── */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
            The Building
          </div>
          <p style={{ fontFamily: "Georgia,serif", fontSize: "18px", color: "#f0ede8", marginBottom: "16px" }}>{property.title}</p>
          <FloodRiskBadge floodRiskScore={property.flood_risk_score} floodZoneStatus={property.flood_zone_status} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px", marginTop: "16px" }}>
            {property.location && (
              <div className="sidebar-block">
                <div className="sidebar-accent-line" />
                <div className="sidebar-label">Location</div>
                <div className="sidebar-value">{property.location}</div>
              </div>
            )}
            {property.public_transport && (
              <div className="sidebar-block">
                <div className="sidebar-accent-line" />
                <div className="sidebar-label">Public Transport</div>
                <div className="sidebar-value">{property.public_transport}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Chapter 5: Your Move ── */}
        <div>
          <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
            Your Move
          </div>
          <div className="broker-card" style={{ marginBottom: "16px" }}>
            <div className="broker-avatar">{(operatorName || property.broker_name || "S")[0]}</div>
            <div className="broker-info">
              <div className="broker-name-el">{operatorName || property.broker_name || "Building Owner"}</div>
              <div className="broker-meta">{operatorName ? "Delegated Operator" : "Direct Listing"}</div>
            </div>
          </div>
          <button onClick={() => setIsInquiryOpen(true)} className="move-cta">
            Contact {operatorName ? "This Operator" : "The Owner"} →
          </button>
        </div>
      </div>

      <UnitInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        propertyTitle={property.title}
        propertySlug={property.slug}
        unitId={unit.id}
        unitName={unit.name}
        operatorDisplayName={operatorName}
      />
    </div>
  );
}
