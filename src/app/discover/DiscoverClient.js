"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactionButtons from "@/components/ui/ReactionButtons";
import { cityToRegion, regionOf } from "@/lib/regions";
import Footer from "@/components/layout/Footer";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import { DISCOVER_INTEL, DISCOVER_PROPERTIES, USE_MOCK_DATA } from "@/data/mock";
import DiscoverSearch from "@/components/discover/DiscoverSearch";
import "./discover.css";

const CATEGORIES = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];
function getDBCategory(cat) {
  if (cat === "Venues/Events") return "Venues";
  return cat;
}

export function formatDiscoverDatasets(airtableProperties = [], airtableIntel = []) {
  const nextProps = USE_MOCK_DATA ? {
    Residential: DISCOVER_PROPERTIES.Residential.map((property) => ({ ...property, is_sample: true })),
    Commercial: DISCOVER_PROPERTIES.Commercial.map((property) => ({ ...property, is_sample: true })),
    STR: DISCOVER_PROPERTIES.STR.map((property) => ({ ...property, is_sample: true })),
    Hospitality: DISCOVER_PROPERTIES.Hospitality.map((property) => ({ ...property, is_sample: true })),
    Restaurants: DISCOVER_PROPERTIES.Restaurants.map((property) => ({ ...property, is_sample: true })),
    Venues: DISCOVER_PROPERTIES.Venues.map((property) => ({ ...property, is_sample: true }))
  } : { Residential: [], Commercial: [], STR: [], Hospitality: [], Restaurants: [], Venues: [] };

  airtableProperties.forEach(p => {
    if (!p.title || !p.slug || !p.spaceCategory) return;
    let cat = p.spaceCategory;
    if (nextProps[cat]) {
      if (!nextProps[cat].some(x => x.id === p.id || x.id === p.slug || x.slug === p.slug)) {
        let density = "";
        if (cat === "Residential") {
          density = `${p.beds || 0} Bedrooms · ${p.floor_sqm || 0} sqm`;
        } else {
          density = `${p.property_type || "Premium Space"} · ${p.floor_sqm || 0} sqm`;
        }
        nextProps[cat].push({
          id: p.slug || p.id,
          slug: p.slug || p.id,
          title: p.title,
          city: p.city || "",
          region: regionOf(p),
          location: p.location || "",
          image: p.image || p.photos?.[0] || "",
          density,
          is_sample: p.is_sample === true,
        });
      }
    }
  });

  const nextIntel = USE_MOCK_DATA ? {
    Residential: [...DISCOVER_INTEL.Residential],
    Commercial: [...DISCOVER_INTEL.Commercial],
    STR: [...DISCOVER_INTEL.STR],
    Hospitality: [...DISCOVER_INTEL.Hospitality],
    Restaurants: [...DISCOVER_INTEL.Restaurants],
    Venues: [...DISCOVER_INTEL.Venues]
  } : { Residential: [], Commercial: [], STR: [], Hospitality: [], Restaurants: [], Venues: [] };

  airtableIntel.forEach(item => {
    let cat = item.category || "Residential";
    if (cat.toLowerCase() === "hospitality") cat = "Hospitality";
    if (cat.toLowerCase() === "str") cat = "STR";
    if (cat.toLowerCase() === "culinary" || cat.toLowerCase() === "restaurants") cat = "Restaurants";
    if (cat.toLowerCase() === "venues" || cat.toLowerCase() === "events") cat = "Venues";

    if (nextIntel[cat]) {
      if (!nextIntel[cat].some(x => x.slug === item.slug)) {
        nextIntel[cat].push({
          id: item.id,
          slug: item.slug || item.id,
          category: item.intelType || "BRIEFING",
          date: item.date || "Just Now",
          region: regionOf(item),
          title: item.title,
          snippet: item.excerpt || ""
        });
      }
    }
  });

  return { properties: nextProps, intel: nextIntel };
}

