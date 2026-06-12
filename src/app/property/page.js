"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReactionButtons from "@/components/ui/ReactionButtons";
import InteractiveRadiusMap from "@/components/property/InteractiveRadiusMap";
import { getProperties } from "@/data/mockProperties";
import { getArticles } from "@/data/mockArticles";
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
  
  // Proximity Radar State
  const [showMap, setShowMap] = useState(false);
  const [radius, setRadius] = useState("any");
  const [centerLng, setCenterLng] = useState(121.0215);
  const [centerLat, setCenterLat] = useState(14.5547);

  // Collapsible panels state
  const [openFilters, setOpenFilters] = useState({
    sectors: true,
    locations: true,
    aesthetics: false,
  });

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
          mergedProperties = airtableProperties.map(p => ({
            id: p.id,
            slug: p.slug || p.id,
            title: p.title,
            city: p.city || "",
            location: p.location || "",
            spaceCategory: p.spaceCategory || "Residential",
            aestheticTag: p.aestheticTag || "Modernist",
            beds: p.beds,
            baths: p.baths,
            floor_sqm: p.floor_sqm,
            image: p.image || p.photos?.[0] || "",
            hook: p.hook || "Premium curated property briefing."
          }));
        } else {
          // Standard Load: Merge Airtable with Local Mock Fallback
          const baseProperties = getProperties().map(p => {
            let cat = MOCK_CATEGORIES[p.slug] || p.spaceCategory || "Residential";
            return {
              id: p.slug,
              slug: p.slug,
              title: p.title,
              city: p.city,
              location: p.location,
              spaceCategory: cat,
              aestheticTag: p.aestheticTag || "Modernist",
              beds: p.beds,
              baths: p.baths,
              floor_sqm: p.floor_sqm,
              image: p.photos?.[0] || p.image || "",
              hook: p.hook || "Premium curated property briefing."
            };
          });

          mergedProperties = [...baseProperties];
          airtableProperties.forEach(p => {
            if (!p.title || !p.slug || !p.spaceCategory) return;
            if (!mergedProperties.some(x => x.slug === p.slug || x.id === p.id)) {
              let cat = p.spaceCategory || "Residential";
              mergedProperties.unshift({
                id: p.id,
                slug: p.slug || p.id,
                title: p.title,
                city: p.city || "",
                location: p.location || "",
                spaceCategory: cat,
                aestheticTag: p.aestheticTag || "Modernist",
                beds: p.beds,
                baths: p.baths,
                floor_sqm: p.floor_sqm,
                image: p.image || (p.photos?.[0]) || "",
                hook: p.hook || "Vetted dynamic listing brief."
              });
            }
          });
        }

        setRawProperties(mergedProperties);

        // 2. Load intel reports
        const airtableIntel = data.intel || [];
        const baseIntel = getArticles().map(art => {
          let category = art.category || "Residential";
          if (category.toLowerCase() === "hospitality") category = "Hospitality";
          if (category.toLowerCase() === "str") category = "STR";
          if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
          if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
          return {
            slug: art.slug,
            title: art.title,
            category,
            date: art.date
          };
        });

        const mergedIntel = [...baseIntel];
        airtableIntel.forEach(item => {
          if (!mergedIntel.some(x => x.slug === item.slug)) {
            let category = item.category || "Residential";
            if (category.toLowerCase() === "hospitality") category = "Hospitality";
            if (category.toLowerCase() === "str") category = "STR";
            if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
            if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
            mergedIntel.unshift({
              slug: item.slug || item.id,
              title: item.title,
              category,
              date: item.date || "Just Now"
            });
          }
        });

        setRawIntel(mergedIntel);
      } catch (err) {
        // Fallback strictly to local mockDb
        const baseProperties = getProperties().map(p => {
          let cat = MOCK_CATEGORIES[p.slug] || p.spaceCategory || "Residential";
          return {
            id: p.slug,
            slug: p.slug,
            title: p.title,
            city: p.city,
            location: p.location,
            spaceCategory: cat,
            aestheticTag: p.aestheticTag || "Modernist",
            beds: p.beds,
            baths: p.baths,
            floor_sqm: p.floor_sqm,
            image: p.photos?.[0] || p.image || "",
            hook: p.hook || "Premium curated property briefing."
          };
        });
        setRawProperties(baseProperties);

        const baseIntel = getArticles().map(art => {
          let category = art.category || "Residential";
          if (category.toLowerCase() === "hospitality") category = "Hospitality";
          if (category.toLowerCase() === "str") category = "STR";
          if (category.toLowerCase() === "culinary" || category.toLowerCase() === "restaurants") category = "Restaurants";
          if (category.toLowerCase() === "venues" || category.toLowerCase() === "events") category = "Venues";
          return {
            slug: art.slug,
            title: art.title,
            category,
            date: art.date
          };
        });
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

  // Compile filter choices dynamically based on loaded property options
  const sectors = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];
  const locations = Array.from(new Set(rawProperties.map(p => p.city).filter(Boolean)));
  const aesthetics = Array.from(new Set(rawProperties.map(p => p.aestheticTag).filter(Boolean)));

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
    if (selectedLocations.length > 0 && !selectedLocations.includes(p.city)) {
      return false;
    }
    // Aesthetic filter
    if (selectedAesthetics.length > 0 && !selectedAesthetics.includes(p.aestheticTag)) {
      return false;
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
      <Header />
      <main className="directory-main">
        <header className="directory-header">
          <span className="vector-label">Layer 01 // Curated Showcases</span>
          <h1>The Space Directory</h1>
          <p className="page-subtitle">Every home, office, and venue on ScoutIt — searchable in one place.</p>
        </header>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <h3 style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>LOADING THE DIRECTORY...</h3>
          </div>
        ) : (
          <div className="directory-container">
            {/* Sidebar Filters */}
            <aside className="filters-sidebar">
              
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
                    background: showMap ? "#ffb800" : "#0d0d0d",
                    color: showMap ? "#000" : "#ffb800",
                    border: "1px solid #ffb800",
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

              <div className="directory-grid">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map(p => (
                    <Link href={`/property/${p.slug}`} key={p.id} className="property-preview-card">
                      <div className="property-card-visual">
                        <span className="property-city-badge">{p.city}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt={p.title} className="property-card-img" />
                      </div>
                      
                      <div className="property-card-body">
                        <h3>{p.title}</h3>
                        <p className="hook">{p.hook}</p>
                        
                        <div className="property-spec-badges">
                          <span className="property-spec-badge">{p.spaceCategory}</span>
                          <span className="property-spec-badge">{p.aestheticTag}</span>
                          {p.beds > 0 && <span className="property-spec-badge">{p.beds} Beds</span>}
                          {p.floor_sqm > 0 && <span className="property-spec-badge">{p.floor_sqm} sqm</span>}
                        </div>

                        <div className="property-card-footer">
                          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
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
                  ))
                ) : (
                  <div className="directory-empty">
                    <h3>No matching spaces found</h3>
                    <p>Try clearing some filters or refining your search parameters.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
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
