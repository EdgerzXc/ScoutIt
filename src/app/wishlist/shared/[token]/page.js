"use client";

import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { useParams } from "next/navigation";

export default function SharedWishlistPage() {
  const params = useParams();
  const token = params?.token;
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    async function fetchSharedWishlist() {
      try {
        const res = await fetch(`/api/wishlist/share/${token}`);
        const data = await res.json();

        if (data.error) {
          setError(data.error);
        } else {
          setItems(data.items || []);
        }
      } catch (err) {
        setError("Failed to load shared wishlist");
      } finally {
        setLoaded(true);
      }
    }
    fetchSharedWishlist();
  }, [token]);

  return (
    <div className="page-wrapper">
      <AtmosphereBackground variant="default" />
      <Header />

      <main className="wishlist-main">
        <header className="page-header">
          <span className="layer-label">Shared Board</span>
          <h1 className="page-title">Curated Spaces</h1>
        </header>

        {loaded && error && (
          <div className="empty-state">
            <h2 className="empty-heading">Link Invalid or Expired</h2>
            <div className="empty-subtitle">{error}</div>
            <Link href="/discover" className="empty-cta">
              Explore Spaces
            </Link>
          </div>
        )}

        {!loaded && (
          <div className="loading-state">Decrypting shared board...</div>
        )}

        {loaded && !error && items.length === 0 && (
          <div className="empty-state">
            <h2 className="empty-heading">This Board is Empty</h2>
            <div className="empty-subtitle">
              The sender hasn&apos;t added any properties to this board yet.
            </div>
            <Link href="/discover" className="empty-cta">
              Explore Spaces
            </Link>
          </div>
        )}

        {loaded && !error && items.length > 0 && (
          <div className="board-content">
            <div className="cards-grid">
              {items.map((item) => (
                <div key={item.id} className="board-card">
                  <div className="card-body">
                    <Link href={`/property/${encodeURIComponent(item.id)}`} style={{ textDecoration: "none" }}>
                      <h3 className="card-title">{item.title}</h3>
                    </Link>
                    <div className="card-meta">
                      {item.location && <span>{item.location}</span>}
                      {item.type && (
                        <>
                          <span className="meta-dot">·</span>
                          <span>{item.type}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="card-actions">
                    <Link href={`/property/${encodeURIComponent(item.id)}`} className="view-btn">
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
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
          font-family: system-ui, sans-serif;
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
          font-family: system-ui, sans-serif;
          transition: background 0.2s, color 0.2s;
        }

        .empty-cta:hover {
          background: #E8AE3C;
          color: #0e0e0e;
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
          font-family: system-ui, sans-serif;
          font-size: 12px;
          color: #c8c8c8;
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

        .view-btn {
          background: transparent;
          border: 1px solid #E8AE3C;
          color: #E8AE3C;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          padding: 6px 14px;
          font-family: system-ui, sans-serif;
          transition: all 0.2s ease;
        }

        .view-btn:hover {
          background: #E8AE3C;
          color: #0e0e0e;
        }

        @media (max-width: 768px) {
          .wishlist-main {
            padding: 80px 16px 40px;
          }
          .page-title {
            font-size: 30px;
          }
          .board-card {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 16px;
          }
          .card-actions {
            justify-content: flex-end;
            width: 100%;
            border-top: 1px dashed #262626;
            padding-top: 10px;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
