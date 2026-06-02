"use client";

import Header from "@/components/Header";
import { useState } from "react";

const DUMMY_WISHLIST = [
  {
    id: "w-01",
    name: "The Estate Makati - Penthouse",
    location: "Ayala Avenue, Makati",
    added: "2 days ago",
    status: "Priority",
    notes: "Checking availability for Q3 2026. Await floorplans.",
  },
  {
    id: "w-02",
    name: "Aurelia Residences - 3BR",
    location: "Bonifacio Global City, Taguig",
    added: "1 week ago",
    status: "Monitoring",
    notes: "West-facing unit with Manila Golf Club views preferred.",
  },
  {
    id: "w-03",
    name: "Park Central Towers",
    location: "Makati CBD",
    added: "2 weeks ago",
    status: "Archived",
    notes: "Waitlisted. Potential resale opportunity.",
  },
];

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState(DUMMY_WISHLIST);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="wishlist-main">
        <header className="page-header">
          <span className="vector-label">Vector 04</span>
          <h1 className="page-title">Personal Ledger</h1>
          <p className="page-subtitle">Track micro-conversion affinity bookmarks and saved properties.</p>
        </header>

        <section className="ledger-container">
          <div className="ledger-header">
            <span>Asset</span>
            <span>Location</span>
            <span>Status</span>
            <span>Date Added</span>
            <span className="text-right">Action</span>
          </div>
          
          <div className="ledger-body">
            {wishlist.map((item) => (
              <div key={item.id} className="ledger-row">
                <div className="cell-asset">
                  <h3>{item.name}</h3>
                  <p>{item.notes}</p>
                </div>
                <div className="cell-location">{item.location}</div>
                <div className="cell-status">
                  <span className={`status-badge ${item.status.toLowerCase()}`}>{item.status}</span>
                </div>
                <div className="cell-date">{item.added}</div>
                <div className="cell-action text-right">
                  <button className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <style>{`
        .page-wrapper {
          background: var(--bg);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .wishlist-main {
          padding: 60px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .vector-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 42px;
          margin: 12px 0;
          color: var(--text-primary);
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .ledger-container {
          background: var(--surface);
          border: 1px solid var(--border-solid);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ledger-header {
          display: grid;
          grid-template-columns: 2.5fr 1.5fr 1fr 1fr 1fr;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-solid);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          background: rgba(0,0,0,0.2);
        }

        .ledger-row {
          display: grid;
          grid-template-columns: 2.5fr 1.5fr 1fr 1fr 1fr;
          padding: 24px;
          border-bottom: 1px solid var(--border-solid);
          align-items: center;
          transition: background 0.25s ease;
        }

        .ledger-row:last-child {
          border-bottom: none;
        }

        .ledger-row:hover {
          background: var(--surface2);
        }

        .cell-asset h3 {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .cell-asset p {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .cell-location {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .cell-date {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-muted);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }

        .status-badge.priority {
          background: rgba(200, 169, 110, 0.1);
          color: var(--accent);
          border: 1px solid rgba(200, 169, 110, 0.3);
        }

        .status-badge.monitoring {
          background: rgba(240, 237, 232, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border-solid);
        }

        .status-badge.archived {
          background: rgba(0,0,0,0.3);
          color: var(--text-muted);
          border: 1px dashed var(--border-solid);
        }

        .text-right {
          text-align: right;
        }

        .btn-remove {
          background: transparent;
          border: 1px solid var(--border-solid);
          color: var(--text-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 6px 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          border-radius: 2px;
        }

        .btn-remove:hover {
          border-color: #ff4a4a;
          color: #ff4a4a;
        }
      `}</style>
    </div>
  );
}
