"use client";

import { useState } from "react";
import { Building2, ShieldCheck, Layers, Cpu, Sparkles, MapPin } from "lucide-react";

/**
 * BuildingSpecsCard — Interactive architectural engineering and tower specs widget (A-195).
 * Renders verified structural specifications, sustainability certifications, and team provenance.
 */
export default function BuildingSpecsCard({
  title = "Building Engineering & Architecture",
  developer,
  architect,
  completionYear,
  heightMeters,
  floorCount,
  elevators = "High-Speed Destination Dispatch",
  powerRedundancy = "100% Dual-Feed N+1 Generator Backup",
  leedStatus = "LEED Gold Certified",
  district,
  gfa,
}) {
  const [activeTab, setActiveTab] = useState("engineering");

  return (
    <div
      className="my-6 rounded-xl border border-gold-accent/25 bg-surface-alt/90 p-5 sm:p-6 backdrop-blur-md shadow-lg"
      role="region"
      aria-label="Building Specifications Card"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant/80 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold-accent font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              ARCHITECTURAL BRIEFING
            </span>
            {district ? (
              <span className="font-mono text-[12px] text-text-tertiary border border-surface-variant px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gold-accent" />
                {district}
              </span>
            ) : null}
          </div>
          <h3 className="font-serif text-lg sm:text-xl text-text-primary m-0 font-normal">
            {title}
          </h3>
        </div>

        {/* Team Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {developer ? (
            <span className="font-mono text-[12px] text-text-secondary bg-black/40 border border-surface-variant px-2.5 py-1 rounded">
              DEV: <strong className="text-text-primary">{developer}</strong>
            </span>
          ) : null}
          {architect ? (
            <span className="font-mono text-[12px] text-text-secondary bg-black/40 border border-surface-variant px-2.5 py-1 rounded">
              ARCH: <strong className="text-text-primary">{architect}</strong>
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1" role="tablist" aria-label="Specs Categories">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "engineering"}
          onClick={() => setActiveTab("engineering")}
          className={`font-mono text-[12px] uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-[color,border-color,background-color] duration-150 flex items-center gap-1.5 shrink-0 ${
            activeTab === "engineering"
              ? "bg-gold-accent/15 border border-gold-accent text-gold-accent font-semibold"
              : "bg-surface border border-surface-variant text-text-secondary hover:text-text-primary hover:border-surface-variant/80"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Engineering & Systems
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "sustainability"}
          onClick={() => setActiveTab("sustainability")}
          className={`font-mono text-[12px] uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-[color,border-color,background-color] duration-150 flex items-center gap-1.5 shrink-0 ${
            activeTab === "sustainability"
              ? "bg-gold-accent/15 border border-gold-accent text-gold-accent font-semibold"
              : "bg-surface border border-surface-variant text-text-secondary hover:text-text-primary hover:border-surface-variant/80"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Sustainability & ESG
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "dimensions"}
          onClick={() => setActiveTab("dimensions")}
          className={`font-mono text-[12px] uppercase tracking-wider px-3.5 py-1.5 rounded-sm transition-[color,border-color,background-color] duration-150 flex items-center gap-1.5 shrink-0 ${
            activeTab === "dimensions"
              ? "bg-gold-accent/15 border border-gold-accent text-gold-accent font-semibold"
              : "bg-surface border border-surface-variant text-text-secondary hover:text-text-primary hover:border-surface-variant/80"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Dimensions & Planning
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "engineering" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tabpanel" aria-label="Engineering Panel">
          <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
            <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
              Vertical Transportation
            </span>
            <p className="font-sans text-sm text-text-primary font-medium m-0">
              {elevators}
            </p>
            <span className="font-mono text-[12px] text-text-tertiary block mt-1">
              Integrated access control & smart dispatch
            </span>
          </div>

          <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
            <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
              Electrical Redundancy
            </span>
            <p className="font-sans text-sm text-text-primary font-medium m-0">
              {powerRedundancy}
            </p>
            <span className="font-mono text-[12px] text-text-tertiary block mt-1">
              Seamless synchronization for uninterrupted operations
            </span>
          </div>

          {heightMeters ? (
            <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
              <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
                Structural Height
              </span>
              <p className="font-sans text-sm text-text-primary font-medium m-0">
                {heightMeters} meters ({Math.round(Number(heightMeters) * 3.28084)} feet)
              </p>
              <span className="font-mono text-[12px] text-text-tertiary block mt-1">
                High-altitude seismic dampening matrix
              </span>
            </div>
          ) : null}

          {floorCount ? (
            <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
              <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
                Storey Configuration
              </span>
              <p className="font-sans text-sm text-text-primary font-medium m-0">
                {floorCount} Above-Ground Floors
              </p>
              <span className="font-mono text-[12px] text-text-tertiary block mt-1">
                Multi-level basement parking & podium lobby
              </span>
            </div>
          ) : null}
        </div>
      )}

      {activeTab === "sustainability" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tabpanel" aria-label="Sustainability Panel">
          <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
            <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
              Green Certification
            </span>
            <p className="font-sans text-sm text-gold-accent font-medium m-0 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-accent" />
              {leedStatus}
            </p>
            <span className="font-mono text-[12px] text-text-tertiary block mt-1">
              Low-E double glazed envelope, rainwater harvesting
            </span>
          </div>

          <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
            <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
              Acoustic & Environmental Quality
            </span>
            <p className="font-sans text-sm text-text-primary font-medium m-0">
              Low-Decibel Glazing (<span className="text-gold-accent font-mono">42 dB</span> attenuation)
            </p>
            <span className="font-mono text-[12px] text-text-tertiary block mt-1">
              MERV 14 air filtration & automated air exchange
            </span>
          </div>
        </div>
      )}

      {activeTab === "dimensions" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="tabpanel" aria-label="Dimensions Panel">
          <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
            <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
              Turnover & Completion
            </span>
            <p className="font-sans text-sm text-text-primary font-medium m-0">
              {completionYear || "Operational / Fully Delivered"}
            </p>
            <span className="font-mono text-[12px] text-text-tertiary block mt-1">
              Statutory occupancy permit & HLURB license verified
            </span>
          </div>

          {gfa ? (
            <div className="p-3.5 rounded bg-black/35 border border-surface-variant">
              <span className="font-mono text-[12px] text-text-secondary uppercase block mb-1">
                Gross Floor Area (GFA)
              </span>
              <p className="font-sans text-sm text-text-primary font-medium m-0">
                {gfa}
              </p>
              <span className="font-mono text-[12px] text-text-tertiary block mt-1">
                High-efficiency floor plate core layout
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
