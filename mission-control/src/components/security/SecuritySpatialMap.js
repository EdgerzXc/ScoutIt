"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, ShieldAlert, Layers, MapPin, Radio, Smartphone, Search, AlertCircle, Clock, TrendingUp } from "lucide-react";

export default function SecuritySpatialMap({ velocityData = [], flaggedData = [], history30dData = [], blockedHashes = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("30d"); // 24h | 7d | 30d | all
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Time range calculation cutoff date
  const cutoffDate = (() => {
    const now = Date.now();
    if (timeRange === "24h") return now - 24 * 60 * 60 * 1000;
    if (timeRange === "7d") return now - 7 * 24 * 60 * 60 * 1000;
    if (timeRange === "30d") return now - 30 * 24 * 60 * 60 * 1000;
    return 0; // All time
  })();

  // Filter raw records by 30-day time range window
  const rawPool = history30dData.length > 0 ? history30dData : [...velocityData, ...flaggedData];
  const timeFilteredRecords = rawPool.filter((item) => {
    if (!cutoffDate) return true;
    const logTime = new Date(item.last_request_at || item.first_seen_at || Date.now()).getTime();
    return logTime >= cutoffDate;
  });

  // Group location nodes, device counts, search intent, & friction records
  const { geoPoints, searchIntents, frictionPoints } = (() => {
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
  })();

  const filteredPoints = geoPoints.filter((p) => {
    if (activeFilter === "ph") return p.country === "PH";
    if (activeFilter === "intl") return p.country !== "PH";
    if (activeFilter === "flagged") return p.isFlagged;
    return true;
  });

  const totalDevices = geoPoints.reduce((sum, p) => sum + p.deviceCount, 0);
  const totalRequests = geoPoints.reduce((sum, p) => sum + p.reqCount, 0);

  // Load Leaflet dynamically in browser
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (!window.L && !document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletLoaded(true);
    }
  }, []);

  // Initialize Leaflet map with custom HTML pin markers
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || typeof window === "undefined" || !window.L) return;

    const L = window.L;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [14.8135, 121.0453],
      zoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      subdomains: "abcd"
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    filteredPoints.forEach((pt) => {
      const badgeColor = pt.isFlagged ? "#f87171" : "#E8AE3C";

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; gap: 6px; background: #0d0d0d; color: #fff; padding: 6px 12px; border-radius: 20px; border: 1px solid ${badgeColor}; box-shadow: 0 0 16px rgba(232,174,60,0.3); font-family: monospace; white-space: nowrap; cursor: pointer;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${badgeColor}; display: inline-block; box-shadow: 0 0 8px ${badgeColor};"></span>
            <span style="font-size: 11px; font-weight: bold; text-transform: uppercase;">${pt.city}</span>
            <span style="font-size: 10px; background: rgba(232,174,60,0.15); color: ${badgeColor}; padding: 2px 6px; border-radius: 10px; font-weight: 700;">
              📱 ${pt.deviceCount} ${pt.deviceCount === 1 ? 'DEV' : 'DEVS'}
            </span>
          </div>
        `,
        iconSize: [180, 32],
        iconAnchor: [90, 16]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: monospace; color: #fff; background: #0d0d0d; padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(232,174,60,0.4); min-width: 220px;">
          <div style="font-size: 13px; font-weight: bold; color: #E8AE3C; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px;">
            📍 ${pt.city}
          </div>
          <div style="font-size: 12px; color: #fff; margin-bottom: 4px;">
            📱 <strong>${pt.deviceCount} Active Device${pt.deviceCount > 1 ? 's' : ''}</strong>
          </div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 6px;">
            ⚡ <strong>${pt.reqCount} Total Requests (${timeRange.toUpperCase()})</strong>
          </div>
          <div style="font-size: 9px; color: rgba(255,255,255,0.4); word-break: break-all;">
            Hash: ${pt.hashes[0]}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on("click", () => setSelectedPoint(pt));
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded, activeFilter, timeRange, velocityData, history30dData]);

  return (
    <div className="bg-[#121212] border border-white/5 rounded-xl p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-medium flex items-center gap-2 text-white">
            <Radio className="w-5 h-5 text-[#E8AE3C] animate-pulse" />
            Sentinel Eye · 30-Day Historical Spatial & Intent Intel
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            Geographic Device Density, User Search Intent & Friction Point Analytics
          </p>
        </div>

        {/* Filters: Time Range + Region Scope */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Time Window Switcher */}
          <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 rounded-lg p-1">
            <Clock className="w-3.5 h-3.5 text-[#E8AE3C] ml-1" />
            {[
              { id: "24h", label: "24 Hours" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "all", label: "All Time" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
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
            <Layers className="w-3.5 h-3.5 text-white/40 ml-1" />
            {[
              { id: "all", label: "All" },
              { id: "ph", label: "Philippines" },
              { id: "flagged", label: "Flagged" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                  activeFilter === f.id
                    ? "bg-white/20 text-white font-semibold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Sleek Leaflet Map + Location Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative min-h-[420px] bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div ref={mapContainerRef} className="w-full h-[420px] z-10" />

          {!leafletLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs font-mono text-[#E8AE3C] z-20">
              Loading 30-Day Historical Spatial Map Engine…
            </div>
          )}

          {/* Floating Device Counter Overlay */}
          <div className="absolute bottom-3 left-3 z-[400] bg-black/90 backdrop-blur border border-white/10 rounded-lg px-3.5 py-2 text-xs font-mono text-white/80 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#E8AE3C]" />
              <span>Active Devices ({timeRange.toUpperCase()}): <strong className="text-[#E8AE3C] text-sm">{totalDevices}</strong></span>
            </div>
            <div className="text-white/40 border-l border-white/10 pl-3">
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
                <div className="text-xs text-white/40 py-4 text-center">No location traffic in this window.</div>
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

                    <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mt-1">
                      <span>{pt.region}</span>
                      <span className="text-[#E8AE3C]">{pt.reqCount} requests</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-white/40 border-t border-white/5 pt-3 leading-relaxed font-mono">
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
            <p className="text-xs text-white/40 py-3">No search query logs in this time window.</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {searchIntents.map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
                  <span className="font-mono text-white/80 truncate">🔍 {s.query}</span>
                  {s.isZero ? (
                    <span className="text-[10px] text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full font-mono">
                      0 Matches (Demand Gap)
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono">Active Intent</span>
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
            <p className="text-xs text-white/40 py-3">No active friction drop-offs detected. Clean conversion flow.</p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {frictionPoints.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  <span className="font-mono text-red-300 truncate">⚠️ {f.type}</span>
                  <span className="text-[10px] text-white/40 font-mono">
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
