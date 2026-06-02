"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import "./discover.css";

// 10 Structural Philippine Property Hubs for Zone 3
const LOCATION_MATRIX = [
  { id: "qc", name: "Quezon City", count: 10, code: "01" },
  { id: "bgc", name: "Bonifacio Global City", count: 10, code: "02" },
  { id: "makati", name: "Makati", count: 10, code: "03" },
  { id: "alabang", name: "Alabang", count: 10, code: "04" },
  { id: "manda", name: "Mandaluyong", count: 10, code: "05" },
  { id: "pasay", name: "Pasay", count: 10, code: "06" },
  { id: "ortigas", name: "Ortigas Center", count: 10, code: "07" },
  { id: "cebu", name: "Cebu IT Park", count: 10, code: "08" },
  { id: "davao", name: "Davao Lanang", count: 10, code: "09" },
  { id: "iloilo", name: "Iloilo Business Park", count: 10, code: "10" }
];

const CATEGORIES = ["Residential", "Commercial", "STR", "Restaurants"];

const MOCK_PROPERTIES = {
  Residential: [
    {
      id: "res-spot-1", title: "Aurelia Residences", city: "Bonifacio Global City",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80')",
      specs: ["320 sqm", "4 Bedrooms"], location: "BGC Core"
    },
    {
      id: "res-spot-2", title: "The Estate Makati", city: "Makati",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80')",
      specs: ["280 sqm", "3 Bedrooms"], location: "Ayala Avenue"
    },
    {
      id: "res-spot-3", title: "Park Central Towers", city: "Makati",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80')",
      specs: ["400 sqm", "Penthouse"], location: "Roxas Triangle"
    }
  ],
  Commercial: [
    {
      id: "com-spot-1", title: "Zuellig Building", city: "Makati",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80')",
      specs: ["1,200 sqm", "Premium Grade A"], location: "Makati Avenue"
    },
    {
      id: "com-spot-2", title: "Arthaland Century Pacific", city: "Bonifacio Global City",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80')",
      specs: ["800 sqm", "LEED Platinum"], location: "5th Avenue"
    }
  ],
  STR: [
    {
      id: "str-spot-1", title: "Siargao Tropical Villa", city: "Siargao",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80')",
      specs: ["150 sqm", "Beachfront"], location: "Cloud 9"
    },
    {
      id: "str-spot-2", title: "Palawan Eco-Retreat", city: "El Nido",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80')",
      specs: ["300 sqm", "Off-grid"], location: "Lio Beach"
    }
  ],
  Restaurants: [
    {
      id: "rest-spot-1", title: "Gallery by Chele", city: "Bonifacio Global City",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80')",
      specs: ["250 sqm", "Intimate Layout"], location: "BGC Central"
    },
    {
      id: "rest-spot-2", title: "Antonio's Tagaytay", city: "Tagaytay",
      gradient: "linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80')",
      specs: ["600 sqm", "Estate Ground"], location: "Tagaytay Ridge"
    }
  ]
};

const MOCK_INTEL = {
  Residential: [
    { id: "n1", city: "Bonifacio Global City", category: "Market Report", date: "Q3 2026", title: "BGC Condo Yields Rise", snippet: "Premium residential spaces see 4.2% YoY growth." },
    { id: "n2", city: "Makati", category: "Market Report", date: "Q3 2026", title: "Makati Central Resurgence", snippet: "Older luxury buildings undergoing massive renovations." },
    { id: "n3", city: "Makati", category: "Development", date: "Q3 2026", title: "New Master-planned Community", snippet: "Top developers acquire 5-hectare plot in Makati CBD." }
  ],
  Commercial: [
    { id: "n4", city: "Makati", category: "Corporate", date: "Q3 2026", title: "New BPO Headquarters", snippet: "Global tech firms securing massive floor plates." },
    { id: "n5", city: "Bonifacio Global City", category: "Retail", date: "Q3 2026", title: "High Street Expansion", snippet: "Retail spaces are fully occupied for the next 24 months." }
  ],
  STR: [
    { id: "n6", city: "Siargao", category: "Tourism", date: "Q3 2026", title: "Siargao Villa Boom", snippet: "Short term rentals operating at 95% occupancy." },
    { id: "n7", city: "El Nido", category: "Tourism", date: "Q3 2026", title: "Palawan Eco-resorts", snippet: "Sustainable tourism driving massive development." }
  ],
  Restaurants: [
    { id: "n8", city: "Bonifacio Global City", category: "Culinary", date: "Q3 2026", title: "Michelin Guide Entry", snippet: "High-end dining spaces are highly contested." },
    { id: "n9", city: "Tagaytay", category: "Culinary", date: "Q3 2026", title: "Ridge Dining Surge", snippet: "Al fresco estate dining commands premium rates." }
  ]
};

