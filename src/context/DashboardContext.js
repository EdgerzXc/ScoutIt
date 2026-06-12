"use client";

import { createContext, useContext, useState, useEffect } from "react";

const DashboardContext = createContext();

export function useDashboard() {
  return useContext(DashboardContext);
}

const INITIAL_LISTINGS = [
  {
    id: 'f1',
    type: 'Commercial Lot',
    title: 'Alabang Commercial Lot',
    desc: 'Prime corner lot available for joint venture or long-term lease. Owner highly motivated.',
    hasMedia: true,
    tag: 'HOT',
    tagClass: 'bg-error/20 text-error',
    time: 'Just now',
    ownerId: 'sys_owner1', // Mock system owner
    signals: {
      ownerAge: '98% (< 1hr)',
      ownerAgeClass: 'text-success',
      accountAge: '2 yrs',
      completeness: '85%'
    }
  },
  {
    id: 'f2',
    type: 'Mixed-Use',
    title: 'Poblacion Mixed-Use Building',
    desc: '5-story building seeking property management and exclusive brokerage for upcoming vacancies.',
    hasMedia: false,
    tag: 'NEW',
    tagClass: 'bg-surface-variant text-on-surface',
    time: '2h ago',
    ownerId: 'sys_owner1', // Mock system owner
    signals: {
      ownerAge: '75% (1-2 days)',
      ownerAgeClass: 'text-gold-accent',
      accountAge: '8 mos',
      completeness: '92%'
    }
  }
];

const INITIAL_PITCHES = [
  { 
    id: 'p1',
    listingId: 'f_dummy1',
    title: 'The Sapphire Block',
    loc: 'Makati CBD',
    type: 'Office',
    brokerName: "Miguel Santos", 
    brokerFirm: "Santos Realty Group • Top 5% Broker", 
    message: `"I have an international client flying in next week looking specifically for penthouses in this district. I believe your property fits their criteria perfectly. Can we arrange an exclusive viewing?"`,
    status: 'pending',
    timeRemaining: "2h ago",
    isCurrentUserBroker: false, // so it shows in Owner Inbox
    isCurrentUserOwner: true
  },
  { 
    id: 'p2',
    listingId: 'f_dummy2',
    title: 'Luxe Residences Unit 15B',
    loc: 'BGC',
    type: 'Residential',
    brokerName: "Elena Reyes", 
    brokerFirm: "Independent • High Volume", 
    message: `"My portfolio consists mainly of expatriate executives. Your listing matches the specs for a corporate lease I'm currently sourcing for a tech firm relocating a VP."`,
    status: 'pending',
    timeRemaining: "Yesterday",
    isCurrentUserBroker: false,
    isCurrentUserOwner: true
  },
  // Pitches sent by current user (Broker)
  { 
    id: 'p3', 
    listingId: 'f_dummy3',
    type: 'Commercial', 
    title: 'Ortigas Tech Tower', 
    loc: 'Ortigas Center', 
    statusText: 'Meeting Set', 
    badgeText: 'check_circle',
    brokerName: 'Current User',
    status: 'accepted',
    isCurrentUserBroker: true,
    isCurrentUserOwner: false
  },
  { 
    id: 'p4', 
    listingId: 'f_dummy4',
    type: 'Industrial', 
    title: 'QC Warehouses', 
    loc: 'Quezon City', 
    statusText: 'Owner Declined', 
    badgeText: '',
    brokerName: 'Current User',
    status: 'declined',
    isCurrentUserBroker: true,
    isCurrentUserOwner: false
  }
];

export function DashboardProvider({ children }) {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [pitches, setPitches] = useState(INITIAL_PITCHES);
  const [notifications, setNotifications] = useState([]);
  const [connects, setConnects] = useState(5); // USERS_CMS default balance
  const [currentUser, setCurrentUser] = useState(null);

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

  const addListing = (listing) => {
    const newListing = {
      ...listing,
      id: 'l_' + Date.now(),
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
    addNotification({
      title: "Listing Published",
      desc: `Your property at ${listing.location} is now live in the Broker feed.`,
      icon: "✅"
    });
  };

  const sendPitch = (listingId, message) => {
    if (connects < 1) return false;
    
    // Deduct connect
    const newBalance = connects - 1;
    setConnects(newBalance);
    if (currentUser) {
      const updatedUser = { ...currentUser, connects_balance: newBalance };
      localStorage.setItem("scoutit_user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
    }

    const targetListing = listings.find(l => l.id === listingId);

    const newPitch = {
      id: 'p_' + Date.now(),
      listingId,
      title: targetListing ? targetListing.title : 'New Property',
      loc: 'Location Masked',
      type: targetListing ? targetListing.type : 'Sourced',
      brokerName: currentUser?.name || 'ScoutIt Broker',
      brokerFirm: 'ScoutIt Pro Member',
      message,
      status: 'pending',
      timeRemaining: 'Just now',
      statusText: 'Sent Just now',
      badgeText: 'Waiting',
      isCurrentUserBroker: true,
      isCurrentUserOwner: targetListing?.ownerId === 'current_user' // rare but possible
    };

    // If the listing belongs to the current user (testing purpose), they are also the owner.
    if (targetListing && targetListing.ownerId === 'current_user') {
      newPitch.isCurrentUserOwner = true;
    }

    setPitches(prev => [newPitch, ...prev]);
    
    // If it was the current user's own listing, notify them!
    if (targetListing && targetListing.ownerId === 'current_user') {
       addNotification({
        title: "New Pitch Received!",
        desc: `You received a new pitch for ${targetListing.title}.`,
        icon: "📦"
      });
    }

    return true;
  };

  const updatePitchStatus = (pitchId, newStatus) => {
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

    // Find the pitch to notify the broker (if we were the owner accepting/declining)
    const pitch = pitches.find(p => p.id === pitchId);
    if (pitch && pitch.isCurrentUserBroker) {
      // Meaning we are simulating the other side too, or it's just self-testing
      addNotification({
        title: `Pitch ${newStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        desc: `Your pitch for ${pitch.title} was ${newStatus}.`,
        icon: newStatus === 'accepted' ? "🎉" : "❌"
      });
    } else {
      // We are the owner who accepted/declined someone else's pitch
      addNotification({
        title: `Pitch ${newStatus === 'accepted' ? 'Accepted' : 'Declined'}`,
        desc: `You have ${newStatus} the pitch from ${pitch?.brokerName}.`,
        icon: newStatus === 'accepted' ? "🤝" : "📩"
      });
    }
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

  return (
    <DashboardContext.Provider value={{
      listings,
      pitches,
      notifications,
      connects,
      currentUser,
      addListing,
      sendPitch,
      updatePitchStatus,
      markNotificationsRead,
      clearAllNotifications
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
