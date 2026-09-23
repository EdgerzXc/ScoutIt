// ═══════════════════════════════════════════════════════════════════════════
// STRATOSPHERE COMMUNITY SIGNALS ADAPTER — Canonical Layer 02 Repository
// Unifies spatial signals, demand radar, and structured community dispatches
// ═══════════════════════════════════════════════════════════════════════════

import { circlePolygon } from "@/lib/geo";
import { effectiveLifecycle, timingLine, LIFECYCLE } from "./pipelineLifecycle";

export const SIGNAL_TYPES = Object.freeze({
  LOOKING_FOR: "LOOKING_FOR",
  REPRESENTING_CLIENT: "REPRESENTING_CLIENT",
  UPCOMING_SUPPLY: "UPCOMING_SUPPLY",
  BUSINESS_EXPANSION: "BUSINESS_EXPANSION",
  OPPORTUNITY: "OPPORTUNITY",
  MARKET_OBSERVATION: "MARKET_OBSERVATION",
  COMMERCIAL_PROMOTION: "COMMERCIAL_PROMOTION",
  SCOUTIT_INTELLIGENCE: "SCOUTIT_INTELLIGENCE",
});

export const SIGNAL_TYPE_LABELS = Object.freeze({
  LOOKING_FOR: "Looking For",
  REPRESENTING_CLIENT: "Representing Client",
  UPCOMING_SUPPLY: "Upcoming Supply",
  BUSINESS_EXPANSION: "Business Expansion",
  OPPORTUNITY: "Opportunity",
  MARKET_OBSERVATION: "Market Observation",
  COMMERCIAL_PROMOTION: "Commercial Promotion",
  SCOUTIT_INTELLIGENCE: "ScoutIt Intelligence",
});

export const SIGNAL_COLORS = Object.freeze({
  LOOKING_FOR: "rgb(232, 174, 60)", // ScoutIt Warm Gold (Demand)
  REPRESENTING_CLIENT: "rgb(247, 198, 78)", // Interactive Bright Gold
  UPCOMING_SUPPLY: "#10b981", // Emerald (Supply)
  BUSINESS_EXPANSION: "#a855f7", // Violet (Enterprise Expansion)
  OPPORTUNITY: "#38bdf8", // Sky / Cyan
  MARKET_OBSERVATION: "#d97706", // Amber
  COMMERCIAL_PROMOTION: "#f59e0b", // Labeled Promotion
  SCOUTIT_INTELLIGENCE: "rgb(247, 198, 78)", // Gold System Intelligence
});

export const DISTRICT_COORDS = Object.freeze({
  "BGC": { lat: 14.5409, lng: 121.0503, name: "BGC", city: "Taguig" },
  "Makati CBD": { lat: 14.5547, lng: 121.0244, name: "Makati CBD", city: "Makati" },
  "Ortigas Center": { lat: 14.5866, lng: 121.0614, name: "Ortigas Center", city: "Pasig" },
  "Alabang": { lat: 14.4239, lng: 121.0335, name: "Alabang", city: "Muntinlupa" },
  "Bay Area": { lat: 14.5266, lng: 120.9886, name: "Bay Area", city: "Parañaque" },
  "Poblacion": { lat: 14.5658, lng: 121.0305, name: "Poblacion", city: "Makati" },
  "Quezon City": { lat: 14.6507, lng: 121.0360, name: "Quezon City", city: "Quezon City" },
  "Clark": { lat: 15.1833, lng: 120.5333, name: "Clark Freezone", city: "Pampanga" },
});

