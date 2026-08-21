"use client";

import { useState } from "react";

// ⚠️ THIS IS A STATIC PREVIEW, NOT THE PRODUCT.
//
// It drifted out of sync once already: after the §40 pass it was still
// showing a hardcoded "3 Connects" (the ledger charges 1), an unlocked
// WAITING state, and a 72-hour expiry that no longer exists. A showcase that
// disagrees with the shipped UI is how fabricated figures spread — someone
// reads a number here and believes it.
//
// The real implementation is src/components/dashboard/ChatBox.js +
// src/app/dashboard/inbox/page.js. If you change either, update this or
// delete it. See NEW_IDEAS.md §40 and NEW_IDEAS_TO_CLAUDE_CODE.md C8.
export default function MockupChatbox() {
  const [activeTab, setActiveTab] = useState("waiting"); // 'waiting' | 'active' | 'declined'
  const [showReceipt, setShowReceipt] = useState(false);
  const [introText, setIntroText] = useState(
    "Hi! I'm interested in viewing this BGC penthouse unit this Friday afternoon. Is the owner open to flexible lease terms?"
  );

  const mockProperty = {
    title: "One Bonifacio High Street Penthouse",
    location: "BGC, Taguig · Metro Manila",
    price: "₱ 185,000 / mo",
    tier: "SEEKER INTEL",
    lister: "Arch. Rafael Santos",
    listerRole: "PRC VERIFIED BROKER",
    // 1, not 3 — /api/deals/initiate spends exactly one Connect via the
    // spend_connects RPC. The 3 here was the same fabricated figure §40.1
    // found hardcoded in the real chat header.
    connectsSpent: 1,
    connectsRemaining: 7,
  };

  const mockMessages = [
    {
      id: "m1",
      sender: "buyer",
      text: "Hi! I'm interested in viewing this BGC penthouse unit this Friday afternoon. Is the owner open to flexible lease terms?",
      time: "2:14 PM",
    },
    {
      id: "m2",
      sender: "broker",
      text: "Good afternoon! Yes, the owner is open to a 6-month or 12-month lease with 2 months deposit. Let's arrange a walkthrough on Friday at 3:00 PM.",
      time: "2:18 PM",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#f0ede8",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "32px 16px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header Badge */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "rgba(232, 174, 60, 0.1)",
              border: "1px solid rgba(232, 174, 60, 0.3)",
              borderRadius: "20px",
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.15em",
              color: "#E8AE3C",
              marginBottom: "8px",
            }}
          >
            MOCKUP CHATBOX INTERACTION PREVIEW
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", margin: "4px 0", color: "#f0ede8" }}>
            Three-State Connects Inbox & Chatbox UI
          </h1>
          <p style={{ color: "#8a8a8a", fontSize: "13px", margin: 0 }}>
            Preview Connect spend receipts, pending Intro fields, contact shielding, and state transitions.
          </p>
        </div>

        {/* Tab Controls */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "#121212",
            padding: "6px",
            borderRadius: "8px",
            border: "1px solid rgba(110, 83, 26, 0.3)",
            marginBottom: "24px",
          }}
        >
          {[
            { id: "waiting", label: "1. WAITING (PENDING)", badge: "1 Connect Spent" },
            { id: "active", label: "2. ACTIVE (ACCEPTED)", badge: "Chat Unlocked" },
            { id: "declined", label: "3. CLOSED", badge: "Declined / Withdrawn" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: isActive ? "rgba(232, 174, 60, 0.15)" : "transparent",
                  border: isActive ? "1px solid #E8AE3C" : "1px solid transparent",
                  borderRadius: "6px",
                  color: isActive ? "var(--accent-bright)" : "var(--text-secondary)",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  transition: "all 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                }}
              >
                <div>{tab.label}</div>
                <div style={{ fontSize: "9px", marginTop: "2px" }}>{tab.badge}</div>
              </button>
            );
          })}
        </div>

        {/* Connect Spend Receipt Trigger Button */}
        <div style={{ marginBottom: "20px", textAlign: "right" }}>
          <button
            onClick={() => setShowReceipt(true)}
            style={{
              padding: "8px 16px",
              background: "rgba(247, 198, 78, 0.1)",
              border: "1px solid #F7C64E",
              color: "#F7C64E",
              borderRadius: "6px",
              fontSize: "11px",
              fontFamily: "var(--font-mono, monospace)",
              letterSpacing: "0.08em",
              cursor: "pointer",
              transition: "transform 160ms ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            ⚡ PREVIEW CONNECT SPEND RECEIPT MODAL
          </button>
        </div>

        {/* Main Chatbox Card */}
        <div
          style={{
            background: "#121212",
            border: "1px solid rgba(110, 83, 26, 0.4)",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Property Context Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(232, 174, 60, 0.05)",
              borderBottom: "1px solid rgba(110, 83, 26, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.12em",
                  color: "#E8AE3C",
                }}
              >
                PROPERTY CONTEXT
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#f0ede8", marginTop: "2px" }}>
                {mockProperty.title}
              </div>
              <div style={{ fontSize: "12px", color: "#8a8a8a", marginTop: "2px" }}>
                {mockProperty.location} · <strong style={{ color: "#F7C64E" }}>{mockProperty.price}</strong>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.08em",
                  background:
                    activeTab === "waiting"
                      ? "rgba(232, 174, 60, 0.2)"
                      : activeTab === "active"
                      ? "rgba(46, 204, 113, 0.2)"
                      : "rgba(231, 76, 60, 0.2)",
                  color:
                    activeTab === "waiting"
                      ? "#F7C64E"
                      : activeTab === "active"
                      ? "#2ecc71"
                      : "#e74c3c",
                  border: `1px solid ${
                    activeTab === "waiting"
                      ? "#F7C64E"
                      : activeTab === "active"
                      ? "#2ecc71"
                      : "#e74c3c"
                  }`,
                }}
              >
                STATUS: {activeTab.toUpperCase()}
              </div>
              <div style={{ fontSize: "10px", color: "#8a8a8a", marginTop: "4px", fontFamily: "var(--font-mono, monospace)" }}>
                3 CONNECTS SPENT
              </div>
            </div>
          </div>

          {/* Lister / Identity Banner */}
          <div
            style={{
              padding: "12px 20px",
              background: "#0d0d0d",
              borderBottom: "1px solid rgba(110, 83, 26, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#1e1e1e",
                  border: "1px solid #E8AE3C",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#E8AE3C",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                RS
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#f0ede8" }}>{mockProperty.lister}</div>
                <div style={{ fontSize: "10px", color: "#E8AE3C", fontFamily: "var(--font-mono, monospace)" }}>
                  {mockProperty.listerRole}
                </div>
              </div>
            </div>

            {/* Contact Details Reveal (Shielded in WAITING, Revealed in ACTIVE) */}
            <div>
              {activeTab === "active" ? (
                <div
                  style={{
                    padding: "6px 12px",
                    background: "rgba(46, 204, 113, 0.1)",
                    border: "1px solid rgba(46, 204, 113, 0.3)",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#2ecc71",
                  }}
                >
                  📞 +63 917 555 0192 · ✉️ rafael@scoutit.space
                </div>
              ) : (
                <div
                  style={{
                    padding: "6px 12px",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#8a8a8a",
                  }}
                >
                  🔒 CONTACT DETAILS REVEAL ON ACCEPTANCE
                </div>
              )}
            </div>
          </div>

          {/* Body Content Area */}
          <div style={{ padding: "20px", minHeight: "220px" }}>
            {activeTab === "waiting" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div
                  style={{
                    padding: "14px 16px",
                    background: "rgba(232, 174, 60, 0.06)",
                    borderLeft: "3px solid #E8AE3C",
                    borderRadius: "4px",
                    fontSize: "13px",
                    color: "#d0ccc6",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontFamily: "var(--font-mono, monospace)",
                      color: "#E8AE3C",
                      marginBottom: "4px",
                    }}
                  >
                    AWAITING RECIPIENT ACCEPTANCE
                  </div>
                  Your Connect request was delivered to {mockProperty.lister}. There is no deadline on their reply — it moves to your archive after 7 days (still acceptable) and is removed after 30. Reopening it restarts that clock.
                </div>

                <label
                  htmlFor="showcase-intro-message"
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono, monospace)",
                    color: "#8a8a8a",
                    letterSpacing: "0.06em",
                  }}
                >
                  INTRO MESSAGE TO LISTER (MAX 300 CHARACTERS):
                </label>
                <textarea
                  id="showcase-intro-message"
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value.slice(0, 300))}
                  style={{
                    width: "100%",
                    height: "80px",
                    background: "#0d0d0d",
                    border: "1px solid rgba(110, 83, 26, 0.4)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: "#f0ede8",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
                <div style={{ fontSize: "10px", color: "#8a8a8a", textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>
                  {introText.length}/300 CHARACTERS
                </div>
              </div>
            )}

            {activeTab === "active" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.sender === "buyer" ? "flex-end" : "flex-start",
                      maxWidth: "75%",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: msg.sender === "buyer" ? "rgba(232, 174, 60, 0.2)" : "#1c1c1c",
                      border: msg.sender === "buyer" ? "1px solid rgba(232, 174, 60, 0.4)" : "1px solid #282828",
                      color: "#f0ede8",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    <div>{msg.text}</div>
                    <div
                      style={{
                        fontSize: "9px",
                        fontFamily: "var(--font-mono, monospace)",
                        color: "#8a8a8a",
                        marginTop: "6px",
                        textAlign: "right",
                      }}
                    >
                      {msg.time}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "declined" && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔒</div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#e74c3c",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  CONNECT REQUEST CLOSED
                </div>
                <p style={{ color: "#8a8a8a", fontSize: "12px", maxWidth: "420px", margin: "8px auto 0" }}>
                  This Connect request was declined by the recipient, or withdrawn by the sender. Connects are non-refundable — they cover the intent delivery cost.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Spend Receipt Modal Overlay */}
        {showReceipt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
          >
            <div
              style={{
                maxWidth: "440px",
                width: "100%",
                background: "#121212",
                border: "1px solid #F7C64E",
                borderRadius: "12px",
                padding: "28px 24px",
                boxShadow: "0 0 40px rgba(247, 198, 78, 0.25)",
                textAlign: "center",
                animation: "receiptPop 240ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.2em",
                  color: "#F7C64E",
                  marginBottom: "8px",
                }}
              >
                CONNECT SPENT · ATOMIC RECEIPT
              </div>
              <div style={{ fontSize: "42px", fontWeight: "800", color: "#F7C64E", margin: "8px 0" }}>
                3 CONNECTS
              </div>
              <div style={{ fontSize: "13px", color: "#d0ccc6", marginBottom: "16px" }}>
                Delivered to <strong>{mockProperty.lister}</strong>
              </div>

              <div
                style={{
                  background: "#0d0d0d",
                  padding: "12px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono, monospace)",
                  color: "#8a8a8a",
                  textAlign: "left",
                  marginBottom: "20px",
                  lineHeight: 1.6,
                }}
              >
                <div>HANDSHAKE ID: hs_8f92a10b4</div>
                <div>STATUS: PENDING_RESPONSE</div>
                <div>WALLET REMAINING: {mockProperty.connectsRemaining} CONNECTS</div>
                <div>REFUND POLICY: NON-REFUNDABLE</div>
              </div>

              <button
                onClick={() => setShowReceipt(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#F7C64E",
                  color: "#0d0d0d",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  transition: "transform 160ms ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                CLOSE RECEIPT PREVIEW
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
