"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatBox from "@/components/dashboard/ChatBox";
import { getSession } from "@/lib/authClient";

// Same dev fallback the rest of the deals/messages routes use -- real
// Supabase session first, "master-dev" localStorage convention otherwise.
async function resolveAuth() {
  const { data: { session } } = await getSession();
  if (session?.access_token) return { token: session.access_token, mockOwnerId: null };
  try {
    const raw = localStorage.getItem("scoutit_user");
    const u = raw ? JSON.parse(raw) : null;
    if (u?.id === "master-dev") return { token: null, mockOwnerId: "master-dev" };
  } catch {}
  return { token: null, mockOwnerId: null };
}

// GET /api/deals returns camelCase fields; ChatBox (built against the old
// mock shape) expects snake_case -- map here rather than touching ChatBox's
// internals more than necessary.
function toChatBoxDeal(d) {
  return {
    id: d.id,
    property_title: d.propertyTitle,
    propertySlug: d.propertySlug,
    status: d.status,
    other_party: d.otherParty,
    last_message: d.lastMessage,
    myRole: d.myRole,
    unreadCount: d.unreadCount,
    expires_at: d.expiresAt,
    closed_at: d.closedAt,
  };
}

export default function InboxPage() {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { token, mockOwnerId } = await resolveAuth();
      if (!token && !mockOwnerId) {
        setError("Please log in to view your inbox.");
        setLoading(false);
        return;
      }
      const qs = mockOwnerId ? `?mockOwnerId=${mockOwnerId}` : "";
      const res = await fetch(`/api/deals${qs}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't load your inbox.");
        setLoading(false);
        return;
      }
      setDeals((data.deals || []).map(toChatBoxDeal));
    } catch (err) {
      console.error("Failed to load deals", err);
      setError("Couldn't load your inbox — check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;

  const handleSelectDeal = (deal) => {
    setSelectedDealId(deal.id);
    if (deal.unreadCount > 0) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, unreadCount: 0 } : d)));
    }
  };

  const handleCloseDeal = (dealId) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: 'closed', closed_at: new Date().toISOString() } : d)));
  };

  // Cosmetic-only for now (see ChatBox.js note) -- no handshake_state column
  // on deals, so nothing persists here beyond the local session.
  const handleOfferHandshake = (dealId) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, handshakeState: 'offered' } : d)));
  };

  const handleAcceptHandshake = async (dealId) => {
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      // In DEV, if no real token but master-dev is logged in, pass a flag
      const mockStr = localStorage.getItem("scoutit_user");
      let mockOwnerId;
      if (!token && mockStr && mockStr.includes("master-dev")) {
        mockOwnerId = "master-dev";
      }

      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status: "accepted", mockOwnerId })
      });

      if (!res.ok) {
        console.error("Failed to accept handshake");
        return;
      }
      
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, handshakeState: 'linked', status: 'accepted' } : d)));
    } catch (err) {
      console.error("Error accepting handshake", err);
    }
  };
  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)] bg-background">

        {/* Left Sidebar - Deal List */}
        <div className="w-1/3 border-r border-surface-variant flex flex-col bg-[#0d0d0d]">
          <div className="p-6 border-b border-surface-variant">
            <h1 className="font-working-title text-2xl text-on-surface">Leads & Inbox</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your active negotiations.</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-text-secondary">Loading...</div>
            ) : error ? (
              <div className="p-6 text-error text-sm">{error}</div>
            ) : deals.length === 0 ? (
              <div className="p-6 text-text-secondary">No active leads.</div>
            ) : (
              deals.map(deal => (
                <div
                  key={deal.id}
                  onClick={() => handleSelectDeal(deal)}
                  className={`p-4 border-b border-surface-variant cursor-pointer transition-colors ${selectedDealId === deal.id ? 'bg-surface-variant' : 'hover:bg-surface-variant/50'}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-working-title text-sm text-on-surface truncate pr-2">
                      {deal.property_title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {deal.unreadCount > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-gold-accent text-background text-[10px] font-bold font-mono flex items-center justify-center">
                          {deal.unreadCount}
                        </span>
                      )}
                      {deal.status === 'closed' ? (
                        <span className="px-2 py-0.5 rounded bg-surface-variant text-text-secondary text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                          Archived
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-gold-accent/20 text-gold-accent text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-primary mb-1">{deal.other_party}</p>
                  <p className="text-xs text-text-secondary truncate">{deal.last_message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Content - ChatBox */}
        <div className="w-2/3 flex flex-col bg-background relative">
          {selectedDeal ? (
            <ChatBox
              deal={selectedDeal}
              onCloseDeal={handleCloseDeal}
              onOfferHandshake={() => handleOfferHandshake(selectedDeal.id)}
              onAcceptHandshake={() => handleAcceptHandshake(selectedDeal.id)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
              <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h2 className="font-working-title text-xl text-on-surface mb-2">Select a Conversation</h2>
              <p className="text-sm text-text-secondary max-w-sm">
                Choose a lead from the sidebar to continue the negotiation or schedule a viewing.
              </p>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
