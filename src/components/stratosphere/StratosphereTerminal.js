"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Filter, Layers, ListFilter, Compass, Radio, X, Zap, Building2 } from "lucide-react";
import SpatialSignalRadar from "./SpatialSignalRadar";
import SignalDossierCard from "./SignalDossierCard";
import DistrictIntelligenceStrip from "./DistrictIntelligenceStrip";
import StratosphereFilterDrawer from "./StratosphereFilterDrawer";
import CommunityConnectModal from "./CommunityConnectModal";
import {
  COMMUNITY_SIGNALS,
  filterSignals,
  MARKET_ROLES,
  MARKET_ROLE_LABELS,
  MARKET_ROLE_DESCRIPTIONS,
  getSignalMarketRole,
} from "@/lib/communitySignalsAdapter";
import { matchesJourneyStage } from "@/lib/layerTwoJourney";
import InfoTip from "@/components/ui/InfoTip";
import "./stratosphere-terminal.css";

export const SIGNALS_PAGE_SIZE = 20;

export default function StratosphereTerminal({
  initialSignals = COMMUNITY_SIGNALS,
  initialViewMode = "SPATIAL", // 'SPATIAL' | 'SIGNALS'
  stageFilter = "all",
  onClearStage = () => {},
  onSignalClosed = () => {},
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
  // Two-Sided Market taxonomy: ALL vs DEMAND (Seekers) vs SUPPLY (Spaces Available) vs INTEL
  const [marketRole, setMarketRole] = useState("all");
  // 3D Radar Beacon Color Signal filter (gold vs green vs purple vs red vs cyan)
  const [colorKey, setColorKey] = useState(null);
  const [visibleSignalCount, setVisibleSignalCount] = useState(SIGNALS_PAGE_SIZE);

  useEffect(() => {
    if (window.matchMedia("(max-width: 680px)").matches) setViewMode("SIGNALS");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const place = params.get("place");
    if (place) setSelectedDistrict(place);
    const role = params.get("role");
    if (role && Object.values(MARKET_ROLES).includes(role)) {
      setMarketRole(role);
    }
    const color = params.get("color");
    if (color && ["gold", "green", "purple", "red", "cyan"].includes(color)) {
      setColorKey(color);
    }
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

  // Telemetry counts across two-sided market taxonomy
  const roleCounts = useMemo(() => {
    const base = filterSignals(stageSignals, {
      query: searchQuery,
      signalType: filters.signalType,
      spaceType: filters.spaceType,
      district: activeDistrict,
      marketRole: "all",
    });
    const counts = {
      [MARKET_ROLES.ALL]: base.length,
      [MARKET_ROLES.DEMAND]: 0,
      [MARKET_ROLES.SUPPLY]: 0,
      [MARKET_ROLES.INTEL]: 0,
    };
    for (const s of base) {
      const r = getSignalMarketRole(s);
      if (counts[r] !== undefined) counts[r]++;
    }
    return counts;
  }, [stageSignals, searchQuery, filters, activeDistrict]);

  // Filtered signal dataset
  const filteredSignals = useMemo(() => {
    return filterSignals(stageSignals, {
      query: searchQuery,
      signalType: filters.signalType,
      spaceType: filters.spaceType,
      district: activeDistrict,
      marketRole,
      colorKey,
    });
  }, [stageSignals, searchQuery, filters, activeDistrict, marketRole, colorKey]);

  const visibleSignals = useMemo(() => {
    const sliced = filteredSignals.slice(0, visibleSignalCount);
    if (selectedSignal && !sliced.some((s) => s.id === selectedSignal.id)) {
      const match = filteredSignals.find((s) => s.id === selectedSignal.id);
      if (match) return [match, ...sliced];
    }
    return sliced;
  }, [filteredSignals, visibleSignalCount, selectedSignal]);

  const activeFilterCount =
    (filters.signalType ? 1 : 0) +
    (filters.spaceType ? 1 : 0) +
    (activeDistrict ? 1 : 0) +
    (colorKey ? 1 : 0);

  const handleSelectDistrict = useCallback((dist) => {
    setSelectedDistrict(dist);
    setFilters((prev) => ({ ...prev, district: dist }));
    const url = new URL(window.location.href);
    if (dist) url.searchParams.set("place", dist);
    else url.searchParams.delete("place");
    window.history.replaceState(null, "", url);
  }, []);

  const handleSelectMarketRole = useCallback((role) => {
    setMarketRole(role);
    const url = new URL(window.location.href);
    if (role && role !== "all") {
      url.searchParams.set("role", role);
    } else {
      url.searchParams.delete("role");
    }
    window.history.replaceState(null, "", url);
  }, []);

  const handleSelectColorKey = useCallback((key) => {
    setColorKey(key);
    const url = new URL(window.location.href);
    if (key && key !== "all") {
      url.searchParams.set("color", key);
    } else {
      url.searchParams.delete("color");
    }
    window.history.replaceState(null, "", url);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({ signalType: null, spaceType: null, district: null });
    setSelectedDistrict(null);
    setSearchQuery("");
    setMarketRole("all");
    setColorKey(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("place");
    url.searchParams.delete("role");
    url.searchParams.delete("color");
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
              activeColorKey={colorKey}
              onSelectColorKey={handleSelectColorKey}
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
          {/* Telemetry Header & Two-Sided Market Switcher */}
          <div className="st-dossier-header">
            <div className="st-telemetry-row">
              <div className="st-telemetry-tag">
                <Radio size={11} className="st-live-icon" aria-hidden="true" />
                <span>
                  {filteredSignals.length} {filteredSignals.length === 1 ? "SIGNAL" : "SIGNALS"} MATCHING
                </span>
              </div>
              <div className="st-telemetry-meta">
                {activeDistrict && (
                  <span className="st-district-indicator">
                    DISTRICT · {activeDistrict.toUpperCase()}
                  </span>
                )}
                {colorKey && (
                  <button
                    type="button"
                    className="st-color-filter-badge"
                    onClick={() => handleSelectColorKey(null)}
                    title={`Clear ${colorKey} filter`}
                    aria-label={`Clear ${colorKey} filter`}
                  >
                    <span
                      className="st-color-filter-dot"
                      style={{
                        backgroundColor:
                          colorKey === "gold" ? "var(--accent)" :
                          colorKey === "green" ? "var(--green)" :
                          colorKey === "purple" ? "var(--amethyst)" :
                          colorKey === "red" ? "var(--yellow)" : "var(--intel-cyan)"
                      }}
                      aria-hidden="true"
                    />
                    <span>{colorKey.toUpperCase()}</span>
                    <X size={10} aria-hidden="true" />
                  </button>
                )}
                <InfoTip tipId="signalSources" label="About signal sources" />
              </div>
            </div>

            {/* Two-Sided Market Intent Switcher */}
            <div className="st-market-tabs" role="tablist" aria-label="Market Intent Taxonomy">
              {[
                { key: MARKET_ROLES.ALL, label: "ALL", shortLabel: "ALL", Icon: null, classMod: "" },
                { key: MARKET_ROLES.DEMAND, label: "SEEKERS · DEMAND", shortLabel: "DEMAND", Icon: Zap, classMod: "tab-demand" },
                { key: MARKET_ROLES.SUPPLY, label: "SPACES AVAILABLE", shortLabel: "SUPPLY", Icon: Building2, classMod: "tab-supply" },
                { key: MARKET_ROLES.INTEL, label: "MARKET INTEL", shortLabel: "INTEL", Icon: Radio, classMod: "tab-intel" },
              ].map(({ key, label, shortLabel, Icon, classMod }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={marketRole === key}
                  className={`st-market-tab ${classMod} ${marketRole === key ? "is-active" : ""}`}
                  onClick={() => handleSelectMarketRole(key)}
                >
                  {Icon && <Icon size={12} className="st-tab-icon" aria-hidden="true" />}
                  <span className="st-market-tab-label">{label}</span>
                  <span className="st-market-tab-label-short">{shortLabel}</span>
                  <span className="st-market-tab-count">{roleCounts[key] || 0}</span>
                </button>
              ))}
            </div>

            <p className="st-market-role-desc">
              {MARKET_ROLE_DESCRIPTIONS[marketRole] || MARKET_ROLE_DESCRIPTIONS[MARKET_ROLES.ALL]}
            </p>
          </div>

          {/* Dossier Cards List */}
          <div className="st-dossier-scroll">
            {filteredSignals.length === 0 ? (
              <div className="st-empty-state">
                <Compass size={28} className="st-empty-icon" aria-hidden="true" />
                <h4 className="st-empty-title">No signals match this view</h4>
                <p className="st-empty-desc">
                  {marketRole !== "all"
                    ? `No active ${MARKET_ROLE_LABELS[marketRole]?.toLowerCase() || "signals"} found for this filter. Switch to All Signals or clear district search.`
                    : stageFilter === "all"
                    ? "Try another area or clear your search and filters."
                    : "No updates are confirmed at this stage here yet. See all updates or choose another stage."}
                </p>
                <button
                  type="button"
                  className="st-empty-reset-btn"
                  onClick={() => {
                    handleResetFilters();
                    if (stageFilter !== "all") onClearStage();
                  }}
                >
                  {marketRole !== "all" ? "VIEW ALL SIGNALS" : stageFilter === "all" ? "CLEAR SEARCH AND FILTERS" : "SEE ALL UPDATES"}
                </button>
              </div>
            ) : (
              <>
                {visibleSignals.map((signal) => (
                  <SignalDossierCard
                    key={signal.id}
                    signal={signal}
                    isActive={selectedSignal?.id === signal.id}
                    isHovered={hoveredSignalId === signal.id}
                    onSelect={handleSelectSignal}
                    onHover={handleHoverSignal}
                    onConnect={handleOpenConnect}
                    onClosed={onSignalClosed}
                    returnStage={stageFilter}
                  />
                ))}
                {filteredSignals.length > visibleSignalCount && (
                  <button
                    type="button"
                    className="st-empty-reset-btn"
                    onClick={() => setVisibleSignalCount((c) => c + SIGNALS_PAGE_SIZE)}
                  >
                    LOAD MORE SIGNALS ({filteredSignals.length - visibleSignalCount} REMAINING)
                  </button>
                )}
              </>
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
