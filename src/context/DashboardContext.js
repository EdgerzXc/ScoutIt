 
/* eslint-disable react-hooks/immutability */
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { onAuthStateChange, getSession } from "../lib/authClient";
import { Bookmark } from "lucide-react";
import { getBalance, spendConnects, initWalletIfEmpty } from "../lib/connectsWallet";

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

  // Sync user from Supabase Auth
  useEffect(() => {
    const fetchSession = async () => {
      let session = null;
      try {
        const res = await getSession();
        session = res?.data?.session;
      } catch (err) {
        console.warn("Supabase getSession failed, falling back to mock:", err);
      }

      if (session?.user) {
        await handleUserLogin(session.user);
      } else {
        // If they are using the DEV Toolbox mock user, preserve it
        const mockStr = localStorage.getItem("scoutit_user");
        if (mockStr && mockStr.includes("master-dev")) {
          try {
            const parsed = JSON.parse(mockStr);
            setCurrentUser(parsed);
            setIsLoading(false);
            fetchNotifications(parsed.id);
            return;
          } catch(e) {}
        }

        // Otherwise, clear old mock data if no real session exists
        localStorage.removeItem("scoutit_user");
        setCurrentUser(null);
        setIsLoading(false);
      }
    };
    fetchSession();

    const { data: { subscription } } = onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await handleUserLogin(session.user);
      } else {
        const mockStr = localStorage.getItem("scoutit_user");
        if (!(mockStr && mockStr.includes("master-dev"))) {
          setCurrentUser(null);
        }
      }
    });

    return () => subscription?.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserLogin = async (authUser) => {
    // Fetch fresh profile data
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const mergedUser = {
      ...authUser,
      ...profile,
      id: authUser.id,
    };
    setCurrentUser(mergedUser);

    const role = (profile?.role || "seeker").toLowerCase();
    const tier = (profile?.subscription_tier || "starry").toLowerCase();
    initWalletIfEmpty(role, tier);
    setConnects(getBalance(role, tier));

    await syncLocalReactionsToSupabase(authUser.id);
    fetchNotifications(authUser.id);
  };

  // ── Notifications (persisted — Track 1, PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md) ──
  const authedFetch = async (url, options = {}) => {
    const { data: { session } } = await getSession();
    const token = session?.access_token;
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Authorization": token ? `Bearer ${token}` : "",
      },
    });
  };

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const mockParam = userId ? `?mockOwnerId=${userId}` : "";
      const res = await authedFetch(`/api/notifications${mockParam}`);
      if (!res.ok) return;
      const data = await res.json();
      setNotifications((data.notifications || []).map(n => ({
        id: n.id,
        title: n.title,
        desc: n.desc,
        icon: n.icon,
        read: n.read,
        propertyId: n.propertyId,
        notificationType: n.notificationType,
      })));
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  };

  const syncLocalReactionsToSupabase = async (userId) => {
    try {
      const raw = localStorage.getItem("scoutit_reactions");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const reaction of parsed) {
          await supabase.from('saved_intel').insert([{
            user_id: userId,
            property_id: reaction.property_id
          }]); // Simple insert, fails gracefully if RLS/unique prevents duplicate
        }
      }
    } catch(e) {}
  };

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

        let supabaseListings = [];
        if (!propError && propertiesData) {
          supabaseListings = mapSupabaseProperties(propertiesData);
        }

        let airtableListings = [];
        try {
          const cmsRes = await fetch('/api/cms');
          if (cmsRes.ok) {
            const cmsData = await cmsRes.json();
            if (cmsData.properties) {
              airtableListings = cmsData.properties.map(p => ({
                id: p.id,
                type: p.property_type || 'Property',
                title: p.title,
                desc: '',
                loc: p.location || p.city,
                location: p.location || p.city,
                hasMedia: !!p.image,
                mediaLink: p.image,
                price: p.tenure,
                tag: 'LIVE',
                tagClass: 'bg-success/20 text-success',
                time: 'Verified',
                ownerId: 'scoutit-cms',
                spaceCategory: p.spaceCategory || p.property_type,
                details: {},
                pipelineStatus: 'approved',
                completenessScore: 100,
                verified: true,
                coordinates: p.lat && p.lng ? `POINT(${p.lng} ${p.lat})` : null,
                signals: {
                  ownerAge: 'Verified',
                  ownerAgeClass: 'text-success',
                  accountAge: 'ScoutIt Verified',
                  completeness: '100%'
                }
              }));
            }
          }
        } catch (e) {
          console.error("Failed to fetch CMS properties:", e);
        }

        setListings([...airtableListings, ...supabaseListings]);

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
            privateNotes: d.private_notes || '',
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
          
        let supabaseSavedIds = [];
        if (!savedError && savedData) {
          supabaseSavedIds = savedData.map(s => s.property_id);
        }

        // Also merge local storage reactions (Ledger stays on device)
        let localSavedIds = [];
        try {
          const raw = localStorage.getItem("scoutit_reactions");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localSavedIds = parsed.map(p => p.property_id);
            }
          }
        } catch(e) {}

        setSavedIds([...new Set([...supabaseSavedIds, ...localSavedIds])]);

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

  // ── Save / unsave (Supabase & Local Storage) ──
  const toggleSave = async (item) => {
    const isSaved = savedIds.includes(item.id);
    if (isSaved) {
      setSavedIds(prev => prev.filter(id => id !== item.id));
      addToast("Removed from your Saved Properties", <Bookmark strokeWidth={1.5} size="1em" />);
      
      // Sync Supabase
      if (currentUser?.id) await supabase.from('saved_intel').delete().eq('user_id', currentUser.id).eq('property_id', item.id);
      
      // Sync Local Storage
      try {
        const raw = localStorage.getItem("scoutit_reactions");
        if (raw) {
          let parsed = JSON.parse(raw);
          parsed = parsed.filter(p => p.property_id !== item.id);
          localStorage.setItem("scoutit_reactions", JSON.stringify(parsed));
        }
      } catch(e) {}
    } else {
      setSavedIds(prev => [...prev, item.id]);
      addToast("Intel logged to secure Ledger", <Bookmark strokeWidth={1.5} size="1em" />);
      
      // Sync Supabase
      if (currentUser?.id) await supabase.from('saved_intel').insert([{ user_id: currentUser.id, property_id: item.id }]);
      
      // Sync Local Storage
      try {
        const raw = localStorage.getItem("scoutit_reactions") || "[]";
        let parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) parsed = [];
        parsed.push({
          property_id: item.id,
          property_title: item.title,
          reaction_type: "Save",
          timestamp: Date.now()
        });
        localStorage.setItem("scoutit_reactions", JSON.stringify(parsed));
      } catch(e) {}
    }
  };

  // ── QuestIT (Raise a Quest) ──
  const raiseQuest = async (propertyId, questScope) => {
    if (currentUser?.id) {
      // Create bounty claim for the Guild (Quest posting is now free)
      await supabase.from('bounty_claims').insert([{
        target_field: questScope,
        property_id: propertyId,
        initiator_id: currentUser.id,
        status: 'open',
        payout_connects: 0
      }]);
    }

    addToast(`Data Quest raised for ${questScope} — Free to post`, "✨");
    return true;
  };

  // ── Owner listing management (Supabase) ──
  // Returns true if the change was persisted to the server, false otherwise.
  // Pass { silent: true } when the caller renders its own save feedback
  // (e.g. the Inventory page's Save button) to avoid duplicate toasts.
  const updateListing = async (listingId, data, options = {}) => {
    const { silent = false } = options;

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
    if (!silent) addToast("Dossier updated", "✏️");

    // Server-side dual-database update (Supabase + Airtable if approved)
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;

      const res = await fetch("/api/dashboard/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          submissionId: listingId,
          data,
          mockOwnerId: currentUser?.id
        })
      });

      if (!res.ok) {
        throw new Error("Update failed");
      }
      return true;
    } catch (err) {
      console.error("Failed to sync listing update", err);
      if (!silent) addToast("Failed to sync to database", "❌");
      return false;
    }
  };

  const closeListing = async (listingId) => {
    // Optimistic UI update
    setListings(prev => prev.filter(l => l.id !== listingId));
    addToast("Property File closed", "🏁");
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || (currentUser?.id === 'master-dev' ? 'mock-e2e-token' : '');
      
      const res = await fetch("/api/dashboard/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId: listingId, userId: currentUser?.id })
      });
      
      if (!res.ok) {
        throw new Error("Delete failed on server");
      }
    } catch (err) {
      console.error("Failed to delete property", err);
      addToast("Error deleting from database", "❌");
    }
  };

  const publishListing = async (listingId) => {
    if (!currentUser?.id) return false;
    addToast("Syncing to live network...", "⏳");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || (currentUser.id === 'master-dev' ? 'mock-e2e-token' : '');
      
      const res = await fetch("/api/dashboard/publish", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId: listingId, userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.warning || "Failed to publish");
      }
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, pipelineStatus: 'approved' } : l));
      addToast("Property is now LIVE", "🌍");
      return true;
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to publish", "❌");
      return false;
    }
  };

  const addListing = async (listing) => {
    addToast("Geocoding Location...", "⏳");
    
    // 1. Mapbox Geocoding
    let lat = null;
    let lng = null;
    if (MAPBOX_TOKEN && listing.location) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(listing.location)}.json?country=ph&limit=1&access_token=${MAPBOX_TOKEN}`);
        const geoData = await res.json();
        if (geoData.features && geoData.features.length > 0) {
          [lng, lat] = geoData.features[0].center;
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }

    addToast("Initializing Dossier...", "⏳");
    
    // 2. Insert into Supabase (owned by the current user; category data carried in details)
    const slug = (listing.title || `${listing.type} in ${listing.location}`)
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const coordinates = (lat != null && lng != null) ? `POINT(${lng} ${lat})` : null;
    const { data, error } = await supabase.from('properties').insert([{
      owner_id: currentUser?.id || null,
      title: listing.title || `${listing.type} in ${listing.location}`,
      type: listing.type,
      space_category: listing.category || listing.type,
      slug,
      location: listing.location,
      price: listing.price ? parseFloat(listing.price) : null,
      description: listing.description,
      media_link: listing.mediaLink,
      completeness_score: listing.completenessScore,
      verified: listing.verified,
      pipeline_status: 'pending',
      details: listing.details || {},
      coordinates
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
      ownerId: currentUser?.id || null,
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
      icon: "✅",
      propertyId: newListing.id,
      notificationType: "property_published"
    });
    
    return newListing;
  };

  const bulkAddListings = async (propertiesArray) => {
    addToast("Bulk processing via AI Blueprint...", "🤖");
    
    // Attempt insertion
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;

      const res = await fetch('/api/dashboard/bulk-insert', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ properties: propertiesArray })
      });
      const data = await res.json();
      
      if (data.success && data.inserted) {
        addToast(`Successfully synced ${data.count} properties to Ledger.`, "✅");
        
        // Convert to UI models
        const mappedNew = mapSupabaseProperties(data.inserted);
        setListings(prev => [...mappedNew, ...prev]);
        
        addNotification({
          title: "Bulk Import Complete",
          desc: `${data.count} new properties are now live in the global feed.`,
          icon: "🚀"
        });
        
        return true;
      } else {
        addToast("Bulk insert failed.", "❌");
        return false;
      }
    } catch (err) {
      console.error(err);
      addToast("Network error during bulk insert.", "❌");
      return false;
    }
  };

  const addConciergeListing = async (fileName) => {
    addToast("Uploading document securely...", "⏳");
    
    // Simulate upload delay
    await new Promise(r => setTimeout(r, 1500));
    addToast("Document uploaded. Initializing AI Draft...", "🤖");
    await new Promise(r => setTimeout(r, 800));

    const title = `Drafting from PDF: ${fileName}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const { data, error } = await supabase.from('properties').insert([{
      owner_id: currentUser?.id || null,
      title: title,
      type: 'Unknown',
      space_category: 'Unknown',
      slug,
      location: 'Pending AI Extraction',
      pipeline_status: 'ai_drafting',
      details: { source_pdf: fileName }
    }]).select();

    if (error || !data) {
      addToast("Error starting Concierge AI.", "❌");
      return;
    }

    const newDbListing = data[0];

    const newListing = {
      id: newDbListing.id,
      type: 'Unknown',
      title: title,
      desc: '',
      loc: 'Pending AI Extraction',
      location: 'Pending AI Extraction',
      hasMedia: false,
      mediaLink: null,
      price: null,
      tag: 'DRAFTING',
      tagClass: 'bg-gold-accent/20 text-gold-accent',
      time: 'Just now',
      ownerId: currentUser?.id || null,
      spaceCategory: 'Unknown',
      details: { source_pdf: fileName },
      pipelineStatus: 'ai_drafting',
      completenessScore: 0,
      verified: false,
      signals: {
        ownerAge: 'New — no data',
        ownerAgeClass: 'text-text-secondary',
        accountAge: 'New',
        completeness: '0%'
      }
    };
    
    setListings(prev => [newListing, ...prev]);
    addToast("Pitch deck sent to Council AI for drafting", "✅");
    addNotification({
      title: "AI Drafting Started",
      desc: `Your document '${fileName}' is being parsed. We'll notify you when the draft is ready.`,
      icon: "🤖",
      propertyId: newListing.id,
      notificationType: "property_drafting"
    });
  };

  const sendPitch = async (listingId, message) => {
    const role = (currentUser?.active_roles?.[0] || currentUser?.role || "broker").toLowerCase();
    const tier = (currentUser?.subscription_tier || currentUser?.tier || "starry").toLowerCase();
    const result = spendConnects(role, tier, 1);
    if (!result.success) {
      addToast("Not enough Connects to send this pitch.", "◈");
      return false;
    }
    setConnects(result.remaining);

    // Insert into Supabase Deals table
    const { data, error } = await supabase.from('deals').insert([{
      property_id: listingId,
      broker_id: currentUser?.id || null,
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

  const inviteBroker = async (listingId, brokerName) => {
    if (!brokerName) return false;
    const role = (currentUser?.active_roles?.[0] || currentUser?.role || "owner").toLowerCase();
    const tier = (currentUser?.subscription_tier || currentUser?.tier || "starry").toLowerCase();
    const result = spendConnects(role, tier, 1);
    if (!result.success) {
      addToast("Not enough Connects to send the handshake", "◈");
      return false;
    }

    // Call the edge function for server-side Connect deduction and ledger record
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;

      const res = await fetch("/api/dashboard/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ listingId, brokerName, userId: currentUser?.id, role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process handshake");
      }
      
      setConnects(result.remaining);

      const targetListing = listings.find(l => l.id === listingId);
      setPitches(prev => [{
        id: data.dealId,
        listingId,
        title: targetListing ? targetListing.title : 'Property',
        type: 'Advisor',
        brokerName,
        brokerFirm: 'Invited advisor',
        message: `Owner invited ${brokerName}.`,
        status: 'invited',
        statusText: 'Invited — awaiting broker',
        badgeText: 'Waiting',
        isCurrentUserBroker: false,
        isCurrentUserOwner: true
      }, ...prev]);
      addToast(`Handshake sent to ${brokerName} — 1 Connect spent`, "🤝");
      return true;
    } catch (err) {
      console.error(err);
      addToast(err.message, "❌");
      return false;
    }
  };

  const updatePitchStatus = async (pitchId, newStatus) => {
    // Supabase update via Edge Function
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;

      const res = await fetch("/api/dashboard/deals/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ dealId: pitchId, newStatus, userId: currentUser?.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update deal status");

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
      return true;
    } catch (err) {
      console.error(err);
      addToast(err.message, "❌");
      return false;
    }
  };

  const addNotification = (notif) => {
    setNotifications(prev => [{ ...notif, id: 'n_' + Date.now(), read: false }, ...prev]);

    // Persist client-triggered notifications through the same table as the
    // server-triggered ones (stale-listing, broker-on-change).
    if (currentUser?.id) {
      const mockParam = currentUser?.id ? `?mockOwnerId=${currentUser.id}` : "";
      authedFetch(`/api/notifications${mockParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockOwnerId: currentUser?.id || undefined,
          title: notif.title,
          desc: notif.desc,
          icon: typeof notif.icon === "string" ? notif.icon : "🔔",
          notificationType: notif.notificationType || "client_event",
          propertyId: notif.propertyId || undefined,
        }),
      }).catch(e => console.error("Failed to persist notification", e));
    }
  };

  const markNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (currentUser?.id) {
      const mockParam = currentUser?.id ? `?mockOwnerId=${currentUser.id}` : "";
      authedFetch(`/api/notifications${mockParam}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockOwnerId: currentUser?.id || undefined }),
      }).catch(e => console.error("Failed to mark notifications read", e));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (currentUser?.id) {
      const mockParam = currentUser?.id ? `?mockOwnerId=${currentUser.id}` : "";
      authedFetch(`/api/notifications${mockParam}`, { method: "DELETE" })
        .catch(e => console.error("Failed to clear notifications", e));
    }
  };

  // ── Proximity Radar (Radius Search via Local Haversine) ──
  const searchByRadius = async (radiusKm, centerLng = DEFAULT_MAP_CENTER[0], centerLat = DEFAULT_MAP_CENTER[1]) => {
    setIsLoading(true);
    try {
      // Always fetch all from Supabase
      const { data: propertiesData, error: propError } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
      
      let supabaseListings = [];
      if (!propError && propertiesData) {
        supabaseListings = mapSupabaseProperties(propertiesData);
      }

      // Always fetch from CMS
      let airtableListings = [];
      try {
        const cmsRes = await fetch('/api/cms');
        if (cmsRes.ok) {
          const cmsData = await cmsRes.json();
          if (cmsData.properties) {
            airtableListings = cmsData.properties.map(p => ({
              id: p.id,
              type: p.property_type || 'Property',
              title: p.title,
              desc: '',
              loc: p.location || p.city,
              location: p.location || p.city,
              hasMedia: !!p.image,
              mediaLink: p.image,
              price: p.tenure,
              tag: 'LIVE',
              tagClass: 'bg-success/20 text-success',
              time: 'Verified',
              ownerId: 'scoutit-cms',
              spaceCategory: p.spaceCategory || p.property_type,
              details: {},
              pipelineStatus: 'approved',
              completenessScore: 100,
              verified: true,
              coordinates: p.lat && p.lng ? `POINT(${p.lng} ${p.lat})` : null,
              signals: {
                ownerAge: 'Verified',
                ownerAgeClass: 'text-success',
                accountAge: 'ScoutIt Verified',
                completeness: '100%'
              }
            }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch CMS properties:", e);
      }

      const allData = [...airtableListings, ...supabaseListings];

      if (radiusKm === 'any') {
        setListings(allData);
      } else {
        const radius = parseFloat(radiusKm);
        const toRad = (value) => (value * Math.PI) / 180;
        const filtered = allData.filter(p => {
          if (!p.coordinates) return false;
          
          const match = p.coordinates.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (!match) return false;
          
          const pLng = parseFloat(match[1]);
          const pLat = parseFloat(match[2]);

          const R = 6371; // Earth's radius in km
          const dLat = toRad(pLat - centerLat);
          const dLon = toRad(pLng - centerLng);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(centerLat)) * Math.cos(toRad(pLat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          return distance <= radius;
        });
        setListings(filtered);
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
      location: p.location,
      hasMedia: !!p.media_link,
      mediaLink: p.media_link || null,
      price: p.price ?? null,
      tag: 'LIVE',
      tagClass: 'bg-gold-accent/20 text-gold-accent',
      time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Just now',
      ownerId: p.owner_id || null,
      spaceCategory: p.space_category || p.type,
      details: p.details || {},
      pipelineStatus: p.pipeline_status || 'pending',
      completenessScore: p.completeness_score ?? 50,
      verified: !!p.verified,
      coordinates: p.coordinates || null,
      signals: {
        ownerAge: 'Verified',
        ownerAgeClass: 'text-success',
        accountAge: 'Active',
        completeness: '50%'
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
      raiseQuest,
      addListing,
      bulkAddListings,
      addConciergeListing,
      updateListing,
      publishListing,
      closeListing,
      sendPitch,
      inviteBroker,
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
