"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatBox from "@/components/dashboard/ChatBox";

export default function InboxPage() {
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we would fetch from /api/deals using the user's session
    // For now, we simulate loading the deals
    setTimeout(() => {
      setDeals([
        {
          id: "deal-123",
          property_title: "The Zuellig Building",
          status: "connected",
          other_party: "Jane (Buyer)",
          last_message: "Hi, I am interested in viewing this property...",
          expires_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days left
        },
        {
          id: "deal-456",
          property_title: "One Bonifacio High Street",
          status: "closed",
          other_party: "Mike (Buyer)",
          last_message: "Thanks, see you on Friday!",
          closed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // Closed 2 days ago
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCloseDeal = (dealId) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, status: 'closed', closed_at: new Date().toISOString() } : d));
    if (selectedDeal?.id === dealId) {
      setSelectedDeal({ ...selectedDeal, status: 'closed' });
    }
  };

  const handleOfferHandshake = (dealId) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, handshakeState: 'offered' } : d));
    if (selectedDeal?.id === dealId) {
      setSelectedDeal({ ...selectedDeal, handshakeState: 'offered' });
    }
  };

  const handleAcceptHandshake = (dealId) => {
    setDeals(deals.map(d => d.id === dealId ? { ...d, handshakeState: 'linked', status: 'closed' } : d));
    if (selectedDeal?.id === dealId) {
      setSelectedDeal({ ...selectedDeal, handshakeState: 'linked', status: 'closed' });
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
            ) : deals.length === 0 ? (
              <div className="p-6 text-text-secondary">No active leads.</div>
            ) : (
              deals.map(deal => (
                <div 
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`p-4 border-b border-surface-variant cursor-pointer transition-colors ${selectedDeal?.id === deal.id ? 'bg-surface-variant' : 'hover:bg-surface-variant/50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-working-title text-sm text-on-surface truncate pr-2">
                      {deal.property_title}
                    </h3>
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
