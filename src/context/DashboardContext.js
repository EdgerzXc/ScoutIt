 

"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { onAuthStateChange, getSession, getUser, signInWithPassword } from "../lib/authClient";
import { Bookmark } from "lucide-react";
import { getBalance, spendConnects, initWalletIfEmpty } from "../lib/connectsWallet";
import ListerDeclarationModal from "../components/dashboard/ListerDeclarationModal";
import { isOnboardingComplete } from "../lib/onboardingProfile";
import { readDevelopmentMockUser } from "../lib/developmentMock";
import { trackEvent, GA_EVENTS } from "../lib/analytics";
import { assessGeocode } from "../lib/geocodeConfidence";

const DashboardContext = createContext();

// Default Center: Makati CBD
const DEFAULT_MAP_CENTER = [121.0215, 14.5547]; 
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const DEFAULT_CONTEXT_VALUE = {
  listings: [],
  pitches: [],
  notifications: [],
  connects: 5,
  currentUser: null,
  toasts: [],
  savedIds: [],
  isLoading: false,
  addToast: () => {},
  toggleSave: () => {},
  raiseQuest: async () => false,
  updateListing: async () => false,
  closeListing: async () => {},
  permanentlyRemoveListing: async () => false,
  publishListing: async () => false,
  addListing: async () => {},
  bulkAddListings: async () => false,
  addConciergeListing: async () => {},
  sendPitch: async () => false,
  inviteBroker: async () => false,
  markNotificationsRead: async () => {},
  clearAllNotifications: async () => {},
  addNotification: async () => {},
};