const MOCK_TOP_10 = {
  Residential: Array.from({ length: 10 }).map((_, i) => ({
    id: `res-top-${i}`,
    title: `Alpha Residence ${i + 1}`,
    location: ["BGC Core", "Makati Central", "Roxas Triangle", "Quezon City", "Alabang"][i % 5],
    image: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'
    ][i % 3],
    density: ["Density: High", "Density: Medium", "Density: Low"][i % 3]
  })),
  Commercial: Array.from({ length: 10 }).map((_, i) => ({
    id: `com-top-${i}`,
    title: `Prime Hub ${i + 1}`,
    location: ["Makati CBD", "Ortigas Center", "BGC North", "Alabang CBD", "Bay Area"][i % 5],
    image: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1582653291997-079a1c04e5d1?w=800&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80'
    ][i % 3],
    density: ["Grade: AAA", "Grade: A", "LEED Certified"][i % 3]
  })),
  STR: Array.from({ length: 10 }).map((_, i) => ({
    id: `str-top-${i}`,
    title: `Retreat ${i + 1}`,
    location: ["Siargao", "El Nido", "Boracay", "Panglao", "Coron"][i % 5],
    image: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'
    ][i % 3],
    density: ["Yield: High", "Yield: Medium", "Yield: Peak Seasonal"][i % 3]
  })),
  Restaurants: Array.from({ length: 10 }).map((_, i) => ({
    id: `rest-top-${i}`,
    title: `Culinary Space ${i + 1}`,
    location: ["BGC Central", "Salcedo Village", "Tagaytay Ridge", "Poblacion", "Tomas Morato"][i % 5],
    image: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'
    ][i % 3],
    density: ["Capacity: Intimate", "Capacity: Estate", "Capacity: High"][i % 3]
  }))
};

