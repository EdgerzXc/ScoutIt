"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";
import { Bookmark, Search } from "lucide-react";
import PostMoveEcosystem from "./PostMoveEcosystem";
import VaultOfHonor from "./VaultOfHonor";

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function BuyerMode() {
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState("any");
  // Area watch — device-local (same pattern as the Ledger), so the toggle is
  // real state instead of a fire-and-forget toast that pretends to subscribe.
  const [areaWatch, setAreaWatch] = useState(false);
  const { listings, savedIds, toggleSave, addToast, searchByRadius, MAPBOX_TOKEN, DEFAULT_MAP_CENTER } = useDashboard();
  const searchRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);

  // Store markers to clean them up when listings change
  const markersRef = useRef([]);

  // ⚡ Bolt Optimization: Memoize filtered listings to avoid O(N*C) calculations on every keystroke
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const publicListings = listings.filter(l => l.ownerId === 'scoutit-cms' && !l.isDuplicateOfAirtable);
    
    if (!q) return publicListings;
    
    return publicListings.filter(item => 
      [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q))
    );
  }, [listings, searchQuery]);

  const [mapError, setMapError] = useState(null);

  // 1. Initialize Mapbox (now MapLibre)
  useEffect(() => {
    if (showMap && mapContainerRef.current) {
      try {
        setMapError(null);
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
          center: DEFAULT_MAP_CENTER, // Makati
          zoom: 12,
          pitch: 45
        });

        map.on('error', (e) => {
          console.error("MapLibre Error Event:", e);
          if (e && e.error) {
             setMapError(e.error.message || 'Unknown Mapbox Error');
          }
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        mapInstance.current = map;

        // Ensure the map resizes correctly if the container layout changes
        map.on('load', () => {
          map.resize();
        });
        setTimeout(() => {
          if (mapInstance.current) mapInstance.current.resize();
        }, 500);

        return () => {
          map.remove();
          mapInstance.current = null;
        };
      } catch (err) {
        console.error("MapLibre Initialization Error:", err);
        setMapError(err.message || String(err));
      }
    }
  }, [showMap, DEFAULT_MAP_CENTER]);

  // 2. Sync Markers
  useEffect(() => {
    if (!mapInstance.current || !showMap) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for filtered listings
    filteredListings.forEach(listing => {
      let coords = null;
      if (listing.coordinates) {
        const match = listing.coordinates.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          coords = [parseFloat(match[1]), parseFloat(match[2])];
        }
      }

      if (coords) {
        // Marker element
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-gold-accent flex items-center justify-center text-sm shadow-[0_0_15px_rgba(232,174,60,0.6)] cursor-pointer hover:scale-110 transition-transform text-background font-bold border-2 border-[#121212] z-10';
        el.innerHTML = listing.hasMedia ? '📸' : '🏢';

        // Secure Popup DOM Construction to prevent XSS
        const popupContent = document.createElement('div');
        popupContent.className = 'bg-[#121110] border border-gold-accent/20 p-4 rounded-lg shadow-xl w-60';
        
        const typeEl = document.createElement('div');
        typeEl.className = 'text-[10px] text-gold-accent font-label-caps uppercase tracking-widest mb-1';
        typeEl.textContent = listing.type;
        
        const titleEl = document.createElement('div');
        titleEl.className = 'text-sm font-working-title text-white truncate mb-1';
        titleEl.textContent = listing.title;
        
        const locEl = document.createElement('div');
        locEl.className = 'text-xs text-text-secondary truncate mb-3';
        locEl.textContent = listing.loc;
        
        const linkEl = document.createElement('a');
        linkEl.href = `/property/${listing.slug || listing.id}`;
        linkEl.className = 'block text-center w-full text-[10px] font-label-caps tracking-widest uppercase bg-gold-accent/10 hover:bg-gold-accent/20 text-gold-accent py-2 rounded transition-colors';
        linkEl.textContent = 'View Property';
        
        popupContent.appendChild(typeEl);
        popupContent.appendChild(titleEl);
        popupContent.appendChild(locEl);
        popupContent.appendChild(linkEl);

        const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
          .setDOMContent(popupContent);

        const marker = new maplibregl.Marker(el)
          .setLngLat(coords)
          .setPopup(popup)
          .addTo(mapInstance.current);

        markersRef.current.push(marker);
      }
    });
  }, [showMap, filteredListings]);

  // Handle Radius Change
  const handleRadiusChange = (e) => {
    const val = e.target.value;
    setRadius(val);
    searchByRadius(val);
    if (val !== 'any') {
      addToast(`Radar set to ${val}km`, "📡");
    } else {
      addToast(`Radar removed. Showing all.`, "🌍");
    }
  };

  useEffect(() => {
    try {
      setAreaWatch(localStorage.getItem("scoutit_area_watch") === "metro-manila");
    } catch { /* localStorage unavailable */ }
  }, []);

  const toggleAreaWatch = () => {
    const next = !areaWatch;
    setAreaWatch(next);
    try {
      if (next) localStorage.setItem("scoutit_area_watch", "metro-manila");
      else localStorage.removeItem("scoutit_area_watch");
    } catch { /* localStorage unavailable */ }
    addToast(
      next
        ? "Watching Metro Manila — new drops surface at the top of your feed."
        : "Stopped watching Metro Manila.",
      next ? "📡" : "🌍"
    );
  };

  // Mobile bottom-bar primary action
  useEffect(() => {
    const onPrimary = (e) => {
      if (e.detail?.mode === "buyer" || e.detail?.mode === "exploring") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        searchRef.current?.focus();
      }
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  const newFeedListings = filteredListings.slice(0, 5);
  
  // ⚡ Bolt Optimization: Memoize saved listings mapping and filtering
  const savedFiltered = useMemo(() => {
    const _actualSavedListings = listings
      .filter(l => savedIds.includes(l.id) && l.ownerId === 'scoutit-cms' && !l.isDuplicateOfAirtable)
      .map(l => ({
        id: l.id,
        type: l.spaceCategory || l.type || 'Property',
        title: l.title,
        loc: l.location || l.loc || 'Location hidden',
        img: l.hasMedia ? '📸' : '🏢',
      }));
      
    const q = searchQuery.trim().toLowerCase();
    if (!q) return _actualSavedListings;
    
    return _actualSavedListings.filter(item => 
      [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q))
    );
  }, [listings, savedIds, searchQuery]);

  const ListingCard = ({ item }) => (
    <Link href={`/property/${item.slug || item.id}`} className="block shrink-0 min-w-[240px] md:min-w-[280px]">
      <div className="card-atmosphere hov-card rounded-lg p-4 flex gap-4 items-center hover:border-gold-accent transition-colors cursor-pointer h-full group">
        <div className="w-16 h-16 bg-surface-alt rounded flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">
          {item.img || '🏠'}
        </div>
        <div className="flex flex-col overflow-hidden">
          <div className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase mb-1">{item.type}</div>
          <div className="font-working-title text-on-surface truncate group-hover:underline">{item.title}</div>
          <div className="text-xs text-text-secondary truncate mt-0.5">{item.loc || 'Metro Manila'}</div>
        </div>
        <button 
          className="absolute top-4 right-4 text-2xl drop-shadow-md hover:scale-110 transition-transform"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSave(item);
          }}
        >
          {savedIds.includes(item.id)
            ? <Bookmark strokeWidth={1.5} size="1em" className="text-gold-accent" />
            : <Bookmark strokeWidth={1.5} size="1em" className="text-text-secondary" />}
        </button>
      </div>
    </Link>
  );

  const VerticalListingCard = ({ item }) => (
    <Link href={`/property/${item.slug || item.id}`} className="block shrink-0 w-[280px] snap-start relative">
      <div className="card-atmosphere hov-card rounded-lg p-0 flex flex-col hover:border-text-secondary transition-colors cursor-pointer overflow-hidden group h-full">
        <div className="h-40 bg-surface-alt flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-500">
          {item.img || '🏠'}
        </div>
        <div className="p-4 flex flex-col">
          <div className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase mb-1">{item.type}</div>
          <div className="font-working-title text-on-surface mb-1 truncate group-hover:underline">{item.title}</div>
          <div className="text-xs text-text-secondary truncate">{item.loc || 'Location hidden'}</div>
        </div>
        <button 
          className="absolute top-4 right-4 text-2xl drop-shadow-md hover:scale-110 transition-transform bg-background/20 rounded-full p-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSave(item);
          }}
        >
          {savedIds.includes(item.id)
            ? <Bookmark strokeWidth={1.5} size="1em" className="text-gold-accent" />
            : <Bookmark strokeWidth={1.5} size="1em" className="text-text-secondary" />}
        </button>
      </div>
    </Link>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-8 pb-24 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-surface-variant pb-6">
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3 flex-1">
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"><Search strokeWidth={1.5} size="1em" /></span>
            <input
              type="text"
              ref={searchRef}
              className="w-full bg-surface border border-surface-variant rounded-full pl-11 pr-4 py-3 text-on-surface focus:outline-none focus:border-gold-accent transition-colors placeholder:text-text-muted"
              placeholder="Search locations, asset types, or intel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Proximity / Radius Filter */}
          <select 
            className="bg-surface border border-surface-variant rounded-full px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors cursor-pointer w-full md:w-auto appearance-none"
            value={radius}
            onChange={handleRadiusChange}
          >
            <option value="any">🌍 Any Distance</option>
            <option value="2">🎯 Within 2 km</option>
            <option value="5">⭕ Within 5 km</option>
            <option value="10">📍 Within 10 km</option>
            <option value="25">🗺️ Within 25 km</option>
          </select>
        </div>
        
        <div className="flex items-center gap-6 self-end md:self-auto">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-working-title ${!showMap ? 'text-gold-accent' : 'text-text-secondary'}`}>List</span>
            <button 
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${showMap ? 'bg-gold-accent' : 'bg-surface-variant'}`}
              onClick={() => setShowMap(!showMap)}
            >
              <div className={`w-4 h-4 bg-on-surface rounded-full transition-transform absolute top-1 ${showMap ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-xs font-working-title ${showMap ? 'text-gold-accent' : 'text-text-secondary'}`}>Map</span>
          </div>
          
        </div>
      </div>

      {showMap ? (
        <div className="w-full h-[600px] bg-surface border border-surface-variant rounded-lg overflow-hidden relative shadow-[0_0_30px_rgba(232,174,60,0.05)]">
          <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
          
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 text-error z-20 p-8 text-center">
              <span className="font-bold mb-2">Map Error</span>
              <span className="text-sm">{mapError}</span>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
          
          <div className="absolute bottom-6 left-6 z-10">
            <div className="bg-background/90 backdrop-blur border border-surface-variant p-4 rounded shadow-lg">
              <div className="text-[10px] font-label-caps tracking-widest text-gold-accent mb-1 uppercase">
                Spatial Intelligence
              </div>
              <div className="font-working-title text-on-surface">{filteredListings.filter(l => l.coordinates).length} properties in radar</div>
              {radius !== 'any' && <div className="text-xs text-text-secondary mt-1">{radius}km radius from Makati CBD</div>}
            </div>
          </div>
            
            <button 
              className="absolute bottom-6 right-6 pointer-events-auto bg-surface-container border border-surface-variant hover:border-gold-accent text-on-surface rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setShowMap(false)} aria-label="Close"
            >
              ✕
            </button>
        </div>
      ) : (
        <>
          {/* Intelligence Archive (Saved Items) */}
          <div className="flex flex-col gap-4">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between border-b border-surface-variant pb-2">
              Saved Properties
              <Link href="/wishlist" className="text-[10px] font-label-caps tracking-widest uppercase text-gold-accent hover:underline py-2.5 px-1 -my-1">Open Full Archive</Link>
            </h2>
            <p className="text-xs text-text-secondary mb-2">Tracked assets and saved market briefs.</p>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {savedFiltered.map(item => (
                <div key={item.id} className="snap-start">
                  <ListingCard item={item} />
                </div>
              ))}
              {savedFiltered.length === 0 && (
                <div className="bg-[#121110] border border-dashed border-surface-variant rounded-lg p-8 w-full text-center">
                  <span className="text-2xl mb-2 opacity-50 block">📂</span>
                  <p className="text-sm text-text-secondary">Your archive is empty. Save listings or intel briefs to build your workspace.</p>
                </div>
              )}
            </div>
          </div>

          {/* Feed Rail (New in Area) */}
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between border-b border-surface-variant pb-2">
              New in Metro Manila
              <div className="flex items-center gap-4">
                <button
                  className={`font-label-caps tracking-widest uppercase text-[10px] px-4 py-2 rounded transition-all flex items-center gap-1.5 ${areaWatch ? 'text-gold-accent bg-gold-accent/10 border border-gold-accent/40' : 'text-background bg-gold-accent shadow-[0_0_10px_rgba(232,174,60,0.3)] hover:opacity-90 hover:scale-105'}`}
                  onClick={toggleAreaWatch}
                  aria-pressed={areaWatch}
                >
                  {areaWatch ? '✓ Watching Area' : '+ Watch Area'}
                </button>
                <button
                  className="text-[10px] font-label-caps tracking-widest uppercase text-gold-accent hover:underline py-2.5 px-1 -my-1"
                  onClick={() => setShowMap(true)}
                >
                  View Map
                </button>
              </div>
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-6 snap-x hide-scrollbar">
              {newFeedListings.map(item => (
                <VerticalListingCard key={item.id} item={item} />
              ))}
              {newFeedListings.length === 0 ? (
                <div className="w-full flex flex-col items-center justify-center p-12 bg-surface/50 border border-surface-variant/50 border-dashed rounded-xl">
                  <div className="w-16 h-16 rounded-full border border-gold-accent/30 bg-surface flex items-center justify-center text-gold-accent mb-4">
                    <Search strokeWidth={1.5} size="1.5em" />
                  </div>
                  <h3 className="font-headline-editorial text-xl text-on-surface mb-2">The Ledger is Quiet</h3>
                  <p className="text-sm text-text-secondary text-center mb-6 max-w-md">
                    Nothing matches &quot;{searchQuery}&quot; right now. Broaden your search parameters or explore the full ledger to see what&apos;s active in the market.
                  </p>
                  <Link href="/property" className="font-label-caps tracking-widest uppercase text-[10px] text-gold-accent border border-gold-accent/30 bg-gold-accent/10 px-6 py-3 rounded hover:bg-gold-accent/20 transition-colors">
                    Explore Full Ledger ({listings.length} active spaces)
                  </Link>
                </div>
              ) : (
                <div className="block shrink-0 w-[280px] snap-start h-full">
                  <Link href="/property" className="h-full min-h-[250px] rounded-lg border border-surface-variant bg-surface-alt text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 transition-all flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full border border-gold-accent/30 bg-surface flex items-center justify-center text-gold-accent group-hover:scale-110 transition-transform">
                      <Search strokeWidth={1.5} size="1.5em" />
                    </div>
                    <div className="text-center">
                      <span className="font-working-title text-sm block mb-1">View Full Ledger</span>
                      <span className="text-xs text-text-secondary">{listings.length} active spaces</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Intel Teaser Rail */}
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between">
              Market Intelligence
              <Link href="/intel" className="text-xs font-working-title text-gold-accent hover:underline py-2.5 px-1 -my-1">View Archives</Link>
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
              
              {/* Intel Brief 1 — links must point at REAL briefings (the old
                  makati-yields / nuvali-expansion / pasig-zoning slugs never
                  existed and 404'd from the dashboard) */}
              <Link href="/intel/bgc-condo-yields-rise" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="card-atmosphere-gold hov-glow rounded-lg p-6 flex flex-col justify-between transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Market Intel</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">BGC Condo Yields Rise</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">Premium residential spaces post 4.2% year-on-year growth. What the transaction data says about where BGC rental demand is heading — and which unit profiles are capturing it.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    Read Full Brief <span>→</span>
                  </div>
                </div>
              </Link>

              {/* Intel Brief 2 */}
              <Link href="/intel/makati-central-resurgence" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="card-atmosphere-gold hov-glow rounded-lg p-6 flex flex-col justify-between transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Area Guide</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">Makati Central Resurgence</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">Older luxury buildings across the Makati core are undergoing massive renovations. How the retrofit wave is repricing the district — and what it means if you&apos;re scouting for value.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    Explore Area <span>→</span>
                  </div>
                </div>
              </Link>

              {/* Intel Brief 3 */}
              <Link href="/intel/high-street-expansion" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="card-atmosphere-gold hov-glow rounded-lg p-6 flex flex-col justify-between transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Commercial Signal</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">High Street Expansion</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">Retail spaces along the High Street corridor are fully occupied for the next 24 months. What the occupancy squeeze signals for surrounding residential and mixed-use assets.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    View Impact Analysis <span>→</span>
                  </div>
                </div>
              </Link>

            </div>
          </div>

          {/* Post-Move Ecosystem */}
          <PostMoveEcosystem />
        </>
      )}

      {/* Vault of Honor — badges/achievements sit below the core content (search + saved + intel) */}
      <VaultOfHonor />

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