export const COMMUNITY_SIGNALS = [
  {
    id: "sig-bgc-logistics-hub",
    title: "1,200 – 1,800 sqm High-Ceiling Last-Mile Logistics Center",
    signalType: SIGNAL_TYPES.LOOKING_FOR,
    category: "LOGISTICS / INDUSTRIAL",
    spaceType: "Warehouse",
    location: "BGC Periphery & C5 Corridor",
    district: "BGC",
    city: "Taguig",
    coords: { lat: 14.5385, lng: 121.0560 },
    areaSqm: { min: 1200, max: 1800 },
    budget: "₱900 – ₱1,200/sqm",
    timing: "Q4 2026 Target",
    specs: ["Minimum 8m clear ceiling", "3-Phase 200kVA power", "Heavy truck ingress (40ft)", "Dedicated loading dock"],
    summary: "Regional e-commerce cold & dry parcel hub requiring direct access to C5 and Kalayaan Flyover.",
    requirements: {
      power: "3-Phase 200kVA",
      ceilingHeight: "8.5m",
      floorLoad: "3.5 tons/sqm",
      parking: "8 truck bays",
    },
    author: {
      scoutId: "SCOUT-7721",
      mode: "anonymous",
      trustTier: "VERIFIED ENTERPRISE",
      verified: true,
    },
    relevantCount: 54,
    savedCount: 19,
    matchingSpaces: [
      { title: "C5 Mega Distribution Depot", slug: "the-estate-makati", distance: "450m" },
      { title: "South Logistics Compound", slug: "the-glasshouse-bgc", distance: "820m" },
    ],
    actionType: "PROPOSE_SPACE",
    glyphType: "volume",
    glyphData: { width: 40, depth: 35, height: 18, ceilingM: 8.5 },
    createdAt: "2026-09-12T08:00:00Z",
    freshness: "fresh",
    isSample: true,
  },
  {
    id: "sig-makati-leed-demand",
    title: "800 – 1,500 sqm LEED Platinum Contiguous Floorplate",
    signalType: SIGNAL_TYPES.REPRESENTING_CLIENT,
    category: "OFFICE / PEZA",
    spaceType: "Office",
    location: "Ayala Avenue Core",
    district: "Makati CBD",
    city: "Makati",
    coords: { lat: 14.5547, lng: 121.0244 },
    areaSqm: { min: 800, max: 1500 },
    budget: "₱1,800 – ₱2,400/sqm",
    timing: "Q1 2027 Ingress",
    specs: ["LEED Gold or Platinum certified", "100% back-up redundant generator", "Fiber dual-ring entry", "Floor-to-ceiling double glazing"],
    summary: "Multinational fintech corporate client relocating Philippine operations under global ESG mandate.",
    requirements: {
      certification: "LEED Gold / Platinum",
      density: "8 sqm/pax",
      acSystem: "Variable Refrigerant Flow / Chilled Water",
      security: "Turnstile biometric lobby",
    },
    author: {
      scoutId: "SCOUT-3109",
      mode: "public",
      name: "Prime Strategic Advisory",
      trustTier: "LICENSED BROKER",
      verified: true,
    },
    relevantCount: 38,
    savedCount: 22,
    matchingSpaces: [
      { title: "The Estate Makati Corporate Level", slug: "the-estate-makati", distance: "280m" },
      { title: "One Ayala Corporate Tower", slug: "the-estate-makati", distance: "390m" },
    ],
    actionType: "PROPOSE_SPACE",
    glyphType: "volume",
    glyphData: { width: 32, depth: 32, height: 12, ceilingM: 3.8 },
    createdAt: "2026-09-11T14:30:00Z",
    freshness: "fresh",
    isSample: true,
  },
  {
    id: "sig-ortigas-tech-supply",
    title: "Upcoming 3,400 sqm Divisible IT-BPM Grade-A Availability",
    signalType: SIGNAL_TYPES.UPCOMING_SUPPLY,
    category: "OFFICE / ENTERPRISE",
    spaceType: "Office",
    location: "ADB Avenue / F. Ortigas Jr. Road",
    district: "Ortigas Center",
    city: "Pasig",
    coords: { lat: 14.5866, lng: 121.0614 },
    areaSqm: { min: 1100, max: 3400 },
    budget: "₱1,100 – ₱1,350/sqm",
    timing: "Available Nov 2026",
    specs: ["Warm shell handover", "PEZA ecozone accredited", "Pre-installed raised flooring", "Direct walk to MRT-3 station"],
    summary: "Two contiguous floors vacating in high-density carrier-neutral tower; exclusive advance advisory window.",
    requirements: {
      handover: "Warm shell with raised floor",
      elevators: "12 high-speed passenger cars",
      power: "100% N+1 redundancy",
    },
    author: {
      scoutId: "SCOUT-1204",
      mode: "anonymous",
      trustTier: "VERIFIED ASSET TRUSTEE",
      verified: true,
    },
    relevantCount: 29,
    savedCount: 14,
    matchingSpaces: [
      { title: "Ortigas Prime Landmark Tower", slug: "the-estate-makati", distance: "150m" },
    ],
    actionType: "VIEW_SPACE",
    glyphType: "supply_demand",
    glyphData: { supplyRate: 85, demandRate: 60, status: "SURPLUS" },
    createdAt: "2026-09-10T10:00:00Z",
    freshness: "fresh",
    isSample: true,
  },
  {
    id: "sig-bgc-fb-expansion",
    title: "Premium Casual Dining Chain Seeking 400 – 600 sqm Corner Retail",
    signalType: SIGNAL_TYPES.BUSINESS_EXPANSION,
    category: "RETAIL / F&B",
    spaceType: "Retail",
    location: "Bonifacio High Street & 7th Ave Perimeter",
    district: "BGC",
    city: "Taguig",
    coords: { lat: 14.5502, lng: 121.0508 },
    areaSqm: { min: 400, max: 600 },
    budget: "₱3,200 – ₱4,000/sqm",
    timing: "Q1 2027",
    specs: ["Wrap-around street frontage", "Heavy exhaust kitchen shaft (6000 CFM)", "Grease trap with direct sewer drop", "Al-fresco seating allocation"],
    summary: "International dining group launching flagship Manila presence; high footfall promenade position required.",
    requirements: {
      frontage: "Minimum 18 meters glassline",
      exhaust: "Dedicated vertical shaft",
      gas: "Centralized LPG line",
      paxCapacity: "160 indoor / 40 al fresco",
    },
    author: {
      scoutId: "SCOUT-9943",
      mode: "public",
      name: "Gastronomy Holdings Asia",
      trustTier: "VERIFIED ENTERPRISE",
      verified: true,
    },
    relevantCount: 47,
    savedCount: 31,
    matchingSpaces: [
      { title: "The Glasshouse BGC Promenade Level", slug: "the-glasshouse-bgc", distance: "120m" },
      { title: "High Street Pavilion Retail", slug: "the-glasshouse-bgc", distance: "210m" },
    ],
    actionType: "PROPOSE_SPACE",
    glyphType: "volume",
    glyphData: { width: 25, depth: 20, height: 10, ceilingM: 5.5, hasCorner: true },
    createdAt: "2026-09-09T18:00:00Z",
    freshness: "active",
    isSample: true,
  },
  {
    id: "sig-poblacion-adaptive-trend",
    title: "Adaptive Reuse Gastronomy Conversions Surge in Poblacion Heritage Blocks",
    signalType: SIGNAL_TYPES.MARKET_OBSERVATION,
    category: "URBAN DEVELOPMENT",
    spaceType: "Mixed-Use",
    location: "Poblacion Heritage Quarter",
    district: "Poblacion",
    city: "Makati",
    coords: { lat: 14.5658, lng: 121.0305 },
    areaSqm: { min: 250, max: 800 },
    budget: "₱1,200 – ₱1,800/sqm",
    timing: "Active Shift",
    specs: ["Heritage structural reinforcement", "Zoning mix commercial/residential", "Boutique cocktail & tasting room clusters"],
    summary: "Pre-war residential lots and legacy industrial warehouses command 35% accelerated lease velocity for experiential multi-concept dining.",
    requirements: {
      character: "Exposed brick / industrial truss",
      zoning: "Mixed-use commercial night economy",
    },
    author: {
      scoutId: "SCOUT-0412",
      mode: "anonymous",
      trustTier: "MARKET RESEARCHER",
      verified: true,
    },
    relevantCount: 68,
    savedCount: 42,
    matchingSpaces: [
      { title: "Sky Pavilion Salcedo Buffer", slug: "sky-pavilion-makati", distance: "650m" },
    ],
    actionType: "CONNECT",
    glyphType: "trend",
    glyphData: { trend: "+35% Velocity", direction: "up", sparkline: [18, 24, 31, 42, 58] },
    createdAt: "2026-09-08T11:00:00Z",
    freshness: "active",
    isSample: true,
  },
  {
    id: "sig-alabang-corporate-campus",
    title: "1,500 – 3,000 sqm Suburban Headquarters Site Search",
    signalType: SIGNAL_TYPES.BUSINESS_EXPANSION,
    category: "OFFICE / CAMPUS",
    spaceType: "Office",
    location: "Filinvest City Core",
    district: "Alabang",
    city: "Muntinlupa",
    coords: { lat: 14.4239, lng: 121.0335 },
    areaSqm: { min: 1500, max: 3000 },
    budget: "₱950 – ₱1,250/sqm",
    timing: "Q2 2027",
    specs: ["Low-rise campus layout preferred", "Generous parking ratio 1:50 sqm", "Direct Skyway on-ramp access", "Adjacent greenery / park view"],
    summary: "Healthcare technology provider establishing southern Metro Manila shared service center.",
    requirements: {
      parkingRatio: "1 slot per 50 sqm",
      amenities: "Cafeteria & wellness center",
      power: "Dual substation feeder",
    },
    author: {
      scoutId: "SCOUT-6022",
      mode: "anonymous",
      trustTier: "VERIFIED ENTERPRISE",
      verified: true,
    },
    relevantCount: 31,
    savedCount: 16,
    matchingSpaces: [],
    actionType: "PROPOSE_SPACE",
    glyphType: "expansion",
    glyphData: { campusRadiusKm: 2.5, targetPax: 350 },
    createdAt: "2026-09-07T12:00:00Z",
    freshness: "active",
    isSample: true,
  },
  {
    id: "sig-bayarea-showroom",
    title: "800 – 1,200 sqm Luxury Automotive / Yacht Showroom Ground Floor",
    signalType: SIGNAL_TYPES.LOOKING_FOR,
    category: "RETAIL / COMMERCIAL",
    spaceType: "Retail",
    location: "Aseana City Boulevard",
    district: "Bay Area",
    city: "Parañaque",
    coords: { lat: 14.5266, lng: 120.9886 },
    areaSqm: { min: 800, max: 1200 },
    budget: "₱2,200 – ₱2,800/sqm",
    timing: "Q1 2027",
    specs: ["Minimum 6m ceiling height", "Reinforced floor slab 1,500 kg/sqm", "Curtain wall glass frontage > 25m", "Drive-in ramp access"],
    summary: "High-net-worth mobility dealership seeking unobstructed bayward promenade exposure.",
    requirements: {
      driveInAccess: "Direct vehicular ingress from main avenue",
      curtainWall: "Ultra-clear acoustic insulated glass",
      lighting: "High CRI showroom tracks",
    },
    author: {
      scoutId: "SCOUT-4481",
      mode: "public",
      name: "Oceanic Prestige Mobility",
      trustTier: "VERIFIED ENTERPRISE",
      verified: true,
    },
    relevantCount: 26,
    savedCount: 15,
    matchingSpaces: [],
    actionType: "PROPOSE_SPACE",
    glyphType: "volume",
    glyphData: { width: 35, depth: 25, height: 8, ceilingM: 6.2 },
    createdAt: "2026-09-06T15:00:00Z",
    freshness: "active",
    isSample: true,
  },
  {
    id: "sig-scoutit-intel-bgc-shift",
    title: "BGC West Subway Station Tunneling Accelerates Perimeter Demand +42%",
    signalType: SIGNAL_TYPES.SCOUTIT_INTELLIGENCE,
    category: "INFRASTRUCTURE & TRANSIT",
    spaceType: "Land / Mixed-Use",
    location: "11th Avenue & Kalayaan Perimeter",
    district: "BGC",
    city: "Taguig",
    coords: { lat: 14.5450, lng: 121.0540 },
    areaSqm: { min: 500, max: 2500 },
    budget: "Macro Synthesis",
    timing: "Active Infrastructure Milestone",
    specs: ["Subway tunneling within 200m", "Direct 18-minute NAIA airport connection by 2028", "Off-market acquisition pressure surging"],
    summary: "Aggregated ScoutIt telemetry records a 42% spike in private acquisition inquiries across the 11th Ave subway catchment corridor.",
    requirements: {
      telemetryWindow: "Past 90 days",
      verifiedInquiries: 114,
      sourceCorridor: "BGC West Subterranean Concourse",
    },
    author: {
      scoutId: "SCOUTIT-AI",
      mode: "system",
      name: "ScoutIt Spatial Intelligence",
      trustTier: "SYSTEM BENCHMARK",
      verified: true,
    },
    relevantCount: 124,
    savedCount: 88,
    matchingSpaces: [
      { title: "The Glasshouse BGC", slug: "the-glasshouse-bgc", distance: "180m" },
      { title: "11th Ave Perimeter Assemblage", slug: "the-glasshouse-bgc", distance: "290m" },
    ],
    actionType: "EXPLORE_DATA",
    glyphType: "pulse",
    glyphData: { intensity: 92, radiusM: 800, pulseSpeed: "slow" },
    createdAt: "2026-09-05T09:00:00Z",
    freshness: "aging",
    isSample: true,
  },
  {
    id: "sig-qc-studio-space",
    title: "1,000 – 2,200 sqm Soundproof Broadcast Production Soundstage",
    signalType: SIGNAL_TYPES.LOOKING_FOR,
    category: "STUDIO / PRODUCTION",
    spaceType: "Warehouse",
    location: "Triangle Park & Timog Perimeter",
    district: "Quezon City",
    city: "Quezon City",
    coords: { lat: 14.6507, lng: 121.0360 },
    areaSqm: { min: 1000, max: 2200 },
    budget: "₱800 – ₱1,100/sqm",
    timing: "Q4 2026",
    specs: ["Acoustic NC-25 soundproof rating", "Minimum 9m clear height to grid", "500kVA isolated clean power", "Dual drive-in sound lock doors"],
    summary: "Streaming entertainment studio sourcing dedicated virtual production and broadcast volume space.",
    requirements: {
      soundIsolation: "STC 55 minimum wall construction",
      gridLoad: "150 kg/point overhead rigging",
      cooling: "Low-velocity silent HVAC (NC-20)",
    },
    author: {
      scoutId: "SCOUT-2840",
      mode: "anonymous",
      trustTier: "VERIFIED ENTERPRISE",
      verified: true,
    },
    relevantCount: 33,
    savedCount: 18,
    matchingSpaces: [],
    actionType: "PROPOSE_SPACE",
    glyphType: "volume",
    glyphData: { width: 38, depth: 32, height: 20, ceilingM: 9.5 },
    createdAt: "2026-09-04T16:00:00Z",
    freshness: "aging",
    isSample: true,
  },
  {
    id: "sig-clark-cold-storage",
    title: "Upcoming 4,500 sqm Agri-Pharma High-Cube Cold Storage Facility",
    signalType: SIGNAL_TYPES.UPCOMING_SUPPLY,
    category: "INDUSTRIAL / COLD CHAIN",
    spaceType: "Warehouse",
    location: "Clark Global City Logistics Park",
    district: "Clark",
    city: "Clark",
    coords: { lat: 15.1833, lng: 120.5333 },
    areaSqm: { min: 2000, max: 4500 },
    budget: "₱650 – ₱850/sqm",
    timing: "Q1 2027 Commissioning",
    specs: ["Dual-temperature zone (-25°C / +4°C)", "12m clear high-bay racking", "Solar-assisted 1MW backup power", "Subic-Clark expressway direct tollway gate"],
    summary: "State-of-the-art cold chain hub serving Central Luzon export corridor; advance lease commitments open.",
    requirements: {
      temperatureRange: "-25°C to +8°C multi-zone",
      dockLevelers: "14 automated hydraulic docks",
      certifications: "GMP / ISO 22000 compliant",
    },
    author: {
      scoutId: "SCOUT-5190",
      mode: "public",
      name: "Luzon Cold Chain Systems",
      trustTier: "VERIFIED ASSET TRUSTEE",
      verified: true,
    },
    relevantCount: 41,
    savedCount: 25,
    matchingSpaces: [],
    actionType: "VIEW_SPACE",
    glyphType: "supply_demand",
    glyphData: { supplyRate: 90, demandRate: 75, status: "EXPANDING" },
    createdAt: "2026-09-03T10:00:00Z",
    freshness: "aging",
    isSample: true,
  },
];

