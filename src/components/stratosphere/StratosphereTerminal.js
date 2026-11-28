"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, Filter, Layers, ListFilter, Compass, Radio, X, Zap, Building2, ChevronDown, Check } from "lucide-react";
import SpatialSignalRadar from "./SpatialSignalRadar";
import SignalDossierCard from "./SignalDossierCard";
import DistrictIntelligenceStrip from "./DistrictIntelligenceStrip";
import StratosphereFilterDrawer, { SPACE_TYPES } from "./StratosphereFilterDrawer";
import CommunityConnectModal from "./CommunityConnectModal";
import {
  COMMUNITY_SIGNALS,
  filterSignals,
  MARKET_ROLES,
  MARKET_ROLE_DESCRIPTIONS,
  SIGNAL_TYPE_LABELS,
  getDistrictsSummary,
  getSignalMarketRole,
} from "@/lib/communitySignalsAdapter";
import { ALL_JOURNEY_STAGES, matchesJourneyStage } from "@/lib/layerTwoJourney";
import { getPersistedWorkspaceRole, setPersistedWorkspaceRole } from "@/lib/dashboardModes";
import { stratosphereFeedHref } from "@/lib/stratosphereFeed";
import {
  defaultMarketRoleForLens,
  getAvailableStratosphereLenses,
  resolveStratosphereDefaultLens,
} from "@/lib/stratosphereLenses";
import InfoTip from "@/components/ui/InfoTip";
import "./stratosphere-terminal.css";

export const SIGNALS_PAGE_SIZE = 20;

const INTELLIGENCE_STREAMS = [
  { key: "all", label: "ALL INTELLIGENCE", desc: "Combined pipeline and trend coverage" },
  { key: "building", label: "UNDER CONSTRUCTION", desc: "Active structural build-outs" },
  { key: "demand", label: "MARKET DEMAND", desc: "Absorption & tenant requirements" },
  { key: "zoning", label: "POLICY & ZONING", desc: "Mandates & green standards" },
  { key: "all-buildings", label: "ALL BUILDINGS", desc: "All active development projects" },
  { key: "all-trends", label: "ALL TRENDS", desc: "All macro & spatial dynamics" },
];

const MARKET_TABS = [
  { key: MARKET_ROLES.ALL, label: "ALL", shortLabel: "ALL" },
  { key: MARKET_ROLES.DEMAND, label: "SEEKERS · DEMAND", shortLabel: "DEMAND", Icon: Zap, classMod: "tab-demand" },
  { key: MARKET_ROLES.SUPPLY, label: "SPACES AVAILABLE", shortLabel: "SPACES", Icon: Building2, classMod: "tab-supply" },
  { key: MARKET_ROLES.INTEL, label: "MARKET INTEL", shortLabel: "INTEL", Icon: Radio, classMod: "tab-intel" },
];

const mobileQuery = "(max-width: 768px)";

function subscribeToMobile(callback) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

const getIsMobile = () => window.matchMedia(mobileQuery).matches;
const getServerIsMobile = () => false;

function writeRadarParams(changes, push = false) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
}

