"use client";

import Header from "@/components/Header";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ReactionBadge } from "@/components/ReactionButtons";

const REACTION_ORDER = ["Potential Fit", "Interested", "Inspired Me", "Save"];

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fadingOut, setFadingOut] = useState(new Set());

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
      <Header />
      <main className="wishlist-main">
        <header className="page-header">
          <span className="layer-label">LAYER 04 // YOUR BOARD</span>
          <h1 className="page-title">Your Board</h1>
        </header>

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
                  {group.items.map((item) => (
                    <div
                      key={item.timestamp}
                      className={`board-card ${fadingOut.has(item.timestamp) ? "fading" : ""}`}
                    >
                      <div className="badge-corner">
                        <ReactionBadge reactionType={item.reaction_type} />
                      </div>
                      <div className="card-body">
                        <h3 className="card-title">{item.property_title}</h3>
                        <div className="card-meta">
                          {item.city && <span>{item.city}</span>}
                          {item.category && (
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

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          background: #0e0e0e;
          color: #f0ede8;
        }

        .wishlist-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 120px 24px 80px;
        }

        .page-header {
          margin-bottom: 48px;
        }

        .layer-label {
          display: block;
          font-family: system-ui, sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #c8a96e;
          margin-bottom: 16px;
        }

        .page-title {
          font-family: Georgia, serif;
          font-size: 40px;
          font-weight: normal;
          color: #f0ede8;
          margin: 0;
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
          font-family: system-ui, sans-serif;
          font-size: 14px;
          color: #8a8a8a;
          margin-top: 8px;
        }

        .empty-cta {
          display: inline-block;
          margin-top: 32px;
          background: transparent;
          border: 1px solid #c8a96e;
          color: #c8a96e;
          padding: 12px 28px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          font-family: system-ui, sans-serif;
          transition: background 0.2s, color 0.2s;
        }

        .empty-cta:hover {
          background: #c8a96e;
          color: #0e0e0e;
        }

        /* Loading */
        .loading-state {
          text-align: center;
          padding: 120px 0;
          color: #8a8a8a;
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
          font-family: system-ui, sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #c8a96e;
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
          background: #161616;
          border: 1px solid #262626;
          padding: 16px 20px;
          transition: opacity 0.3s ease, transform 0.3s ease;
          position: relative;
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
        }

        .card-meta {
          font-family: system-ui, sans-serif;
          font-size: 12px;
          color: #8a8a8a;
          display: flex;
          align-items: center;
          gap: 4px;
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
          font-family: system-ui, sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #c8a96e;
          border: 1px solid rgba(200, 169, 110, 0.3);
          padding: 4px 10px;
          white-space: nowrap;
        }

        .remove-btn {
          background: none;
          border: 1px solid #262626;
          color: #8a8a8a;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          transition: color 0.2s, border-color 0.2s;
          font-family: system-ui, sans-serif;
        }

        .remove-btn:hover {
          color: #f0ede8;
          border-color: #f0ede8;
        }

        .board-footer {
          font-family: system-ui, sans-serif;
          font-size: 11px;
          color: #8a8a8a;
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid #262626;
        }
      `}</style>
    </div>
  );
}
