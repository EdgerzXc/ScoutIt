"use client";

import { useState, useEffect } from "react";
import { canSee, getCurrentTier } from "@/lib/entitlements";

// ═══════════════════════════════════════════════════
// CATEGORY SPEC BLOCK
// Renders the per-category field group (d.cat.<type>) on the
// property master page. SOP §3 order: editorial → SPEC BLOCK → location.
//
// Tiering follows PROPERTY_CATEGORY_SOP.md §8:
//   • MAJOR  → free, decision-grade. Hero facts (numeric/currency) +
//              detail rows. Missing values show "Not listed yet"
//              (never an invented value — root-cause #2).
//   • MINOR  → deeper/operator/investor intel. Shown as a blur-locked
//              teaser (labels + ████) until the subscription layer is
//              live. Real MINOR values are intentionally NOT placed in
//              the DOM, so nothing leaks before the paywall is enforced.
// ═══════════════════════════════════════════════════

// ── Formatters ────────────────────────────────────
const peso = (v) => `₱${Number(v).toLocaleString("en-PH")}`;
const num = (v, suffix) => `${Number(v).toLocaleString("en-PH")}${suffix ? ` ${suffix}` : ""}`;
const pct = (v) => `${v}%`;
const txt = (v) => String(v);

// A value counts as "blank" (→ "Not listed yet") when null/empty/0/N/A.
function isBlank(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "number") return v === 0;
  if (typeof v === "boolean") return v === false; // unchecked Airtable box = unknown
  const s = String(v).trim();
  return s === "" || s.toUpperCase() === "N/A";
}

function formatValue(field, raw) {
  if (isBlank(raw)) return null;
  switch (field.fmt) {
    case "peso": return peso(raw);
    case "num": return num(raw, field.suffix);
    case "pct": return pct(raw);
    case "bool": return "Yes";
    default: return txt(raw);
  }
}

