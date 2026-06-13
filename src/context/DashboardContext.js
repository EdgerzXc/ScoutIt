"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Bookmark } from "lucide-react";

const DashboardContext = createContext();

export function useDashboard() {
  return useContext(DashboardContext);
}

export function DashboardProvider({ children }) {
  const [listings, setListings] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [connects, setConnects] = useState(5);
  const [currentUser, setCurrentUser] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default Center: Makati CBD
  const DEFAULT_MAP_CENTER = [121.0215, 14.5547]; 
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Sync connects & user from local storage
  useEffect(() => {
    const userStr = localStorage.getItem("scoutit_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (user.connects_balance !== undefined) {
        setConnects(user.connects_balance);
      }
    }
  }, []);

  // Fetch from Supabase
  useEffect(() => {
    const fetchLiveIntelligence = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Properties (Dossiers)
        const { data: propertiesData, error: propError } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });

        if (!propError && propertiesData) {
          setListings(mapSupabaseProperties(propertiesData));
        }

        // 2. Fetch Deals (Pitches)
        const { data: dealsData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .order('created_at', { ascending: false });

        if (!dealError && dealsData) {
          const mappedDeals = dealsData.map(d => ({
            id: d.id,
            listingId: d.property_id,
            title: d.property_id, // We'll rely on the UI to map this to the property title
            type: 'Deal',
            brokerName: 'Broker User',
            brokerFirm: 'Independent',
            message: d.pitch_message,
            status: d.status,
            timeRemaining: new Date(d.created_at).toLocaleDateString(),
            statusText: d.status.charAt(0).toUpperCase() + d.status.slice(1),
            badgeText: d.status === 'accepted' ? 'check_circle' : '',
            isCurrentUserBroker: true,
            isCurrentUserOwner: true
          }));
          setPitches(mappedDeals);
        }

        // 3. Fetch Saved Intel
        const { data: savedData, error: savedError } = await supabase
          .from('saved_intel')
          .select('*');
          
        if (!savedError && savedData) {
          setSavedIds(savedData.map(s => s.property_id));
        }

      } catch (error) {
        console.error("Error fetching intelligence from Ledger:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveIntelligence();
  }, []);

  // ── Toasts ──
  const addToast = (message, icon = "✓") => {
    const id = "t_" + Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // ── Save / unsave (Supabase) ──
  const toggleSave = async (item) => {
    const isSaved = savedIds.includes(item.id);
    if (isSaved) {
      setSavedIds(prev => prev.filter(id => id !== item.id));
      addToast("Removed from your Intelligence Archive", <Bookmark strokeWidth={1.5} size="1em" />);
      await supabase.from('saved_intel').delete().eq('property_id', item.id);
    } else {
      setSavedIds(prev => [...prev, item.id]);
      addToast("Saved to Intelligence Archive", <Bookmark strokeWidth={1.5} size="1em" />);
      await supabase.from('saved_intel').insert([{ property_id: item.id }]);
    }
  };

  // ── Owner listing management (Supabase) ──
  const updateListing = async (listingId, data) => {
    // Optimistic UI update
    setListings(prev => prev.map(l => {
      if (l.id !== listingId) return l;
      return {
        ...l,
        ...data,
        hasMedia: data.mediaLink ? true : l.hasMedia,
        signals: { ...l.signals, completeness: data.completenessScore + "%" }
      };
    }));
    addToast("Dossier updated", "✏️");

    // Supabase update
    await supabase.from('properties').update({
      title: data.title || 'Updated Property',
      type: data.type,
      location: data.location,
      price: data.price,
      description: data.description,
      media_link: data.mediaLink,
      completeness_score: data.completenessScore,
      verified: data.verified
    }).eq('id', listingId);
  };

  const closeListing = async (listingId) => {
    setListings(prev => prev.filter(l => l.id !== listingId));
    addToast("Property File closed", "🏁");
    await supabase.from('properties').delete().eq('id', listingId);
  };

  const addListing = async (listing) => {
    addToast("Geocoding Location...", "⏳");
    
    // 1. Mapbox Geocoding
    let coordinatesStr = null;
    if (MAPBOX_TOKEN && listing.location) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(listing.location)}.json?country=ph&limit=1&access_token=${MAPBOX_TOKEN}`);
        const geoData = await res.json();
        if (geoData.features && geoData.features.length > 0) {
          const [lng, lat] = geoData.features[0].center;
          coordinatesStr = `POINT(${lng} ${lat})`;
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }

    addToast("Initializing Dossier...", "⏳");
    
    // 2. Insert into Supabase
    const { data, error } = await supabase.from('properties').insert([{
      title: `${listing.type} in ${listing.location}`,
      type: listing.type,
      location: listing.location,
      price: listing.price ? parseFloat(listing.price) : null,
      description: listing.description,
      media_link: listing.mediaLink,
      completeness_score: listing.completenessScore,
      verified: listing.verified,
      coordinates: coordinatesStr
    }]).select();

    if (error || !data) {
      addToast("Error initializing dossier.", "❌");
      return;
    }

    const newDbListing = data[0];

    const newListing = {
      ...listing,
      id: newDbListing.id, // Use real Supabase UUID
      hasMedia: listing.mediaLink ? true : false,
      tag: 'NEW',
      tagClass: 'bg-gold-accent/20 text-gold-accent',
      time: 'Just now',
      ownerId: 'current_user',
      signals: {
        ownerAge: 'New — no data',
        ownerAgeClass: 'text-text-secondary',
        accountAge: 'New',
        completeness: listing.completenessScore + '%'
      }
    };
    
    setListings(prev => [newListing, ...prev]);
    addToast("Dossier live on the Intelligence Ledger", "✅");
    addNotification({
      title: "Listing Published",
      desc: `Your property at ${listing.location} is now live in the Broker feed.`,
      icon: "✅"
    });
  };

  const sendPitch = async (listingId, message) => {
    if (connects < 1) return false;
    
    const newBalance = connects - 1;
    setConnects(newBalance);
    if (currentUser) {
      const updatedUser = { ...currentUser, connects_balance: newBalance };
      localStorage.setItem("scoutit_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }

    // Insert into Supabase Deals table
    const { data, error } = await supabase.from('deals').insert([{
      property_id: listingId,
      pitch_message: message,
      status: 'pending'
    }]).select();

    if (error) return false;

    const targetListing = listings.find(l => l.id === listingId);

    const newPitch = {
      id: data[0].id,
      listingId,
      title: targetListing ? targetListing.title : 'New Property',
      loc: targetListing ? targetListing.loc : 'Location Masked',
      type: targetListing ? targetListing.type : 'Sourced',
      brokerName: currentUser?.name || 'ScoutIt Broker',
      brokerFirm: 'ScoutIt Pro Member',
      message,
      status: 'pending',
      timeRemaining: 'Just now',
      statusText: 'Sent Just now',
      badgeText: 'Waiting',
      isCurrentUserBroker: true,
      isCurrentUserOwner: true 
    };

    setPitches(prev => [newPitch, ...prev]);
    addToast("Deal Initiated — 1 Connect spent", "⚡");

    return true;
  };

  const updatePitchStatus = async (pitchId, newStatus) => {
    // Optimistic UI
    setPitches(prev => prev.map(p => {
      if (p.id === pitchId) {
        return { 
          ...p, 
          status: newStatus,
          statusText: newStatus === 'accepted' ? 'Meeting Set' : 'Owner Declined',
          badgeText: newStatus === 'accepted' ? 'check_circle' : ''
        };
      }
      return p;
    }));

    addToast(`Deal status updated to ${newStatus}`, "🤝");

    // Supabase update
    await supabase.from('deals').update({ status: newStatus }).eq('id', pitchId);
  };

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: 'n_' + Date.now(), read: false }, ...prev]);
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // ── Proximity Radar (Radius Search) ──
  const searchByRadius = async (radiusKm, centerLng = DEFAULT_MAP_CENTER[0], centerLat = DEFAULT_MAP_CENTER[1]) => {
    setIsLoading(true);
    try {
      if (radiusKm === 'any') {
        // Fetch all properties if no radius is selected
        const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setListings(mapSupabaseProperties(data));
        }
      } else {
        // Call the PostGIS RPC function
        const { data, error } = await supabase.rpc('search_properties_in_radius', {
          search_lng: centerLng,
          search_lat: centerLat,
          radius_km: parseFloat(radiusKm)
        });
        
        if (!error && data) {
          setListings(mapSupabaseProperties(data));
        }
      }
    } catch (err) {
      console.error("Radius search failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to map DB row to UI model
  const mapSupabaseProperties = (propertiesData) => {
    return propertiesData.map(p => ({
      id: p.id,
      type: p.type,
      title: p.title,
      desc: p.description || '',
      loc: p.location,
      hasMedia: !!p.media_link,
      mediaLink: p.media_link,
      price: p.price,
      tag: 'LIVE',
      tagClass: 'bg-gold-accent/20 text-gold-accent',
      time: new Date(p.created_at).toLocaleDateString(),
      ownerId: p.owner_id || 'current_user',
      completenessScore: p.completeness_score,
      verified: p.verified,
      coordinates: p.coordinates, // keep the geography string if needed
      signals: {
        ownerAge: 'Verified',
        ownerAgeClass: 'text-success',
        accountAge: 'Active',
        completeness: p.completeness_score + '%'
      }
    }));
  };

  return (
    <DashboardContext.Provider value={{
      listings,
      pitches,
      notifications,
      connects,
      currentUser,
      toasts,
      savedIds,
      isLoading,
      addToast,
      toggleSave,
      addListing,
      updateListing,
      closeListing,
      sendPitch,
      updatePitchStatus,
      markNotificationsRead,
      clearAllNotifications,
      searchByRadius,
      MAPBOX_TOKEN,
      DEFAULT_MAP_CENTER
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