export default function DiscoverClient() {
  const searchParams = useSearchParams();
  const focusParam = searchParams.get("focus");
  const typeParam = searchParams.get("type") || "residential";
  const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === typeParam.toLowerCase()) || "Residential";

  const [properties, setProperties] = useState(MOCK_TOP_10[matchedCategory]);
  const [intel, setIntel] = useState(MOCK_INTEL[matchedCategory]);
  const [activeSpotlightId, setActiveSpotlightId] = useState(MOCK_TOP_10[matchedCategory]?.[0]?.id);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [intentStates, setIntentStates] = useState({});

  useEffect(() => {
    setProperties(MOCK_TOP_10[matchedCategory] || []);
    setIntel(MOCK_INTEL[matchedCategory] || []);
    setActiveSpotlightId(MOCK_TOP_10[matchedCategory]?.[0]?.id || null);
    setSelectedLocation(null);
  }, [matchedCategory]);

  const filteredProperties = selectedLocation 
    ? properties.filter(p => p.location === selectedLocation)
    : properties;

  // Auto-select first item when filtering changes and current is not in list
  useEffect(() => {
    if (filteredProperties.length > 0 && !filteredProperties.find(p => p.id === activeSpotlightId)) {
      setActiveSpotlightId(filteredProperties[0].id);
    }
  }, [selectedLocation, filteredProperties, activeSpotlightId]);

  const spotlightRef = useRef(null);
  const newsRef = useRef(null);
  const contextRef = useRef(null);

  const handleMouseDown = (e, ref) => {
    const container = ref.current;
    if (!container) return;
    container.isDragging = true;
    container.startX = e.pageX - container.offsetLeft;
    container.scrollLeftStart = container.scrollLeft;
    container.hasDragged = false;
  };

  const handleMouseLeave = (e, ref) => {
    const container = ref.current;
    if (!container) return;
    container.isDragging = false;
  };

  const handleMouseUp = (e, ref) => {
    const container = ref.current;
    if (!container) return;
    container.isDragging = false;
  };

  const handleMouseMove = (e, ref) => {
    const container = ref.current;
    if (!container || !container.isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - container.startX) * 1.5;
    if (Math.abs(walk) > 5) {
      container.hasDragged = true;
    }
    container.scrollLeft = container.scrollLeftStart - walk;
  };

  const handleIntent = (e, propertyId, intentToken) => {
    e.stopPropagation();
    setIntentStates((prev) => {
      const current = prev[propertyId] || { save: false, inspire: false, fit: false, interest: false };
      return { ...prev, [propertyId]: { ...current, [intentToken]: !current[intentToken] } };
    });
  };

  const activeSpotlightProperty = filteredProperties.find((p) => p.id === activeSpotlightId);
  const activeNewsFilterCity = activeSpotlightProperty ? activeSpotlightProperty.location : "";

  const filteredNews = activeNewsFilterCity
    ? intel.filter((n) => {
        const intelCity = n.city.toLowerCase();
        const loc = activeNewsFilterCity.toLowerCase();
        if (loc.includes('bgc') && intelCity.includes('bonifacio')) return true;
        if (loc.includes('makati') && intelCity.includes('makati')) return true;
        if (loc.includes('siargao') && intelCity.includes('siargao')) return true;
        if (loc.includes('el nido') && intelCity.includes('el nido')) return true;
        if (loc.includes('tagaytay') && intelCity.includes('tagaytay')) return true;
        return intelCity.includes(loc.split(' ')[0]);
      })
    : intel;
  
  const displayNews = filteredNews.length > 0 ? filteredNews : intel;
  const uniqueLocations = Array.from(new Set(properties.map(item => item.location)));

  return (
    <div className="discoverLayout">
      {/* Main Content Frame */}
      <main className="engineContainer" style={{ paddingLeft: 0 }}>
        <div className="engineFrame">
          
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontSize: '32px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {matchedCategory} Discovery Matrix // Active Feed
            </h1>
          </div>
          
          {/* Zone 1: Spotlight Matrix */}
          <section>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Spotlight Matrix</h2>
              <p className="sectionSubtitle">Active space showcases · Tap to expand briefs</p>
            </div>
            <div
              ref={spotlightRef}
              className="spotlightMatrix"
              onMouseDown={(e) => handleMouseDown(e, spotlightRef)}
              onMouseLeave={(e) => handleMouseLeave(e, spotlightRef)}
              onMouseUp={(e) => handleMouseUp(e, spotlightRef)}
              onMouseMove={(e) => handleMouseMove(e, spotlightRef)}
            >
              {filteredProperties.map((property) => {
                const isSpotlight = activeSpotlightId === property.id;
                const intents = intentStates[property.id] || {
                  save: false,
                  inspire: false,
                  fit: false,
                  interest: false
                };

                return (
                  <article
                    key={property.id}
                    className={`spotlightCard ${isSpotlight ? "spotlight" : ""}`}
                    onClick={() => {
                      if (spotlightRef.current?.hasDragged) return;
                      setActiveSpotlightId(property.id);
                    }}
                  >
                    <div className="cardVisual">
                      <div
                        className="visualBg"
                        style={{ background: `linear-gradient(to top, rgba(0,0,0,0.9), transparent), url('${property.image}')`, backgroundSize: 'cover' }}
                      />
                      <div className="visualContent">
                        <div className="cardHeader">
                          <span className="cityBadge">{property.location}</span>
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
                            <span className="affinityValue">AAA Commercial</span>
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

                      <div className="spotlightIntentContainer">
                        <button
                          className={`spotlightIntentBtn ${intents.save ? "active" : ""}`}
                          onClick={(e) => handleIntent(e, property.id, "save")}
                        >
                          {intents.save ? "✓ Saved" : "[ Save ]"}
                        </button>
                        <button
                          className={`spotlightIntentBtn ${intents.inspire ? "active" : ""}`}
                          onClick={(e) => handleIntent(e, property.id, "inspire")}
                        >
                          {intents.inspire ? "★ Inspired" : "[ Inspire ]"}
                        </button>
                        <button
                          className={`spotlightIntentBtn ${intents.fit ? "active" : ""}`}
                          onClick={(e) => handleIntent(e, property.id, "fit")}
                        >
                          {intents.fit ? "◆ Fit" : "[ Fit ]"}
                        </button>
                        <button
                          className={`spotlightIntentBtn ${intents.interest ? "active" : ""}`}
                          onClick={(e) => handleIntent(e, property.id, "interest")}
                        >
                          {intents.interest ? "● Interested" : "[ Interest ]"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Zone 2: Chronological News Row */}
          <section style={{ marginTop: '40px' }}>
            <div className="sectionHeader">
              <h2 className="sectionTitle">Chronological News Feed</h2>
              <p className="sectionSubtitle">Dynamic intelligence briefs bridging selection: {activeNewsFilterCity}</p>
            </div>
            <div
              ref={newsRef}
              className="chronologicalNewsRow"
              onMouseDown={(e) => handleMouseDown(e, newsRef)}
              onMouseLeave={(e) => handleMouseLeave(e, newsRef)}
              onMouseUp={(e) => handleMouseUp(e, newsRef)}
              onMouseMove={(e) => handleMouseMove(e, newsRef)}
            >
              {displayNews.map((news) => (
                <div key={news.id} className="newsCapsule">
                  <div className="capsuleMeta">
                    <span>{news.category}</span>
                    <span>{news.date}</span>
                  </div>
                  <h3 className="capsuleTitle">{news.title}</h3>
                  <p className="capsuleSnippet">{news.snippet}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Zone 3: Location Hubs Track */}
          <section style={{ marginTop: '40px' }}>
            <div className="sectionHeader" style={{ marginBottom: '16px' }}>
              <h2 className="sectionTitle">Regional Location Track</h2>
              <p className="sectionSubtitle">Filter matrices by geographical tiering</p>
            </div>
            <div 
              ref={contextRef}
              className="hubs-slider" 
              style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}
              onMouseDown={(e) => handleMouseDown(e, contextRef)}
              onMouseLeave={(e) => handleMouseLeave(e, contextRef)}
              onMouseUp={(e) => handleMouseUp(e, contextRef)}
              onMouseMove={(e) => handleMouseMove(e, contextRef)}
            >
              <div 
                className="hub-mini-card" 
                onClick={() => { if (!contextRef.current?.hasDragged) setSelectedLocation(null); }}
                style={{ background: selectedLocation === null ? '#c8a96e' : '#1c1c1c', border: '1px solid #262626', borderRadius: '4px', padding: '12px 20px', flexShrink: 0, cursor: 'pointer', color: selectedLocation === null ? '#000' : '#fff', fontWeight: selectedLocation === null ? 600 : 400, minWidth: '160px', transition: 'all 0.3s ease' }}
              >
                <div style={{ fontSize: '13px', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', height: '100%' }}>ALL REGIONS</div>
              </div>
              {uniqueLocations.map((loc, idx) => (
                <div 
                  key={idx} 
                  className="hub-mini-card" 
                  onClick={() => { if (!contextRef.current?.hasDragged) setSelectedLocation(loc); }}
                  style={{ background: selectedLocation === loc ? '#c8a96e' : '#1c1c1c', border: '1px solid #262626', borderRadius: '4px', padding: '12px 20px', flexShrink: 0, cursor: 'pointer', color: selectedLocation === loc ? '#000' : '#fff', fontWeight: selectedLocation === loc ? 600 : 400, minWidth: '160px', transition: 'all 0.3s ease' }}
                >
                  <div style={{ color: selectedLocation === loc ? 'rgba(0,0,0,0.6)' : 'var(--text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    {(idx + 1).toString().padStart(2, '0')} // TARGET CODE
                  </div>
                  <div style={{ fontSize: '13px', fontFamily: 'var(--font-display)' }}>
                    {loc}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              .hubs-slider::-webkit-scrollbar { height: 3px; }
              .hubs-slider::-webkit-scrollbar-thumb { background: rgba(200,169,110,0.2); border-radius: 4px; }
            `}</style>
          </section>
        </div>
      </main>
    </div>
  );
}