// ── Per-category field config (keys map to the normalizer's d.cat.*) ──
// hero: true → eligible for the 3–5 numeric/currency hero facts (MAJOR only).
const SPEC_CONFIG = {
  commercial: {
    label: "Commercial Specifications",
    major: [
      { key: "rentPerSqm", label: "Published Rent", fmt: "text", hero: true },
      { key: "totalGLA", label: "Total GLA", fmt: "num", suffix: "sqm", hero: true },
      { key: "floorPlate", label: "Floor Plate", fmt: "text", hero: true },
      { key: "buildingGrade", label: "Building Grade", fmt: "text" },
      { key: "handOver", label: "Hand-over Condition", fmt: "text" },
      { key: "availability", label: "Availability", fmt: "text" },
      { key: "minLeaseTerm", label: "Min. Lease Term", fmt: "text" },
      { key: "certification", label: "Certification", fmt: "text" },
      { key: "peza", label: "PEZA Accredited", fmt: "bool" },
    ],
    minor: ["CAMC (CUSA)", "A/C Charges", "AC System", "Reserved Parking", "Escalation Rate", "Fit-out Allowance",
      "Rent-free Period", "Parking Ratio", "Backup Power", "Floor Loading",
      "Internet Providers", "Available Units", "Towers / Zones", "Cap Rate", "NOI"],
  },
  residential: {
    label: "Residential Specifications",
    major: [
      { key: "floorLevel", label: "Floor Level", fmt: "text" },
      { key: "view", label: "View", fmt: "text" },
      { key: "turnoverDate", label: "Turnover", fmt: "text" },
      { key: "petPolicy", label: "Pet Policy", fmt: "text" },
      { key: "studio", label: "Studio Unit", fmt: "bool" },
    ],
    minor: ["Price / sqm", "Payment Terms"],
  },
  str: {
    label: "Short-Term Rental Specifications",
    major: [
      { key: "maxGuests", label: "Max Guests", fmt: "num", suffix: "guests", hero: true },
      { key: "rating", label: "Avg. Rating", fmt: "num", hero: true },
      { key: "bedrooms", label: "Bedrooms", fmt: "num" },
      { key: "bathrooms", label: "Bathrooms", fmt: "num" },
      { key: "minStay", label: "Min. Stay", fmt: "num", suffix: "nights" },
      { key: "checkInOut", label: "Check-in / out", fmt: "text" },
    ],
    minor: ["Weekend Rate", "Bed Configuration", "Self Check-in", "House Rules",
      "Cancellation Policy", "Permit / Accreditation", "WiFi Speed"],
  },
  restaurant: {
    label: "Culinary Specifications",
    major: [
      { key: "floorArea", label: "Floor Area", fmt: "num", suffix: "sqm", hero: true },
      { key: "seating", label: "Seating Capacity", fmt: "num", suffix: "seats", hero: true },
      { key: "kitchen", label: "Kitchen Condition", fmt: "text" },
      { key: "footTraffic", label: "Foot Traffic", fmt: "text" },
      { key: "frontage", label: "Frontage", fmt: "text" },
      { key: "indoorOutdoor", label: "Indoor / Outdoor", fmt: "text" },
      { key: "previousUse", label: "Previous Use", fmt: "text" },
    ],
    minor: ["Hood / Exhaust", "Grease Trap", "Gas Line", "Power Capacity",
      "Delivery Access", "Liquor License", "F&B Zoning Permit", "Ceiling Height",
      "Turnover Condition", "Parking"],
  },
  hospitality: {
    label: "Hospitality Specifications",
    major: [
      { key: "rooms", label: "Room Count", fmt: "num", suffix: "rooms", hero: true },
      { key: "stars", label: "Star Rating", fmt: "num", suffix: "★", hero: true },
      { key: "fbOutlets", label: "F&B Outlets", fmt: "num", hero: true },
      { key: "functionRooms", label: "Function Rooms", fmt: "num", hero: true },
      { key: "operator", label: "Operator / Brand", fmt: "text" },
      { key: "roomTypes", label: "Room Types", fmt: "text" },
      { key: "yearRenovated", label: "Built / Renovated", fmt: "text" },
    ],
    minor: ["ADR", "Occupancy Rate", "RevPAR", "Cap Rate", "GFA", "Land Area"],
  },
  venue: {
    label: "Venue Specifications",
    major: [
      { key: "seated", label: "Seated Capacity", fmt: "num", suffix: "pax", hero: true },
      { key: "standing", label: "Standing Capacity", fmt: "num", suffix: "pax", hero: true },
      { key: "floorArea", label: "Floor Area", fmt: "num", suffix: "sqm", hero: true },
      { key: "minHours", label: "Min. Booking", fmt: "num", suffix: "hrs" },
      { key: "indoorOutdoor", label: "Indoor / Outdoor", fmt: "text" },
      { key: "aircon", label: "Air-conditioned", fmt: "bool" },
      { key: "catering", label: "Catering Policy", fmt: "text" },
    ],
    minor: ["Layout Configs", "Ceiling Height", "AV Equipment", "Power Capacity",
      "Parking", "Accessibility", "Noise Curfew"],
  },
};

// Map the page's category detection to a SPEC_CONFIG key.
function resolveCategoryKey(category) {
  const c = (category || "").toLowerCase();
  if (c.includes("restaurant") || c.includes("culinary")) return "restaurant";
  if (c.includes("venue") || c.includes("event")) return "venue";
  if (c.includes("hospitality")) return "hospitality";
  if (c.includes("str") || c.includes("short")) return "str";
  if (c.includes("commercial") || c.includes("office") || c.includes("retail")) return "commercial";
  if (c.includes("residential") || c.includes("condo") || c.includes("house")) return "residential";
  return null;
}

