"use client";

import React from "react";
import { getDistrictsSummary } from "@/lib/communitySignalsAdapter";
import "./district-intelligence-strip.css";

export default function DistrictIntelligenceStrip({
  selectedDistrict = null,
  onSelectDistrict = () => {},
  signals = [],
}) {
  const districts = React.useMemo(() => getDistrictsSummary(signals), [signals]);

  return (
    <nav className="dis-strip" aria-label="Choose an area">
      <div className="dis-header">
        <span className="dis-label">CHOOSE AN AREA</span>
      </div>

      <div className="dis-track" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={selectedDistrict === null}
          className={`dis-pill ${selectedDistrict === null ? "active" : ""}`}
          onClick={() => onSelectDistrict(null)}
        >
          <span className="dis-name">ALL DISTRICTS</span>
          <span className="dis-count">{signals.length}</span>
        </button>

        {districts.map((d) => {
          const isSelected = selectedDistrict === d.district;
          return (
            <button
              key={d.district}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`dis-pill ${isSelected ? "active" : ""}`}
              onClick={() => onSelectDistrict(isSelected ? null : d.district)}
            >
              <span className="dis-name">{d.district.toUpperCase()}</span>
              <span className="dis-trend">{d.trendLabel}</span>
              <span className="dis-badge">{d.count}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
