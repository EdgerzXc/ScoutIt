"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getSession } from "../../lib/authClient";
import { supabase } from "../../lib/supabaseClient";
import ScoutInsightPanel from './panels/ScoutInsightPanel';
import MeshHero from '../ui/MeshHero';
import TaskRail from "./crm/TaskRail";
import DealTimeline from "./crm/DealTimeline";
import { computeListingStrength } from "../../lib/listingStrength";

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import circle from '@turf/circle';

export default function BrokerMode() {
  const { connects, listings, pitches, sendPitch, updatePitchStatus, currentUser, addToast, searchByRadius, MAPBOX_TOKEN, DEFAULT_MAP_CENTER } = useDashboard();

  const [pitchingListing, setPitchingListing] = useState(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [pitchError, setPitchError] = useState("");
  const [isSendingPitch, setIsSendingPitch] = useState(false);

  // License State
  const [prcInput, setPrcInput] = useState("");
  const [dhsudInput, setDhsudInput] = useState("");

  useEffect(() => {
    if (currentUser) {
      setPrcInput(currentUser.prcLicense || currentUser.prc_license || "");
      setDhsudInput(currentUser.dhsudNumber || currentUser.dhsud_number || "");
    }
  }, [currentUser]);

  const handleUpdateLicense = async (field, value) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ [field]: value })
        .eq('id', currentUser.id);
      
      if (error) throw error;
      if (addToast) addToast("License updated successfully", "✅");
    } catch (err) {
      console.error("Failed to update license:", err);
      if (addToast) addToast("Failed to update license", "❌");
    }
  };

  // Notification and ID Card State. The "new feature" banner dismissal is
  // persisted — a banner that resurrects on every visit stops being news.
  const [showNotification, setShowNotification] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  useEffect(() => {
    try {
      setShowNotification(localStorage.getItem("scoutit_idcard_banner_seen") !== "1");
    } catch { /* localStorage unavailable */ }
  }, []);
  const dismissIdCardBanner = () => {
    setShowNotification(false);
    try { localStorage.setItem("scoutit_idcard_banner_seen", "1"); } catch { /* ignore */ }
  };

  // New Deal File Workspace State
  const [activeDealId, setActiveDealId] = useState(null);

  // For the scratchpad notes in the deal file -- persisted to deals.private_notes
  // (debounced so we're not firing a PATCH on every keystroke).
  const [dealNotes, setDealNotes] = useState({});
  const noteSaveTimers = useRef({});

  // Open/overdue counts reported up by TaskRail so Scout Insight can surface
  // them without a second fetch.
  const [taskSummary, setTaskSummary] = useState(null);
  const handleTaskSummary = useCallback((summary) => setTaskSummary(summary), []);

  // Map State & Refs
  const [showMap, setShowMap] = useState(false);
  const [radius, setRadius] = useState("5");
  const [radarCenter, setRadarCenter] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize searchByRadius to 5km on mount so the list matches the map overlay
  useEffect(() => {
    setRadarCenter(DEFAULT_MAP_CENTER);
    searchByRadius("5", DEFAULT_MAP_CENTER[0], DEFAULT_MAP_CENTER[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);



  const handleRadiusChange = (e) => {
    const val = e.target.value;
    setRadius(val);
    searchByRadius(val, radarCenter ? radarCenter[0] : DEFAULT_MAP_CENTER[0], radarCenter ? radarCenter[1] : DEFAULT_MAP_CENTER[1]);
    if (val !== 'any') {
      if (addToast) addToast(`Radar set to ${val}km`, "📡");
    } else {
      if (addToast) addToast(`Radar removed. Showing all.`, "🌍");
    }
  };

  // ⚡ Bolt Optimization: Memoize derived pipelines
  const { myPitches, pending, accepted, activePitches, feed } = useMemo(() => {
    const _myPitches = pitches.filter(p => p.isCurrentUserBroker);
    const _pending = [];
    const _accepted = [];
    const _activePitches = [];
    const pitchedListingIds = new Set();
    
    _myPitches.forEach(p => {
      pitchedListingIds.add(p.listingId);
      if (p.status === 'pending') _pending.push(p);
      if (p.status === 'accepted') _accepted.push(p);
      if (p.status !== 'accepted' && p.status !== 'closed') _activePitches.push(p);
    });

    const _feed = listings.filter(l => !pitchedListingIds.has(l.id));

    return {
      myPitches: _myPitches,
      pending: _pending,
      accepted: _accepted,
      activePitches: _activePitches,
      feed: _feed
    };
  }, [pitches, listings]);

  // 1. Initialize Mapbox
  useEffect(() => {
    if (showMap && mapContainerRef.current) {
      try {
        setMapError(null);
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
          center: DEFAULT_MAP_CENTER || [121.0215, 14.5547],
          zoom: 12,
          pitch: 45
        });

        map.on('error', (e) => {
          if (e && e.error) setMapError(e.error.message || 'Unknown Mapbox Error');
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');
        mapInstance.current = map;

        map.on('load', () => {
          map.resize();

          // Add radar source and layers
          if (!map.getSource('radar-source')) {
            map.addSource('radar-source', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] }
            });
            map.addLayer({
              id: 'radar-fill',
              type: 'fill',
              source: 'radar-source',
              paint: {
                'fill-color': '#E8AE3C',
                'fill-opacity': 0.1
              }
            });
            map.addLayer({
              id: 'radar-stroke',
              type: 'line',
              source: 'radar-source',
              paint: {
                'line-color': '#E8AE3C',
                'line-width': 2,
                'line-opacity': 0.8,
                'line-dasharray': [2, 2]
              }
            });
          }
          setMapLoaded(true);

          // Add draggable radar center pin
          const radarMarkerEl = document.createElement('div');
          radarMarkerEl.className = 'w-6 h-6 rounded-full border-2 border-gold-accent bg-gold-accent/20 cursor-move flex items-center justify-center backdrop-blur-sm shadow-[0_0_15px_rgba(232,174,60,0.5)]';
          const innerDot = document.createElement('div');
          innerDot.className = 'w-2 h-2 rounded-full bg-gold-accent';
          radarMarkerEl.appendChild(innerDot);

          const radarMarker = new maplibregl.Marker({ element: radarMarkerEl, draggable: true })
            .setLngLat(DEFAULT_MAP_CENTER)
            .addTo(map);

          radarMarker.on('dragend', () => {
            const lngLat = radarMarker.getLngLat();
            setRadarCenter([lngLat.lng, lngLat.lat]);
          });
        });

        setTimeout(() => { if (mapInstance.current) mapInstance.current.resize(); }, 500);

        return () => {
          map.remove();
          mapInstance.current = null;
        };
      } catch (err) {
        setMapError(err.message || String(err));
      }
    }
  }, [showMap, DEFAULT_MAP_CENTER]);

  // 2. Sync Markers with Feed
  useEffect(() => {
    if (!mapInstance.current || !showMap) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    feed.forEach(listing => {
      let coords = null;
      if (listing.coordinates) {
        const match = listing.coordinates.match(/POINT\(([^ ]+) ([^)]+)\)/);
        if (match) {
          coords = [parseFloat(match[1]), parseFloat(match[2])];
        }
      } else if (listing.lng && listing.lat) {
        coords = [listing.lng, listing.lat];
      }

      if (coords) {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-gold-accent flex items-center justify-center text-sm shadow-[0_0_15px_rgba(232,174,60,0.6)] cursor-pointer hover:scale-110 transition-transform text-background font-bold border-2 border-[#121212] z-10';
        el.innerHTML = listing.hasMedia ? '📸' : '🏢';

        const popupContent = document.createElement('div');
        popupContent.className = 'bg-[#121110] border border-gold-accent/20 p-4 rounded-lg shadow-xl w-60';
        
        const typeEl = document.createElement('div');
        typeEl.className = 'text-[10px] text-gold-accent font-label-caps uppercase tracking-widest mb-1';
        typeEl.textContent = listing.type || listing.spaceCategory || 'Property';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'text-sm font-working-title text-white truncate mb-1';
        titleEl.textContent = listing.title;
        
        const locEl = document.createElement('div');
        locEl.className = 'text-xs text-text-secondary truncate mb-3';
        locEl.textContent = listing.loc || listing.location;
        
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
  }, [showMap, feed]);

  // 3. Sync Radar Overlay
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !showMap || !radarCenter) return;
    const map = mapInstance.current;
    if (!map.getSource('radar-source')) return;

    if (radius === 'any') {
      map.getSource('radar-source').setData({ type: 'FeatureCollection', features: [] });
    } else {
      const radiusKm = parseFloat(radius);
      if (!isNaN(radiusKm)) {
        try {
          const radarCircle = circle(radarCenter, radiusKm, { steps: 64, units: 'kilometers' });
          map.getSource('radar-source').setData(radarCircle);
        } catch (err) {
          console.error("Error drawing radar circle:", err);
        }
      }
    }
  }, [mapLoaded, radius, radarCenter, showMap]);

  // Update search list when radarCenter changes
  useEffect(() => {
    if (radarCenter) {
      searchByRadius(radius, radarCenter[0], radarCenter[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radarCenter]);

  // Some deals (e.g. owner-initiated handshakes) carry no title — never show a raw UUID.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const dealTitle = (deal) => {
    if (deal.title && !UUID_RE.test(deal.title)) return deal.title;
    const prop = listings.find(l => l.id === deal.listingId) || deal.targetListing;
    return prop?.title || 'Unknown Property';
  };

  const handleOpenPitchModal = (listing) => {
    setPitchingListing(listing);
    setPitchError("");
    setPitchMessage("Hi, I have a client looking for this exact profile. I'd love to arrange an exclusive viewing.");
  };

  const handleSendPitch = async () => {
    if (!pitchingListing || isSendingPitch) return;
    // sendPitch is async and does a real server round-trip (deals has an RLS
    // policy blocking direct client inserts, so this must go through
    // /api/deals/pitch) — this call was previously never awaited, so the
    // modal closed as "sent" immediately regardless of whether the pitch
    // actually succeeded, and a real failure was never shown to the broker.
    setIsSendingPitch(true);
    setPitchError("");
    try {
      const success = await sendPitch(pitchingListing.id, pitchMessage);
      if (success) {
        setPitchingListing(null);
      } else {
        setPitchError("Couldn't send this pitch — see the notification for details.");
      }
    } finally {
      setIsSendingPitch(false);
    }
  };

  const handleSaveNote = (dealId, note) => {
    setDealNotes(prev => ({ ...prev, [dealId]: note }));

    // Debounce the actual persist so typing doesn't fire a request per keystroke.
    clearTimeout(noteSaveTimers.current[dealId]);
    noteSaveTimers.current[dealId] = setTimeout(async () => {
      try {
        const { data: { session } } = await getSession();
        const token = session?.access_token;
        const mockOwnerId = !token && currentUser?.id ? currentUser.id : undefined;
        await fetch(`/api/deals/${dealId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ note, mockOwnerId }),
        });
      } catch (err) {
        console.error('Failed to save deal notes', err);
        if (addToast) addToast("Failed to save private note. Check your connection.", "❌");
      }
    }, 800);
  };

  // --- VIEW: LAYER 2 - DEAL FILE WORKSPACE ---
  if (activeDealId) {
    const deal = myPitches.find(p => p.id === activeDealId);
    if (!deal) {
      setActiveDealId(null);
      return null;
    }
    const property = listings.find(l => l.id === deal.listingId) || deal.targetListing;
    // dealNotes[deal.id] wins once the user has typed this session (avoids
    // losing keystrokes to a stale prop while the debounced save is in
    // flight); deal.privateNotes is the persisted value from a prior session.
    const notes = dealNotes[deal.id] !== undefined ? dealNotes[deal.id] : (deal.privateNotes || "");

    return (
      <div className="max-w-[1200px] mx-auto py-4 animate-[fadeIn_0.3s_ease]">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
          <div>
            <button 
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
              onClick={() => setActiveDealId(null)}
            >
              ← Back to Opportunity Files
            </button>
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">Opportunity File</span>
            <h1 className="font-display-md text-3xl md:text-5xl text-on-surface break-words">Deal: {property?.title || 'Unknown Property'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-xs font-bold font-working-title tracking-wider uppercase border
              ${deal.status === 'accepted' ? 'bg-success/10 text-success border-success/30' : 
                deal.status === 'declined' ? 'bg-error/10 text-error border-error/30' : 
                deal.status === 'invited' ? 'bg-gold-accent/10 text-gold-accent border-gold-accent/30' :
                'bg-gold-accent/10 text-gold-accent border-gold-accent/30'}`}
            >
              Status: {deal.status === 'invited' ? 'Incoming Handshake' : deal.status}
            </div>
            {deal.status === 'pending' && (
              <button 
                className="border border-surface-variant text-text-secondary hover:text-error hover:border-error font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                onClick={() => {
                  updatePitchStatus(deal.id, 'declined'); // Brokers can withdraw
                  setActiveDealId(null);
                }}
              >
                Withdraw Pitch
              </button>
            )}
            {deal.status === 'invited' && (
              <div className="flex gap-2">
                <button 
                  className="border border-surface-variant text-text-secondary hover:text-error hover:border-error font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                  onClick={() => {
                    updatePitchStatus(deal.id, 'declined');
                    setActiveDealId(null);
                  }}
                >
                  Decline
                </button>
                <button 
                  className="bg-gold-accent text-background hover:opacity-90 font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                  onClick={() => {
                    updatePitchStatus(deal.id, 'accepted');
                  }}
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Col: Connected Listing & Owner Profile */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Connected Listing */}
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Connected Asset</h3>
              <div className="flex flex-col gap-2">
                <span className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase">{property?.type || 'Property'}</span>
                <Link href={`/property/${property?.slug || deal.propertySlug || deal.listingId}`} className="font-working-title text-xl text-on-surface hover:text-gold-accent hover:underline transition-colors break-words">
                  {property?.title || 'View Listing'}
                </Link>
                <span className="text-sm text-text-secondary break-words">{property?.loc || property?.location || 'Location details restricted'}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-variant">
                <Link href={`/property/${property?.slug || deal.propertySlug || deal.listingId}`} className="text-sm font-working-title text-gold-accent flex items-center gap-2 hover:underline">
                  Open Property Dossier <span>→</span>
                </Link>
              </div>
            </div>

            {/* Owner Intelligence */}
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Owner Intelligence</h3>
              
              {deal.status === 'accepted' ? (
                <div className="flex flex-col gap-4">
                  {/* Honest blanks only — a placeholder phone number here is a
                      number a broker would actually dial. */}
                  <div className="p-3 bg-success/5 border border-success/20 rounded">
                    <span className="block text-[10px] tracking-widest text-success uppercase mb-2 font-label-caps">Unlocked Contact Info</span>
                    <div className="mb-2">
                      <span className="text-xs text-text-secondary block">Phone</span>
                      <span className={`font-working-title ${deal.ownerContact?.phone ? 'text-on-surface' : 'text-text-muted'}`}>{deal.ownerContact?.phone || "Not provided — message them in your Inbox"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-secondary block">Email</span>
                      <span className={`font-working-title ${deal.ownerContact?.email ? 'text-on-surface' : 'text-text-muted'}`}>{deal.ownerContact?.email || "Not provided — message them in your Inbox"}</span>
                    </div>
                  </div>
                  <Link href="/dashboard/inbox" className="text-sm font-working-title text-gold-accent flex items-center gap-2 hover:underline">
                    Open conversation <span>→</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-3 opacity-50"><Lock strokeWidth={1.5} size="1em" /></span>
                  <p className="text-sm text-text-secondary">Owner contact details are locked. They will be revealed immediately if the owner accepts your pitch.</p>
                </div>
              )}
            </div>

            {/* Listing Strength — rule-based field completeness, no AI */}
            {property && (() => {
              const strength = computeListingStrength(property);
              return (
                <div className="card-atmosphere rounded-lg p-6">
                  <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Listing Strength</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-14 h-14 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                        <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${strength.score}, 100`} strokeWidth="4"></path>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-data-tabular font-bold text-xs text-text-primary">{strength.score}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {strength.passed} of {strength.total} key fields complete on this listing.
                    </p>
                  </div>
                  {strength.missing.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {strength.missing.map(item => (
                        <li key={item} className="text-xs text-text-secondary flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold-accent/60 shrink-0"></span> Missing: {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-success">All key fields are complete.</p>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Right Col: Thread & Intelligence Notes */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            {/* The Pitch Record */}
            <div className="card-atmosphere rounded-lg overflow-hidden flex flex-col">
              <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
                <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">
                  {deal.status === 'invited' ? 'Message from Owner' : 'Initial Pitch Sent'}
                </h3>
                <span className="font-data-tabular text-xs text-text-muted">{deal.timeRemaining || 'Just now'}</span>
              </div>
              <div className="p-6">
                <p className="font-body-md text-base text-on-surface leading-relaxed">
                  {deal.message}
                </p>
                {deal.status === 'invited' && (
                   <p className="text-sm text-gold-accent mt-4 italic font-working-title">
                     The owner has requested your representation. Accepting this handshake will unlock their contact information immediately.
                   </p>
                )}
              </div>
            </div>

            {/* Private Intelligence Scratchpad */}
            <div className="card-atmosphere-gold rounded-lg overflow-hidden flex flex-col shadow-lg">
              <div className="bg-gold-accent/5 border-b border-gold-accent/20 p-4 flex justify-between items-center">
                <h3 className="font-label-caps text-xs tracking-widest text-gold-accent uppercase flex items-center gap-2">
                  <span>📝</span> Private Deal Notes
                </h3>
                <span className="font-label-caps text-[9px] text-text-muted uppercase">Only visible to you</span>
              </div>
              <div className="p-1">
                <textarea 
                  className="w-full bg-transparent p-5 text-on-surface min-h-[200px] focus:outline-none placeholder:text-surface-variant font-body-md leading-relaxed resize-y"
                  placeholder="Capture client requirements, internal tracking IDs, or next action steps here..."
                  maxLength={4000}
                  value={dealNotes[deal.id] !== undefined ? dealNotes[deal.id] : notes}
                  onChange={(e) => handleSaveNote(deal.id, e.target.value)}
                />
              </div>
            </div>

            {/* Deal Timeline — every inquiry, status change, note, and viewing on this deal */}
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Deal Timeline</h3>
              <DealTimeline dealId={deal.id} mockUserId={currentUser?.id} />
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 1 - COMMAND CENTER (Opportunity Grid & Feed) ---
  return (
    <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease] relative">
      
      {/* Notification Banner */}
      {showNotification && !activeDealId && !showIdCard && (
        <div className="bg-gold-accent/10 border border-gold-accent/30 rounded-lg p-4 mb-6 flex items-start sm:items-center justify-between gap-4 animate-[slideDown_0.4s_ease]">
          <div className="flex gap-4 items-start sm:items-center">
            <div className="w-8 h-8 rounded-full bg-gold-accent flex items-center justify-center text-background text-lg shrink-0">✨</div>
            <div>
              <h4 className="font-working-title text-on-surface text-sm font-bold">New Feature: Official Verified ID Card</h4>
              <p className="text-text-secondary text-xs mt-1">You can now generate and download your official ScoutIt Verified Broker ID card for marketing use.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => { setShowIdCard(true); dismissIdCardBanner(); }}
              className="text-xs font-bold text-background bg-gold-accent px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Generate ID
            </button>
            <button onClick={dismissIdCardBanner} aria-label="Close" className="text-text-muted hover:text-on-surface p-2">✕</button>
          </div>
        </div>
      )}

      {/* ID Card Generation Overlay */}
      {showIdCard && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-md px-4 overflow-y-auto pt-20 pb-10">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-surface-variant rounded-xl shadow-[0_0_50px_rgba(232,174,60,0.1)] flex flex-col relative animate-[scaleUp_0.4s_ease-out]">
            <button 
              onClick={() => setShowIdCard(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-text-muted hover:text-on-surface text-xl z-20"
            >
              ✕
            </button>
            
            <div className="p-8 pb-0 text-center">
              <h2 className="font-headline-editorial text-3xl text-on-surface">Verified Identity</h2>
              <p className="text-text-secondary text-sm mt-2 mb-8">Download or screenshot this card to verify your status with clients.</p>
            </div>

            {/* The Actual ID Card Design */}
            <div className="mx-auto w-full max-w-[400px] mb-8 bg-[#121110] rounded-2xl border border-[rgba(232,174,60,0.4)] relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
              {/* Glass Glare */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent z-10 pointer-events-none"></div>
              
              {/* Header */}
              <div className="bg-gold-accent p-4 flex justify-between items-center relative z-20">
                <span className="font-display-md text-background text-xl font-bold tracking-tighter">S<span className="font-normal">cout</span>IT</span>
                <span className="font-mono text-[10px] text-background/80 tracking-widest font-bold">VERIFIED ADVISOR</span>
              </div>
              
              {/* Body — always the signed-in broker's own data, never a sample
                  persona. Scout Rating is earned by closures only, so until a
                  real rating exists the card says so instead of inventing one. */}
              <div className="p-6 relative z-20">
                <div className="flex gap-6 items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-gold-accent bg-surface-alt overflow-hidden flex items-center justify-center relative shrink-0">
                    <span className="font-headline-editorial text-3xl text-gold-accent">
                      {(currentUser?.name || "?").split(" ").map(w => w.charAt(0)).slice(0, 2).join("").toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline-editorial text-2xl text-on-surface mb-1 truncate">{currentUser?.name || "Unnamed Broker"}</h3>
                    <p className="font-working-title text-text-secondary text-xs tracking-wider uppercase truncate">
                      {(currentUser?.subscription_tier || currentUser?.tier) ? `${(currentUser.subscription_tier || currentUser.tier)} Partner` : "ScoutIt Broker"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-surface-alt p-3 rounded border border-surface-variant flex flex-col justify-center">
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">Scout Rating</span>
                    <span className="text-text-muted font-mono font-bold text-sm" title="Earned through verified closures only">Earned by closures</span>
                  </div>
                  <div className="bg-surface-alt p-3 rounded border border-surface-variant flex flex-col justify-center">
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">PRC License</span>
                    <input 
                      type="text" 
                      className="bg-transparent border-none text-on-surface font-mono font-bold text-sm p-0 focus:ring-0 w-full"
                      placeholder="Enter PRC No."
                      value={prcInput}
                      onChange={(e) => setPrcInput(e.target.value)}
                      onBlur={(e) => handleUpdateLicense('prc_license', e.target.value)}
                    />
                  </div>
                  <div className="bg-surface-alt p-3 rounded border border-surface-variant flex flex-col justify-center">
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">DHSUD No.</span>
                    <input 
                      type="text" 
                      className="bg-transparent border-none text-on-surface font-mono font-bold text-sm p-0 focus:ring-0 w-full"
                      placeholder="Enter DHSUD No."
                      value={dhsudInput}
                      onChange={(e) => setDhsudInput(e.target.value)}
                      onBlur={(e) => handleUpdateLicense('dhsud_number', e.target.value)}
                    />
                  </div>
                </div>

                <div className="border-t border-surface-variant pt-4 flex justify-between items-end">
                  <div>
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">Valid Until</span>
                    <span className="text-text-secondary font-mono text-xs">DEC {new Date().getFullYear()}</span>
                  </div>
                  {/* Mock QR Code Pattern */}
                  <div className="w-12 h-12 bg-white rounded p-1 opacity-90">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDRoMTB2MTBINGV6bTEyIDB2MmgtdjJoLXYyaDJoMnYyaDJ2Mmgydi0yaDJ2LThoMnd6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-cover bg-no-repeat"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-variant bg-surface-alt flex justify-center rounded-b-xl gap-4">
              <button 
                onClick={() => setShowIdCard(false)}
                className="px-6 py-3 border border-surface-variant rounded text-text-secondary font-working-title text-sm hover:text-on-surface transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 bg-gold-accent text-background rounded font-working-title text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>🖨️</span> Print / Save to PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Pitch Modal Overlay */}
      {pitchingListing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-lg card-atmosphere rounded-lg shadow-2xl p-6 animate-[slideUp_0.4s_ease-out]">
            <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Draft Pitch</h3>
            <p className="text-sm text-text-secondary mb-6">Pitching <span className="font-bold text-gold-accent">{pitchingListing.title}</span></p>
            
            <textarea 
              className="w-full bg-surface-alt border border-surface-variant rounded p-4 text-on-surface min-h-[160px] focus:outline-none focus:border-gold-accent transition-colors"
              maxLength={1000}
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
            />
            
            {pitchError && (
              <div className="mt-3 text-error text-sm bg-error/10 border border-error/30 rounded px-3 py-2">{pitchError}</div>
            )}
            <div className="flex items-center justify-between mt-6">
              <div className="text-gold-accent font-data-tabular text-sm flex items-center gap-2">
                <span>◈</span> Cost: 1 Connect · You have {connects}
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 border border-surface-variant text-text-secondary rounded hover:text-on-surface hover:bg-surface-container transition-colors"
                  onClick={() => setPitchingListing(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-gold-accent text-background font-working-title px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSendPitch}
                  disabled={isSendingPitch}
                >
                  {isSendingPitch ? "Sending…" : "Send Pitch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="lg:hidden pt-4 pb-6 mb-6 border-b border-surface-variant flex items-end justify-between gap-4 mesh-bg-hero px-4 rounded-xl shadow-lg">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase text-[10px] mb-1 block">Command Center</span>
          <h2 className="font-headline-editorial text-3xl text-gradient-gold">Broker Intelligence</h2>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-[9px] font-label-caps uppercase tracking-widest text-text-secondary">Deals Won</span>
          <span className="text-on-surface font-data-tabular text-lg font-bold">{accepted.length}</span>
        </div>
      </header>

      {/* Action Bar */}
      <MeshHero className="py-6 lg:py-10 px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 lg:top-auto z-10 border-b border-surface-variant mb-8 hidden lg:flex rounded-2xl shadow-xl border border-[rgba(255,255,255,0.05)]">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Command Center</span>
          <h2 className="font-headline-editorial text-gradient-gold text-4xl lg:text-5xl drop-shadow-md">Broker Intelligence</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-[10px] font-label-caps uppercase tracking-widest text-text-secondary">Pipeline Health</span>
            <span className="text-on-surface font-working-title text-sm">{accepted.length} Deals Won</span>
          </div>
          {/* Permanent entry point — the dismissible "new feature" banner must
              not be the only way to reach the ID card */}
          <button
            className="border border-surface-variant text-text-secondary font-working-title px-4 py-3 rounded text-sm hover:text-gold-accent hover:border-gold-accent/40 transition-all active:scale-[0.98] bg-[rgba(26,16,37,0.5)]"
            onClick={() => setShowIdCard(true)}
            title="Generate your Verified Broker ID card"
          >
            🪪 ID Card
          </button>
          <button
            className="border border-gold-accent text-gold-accent font-working-title px-6 py-3 rounded text-sm font-bold hover:bg-gold-accent hover:text-background transition-all shadow-[0_0_15px_rgba(232,174,60,0.15)] active:scale-[0.98] bg-[rgba(247,198,78,0.05)]"
            onClick={() => {
              setShowMap(prev => !prev);
              if (!showMap) {
                setTimeout(() => document.getElementById('broker-map-section')?.scrollIntoView({ behavior: 'smooth' }), 100);
              }
            }}
          >
            {showMap ? 'Hide Map' : '+ Find Opportunities (Map)'}
          </button>
        </div>
      </MeshHero>

      <ScoutInsightPanel pitches={pitches} listings={listings} taskSummary={taskSummary} />

      {/* Embedded Radar Map */}
      {showMap && (
        <div id="broker-map-section" className="w-full h-[600px] bg-surface border border-surface-variant rounded-lg overflow-hidden relative shadow-[0_0_30px_rgba(232,174,60,0.05)] mb-8 scroll-mt-24">
          <link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
          
          {mapError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 text-error z-20 p-8 text-center">
              <span className="font-bold mb-2">Map Error</span>
              <span className="text-sm">{mapError}</span>
            </div>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
          
          <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
            <div className="bg-background/90 backdrop-blur border border-surface-variant p-4 rounded shadow-lg">
              <div className="text-[10px] font-label-caps tracking-widest text-gold-accent mb-1 uppercase">
                Spatial Intelligence
              </div>
              <div className="font-working-title text-on-surface">{feed.filter(l => l.coordinates || (l.lng && l.lat)).length} targets in radar</div>
              {radius !== 'any' && <div className="text-xs text-text-secondary mt-1">{radius}km radius from Makati CBD</div>}
            </div>
            
            <select
              className="bg-background/90 backdrop-blur border border-surface-variant text-on-surface text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-gold-accent transition-colors"
              value={radius}
              onChange={handleRadiusChange}
            >
              <option value="any">Search: Metro Manila Wide</option>
              <option value="3">Within 3km (Makati/BGC Core)</option>
              <option value="5">Within 5km</option>
              <option value="10">Within 10km</option>
            </select>
          </div>
            
          <button 
            className="absolute bottom-6 right-6 pointer-events-auto bg-surface-container border border-surface-variant hover:border-gold-accent text-on-surface rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
            onClick={() => setShowMap(false)} aria-label="Close Map"
          >
            ✕
          </button>
        </div>
      )}

      {/* High-Density Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column: Active Opportunities */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-surface-variant pb-3">
            <h3 className="font-working-title text-2xl text-on-surface">Active Deal Files</h3>
            <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase bg-surface-alt px-2 py-1 rounded-md">{myPitches.length} Total tracked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activePitches.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-surface-variant rounded-lg flex flex-col items-center">
                <span className="text-3xl mb-4 opacity-50">📂</span>
                <p className="text-on-surface font-working-title mb-2">No active deal files.</p>
                <p className="text-text-secondary text-sm">Find properties in the intelligence feed to initiate a deal file.</p>
              </div>
            )}
            
            {activePitches.map((deal) => {
              const pStatus = deal.status;
              const isDeclined = pStatus === 'declined';
              return (
                <div 
                  key={deal.id} 
                  className={`rounded-xl p-6 flex flex-col cursor-pointer transition-all group relative overflow-hidden h-52 ${isDeclined ? 'opacity-60 grayscale border border-surface-variant bg-surface-alt' : 'hov-glow'}`}
                  onClick={() => setActiveDealId(deal.id)}
                >
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-label-caps text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded ${isDeclined ? 'bg-error/10 text-error' : pStatus === 'invited' ? 'bg-gold-accent/10 text-gold-accent' : 'bg-surface-alt text-text-secondary'}`}>
                      {pStatus === 'invited' ? 'Incoming Handshake' : pStatus}
                    </span>
                    <span className="text-[10px] text-text-muted font-data-tabular">{deal.timeRemaining || 'Just now'}</span>
                  </div>
                  
                  <div className="mt-2 mb-auto pr-2">
                    <h4 className="font-working-title text-base text-on-surface group-hover:underline truncate">{dealTitle(deal)}</h4>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 break-words">{deal.loc || 'Location details hidden'}</p>
                  </div>
                  
                  <div className="border-t border-surface-variant pt-3 mt-4 flex justify-between items-center text-xs">
                    <span className="text-gold-accent flex items-center gap-1 group-hover:gap-2 transition-all font-working-title">
                      Open Workspace <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-end border-b border-surface-variant pb-2 mt-8">
            <h3 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              <span className="text-gold-accent">✦</span> Verified Advisory Portfolio
            </h3>
            <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase">{accepted.length} Properties</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accepted.length === 0 && (
              <div className="col-span-full py-12 text-center border border-dashed border-surface-variant rounded-lg flex flex-col items-center">
                <span className="text-3xl mb-4 opacity-50">🛡️</span>
                <p className="text-on-surface font-working-title mb-2">No Verified Properties.</p>
                <p className="text-text-secondary text-sm">Accept a handshake from an owner to become a Verified Advisor.</p>
              </div>
            )}
            
            {accepted.map((deal) => {
              return (
                <div 
                  key={deal.id} 
                  className="rounded-xl p-6 flex flex-col cursor-pointer transition-all group relative overflow-hidden h-52 border border-success/30 bg-success/5 hover:border-success/50 hover:bg-success/10 hover:-translate-y-2 shadow-[0_4px_20px_rgba(16,185,129,0.05)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-md"
                  onClick={() => setActiveDealId(deal.id)}
                >
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-label-caps text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded bg-success/10 text-success flex items-center gap-1">
                      <span>🛡️</span> Verified Advisor
                    </span>
                    <span className="text-[10px] text-text-muted font-data-tabular">Active</span>
                  </div>
                  
                  <div className="mt-2 mb-auto pr-2">
                    <h4 className="font-working-title text-base text-on-surface group-hover:underline truncate">{dealTitle(deal)}</h4>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2 break-words">{deal.loc || 'Location details hidden'}</p>
                  </div>
                  
                  <div className="border-t border-surface-variant pt-3 mt-4 flex justify-between items-center text-xs">
                    <span className="text-gold-accent flex items-center gap-1 group-hover:gap-2 transition-all font-working-title">
                      Manage Portfolio <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tasks + Feed */}
        <div id="broker-feed" className="lg:w-1/3 flex flex-col gap-6 mt-8 lg:mt-0 scroll-mt-20 lg:sticky lg:top-8 lg:h-[calc(100vh-4rem)]">
          {/* The "don't forget" engine — crm_tasks, incl. auto follow-ups after completed viewings */}
          <TaskRail mockUserId={currentUser?.id} onSummary={handleTaskSummary} />

          <div className="flex justify-between items-end border-b border-surface-variant pb-2">
            <h3 className="font-working-title text-xl text-on-surface">Market Intelligence Feed</h3>
            <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase">{feed.length} Targets</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-12 md:pb-0 hide-scrollbar">
            {feed.length === 0 && (
              <div className="text-center p-8 text-text-muted border border-surface-variant rounded">
                You have pitched all available properties in the market.
              </div>
            )}
            {feed.map((item, index) => (
              <div key={item.id} className="hov-card p-6 rounded-xl transition-all group relative stagger-enter" style={{ '--i': index }}>
                <div className="absolute inset-0 bg-gradient-to-br from-[rgba(255,255,255,0.02)] to-transparent pointer-events-none rounded-xl"></div>
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <span className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase">{item.type || 'Property'}</span>
                  <span className="text-text-secondary text-[10px] font-data-tabular bg-surface-alt px-1.5 py-0.5 rounded">{item.time || 'New'}</span>
                </div>
                
                <h4 className="font-working-title text-on-surface text-lg mb-1 truncate">
                  <Link href={`/property/${item.slug || item.id}`} className="hover:text-gold-accent hover:underline transition-colors block truncate">
                    {item.title}
                  </Link>
                </h4>
                <div className="text-text-secondary text-xs line-clamp-2 leading-relaxed break-words">{item.hook || item.universe_summary || item.description || 'Details restricted.'}</div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-[#0a0a0a] rounded border border-surface-variant text-center">
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-1 font-label-caps">Owner Tenure</div>
                    <div className="text-on-surface font-data-tabular text-xs">{item.signals?.accountAge || 'New'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-1 font-label-caps">Completeness</div>
                    {/* item.signals.completeness is a hardcoded placeholder
                        (never derived from real fields) everywhere it's set
                        in DashboardContext — computeListingStrength is the
                        only real source, same as the Listing Strength card
                        below once a deal file is opened on this property. */}
                    <div className="text-on-surface font-data-tabular text-xs">{computeListingStrength(item).score}%</div>
                  </div>
                </div>
                
                <button 
                  className="mt-5 w-full border border-gold-accent text-gold-accent font-working-title text-sm py-3 rounded-lg hover:bg-gold-accent hover:text-background transition-all font-bold shadow-[0_0_15px_rgba(247,198,78,0.1)] active:scale-[0.98]"
                  onClick={() => handleOpenPitchModal(item)}
                >
                  Open Deal File (1 Connect)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
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