/**
 * Calculates a normalized signal intensity between 0.0 and 1.0.
 * Avoids raw post-count dominance by factoring in community confirmation,
 * structured completeness, author verification, and freshness decay.
 */
export function computeNormalizedSignalStrength(signal) {
  if (!signal) return 0.5;

  let score = 0.35; // base presence

  // Community verification factor (Relevant to Me)
  const relevant = Number(signal.relevantCount) || 0;
  score += Math.min(relevant / 80, 0.30);

  // Structured completeness factor
  if (signal.specs && signal.specs.length >= 3) score += 0.10;
  if (signal.budget && signal.budget !== "Unspecified") score += 0.08;
  if (signal.timing) score += 0.05;

  // Author verification bonus
  if (signal.author?.verified) score += 0.08;

  // Freshness decay
  if (signal.freshness === "aging") score -= 0.12;
  else if (signal.freshness === "expired") score -= 0.25;

  return Math.max(0.15, Math.min(1.0, score));
}

/**
 * Derives district metrics for the live intelligence strip.
 */
export function getDistrictsSummary(signals = COMMUNITY_SIGNALS) {
  const summaryMap = new Map();

  // Initialize known districts
  Object.keys(DISTRICT_COORDS).forEach((dist) => {
    summaryMap.set(dist, {
      district: dist,
      count: 0,
      totalRelevant: 0,
      signals: [],
      ...DISTRICT_COORDS[dist],
    });
  });

  signals.forEach((sig) => {
    const d = sig.district || "BGC";
    if (summaryMap.has(d)) {
      const entry = summaryMap.get(d);
      entry.count += 1;
      entry.totalRelevant += sig.relevantCount || 0;
      entry.signals.push(sig);
    }
  });

  // Calculate trends for active districts
  return [...summaryMap.values()]
    .filter((d) => d.count > 0)
    .map((d) => {
      const trendLabel = `${d.count} ${d.count === 1 ? "update" : "updates"}`;

      return {
        ...d,
        trendLabel,
      };
    });
}