// ── MINOR deep-intel section (mirrors DeepIntelWidget) ──
// Below Solar → blur-locked teaser. Solar+ → reveals real values (from
// property.deepIntel, keyed by label). SSR-safe: locked until the client reads
// the viewer's tier. NOTE: client-trusted for now (later security pass enforces
// server-side) — that's why real values still only ship on demo/seed data.
function MinorLockSection({ labels, values }) {
  const [open, setOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(canSee("deepIntel", getCurrentTier())); }, []);
  if (!labels || labels.length === 0) return null;

  const valueFor = (label) => {
    const v = values ? values[label] : undefined;
    return v != null && String(v).trim() !== "" ? v : null;
  };

  return (
    <div style={{ marginTop: "28px" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", background: "#161616", border: "0.5px solid #262626", padding: "14px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "2px" }}
      >
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#ffb800", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Deeper Intelligence // {unlocked ? "Unlocked" : "Verified Scout"}
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="#ffb800" strokeWidth="1.5">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"} />
        </svg>
      </button>
      {open && (unlocked ? (
        <div style={{ background: "#161616", border: "0.5px solid #262626", borderTop: "none", padding: "20px", borderRadius: "0 0 2px 2px", display: "flex", flexDirection: "column" }}>
          {labels.map((label, i) => {
            const value = valueFor(label);
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderBottom: i < labels.length - 1 ? "1px solid #262626" : "none", gap: "20px" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#c8c8c8" }}>{label}</span>
                {value !== null ? (
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#ffb800", letterSpacing: "0.04em", textAlign: "right" }}>{value}</span>
                ) : (
                  <span style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#5a5a5a", letterSpacing: "0.08em", textAlign: "right" }}>Not recorded</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#161616", border: "0.5px solid #262626", borderTop: "none", padding: "20px", position: "relative", borderRadius: "0 0 2px 2px" }}>
          <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", display: "flex", flexDirection: "column" }}>
            {labels.map((label, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < labels.length - 1 ? "1px solid #262626" : "none" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#c8c8c8" }}>{label}</span>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#3a3a3a", letterSpacing: "0.1em" }}>████████</span>
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", background: "rgba(22,22,22,0.88)", borderRadius: "0 0 2px 2px" }}>
            <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px", color: "#ffb800", letterSpacing: "0.25em", textTransform: "uppercase" }}>Solar Tier Unlocks This</span>
            <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#ffb800", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", letterSpacing: "0.04em" }}>
              Unlock Full Intelligence →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CategorySpecBlock({ property, extraLockedLabels = [] }) {
  const d = property || {};
  const cat = d.spaceCategory || d.property_type || "";
  const key = resolveCategoryKey(cat);
  const config = key && SPEC_CONFIG[key];
  const data = (d.cat && d.cat[key]) || d || null;

  // No category match or no group wired → render nothing (page handles its
  // own sections); avoids a "Not listed yet" wall for unmapped records.
  if (!config || !data) return null;

  // Split MAJOR fields into present hero facts (numeric/currency) and detail rows.
  const heroFacts = config.major
    .filter((field) => field.hero)
    .map((field) => ({ field, value: formatValue(field, data[field.key]) }))
    .filter((x) => x.value !== null)
    .slice(0, 5);

  // Every non-hero MAJOR field is a detail row (blanks → "Not listed yet").
  const rows = config.major.filter((field) => !field.hero);

  return (
    <div style={{ marginBottom: "36px" }}>
      {/* Section header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#ffb800", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "10px" }}>
          {config.label}
        </div>
        <div style={{ height: "1px", background: "#262626" }} />
      </div>

      {/* Hero facts (present MAJOR numeric/currency) */}
      {heroFacts.length > 0 && (
        <div className="property-features-scroll" style={{ marginBottom: "24px" }}>
          {heroFacts.map(({ field, value }, i) => (
            <div key={i} className="property-feature-item">
              <span style={{ fontFamily: "var(--font-body)", fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 500, color: "#f0ede8", lineHeight: 1.2 }}>{value}</span>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 600, color: "#c8c8c8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "6px" }}>{field.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* MAJOR detail rows — honest "Not listed yet" for blanks */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((field, i) => {
          const value = formatValue(field, data[field.key]);
          return (
            <div key={field.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderBottom: i < rows.length - 1 ? "1px solid #262626" : "none", gap: "20px" }}>
              <span style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#c8c8c8", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0 }}>{field.label}</span>
              {value !== null ? (
                <span style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#f0ede8", textAlign: "right" }}>{value}</span>
              ) : (
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: "#5a5a5a", letterSpacing: "0.08em", textAlign: "right" }}>Not listed yet</span>
              )}
            </div>
          );
        })}
      </div>

      {/* MINOR — blur-locked teaser (paywall placeholder). Editorial
          deep-intel labels are folded in so the page shows ONE locked box. */}
      <MinorLockSection labels={[...config.minor, ...extraLockedLabels]} values={d.deepIntel} />
    </div>
  );
}
