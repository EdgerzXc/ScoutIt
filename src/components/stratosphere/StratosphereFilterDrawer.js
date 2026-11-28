"use client";

import { useLayoutEffect, useRef } from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import {
  SIGNAL_TYPES,
  SIGNAL_TYPE_LABELS,
  DISTRICT_COORDS,
} from "@/lib/communitySignalsAdapter";
import "./stratosphere-filter-drawer.css";

export const SPACE_TYPES = ["Office", "Retail", "Warehouse", "Mixed-Use", "Land"];

export default function StratosphereFilterDrawer({
  isOpen = false,
  onClose = () => {},
  filters = {},
  onChange = () => {},
  onReset = () => {},
  activeCount = 0,
  canReset,
  children,
}) {
  const dialogRef = useRef(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="sfd-overlay"
      aria-label="Signal filters"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sfd-panel">
        <div className="sfd-header">
          <div className="sfd-title-wrap">
            <Filter size={14} className="sfd-filter-icon" aria-hidden="true" />
            <h3 className="sfd-title">FILTERS</h3>
            {activeCount > 0 && <span className="sfd-count-badge">{activeCount} ACTIVE</span>}
          </div>
          <button type="button" className="sfd-close-btn" onClick={onClose} aria-label="Close filters">
            <X size={16} />
          </button>
        </div>

        <div className="sfd-body">
          {children}
          <label className="sfd-field sfd-mobile-field">
            <span className="sfd-label">Signal type</span>
            <select value={filters.signalType || ""} onChange={(e) => onChange("signalType", e.target.value || null)}>
              <option value="">All signal types</option>
              {Object.values(SIGNAL_TYPES).map((type) => <option key={type} value={type}>{SIGNAL_TYPE_LABELS[type]}</option>)}
            </select>
          </label>
          <label className="sfd-field sfd-mobile-field">
            <span className="sfd-label">Space type</span>
            <select value={filters.spaceType || ""} onChange={(e) => onChange("spaceType", e.target.value || null)}>
              <option value="">All space types</option>
              {SPACE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          {/* Signal Category */}
          <div className="sfd-group" role="group" aria-label="Signal type">
            <span className="sfd-label">SIGNAL TYPE</span>
            <div className="sfd-chip-grid">
              <button
                type="button"
                aria-pressed={!filters.signalType}
                className={`sfd-chip ${!filters.signalType ? "active" : ""}`}
                onClick={() => onChange("signalType", null)}
              >
                All Categories
              </button>
              {Object.entries(SIGNAL_TYPES).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filters.signalType === val}
                  className={`sfd-chip ${filters.signalType === val ? "active" : ""}`}
                  onClick={() => onChange("signalType", filters.signalType === val ? null : val)}
                >
                  {SIGNAL_TYPE_LABELS[val]}
                </button>
              ))}
            </div>
          </div>

          {/* Space Type */}
          <div className="sfd-group" role="group" aria-label="Space type">
            <span className="sfd-label">SPACE TYPE</span>
            <div className="sfd-chip-grid">
              <button
                type="button"
                aria-pressed={!filters.spaceType}
                className={`sfd-chip ${!filters.spaceType ? "active" : ""}`}
                onClick={() => onChange("spaceType", null)}
              >
                All Space Types
              </button>
              {SPACE_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={filters.spaceType === type}
                  className={`sfd-chip ${filters.spaceType === type ? "active" : ""}`}
                  onClick={() => onChange("spaceType", filters.spaceType === type ? null : type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* District / Zone */}
          <div className="sfd-group" role="group" aria-label="District">
            <span className="sfd-label">DISTRICT</span>
            <div className="sfd-chip-grid">
              <button
                type="button"
                aria-pressed={!filters.district}
                className={`sfd-chip ${!filters.district ? "active" : ""}`}
                onClick={() => onChange("district", null)}
              >
                All Districts
              </button>
              {Object.keys(DISTRICT_COORDS).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={filters.district === d}
                  className={`sfd-chip ${filters.district === d ? "active" : ""}`}
                  onClick={() => onChange("district", filters.district === d ? null : d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sfd-footer">
          <button type="button" className="sfd-reset-btn" onClick={onReset} disabled={!(canReset ?? activeCount)}>
            <RotateCcw size={12} aria-hidden="true" />
            <span>RESET</span>
          </button>
          <button type="button" className="sfd-apply-btn" onClick={onClose}>
            <span>DONE</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
