"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const MOCK_OSINT_FLASH_FEED = [
  {
    id: "osint-1",
    timestamp: "2 mins ago",
    type: "PSE EDGE FILING",
    headline: "Megaworld allocates ₱350M for BGC Commercial Core Expansion",
    city: "BGC, Taguig",
    slug: "bgc-spatial-movement",
    sourceUrl: "https://edge.pse.com.ph",
  },
  {
    id: "osint-2",
    timestamp: "14 mins ago",
    type: "DENR ECC CLEARANCE",
    headline: "Siargao General Luna Eco-Resort Tourism Infrastructure Approved",
    city: "Siargao, Surigao del Norte",
    slug: "surf-front-land-rush",
    sourceUrl: "https://emb.gov.ph",
  },
  {
    id: "osint-3",
    timestamp: "42 mins ago",
    type: "MAKATI LGU GAZETTE",
    headline: "Poblacion Culinary District Density Bonus Approved for Adaptive Reuse",
    city: "Poblacion, Makati",
    slug: "poblacion-food-architecture",
    sourceUrl: "https://makati.gov.ph",
  },
  {
    id: "osint-4",
    timestamp: "1 hr ago",
    type: "CAAP AVIATION NOTICE",
    headline: "El Nido Airport Expansion Plan Opens Public Consultation",
    city: "El Nido, Palawan",
    slug: "off-grid-island-living",
    sourceUrl: "https://caap.gov.ph",
  },
  {
    id: "osint-5",
    timestamp: "2 hrs ago",
    type: "PEZA BULLETIN",
    headline: "Makati CBD Grade-A Commercial Towers Achieve 94.8% Occupancy Peak",
    city: "Makati CBD, Metro Manila",
    slug: "green-office-demand",
    sourceUrl: "https://peza.gov.ph",
  },
];

export default function OSINTFlashTicker({ customFeed = null, onSelectArticle = () => {} }) {
  const [feedItems, setFeedItems] = useState(customFeed || MOCK_OSINT_FLASH_FEED);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    async function loadLiveFeed() {
      if (customFeed && customFeed.length > 0) {
        setFeedItems(customFeed);
        return;
      }

      try {
        const res = await fetch("/api/admin/osint");
        if (!alive || !res.ok) return;
        const data = await res.json();
        if (!alive || !data.success || !data.briefings) return;

        if (data.briefings.length > 0) {
          const formatted = data.briefings.map((b, i) => ({
            id: b.id || `live-osint-${i}`,
            timestamp: b.published_at ? "Just Now" : "Live",
            type: b.category || "OSINT SIGNAL",
            headline: b.title,
            city: b.city || "Metro Manila",
            slug: b.slug,
            sourceUrl: b.source_url || "",
          }));
          setFeedItems([...formatted, ...MOCK_OSINT_FLASH_FEED]);
        }
      } catch (err) {
        // Fallback to mock feed silently
      }
    }

    loadLiveFeed();
    return () => {
      alive = false;
    };
  }, [customFeed]);

  useEffect(() => {
    if (feedItems.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % feedItems.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [feedItems]);

  if (feedItems.length === 0) return null;
  const activeItem = feedItems[currentIndex] || feedItems[0];

  return (
    <div className="osint-flash-ticker-bar bg-black/80 border border-gold-accent/40 rounded-xs px-4 py-2.5 max-w-[1400px] mx-auto my-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-[0_0_20px_rgba(232,174,60,0.15)] overflow-hidden select-none">
      {/* Live Badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gold-accent"></span>
        </span>
        <span className="font-mono text-[10px] font-bold text-gold-accent uppercase tracking-[0.15em] bg-gold-accent/10 px-2 py-0.5 rounded-xs border border-gold-accent/30">
          LIVE OSINT FEED
        </span>
      </div>

      {/* Ticker Headline Content */}
      <div className="flex-1 overflow-hidden flex items-center gap-3 font-mono text-xs">
        <span className="text-text-muted text-[10px] uppercase shrink-0">
          [{activeItem.timestamp}]
        </span>
        <span className="text-gold-accent font-semibold text-[10px] uppercase border border-gold-accent/30 px-1.5 py-0.2 rounded-xs bg-gold-accent/5 shrink-0 hidden sm:inline-block">
          {activeItem.type}
        </span>
        <Link
          href={`/intel/${activeItem.slug}`}
          className="text-text-primary hover:text-gold-accent transition-colors truncate no-underline font-serif text-sm font-medium"
        >
          {activeItem.headline}
        </Link>
        <span className="text-text-secondary text-[10px] uppercase shrink-0 hidden md:inline-block border border-surface-variant px-1.5 py-0.2 rounded-xs">
          📍 {activeItem.city}
        </span>
      </div>

      {/* Controls & Counter */}
      <div className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-text-muted">
        <span>
          {currentIndex + 1}/{feedItems.length}
        </span>
        <button
          onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : feedItems.length - 1))}
          className="px-2 py-0.5 border border-surface-variant hover:border-gold-accent text-text-secondary hover:text-gold-accent rounded-xs transition-colors cursor-pointer"
          title="Previous item"
        >
          ‹
        </button>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % feedItems.length)}
          className="px-2 py-0.5 border border-surface-variant hover:border-gold-accent text-text-secondary hover:text-gold-accent rounded-xs transition-colors cursor-pointer"
          title="Next item"
        >
          ›
        </button>
      </div>
    </div>
  );
}
