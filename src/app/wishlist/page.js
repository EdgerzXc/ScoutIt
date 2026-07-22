"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ReactionBadge } from "@/components/ui/ReactionButtons";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { supabase } from "@/lib/supabaseClient";
import { getSession } from "@/lib/authClient";

const REACTION_ORDER = ["Potential Fit", "Interested", "Inspired Me", "Save"];

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fadingOut, setFadingOut] = useState(new Set());

  // Account sync: when the visitor is signed in, offer to pull the device's
  // local Board into their account (saved_intel). The local copy is KEPT so
  // the device still works signed-out — we just stop showing the prompt once
  // the account already has everything.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountSavedIds, setAccountSavedIds] = useState(() => new Set());
  const [merging, setMerging] = useState(false);
  const [mergeMessage, setMergeMessage] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_reactions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      }
    } catch (e) {
      // silently ignore corrupt data
    }
    setLoaded(true);
  }, []);

  // Detect a real signed-in session and read what the account already has
  // saved (RLS returns only the caller's own rows).
  useEffect(() => {
    let cancelled = false;
    const loadAccount = async () => {
      try {
        const { data } = await getSession();
        const session = data?.session;
        if (!session?.user) return;
        if (!cancelled) setIsLoggedIn(true);

        const { data: savedRows } = await supabase
          .from("saved_intel")
          .select("property_id");
        if (!cancelled && Array.isArray(savedRows)) {
          setAccountSavedIds(new Set(savedRows.map((r) => r.property_id)));
        }
      } catch (e) {
        // Not signed in / read failed — the prompt simply won't show.
      }
    };
    loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  // Distinct property ids on this device that the account doesn't have yet.
  const localOnlyIds = [...new Set(items.map((i) => i.property_id).filter(Boolean))]
    .filter((id) => !accountSavedIds.has(id));
  const showMergePrompt = isLoggedIn && localOnlyIds.length > 0;

  const handleMerge = async () => {
    if (merging || localOnlyIds.length === 0) return;
    setMerging(true);
    setMergeMessage(null);
    try {
      const { data } = await getSession();
      const token = data?.session?.access_token;
      const res = await fetch("/api/wishlist/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ propertyIds: localOnlyIds }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Merge failed");

      // Fold the merged ids into the known account set so the prompt clears.
      // Local storage is intentionally left untouched.
      setAccountSavedIds((prev) => new Set([...prev, ...localOnlyIds]));
      const n = result.merged ?? 0;
      setMergeMessage(
        n > 0
          ? `${n} saved ${n === 1 ? "space" : "spaces"} added to your account — they'll follow you across devices.`
          : "Your account already had these saved."
      );
    } catch (e) {
      setMergeMessage("Couldn't sync right now — please try again in a moment.");
    } finally {
      setMerging(false);
    }
  };

  const removeItem = (timestamp) => {
    setFadingOut((prev) => new Set([...prev, timestamp]));
    setTimeout(() => {
      setItems((prev) => {
        const updated = prev.filter((item) => item.timestamp !== timestamp);
        localStorage.setItem("scoutit_reactions", JSON.stringify(updated));
        return updated;
      });
      setFadingOut((prev) => {
        const next = new Set(prev);
        next.delete(timestamp);
        return next;
      });
    }, 300);
  };

  const grouped = REACTION_ORDER.map((type) => ({
    type,
    items: items.filter((item) => item.reaction_type === type),
  })).filter((group) => group.items.length > 0);

  const isEmpty = loaded && items.length === 0;

  return (
    <div className="page-wrapper">
      <AtmosphereBackground variant="default" />
      <Header />
      <main className="wishlist-main">
        <header className="page-header">
          <span className="layer-label">LAYER 06 // YOUR BOARD</span>
          <h1 className="page-title">Your Board</h1>
        </header>

        {showMergePrompt && (
          <div className="merge-banner">
            <div className="merge-copy">
              <span className="merge-label">SYNC // ACCOUNT</span>
              <p className="merge-text">
                <strong>{localOnlyIds.length}</strong> saved{" "}
                {localOnlyIds.length === 1 ? "space is" : "spaces are"} on this device only.
              </p>
            </div>
            <button
              className="merge-btn"
              onClick={handleMerge}
              disabled={merging}
            >
              {merging
                ? "Bringing them in…"
                : `Bring ${localOnlyIds.length} into your account`}
            </button>
          </div>
        )}

        {mergeMessage && <div className="merge-message">{mergeMessage}</div>}

        {!loaded && (
          <div className="loading-state">Loading...</div>
        )}

        {isEmpty && (
          <div className="empty-state">
            <div className="empty-heading">Your dreams live here.</div>
            <div className="empty-subtitle">
              Dreaming is free. This is your inspiration board.
            </div>
            <Link href="/discover" className="empty-cta">
              Start Exploring →
            </Link>
          </div>
        )}

        {loaded && items.length > 0 && (
          <div className="board-content">
            {grouped.map((group) => (
              <section key={group.type} className="reaction-group">
                <h2 className="group-label">{group.type}</h2>
                <div className="cards-grid">
                  {group.items.map((item, index) => (
                    <div
                      key={item.timestamp}
                      className={`board-card stagger-enter ${fadingOut.has(item.timestamp) ? "fading" : ""}`}
                      style={{ '--i': index }}
                    >
                      <div className="badge-corner">
                        <ReactionBadge reactionType={item.reaction_type} />
                      </div>
                      <div className="card-body">
                        {item.is_broker ? (
                          <Link href={`/brokers/${encodeURIComponent(item.property_id)}`} style={{ textDecoration: "none" }}>
                            <h3 className="card-title">{item.property_title}</h3>
                          </Link>
                        ) : (
                          <Link href={`/property/${encodeURIComponent(item.property_id)}`} style={{ textDecoration: "none" }}>
                            <h3 className="card-title">{item.property_title}</h3>
                          </Link>
                        )}
                        <div className="card-meta">
                          {item.is_broker && <span className="advisor-badge">ADVISOR</span>}
                          {item.city && <span>{item.city}</span>}
                          {item.category && !item.is_broker && (
                            <>
                              <span className="meta-dot">·</span>
                              <span>{item.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="card-actions">
                        <span className="reaction-badge">{item.reaction_type}</span>
                        <button
                          className="remove-btn"
                          onClick={() => removeItem(item.timestamp)}
                          aria-label="Remove from board"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            <div className="board-footer">
              Your board is saved on this device.
            </div>
          </div>
        )}
      </main>
      <Footer />

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: #0e0e0e;
          color: #f0ede8;
          position: relative;
        }

        .wishlist-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 120px 24px 80px;
          position: relative;
          z-index: 1;
        }

        .page-header {
          margin-bottom: 48px;
        }

        .layer-label {
          display: block;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #E8AE3C;
          margin-bottom: 16px;
        }

        .page-title {
          font-family: Georgia, serif;
          font-size: 40px;
          font-weight: normal;
          color: #f0ede8;
          margin: 0;
        }

        /* Account sync prompt */
        .merge-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          background: linear-gradient(165deg, rgba(232, 174, 60, 0.10), rgba(17, 17, 16, 0.6));
          border: 1px solid rgba(232, 174, 60, 0.35);
          padding: 20px 24px;
          margin-bottom: 32px;
        }

        .merge-copy {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .merge-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #E8AE3C;
        }

        .merge-text {
          margin: 0;
          font-size: 15px;
          color: #f0ede8;
        }

        .merge-text strong {
          color: #F7C64E;
        }

        .merge-btn {
          background: #F7C64E;
          color: #0e0e0e;
          border: none;
          padding: 12px 22px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono), monospace;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.1s;
        }

        .merge-btn:hover:not(:disabled) {
          background: #E8AE3C;
        }

        .merge-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .merge-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        .merge-message {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: #f0ede8;
          margin-bottom: 24px;
          padding: 12px 16px;
          border-left: 2px solid #E8AE3C;
          background: rgba(232, 174, 60, 0.06);
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 0;
        }

        .empty-heading {
          font-family: Georgia, serif;
          font-size: 32px;
          color: #f0ede8;
        }

        .empty-subtitle {
          font-family: var(--font-mono), monospace;
          font-size: 14px;
          color: #c8c8c8;
          margin-top: 8px;
        }

        .empty-cta {
          display: inline-block;
          margin-top: 32px;
          background: transparent;
          border: 1px solid #E8AE3C;
          color: #E8AE3C;
          padding: 12px 28px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          font-family: var(--font-mono), monospace;
          transition: background 0.2s, color 0.2s;
        }

        .empty-cta:hover {
          background: #E8AE3C;
          color: #0e0e0e;
        }

        .empty-cta:active {
          transform: scale(0.95);
        }

        /* Loading */
        .loading-state {
          text-align: center;
          padding: 120px 0;
          color: #c8c8c8;
          font-size: 14px;
        }

        /* Board content */
        .board-content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .reaction-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #E8AE3C;
          margin: 0 0 4px;
          padding-bottom: 8px;
          border-bottom: 1px solid #262626;
        }

        .cards-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .board-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(165deg, #1a1917, #111110);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 20px;
          transition: opacity 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
          position: relative;
        }

        .board-card:hover {
          transform: translateY(-3px);
          border-color: rgba(232, 174, 60, 0.3);
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.45), 0 0 24px rgba(232, 174, 60, 0.18);
        }

        .badge-corner {
          position: absolute;
          top: -8px;
          right: -8px;
          z-index: 10;
        }

        .board-card.fading {
          opacity: 0;
          transform: translateX(-20px);
        }

        .card-body {
          flex: 1;
          min-width: 0;
        }

        .card-title {
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 500;
          color: #f0ede8;
          margin: 0 0 4px;
          transition: color 0.2s ease;
        }

        .card-title:hover {
          color: #E8AE3C;
        }

        .card-meta {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: #c8c8c8;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .advisor-badge {
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.3);
          color: #E8AE3C;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 2px;
          font-family: var(--font-mono), monospace;
          margin-right: 6px;
        }

        .meta-dot {
          color: #444;
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .reaction-badge {
          font-family: var(--font-mono), monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #E8AE3C;
          border: 1px solid rgba(232, 174, 60, 0.3);
          padding: 4px 10px;
          white-space: nowrap;
        }

        .remove-btn {
          background: none;
          border: 1px solid #262626;
          color: #c8c8c8;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s, border-color 0.2s;
          font-family: var(--font-mono), monospace;
        }

        .remove-btn:hover {
          color: #f0ede8;
          border-color: #f0ede8;
        }

        .remove-btn:active {
          transform: scale(0.95);
        }

        .board-footer {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          color: #c8c8c8;
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #262626;
        }

        @media (max-width: 768px) {
          .wishlist-main {
            padding: 80px 16px 40px;
          }
          .page-title {
            font-size: 30px;
          }
          .merge-banner {
            flex-direction: column;
            align-items: stretch;
          }
          .merge-btn {
            width: 100%;
            min-height: 44px;
          }
          .board-card {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
          .card-actions {
            justify-content: space-between;
            width: 100%;
            border-top: 1px dashed #262626;
            padding-top: 10px;
            margin-top: 4px;
          }
          .badge-corner {
            top: -6px;
            right: -6px;
          }
        }

        @media (max-width: 640px) {
          .wishlist-main {
            padding: 70px 14px 32px;
          }
          .page-title {
            font-size: 26px;
          }
          .board-card {
            padding: 14px;
            gap: 10px;
          }
          /* Full-width action buttons on small phones */
          .card-actions button,
          .card-actions a {
            flex: 1;
            min-height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 22px;
          }
          .wishlist-main {
            padding: 60px 12px 28px;
          }
        }
      `}</style>
    </div>
  );
}
