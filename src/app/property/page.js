"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReactionButtons from "@/components/ui/ReactionButtons";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import dynamic from "next/dynamic";
const InteractiveRadiusMap = dynamic(() => import("@/components/property/InteractiveRadiusMap"), { 
  ssr: false, 
  loading: () => <div style={{ height: 400, background: "#121212", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>LOADING RADAR...</span></div>
});

import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import ComparisonMatrix from "@/components/property/ComparisonMatrix";
import { motion, AnimatePresence } from "framer-motion";
import "./property.css";

// Dictionary mapping local mockDb slugs to correct UI SpaceCategories
const MOCK_CATEGORIES = {
  "batasan-hills": "Residential",
  "aurelia-residences": "Residential",
  "the-estate-makati": "Residential",
  "gridwork-studio": "Commercial",
  "zuellig-building": "Commercial",
  "arthaland-century-pacific": "Commercial",
  "pacific-edge-villa": "STR",
  "siargao-tropical-villa": "STR",
  "boracay-bamboo-hideaway": "STR",
  "palawan-eco-retreat": "Hospitality",
  "coron-island-resort": "Hospitality",
  "bohol-treehouse-lodge": "Hospitality",
  "gallery-by-chele": "Restaurants",
  "antonios-tagaytay": "Restaurants",
  "the-glasshouse-bgc": "Venues",
  "solaire-grand-ballroom": "Venues",
  "sky-pavilion-makati": "Venues"
};

// Carry the category-spec + price fields through the card mappers (the source
// objects have them; the old mappers cherry-picked them away). Spread into each
// card literal so cards can render category-aware specs + SOP §9 price.
function cardExtras(p) {
  return {
    listed_price:      p.listed_price || "",
    price_status:      p.price_status || "",
    price_verified_by: p.price_verified_by || "",
    cat:               p.cat || null,
    seating_capacity:  p.seating_capacity || "",
    standing_capacity: p.standing_capacity || "",
    hosting_capacity:  p.hosting_capacity || "",
    accommodations:    p.accommodations || "",
    kitchen_grade:     p.kitchen_grade || "",
    setup_grade:       p.setup_grade || "",
  };
}

// Single card mapper (replaces 4 near-duplicate inline literals). cat is the
// resolved SpaceCategory; fallbackHook keeps each call site's original copy.
function toCard(p, cat, fallbackHook) {
  return {
    id:            p.id ?? p.slug,
    slug:          p.slug || p.id,
    title:         p.title,
    city:          p.city || "",
    location:      p.location || "",
    spaceCategory: cat,
    aestheticTag:  p.aestheticTag || null,
    beds:          p.beds,
    baths:         p.baths,
    floor_sqm:     p.floor_sqm,
    image:         p.image || p.photos?.[0] || "",
    hook:          p.hook || fallbackHook,
    ...cardExtras(p),
  };
}

// COMPLIANCE: no price is shown on directory cards. All monetary values render
// ONLY in the property page's "Your Move" section (real-estate-law compliance).

// Category-appropriate card specs (offices show grade, restaurants seating,
// venues capacity, etc.) instead of residential beds/sqm for everything.
// NOTE: never push a monetary value here — money belongs only in "Your Move".
function getCardSpecBadges(p) {
  const cat = (p.spaceCategory || "").toLowerCase();
  const out = [];
  const sqm = p.floor_sqm > 0 ? `${p.floor_sqm} sqm` : null;
  if (cat.includes("commercial") || cat.includes("office") || cat.includes("retail")) {
    const c = p.cat?.commercial;
    // No rent on cards — money is "Your Move" only.
    if (c?.buildingGrade) out.push(c.buildingGrade);
    if (sqm) out.push(sqm);
  } else if (cat.includes("restaurant") || cat.includes("culinary")) {
    if (p.seating_capacity) out.push(`${p.seating_capacity} seats`);
    if (sqm) out.push(sqm);
  } else if (cat.includes("venue") || cat.includes("event")) {
    if (p.seating_capacity) out.push(String(p.seating_capacity));
    else if (p.standing_capacity) out.push(`${p.standing_capacity} pax`);
    if (sqm) out.push(sqm);
  } else if (cat.includes("hospitality")) {
    if (p.hosting_capacity) out.push(`${p.hosting_capacity} keys`);
    if (p.accommodations) out.push(String(p.accommodations));
  } else if (cat.includes("str")) {
    if (p.beds > 0) out.push(`${p.beds} BR`);
    if (p.accommodations) out.push(String(p.accommodations));
    if (sqm) out.push(sqm);
  } else {
    if (p.beds > 0) out.push(`${p.beds} Beds`);
    if (p.baths > 0) out.push(`${p.baths} Baths`);
    if (sqm) out.push(sqm);
  }
  return out;
}

// Internal-only: first number group in a price string ("Php 850/sqm/mo" → 850).
// Used solely to bucket a listing into a qualitative band. NEVER rendered —
// money is "Your Move" only (compliance).
function parsePrice(str) {
  if (!str) return null;
  const m = String(str).replace(/,/g, "").match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// Qualitative price bands. Thresholds (PHP) are internal filter logic; only the
// `label` is ever shown to users — no peso amounts appear in the UI (compliance).
const PRICE_BANDS = [
  { label: "Entry",   min: 0,        max: 1000000 },
  { label: "Mid",     min: 1000000,  max: 10000000 },
  { label: "Premium", min: 10000000, max: 50000000 },
  { label: "Trophy",  min: 50000000, max: Infinity },
];

const gridVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
};

function PropertyDirectoryContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");

  // State
  const [rawProperties, setRawProperties] = useState([]);
  const [rawIntel, setRawIntel] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedAesthetics, setSelectedAesthetics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mobile filter drawer (≤900px) — listings show first, filters on demand
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Proximity Radar State
  const [showMap, setShowMap] = useState(false);
  const [radius, setRadius] = useState("any");
  const [centerLng, setCenterLng] = useState(121.0215);
  const [centerLat, setCenterLat] = useState(14.5547);

  // Price Band State — qualitative tiers only (Entry/Mid/Premium/Trophy).
  // No monetary amounts are ever displayed; thresholds live in code for filtering.
  const [selectedPriceBands, setSelectedPriceBands] = useState([]);

  // Collapsible panels state
  const [openFilters, setOpenFilters] = useState({
    sectors: true,
    prices: true,
    locations: true,
    aesthetics: false,
    buildingGrades: true,
  });

  // Polymorphic Filter States
  const [selectedBuildingGrades, setSelectedBuildingGrades] = useState([]);
  const [selectedBeds, setSelectedBeds] = useState([]);

  // Comparison Matrix State
  const [compareList, setCompareList] = useState([]);
  const [showMatrix, setShowMatrix] = useState(false);

  const toggleCompare = (p, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCompareList(prev => {
      const exists = prev.find(item => item.id === p.id);
      if (exists) return prev.filter(item => item.id !== p.id);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  // Pre-filter on URL category parameters
  useEffect(() => {
    if (initialType) {
      const matched = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"].find(
        s => s.toLowerCase() === initialType.toLowerCase() || 
             (s === "Venues/Events" && (initialType.toLowerCase() === "venues" || initialType.toLowerCase() === "venues/events" || initialType.toLowerCase() === "events"))
      );
      if (matched) {
        setSelectedSectors([matched]);
      }
    }
  }, [initialType]);

  // Load Airtable CMS data with mock fallback (now supports Supabase Radius)
  useEffect(() => {
    async function loadCMSData() {
      try {
        const res = await fetch(`/api/cms?radius=${radius}&lng=${centerLng}&lat=${centerLat}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        // 1. Group and format properties
        const airtableProperties = data.properties || [];
        
        let mergedProperties = [];
        
        if (data.source === "supabase_radius") {
          // Strict Radius Search: Only show properties returned by the PostGIS query
          mergedProperties = airtableProperties.map(p =>
            toCard(p, p.spaceCategory || null, "Premium curated property briefing.")
          );
        } else {
          // Standard Load: Merge Airtable with Local Mock Fallback
          const baseProperties = [];

          mergedProperties = [...baseProperties];
          airtableProperties.forEach(p => {
            if (!p.title || !p.slug || !p.spaceCategory) return;
            if (!mergedProperties.some(x => x.slug === p.slug || x.id === p.id)) {
              mergedProperties.unshift(
                toCard(p, p.spaceCategory || null, "Vetted dynamic listing brief.")
              );
            }
          });
        }

        setRawProperties(mergedProperties);

        // 2. Load intel reports
        const airtableIntel = data.intel || [];
        const baseIntel = [];

        const mergedIntel = [...baseIntel];
        airtableIntel.forEach(item => {
          if (!mergedIntel.some(x => x.slug === item.slug)) {
            let category = item.category || null;
            if (category.toLowerCase() === "hospitality") category = "Hospitality";
            if (category.toLowerCase() === "str") category = "STR";
            if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
            if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
            mergedIntel.unshift({
              slug: item.slug || item.id,
              title: item.title,
              category,
              date: item.date || null
            });
          }
        });

        setRawIntel(mergedIntel);
      } catch (err) {
        // Fallback strictly to local mockDb
        const baseProperties = [];
        setRawProperties(baseProperties);

        const baseIntel = [];
        setRawIntel(baseIntel);
      } finally {
        setLoading(false);
      }
    }

    loadCMSData();
  }, [radius, centerLng, centerLat]);

  const toggleFilterSection = (section) => {
    setOpenFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const normalizeCity = (city) => {
    if (!city) return "";
    let c = city.trim();
    if (c.toLowerCase() === "pasay") return "Pasay City";
    if (c.toLowerCase() === "taguig") return "Taguig City";
    if (c.toLowerCase() === "makati") return "Makati City";
    if (c.toLowerCase() === "quezon") return "Quezon City";
    if (c.toLowerCase() === "paranaque" || c.toLowerCase() === "parañaque") return "Parañaque City";
    return c;
  };

  // Compile filter choices dynamically based on loaded property options
  const sectors = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];
  const locations = Array.from(new Set(rawProperties.map(p => normalizeCity(p.city)).filter(Boolean)));
  const aesthetics = Array.from(new Set(rawProperties.map(p => p.aestheticTag).filter(Boolean)));
  const buildingGrades = Array.from(new Set(rawProperties.filter(p => p.spaceCategory === "Commercial").map(p => p.cat?.commercial?.buildingGrade).filter(Boolean)));
  const bedOptions = ["1", "2", "3", "4+"];

  const handleCheckboxChange = (val, state, setState) => {
    if (state.includes(val)) {
      setState(state.filter(item => item !== val));
    } else {
      setState([...state, val]);
    }
  };

  // Filter properties dynamically
  const filteredProperties = rawProperties.filter(p => {
    // Sector filter
    if (selectedSectors.length > 0) {
      const mappedSectors = selectedSectors.map(s => {
        if (s === "Venues/Events") return "Venues";
        return s;
      });
      let cat = p.spaceCategory;
      if (!mappedSectors.includes(cat)) {
        return false;
      }
    }
    // Location filter
    if (selectedLocations.length > 0 && !selectedLocations.includes(normalizeCity(p.city))) {
      return false;
    }
    // Aesthetic filter
    if (selectedAesthetics.length > 0 && !selectedAesthetics.includes(p.aestheticTag)) {
      return false;
    }
    // Price Band filter — buckets by internal price magnitude; no amounts shown.
    if (selectedPriceBands.length > 0) {
      const pPrice = parsePrice(p.listed_price);
      if (pPrice === null) return false; // no price on record → excluded when banding
      const inBand = selectedPriceBands.some(label => {
        const band = PRICE_BANDS.find(b => b.label === label);
        return band && pPrice >= band.min && pPrice < band.max;
      });
      if (!inBand) return false;
    }
    // Polymorphic filter: Building Grade (Commercial)
    if (selectedSectors.includes("Commercial") && selectedBuildingGrades.length > 0) {
      const bg = p.cat?.commercial?.buildingGrade;
      if (!bg || !selectedBuildingGrades.includes(bg)) return false;
    }
    // Polymorphic filter: Bedrooms (Residential)
    if (selectedSectors.includes("Residential") && selectedBeds.length > 0) {
      if (!p.beds) return false;
      const bedMatch = selectedBeds.some(bedLabel => {
        if (bedLabel === "4+") return p.beds >= 4;
        return p.beds === parseInt(bedLabel);
      });
      if (!bedMatch) return false;
    }
    // Search query matches title, city, location, category, or aesthetic tag
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCity = p.city.toLowerCase().includes(q);
      const matchLocation = p.location.toLowerCase().includes(q);
      const matchCategory = p.spaceCategory.toLowerCase().includes(q);
      const matchAesthetic = p.aestheticTag.toLowerCase().includes(q);
      return matchTitle || matchCity || matchLocation || matchCategory || matchAesthetic;
    }
    return true;
  });

  // Compile Dynamic "Neighborhood Intel" Sidebar Widget
  const getWidgetArticles = () => {
    if (selectedLocations.length > 0) {
      // Find articles matching selected locations
      return rawIntel.filter(art => selectedLocations.some(loc => art.title.toLowerCase().includes(loc.toLowerCase()) || art.slug.toLowerCase().includes(loc.toLowerCase().replace(/\s+/g, '-'))));
    }
    if (selectedSectors.length > 0) {
      // Find articles matching selected sectors
      const mappedSectors = selectedSectors.map(s => {
        if (s === "Venues/Events") return "Venues";
        return s;
      });
      return rawIntel.filter(art => {
        let cat = art.category;
        return mappedSectors.includes(cat);
      });
    }
    // Return newest general articles
    return rawIntel.slice(0, 3);
  };

  const widgetArticles = getWidgetArticles().slice(0, 3);

  return (
    <div className="directory-layout">
      <AtmosphereBackground variant="default" />
      <Header />
      <main className="directory-main">
        <header className="directory-header">
          <span className="vector-label">Layer 3.1 // Directory Ledger</span>
          <h1>The Space Directory</h1>
          <p className="page-subtitle">Every home, office, and venue on ScoutIt — searchable in one place.</p>
        </header>

        {loading ? (
          // Reserve the same vertical footprint the loaded grid will occupy, so
          // the footer stays below the fold through the swap instead of sitting
          // high here and then leaping down when cards arrive (the CLS source).
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>LOADING THE DIRECTORY...</h3>
          </div>
        ) : (
          <div className="directory-container">
            {/* Mobile: filters collapse behind one toggle so listings appear immediately */}
            <button
              className="mobile-filters-toggle"
              onClick={() => setShowMobileFilters((v) => !v)}
              aria-expanded={showMobileFilters}
            >
              Filters {(selectedSectors.length + selectedLocations.length + selectedAesthetics.length) > 0 ? `(${selectedSectors.length + selectedLocations.length + selectedAesthetics.length})` : ""}
              <span className={`filter-chevron ${showMobileFilters ? "open" : ""}`}>▼</span>
            </button>

            {/* Sidebar Filters */}
            <aside className={`filters-sidebar ${showMobileFilters ? "mobile-open" : ""}`}>
              
              {/* Filter Section: Sectors */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("sectors")}>
                  Sectors
                  <span className={`filter-chevron ${openFilters.sectors ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.sectors && (
                  <div className="filter-options">
                    {sectors.map(sec => (
                      <label key={sec} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedSectors.includes(sec)}
                          onChange={() => handleCheckboxChange(sec, selectedSectors, setSelectedSectors)}
                        />
                        {sec}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Polymorphic Filter: Building Grades (Only shown if Commercial is selected) */}
              {selectedSectors.includes("Commercial") && buildingGrades.length > 0 && (
                <div className="filter-card animate-[fadeIn_0.3s_ease-out]">
                  <button className="filter-trigger" onClick={() => toggleFilterSection("buildingGrades")}>
                    Building Grade
                    <span className={`filter-chevron ${openFilters.buildingGrades ? "open" : ""}`}>▼</span>
                  </button>
                  {openFilters.buildingGrades && (
                    <div className="filter-options">
                      {buildingGrades.map(grade => (
                        <label key={grade} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={selectedBuildingGrades.includes(grade)}
                            onChange={() => handleCheckboxChange(grade, selectedBuildingGrades, setSelectedBuildingGrades)}
                          />
                          {grade}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Polymorphic Filter: Bedrooms (Only shown if Residential is selected) */}
              {selectedSectors.includes("Residential") && (
                <div className="filter-card animate-[fadeIn_0.3s_ease-out]">
                  <div className="filter-options mt-2">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest mb-2 block">Bedrooms</span>
                    <div className="flex gap-2 flex-wrap">
                      {bedOptions.map(bed => (
                        <button
                          key={bed}
                          className={`px-3 py-1 text-xs border rounded-full transition-colors ${selectedBeds.includes(bed) ? 'border-gold-accent bg-gold-accent/20 text-gold-accent' : 'border-surface-variant bg-surface text-text-secondary hover:border-text-secondary'}`}
                          onClick={() => handleCheckboxChange(bed, selectedBeds, setSelectedBeds)}
                        >
                          {bed} {bed !== "4+" && "BR"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Section: Price Band — qualitative tiers only, NO peso amounts
                  (compliance). Buckets by internal price magnitude; price itself is
                  shown only in the property page's "Your Move" section. */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("prices")}>
                  Price Band
                  <span className={`filter-chevron ${openFilters.prices ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.prices && (
                  <div className="filter-options">
                    {PRICE_BANDS.map(band => (
                      <label key={band.label} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedPriceBands.includes(band.label)}
                          onChange={() => handleCheckboxChange(band.label, selectedPriceBands, setSelectedPriceBands)}
                        />
                        {band.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Section: Locations */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("locations")}>
                  Locations
                  <span className={`filter-chevron ${openFilters.locations ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.locations && (
                  <div className="filter-options">
                    {locations.map(loc => (
                      <label key={loc} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedLocations.includes(loc)}
                          onChange={() => handleCheckboxChange(loc, selectedLocations, setSelectedLocations)}
                        />
                        {loc}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Filter Section: Aesthetics */}
              <div className="filter-card">
                <button className="filter-trigger" onClick={() => toggleFilterSection("aesthetics")}>
                  Aesthetics
                  <span className={`filter-chevron ${openFilters.aesthetics ? "open" : ""}`}>▼</span>
                </button>
                {openFilters.aesthetics && (
                  <div className="filter-options">
                    {aesthetics.map(aes => (
                      <label key={aes} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          className="filter-checkbox"
                          checked={selectedAesthetics.includes(aes)}
                          onChange={() => handleCheckboxChange(aes, selectedAesthetics, setSelectedAesthetics)}
                        />
                        {aes}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Dynamic Sidebar Widget: Neighborhood Intel */}
              <div className="intel-widget">
                <div className="intel-widget-header">Neighborhood Intel</div>
                <div className="intel-widget-list">
                  {widgetArticles.length > 0 ? (
                    widgetArticles.map(art => (
                      <Link href={`/intel/${art.slug}`} key={art.slug} className="intel-widget-item">
                        <h4>{art.title}</h4>
                        <span>{art.category} &middot; {art.date}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="intel-widget-empty">
                      No matching editorial dispatches recorded for this selection.
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Search Input & Properties Grid */}
            <section style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
              <div className="search-wrapper" style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "16px" }}>
                <input
                  type="text"
                  className="global-search-input"
                  placeholder="SEARCH DIRECTORY LEDGER BY KEYWORD, CITY, OR DESIGN TAG..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flexGrow: 1, margin: 0 }}
                />
                <button 
                  onClick={() => setShowMap(!showMap)}
                  style={{
                    background: showMap ? "#E8AE3C" : "#0d0d0d",
                    color: showMap ? "#000" : "#E8AE3C",
                    border: "1px solid #E8AE3C",
                    padding: "0 24px",
                    height: "44px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    fontWeight: "bold",
                    transition: "all 0.2s"
                  }}
                >
                  {showMap ? "✕ CLOSE RADAR" : "🗺️ PROXIMITY RADAR"}
                </button>
              </div>

              {showMap && (
                <InteractiveRadiusMap 
                  initialLng={centerLng}
                  initialLat={centerLat}
                  onClose={() => setShowMap(false)}
                  onSearch={(newRadiusKm, newLng, newLat) => {
                    setRadius(newRadiusKm);
                    setCenterLng(newLng);
                    setCenterLat(newLat);
                  }}
                />
              )}

              <motion.div className="directory-grid" variants={gridVariants} initial="hidden" animate="visible">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map(p => {
                    const specBadges = getCardSpecBadges(p);
                    return (
                    <motion.div key={p.id} variants={cardVariants}>
                      <Link href={`/property/${p.slug}`} className="property-preview-card">
                      <div className="property-card-visual">
                        <span className="property-city-badge">{p.city}</span>
                        { }
                        {p.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={p.image} alt={p.title} className="property-card-img" loading="lazy" />
                        ) : (
                          <ImagePlaceholder className="property-card-img" label={p.title} />
                        )}
                      </div>

                      <div className="property-card-body">
                        <h3>{p.title}</h3>
                        <p className="hook">{p.hook}</p>

                        {/* Price intentionally omitted on cards — shown only in "Your Move" (compliance). */}

                        <div className="property-spec-badges">
                          <span className="property-spec-badge">{p.spaceCategory}</span>
                          {p.aestheticTag && <span className="property-spec-badge">{p.aestheticTag}</span>}
                          {specBadges.map((b, i) => (
                            <span key={i} className="property-spec-badge">{b}</span>
                          ))}
                        </div>

                        <div className="property-card-footer">
                          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button 
                              className={`compare-toggle-btn ${compareList.find(item => item.id === p.id) ? 'active' : ''}`}
                              onClick={(e) => toggleCompare(p, e)}
                            >
                              {compareList.find(item => item.id === p.id) ? "✓ Added" : "+ Compare"}
                            </button>
                            <ReactionButtons
                              propertyId={p.id}
                              propertyTitle={p.title}
                              category={p.spaceCategory}
                              city={p.city}
                              small={true}
                            />
                          </div>
                          <span className="property-action-btn">Enter Showcase →</span>
                        </div>
                      </div>
                    </Link>
                    </motion.div>
                    );
                  })
                ) : (
                  <div className="directory-empty">
                    <h3>No matching spaces found</h3>
                    <p>Try clearing some filters or refining your search parameters.</p>
                  </div>
                )}
              </motion.div>
            </section>
          </div>
        )}

        {compareList.length > 0 && (
          <div className="compare-action-bar">
            <div className="compare-count">
              COMPARING {compareList.length}/3 ASSETS
            </div>
            <div className="compare-actions">
              <button className="compare-clear" onClick={() => setCompareList([])}>Clear</button>
              <button className="compare-view" onClick={() => setShowMatrix(true)}>View Matrix</button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {showMatrix && (
            <ComparisonMatrix 
              properties={compareList} 
              onClose={() => setShowMatrix(false)} 
            />
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

export default function PropertyRootPage() {
  return (
    <Suspense fallback={
      <div className="directory-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>LOADING DIRECTORY LEDGER...</h3>
      </div>
    }>
      <PropertyDirectoryContent />
    </Suspense>
  );
}
