"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { ReactionBadge } from "@/components/ui/ReactionButtons";
import AtmosphereBackground from "@/components/ui/AtmosphereBackground";
import { supabase } from "@/lib/supabaseClient";
import { getSession } from "@/lib/authClient";
import { classifySavedItem, liveSlugSet } from "@/lib/wishlistLiveness";

const REACTION_ORDER = ["Potential Fit", "Interested", "Inspired Me", "Save"];

export default function WishlistPage() {
  const [offlineItems, setOfflineItems] = useState([]);
  const [cloudItems, setCloudItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [fadingOut, setFadingOut] = useState(new Set());

  // Account sync & session
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [accountSavedIds, setAccountSavedIds] = useState(() => new Set());
  const [merging, setMerging] = useState(false);
  const [mergeMessage, setMergeMessage] = useState(null);

  // Interchangeable storage mode: "all" (unified) | "cloud" (account) | "offline" (device)
  const [activeMode, setActiveMode] = useState("all");

  // CMS catalogue for live property titles, cities, categories, and liveness checks
  const [cmsMap, setCmsMap] = useState({});
  const [liveSlugs, setLiveSlugs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cms")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.properties)) {
          setLiveSlugs(liveSlugSet(data.properties));
          const map = {};
          data.properties.forEach((p) => {
            const key = p.slug || p.id;
            if (key) map[key] = p;
          });
          setCmsMap(map);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 1. Load Local / Offline items from device storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_reactions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOfflineItems(parsed);
        }
      }
    } catch (e) {
      // silently ignore corrupt local data
    }
    setLoaded(true);
  }, []);

  // 2. Load Real Supabase Account items if authenticated
  useEffect(() => {
    let cancelled = false;
    const loadAccount = async () => {
      try {
        const { data } = await getSession();
        const session = data?.session;
        if (!session?.user) {
          if (!cancelled) {
            setIsLoggedIn(false);
            setActiveMode("offline");
          }
          return;
        }

        if (!cancelled) {
          setIsLoggedIn(true);
          setUserEmail(session.user.email || "");
          setActiveMode("all");
        }

        const { data: savedRows, error } = await supabase
          .from("saved_intel")
          .select("property_id, reaction_type, created_at")
          .order("created_at", { ascending: false });

        if (!cancelled && !error && Array.isArray(savedRows)) {
          const mappedCloud = savedRows.map((r) => ({
            property_id: r.property_id,
            reaction_type: r.reaction_type || "Save",
            timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
            is_cloud: true,
          }));
          setCloudItems(mappedCloud);
          setAccountSavedIds(new Set(savedRows.map((r) => r.property_id)));
        }
      } catch (e) {
        // Not signed in / read failed — fallback gracefully to offline mode
      }
    };
    loadAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  // Distinct property ids on this device that the account doesn't have yet
  const localOnlyItems = useMemo(() => {
    return offlineItems.filter((i) => i.property_id && !accountSavedIds.has(i.property_id));
  }, [offlineItems, accountSavedIds]);

  const showSyncBanner = isLoggedIn && localOnlyItems.length > 0;

  // 1-Tap Cloud Sync / Merge
  const handleSync = async () => {
    if (merging || localOnlyItems.length === 0) return;
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
        body: JSON.stringify({
          items: localOnlyItems.map((it) => ({
            property_id: it.property_id,
            reaction_type: it.reaction_type || "Save",
          })),
          propertyIds: localOnlyItems.map((it) => it.property_id),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sync failed");

      // Fold the merged ids into the known account set so the banner clears
      const newlyAddedIds = localOnlyItems.map((it) => it.property_id);
      setAccountSavedIds((prev) => new Set([...prev, ...newlyAddedIds]));
      setCloudItems((prev) => [
        ...localOnlyItems.map((it) => ({ ...it, is_cloud: true })),
        ...prev,
      ]);

      const n = result.merged ?? 0;
      setMergeMessage(
        n > 0
          ? `${n} saved ${n === 1 ? "space" : "spaces"} synchronized to your account across devices.`
          : "Your account already had these spaces saved."
      );
      setTimeout(() => setMergeMessage(null), 6000);
    } catch (e) {
      setMergeMessage("Couldn't sync right now. Please try again in a moment.");
    } finally {
      setMerging(false);
    }
  };

  // Safe removal across both offline storage and cloud account
  const removeItem = useCallback((item) => {
    const key = item.timestamp || item.property_id;
    setFadingOut((prev) => new Set([...prev, key]));
    setTimeout(() => {
      // 1. Remove from local storage
      setOfflineItems((prev) => {
        const updated = prev.filter(
          (it) => it.property_id !== item.property_id && it.timestamp !== item.timestamp
        );
        try {
          localStorage.setItem("scoutit_reactions", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // 2. Remove from cloud account if authenticated
      if (isLoggedIn && item.property_id) {
        setCloudItems((prev) => prev.filter((it) => it.property_id !== item.property_id));
        setAccountSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.property_id);
          return next;
        });
        supabase
          .from("saved_intel")
          .delete()
          .eq("property_id", item.property_id)
          .then(() => {})
          .catch((err) => console.warn("[WISHLIST] Cloud delete failed:", err));
      }

      setFadingOut((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 250);
  }, [isLoggedIn]);

  // Compute active item set based on interchangeable mode
  const displayItems = useMemo(() => {
    let sourceList = [];
    const localIds = new Set(offlineItems.map((i) => i.property_id));

    if (!isLoggedIn || activeMode === "offline") {
      sourceList = offlineItems.map((it) => ({
        ...it,
        is_local: true,
        is_cloud: accountSavedIds.has(it.property_id),
      }));
    } else if (activeMode === "cloud") {
      sourceList = cloudItems.map((it) => ({
        ...it,
        is_cloud: true,
        is_local: localIds.has(it.property_id),
      }));
    } else {
      // "all" unified mode
      const seen = new Set();
      const combined = [];

      cloudItems.forEach((c) => {
        seen.add(c.property_id);
        combined.push({
          ...c,
          is_cloud: true,
          is_local: localIds.has(c.property_id),
        });
      });

      offlineItems.forEach((o) => {
        if (!seen.has(o.property_id)) {
          seen.add(o.property_id);
          combined.push({
            ...o,
            is_cloud: false,
            is_local: true,
          });
        }
      });

      sourceList = combined;
    }

    // Enrich with CMS metadata (title, city, category) if missing
    return sourceList.map((item) => {
      const prop = cmsMap[item.property_id];
      return {
        ...item,
        property_title: item.property_title || prop?.title || "Curated Space",
        city: item.city || prop?.city || "",
        category: item.category || prop?.spaceCategory || "",
        is_broker: Boolean(item.is_broker || prop?.is_broker),
        removed: classifySavedItem(item, liveSlugs) === "removed",
      };
    });
  }, [isLoggedIn, activeMode, offlineItems, cloudItems, accountSavedIds, cmsMap, liveSlugs]);

  // Group items by reaction type
  const grouped = useMemo(() => {
    const list = REACTION_ORDER.map((type) => ({
      type,
      items: displayItems.filter((item) => (item.reaction_type || "Save") === type),
    })).filter((group) => group.items.length > 0);

    // Fallback for any items with atypical reaction types
    const knownReactions = new Set(REACTION_ORDER);
    const uncategorized = displayItems.filter(
      (item) => !knownReactions.has(item.reaction_type)
    );
    if (uncategorized.length > 0) {
      const saveGroup = list.find((g) => g.type === "Save");
      if (saveGroup) {
        saveGroup.items.push(...uncategorized);
      } else {
        list.push({ type: "Save", items: uncategorized });
      }
    }
    return list;
  }, [displayItems]);

  const totalUniqueCount = useMemo(() => {
    const ids = new Set([
      ...offlineItems.map((i) => i.property_id),
      ...cloudItems.map((i) => i.property_id),
    ]);
    return ids.size;
  }, [offlineItems, cloudItems]);

  const isEmpty = loaded && displayItems.length === 0;

  return (
    <div className="page-wrapper">
      <AtmosphereBackground variant="default" />
      <Header />
      <main className="wishlist-main">
        <header className="page-header">
          <span className="layer-label">LAYER 06 // YOUR BOARD</span>
          <div className="header-headline-row">
            <h1 className="page-title">Your Board</h1>
            <div className="status-pill-badge" title="Active storage mode">
              <span className={`status-dot ${isLoggedIn ? "online" : "offline"}`} />
              <span className="status-text">
                {isLoggedIn ? "ACCOUNT SYNC ACTIVE" : "OFFLINE MODE · THIS DEVICE"}
              </span>
            </div>
          </div>
        </header>

        {/* Interchangeable Mode Selector */}
        <nav className="board-mode-nav" role="tablist" aria-label="Board storage view">
          {isLoggedIn ? (
            <>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "all"}
                className={`mode-tab ${activeMode === "all" ? "active" : ""}`}
                onClick={() => setActiveMode("all")}
              >
                ALL SAVED ({totalUniqueCount})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "cloud"}
                className={`mode-tab ${activeMode === "cloud" ? "active" : ""}`}
                onClick={() => setActiveMode("cloud")}
              >
                <span className="mode-dot cloud" aria-hidden="true" />
                CLOUD ACCOUNT ({cloudItems.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "offline"}
                className={`mode-tab ${activeMode === "offline" ? "active" : ""}`}
                onClick={() => setActiveMode("offline")}
              >
                <span className="mode-dot local" aria-hidden="true" />
                THIS DEVICE ({offlineItems.length})
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                role="tab"
                aria-selected={activeMode === "offline"}
                className="mode-tab active"
                onClick={() => setActiveMode("offline")}
              >
                <span className="mode-dot local" aria-hidden="true" />
                THIS DEVICE (OFFLINE: {offlineItems.length})
              </button>
              <Link
                href="/login?next=%2Fwishlist"
                className="mode-tab sign-in-tab"
                title="Sign in to sync your board across devices"
              >
                <span className="mode-dot cloud-locked" aria-hidden="true" />
                SIGN IN TO SYNC CLOUD ↗
              </Link>
            </>
          )}
        </nav>

        {/* Sync Banner for Local-Only Items */}
        {showSyncBanner && (
          <aside className="sync-banner" aria-label="Account synchronization">
            <div className="sync-copy">
              <span className="sync-label">SYNC // ACCOUNT</span>
              <p className="sync-text">
                <strong>{localOnlyItems.length}</strong> saved{" "}
                {localOnlyItems.length === 1 ? "space is" : "spaces are"} on this device only.
              </p>
            </div>
            <button
              className="sync-btn"
              onClick={handleSync}
              disabled={merging}
            >
              {merging
                ? "Synchronizing…"
                : `Sync ${localOnlyItems.length} to Cloud Account`}
            </button>
          </aside>
        )}

        {/* Offline Guest Info Banner */}
        {!isLoggedIn && offlineItems.length > 0 && (
          <div className="guest-info-banner">
            <div className="guest-info-copy">
              <span className="guest-info-title">SAVED LOCALLY</span>
              <p className="guest-info-desc">
                Your spaces are stored on this device. Sign in to synchronize your board across your phone, tablet, and desktop.
              </p>
            </div>
            <Link href="/login?next=%2Fwishlist" className="guest-sign-in-btn">
              SIGN IN TO BACK UP →
            </Link>
          </div>
        )}

        {mergeMessage && (
          <div className="merge-message" role="status" aria-live="polite">
            {mergeMessage}
          </div>
        )}

        {/* Skeleton Loading State */}
        {!loaded && (
          <div className="cards-grid" aria-busy="true" aria-label="Loading saved spaces">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                aria-hidden="true"
                className="animate-pulse rounded-lg border border-surface-variant bg-surface/60 p-5"
                style={{ minHeight: "220px" }}
              >
                <div className="h-4 w-28 rounded bg-gold-accent/20 mb-3" />
                <div className="h-6 w-3/4 rounded bg-surface-variant/60 mb-3" />
                <div className="h-3 w-1/2 rounded bg-surface-variant/40 mb-5" />
                <div className="h-10 w-full rounded bg-surface-variant/30" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="empty-state">
            <div className="empty-heading">
              {activeMode === "cloud"
                ? "No cloud-synced spaces yet."
                : "Your board is empty."}
            </div>
            <div className="empty-subtitle">
              {activeMode === "cloud" && offlineItems.length > 0
                ? `You have ${offlineItems.length} saved spaces on this device. Sync them to access your board anywhere.`
                : "Dreaming is free. Browse spaces across the Philippines and save your inspirations."}
            </div>
            {activeMode === "cloud" && offlineItems.length > 0 ? (
              <button className="empty-cta" onClick={handleSync} disabled={merging}>
                {merging ? "Syncing…" : `Sync ${offlineItems.length} Spaces to Cloud →`}
              </button>
            ) : (
              <Link href="/property" className="empty-cta">
                Start Exploring Spaces →
              </Link>
            )}
          </div>
        )}

        {/* Populated Board Content */}
        {loaded && displayItems.length > 0 && (
          <div className="board-content">
            {grouped.map((group) => (
              <section key={group.type} className="reaction-group" aria-labelledby={`group-${group.type}`}>
                <h2 id={`group-${group.type}`} className="group-label">
                  {group.type} ({group.items.length})
                </h2>
                <div className="cards-grid">
                  {group.items.map((item, index) => {
                    const key = item.property_id || item.timestamp;
                    return (
                      <article
                        key={key}
                        className={`board-card stagger-enter ${fadingOut.has(key) ? "fading" : ""}`}
                        style={{ '--i': index }}
                      >
                        {/* Top Header Row */}
                        <div className="card-top-row">
                          <div className="card-breadcrumbs">
                            {item.is_broker ? (
                              <span className="advisor-badge">ADVISOR</span>
                            ) : (
                              <>
                                {item.category && <span className="cat-text">{item.category}</span>}
                                {item.category && item.city && <span className="meta-dot">·</span>}
                                {item.city && <span className="city-text">{item.city}</span>}
                              </>
                            )}
                            {item.removed && (
                              <span className="removed-marker">Listing removed</span>
                            )}
                          </div>

                          <div className="card-badge-cluster">
                            {isLoggedIn && (
                              <span
                                className={`sync-tag ${item.is_cloud ? "sync-cloud" : "sync-device"}`}
                                title={item.is_cloud ? "Saved to your Cloud Account" : "Saved on this device only"}
                              >
                                {item.is_cloud ? "● CLOUD" : "○ DEVICE"}
                              </span>
                            )}
                            <ReactionBadge reactionType={item.reaction_type || "Save"} />
                          </div>
                        </div>

                        {/* Card Title */}
                        <div className="card-title-area">
                          {item.removed ? (
                            <h3 className="card-title removed">{item.property_title}</h3>
                          ) : item.is_broker ? (
                            <Link
                              href={`/brokers/${encodeURIComponent(item.property_id)}`}
                              className="card-title-link"
                            >
                              <h3 className="card-title">{item.property_title}</h3>
                            </Link>
                          ) : (
                            <Link
                              href={`/property/${encodeURIComponent(item.property_id)}`}
                              className="card-title-link"
                            >
                              <h3 className="card-title">{item.property_title}</h3>
                            </Link>
                          )}
                        </div>

                        {/* Card Actions Row */}
                        <div className="card-actions-row">
                          {!item.removed && (
                            <Link
                              href={
                                item.is_broker
                                  ? `/brokers/${encodeURIComponent(item.property_id)}`
                                  : `/property/${encodeURIComponent(item.property_id)}`
                              }
                              className="card-explore-btn"
                            >
                              VIEW DOSSIER <span className="arrow-glyph" aria-hidden="true">→</span>
                            </Link>
                          )}
                          <button
                            className="card-remove-btn"
                            onClick={() => removeItem(item)}
                            aria-label={`Remove ${item.property_title} from board`}
                          >
                            <span className="remove-icon" aria-hidden="true">✕</span>
                            <span className="remove-text">REMOVE</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="board-footer">
              <span className="footer-status-pill">
                <span className={`status-dot ${isLoggedIn ? "online" : "offline"}`} />
                {isLoggedIn
                  ? `Cloud Sync Active · Backed up as ${userEmail || "Authenticated Member"}`
                  : "Offline Mode · Stored securely on this browser"}
              </span>
            </div>
          </div>
        )}
      </main>
      <Footer />

      <style jsx>{`
        .page-wrapper {
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text-primary);
          position: relative;
        }

        .wishlist-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 120px 24px calc(110px + env(safe-area-inset-bottom, 0px));
          position: relative;
          z-index: 1;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .layer-label {
          display: block;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
          margin-bottom: 12px;
        }

        .header-headline-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: normal;
          color: var(--text-primary);
          margin: 0;
          letter-spacing: -0.02em;
        }

        .status-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 6px 14px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.6);
        }

        .status-dot.offline {
          background: var(--text-muted);
          box-shadow: none;
        }

        /* Mode Selector */
        .board-mode-nav {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 32px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }

        .board-mode-nav::-webkit-scrollbar {
          display: none;
        }

        .mode-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          min-height: 44px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-secondary);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          touch-action: manipulation;
        }

        .mode-tab:hover {
          border-color: rgba(var(--accent-rgb), 0.4);
          color: var(--text-primary);
        }

        .mode-tab.active {
          background: rgba(var(--accent-rgb), 0.12);
          border-color: var(--accent);
          color: var(--accent-bright);
          font-weight: 600;
        }

        .mode-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .mode-dot.cloud {
          background: var(--accent-bright);
          box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.5);
        }

        .mode-dot.local {
          background: var(--text-muted);
        }

        .mode-dot.cloud-locked {
          background: var(--accent);
        }

        .sign-in-tab {
          text-decoration: none;
          color: var(--accent);
          border-color: rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--accent-rgb), 0.04);
        }

        .sign-in-tab:hover {
          background: rgba(var(--accent-rgb), 0.12);
          border-color: var(--accent);
          color: var(--accent-bright);
        }

        /* Account sync prompt */
        .sync-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          background: linear-gradient(165deg, rgba(var(--accent-rgb), 0.10), var(--surface2));
          border: 1px solid rgba(var(--accent-rgb), 0.35);
          border-radius: 6px;
          padding: 18px 24px;
          margin-bottom: 28px;
        }

        .sync-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sync-label {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
        }

        .sync-text {
          margin: 0;
          font-size: 14px;
          color: var(--text-primary);
        }

        .sync-text strong {
          color: var(--accent-bright);
        }

        .sync-btn {
          background: var(--accent-bright);
          color: var(--on-accent);
          border: none;
          padding: 12px 22px;
          min-height: 44px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-family: var(--font-mono), monospace;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.1s;
          touch-action: manipulation;
        }

        .sync-btn:hover:not(:disabled) {
          background: var(--accent);
        }

        .sync-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .sync-btn:disabled {
          opacity: 0.6;
          cursor: default;
        }

        /* Guest Info Banner */
        .guest-info-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-left: 3px solid var(--accent);
          border-radius: 4px;
          padding: 16px 20px;
          margin-bottom: 28px;
        }

        .guest-info-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .guest-info-title {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
        }

        .guest-info-desc {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.4;
          max-width: 540px;
        }

        .guest-sign-in-btn {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          min-height: 44px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent-bright);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          border-radius: 4px;
          white-space: nowrap;
          transition: background 0.2s, color 0.2s;
          touch-action: manipulation;
        }

        .guest-sign-in-btn:hover {
          background: var(--accent);
          color: var(--on-accent);
        }

        .merge-message {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-primary);
          margin-bottom: 24px;
          padding: 14px 18px;
          border-left: 3px solid var(--accent);
          background: rgba(var(--accent-rgb), 0.08);
          border-radius: 0 4px 4px 0;
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 16px;
        }

        .empty-heading {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--text-primary);
        }

        .empty-subtitle {
          font-family: var(--font-body), sans-serif;
          font-size: 15px;
          color: var(--text-secondary);
          margin-top: 10px;
          max-width: 480px;
          line-height: 1.5;
        }

        .empty-cta {
          display: inline-flex;
          align-items: center;
          margin-top: 28px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent-bright);
          padding: 12px 28px;
          min-height: 44px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-decoration: none;
          font-family: var(--font-mono), monospace;
          border-radius: 4px;
          transition: background 0.2s, color 0.2s;
          cursor: pointer;
          touch-action: manipulation;
        }

        .empty-cta:hover {
          background: var(--accent);
          color: var(--on-accent);
        }

        .empty-cta:active {
          transform: scale(0.96);
        }

        /* Board content */
        .board-content {
          display: flex;
          flex-direction: column;
          gap: 36px;
        }

        .reaction-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .group-label {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
          margin: 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border-solid);
        }

        .cards-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .board-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 20px;
          transition: opacity 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          position: relative;
          box-sizing: border-box;
        }

        .board-card:hover {
          transform: translateY(-2px);
          border-color: rgba(var(--accent-rgb), 0.35);
          box-shadow: var(--shadow-md), var(--shadow-glow-soft);
        }

        .board-card.fading {
          opacity: 0;
          transform: translateX(-20px);
        }

        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .card-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }

        .card-badge-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sync-tag {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 3px;
          border: 1px solid var(--border);
          color: var(--text-muted);
          line-height: 1;
        }

        .sync-tag.sync-cloud {
          border-color: rgba(var(--accent-rgb), 0.35);
          color: var(--accent);
          background: rgba(var(--accent-rgb), 0.06);
        }

        .advisor-badge {
          background: rgba(var(--accent-rgb), 0.1);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          color: var(--accent);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2px 6px;
          border-radius: 2px;
          font-family: var(--font-mono), monospace;
        }

        .meta-dot {
          color: var(--text-muted);
        }

        .card-title-area {
          min-width: 0;
        }

        .card-title-link {
          text-decoration: none;
        }

        .card-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
          transition: color 0.2s ease;
        }

        .card-title-link:hover .card-title {
          color: var(--accent-bright);
        }

        .card-title.removed {
          color: var(--text-muted);
        }

        .removed-marker {
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 2px 8px;
          display: inline-block;
        }

        .card-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-top: 1px solid var(--border-solid);
          padding-top: 14px;
          margin-top: 4px;
        }

        .card-explore-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 8px 18px;
          background: transparent;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          color: var(--accent-bright);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-decoration: none;
          border-radius: 4px;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
          touch-action: manipulation;
        }

        .card-explore-btn:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--on-accent);
        }

        .arrow-glyph {
          font-size: 14px;
          transition: transform 0.2s ease;
        }

        .card-explore-btn:hover .arrow-glyph {
          transform: translateX(3px);
        }

        .card-remove-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 44px;
          padding: 8px 14px;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          touch-action: manipulation;
        }

        .card-remove-btn:hover {
          border-color: var(--red, #e05252);
          color: var(--red, #e05252);
        }

        .remove-icon {
          font-size: 12px;
        }

        .board-footer {
          display: flex;
          justify-content: center;
          padding-top: 24px;
          border-top: 1px solid var(--border-solid);
        }

        .footer-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono), monospace;
          font-size: 12px;
          color: var(--text-secondary);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .wishlist-main {
            padding: 80px 16px calc(110px + env(safe-area-inset-bottom, 0px));
          }
          .page-title {
            font-size: 32px;
          }
          .header-headline-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .sync-banner,
          .guest-info-banner {
            flex-direction: column;
            align-items: stretch;
          }
          .sync-btn,
          .guest-sign-in-btn {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .card-actions-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .card-explore-btn,
          .card-remove-btn {
            flex: 1;
            justify-content: center;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .wishlist-main {
            padding: 68px 12px calc(110px + env(safe-area-inset-bottom, 0px));
          }
          .page-title {
            font-size: 26px;
          }
          .board-card {
            padding: 14px;
            gap: 12px;
          }
          .card-title {
            font-size: 18px;
          }
        }

        /* WHITE LENS (locked 2026-09-23, WHITE_LENS_SPEC): scoped styles */
        :global(body.light-mode) .mode-tab {
          background: var(--surface);
          border-color: var(--border-solid);
          color: var(--text-secondary);
        }
        :global(body.light-mode) .mode-tab.active {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: var(--accent);
        }
        :global(body.light-mode) .sync-banner {
          background: var(--surface2);
          border-color: var(--accent-muted);
        }
        :global(body.light-mode) .sync-btn {
          background: var(--accent-fill);
          color: var(--on-accent);
        }
        :global(body.light-mode) .guest-info-banner {
          background: var(--surface2);
          border-color: var(--border-solid);
        }
        :global(body.light-mode) .guest-sign-in-btn {
          border-color: var(--accent-muted);
          color: var(--accent);
        }
        :global(body.light-mode) .merge-message {
          color: var(--text-secondary);
          border-color: var(--accent-muted);
        }
        :global(body.light-mode) .board-card {
          background: var(--surface2);
          border-color: var(--border-solid);
        }
        :global(body.light-mode) .empty-heading,
        :global(body.light-mode) .card-title {
          color: var(--text-primary);
        }
        :global(body.light-mode) .empty-subtitle,
        :global(body.light-mode) .card-breadcrumbs,
        :global(body.light-mode) .loading-state,
        :global(body.light-mode) .footer-status-pill,
        :global(body.light-mode) .status-pill-badge {
          color: var(--text-secondary);
        }
        :global(body.light-mode) .board-footer {
          border-color: var(--border-solid);
        }
        :global(body.light-mode) .advisor-badge {
          color: var(--accent);
          border-color: var(--accent-muted);
          background: var(--accent-dim);
        }
        :global(body.light-mode) .card-explore-btn {
          border-color: var(--accent-muted);
          color: var(--accent);
        }
        :global(body.light-mode) .card-remove-btn {
          color: var(--text-secondary);
          border-color: var(--border-solid);
        }
        @media (hover: hover) and (pointer: fine) {
          :global(body.light-mode) .card-title:hover {
            color: var(--accent);
          }
          :global(body.light-mode) .card-explore-btn:hover {
            background: var(--accent-fill);
            color: var(--on-accent);
          }
          :global(body.light-mode) .card-remove-btn:hover {
            color: var(--red);
            border-color: var(--red);
          }
        }
        :global(body.light-mode) .empty-cta {
          color: var(--accent);
          border-color: var(--accent-muted);
        }
        @media (hover: hover) and (pointer: fine) {
          :global(body.light-mode) .empty-cta:hover {
            background: var(--accent-fill);
            color: var(--on-accent);
          }
        }
      `}</style>
    </div>
  );
}