/**
 * Filter and search community signals based on text and discrete filters.
 */
export function filterSignals(signals = COMMUNITY_SIGNALS, {
  query = "",
  signalType = null,
  district = null,
  spaceType = null,
} = {}) {
  const q = (query || "").trim().toLowerCase();

  return signals.filter((sig) => {
    // 1. Signal Type filter
    if (signalType && sig.signalType !== signalType) return false;

    // 2. District filter
    if (district && sig.district !== district) return false;

    // 3. Space Type filter
    if (spaceType && sig.spaceType !== spaceType) return false;

    // 4. Query text search
    if (q) {
      const textCorpus = [
        sig.title,
        sig.summary,
        sig.location,
        sig.district,
        sig.city,
        sig.spaceType,
        sig.category,
        sig.budget,
        sig.timing,
        ...(sig.specs || []),
      ].join(" ").toLowerCase();

      // Check if all words match
      const words = q.split(/\s+/).filter(Boolean);
      const matchesAll = words.every((w) => textCorpus.includes(w));
      if (!matchesAll) return false;
    }

    return true;
  });
}

// ── Pipeline bridge: intel signals → radar beacons ─────────────────
// Layer 02 keeps TWO datasets that must never drift apart again (see
// layerTwoSearch tests): article/intel signals (Descent list) and
// community signals (radar terminal). Pipeline supply originates as
// article signals with lifecycle data; this bridge projects them into
// community-signal shape so the radar, strip, dossier feed, and filters
// all see them through the single `initialSignals` prop — no second
// source, no forked audience.
//
// Discipline, because a bridge is where invented data sneaks in:
// - signalType is always UPCOMING_SUPPLY (emerald = supply, one color
//   one meaning). Timing text differentiates stages, not new types.
// - Coordinates are NEVER invented: unresolvable district or non-numeric
//   lat/lng leaves the dossier update unpinned (honest absence beats a misplaced pin).
// - No budget, no specs, no author: shells carry none, so none is set.
//   Beacon pillars render shorter for it — correctly modest.
// - Every bridged record is stamped isSample while its source is mock,
//   so Connect flows simulate instead of filing real deals.

