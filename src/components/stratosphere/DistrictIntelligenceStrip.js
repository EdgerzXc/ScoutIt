"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { getDistrictsSummary } from "@/lib/communitySignalsAdapter";
import "./district-intelligence-strip.css";

export default function DistrictIntelligenceStrip({
  selectedDistrict = null,
  onSelectDistrict = () => {},
  signals = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const districts = React.useMemo(() => getDistrictsSummary(signals), [signals]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeDistrictObj = districts.find((d) => d.district === selectedDistrict);
  const activeCount = selectedDistrict ? activeDistrictObj?.count || 0 : signals.length;
  const activeLabel = selectedDistrict ? selectedDistrict.toUpperCase() : "ALL DISTRICTS";

  return (
    <div className="dis-dropdown-wrap" ref={containerRef} aria-label="District filter selector">
      <button
        type="button"
        className={`dis-dropdown-trigger ${selectedDistrict ? "has-selection" : ""} ${isOpen ? "is-open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Filter by district. Currently: ${activeLabel} (${activeCount})`}
      >
        <MapPin size={13} className="dis-pin-icon" aria-hidden="true" />
        <span className="dis-trigger-label">AREA:</span>
        <span className="dis-name">{activeLabel}</span>
        <span className="dis-badge">{activeCount}</span>
        <ChevronDown size={12} className={`dis-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="dis-dropdown-menu" role="listbox" aria-label="Choose an area">
          <div className="dis-menu-header">
            <span>CHOOSE AN AREA</span>
            <span className="dis-header-count">{districts.length} DISTRICTS</span>
          </div>

          <button
            type="button"
            role="option"
            aria-selected={selectedDistrict === null}
            className={`dis-menu-item ${selectedDistrict === null ? "active" : ""}`}
            onClick={() => {
              onSelectDistrict(null);
              setIsOpen(false);
            }}
          >
            <div className="dis-item-content">
              <span className="dis-name">ALL DISTRICTS</span>
              <span className="dis-item-sub">Metro Manila wide coverage</span>
            </div>
            <span className="dis-badge">{signals.length}</span>
            {selectedDistrict === null && <Check size={13} className="dis-check" aria-hidden="true" />}
          </button>

          <div className="dis-menu-divider" role="separator" />

          <div className="dis-menu-list">
            {districts.map((d) => {
              const isSelected = selectedDistrict === d.district;
              return (
                <button
                  key={d.district}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`dis-menu-item ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    onSelectDistrict(isSelected ? null : d.district);
                    setIsOpen(false);
                  }}
                  aria-label={`${d.district}: ${d.count} updates`}
                >
                  <div className="dis-item-content">
                    <span className="dis-name">{d.district.toUpperCase()}</span>
                  </div>
                  <span className="dis-badge">{d.count}</span>
                  {isSelected && <Check size={13} className="dis-check" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
