"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChatBox from "@/components/dashboard/ChatBox";
import { getSession, getUser } from "@/lib/authClient";
import { readDevelopmentMockUser } from "@/lib/developmentMock";
import { DashboardProvider } from "@/context/DashboardContext";

// Same dev fallback the rest of the deals/messages routes use -- real
// Supabase session first, "master-dev" localStorage convention otherwise.
async function resolveAuth() {
  const [{ data: { user } }, { data: { session } }] = await Promise.all([getUser(), getSession()]);
  if (user && session?.access_token && session.user?.id === user.id) {
    return { token: session.access_token, mockOwnerId: null };
  }
  const mockUser = readDevelopmentMockUser(localStorage, {
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname,
  });
  return mockUser
    ? { token: null, mockOwnerId: mockUser.id }
    : { token: null, mockOwnerId: null };
}

// GET /api/deals returns camelCase fields; ChatBox (built against the old
// mock shape) expects snake_case -- map here rather than touching ChatBox's
// internals more than necessary.
function toChatBoxDeal(d) {
  return {
    id: d.id,
    property_title: d.propertyTitle,
    propertySlug: d.propertySlug,
    propertyPrice: d.propertyPrice,
    status: d.status,
    other_party: d.otherParty,
    // Role label only -- this is what a recipient sees instead of a name while
    // the request is still pending (§38.3: intent and tier, not identity).
    otherPartyRole: d.otherPartyRole,
    last_message: d.lastMessage,
    pitch_message: d.pitch_message,
    myRole: d.myRole,
    // NULL on pre-2026-08-05 rows; ChatBox's badge is guarded by
    // Number.isFinite so it stays hidden rather than rendering a guess.
    connects_spent: d.connects_spent,
    archived_at: d.archivedAt,
    pending_clock_reset_at: d.pendingClockResetAt,
    unreadCount: d.unreadCount,
    created_at: d.createdAt,
    last_activity_at: d.lastActivityAt,
    expires_at: d.expiresAt,
    closed_at: d.closedAt,
  };
}

// Status buckets. Previously written as inline arrays in four places that had
// drifted; `!d.status` also fell through into ACTIVE, meaning an unknown or
// malformed status defaulted to the MOST permissive state (open composer,
// contact actions). Unknown now sorts to CLOSED, which is the safe default.
// Verified against the live `deals` table 2026-08-05: there is NO check
// constraint on deals.status, the column default is 'pitching', and the live
// distribution is connected / invited / accepted. Guessing at this set is how
// a real status silently lands in the wrong tab.
//
// 'invited' = owner invited a broker and is waiting on their answer, which is
// the same shape as a pending Connect request from the recipient's side.
// 'pitching' = the column default, an open pitch in progress.
const WAITING_STATUSES = ["pending", "invited"];
const ACTIVE_STATUSES = ["active", "accepted", "connected", "pitching"];
// 'expired' is retained ONLY so historical rows still bucket correctly.
// Nothing writes it any more — requests no longer time out (§40.14).
const CLOSED_STATUSES = ["closed", "declined", "expired", "reported", "withdrawn"];

// A deleted request must not appear ANYWHERE. Filtered out before bucketing
// rather than given a tab: "deleted" has to mean gone to the person who was
// told it was deleted, or the word is a lie (§40.15).
const isDeleted = (status) => status === "deleted";

// §40.15: an archived request is still PENDING and still fully acceptable —
// archiving moves it out of the way, it does not cancel it. So the bucket is
// driven by archived_at, not by a separate status value. Using a status would
// have made "archived" mutually exclusive with "pending", which is exactly
// the confusion that turns archiving back into expiry.
const bucketOf = (deal) => {
  const status = deal?.status;
  if (WAITING_STATUSES.includes(status)) {
    return deal?.archived_at ? "archived" : "waiting";
  }
  if (ACTIVE_STATUSES.includes(status)) return "active";
  return "closed";
};

const byDateDesc = (key) => (a, b) => new Date(b[key] || 0) - new Date(a[key] || 0);

// Development scaffolding ONLY. These used to be merged into every real
// inbox and served as the fetch-failure fallback, so a live user with zero
// leads saw three fabricated ones -- including invented PRC-broker identities,
// which is a RESA problem on top of a trust problem. A production user with an
// empty inbox must see an empty inbox.
const SHOW_DEMO_DEALS = process.env.NODE_ENV !== "production";