export default function StratosphereTerminal({
  initialSignals = COMMUNITY_SIGNALS,
  userProfile = null,
  initialViewMode = "SPATIAL", // 'SPATIAL' | 'SIGNALS'
  stageFilter = "all",
  onSelectStage = () => {},
  onClearStage = () => {},
  onSignalClosed = () => {},
  resultsOnly = false,
  feedState = "ready",
  onRetryFeed,
}) {
  const params = useSearchParams();
  const isMobile = useSyncExternalStore(subscribeToMobile, getIsMobile, getServerIsMobile);
  const mode = params.get("mode");
  const viewMode = resultsOnly ? "SIGNALS" : mode === "map" ? "SPATIAL" : mode === "list" || isMobile ? "SIGNALS" : initialViewMode;
  const [searchQuery, setSearchQuery] = useState(() => params.get("signalQ") || "");
  const activeDistrict = params.get("place") || null;
  const requestedColor = params.get("color");
  const colorKey = ["gold", "green", "purple", "red", "cyan"].includes(requestedColor) ? requestedColor : null;
  const requestedType = params.get("signalType");
  const signalType = Object.hasOwn(SIGNAL_TYPE_LABELS, requestedType) ? requestedType : null;
  const requestedSpace = params.get("spaceType");
  const spaceType = SPACE_TYPES.includes(requestedSpace) ? requestedSpace : null;
  const wantedSignal = params.get("signal");
  const selectedSignal = useMemo(
    () => wantedSignal ? initialSignals.find((signal) => signal.id === wantedSignal) || null : null,
    [initialSignals, wantedSignal]
  );
  const [hoveredSignalId, setHoveredSignalId] = useState(null);
  const [streamOpen, setStreamOpen] = useState(false);
  const streamDropdownRef = useRef(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [connectModalSignal, setConnectModalSignal] = useState(null);
  // Two-Sided Market taxonomy: ALL vs DEMAND (Seekers) vs SUPPLY (Spaces Available) vs INTEL
  const [marketRole, setMarketRole] = useState("all");
  const [activeLens, setActiveLens] = useState("all");
  const userPickedRoleRef = useRef(false);
  const [visibleSignalCount, setVisibleSignalCount] = useState(SIGNALS_PAGE_SIZE);
  const showCounts = feedState === "ready";

  useEffect(() => {
    function restoreRole() {
      const urlRole = new URLSearchParams(window.location.search).get("role") || "";
      const resolved = resolveStratosphereDefaultLens({
        urlRole,
        persistedRole: getPersistedWorkspaceRole(),
        profile: userProfile,
      });
      setActiveLens(resolved.lensId);
      setMarketRole(resolved.marketRole);
    }
    function restoreRadar() {
      setSearchQuery(new URLSearchParams(window.location.search).get("signalQ") || "");
      restoreRole();
    }
    if (!userPickedRoleRef.current) restoreRole();
    window.addEventListener("popstate", restoreRadar);
    return () => window.removeEventListener("popstate", restoreRadar);
  }, [userProfile]);

  const availableLenses = useMemo(() => getAvailableStratosphereLenses(userProfile), [userProfile]);

  const stageSignals = useMemo(
    () => initialSignals.filter((signal) => matchesJourneyStage(signal, stageFilter)),
    [initialSignals, stageFilter]
  );
  useEffect(() => {
    if (!selectedSignal || stageSignals.some((signal) => signal.id === selectedSignal.id)) return;
    writeRadarParams({ signal: null });
  }, [selectedSignal, stageSignals]);

  // Telemetry counts across two-sided market taxonomy
  const roleCounts = useMemo(() => {
    const base = filterSignals(stageSignals, {
      query: searchQuery,
      signalType,
      spaceType,
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
  }, [stageSignals, searchQuery, signalType, spaceType, activeDistrict]);

  // Filtered signal dataset
  const filteredSignals = useMemo(() => {
    return filterSignals(stageSignals, {
      query: searchQuery,
      signalType,
      spaceType,
      district: activeDistrict,
      marketRole,
      colorKey,
    });
  }, [stageSignals, searchQuery, signalType, spaceType, activeDistrict, marketRole, colorKey]);

  const visibleSignals = useMemo(() => {
    const sliced = filteredSignals.slice(0, visibleSignalCount);
    if (selectedSignal && !sliced.some((s) => s.id === selectedSignal.id)) {
      const match = filteredSignals.find((s) => s.id === selectedSignal.id);
      if (match) return [match, ...sliced];
    }
    return sliced;
  }, [filteredSignals, visibleSignalCount, selectedSignal]);

  const activeFilterCount =
    (signalType ? 1 : 0) +
    (spaceType ? 1 : 0) +
    (activeDistrict ? 1 : 0) +
    (colorKey ? 1 : 0);
  const mobileFilterCount = activeFilterCount + (stageFilter !== "all" ? 1 : 0);
  const shownFilterCount = isMobile ? mobileFilterCount : activeFilterCount;

  function chooseMode(next) {
    if (viewMode === next) return;
    writeRadarParams({ mode: next === "SPATIAL" ? "map" : "list" }, true);
  }

  function searchSignals(value) {
    setSearchQuery(value);
    writeRadarParams({ signalQ: value });
  }

  const handleSelectDistrict = useCallback((dist) => {
    writeRadarParams({ place: dist });
  }, []);

  const handleSelectMarketRole = useCallback((role) => {
    userPickedRoleRef.current = true;
    setMarketRole(role);
    if (role === MARKET_ROLES.ALL) setActiveLens("all");
    writeRadarParams({ role });
  }, []);

  const handleSelectLens = useCallback((lensId) => {
    userPickedRoleRef.current = true;
    setActiveLens(lensId);
    const nextMarketRole = defaultMarketRoleForLens(lensId);
    setMarketRole(nextMarketRole);
    if (lensId && lensId !== "all") {
      setPersistedWorkspaceRole(lensId);
    }
    writeRadarParams({ role: lensId });
  }, []);

  const handleSelectColorKey = useCallback((key) => {
    writeRadarParams({ color: key === "all" ? null : key });
  }, []);

  const handleResetFilters = useCallback(() => {
    userPickedRoleRef.current = true;
    setActiveLens("all");
    setMarketRole("all");
    setSearchQuery("");
    writeRadarParams({ place: null, role: "all", color: null, signalQ: null, signalType: null, spaceType: null });
  }, []);

  const handleSelectSignal = useCallback((signal) => {
    writeRadarParams({ signal: signal?.id });
  }, []);

  const handleHoverSignal = useCallback((id) => {
    setHoveredSignalId(id);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (streamDropdownRef.current && !streamDropdownRef.current.contains(event.target)) {
        setStreamOpen(false);
      }
    }
    if (streamOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [streamOpen]);

  const drawerStage = stageFilter === "buildings" || stageFilter === "trends" ? `all-${stageFilter}` : stageFilter;
  const currentStream = INTELLIGENCE_STREAMS.find((s) => s.key === drawerStage)
    || ALL_JOURNEY_STAGES.find((s) => s.key === drawerStage)
    || INTELLIGENCE_STREAMS[0];
  const districts = filterDrawerOpen && isMobile ? getDistrictsSummary(stageSignals) : [];

  const handleOpenConnect = useCallback((signal) => {
    setConnectModalSignal(signal);
  }, []);

  return (
    <div className={`st-terminal${viewMode === "SIGNALS" ? " st-terminal--feed" : ""}${resultsOnly ? " st-terminal--results" : ""}`} role="region" aria-label={resultsOnly ? "Browse signals" : "Stratosphere Spatial Radar Terminal"}>
      {/* ── TOP CONTROL BAR ── */}
      <header className="st-control-bar">
        <div className="st-search-cluster">
          <div className="st-search-wrap">
            <Search size={14} className="st-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="st-search-input"
              placeholder="Search signals"
              value={searchQuery}
              onChange={(e) => searchSignals(e.target.value)}
              aria-label="Search signals"
            />
            {searchQuery && (
              <button
                type="button"
                className="st-search-clear"
                onClick={() => searchSignals("")}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="st-hud-selectors">
            {/* Integrated Area / District Dropdown */}
            <DistrictIntelligenceStrip
              selectedDistrict={activeDistrict}
              onSelectDistrict={handleSelectDistrict}
              signals={stageSignals}
            />

            {/* Integrated Intelligence Stream Dropdown */}
            <div className="st-stream-wrap" ref={streamDropdownRef}>
              <button
                type="button"
                className={`st-stream-trigger ${stageFilter !== "all" ? "has-selection" : ""} ${streamOpen ? "is-open" : ""}`}
                onClick={() => setStreamOpen((prev) => !prev)}
                aria-expanded={streamOpen}
                aria-haspopup="listbox"
                aria-label={`Filter by intelligence stream. Currently: ${currentStream.label}`}
              >
                <Layers size={13} className="st-stream-icon" aria-hidden="true" />
                <span className="st-stream-prefix">STREAM:</span>
                <span className="st-stream-name">{currentStream.label}</span>
                <ChevronDown size={12} className={`st-stream-chevron ${streamOpen ? "is-open" : ""}`} aria-hidden="true" />
              </button>

              {streamOpen && (
                <div className="st-stream-menu" role="listbox" aria-label="Choose intelligence stream">
                  <div className="st-stream-header">
                    <span>INTELLIGENCE STREAM</span>
                  </div>
                  {INTELLIGENCE_STREAMS.map((s) => {
                    const isSelected = drawerStage === s.key;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`st-stream-item ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          onSelectStage(s.key);
                          setStreamOpen(false);
                        }}
                      >
                        <div className="st-stream-content">
                          <span className="st-stream-item-name">{s.label}</span>
                          <span className="st-stream-item-desc">{s.desc}</span>
                        </div>
                        {isSelected && <Check size={13} className="st-stream-check" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              className={`st-filter-btn ${shownFilterCount > 0 ? "active" : ""}`}
              onClick={() => setFilterDrawerOpen(true)}
              aria-haspopup="dialog"
              aria-label={shownFilterCount ? `Filters, ${shownFilterCount} active` : "Filters"}
            >
              <Filter size={13} aria-hidden="true" />
              <span>FILTERS</span>
              {shownFilterCount > 0 && <span className="st-filter-badge">{shownFilterCount}</span>}
            </button>
          </div>
        </div>

        {/* Mode Switcher: SPATIAL (Split-Screen 3D) vs SIGNALS (Minimalist Feed) */}
        {!resultsOnly && <div className="st-mode-cluster" data-mode={viewMode} role="group" aria-label="Signal view">
          <button
            type="button"
            aria-pressed={viewMode === "SPATIAL"}
            className={`st-mode-btn ${viewMode === "SPATIAL" ? "active" : ""}`}
            onClick={() => chooseMode("SPATIAL")}
          >
            <Compass size={13} aria-hidden="true" />
            <span className="st-wide-label">SPATIAL RADAR</span>
            <span className="st-mobile-label">MAP</span>
          </button>

          <button
            type="button"
            aria-pressed={viewMode === "SIGNALS"}
            className={`st-mode-btn ${viewMode === "SIGNALS" ? "active" : ""}`}
            onClick={() => chooseMode("SIGNALS")}
          >
            <ListFilter size={13} aria-hidden="true" />
            <span className="st-wide-label">SIGNALS DOSSIER</span>
            <span className="st-mobile-label">LIST</span>
          </button>
        </div>}
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <div className={`st-workspace ${viewMode === "SPATIAL" ? "st-split-layout" : "st-feed-layout"}`}>
        {/* SPATIAL RADAR CANVAS (64% in Split mode) */}
        {viewMode === "SPATIAL" && (
          <>
            <div className="st-map-handoff">
              <Link
                href={stratosphereFeedHref(params)}
                className="st-map-results"
              >
                {selectedSignal && filteredSignals.some((signal) => signal.id === selectedSignal.id)
                  ? "View selected signal"
                  : "Browse matching signals"}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
              <InfoTip tipId="exploreByArea" label="About the map" />
            </div>
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
          </>
        )}

        {/* SIGNAL DOSSIER FEED (36% in Split mode, Centered in Feed mode) */}
        <section
          className="st-dossier-pane"
          aria-label={viewMode === "SPATIAL" ? "Signal Dossiers for active sector" : "All Community Signal Dossiers"}
        >
          {/* Telemetry Header & Two-Sided Market Switcher */}
          <div className="st-dossier-header">
            {showCounts && <div className="st-telemetry-row">
              <div className="st-telemetry-tag">
                <Radio size={11} className="st-live-icon" aria-hidden="true" />
                <span role="status">
                  {filteredSignals.length} {filteredSignals.length === 1 ? "SIGNAL" : "SIGNALS"}
                </span>
              </div>
              <div className="st-telemetry-meta">
                {activeDistrict && (
                  <span className="st-district-indicator">
                    <span className="st-wide-label">DISTRICT · </span>{activeDistrict.toUpperCase()}
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
            </div>}

            {availableLenses.length > 0 && (
              <div className="st-lens-bar" role="group" aria-label="Role lens">
                <span className="st-lens-label">LENS</span>
                <div className="st-lens-pills">
                  {availableLenses.map((lens) => {
                    const isCurrent = activeLens === lens.id;
                    return (
                      <button
                        key={lens.id}
                        type="button"
                        aria-pressed={isCurrent}
                        className={`st-lens-pill ${isCurrent ? "is-active" : ""}`}
                        onClick={() => handleSelectLens(lens.id)}
                      >
                        {lens.label}
                      </button>
                    );
                  })}
                </div>
                <InfoTip tipId="stratosphereRoleLens" label="How role lenses filter signals" />
              </div>
            )}

            {/* Two-Sided Market Intent Switcher */}
            <div className="st-market-tabs" role="group" aria-label="Market intent">
              {MARKET_TABS.map(({ key, label, shortLabel, Icon, classMod = "" }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={marketRole === key}
                  className={`st-market-tab ${classMod} ${marketRole === key ? "is-active" : ""}`}
                  onClick={() => handleSelectMarketRole(key)}
                >
                  {Icon && <Icon size={12} className="st-tab-icon" aria-hidden="true" />}
                  <span className="st-market-tab-label">{label}</span>
                  <span className="st-market-tab-label-short">{shortLabel}</span>
                  {showCounts && <span className="st-market-tab-count">{roleCounts[key] || 0}</span>}
                </button>
              ))}
            </div>

            <p className="st-market-role-desc">
              {MARKET_ROLE_DESCRIPTIONS[marketRole] || MARKET_ROLE_DESCRIPTIONS[MARKET_ROLES.ALL]}
            </p>
          </div>

          {/* Dossier Cards List */}
          <div className="st-dossier-scroll" aria-busy={feedState === "loading"}>
            {feedState === "loading" ? (
              <p className="st-feed-status" role="status">Loading signals…</p>
            ) : feedState === "unavailable" && filteredSignals.length === 0 ? (
              <div className="st-empty-state">
                <h4 className="st-empty-title">Community posts are unavailable</h4>
                <button type="button" className="st-empty-reset-btn" onClick={onRetryFeed}>Retry</button>
              </div>
            ) : filteredSignals.length === 0 ? (
              <div className="st-empty-state">
                <Compass size={28} className="st-empty-icon" aria-hidden="true" />
                <h4 className="st-empty-title">No matching signals</h4>
                <p className="st-empty-desc">
                  {marketRole !== "all"
                    ? "Try all signals or another district."
                    : stageFilter === "all"
                    ? "Try another area or clear your search and filters."
                    : "Try all updates or another stage."}
                </p>
                <button
                  type="button"
                  className="st-empty-reset-btn"
                  onClick={() => {
                    handleResetFilters();
                    if (stageFilter !== "all") onClearStage();
                  }}
                >
                  {marketRole !== "all" ? "VIEW ALL" : stageFilter === "all" ? "CLEAR FILTERS" : "SEE ALL UPDATES"}
                </button>
              </div>
            ) : (
              <>
                {feedState === "unavailable" && <div className="st-feed-status" role="status">Community posts are unavailable. <button type="button" onClick={onRetryFeed}>Retry</button></div>}
                {visibleSignals.map((signal) => (
                  <SignalDossierCard
                    key={signal.id}
                    signal={signal}
                    isActive={selectedSignal?.id === signal.id}
                    revealActive={!isMobile || viewMode === "SIGNALS"}
                    isHovered={hoveredSignalId === signal.id}
                    onSelect={handleSelectSignal}
                    onHover={handleHoverSignal}
                    onConnect={handleOpenConnect}
                    onClosed={onSignalClosed}
                    returnStage={stageFilter}
                    communityPost={resultsOnly && signal.liveCommunity && !signal.isSample}
                  />
                ))}
                {filteredSignals.length > visibleSignalCount && (
                  <button
                    type="button"
                    className="st-empty-reset-btn"
                    onClick={() => setVisibleSignalCount((c) => c + SIGNALS_PAGE_SIZE)}
                  >
                    MORE SIGNALS ({filteredSignals.length - visibleSignalCount})
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
        filters={{ signalType, spaceType, district: activeDistrict }}
        onChange={(field, value) => writeRadarParams({ [field === "district" ? "place" : field]: value })}
        onReset={() => {
          handleResetFilters();
          if (isMobile && stageFilter !== "all") onClearStage();
        }}
        activeCount={shownFilterCount}
        canReset={isMobile ? Boolean(mobileFilterCount || searchQuery || marketRole !== "all") : undefined}
      >
        {filterDrawerOpen && isMobile && (
          <>
            <label className="sfd-field">
              <span className="sfd-label">District</span>
              <select value={activeDistrict || ""} onChange={(e) => handleSelectDistrict(e.target.value || null)}>
                <option value="">All districts ({stageSignals.length})</option>
                {activeDistrict && !districts.some(({ district }) => district === activeDistrict) && (
                  <option value={activeDistrict}>{activeDistrict}</option>
                )}
                {districts.map(({ district, count }) => <option key={district} value={district}>{district} ({count})</option>)}
              </select>
            </label>
            <label className="sfd-field">
              <span className="sfd-label">Updates</span>
              <select value={drawerStage} onChange={(e) => onSelectStage(e.target.value)}>
                {ALL_JOURNEY_STAGES.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
            {availableLenses.length > 0 && (
              <label className="sfd-field">
                <span className="sfd-label">Role lens</span>
                <select
                  value={availableLenses.some(({ id }) => id === activeLens) ? activeLens : ""}
                  onChange={(e) => handleSelectLens(e.target.value)}
                >
                  <option value="" disabled>Custom view</option>
                  {availableLenses.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                </select>
              </label>
            )}
            {viewMode === "SPATIAL" && (
              <label className="sfd-field">
                <span className="sfd-label">Market intent</span>
                <select value={marketRole} onChange={(e) => handleSelectMarketRole(e.target.value)}>
                  {MARKET_TABS.map(({ key, shortLabel }) => <option key={key} value={key}>{shortLabel} ({roleCounts[key] || 0})</option>)}
                </select>
              </label>
            )}
          </>
        )}
      </StratosphereFilterDrawer>

      {/* ── CONNECT PROPOSAL MODAL ── */}
      <CommunityConnectModal
        signal={connectModalSignal}
        isOpen={Boolean(connectModalSignal)}
        onClose={() => setConnectModalSignal(null)}
      />
    </div>
  );
}
