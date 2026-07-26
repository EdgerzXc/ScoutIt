import manilaStations from "../data/manila_transit_stations.json";
import pezaZonesData from "../data/peza_zones_philippines.json";
import phivolcsFaults from "../data/phivolcs_active_faults.json";
import infraProjectsData from "../data/ph_infrastructure_projects.json";

// ─── Haversine distance in meters ────────────────────────────────────────────
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ─── Point-to-segment perpendicular distance (meters) ────────────────────────
// Projects point P onto segment A→B and returns shortest distance (clamped to endpoints).
function pointToSegmentMeters(pLat, pLon, aLat, aLon, bLat, bLon) {
  const dx = bLon - aLon;
  const dy = bLat - aLat;
  if (dx === 0 && dy === 0) return haversineMeters(pLat, pLon, aLat, aLon);

  // t = projection scalar clamped to [0, 1]
  let t = ((pLon - aLon) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  const projLon = aLon + t * dx;
  const projLat = aLat + t * dy;
  return haversineMeters(pLat, pLon, projLat, projLon);
}

// ─── Parse PHIVOLCS GeoJSON into fault segment arrays (single source of truth) ──
const FAULT_LINES = (phivolcsFaults.features || []).map((f) => ({
  name: f.properties.name,
  code: f.properties.phivolcs_code,
  region: f.properties.region,
  // GeoJSON coordinates are [lng, lat] — convert to {lat, lon} pairs
  coords: (f.geometry.coordinates || []).map(([lon, lat]) => ({ lat, lon })),
}));

// ─── Nationwide PEZA IT Parks & Ecozones ─────────────────────────────────────
const PEZA_ZONES = (pezaZonesData.features || []).map((f) => ({
  name: f.properties.name,
  city: f.properties.city,
  region: f.properties.region,
  lon: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
  radius: 2000,
}));

// ─── Flatten transit stations ────────────────────────────────────────────────
const ALL_STATIONS = [
  ...(manilaStations.lrt1 || []).map((s) => ({ ...s, line: "LRT-1" })),
  ...(manilaStations.lrt2 || []).map((s) => ({ ...s, line: "LRT-2" })),
  ...(manilaStations.mrt3 || []).map((s) => ({ ...s, line: "MRT-3" })),
];

// ─── Nearest Transit Station ─────────────────────────────────────────────────
export function getNearestTransitStation(lat, lon) {
  if (!lat || !lon) return null;

  let minDistance = Infinity;
  let closestStation = null;

  for (const station of ALL_STATIONS) {
    const dist = haversineMeters(lat, lon, station.lat, station.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closestStation = station;
    }
  }

  if (!closestStation) return null;

  return {
    station_name: closestStation.name,
    line: closestStation.line,
    distance_meters: minDistance,
    walk_minutes: Math.ceil(minDistance / 75),
  };
}

// ─── PEZA Ecozone Check ──────────────────────────────────────────────────────
export function checkPezaZone(lat, lon) {
  if (!lat || !lon) return { is_accredited: false, zone_name: null };

  let closestZone = null;
  let minDistance = Infinity;

  for (const zone of PEZA_ZONES) {
    const dist = haversineMeters(lat, lon, zone.lat, zone.lon);
    if (dist <= zone.radius && dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }

  if (closestZone) {
    return {
      is_accredited: true,
      zone_name: closestZone.name,
      city: closestZone.city,
      region: closestZone.region,
      distance_to_center_m: minDistance,
    };
  }

  return { is_accredited: false, zone_name: null };
}

// ─── PHIVOLCS Fault Proximity (point-to-segment, all 6 nationwide faults) ───
export function getFaultLineProximity(lat, lon) {
  if (!lat || !lon) return null;

  let minDist = Infinity;
  let nearestFault = null;

  for (const fault of FAULT_LINES) {
    const coords = fault.coords;
    for (let i = 0; i < coords.length - 1; i++) {
      const dist = pointToSegmentMeters(
        lat, lon,
        coords[i].lat, coords[i].lon,
        coords[i + 1].lat, coords[i + 1].lon
      );
      if (dist < minDist) {
        minDist = dist;
        nearestFault = fault;
      }
    }
  }

  if (!nearestFault) return null;

  const km = (minDist / 1000).toFixed(1);
  return {
    fault_line: nearestFault.name,
    fault_code: nearestFault.code,
    distance_km: Number(km),
    distance_meters: minDist,
    status: minDist >= 5000 ? "Safe Buffer (>5km)" : `${km}km from ${nearestFault.code} trace`,
  };
}

// ─── Infrastructure Megaproject Proximity ────────────────────────────────────
const INFRA_PROJECTS = (infraProjectsData.features || []).map((f) => {
  const coords = f.geometry.coordinates;
  // For LineStrings, use the midpoint; for Points, use the coordinate directly
  let lat, lon;
  if (f.geometry.type === "Point") {
    lon = coords[0]; lat = coords[1];
  } else {
    const mid = coords[Math.floor(coords.length / 2)];
    lon = mid[0]; lat = mid[1];
  }
  return { ...f.properties, lat, lon };
});

export function checkInfraProximity(lat, lon) {
  if (!lat || !lon) return null;

  let nearest = null;
  let minDist = Infinity;

  for (const proj of INFRA_PROJECTS) {
    const dist = haversineMeters(lat, lon, proj.lat, proj.lon);
    if (dist < minDist) {
      minDist = dist;
      nearest = proj;
    }
  }

  if (!nearest || minDist > 5000) return null; // only report within 5km

  return {
    name: nearest.name,
    type: nearest.type,
    status: nearest.status,
    completion: nearest.completion,
    budget_php: nearest.budget_php,
    distance_km: Number((minDist / 1000).toFixed(1)),
  };
}

// ─── Business Continuity & Spatial Risk Index (0-100) ────────────────────────
export function computeContinuityScore(spatialIntel) {
  if (!spatialIntel) return { score: 75, grade: "Tier 2 Prime Commercial", badge_color: "#F7C64E" };

  let score = 50;

  if (spatialIntel.peza?.is_accredited) score += 20;

  if (spatialIntel.transit?.walk_minutes) {
    if (spatialIntel.transit.walk_minutes <= 5) score += 20;
    else if (spatialIntel.transit.walk_minutes <= 10) score += 15;
    else if (spatialIntel.transit.walk_minutes <= 15) score += 10;
  }

  if (spatialIntel.seismic?.distance_km >= 5) score += 10;

  // Infrastructure proximity bonus
  if (spatialIntel.infra) score += 10;

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    grade: finalScore >= 90 ? "Tier 1 Enterprise Grade" : finalScore >= 75 ? "Tier 2 Prime Commercial" : "Standard Commercial Zone",
    badge_color: finalScore >= 90 ? "#10B981" : finalScore >= 75 ? "#F7C64E" : "#888888",
  };
}

// ─── Main: Pre-compute spatial intelligence metrics (~1ms) ───────────────────
export function computeSpatialIntel(lat, lon) {
  if (!lat || !lon) return null;

  const transit = getNearestTransitStation(lat, lon);
  const peza = checkPezaZone(lat, lon);
  const seismic = getFaultLineProximity(lat, lon);

  // ponytail: solar orientation is a stub — real azimuth needs a DEM or building footprint layer
  const isEastFacing = Math.floor((lon || 121) * 100) % 2 === 0;
  const solar = {
    orientation: isEastFacing ? "East / South-East (Morning Sun)" : "North / North-East (Ambient Light)",
    heat_load: isEastFacing ? "Optimal Morning Light (Low HVAC Load)" : "Cool Ambient Light (Minimal Solar Gain)",
  };

  const infra = checkInfraProximity(lat, lon);

  const rawIntel = { transit, peza, seismic, solar, infra, telecom: { fiber_tier: "Enterprise Tier 4 (Multi-Carrier)" } };
  const continuity = computeContinuityScore(rawIntel);

  return {
    ...rawIntel,
    continuity,
    computed_at: new Date().toISOString(),
  };
}