const DEMO_DEALS = [
  {
    id: "demo-deal-pending",
    property_title: "One Bonifacio High Street Penthouse",
    propertySlug: "one-bonifacio-high-street-penthouse",
    status: "pending",
    other_party: "Arch. Rafael Santos (PRC Broker)",
    last_message: "Awaiting response (3 Connects Spent · Awaiting Owner Action)",
    pitch_message: "Hi! I'd like to schedule a viewing of this 3BR BGC Penthouse for this Friday afternoon. Is the owner open to flexible lease terms?",
    myRole: "buyer",
    unreadCount: 1,
  },
  {
    id: "demo-deal-active",
    property_title: "Makati CBD Executive Commercial Suite",
    propertySlug: "makati-cbd-executive-commercial-suite",
    status: "accepted",
    other_party: "Maria Elena Reyes (Property Manager)",
    last_message: "Confirmed! Walkthrough scheduled for Thursday 2:00 PM.",
    pitch_message: "We are looking for a 250 sqm commercial office space for a fintech team of 25. Need 24/7 HVAC options.",
    myRole: "buyer",
    unreadCount: 0,
  },
  {
    id: "demo-deal-declined",
    property_title: "Rockwell Center Luxury 2BR Suite",
    propertySlug: "rockwell-center-luxury-2br-suite",
    status: "declined",
    other_party: "Juan Carlos Tan (Listing Representative)",
    last_message: "Connect request declined or expired (Connects non-refundable)",
    pitch_message: "Requesting floor plan and zonal tax breakdown for unit 24B.",
    myRole: "buyer",
    unreadCount: 0,
  },
];

