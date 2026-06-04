"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactionButtons from "@/components/ReactionButtons";
import "./discover.css";

const CATEGORIES = ["Residential", "Commercial", "STR", "Restaurants"];

import { DISCOVER_PROPERTIES, DISCOVER_INTEL } from "@/data/mockDb";

export default function DiscoverClient() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type") || "residential";
  const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === typeParam.toLowerCase()) || "Residential";

  const [allProperties, setAllProperties] = useState(DISCOVER_PROPERTIES);
  const [allIntel, setAllIntel] = useState(DISCOVER_INTEL);
  
  const [properties, setProperties] = useState([]);
  const [intel, setIntel] = useState([]);
  const [activeSpotlightId, setActiveSpotlightId] = useState(null);

  // Fetch live CMS data from Airtable
  useEffect(() => {
    async function fetchCMS() {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        
        // 1. Format and prepend properties
        const airtableProperties = data.properties || [];
        const nextProps = {
          Residential: [...DISCOVER_PROPERTIES.Residential],
          Commercial: [...DISCOVER_PROPERTIES.Commercial],
          STR: [...DISCOVER_PROPERTIES.STR],
          Restaurants: [...DISCOVER_PROPERTIES.Restaurants]
        };
        
        airtableProperties.forEach(p => {
          const cat = p.spaceCategory;
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
                location: p.location || "",
                image: p.image || p.photos?.[0] || "",
                density
              });
            }
          }
        });
        setAllProperties(nextProps);
        
        // 2. Format and prepend intel
        const airtableIntel = data.intel || [];
        const nextIntel = {
          Residential: [...DISCOVER_INTEL.Residential],
          Commercial: [...DISCOVER_INTEL.Commercial],
          STR: [...DISCOVER_INTEL.STR],
          Restaurants: [...DISCOVER_INTEL.Restaurants]
        };
        
        airtableIntel.forEach(item => {
          let cat = item.category || "Residential";
          if (cat.toLowerCase() === "hospitality") cat = "STR";
          if (cat.toLowerCase() === "culinary") cat = "Restaurants";
          
          if (nextIntel[cat]) {
            if (!nextIntel[cat].some(x => x.slug === item.slug)) {
              nextIntel[cat].unshift({
                id: item.id,
                slug: item.slug || item.id,
                category: item.intelType || "BRIEFING",
                date: item.date || "Just Now",
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
    const list = allProperties[matchedCategory] || [];
    setProperties(list);
    setIntel(allIntel[matchedCategory] || []);
    setActiveSpotlightId(prev => {
      // Keep existing active item if it is still in the new list, otherwise select the first item
      if (prev && list.some(x => x.id === prev)) return prev;
      return list[0]?.id || null;
    });
  }, [matchedCategory, allProperties, allIntel]);

  return (
    <div className="discoverLayout">
      {/* 1. Left Sidebar Navigation Strip */}
      <aside className="catSidebar">
        <div className="brandLogo">SCOUTIT</div>
        <nav className="navLinks">
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
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)", fontSize: "32px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {matchedCategory} Discovery Matrix
            </h1>
          </div>
          
          {/* Zone 1: Spotlight Matrix */}
          <section>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Spotlight Matrix</h2>
              <p className="sectionSubtitle">Active space showcases · Tap to expand briefs</p>
            </div>
            <div className="spotlightMatrix" style={{ cursor: "default" }}>
              {properties.map((property) => {
                const isSpotlight = activeSpotlightId === property.id;
                return (
                  <article
                    key={property.id}
                    className={`spotlightCard ${isSpotlight ? "spotlight" : ""}`}
                    onClick={() => setActiveSpotlightId(property.id)}
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
                            border: "1px solid rgba(200, 169, 110, 0.4)",
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
                          category={matchedCategory}
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
 
          {/* Zone 2: Chronological News Row */}
          <section style={{ marginTop: "40px" }}>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Chronological News Feed</h2>
              <p className="sectionSubtitle">Dynamic intelligence briefs bridging selection</p>
            </div>
            <div className="chronologicalNewsRow" style={{ cursor: "default" }}>
              {intel.map((news) => (
                <Link
                  key={news.id}
                  href={`/intel/${news.slug}`}
                  className="newsCapsule"
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <div className="capsuleMeta">
                    <span className="where-badge">{news.category}</span>
                    <span>{news.date}</span>
                  </div>
                  <h3 className="capsuleTitle">{news.title}</h3>
                  <p className="capsuleSnippet">{news.snippet}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Zone 3: Regional Location Track */}
          <section style={{ marginTop: "40px" }}>
            <div className="sectionHeader" style={{ marginBottom: "16px" }}>
              <h2 className="sectionTitle">Regional Location Track</h2>
              <p className="sectionSubtitle">Filter matrices by geographical tiering</p>
            </div>
            <div className="contextGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
              {[
                { name: "Quezon City", code: "01" },
                { name: "Bonifacio Global City", code: "02" },
                { name: "Siargao", code: "03" }
              ].map((city) => (
                <div 
                  key={city.name} 
                  className="contextCell" 
                  onClick={() => console.log(city.name)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="contextLabelBlock">
                    <span className="contextCode">{city.code}</span>
                    <span className="contextName">{city.name}</span>
                  </div>
                  <span className="contextArrow">→</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
