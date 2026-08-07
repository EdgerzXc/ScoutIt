"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────
// 🔴 THE FABRICATED FEED THAT USED TO LIVE HERE — REMOVED 2026-08-06 (§59)
//
// This component shipped with a hardcoded `MOCK_OSINT_FLASH_FEED` of five
// items, and rendered them on the PUBLIC /intel page as live intelligence:
//
//   "PSE EDGE FILING · 2 mins ago — Megaworld allocates ₱350M for BGC
//    Commercial Core Expansion"        sourceUrl: https://edge.pse.com.ph
//
// Every part of that is invented. Megaworld is a real listed company
// (PSE: MEG), the ₱350M figure was never disclosed, and the item linked to the
// genuine PSE disclosure portal — which lends the fabrication the credibility
// of the exchange itself. The other four did the same to DENR (an ECC approval
// that does not exist), the Makati LGU (an invented ordinance), CAAP, and PEZA
// (an invented 94.8% occupancy statistic). Each carried a fake relative
// timestamp so the whole thing read as a live wire.
//
// Two things made it worse than a placeholder:
//   1. The mock items were APPENDED to real ones
//      (`[...formatted, ...MOCK_OSINT_FLASH_FEED]`), so once real briefings
//      existed, invented filings would sit beside them, indistinguishable.
//   2. `intel_briefings` has 0 rows, so 100% of what visitors actually saw was
//      fabricated.
//
// Standing Rule 3 says never render a number you cannot source. This went
// further: it attributed specific figures to named real institutions that never
// said them. For a Philippine property platform whose entire pitch is verified
// intelligence, that is the one mistake with no cheap recovery — and inventing
// a material disclosure about a listed issuer is a securities problem, not just
// a trust problem.
//
// The same five fabrications were also hardcoded in
// `/api/cron/osint-scraper` as `PUBLIC_FEEDS`, ready to be INSERTED into
// `intel_sources` as though they had been scraped. Neutralised there too.
//
// The replacement is the honest blank: render nothing until there is real
// intel. An empty ticker costs a little atmosphere. This cost the truth.
// ─────────────────────────────────────────────────────────────────────────

export default function OSINTFlashTicker({ customFeed = null, onSelectArticle = () => {} }) {
  const [feedItems, setFeedItems] = useState(customFeed || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    async function loadLiveFeed() {
      if (customFeed && customFeed.length > 0) {
        setFeedItems(customFeed);
        return;
      }

      // ⚠️ This used to fetch `/api/admin/osint` — an ADMIN endpoint — from a
      // public page. That is why the endpoint had no authentication: gating it
      // would have broken this ticker, so it was left open, and with it an
      // unauthenticated write path into the public article system (§59).
      //
      // `/api/cms` is the public content path. It already merges published
      // `intel_briefings` with Airtable intel and, unlike the admin route, it
      // does NOT expose unpublished drafts or raw `intel_sources`. The ticker
      // only ever needed published, public fields.
      try {
        const res = await fetch("/api/cms");
        if (!alive || !res.ok) return;
        const data = await res.json();
        const intel = Array.isArray(data?.intel) ? data.intel : [];
        if (!alive || intel.length === 0) return;

        setFeedItems(
          intel
            .filter((b) => b.title && b.slug)
            .map((b, i) => ({
              id: b.id || `live-osint-${i}`,
              // The real publication date, not a manufactured "2 mins ago".
              timestamp: b.date || "",
              type: b.intelType || b.category || "OSINT SIGNAL",
              headline: b.title,
              city: b.city || "",
              slug: b.slug,
              sourceUrl: b.sourceUrl || "",
            }))
        );
      } catch {
        // Stay empty. There is no mock fallback by design — see the note above.
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
