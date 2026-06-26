"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactionButtons from "@/components/ui/ReactionButtons";
import { cityToRegion, regionOf } from "@/lib/regions";
import Footer from "@/components/layout/Footer";
import "./discover.css";

const CATEGORIES = ["Residential", "Commercial", "STR", "Hospitality", "Restaurants", "Venues/Events"];

function getDBCategory(cat) {
  if (cat === "Venues/Events") return "Venues";
  return cat;
}

import { DISCOVER_PROPERTIES } from "@/data/mockProperties";
import { DISCOVER_INTEL } from "@/data/mockArticles";

export default function DiscoverClient() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "residential";
  const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === typeParam.toLowerCase()) || "Residential";

  const [allProperties, setAllProperties] = useState(DISCOVER_PROPERTIES);
  const [allIntel, setAllIntel] = useState(DISCOVER_INTEL);

  const [properties, setProperties] = useState([]);
  const [intel, setIntel] = useState([]);
  const [activeSpotlightId, setActiveSpotlightId] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null); // null = all regions

  // Fetch live CMS data from Airtable
  useEffect(() => {
    async function fetchCMS() {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();

        const airtableProperties = data.properties || [];
        const nextProps = {
          Residential: [...DISCOVER_PROPERTIES.Residential],
          Commercial: [...DISCOVER_PROPERTIES.Commercial],
          STR: [...DISCOVER_PROPERTIES.STR],
          Hospitality: [...DISCOVER_PROPERTIES.Hospitality],
          Restaurants: [...DISCOVER_PROPERTIES.Restaurants],
          Venues: [...DISCOVER_PROPERTIES.Venues]
        };

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
              nextProps[cat].unshift({
                id: p.slug || p.id,
                slug: p.slug || p.id,
                title: p.title,
                city: p.city || "",
                region: p.region || cityToRegion(p.city || ""),
                location: p.location || "",
                image: p.image || p.photos?.[0] || "",
                density
              });
            }
          }
        });
        setAllProperties(nextProps);

        const airtableIntel = data.intel || [];
        const nextIntel = {
          Residential: [...DISCOVER_INTEL.Residential],
          Commercial: [...DISCOVER_INTEL.Commercial],
          STR: [...DISCOVER_INTEL.STR],
          Hospitality: [...DISCOVER_INTEL.Hospitality],
          Restaurants: [...DISCOVER_INTEL.Restaurants],
          Venues: [...DISCOVER_INTEL.Venues]
        };

        airtableIntel.forEach(item => {
          let cat = item.category || "Residential";
          if (cat.toLowerCase() === "hospitality") cat = "Hospitality";
          if (cat.toLowerCase() === "str") cat = "STR";
          if (cat.toLowerCase() === "culinary" || cat.toLowerCase() === "restaurants") cat = "Restaurants";
          if (cat.toLowerCase() === "venues" || cat.toLowerCase() === "events") cat = "Venues";

          if (nextIntel[cat]) {
            if (!nextIntel[cat].some(x => x.slug === item.slug)) {
              nextIntel[cat].unshift({
                id: item.id,
                slug: item.slug || item.id,
                category: item.intelType || "BRIEFING",
                date: item.date || "Just Now",
                region: item.region || cityToRegion(item.city || item.location || ""),
                title: item.title,
                snippet: item.excerpt || ""
              });
            }
          }
        });
        setAllIntel(nextIntel);
      } catch (err) {
        console.error("Discover page CMS load error:", err);
      }
    }

    fetchCMS();
  }, []);

  // Update filtered selection on category change or live data load
  useEffect(() => {
    const dbCategory = getDBCategory(matchedCategory);
    const list = allProperties[dbCategory] || [];
    setProperties(list);
    setIntel(allIntel[dbCategory] || []);
    setActiveSpotlightId(prev => {
      const keep = prev && list.some(x => x.id === prev) ? prev : (list[0]?.id || null);
      const sel = list.find(x => x.id === keep);
      setActiveRegion(sel ? regionOf(sel) : null);
      return keep;
    });
    setRegionQuery("");
  }, [matchedCategory, allProperties, allIntel]);

  // Regions available in the current category (derived from spotlight records)
  const regions = useMemo(() => {
    const seen = [];
    properties.forEach(p => {
      const r = regionOf(p);
      if (r && !seen.includes(r)) seen.push(r);
    });
    return seen;
  }, [properties]);

  // Region search (only surfaced when the list grows)
  const [regionQuery, setRegionQuery] = useState("");
  const shownRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter(r => r.toLowerCase().includes(q));
  }, [regions, regionQuery]);

  // News feed filtered to the active region (graceful fallback to all)
  const filteredIntel = useMemo(() => {
    if (!activeRegion) return intel;
    return intel.filter(n => n.region === activeRegion);
  }, [intel, activeRegion]);

  // Selecting a spotlight drives the active region for the news feed
  const selectSpotlight = (property) => {
    setActiveSpotlightId(property.id);
    setActiveRegion(regionOf(property));
  };

  // ── Drag-to-scroll for any horizontal row (Spotlights + News Feed) ──
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
      {/* 1. Left Sidebar Navigation Strip */}
      <aside className="catSidebar">
        <div className="brandLogo">SCOUTIT</div>
        <nav className="navLinks">
          <Link href="/dashboard" className="navLink" style={{ color: "var(--accent)", borderBottom: "0.5px solid rgba(232, 174, 60,0.3)", paddingBottom: "16px", marginBottom: "8px" }}>
            ← Dashboard
          </Link>
          {CATEGORIES.map((cat) => {
            const isActive = matchedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <Link
                key={cat}
                href={`?type=${cat.toLowerCase()}`}
                className={`navLink ${isActive ? "active" : ""}`}
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

          {/* Zone 1: Spotlights */}
          <section>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Spotlights</h2>
              <p className="sectionSubtitle">Drag left & right · Tap a space to load its local news</p>
            </div>
            <div
              className="spotlightMatrix"
              onPointerDown={onRowPointerDown}
            >
              {properties.map((property) => {
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
                        style={{ background: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('${property.image}')`, backgroundSize: "cover", backgroundPosition: "center" }}
                      />
                      <div className="visualContent">
                        <div className="cardHeader">
                          <span className="cityBadge">{property.city}</span>
                        </div>
                        <div className="cardBody">
                          <h3 className="cardTitleText">{property.title}</h3>
                          <div className="cardSpecTags">
                            <span className="specBadge">{property.density}</span>
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
                            <span className="affinityValue">{property.location}</span>
                          </div>
                          <div className="affinityRow">
                            <span className="affinityLabel">Zoning Profile</span>
                            <span className="affinityValue">AAA Tier</span>
                          </div>
                          <div className="affinityRow">
                            <span className="affinityLabel">Affinity Rating</span>
                            <span className="affinityValue">98.4%</span>
                          </div>
                          <div className="affinityRow">
                            <span className="affinityLabel">Density Profile</span>
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
                            fontSize: "11px",
                            color: "var(--accent)",
                            textDecoration: "none",
                            border: "1px solid rgba(232, 174, 60, 0.4)",
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
          </section>

          {/* Zone 2: News Feed (location-linked) */}
          <section style={{ marginTop: "40px" }}>
            <div className="sectionHeader">
              <h2 className="sectionTitle">News Feed</h2>
              <p className="sectionSubtitle">
                {activeRegion ? `Latest in ${activeRegion} · newest first` : "Latest across all regions · newest first"}
              </p>
            </div>
            <div className="chronologicalNewsRow" onPointerDown={onRowPointerDown}>
              {filteredIntel.length === 0 ? (
                <div className="newsEmpty">No news for this region yet.</div>
              ) : filteredIntel.map((news) => (
                <Link
                  key={news.id}
                  href={`/intel/${news.slug}`}
                  className="newsCapsule"
                  draggable={false}
                  onClick={(e) => { if (movedRef.current) { e.preventDefault(); } }}
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <div className="capsuleMeta">
                    <span className="where-badge">{news.category}</span>
                    <span>{news.region || news.date}</span>
                  </div>
                  <h3 className="capsuleTitle">{news.title}</h3>
                  <p className="capsuleSnippet">{news.snippet}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Zone 3: Regions (drives the News Feed location) */}
          <section style={{ marginTop: "40px" }}>
            <div className="sectionHeader" style={{ marginBottom: "16px" }}>
              <h2 className="sectionTitle">Regions</h2>
              <p className="sectionSubtitle">Switch the location feeding the News Feed</p>
            </div>
            {regions.length > 6 && (
              <input
                type="text"
                className="regionSearch"
                placeholder="Search regions…"
                value={regionQuery}
                onChange={(e) => setRegionQuery(e.target.value)}
              />
            )}
            <div className="contextGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
              <div
                className={`contextCell ${activeRegion === null ? "regionActive" : ""}`}
                onClick={() => setActiveRegion(null)}
                style={{ cursor: "pointer" }}
              >
                <div className="contextLabelBlock">
                  <span className="contextCode">00</span>
                  <span className="contextName">All Regions</span>
                </div>
                <span className="contextArrow">→</span>
              </div>
              {shownRegions.length === 0 && (
                <div className="newsEmpty" style={{ gridColumn: "1 / -1" }}>No regions match “{regionQuery}”.</div>
              )}
              {shownRegions.map((region, i) => (
                <div
                  key={region}
                  className={`contextCell ${activeRegion === region ? "regionActive" : ""}`}
                  onClick={() => setActiveRegion(region)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="contextLabelBlock">
                    <span className="contextCode">{String(i + 1).padStart(2, "0")}</span>
                    <span className="contextName">{region}</span>
                  </div>
                  <span className="contextArrow">→</span>
                </div>
              ))}
            </div>
          </section>
        </div>
        <Footer />
      </main>
    </div>
  );
}
