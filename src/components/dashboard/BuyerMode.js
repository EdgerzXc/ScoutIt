"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";
import { Bookmark, Search } from "lucide-react";

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const SAVED_LISTINGS = [
  { id: 'f1', type: 'House', title: 'Ayala Alabang Core', loc: 'Muntinlupa City', img: '🏠' },
  { id: 'f2', type: 'Condo', title: 'The Proscenium', loc: 'Rockwell Center', img: '🏢' },
  { id: 'f_dummy1', type: 'Lot', title: 'Elaro Corner Lot', loc: 'Nuvali, Laguna', img: '🌳' },
];

export default function BuyerMode() {
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState("any");
  const { listings, savedIds, toggleSave, addToast, searchByRadius, MAPBOX_TOKEN, DEFAULT_MAP_CENTER } = useDashboard();
  const searchRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);

  // Initialize Mapbox when showMap toggles
  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapInstance.current && MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      mapInstance.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: DEFAULT_MAP_CENTER, // Makati
        zoom: 12,
        pitch: 45
      });

      mapInstance.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Clean up on unmount or when toggling off
      return () => {
        mapInstance.current?.remove();
        mapInstance.current = null;
      };
    }
  }, [showMap, MAPBOX_TOKEN]);

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

  // Live-filter the feed
  const q = searchQuery.trim().toLowerCase();
  const matches = (item) => !q || [item.title, item.type, item.loc, item.desc].some(v => v && v.toLowerCase().includes(q));
  const newFeedListings = listings.filter(matches).slice(0, 5);
  const savedFiltered = SAVED_LISTINGS.filter(matches);

  const ListingCard = ({ item }) => (
    <Link href={`/property/${item.id}`} className="block shrink-0 min-w-[240px] md:min-w-[280px]">
      <div className="bg-surface border border-surface-variant rounded-lg p-4 flex gap-4 items-center hover:border-gold-accent hover:bg-surface-container-low transition-colors cursor-pointer h-full group">
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
    <Link href={`/property/${item.id}`} className="block shrink-0 w-[280px] snap-start relative">
      <div className="bg-surface border border-surface-variant rounded-lg p-0 flex flex-col hover:border-text-secondary transition-colors cursor-pointer overflow-hidden group h-full">
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
    <div className="w-full flex flex-col gap-8 pb-12 animate-[fadeIn_0.5s_ease-out]">
      
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
        <div className="w-full h-[600px] bg-surface border border-surface-variant rounded-lg overflow-hidden relative shadow-[0_0_30px_rgba(212,175,55,0.05)]">
          <div ref={mapContainerRef} className="absolute inset-0" />
          
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
            <div className="bg-background/90 backdrop-blur border border-surface-variant p-4 rounded shadow-lg pointer-events-auto">
              <span className="font-label-caps text-xs tracking-widest text-gold-accent uppercase block mb-1">Spatial Intelligence</span>
              <div className="font-working-title text-on-surface">{listings.length} properties in radar</div>
              {radius !== 'any' && <div className="text-xs text-text-secondary mt-1">{radius}km radius from Makati CBD</div>}
            </div>
            
            <button 
              className="pointer-events-auto bg-surface-container border border-surface-variant hover:border-gold-accent text-on-surface rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
              onClick={() => setShowMap(false)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Intelligence Archive (Saved Items) */}
          <div className="flex flex-col gap-4">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between border-b border-surface-variant pb-2">
              Intelligence Archive
              <button className="text-[10px] font-label-caps tracking-widest uppercase text-gold-accent hover:underline">Open Full Archive</button>
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
                  className="font-label-caps tracking-widest uppercase text-[10px] text-background bg-gold-accent px-4 py-2 rounded shadow-[0_0_10px_rgba(212,175,55,0.3)] hover:opacity-90 hover:scale-105 transition-all flex items-center gap-1.5"
                  onClick={() => addToast("Alert set for Metro Manila. We'll notify you when new listings drop.", "🔔")}
                >
                  + Set Alert
                </button>
                <button 
                  className="text-[10px] font-label-caps tracking-widest uppercase text-gold-accent hover:underline"
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
              {newFeedListings.length === 0 && (
                <div className="text-sm text-text-secondary py-6">Nothing matches "{searchQuery}" yet — try a broader search.</div>
              )}

              {/* See More Card */}
              <div className="block shrink-0 w-[280px] snap-start h-full">
                <Link href="/property" className="h-full min-h-[250px] rounded-lg border border-surface-variant bg-surface-alt text-on-surface hover:border-gold-accent hover:bg-gold-accent/5 transition-all flex flex-col items-center justify-center gap-4 group">
                  <div className="w-16 h-16 rounded-full border border-gold-accent/30 bg-[#121212] flex items-center justify-center text-gold-accent group-hover:scale-110 transition-transform">
                    <Search strokeWidth={1.5} size="1.5em" />
                  </div>
                  <div className="text-center">
                    <span className="font-working-title text-sm block mb-1">View Full Ledger</span>
                    <span className="text-xs text-text-secondary">{listings.length} active spaces</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Intel Teaser Rail */}
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between">
              Market Intelligence
              <button className="text-xs font-working-title text-gold-accent cursor-pointer hover:underline">View Archives</button>
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
              
              {/* Intel Brief 1 */}
              <Link href="/intel/makati-yields" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="bg-[#121110] border border-gold-accent/20 rounded-lg p-6 flex flex-col justify-between hover:border-gold-accent transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Market Intel</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">Makati CBD Yields Drop</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">Recent transactions show a 1.2% decrease in gross rental yields for premium studios in Legazpi Village over the last 30 days. Capital appreciation remains steady but cash flow is tightening.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    Read Full Brief <span>→</span>
                  </div>
                </div>
              </Link>

              {/* Intel Brief 2 */}
              <Link href="/intel/nuvali-expansion" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="bg-[#121110] border border-gold-accent/20 rounded-lg p-6 flex flex-col justify-between hover:border-gold-accent transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Area Guide</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">Nuvali Expansion Patterns</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">A deep dive into the upcoming commercial blocks and how they affect residential pricing in Elaro and Venare. We map out the 5-year infrastructure pipeline and its impact on secondary market liquidity.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    Explore Area <span>→</span>
                  </div>
                </div>
              </Link>
              
              {/* Intel Brief 3 */}
              <Link href="/intel/pasig-zoning" className="block shrink-0 w-[320px] md:w-[400px] snap-start">
                <div className="bg-[#121110] border border-gold-accent/20 rounded-lg p-6 flex flex-col justify-between hover:border-gold-accent transition-colors cursor-pointer group h-full">
                  <div>
                    <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] tracking-widest uppercase px-2 py-1 rounded mb-4">Regulatory Alert</span>
                    <h3 className="font-headline-editorial text-xl text-on-surface mb-2">Pasig Zoning Changes</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">New LGU ordinances are shifting FAR (Floor Area Ratio) limitations near the upcoming subway stations. What this means for low-density residential asset owners looking to exit to mid-rise developers.</p>
                  </div>
                  <div className="mt-6 font-working-title text-sm text-gold-accent group-hover:underline flex items-center gap-2">
                    View Impact Analysis <span>→</span>
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </>
      )}

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
