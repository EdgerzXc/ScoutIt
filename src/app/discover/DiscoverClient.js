"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ReactionButtons from "@/components/ReactionButtons";
import "./discover.css";

const CATEGORIES = ["Residential", "Commercial", "STR", "Restaurants"];

const DISCOVER_PROPERTIES = {
  Residential: [
    {
      id: "batasan-hills",
      title: "Batasan Hills House & Lot",
      city: "Quezon City",
      location: "Quezon City",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      density: "3 Bedrooms · 180 sqm"
    }
  ],
  Commercial: [
    {
      id: "gridwork-studio",
      title: "The Gridwork Studio",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      density: "Open Layout · 150 sqm"
    }
  ],
  STR: [
    {
      id: "pacific-edge-villa",
      title: "Pacific Edge Villa",
      city: "Siargao",
      location: "Siargao",
      image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      density: "Beachfront · 250 sqm"
    }
  ],
  Restaurants: [
    {
      id: "gallery-by-chele",
      title: "Gallery by Chele",
      city: "Bonifacio Global City",
      location: "Bonifacio Global City",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      density: "Intimate Layout · 250 sqm"
    }
  ]
};

const DISCOVER_INTEL = {
  Residential: [
    { id: "n1", category: "NEWS", date: "Q3 2026", title: "BGC Condo Yields Rise", snippet: "Premium residential spaces see 4.2% YoY growth." },
    { id: "n2", category: "INSIGHT", date: "Q3 2026", title: "Makati Central Resurgence", snippet: "Older luxury buildings undergoing massive renovations." },
    { id: "n3", category: "BLOG", date: "Q3 2026", title: "Mastering the QC Market", snippet: "What to look for in QC subdivision residences." }
  ],
  Commercial: [
    { id: "n4", category: "NEWS", date: "Q3 2026", title: "New BPO Headquarters", snippet: "Global tech firms securing massive floor plates." },
    { id: "n5", category: "INSIGHT", date: "Q3 2026", title: "High Street Expansion", snippet: "Retail spaces are fully occupied for the next 24 months." },
    { id: "n6", category: "BLOG", date: "Q3 2026", title: "BGC Commercial Outlook", snippet: "Corporate spatial requirements shifting to flexible hubs." }
  ],
  STR: [
    { id: "n7", category: "NEWS", date: "Q3 2026", title: "Siargao Villa Boom", snippet: "Short term rentals operating at 95% occupancy." },
    { id: "n8", category: "INSIGHT", date: "Q3 2026", title: "Palawan Eco-resorts", snippet: "Sustainable tourism driving massive development." },
    { id: "n9", category: "BLOG", date: "Q3 2026", title: "STR Management Strategies", snippet: "Optimizing yields on seasonal beach properties." }
  ],
  Restaurants: [
    { id: "n10", category: "NEWS", date: "Q3 2026", title: "Michelin Guide Entry", snippet: "High-end dining spaces are highly contested." },
    { id: "n11", category: "INSIGHT", date: "Q3 2026", title: "Ridge Dining Surge", snippet: "Al fresco estate dining commands premium rates." },
    { id: "n12", category: "BLOG", date: "Q3 2026", title: "Restaurant Space Layouts", snippet: "How spatial density affects kitchen efficiency." }
  ]
};

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
                <div
                  key={news.id}
                  className="newsCapsule"
                  onClick={() => console.log(news.title)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="capsuleMeta">
                    <span className="where-badge">{news.category}</span>
                    <span>{news.date}</span>
                  </div>
                  <h3 className="capsuleTitle">{news.title}</h3>
                  <p className="capsuleSnippet">{news.snippet}</p>
                </div>
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
