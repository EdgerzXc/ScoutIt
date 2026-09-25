"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { matchesJourneyStage } from "@/lib/layerTwoJourney";
import InfoTip from "@/components/ui/InfoTip";
import "./stratosphere-terminal.css";

export default function StratosphereTerminal({
  initialSignals = COMMUNITY_SIGNALS,
  initialViewMode = "SPATIAL", // 'SPATIAL' | 'SIGNALS'
  stageFilter = "all",
  onClearStage = () => {},
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
  // Source lens: COMMUNITY (member posts + samples) vs SCOUTIT INTEL
  // (sourced building updates bridged from articles). Radar stays one feed;
  // the lens only narrows what the eye lands on.
  const [sourceLens, setSourceLens] = useState("all");

  useEffect(() => {
    if (window.matchMedia("(max-width: 680px)").matches) setViewMode("SIGNALS");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const place = params.get("place");
    if (place) setSelectedDistrict(place);
  }, []);
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("signal");
    if (wanted) setSelectedSignal(initialSignals.find((signal) => signal.id === wanted) || null);
  }, [initialSignals]);

  const stageSignals = useMemo(
    () => initialSignals.filter((signal) => matchesJourneyStage(signal, stageFilter)),
    [initialSignals, stageFilter]
  );
  useEffect(() => {
    if (!selectedSignal || stageSignals.some((signal) => signal.id === selectedSignal.id)) return;
    setSelectedSignal(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("signal");
    window.history.replaceState(null, "", url);
  }, [selectedSignal, stageSignals]);

  // Sync selectedDistrict into filters or vice versa
  const activeDistrict = selectedDistrict || filters.district;

  // Filtered signal dataset
  const filteredSignals = useMemo(() => {
    const base = filterSignals(stageSignals, {
      query: searchQuery,
      signalType: filters.signalType,
      spaceType: filters.spaceType,
      district: activeDistrict,
    });
    if (sourceLens === "community") {
      return base.filter((s) => !(typeof s.id === "string" && s.id.startsWith("pipeline-")));
    }
    if (sourceLens === "intel") {
      return base.filter((s) => typeof s.id === "string" && s.id.startsWith("pipeline-"));
    }
    return base;
  }, [stageSignals, searchQuery, filters, activeDistrict, sourceLens]);

  const activeFilterCount =
    (filters.signalType ? 1 : 0) +
    (filters.spaceType ? 1 : 0) +
    (activeDistrict ? 1 : 0);

  const handleSelectDistrict = useCallback((dist) => {
    setSelectedDistrict(dist);
    setFilters((prev) => ({ ...prev, district: dist }));
    const url = new URL(window.location.href);
    if (dist) url.searchParams.set("place", dist);
    else url.searchParams.delete("place");
    window.history.replaceState(null, "", url);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ signalType: null, spaceType: null, district: null });
    setSelectedDistrict(null);
    setSearchQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("place");
    window.history.replaceState(null, "", url);
  }, []);

  const handleSelectSignal = useCallback((signal) => {
    setSelectedSignal(signal);
    const url = new URL(window.location.href);
    if (signal?.id) url.searchParams.set("signal", signal.id);
    else url.searchParams.delete("signal");
    window.history.replaceState(null, "", url);
  }, []);

  const handleHoverSignal = useCallback((id) => {
    setHoveredSignalId(id);
  }, []);

  const handleOpenConnect = useCallback((signal) => {
    setConnectModalSignal(signal);
  }, []);

  return (
    <div className={`st-terminal${viewMode === "SIGNALS" ? " st-terminal--feed" : ""}`} role="region" aria-label="Stratosphere Spatial Radar Terminal">
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
        signals={stageSignals}
      />

      {/* ── MAIN WORKSPACE ── */}
      <div className={`st-workspace ${viewMode === "SPATIAL" ? "st-split-layout" : "st-feed-layout"}`}>
        {/* SPATIAL RADAR CANVAS (64% in Split mode) */}
        {viewMode === "SPATIAL" && (
          <section className="st-radar-pane" aria-label="3D Metro Manila Spatial Signal Radar">
            <SpatialSignalRadar
              allSignals={stageSignals}
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
            <div className="st-source-lens" role="group" aria-label="Signal source">
              {[["all", "ALL"], ["community", "COMMUNITY"], ["intel", "SCOUTIT INTEL"]].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={sourceLens === key}
                  className={`st-source-chip${sourceLens === key ? " is-active" : ""}`}
                  onClick={() => setSourceLens(key)}
                >
                  {label}
                </button>
              ))}
              <InfoTip tipId="signalSources" label="About signal sources" />
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
                <h4 className="st-empty-title">No updates for this selection</h4>
                <p className="st-empty-desc">
                  {stageFilter === "all" ? "Try another area or clear your search and filters." : "No updates are confirmed at this stage here yet. See all updates or choose another stage."}
                </p>
                <button type="button" className="st-empty-reset-btn" onClick={() => { handleResetFilters(); if (stageFilter !== "all") onClearStage(); }}>
                  {stageFilter === "all" ? "CLEAR SEARCH AND FILTERS" : "SEE ALL UPDATES"}
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
                  returnStage={stageFilter}
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
          const url = new URL(window.location.href);
          if (newFilters.district) url.searchParams.set("place", newFilters.district);
          else url.searchParams.delete("place");
          window.history.replaceState(null, "", url);
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
