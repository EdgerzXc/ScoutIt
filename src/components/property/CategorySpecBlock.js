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
    <div className="mt-7">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full bg-surface border border-surface-variant px-5 py-3.5 cursor-pointer flex justify-between items-center rounded-sm hover:border-gold-accent/50 transition-colors"
      >
        <span className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase">
          Deeper Intelligence // {unlocked ? "Unlocked" : "Verified Scout"}
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-accent">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"} />
        </svg>
      </button>
      {open && (unlocked ? (
        <div className="bg-surface border border-surface-variant border-t-0 p-5 rounded-b-sm flex flex-col">
          {labels.map((label, i) => {
            const value = valueFor(label);
            return (
              <div key={i} className={`flex justify-between items-baseline py-2.5 gap-5 ${i < labels.length - 1 ? 'border-b border-surface-variant' : ''}`}>
                <span className="font-headline-editorial text-[13px] text-text-secondary">{label}</span>
                {value !== null ? (
                  <span className="font-label-caps text-[12px] text-gold-accent tracking-widest text-right">{value}</span>
                ) : (
                  <span className="font-label-caps text-[11px] text-[#5a5a5a] tracking-widest text-right">Not recorded</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface border border-surface-variant border-t-0 p-5 relative rounded-b-sm">
          <div className="blur-sm pointer-events-none select-none flex flex-col">
            {labels.map((label, i) => (
              <div key={i} className={`flex justify-between items-center py-2.5 ${i < labels.length - 1 ? 'border-b border-surface-variant' : ''}`}>
                <span className="font-headline-editorial text-[13px] text-text-secondary">{label}</span>
                <span className="font-label-caps text-[12px] text-[#3a3a3a] tracking-widest">████████</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-background/90 rounded-b-sm backdrop-blur-sm">
            <span className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase">Solar Tier Unlocks This</span>
            <a href="/pricing/seeker" className="font-label-caps uppercase tracking-widest text-[11px] font-bold text-background bg-gold-accent hover:opacity-90 px-6 py-2.5 rounded-sm transition-opacity">
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
    <div className="mb-9">
      {/* Section header */}
      <div className="mb-5">
        <div className="font-label-caps text-[10px] text-gold-accent tracking-widest uppercase mb-2.5">
          {config.label}
        </div>
        <div className="h-[1px] bg-surface-variant" />
      </div>

      {/* Hero facts (present MAJOR numeric/currency) */}
      {heroFacts.length > 0 && (
        <div className="property-features-scroll mb-6">
          {heroFacts.map(({ field, value }, i) => (
            <div key={i} className="property-feature-item">
              <span className="font-body text-[clamp(20px,2.5vw,26px)] font-medium text-on-surface leading-[1.2]">{value}</span>
              <div className="font-body text-[10px] font-semibold text-text-secondary tracking-widest uppercase mt-1.5">{field.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* MAJOR detail rows — honest "Not listed yet" for blanks */}
      <div className="flex flex-col">
        {rows.map((field, i) => {
          const value = formatValue(field, data[field.key]);
          return (
            <div key={field.key} className={`flex justify-between items-baseline py-2.5 gap-5 ${i < rows.length - 1 ? 'border-b border-surface-variant' : ''}`}>
              <span className="font-label-caps text-[10px] text-text-secondary tracking-widest uppercase shrink-0">{field.label}</span>
              {value !== null ? (
                <span className="font-headline-editorial text-[14px] text-on-surface text-right">{value}</span>
              ) : (
                <span className="font-label-caps text-[11px] text-[#5a5a5a] tracking-widest text-right">Not listed yet</span>
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