const MONTHS = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

// "September 2026" → Date. Anything else → null (never guess a date).
function parseMonthYear(value) {
  const m = String(value || "").trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  const year = Number(m[2]);
  if (month === undefined || !Number.isFinite(year)) return null;
  return new Date(year, month, 1);
}

// Resolve an article city to a known district key. Exact, then prefix,
// then longest-substring match ("Bridgetowne, Quezon City" → Quezon
// City). Null when nothing matches — the beacon is skipped, not guessed.
export function resolvePipelineDistrict(article) {
  const city = String(article?.city || "").trim();
  if (!city) return null;
  if (DISTRICT_COORDS[city]) return city;
  const lower = city.toLowerCase();
  for (const k of Object.keys(DISTRICT_COORDS)) {
    if (lower.startsWith(k.toLowerCase())) return k;
  }
  const hits = Object.keys(DISTRICT_COORDS).filter((k) =>
    lower.includes(k.toLowerCase())
  );
  hits.sort((a, b) => b.length - a.length);
  return hits[0] || null;
}

// Freshness for bridged shells: opening-today is date-verified today;
// otherwise fresh only while the article's own month is within 90 days.
// Anything older or undated reads "aging" — an undated shell must never
// wear a fresh dot.
function bridgeFreshness(article, lifecycle, now) {
  if (lifecycle === LIFECYCLE.OPENING_TODAY) return "fresh";
  const d = parseMonthYear(article?.date);
  if (!d) return "aging";
  const ageDays = Math.floor((now - d) / 86400000);
  return ageDays >= 0 && ageDays <= 90 ? "fresh" : "aging";
}