export function useDashboard() {
  const context = useContext(DashboardContext);
  return context || DEFAULT_CONTEXT_VALUE;
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
  // Open lister-declaration prompt (§50 · W2). null = closed. Holds the
  // promise resolver so publishListing can await the user's answer.
  const [declarationPrompt, setDeclarationPrompt] = useState(null);

  // A dashboard identity is either validated by Supabase Auth or an explicit
  // localhost-only development mock. Browser profile cache is never authority.
  useEffect(() => {
    const localDevelopmentUser = () => readDevelopmentMockUser(localStorage, {
      nodeEnv: process.env.NODE_ENV,
      hostname: window.location.hostname,
    });

    const fetchVerifiedUser = async () => {
      try {
        const { data: { user }, error } = await getUser();
        if (!error && user) {
          await handleUserLogin(user);
          return;
        }
      } catch (error) {
        console.warn("Supabase user validation failed:", error);
      }

      const mockUser = localDevelopmentUser();
      if (mockUser) {
        setCurrentUser(mockUser);
        setIsLoading(false);
        fetchNotifications(mockUser.id);
        return;
      }

      localStorage.removeItem("scoutit_user");
      setCurrentUser(null);
      setIsLoading(false);
    };
    fetchVerifiedUser();

    const { data: { subscription } } = onAuthStateChange(async () => {
      await fetchVerifiedUser();
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

    if (!isOnboardingComplete(profile)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("scoutit_user");
        setCurrentUser(null);
        setIsLoading(false);
        if (window.location.pathname !== "/onboarding") {
          window.location.replace("/onboarding");
        }
      }
      return;
    }

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

    // Local Board -> account merge is now an explicit, idempotent action the
    // user triggers from /wishlist ("Bring your N saved spaces into your
    // account"), backed by /api/wishlist/merge. The old silent auto-insert on
    // every login was removed: it ran a naive insert with no de-dup guard
    // (saved_intel has no unique(user_id, property_id) constraint), so it could
    // accumulate duplicate rows.
    fetchNotifications(authUser.id);
  };

  // ── Notifications (persisted — Track 1, PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md) ──
  // Stable reference (no reactive closures — reads session/localStorage fresh
  // on each call) so consumers can safely list it in their own hook deps.
  const authedFetch = useCallback(async (url, options = {}) => {
    const { data: { session } } = await getSession();
    const token = session?.access_token;
    const mockUser = !token && typeof window !== "undefined"
      ? readDevelopmentMockUser(localStorage, {
          nodeEnv: process.env.NODE_ENV,
          hostname: window.location.hostname,
        })
      : null;
    const mockUserId = mockUser?.id || "";
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        "Authorization": token ? `Bearer ${token}` : "",
        ...(mockUserId ? { "x-mock-user-id": mockUserId } : {})
      },
    });
  }, []);

  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const res = await authedFetch(`/api/notifications`);
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
                slug: p.slug,
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

        const existingTitles = new Set(airtableListings.map(p => (p.title || '').toLowerCase()));
        const enrichedSupabaseListings = supabaseListings.map(p => ({
          ...p,
          isDuplicateOfAirtable: existingTitles.has((p.title || '').toLowerCase())
        }));

        setListings([...airtableListings, ...enrichedSupabaseListings]);

        // 2. Fetch Deals (Pitches) — via the real /api/deals server route, NOT
        // a direct client select(). The direct query this replaced had no
        // per-row role resolution at all: every single deal in the result
        // set (RLS still scoped that set correctly to the signed-in user's
        // own deals) got isCurrentUserBroker/isCurrentUserOwner hardcoded to
        // true simultaneously, brokerName hardcoded to the literal string
        // "Broker User", and title set to the raw property UUID. That meant
        // OwnerMode's "Active Inquiries" and BrokerMode's "Active Deal
        // Files"/"Verified Advisory Portfolio" — which both filter this same
        // `pitches` array by those flags — could never reliably tell an
        // owner's incoming pitch apart from a broker's own sent pitch, and
        // never showed a real name. /api/deals already resolves myRole and
        // the other party's real display name server-side; just remap that
        // into the field names BrokerMode/OwnerMode already read.
        try {
          const { data: { session } } = await getSession();
          const token = session?.access_token;
          const dealsRes = await fetch(`/api/deals`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (dealsRes.ok) {
            const { deals: dealsData } = await dealsRes.json();
            const mappedDeals = (dealsData || []).map(d => ({
              id: d.id,
              listingId: d.propertyId,
              propertySlug: d.propertySlug,
              title: d.propertyTitle,
              type: 'Deal',
              loc: undefined,
              brokerName: d.myRole === 'owner' ? d.otherParty : (currentUser?.name || 'You'),
              brokerFirm: d.myRole === 'owner' ? 'Independent' : 'ScoutIt Pro Member',
              // Which template a card should render — an owner's incoming
              // deals can be either a broker's pitch OR a buyer's direct
              // inquiry, and they were previously shown with the same
              // hardcoded "PRC VERIFIED" badge regardless of which.
              otherPartyRole: d.otherPartyRole,
              message: d.pitch_message,
              privateNotes: d.private_notes || '',
              status: d.status,
              timeRemaining: new Date(d.createdAt).toLocaleDateString(),
              statusText: d.status.charAt(0).toUpperCase() + d.status.slice(1),
              badgeText: d.status === 'accepted' ? 'check_circle' : '',
              isCurrentUserBroker: d.myRole === 'broker',
              isCurrentUserOwner: d.myRole === 'owner',
            }));
            setPitches(mappedDeals);
          }
        } catch (dealFetchErr) {
          console.error("Failed to fetch deals:", dealFetchErr);
        }

        // 3. Fetch Saved Intel
        const { data: savedData, error: savedError } = await supabase
          .from('saved_intel')
          .select('*');
          
        let supabaseSavedIds = [];
        if (!savedError && savedData) {
          supabaseSavedIds = savedData.map(s => s.property_id);
        }

        // Also merge local storage reactions (Your Board stays on device)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      addToast("Removed from Your Board", <Bookmark strokeWidth={1.5} size="1em" />);
      
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
      addToast("Saved to Your Board", <Bookmark strokeWidth={1.5} size="1em" />);
      trackEvent(GA_EVENTS.BOARD_SAVE, { property_id: item.id, signed_in: Boolean(currentUser?.id) });
      
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
          data
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

  // Withdraw is a recoverable off-market transition. Keep the legacy function
  // name as an internal compatibility alias for Mission Control callers.
  const closeListing = async (listingId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || (currentUser?.id === 'master-dev' ? 'mock-e2e-token' : '');
      const res = await fetch("/api/dashboard/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ submissionId: listingId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Withdrawal failed on server");
      setListings(prev => prev.map((listing) => listing.id === listingId
        ? { ...listing, pipelineStatus: "off_market", lifecycleState: "off_market", quietlyOpenToOffers: false }
        : listing));
      addToast("Property moved off-market", "◌");
      return true;
    } catch (err) {
      console.error("Failed to withdraw property", err);
      addToast(err.message || "Error withdrawing property", "❌");
      return false;
    }
  };

  const permanentlyRemoveListing = async (listingId, confirmationTitle, password, captchaToken) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email || !password) {
        throw new Error("Your account password is required for permanent removal");
      }
      if (!captchaToken) throw new Error("Complete the security check before permanent removal");
      const { data: reauthenticated, error: reauthError } = await signInWithPassword(
        session.user.email,
        password,
        captchaToken,
      );
      if (reauthError || !reauthenticated?.session?.access_token) {
        throw new Error("Password re-authentication failed");
      }
      const token = reauthenticated.session.access_token;
      const res = await fetch("/api/dashboard/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          submissionId: listingId,
          confirmationTitle,
          confirmPermanentRemoval: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Permanent removal failed");
      setListings(prev => prev.filter((listing) => listing.id !== listingId));
      addToast("Listing removed from the market; history retained", "◌");
      return true;
    } catch (err) {
      console.error("Failed to permanently remove property", err);
      addToast(err.message || "Removal could not be completed", "❌");
      return false;
    }
  };
  // ── LISTER DECLARATION GATE (§50 · W2) ────────────────────────────────
  // The gate lives HERE rather than in OwnerMode, because publishListing is
  // the single door to /api/dashboard/publish and §51's lesson was that a
  // feature reachable from only one of several call sites is a feature that
  // will be missed. Any future caller inherits the gate for free.
  //
  // The prompt is a promise: publishListing awaits the user's answer and then
  // retries itself with the declaration attached, so callers keep their
  // existing `await publishListing(id)` contract and their return value still
  // means "is it live".
  const askForDeclaration = (listingId) => {
    const listing = listings.find((l) => l.id === listingId);
    return new Promise((resolve) => {
      setDeclarationPrompt({
        listingId,
        listingTitle: listing?.title || null,
        busy: false,
        error: null,
        resolve,
      });
    });
  };

  const publishListing = async (listingId, declaration = null) => {
    if (!currentUser?.id) return false;
    // Truthful either way: the first attempt may come back asking for the
    // declaration, and "Syncing to live network" would be a claim of progress
    // that hasn't happened.
    addToast(declaration ? "Syncing to live network..." : "Preparing publication...", "⏳");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || (currentUser.id === 'master-dev' ? 'mock-e2e-token' : '');

      const body = { submissionId: listingId, userId: currentUser.id };
      if (declaration) {
        body.listerRelationship = declaration.relationship;
        // `=== true`, never truthy — the route validates identically, and a
        // negative/loose gate is exactly how the age gate failed open (§47.2).
        body.ownerSovereigntyAgreed = declaration.agreed === true;
      }

      const res = await fetch("/api/dashboard/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 422 && data.requiresDeclaration === true) {
        // If the server rejected a declaration we just sent, that is a real
        // error. Re-opening the modal would loop and hide the reason.
        if (declaration) {
          throw new Error(data.error || "That declaration could not be accepted");
        }
        const answer = await askForDeclaration(listingId);
        // Cancelled: the listing stays a draft, which the modal said it would.
        // No error toast — this was a choice, not a failure.
        if (!answer) return false;
        return await publishListing(listingId, answer);
      }

      if (!res.ok) {
        throw new Error(data.error || data.warning || "Failed to publish");
      }
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, pipelineStatus: 'approved' } : l));
      setDeclarationPrompt(null);
      addToast("Property is now LIVE", "🌍");
      trackEvent(GA_EVENTS.PROPERTY_PUBLISHED, { property_id: listingId, with_declaration: Boolean(declaration) });
      return true;
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to publish", "❌");
      // If the declaration modal is open behind this, it must come out of its
      // busy state and say what went wrong. A modal stuck on "Publishing…"
      // after a failed request is the error state nobody builds.
      setDeclarationPrompt(prev =>
        prev ? { ...prev, busy: false, error: err.message || "Failed to publish" } : prev
      );
      return false;
    }
  };

  const addListing = async (listing) => {
    addToast("Geocoding Location...", "⏳");
    
    // 1. Mapbox Geocoding
    let lat = null;
    let lng = null;
    // Through our own server, not Mapbox directly. The public token is
    // URL-restricted and its allow-list never covered the production domain, so
    // this call returned 403 on the live site — which is why listings published
    // by owners arrived with no coordinates and then rendered a map of the
    // wrong place. No longer gated on a client-side token either.
    let geo = null;
    if (listing.location) {
      try {
        const res = await fetch(`/api/mapbox?op=geocode&q=${encodeURIComponent(listing.location)}`);
        const json = await res.json();
        geo = assessGeocode(json?.data?.features?.[0], listing.location);
        if (geo.lat != null && geo.lng != null) {
          lat = geo.lat;
          lng = geo.lng;
        }
      } catch (err) {
        console.error("Geocoding failed", err);
        geo = assessGeocode(null, listing.location);
      }
    }

    // The owner is told when the position is only approximate, so they can
    // sharpen the address now rather than discover a wrong map later.
    if (geo?.uncertain && geo.lat != null) {
      addToast("Location is approximate — staff will verify", "📍");
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
      // Persist the uploaded photo URLs (Supabase Storage) inside details so
      // the publish route — which re-reads the row from Supabase — can mirror
      // them into Airtable's Photos/Image columns for the public page.
      details: {
        ...(listing.details || {}),
        ...(Array.isArray(listing.photos) && listing.photos.filter(Boolean).length
          ? { photos: listing.photos.filter(Boolean) }
          : {}),
        // How the position was arrived at and how much to trust it. Kept in
        // details rather than a new column so this needs no migration, and read
        // by Mission Control to queue anything approximate for a human check.
        ...(geo ? { geo } : {}),
      },
      coordinates
    }]).select();

    if (error || !data) {
      addToast("Error initializing dossier.", "❌");
      return;
    }

    const newDbListing = data[0];

    // Map through the same DB-row -> UI-model function every other listing
    // uses (mapSupabaseProperties) rather than spreading the wizard's raw
    // field names (listing.description/listing.category) over the result —
    // those don't match the UI model's desc/spaceCategory keys and dropped
    // `coordinates` entirely, so a freshly-published listing's Listing
    // Health / Listing Strength checks always reported description, map
    // location, and category as missing until the next full refetch
    // silently replaced this object with a correctly-shaped one.
    const newListing = {
      ...mapSupabaseProperties([newDbListing])[0],
      tag: 'NEW',
      tagClass: 'bg-gold-accent/20 text-gold-accent',
      time: 'Just now',
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
    // Local balance is a pre-check only — the authoritative spend is the
    // server's spend_connects RPC. The local sim wallet is deducted AFTER the
    // server confirms (below), so a failed call can never eat the displayed
    // balance. (The old order spent first with no rollback: every server
    // failure permanently drained the local wallet — double jeopardy.)
    if (getBalance(role, tier) < 1) {
      addToast("Not enough Connects to send this pitch.", "◈");
      return false;
    }

    // Server-side route (supabaseAdmin + spend_connects), NOT a direct client
    // insert — `deals` has an explicit RLS policy blocking all direct client
    // inserts ("Users cannot insert deals directly", with_check: false).
    // The old code inserted straight from the client here, which always
    // failed silently: this local wallet spend still happened, the caller
    // (BrokerMode's handleSendPitch) never awaited this function so it always
    // treated the pitch as successful, and no deal was ever actually created.
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const res = await fetch('/api/deals/pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ listingId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || "Failed to send pitch.", "❌");
        return false;
      }

      // Server confirmed — now mirror the spend locally. Prefer the server's
      // authoritative newBalance (real sessions) over the local sim total.
      const localSpend = spendConnects(role, tier, 1);
      setConnects(typeof data.newBalance === 'number' ? data.newBalance : localSpend.remaining);
      trackEvent(GA_EVENTS.CONNECT_SPENT, { spend_reason: 'pitch', property_id: listingId, role, tier, amount: 1 });

      const targetListing = listings.find(l => l.id === listingId);
      const newPitch = {
        id: data.dealId,
        listingId,
        title: targetListing ? targetListing.title : (data.propertyTitle || 'New Property'),
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
    } catch (err) {
      console.error("Failed to send pitch", err);
      addToast("Failed to send pitch — check your connection.", "❌");
      return false;
    }
  };

  const inviteBroker = async (listingId, brokerName) => {
    if (!brokerName) return false;
    const role = (currentUser?.active_roles?.[0] || currentUser?.role || "owner").toLowerCase();
    const tier = (currentUser?.subscription_tier || currentUser?.tier || "starry").toLowerCase();
    // Pre-check only — local sim wallet is deducted after the server confirms
    // (same no-double-jeopardy ordering as sendPitch).
    if (getBalance(role, tier) < 1) {
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

      // Server confirmed — mirror the spend locally, prefer server truth.
      const localSpend = spendConnects(role, tier, 1);
      setConnects(typeof data.newBalance === 'number' ? data.newBalance : localSpend.remaining);
      trackEvent(GA_EVENTS.CONNECT_SPENT, { spend_reason: 'handshake', property_id: listingId, role, tier, amount: 1 });

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
      authedFetch(`/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      authedFetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(e => console.error("Failed to mark notifications read", e));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (currentUser?.id) {
      authedFetch(`/api/notifications`, { method: "DELETE" })
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

      const existingTitles = new Set(airtableListings.map(p => (p.title || '').toLowerCase()));
      const enrichedSupabaseListings = supabaseListings.map(p => ({
        ...p,
        isDuplicateOfAirtable: existingTitles.has((p.title || '').toLowerCase())
      }));

      const allData = [...airtableListings, ...enrichedSupabaseListings];

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
      // Published listings sync to Airtable keyed by slug, and the public
      // /property/[id] page ONLY ever resolves against the Airtable feed —
      // it never queries Supabase at all. Every link built from `.id` (the
      // Supabase UUID) instead of `.slug` was a link to a page that loads
      // forever, including the owner's own "View Public File" button.
      slug: p.slug || null,
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
      lifecycleState: p.lifecycle_state || null,
      canonicalSlug: p.canonical_slug || p.slug || null,
      quietlyOpenToOffers: p.quietly_open_to_offers === true,
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
      permanentlyRemoveListing,
      sendPitch,
      inviteBroker,
      updatePitchStatus,
      markNotificationsRead,
      clearAllNotifications,
      searchByRadius,
      MAPBOX_TOKEN,
      DEFAULT_MAP_CENTER,
      authedFetch
    }}>
      {children}
      {/* Rendered at provider level so every publish path is gated, not just
          OwnerMode's. See the askForDeclaration comment above. */}
      <ListerDeclarationModal
        open={Boolean(declarationPrompt)}
        listingTitle={declarationPrompt?.listingTitle}
        busy={declarationPrompt?.busy === true}
        error={declarationPrompt?.error || null}
        onSubmit={(declaration) => {
          const prompt = declarationPrompt;
          if (!prompt) return;
          setDeclarationPrompt(prev => prev ? { ...prev, busy: true, error: null, resolve: null } : prev);
          if (prompt.resolve) {
            prompt.resolve(declaration);
          } else {
            // Retry after a failed attempt. The original promise is already
            // settled, so resolving it again would silently do nothing and
            // leave the modal spinning — publish directly instead.
            publishListing(prompt.listingId, declaration);
          }
        }}
        onCancel={() => {
          const resolve = declarationPrompt?.resolve;
          setDeclarationPrompt(null);
          resolve?.(null);
        }}
      />
    </DashboardContext.Provider>
  );
}
