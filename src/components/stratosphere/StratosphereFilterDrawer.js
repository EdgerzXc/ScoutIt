"use client";

import React from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import {
  SIGNAL_TYPES,
  SIGNAL_TYPE_LABELS,
  DISTRICT_COORDS,
} from "@/lib/communitySignalsAdapter";
import "./stratosphere-filter-drawer.css";

const SPACE_TYPES = ["Office", "Retail", "Warehouse", "Mixed-Use", "Land"];

export default function StratosphereFilterDrawer({
  isOpen = false,
  onClose = () => {},
  filters = {},
  onChange = () => {},
  onReset = () => {},
}) {
  if (!isOpen) return null;

  const activeCount =
    (filters.signalType ? 1 : 0) +
    (filters.spaceType ? 1 : 0) +
    (filters.district ? 1 : 0);

  return (
    <div className="sfd-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Signal Filters">
      <div className="sfd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sfd-header">
          <div className="sfd-title-wrap">
            <Filter size={14} className="sfd-filter-icon" aria-hidden="true" />
            <h3 className="sfd-title">SPATIAL RADAR FILTERS</h3>
            {activeCount > 0 && <span className="sfd-count-badge">{activeCount} ACTIVE</span>}
          </div>
          <button type="button" className="sfd-close-btn" onClick={onClose} aria-label="Close filter drawer">
            <X size={16} />
          </button>
        </div>

        <div className="sfd-body">
          {/* Signal Category */}
          <div className="sfd-group">
            <label className="sfd-label">SIGNAL CATEGORY</label>
            <div className="sfd-chip-grid">
              <button
                type="button"
                className={`sfd-chip ${!filters.signalType ? "active" : ""}`}
                onClick={() => onChange({ ...filters, signalType: null })}
              >
                All Categories
              </button>
              {Object.entries(SIGNAL_TYPES).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  className={`sfd-chip ${filters.signalType === val ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, signalType: filters.signalType === val ? null : val })}
                >
                  {SIGNAL_TYPE_LABELS[val]}
                </button>
              ))}
            </div>
          </div>

          {/* Space Type */}
          <div className="sfd-group">
            <label className="sfd-label">SPACE TYPE</label>
            <div className="sfd-chip-grid">
              <button
                type="button"
                className={`sfd-chip ${!filters.spaceType ? "active" : ""}`}
                onClick={() => onChange({ ...filters, spaceType: null })}
              >
                All Space Types
              </button>
              {SPACE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`sfd-chip ${filters.spaceType === type ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, spaceType: filters.spaceType === type ? null : type })}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* District / Zone */}
          <div className="sfd-group">
            <label className="sfd-label">DISTRICT / ECONOMIC ZONE</label>
            <div className="sfd-chip-grid">
              <button
                type="button"
                className={`sfd-chip ${!filters.district ? "active" : ""}`}
                onClick={() => onChange({ ...filters, district: null })}
              >
                All Districts
              </button>
              {Object.keys(DISTRICT_COORDS).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`sfd-chip ${filters.district === d ? "active" : ""}`}
                  onClick={() => onChange({ ...filters, district: filters.district === d ? null : d })}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sfd-footer">
          <button type="button" className="sfd-reset-btn" onClick={onReset} disabled={activeCount === 0}>
            <RotateCcw size={12} aria-hidden="true" />
            <span>RESET FILTERS</span>
          </button>
          <button type="button" className="sfd-apply-btn" onClick={onClose}>
            <span>APPLY & VIEW</span>
          </button>
        </div>
      </div>
    </div>
  );
}