export function pipelineArticleToSignal(article, now = new Date()) {
  if (!article || typeof article !== "object") return null;
  const lc = effectiveLifecycle(article, now);
  if (!lc) return null;
  const mappedDistrict = resolvePipelineDistrict(article);
  const district = mappedDistrict || String(article.city || "").trim();
  const lat = article.lat == null || article.lat === "" ? NaN : Number(article.lat);
  const lng = article.lng == null || article.lng === "" ? NaN : Number(article.lng);
  if (!district) return null;
  // Keep a sourced update in the dossier when coordinates are absent.
  // The map generator skips it rather than inventing a pin.
  const coords = mappedDistrict && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  if (!article.slug || !article.title) return null;
  return {
    id: `pipeline-${article.slug}`,
    title: article.title,
    signalType: SIGNAL_TYPES.UPCOMING_SUPPLY,
    category: article.category || "",
    spaceType: article.category || "",
    location: article.city || "",
    district,
    city: DISTRICT_COORDS[district]?.city || article.city || "",
    coords,
    lifecycle: article.lifecycle || "",
    openingDate: article.openingDate || "",
    timing: timingLine(article, now),
    summary: article.excerpt || "",
    sourceName: article.sourceName || "",
    sourceUrl: article.sourceUrl || "",
    actionType: "EXPLORE_DATA",
    glyphType: "pulse",
    glyphData: {},
    // The dossier card reads author.scoutId unconditionally, so a bridged
    // record must carry a system author — never invent a person. Connect
    // flows already simulate on isSample records; live intel connect-to-
    // record is future work, not something this object enables silently.
    author: {
      scoutId: "SCOUTIT-RADAR",
      mode: "system",
      trustTier: "STAFF-CURATED INTEL",
      verified: false,
    },
    freshness: bridgeFreshness(article, lc, now),
    relevantCount: 0,
    savedCount: 0,
    matchingSpaces: [],
    createdAt: now.toISOString(),
    isSample: Boolean(article.isSample),
    pipelineLifecycle: lc,
  };
}