export default function DiscoverClient({ initialProperties = [], initialIntel = [] }) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "residential";
  const initialRegionParam = searchParams.get("region");
  const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === typeParam.toLowerCase()) || "Residential";

  const initialDatasets = useMemo(() => formatDiscoverDatasets(initialProperties, initialIntel), [initialProperties, initialIntel]);
  const [allProperties, setAllProperties] = useState(() => initialDatasets.properties);
  const [allIntel, setAllIntel] = useState(() => initialDatasets.intel);

  const [properties, setProperties] = useState([]);
  const [intel, setIntel] = useState([]);
  const [activeSpotlightId, setActiveSpotlightId] = useState(null);

  // Authoritative region selection state: string | null (null = All Regions)
  const [activeRegion, setActiveRegion] = useState(() => {
    if (initialRegionParam) {
      return cityToRegion(initialRegionParam) || initialRegionParam;
    }
    return null;
  });

  // Fetch live CMS data from Airtable
  useEffect(() => {
    async function fetchCMS() {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        const formatted = formatDiscoverDatasets(data.properties || [], data.intel || []);
        setAllProperties(formatted.properties);
        setAllIntel(formatted.intel);
      } catch (err) {
        console.error("Discover page CMS load error:", err);
      }
    }

    fetchCMS();
  }, []);


  // Region search filter within the regions navigation bar
  const [regionQuery, setRegionQuery] = useState("");

  // Update category listings on matchedCategory or CMS data load
  useEffect(() => {
    const dbCategory = getDBCategory(matchedCategory);
    const list = allProperties[dbCategory] || [];
    setProperties(list);
    setIntel(allIntel[dbCategory] || []);
    setActiveSpotlightId(null);
    setActiveRegion(initialRegionParam ? cityToRegion(initialRegionParam) : null);
    setRegionQuery("");
  }, [matchedCategory, allProperties, allIntel, initialRegionParam]);

  // Regions available in the current category (derived from BOTH properties and intel)
  const regions = useMemo(() => {
    const seen = new Set();
    properties.forEach(p => {
      const r = regionOf(p);
      if (r) seen.add(r);
    });
    intel.forEach(n => {
      const r = regionOf(n);
      if (r) seen.add(r);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [properties, intel]);

  const shownRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(r => r.toLowerCase().includes(q));
  }, [regions, regionQuery]);

  const regionCounts = useMemo(() => {
    const counts = new Map();
    const entryFor = (region) => counts.get(region) || { intel: 0, spaces: 0 };

    properties.forEach((property) => {
      const region = regionOf(property);
      if (!region) return;
      const entry = entryFor(region);
      counts.set(region, { ...entry, spaces: entry.spaces + 1 });
    });
    intel.forEach((briefing) => {
      const region = regionOf(briefing);
      if (!region) return;
      const entry = entryFor(region);
      counts.set(region, { ...entry, intel: entry.intel + 1 });
    });

    return counts;
  }, [properties, intel]);

  // 1. Regional News Feed (filtered by authoritative activeRegion)
  const filteredIntel = useMemo(() => {
    if (!activeRegion) return intel;
    return intel.filter(n => regionOf(n) === activeRegion);
  }, [intel, activeRegion]);

  // 3. Regional Spaces (filtered by authoritative activeRegion)
  const filteredProperties = useMemo(() => {
    if (!activeRegion) return properties;
    return properties.filter(p => regionOf(p) === activeRegion);
  }, [properties, activeRegion]);

  // Selecting a space card focuses it without breaking the regional filter
  const selectSpotlight = (property) => {
    setActiveSpotlightId(prev => (prev === property.id ? null : property.id));
  };

  // ── Drag-to-scroll for any horizontal row (News Feed + Spaces) ──
  const dragState = useRef(null);
  const movedRef = useRef(false);

  const onRowPointerDown = (e) => {
    const el = e.currentTarget;
    dragState.current = { el, startX: e.clientX, scrollLeft: el.scrollLeft };
    movedRef.current = false;
  };

  useEffect(() => {
    const onMove = (e) => {
      const d = dragState.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 4) movedRef.current = true;
      d.el.scrollLeft = d.scrollLeft - dx;
    };
    const onUp = () => { dragState.current = null; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <div className="discoverLayout">
      <AtmosphereBackground variant="default" />
      {/* 1. Left Sidebar Navigation Strip */}
      <aside className="catSidebar" aria-label="Category Navigation">
        <nav className="navLinks" aria-label="Discovery categories">
          <Link href="/dashboard" className="navLink" style={{ color: "var(--accent)", borderBottom: "0.5px solid rgba(var(--accent-rgb), 0.3)", paddingBottom: "16px", marginBottom: "8px" }}>
            ← Dashboard
          </Link>
          {CATEGORIES.map((cat) => {
            const isActive = matchedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <Link
                key={cat}
                href={`?type=${cat.toLowerCase()}`}
                className={`navLink ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {cat}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 2. Main Content Frame */}
      <main className="engineContainer">
        <div className="engineFrame">

          {/* Title + cross-link to News & Intelligence */}
          <div className="discoverTopBar">
            <div className="discoverTitleBlock">
              <span className="discoverKicker">Layer 2.1 // Discovery</span>
              <h1 className="discoverTitle">{matchedCategory}</h1>
            </div>
            <Link href="/intel" className="modeJumpBox">
              <span className="jumpHere">Discover</span>
              <span className="jumpArrow">→</span>
              <span className="jumpThere">News &amp; Intelligence</span>
            </Link>
          </div>

          {/* ── PRIMARY SEARCH ENGINE ── */}
          <div data-scoutit-guide="scoutit-discover-search">
            <DiscoverSearch />
          </div>

          {/* ── 1. REGIONAL NEWS FEED (APPROVED PRODUCT ORDER: STEP 1) ── */}
          <section className="discover-news-section" aria-label="Regional News Feed">
            <div className="sectionHeader">
              <h2 className="sectionTitle">News Feed</h2>
              <p className="sectionSubtitle">
                {activeRegion ? `Latest in ${activeRegion} · newest first` : "Latest across all regions · newest first"}
              </p>
            </div>
            <div className="chronologicalNewsRow" onPointerDown={onRowPointerDown}>
              {filteredIntel.length === 0 ? (
                <div className="newsEmpty">
                  No intelligence briefings recorded {activeRegion ? `for ${activeRegion}` : "for this category"} yet.
                </div>
              ) : filteredIntel.map((news) => (
                <Link
                  key={news.id}
                  href={`/intel/${news.slug}`}
                  className="newsCapsule"
                  draggable={false}
                  onClick={(e) => { if (movedRef.current) { e.preventDefault(); } }}
                >
                  <div className="capsuleMeta">
                    <span className="capsuleCategory">{news.category}</span>
                    <span className="capsuleDate">{regionOf(news) || news.date}</span>
                  </div>
                  <h3 className="capsuleTitle">{news.title}</h3>
                  <p className="capsuleExcerpt">{news.snippet}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 2. REGIONS NAVIGATION (APPROVED PRODUCT ORDER: STEP 2 DIRECTLY BENEATH FEED) ── */}
          <section className="discover-regions-section" aria-label="Regions Navigation">
            <div className="sectionHeader" style={{ marginBottom: "16px" }}>
              <h2 className="sectionTitle">Regions</h2>
              <p className="sectionSubtitle">Filter news and spaces by regional hub</p>
            </div>
            {regions.length > 6 && (
              <input
                type="text"
                className="regionSearch"
                placeholder="Search regions…"
                value={regionQuery}
                onChange={(e) => setRegionQuery(e.target.value)}
                aria-label="Search available regions"
              />
            )}
            <div className="contextGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <button
                type="button"
                className={`contextCell ${activeRegion === null ? "regionActive" : ""}`}
                onClick={() => setActiveRegion(null)}
                aria-pressed={activeRegion === null}
              >
                <div className="contextLabelBlock">
                  <span className="contextCode">00</span>
                  <span className="contextName">All Regions</span>
                  <span className="contextMeta">{intel.length} briefs · {properties.length} spaces</span>
                </div>
                <span className="contextArrow">→</span>
              </button>
              {shownRegions.length === 0 && regionQuery.trim().length > 0 && (
                <div className="newsEmpty" style={{ gridColumn: "1 / -1" }}>No regions match “{regionQuery}”.</div>
              )}
              {shownRegions.map((region, i) => {
                const isSelected = activeRegion === region;
                return (
                  <button
                    key={region}
                    type="button"
                    className={`contextCell ${isSelected ? "regionActive" : ""}`}
                    onClick={() => setActiveRegion(region)}
                    aria-pressed={isSelected}
                  >
                    <div className="contextLabelBlock">
                      <span className="contextCode">{String(i + 1).padStart(2, "0")}</span>
                      <span className="contextName">{region}</span>
                      <span className="contextMeta">
                        {regionCounts.get(region)?.intel || 0} briefs · {regionCounts.get(region)?.spaces || 0} spaces
                      </span>
                    </div>
                    <span className="contextArrow">→</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── 3. SPACES FILTERED TO REGION (APPROVED PRODUCT ORDER: STEP 3) ── */}
          <section className="discoverSecondary" aria-label="Regional Spaces">
            <div className="sectionHeader">
              <span className="secondaryKicker">Also in this area</span>
              <h2 className="sectionTitle">Spaces</h2>
              <p className="sectionSubtitle">
                {activeRegion ? `Filtered to ${activeRegion} · ` : "All spaces in category · "}
                Drag left &amp; right ·{" "}
                <Link href="/layer/metropolis" className="secondaryJump">
                  Browse the full directory
                </Link>
              </p>
            </div>

            {filteredProperties.length === 0 ? (
              <div
                className="spacesEmpty"
                style={{
                  padding: "40px 24px",
                  textAlign: "center",
                  background: "var(--surface2)",
                  border: "1px dashed var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-secondary)"
                }}
              >
                <p style={{ margin: "0 0 12px 0", fontSize: "14px" }}>
                  No spaces recorded {activeRegion ? `in ${activeRegion}` : "for this category"} yet.
                </p>
                {activeRegion && (
                  <button
                    type="button"
                    onClick={() => setActiveRegion(null)}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--accent)",
                      color: "var(--accent)",
                      padding: "8px 16px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontFamily: "var(--font-mono)",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em"
                    }}
                  >
                    View All Regions
                  </button>
                )}
              </div>
            ) : (
              <div
                className="spotlightMatrix"
                onPointerDown={onRowPointerDown}
              >
                {filteredProperties.map((property) => {
                  const isSpotlight = activeSpotlightId === property.id;
                  return (
                    <article
                      key={property.id}
                      className={`spotlightCard ${isSpotlight ? "spotlight" : ""}`}
                      onClick={() => { if (!movedRef.current) selectSpotlight(property); }}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="cardVisual">
                        <div
                          className="visualBg"
                          style={{
                            background: property.image
                              ? `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('${property.image}')`
                              : "linear-gradient(135deg, rgba(var(--accent-rgb), 0.10), var(--bg))",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                        <div className="visualContent">
                          <div className="cardHeader">
                            <span className="cityBadge">{property.city || property.region}</span>
                          </div>
                          <div className="cardBody">
                            <h3 className="cardTitleText">
                              {property.title}
                              <ProvenanceBadge record={property} />
                            </h3>
                            <div className="cardSpecTags">
                              <span className="specBadge">{property.density}</span>
                            </div>
                            <div className="mobile-briefing-cta" onClick={(e) => e.stopPropagation()}>
                              <Link href={`/property/${property.slug || property.id}`}>
                                VIEW FULL BRIEFING →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="expandedIntel">
                        <div>
                          <div className="intelHeader">
                            <h4 className="intelTitle">Asset Specifications</h4>
                          </div>
                          <div className="affinityParams">
                            <div className="affinityRow">
                              <span className="affinityLabel">Location</span>
                              <span className="affinityValue">{property.location || property.city}</span>
                            </div>
                            <div className="affinityRow">
                              <span className="affinityLabel">Region</span>
                              <span className="affinityValue">{regionOf(property)}</span>
                            </div>
                            <div className="affinityRow">
                              <span className="affinityLabel">Category</span>
                              <span className="affinityValue">{matchedCategory}</span>
                            </div>
                            <div className="affinityRow">
                              <span className="affinityLabel">Layout</span>
                              <span className="affinityValue">{property.density}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-start" }} onClick={(e) => e.stopPropagation()}>
                          <Link
                            href={`/property/${property.slug || property.id}`}
                            className="discover-briefing-btn"
                            style={{
                              display: "inline-block",
                              fontFamily: "var(--font-mono)",
                              fontSize: "12px",
                              color: "var(--accent)",
                              textDecoration: "none",
                              border: "1px solid rgba(var(--accent-rgb), 0.4)",
                              padding: "6px 14px",
                              borderRadius: "2px",
                              transition: "all var(--transition-fast) ease",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em"
                            }}
                          >
                            VIEW FULL BRIEFING →
                          </Link>
                        </div>

                        <div className="discover-reaction-buttons-container" style={{ marginTop: "16px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                          <ReactionButtons
                            propertyId={property.id}
                            propertyTitle={property.title}
                            category={getDBCategory(matchedCategory)}
                            city={property.city}
                            small={true}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