function InboxInner() {
  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [inboxTab, setInboxTab] = useState("active"); // "waiting" | "active" | "declined"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { token, mockOwnerId } = await resolveAuth();
      const qs = mockOwnerId ? `?mockOwnerId=${mockOwnerId}` : "";
      const res = await fetch(`/api/deals${qs}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(mockOwnerId ? { "x-mock-user-id": mockOwnerId } : {})
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't load your conversations.");
      const fetchedDeals = (data?.deals || []).map(toChatBoxDeal);
      const realIds = new Set(fetchedDeals.map((d) => d.id));
      const filteredDemo = SHOW_DEMO_DEALS ? DEMO_DEALS.filter((d) => !realIds.has(d.id)) : [];
      setDeals([...fetchedDeals, ...filteredDemo]);
    } catch (err) {
      console.error("Failed to load deals", err);
      // Showing invented leads on a network error told the user their inbox
      // was full when we had no idea what was in it. Say we couldn't load it.
      setDeals(SHOW_DEMO_DEALS ? DEMO_DEALS : []);
      if (!SHOW_DEMO_DEALS) setError("Couldn't load your conversations. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Sorting per §38.4 -- there was none before, so the list arrived in
  // whatever order the API happened to return and reshuffled on every refetch.
  const visibleDeals = deals.filter((d) => !isDeleted(d.status));
  const waitingDeals = visibleDeals.filter((d) => bucketOf(d) === "waiting").sort(byDateDesc("created_at"));
  const activeDeals = visibleDeals.filter((d) => bucketOf(d) === "active").sort(byDateDesc("last_activity_at"));
  // Oldest first: the one closest to being deleted needs attention most.
  const archivedDeals = visibleDeals
    .filter((d) => bucketOf(d) === "archived")
    .sort((a, b) => new Date(a.pending_clock_reset_at || 0) - new Date(b.pending_clock_reset_at || 0));
  const declinedDeals = visibleDeals.filter((d) => bucketOf(d) === "closed").sort(byDateDesc("closed_at"));

  // §38.4: only ACTIVE conversations count as unread. WAITING and CLOSED are
  // status states, not messages -- a badge on them nags about nothing.
  const activeUnread = activeDeals.reduce((n, d) => n + (d.unreadCount || 0), 0);

  const currentList =
    inboxTab === "waiting"
      ? waitingDeals
      : inboxTab === "archived"
      ? archivedDeals
      : inboxTab === "declined"
      ? declinedDeals
      : activeDeals;

  const selectedDeal = deals.find((d) => d.id === selectedDealId) || null;

  const handleSelectDeal = (deal) => {
    setSelectedDealId(deal.id);
    if (deal.unreadCount > 0) {
      setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, unreadCount: 0 } : d)));
    }
  };

  const patchDealStatus = async (dealId, status) => {
    const { token, mockOwnerId } = await resolveAuth();
    const res = await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ status, mockOwnerId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Couldn't update this conversation.");
    }
    return res.json().catch(() => ({}));
  };

  const handleCloseDeal = (dealId, status = "closed") => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status, closed_at: new Date().toISOString() } : d)));
    setSelectedDealId(null);
  };

  // WAITING -> ACTIVE. This is the recipient opening the conversation, and is
  // a different act from the contact-reveal handshake below -- the two were
  // previously conflated onto one button, so there was no way to accept a
  // Connect request without also agreeing to publish your phone number.
  const handleAcceptRequest = async (dealId) => {
    try {
      await patchDealStatus(dealId, "accepted");
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: "accepted" } : d)));
      setInboxTab("active");
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // §38.3 State 3 -- there was no decline path at all before this. A recipient
  // could only ignore a request and let it rot in the sender's WAITING tab.
  const handleDeclineRequest = async (dealId) => {
    try {
      await patchDealStatus(dealId, "declined");
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: "declined", closed_at: new Date().toISOString() } : d)));
      setSelectedDealId(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // The SENDER taking their own request back (§40.15). This is the release
  // valve that replaced the 72-hour auto-expiry: nothing times out, so the one
  // person who should be able to end an unanswered request is the person who
  // sent it. The recipient can still take as long as they need.
  const handleWithdrawRequest = async (dealId) => {
    try {
      await patchDealStatus(dealId, "withdrawn");
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: "withdrawn", closed_at: new Date().toISOString() } : d)));
      setSelectedDealId(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Pull a request back out of the archive. This is the "extend" — the server
  // resets pending_clock_reset_at, restarting BOTH the 7-day archive and the
  // 30-day deletion clocks from zero (§40.15). The new timestamp comes back
  // from the server rather than being guessed here, so the countdown the user
  // then sees is the one the sweep will actually act on.
  const handleUnarchive = async (dealId) => {
    try {
      const { token, mockOwnerId } = await resolveAuth();
      const res = await fetch(`/api/deals/${dealId}/unarchive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mockOwnerId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't reopen this request.");
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dealId
            ? { ...d, archived_at: null, pending_clock_reset_at: data.pending_clock_reset_at }
            : d,
        ),
      );
      setInboxTab("waiting");
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  // Contact reveal. ChatBox now calls /api/deals/handshake itself and passes
  // the SERVER's verdict back up; these two only reconcile local state, and
  // never assume success.
  const handleOfferHandshake = (dealId) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, handshakeState: 'offered' } : d)));
  };

  const handleAcceptHandshake = (dealId) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, handshakeState: 'linked', contactRevealed: true } : d)));
  };
  return (
    <DashboardLayout>
      {/* Mobile: single-column master/detail — show the list, then swap to the
          chat when a lead is picked (with a Back button). Side-by-side from md up. */}
      {/* dvh, not vh: on mobile Safari/Chrome, 100vh is the height WITHOUT the
          browser chrome, so the composer sat under the address bar and the
          user had to scroll the page to reach Send. */}
      <div className="flex flex-col md:flex-row h-[calc(100dvh-64px)] md:h-[calc(100vh-64px)] bg-background overflow-hidden">

        {/* Left Sidebar - Deal List */}
        <div className={`w-full md:w-1/3 min-h-0 border-r border-surface-variant flex-col bg-background ${selectedDeal ? "hidden md:flex" : "flex"}`}>
          <div className="p-5 border-b border-surface-variant shrink-0">
            <h1 className="font-working-title text-2xl text-on-surface">Leads &amp; Inbox</h1>
            <p className="text-sm text-text-secondary mt-1">
              Manage your active negotiations.
              {activeUnread > 0 && (
                <span className="text-gold-accent"> · {activeUnread} unread</span>
              )}
            </p>

            {/* Three-State Inbox Tab Bar (Section 38) */}
            <div className="flex gap-1 mt-4 p-1 bg-surface rounded-lg border border-gold-accent/20">
              {[
                { id: "waiting", label: "WAITING", count: waitingDeals.length },
                { id: "active", label: "ACTIVE", count: activeDeals.length },
                { id: "archived", label: "ARCHIVED", count: archivedDeals.length },
                { id: "declined", label: "CLOSED", count: declinedDeals.length },
              ].map((tab) => {
                const isActive = inboxTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInboxTab(tab.id)}
                    // min-h-11 -> a real 44px touch target. These were 26px
                    // tall, well under the WCAG / iOS minimum, which on a
                    // phone means mis-taps between three adjacent tabs.
                    className={`flex-1 min-h-11 py-1.5 px-2 rounded-md text-[10px] font-mono tracking-wider transition ${
                      isActive
                        ? "bg-gold-accent/20 text-gold-bright border border-gold-accent/50 font-bold"
                        : "text-text-secondary hover:text-on-surface hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-text-secondary">Loading...</div>
            ) : error && currentList.length === 0 ? (
              <div className="p-6 text-error text-sm">{error}</div>
            ) : currentList.length === 0 ? (
              <div className="p-6 text-text-secondary text-xs font-mono uppercase tracking-wider">
                {inboxTab === "waiting"
                  ? "No pending Connect requests."
                  : inboxTab === "archived"
                  ? "Nothing archived. Requests move here after 7 days unanswered — they stay acceptable."
                  : inboxTab === "declined"
                  ? "Nothing closed yet."
                  : "No active conversations."}
              </div>
            ) : (
              currentList.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => handleSelectDeal(deal)}
                  className={`p-4 min-h-16 border-b border-surface-variant cursor-pointer transition ${selectedDealId === deal.id ? 'bg-surface-variant' : 'hover:bg-surface-variant/50 active:bg-surface-variant'}`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-working-title text-sm text-on-surface truncate pr-2">
                      {deal.property_title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Unread pips only in ACTIVE (§38.4). A pulsing badge on
                          a declined thread is a notification for nothing. */}
                      {deal.unreadCount > 0 && bucketOf(deal) === "active" && (
                        <motion.span 
                          className="min-w-[18px] h-[18px] px-1 rounded-full bg-gold-accent text-background text-[10px] font-bold font-mono flex items-center justify-center"
                          animate={{ boxShadow: ["0px 0px 0px rgba(232,174,60,0)", "0px 0px 10px rgba(232,174,60,0.8)", "0px 0px 0px rgba(232,174,60,0)"] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          {deal.unreadCount}
                        </motion.span>
                      )}
                      {bucketOf(deal) === "archived" ? (
                        <span className="px-2 py-0.5 rounded bg-white/5 text-text-secondary border border-white/15 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                          Archived
                        </span>
                      ) : bucketOf(deal) === "waiting" ? (
                        <span className="px-2 py-0.5 rounded bg-gold-accent/20 text-gold-bright border border-gold-accent/40 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                          Pending
                        </span>
                      ) : bucketOf(deal) === "closed" ? (
                        // Was one flat "Closed" for everything. A reported
                        // conversation is a Trust & Safety matter and a
                        // declined one is a rejection -- burying both under the
                        // same grey pill hides which is which.
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider whitespace-nowrap ${
                          deal.status === "reported"
                            ? "bg-error/20 text-error border border-error/40"
                            : "bg-surface-variant text-text-secondary"
                        }`}>
                          {deal.status === "reported" ? "Reported"
                            : deal.status === "declined" ? "Declined"
                            : deal.status === "withdrawn" ? "Withdrawn"
                            : deal.status === "expired" ? "Expired"
                            : "Closed"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-primary mb-1">{deal.other_party}</p>
                  <p className="text-xs text-text-secondary truncate">{deal.last_message}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Content - ChatBox */}
        <div className={`w-full md:w-2/3 min-h-0 flex-col bg-background relative ${selectedDeal ? "flex" : "hidden md:flex"}`}>
          {selectedDeal && (
            <button
              onClick={() => setSelectedDealId(null)}
              className="md:hidden flex items-center gap-2 text-sm font-working-title text-gold-accent px-4 min-h-11 py-3 border-b border-surface-variant shrink-0 w-full text-left"
            >
              ← Back to leads
            </button>
          )}
          {selectedDeal ? (
            <ChatBox
              deal={selectedDeal}
              onCloseDeal={handleCloseDeal}
              onOfferHandshake={() => handleOfferHandshake(selectedDeal.id)}
              onAcceptHandshake={() => handleAcceptHandshake(selectedDeal.id)}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onWithdrawRequest={handleWithdrawRequest}
              onUnarchive={handleUnarchive}
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

export default function InboxPage() {
  return (
    <DashboardProvider>
      <InboxInner />
    </DashboardProvider>
  );
}