export function pipelineArticlesToSignals(articles, now = new Date()) {
  if (!Array.isArray(articles)) return [];
  const out = [];
  for (const a of articles) {
    const s = pipelineArticleToSignal(a, now);
    if (s) out.push(s);
  }
  return out;
}

/**
 * Generates GeoJSON collections for MapLibre:
 * 1. 3D extruded beacon pillars (fill-extrusion polygons)
 * 2. Ground pulse rings (line / fill circles)
 * 3. Centroid points with metadata for labeling
 */
export function generateBeaconGeoJSON(allSignals = COMMUNITY_SIGNALS, matchingSignalIds = new Set()) {
  const beacons = { type: "FeatureCollection", features: [] };
  const groundRings = { type: "FeatureCollection", features: [] };
  const beaconPoints = { type: "FeatureCollection", features: [] };

  const hasSearch = matchingSignalIds && matchingSignalIds.size > 0 && matchingSignalIds.size < allSignals.length;

  allSignals.forEach((sig) => {
    if (!sig.coords?.lng || !sig.coords?.lat) return;

    const isMatch = !hasSearch || matchingSignalIds.has(sig.id);
    const strength = computeNormalizedSignalStrength(sig);

    // Height mapped smoothly to strength: 90m base to 360m high activity
    const height = Math.round(90 + strength * 270);
    const color = SIGNAL_COLORS[sig.signalType] || SIGNAL_COLORS.LOOKING_FOR;

    // Opacity: 0.88 when matching or normal, 0.18 when dimmed by search
    const opacity = isMatch ? 0.88 : 0.18;
    const ringRadius = 0.14 + strength * 0.18; // km

    const props = {
      id: sig.id,
      title: sig.title,
      district: sig.district,
      signalType: sig.signalType,
      signalTypeLabel: SIGNAL_TYPE_LABELS[sig.signalType],
      color,
      height,
      opacity,
      isMatch,
      strength,
      relevantCount: sig.relevantCount,
    };

    // Pillar polygon: 55m radius hexagon/circle footprint
    const pillarPolygon = circlePolygon(sig.coords.lng, sig.coords.lat, 0.055, 12);
    beacons.features.push({
      type: "Feature",
      properties: props,
      geometry: pillarPolygon,
    });

    // Ground ring polygon: wider subtle pulse ring
    const groundPolygon = circlePolygon(sig.coords.lng, sig.coords.lat, ringRadius, 24);
    groundRings.features.push({
      type: "Feature",
      properties: props,
      geometry: groundPolygon,
    });

    // Centroid point for interaction & labels
    beaconPoints.features.push({
      type: "Feature",
      properties: props,
      geometry: { type: "Point", coordinates: [sig.coords.lng, sig.coords.lat] },
    });
  });

  return { beacons, groundRings, beaconPoints };
}
