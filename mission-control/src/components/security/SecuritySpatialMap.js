"use client";

import { useEffect, useMemo, useState } from "react";
import { Layers, MapPin, Radio, Smartphone, Search, AlertCircle, Clock } from "lucide-react";

const SECTOR_BOUNDS = {
  luzon: { label: "Luzon / NCR", minLat: 13.8, maxLat: 15.6, minLng: 120.2, maxLng: 121.8 },
  ph: { label: "Philippines", minLat: 5.0, maxLat: 19.5, minLng: 116.5, maxLng: 127.0 },
  global: { label: "Global", minLat: -10.0, maxLat: 40.0, minLng: 95.0, maxLng: 145.0 },
};

function projectToRadar(lat, lng, bounds, zoom = 1) {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const spanLat = (bounds.maxLat - bounds.minLat) / zoom;
  const spanLng = (bounds.maxLng - bounds.minLng) / zoom;

  const rawX = ((lng - (centerLng - spanLng / 2)) / spanLng) * 100;
  const rawY = (((centerLat + spanLat / 2) - lat) / spanLat) * 100;

  return {
    x: Math.max(8, Math.min(92, rawX)),
    y: Math.max(12, Math.min(86, rawY)),
  };
}

export default function SecuritySpatialMap({ velocityData = [], flaggedData = [], history30dData = [], blockedHashes: _blockedHashes = [] }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("5m"); // 5m | 1h | 24h | 7d | 30d | all
  const [sectorKey, setSectorKey] = useState("luzon");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [clockNow, setClockNow] = useState(() => new Date().getTime());

  useEffect(() => {
    const timer = setInterval(() => setClockNow(new Date().getTime()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  // Time range calculation cutoff date
  const cutoffDate = useMemo(() => {
    if (timeRange === "5m") return clockNow - 5 * 60 * 1000; // Real-time Live (Last 5 minutes)
    if (timeRange === "1h") return clockNow - 60 * 60 * 1000; // Last 1 hour
    if (timeRange === "24h") return clockNow - 24 * 60 * 60 * 1000;
    if (timeRange === "7d") return clockNow - 7 * 24 * 60 * 60 * 1000;
    if (timeRange === "30d") return clockNow - 30 * 24 * 60 * 60 * 1000;
    return 0; // All time
  }, [clockNow, timeRange]);

  // Filter raw records by 30-day time range window
  const rawPool = useMemo(
    () => history30dData.length > 0 ? history30dData : [...velocityData, ...flaggedData],
    [history30dData, velocityData, flaggedData],
  );
  const timeFilteredRecords = useMemo(() => rawPool.filter((item) => {
    if (!cutoffDate) return true;
    const logTime = new Date(item.last_request_at || item.first_seen_at || clockNow).getTime();
    return logTime >= cutoffDate;
  }), [clockNow, cutoffDate, rawPool]);

  // Group location nodes, device counts, search intent, & friction records
  const { geoPoints, searchIntents, frictionPoints } = useMemo(() => {
    const locationMap = new Map();
    const searches = [];
    const frictions = [];

    timeFilteredRecords.forEach((item) => {
      const route = item.route_accessed || "";

      // Parse Search Intent Telemetry
      if (route.startsWith("SEARCH:")) {
        searches.push({
          query: route.replace("SEARCH: ", ""),
          isZero: item.is_flagged || false,
          time: item.last_request_at
        });
        return;
      }

      // Parse User Friction Point Telemetry
      if (route.startsWith("FRICTION:") || item.is_flagged) {
        frictions.push({
          type: item.flag_reason || route.replace("FRICTION: ", ""),
          route: route,
          time: item.last_request_at
        });
      }

      // Standard Spatial Node Aggregation
      const lat = item.latitude ? Number(item.latitude) : 14.8135;
      const lng = item.longitude ? Number(item.longitude) : 121.0453;
      const city = item.city && item.city !== "Makati CBD" ? item.city : "San Jose del Monte, Bulacan";
      const country = item.country || "PH";
      const maskedIp = item.masked_ip || item.id;
      const key = `${city}-${country}`;

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          city,
          region: country === "PH" ? "Bulacan / Central Luzon" : "International",
          country,
          lat,
          lng,
          reqCount: item.request_count || 1,
          deviceSet: new Set([maskedIp]),
          isFlagged: item.is_flagged || false,
          hashes: [maskedIp]
        });
      } else {
        const node = locationMap.get(key);
        node.reqCount += (item.request_count || 1);
        node.deviceSet.add(maskedIp);
        if (item.is_flagged) node.isFlagged = true;
        if (!node.hashes.includes(maskedIp)) node.hashes.push(maskedIp);
      }
    });

    const points = Array.from(locationMap.values()).map((node) => ({
      ...node,
      deviceCount: node.deviceSet.size
    }));

    return { geoPoints: points, searchIntents: searches, frictionPoints: frictions };
  }, [timeFilteredRecords]);

  const filteredPoints = useMemo(() => geoPoints.filter((p) => {
    if (activeFilter === "ph") return p.country === "PH";
    if (activeFilter === "intl") return p.country !== "PH";
    if (activeFilter === "flagged") return p.isFlagged;
    return true;
  }), [activeFilter, geoPoints]);

  const totalDevices = geoPoints.reduce((sum, p) => sum + p.deviceCount, 0);
  const totalRequests = geoPoints.reduce((sum, p) => sum + p.reqCount, 0);
  const activeSector = SECTOR_BOUNDS[sectorKey] || SECTOR_BOUNDS.luzon;
  const hqCoords = projectToRadar(14.5995, 120.9842, activeSector, zoomLevel);

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-[#E8AE3C] animate-pulse" />
            Sentinel Eye · 30-Day Historical Spatial & Intent Intel
          </h2>
          <p className="text-xs text-white/70 mt-0.5">
            Geographic Device Density, User Search Intent & Friction Point Analytics
          </p>
        </div>

        {/* Filters: Time Range + Region Scope */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Time Window Switcher */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-lg p-1">
            <Clock className="w-3.5 h-3.5 text-[#E8AE3C] ml-1" />
            {[
              { id: "5m", label: "🟢 REALTIME LIVE (5m)" },
              { id: "1h", label: "1 Hour" },
              { id: "24h", label: "24 Hours" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-mono transition-all ${
                  timeRange === t.id
                    ? "bg-[#E8AE3C] text-black font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Region Scope */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-lg p-1">
            <Layers className="w-3.5 h-3.5 text-white/70 ml-1" />
            {[
              { id: "all", label: "All" },
              { id: "ph", label: "Philippines" },
              { id: "flagged", label: "Flagged" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[12px] font-mono transition-all ${
                  activeFilter === f.id
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Self-Contained Sentinel Eye Vector Radar + Location Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative min-h-[420px] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl select-none">
          {/* Vector Radar Grid & Telemetry Backdrop */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="sentinelRadarGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(232,174,60,0.16)" />
                <stop offset="65%" stopColor="rgba(232,174,60,0.04)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>

            {/* Subtle Graticule Grid */}
            {[20, 40, 60, 80].map((pos) => (
              <g key={pos}>
                <line x1={pos} y1="0" x2={pos} y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
                <line x1="0" y1={pos} x2="100" y2={pos} stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" />
              </g>
            ))}

            {/* Tactical Sector Contours */}
            <path
              d="M36,16 L46,14 L54,22 L56,38 L62,48 L52,54 L44,44 L38,32 Z M52,58 L62,56 L66,66 L56,70 Z M54,74 L68,72 L72,86 L58,88 Z"
              fill="rgba(232,174,60,0.035)"
              stroke="rgba(232,174,60,0.16)"
              strokeWidth="0.3"
            />

            {/* Concentric Radar Sweep Rings Centered on Core Sector */}
            <circle cx={hqCoords.x} cy={hqCoords.y} r="34" fill="url(#sentinelRadarGlow)" />
            {[12, 24, 36].map((r) => (
              <circle
                key={r}
                cx={hqCoords.x}
                cy={hqCoords.y}
                r={r}
                fill="none"
                stroke="rgba(232,174,60,0.14)"
                strokeWidth="0.22"
                strokeDasharray="1.2 1.2"
              />
            ))}

            {/* Telemetry Vectors from Active Nodes to Core */}
            {filteredPoints.map((pt, idx) => {
              const pos = projectToRadar(pt.lat, pt.lng, activeSector, zoomLevel);
              return (
                <line
                  key={`vec-${idx}`}
                  x1={hqCoords.x}
                  y1={hqCoords.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={pt.isFlagged ? "rgba(248,113,113,0.35)" : "rgba(232,174,60,0.28)"}
                  strokeWidth="0.25"
                  strokeDasharray="0.8 0.8"
                />
              );
            })}
          </svg>

          {/* Top-Left Coordinate & Sector Telemetry Badge */}
          <div className="absolute top-3 left-3 z-20 bg-black/85 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-[12px] font-mono text-white/70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SECTOR: <strong className="text-[#E8AE3C] uppercase">{activeSector.label}</strong></span>
            <span className="text-white/70">|</span>
            <span>ZOOM: {zoomLevel.toFixed(1)}x</span>
          </div>

          {/* Top-Right Tactical Sector & Zoom Controls */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/85 backdrop-blur border border-white/10 rounded-lg p-1 text-[12px] font-mono">
            {Object.entries(SECTOR_BOUNDS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSectorKey(key);
                  setZoomLevel(1);
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  sectorKey === key
                    ? "bg-[#E8AE3C] text-black font-semibold"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {cfg.label}
              </button>
            ))}
            <span className="text-white/70 px-0.5">|</span>
            <button
              type="button"
              aria-label="Zoom in radar"
              onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.4).toFixed(1))))}
              className="px-2 py-1 rounded text-white/80 hover:bg-white/10"
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out radar"
              onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.4).toFixed(1))))}
              className="px-2 py-1 rounded text-white/80 hover:bg-white/10"
            >
              −
            </button>
          </div>

          {/* Interactive Spatial Node Markers */}
          <div className="relative w-full h-[420px] z-10">
            {filteredPoints.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white/60">
                No active spatial telemetry nodes in the selected window.
              </div>
            ) : (
              filteredPoints.map((pt, idx) => {
                const pos = projectToRadar(pt.lat, pt.lng, activeSector, zoomLevel);
                const isSelected = selectedPoint?.city === pt.city;
                const badgeColor = pt.isFlagged ? "#f87171" : "#E8AE3C";

                return (
                  <button
                    key={`${pt.city}-${idx}`}
                    type="button"
                    onClick={() => setSelectedPoint(pt)}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    className={`-translate-x-1/2 -translate-y-1/2 absolute flex items-center gap-1.5 bg-[#0d0d0d]/95 text-white px-3 py-1.5 rounded-full font-mono whitespace-nowrap cursor-pointer transition-transform ${
                      isSelected ? "scale-110 z-30" : "hover:scale-105 z-20"
                    }`}
                  >
                    <span
                      style={{
                        backgroundColor: badgeColor,
                        boxShadow: `0 0 10px ${badgeColor}`,
                      }}
                      className="w-2 h-2 rounded-full inline-block shrink-0"
                    />
                    <span className="text-[12px] font-bold uppercase tracking-wide">{pt.city}</span>
                    <span
                      style={{
                        color: badgeColor,
                        borderColor: badgeColor,
                      }}
                      className="text-[12px] bg-[#E8AE3C]/15 border px-2 py-0.5 rounded-full font-bold"
                    >
                      📱 {pt.deviceCount} {pt.deviceCount === 1 ? "DEV" : "DEVS"}
                    </span>
                  </button>
                );
              })
            )}

            {/* Selected Node Tactical Dossier Popup */}
            {selectedPoint && (
              <div className="absolute bottom-14 right-3 z-30 bg-[#0d0d0d]/95 backdrop-blur border border-[#E8AE3C]/50 rounded-xl p-3.5 min-w-[240px] max-w-[300px] font-mono shadow-2xl">
                <div className="flex items-center justify-between gap-2 text-[13px] font-bold text-[#E8AE3C] border-b border-white/10 pb-1.5 mb-2">
                  <span>📍 {selectedPoint.city}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPoint(null)}
                    className="text-white/60 hover:text-white text-[12px] px-1.5"
                    aria-label="Close node details"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-[12px] text-white mb-1">
                  📱 <strong>{selectedPoint.deviceCount} Active Device{selectedPoint.deviceCount > 1 ? "s" : ""}</strong>
                </div>
                <div className="text-[12px] text-white/70 mb-1">
                  ⚡ <strong>{selectedPoint.reqCount} Total Requests ({timeRange.toUpperCase()})</strong>
                </div>
                <div className="text-[12px] text-white/60 mb-1.5">
                  🌐 {Number(selectedPoint.lat).toFixed(4)}°N, {Number(selectedPoint.lng).toFixed(4)}°E
                </div>
                <div className="text-[12px] text-white/70 break-all border-t border-white/10 pt-1.5">
                  Hash: {selectedPoint.hashes?.[0] || "anon"}
                </div>
              </div>
            )}
          </div>

          {/* Floating Device Counter Overlay */}
          <div className="absolute bottom-3 left-3 z-20 bg-black/90 backdrop-blur border border-white/10 rounded-lg px-3.5 py-2 text-xs font-mono text-white/80 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#E8AE3C]" />
              <span>Active Devices ({timeRange.toUpperCase()}): <strong className="text-[#E8AE3C] text-sm">{totalDevices}</strong></span>
            </div>
            <div className="text-white/70 border-l border-white/10 pl-3">
              Total Traffic: <strong className="text-white">{totalRequests} reqs</strong>
            </div>
          </div>
        </div>

        {/* Location Device Ranking Panel */}
        <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8AE3C] mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Device Location Ranking
            </h3>

            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredPoints.length === 0 ? (
                <div className="text-xs text-white/70 py-4 text-center">No location traffic in this window.</div>
              ) : (
                filteredPoints.map((pt, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPoint(pt)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedPoint?.city === pt.city
                        ? "bg-white/15 border-[#E8AE3C]"
                        : "bg-white/5 border-transparent hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#E8AE3C]" />
                        {pt.city}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        📱 {pt.deviceCount} {pt.deviceCount === 1 ? 'Device' : 'Devices'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[12px] text-white/70 font-mono mt-1">
                      <span>{pt.region}</span>
                      <span className="text-[#E8AE3C]">{pt.reqCount} requests</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[12px] text-white/70 border-t border-white/5 pt-3 leading-relaxed font-mono">
            * Window: {timeRange.toUpperCase()} · Anonymized via persistent `scout_did` device tokens.
          </div>
        </div>
      </div>

      {/* 📊 Bottom Intelligence Grid: Search Demand vs. User Friction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Left: What Users Are Looking For (Search Demand Intel) */}
        <div className="bg-black/60 border border-white/5 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#E8AE3C] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#E8AE3C]" />
            What Users Are Looking For (Search Demand)
          </h3>
          {searchIntents.length === 0 ? (
            <p className="text-xs text-white/70 py-3">No search query logs in this time window.</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {searchIntents.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="font-mono text-white/80 truncate">🔍 {s.query}</span>
                  {s.isZero ? (
                    <span className="text-[12px] text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full font-mono">
                      0 Matches (Demand Gap)
                    </span>
                  ) : (
                    <span className="text-[12px] text-emerald-400 font-mono">Active Intent</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: What Users Are Having a Hard Time With (Friction Points) */}
        <div className="bg-black/60 border border-white/5 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            User Friction & Drop-Off Points
          </h3>
          {frictionPoints.length === 0 ? (
            <p className="text-xs text-white/70 py-3">No active friction drop-offs detected. Clean conversion flow.</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {frictionPoints.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <span className="font-mono text-red-300 truncate">⚠️ {f.type}</span>
                  <span className="text-[12px] text-white/70 font-mono">
                    {f.time ? new Date(f.time).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
