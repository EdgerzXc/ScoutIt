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
  const [properties, setProperties] = useState(DISCOVER_PROPERTIES[matchedCategory]);
  const [intel, setIntel] = useState(DISCOVER_INTEL[matchedCategory]);
  const [activeSpotlightId, setActiveSpotlightId] = useState(DISCOVER_PROPERTIES[matchedCategory]?.[0]?.id);

  useEffect(() => {
    setProperties(DISCOVER_PROPERTIES[matchedCategory] || []);
    setIntel(DISCOVER_INTEL[matchedCategory] || []);
    setActiveSpotlightId(DISCOVER_PROPERTIES[matchedCategory]?.[0]?.id || null);
  }, [matchedCategory]);

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

                      <div className="discover-reaction-buttons-container" style={{ marginTop: "16px", width: "100%" }} onClick={(e) => e.stopPropagation()}>
                        <ReactionButtons
                          propertyId={property.id}
                          propertyTitle={property.title}
                          category={matchedCategory}
                          city={property.city}
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
