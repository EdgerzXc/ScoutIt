"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, Filter, Layers, ListFilter, Compass, Radio, X } from "lucide-react";
import SpatialSignalRadar from "./SpatialSignalRadar";
import SignalDossierCard from "./SignalDossierCard";
import DistrictIntelligenceStrip from "./DistrictIntelligenceStrip";
import StratosphereFilterDrawer from "./StratosphereFilterDrawer";
import CommunityConnectModal from "./CommunityConnectModal";
import {
  COMMUNITY_SIGNALS,
  filterSignals,
} from "@/lib/communitySignalsAdapter";
import "./stratosphere-terminal.css";

export default function StratosphereTerminal({
  initialSignals = COMMUNITY_SIGNALS,
  initialViewMode = "SPATIAL", // 'SPATIAL' | 'SIGNALS'
}) {
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [hoveredSignalId, setHoveredSignalId] = useState(null);
  const [filters, setFilters] = useState({
    signalType: null,
    spaceType: null,
    district: null,
  });
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [connectModalSignal, setConnectModalSignal] = useState(null);

  // Sync selectedDistrict into filters or vice versa
  const activeDistrict = selectedDistrict || filters.district;

  // Filtered signal dataset
  const filteredSignals = useMemo(() => {
    return filterSignals(initialSignals, {
      query: searchQuery,
      signalType: filters.signalType,
      spaceType: filters.spaceType,
      district: activeDistrict,
    });
  }, [initialSignals, searchQuery, filters, activeDistrict]);

  const activeFilterCount =
    (filters.signalType ? 1 : 0) +
    (filters.spaceType ? 1 : 0) +
    (activeDistrict ? 1 : 0);

  const handleSelectDistrict = useCallback((dist) => {
    setSelectedDistrict(dist);
    setFilters((prev) => ({ ...prev, district: dist }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ signalType: null, spaceType: null, district: null });
    setSelectedDistrict(null);
    setSearchQuery("");
  }, []);

  const handleSelectSignal = useCallback((signal) => {
    setSelectedSignal(signal);
  }, []);

  const handleHoverSignal = useCallback((id) => {
    setHoveredSignalId(id);
  }, []);

  const handleOpenConnect = useCallback((signal) => {
    setConnectModalSignal(signal);
  }, []);

  return (
    <div className="st-terminal" role="region" aria-label="Stratosphere Spatial Radar Terminal">
      {/* ── TOP CONTROL BAR ── */}
      <header className="st-control-bar">
        <div className="st-search-cluster">
          <div className="st-search-wrap">
            <Search size={14} className="st-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="st-search-input"
              placeholder="Search demand, space type, specs, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search community signals"
            />
            {searchQuery && (
              <button
                type="button"
                className="st-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            className={`st-filter-btn ${activeFilterCount > 0 ? "active" : ""}`}
            onClick={() => setFilterDrawerOpen(true)}
            aria-label={`Open filters. ${activeFilterCount} active filters.`}
          >
            <Filter size={13} aria-hidden="true" />
            <span>FILTERS</span>
            {activeFilterCount > 0 && <span className="st-filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Mode Switcher: SPATIAL (Split-Screen 3D) vs SIGNALS (Minimalist Feed) */}
        <div className="st-mode-cluster" role="radiogroup" aria-label="Stratosphere Viewing Mode">
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "SPATIAL"}
            className={`st-mode-btn ${viewMode === "SPATIAL" ? "active" : ""}`}
            onClick={() => setViewMode("SPATIAL")}
          >
            <Compass size={13} aria-hidden="true" />
            <span>SPATIAL RADAR</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "SIGNALS"}
            className={`st-mode-btn ${viewMode === "SIGNALS" ? "active" : ""}`}
            onClick={() => setViewMode("SIGNALS")}
          >
            <ListFilter size={13} aria-hidden="true" />
            <span>SIGNALS DOSSIER</span>
          </button>
        </div>
      </header>

      {/* ── LIVE DISTRICT INTELLIGENCE STRIP ── */}
      <DistrictIntelligenceStrip
        selectedDistrict={activeDistrict}
        onSelectDistrict={handleSelectDistrict}
        signals={initialSignals}
      />

      {/* ── MAIN WORKSPACE ── */}
      <div className={`st-workspace ${viewMode === "SPATIAL" ? "st-split-layout" : "st-feed-layout"}`}>
        {/* SPATIAL RADAR CANVAS (64% in Split mode) */}
        {viewMode === "SPATIAL" && (
          <section className="st-radar-pane" aria-label="3D Metro Manila Spatial Signal Radar">
            <SpatialSignalRadar
              allSignals={initialSignals}
              filteredSignals={filteredSignals}
              selectedSignal={selectedSignal}
              hoveredSignalId={hoveredSignalId}
              selectedDistrict={activeDistrict}
              onSelectSignal={handleSelectSignal}
              onHoverSignal={handleHoverSignal}
              onSelectDistrict={handleSelectDistrict}
            />
          </section>
        )}

        {/* SIGNAL DOSSIER FEED (36% in Split mode, Centered in Feed mode) */}
        <section
          className="st-dossier-pane"
          aria-label={viewMode === "SPATIAL" ? "Signal Dossiers for active sector" : "All Community Signal Dossiers"}
        >
          {/* Telemetry Header */}
          <div className="st-dossier-header">
            <div className="st-telemetry-tag">
              <Radio size={11} className="st-live-icon" aria-hidden="true" />
              <span>
                {filteredSignals.length} {filteredSignals.length === 1 ? "SIGNAL" : "SIGNALS"} MATCHING
              </span>
            </div>
            {activeDistrict && (
              <span className="st-district-indicator">
                DISTRICT // {activeDistrict.toUpperCase()}
              </span>
            )}
          </div>

          {/* Dossier Cards List */}
          <div className="st-dossier-scroll">
            {filteredSignals.length === 0 ? (
              <div className="st-empty-state">
                <Compass size={28} className="st-empty-icon" aria-hidden="true" />
                <h4 className="st-empty-title">Zero Signals in Sector</h4>
                <p className="st-empty-desc">
                  No active community signals match your query parameters. Try broadening your search or resetting district filters.
                </p>
                <button type="button" className="st-empty-reset-btn" onClick={handleResetFilters}>
                  RESET ALL FILTERS
                </button>
              </div>
            ) : (
              filteredSignals.map((signal) => (
                <SignalDossierCard
                  key={signal.id}
                  signal={signal}
                  isActive={selectedSignal?.id === signal.id}
                  isHovered={hoveredSignalId === signal.id}
                  onSelect={handleSelectSignal}
                  onHover={handleHoverSignal}
                  onConnect={handleOpenConnect}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── FILTER DRAWER MODAL ── */}
      <StratosphereFilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onChange={(newFilters) => {
          setFilters(newFilters);
          setSelectedDistrict(newFilters.district);
        }}
        onReset={handleResetFilters}
      />

      {/* ── CONNECT PROPOSAL MODAL ── */}
      <CommunityConnectModal
        signal={connectModalSignal}
        isOpen={Boolean(connectModalSignal)}
        onClose={() => setConnectModalSignal(null)}
      />
    </div>
  );
}
