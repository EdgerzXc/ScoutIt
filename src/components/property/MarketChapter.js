"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, MapPin } from "lucide-react";
import { canSee, getCurrentTier } from "@/lib/entitlements";
import { articlesForProperty, areaIntelHref } from "@/lib/propertyArticles";

// Styles live in app/property/[id]/property-detail.css, NOT in a styled-jsx
// block here. styled-jsx scopes its generated class to JSX written inside the
// SAME component function, and this file has four of them — the rules would
// have applied to the outer component and silently missed every article row.
// The stylesheet is already imported by both flows and the unit page, so one
// definition reaches all three.

// ═══════════════════════════════════════════════════════════════
// THE MARKET — chapter shared by BOTH property flows
//
// WHY THIS IS A COMPONENT AND NOT A COPIED PANEL
// ----------------------------------------------
// This markup previously lived inline in ResidentialFlow only, and the
// entitlement it depends on (`canMarketIntel`) was declared in CommercialFlow,
// computed on mount, and then never read — so five of the seven space
// categories (commercial, STR, hospitality, restaurants, venues) rendered no
// market intelligence at all, not even a locked teaser. Cap rate and
// transaction history are commercial metrics first; the one flow that had them
// was the one that needed them least.
//
// The page shell already carries this exact lesson in a comment beside
// ClaimThisProperty: with two flow components and seven category aliases,
// anything built into one flow "silently does not exist" on the other. So this
// is one component, imported twice, and adding a category cannot lose it.
//
// TWO LAYERS
// ----------
//   FREE  — briefings about this property and its market. Everyone.
//   PAID  — the numbers. Cluster tier and above.
//
// The free layer is not decoration. Before it existed, a visitor who opened
// this chapter without a subscription got a locked box and a button to buy —
// a dead end wearing a chapter's clothes. The reading is what makes the
// numbers worth wanting.
// ═══════════════════════════════════════════════════════════════

const ACCENT = "#E8AE3C";

/** The gated rows. Order is deliberate: yield first, provenance last. */
export const MARKET_FIELDS = [
  "Cap Rate (Area Benchmark)",
  "Transaction History",
  "Appreciation Projection",
  "Price History",
  "Competitive Density",
  "Market Position Index",
];

function ArticleRow({ article }) {
  return (
    <Link
      href={`/intel/${article.slug}`}
      className="market-article"
      style={{ textDecoration: "none" }}
    >
      <div className="market-article__meta">
        {/* The label is the honesty control. An area briefing must never be
            presented as an investigation into this specific building — see
            Standing Rule 22 and lib/propertyArticles.js. */}
        <span
          className="market-article__tag"
          style={{
            color: article.isAboutThisProperty ? ACCENT : "var(--text-muted)",
            borderColor: article.isAboutThisProperty
              ? "rgba(232, 174, 60, 0.35)"
              : "var(--border)",
          }}
        >
          {article.isAboutThisProperty ? "About this property" : "This market"}
        </span>
        {article.date && (
          <span className="market-article__date">{article.date}</span>
        )}
        {(article.location || article.district || article.city) && (
          <span className="market-article__place">
            <MapPin size={11} aria-hidden="true" />
            {article.location || article.district || article.city}
          </span>
        )}
      </div>
      <span className="market-article__title">{article.title}</span>
      {article.excerpt && (
        <span className="market-article__excerpt">{article.excerpt}</span>
      )}
    </Link>
  );
}

function ArticlesBlock({ property, articles }) {
  const matched = articlesForProperty(articles, property);
  const railRef = useRef(null);

  function moveRail(direction) {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.82,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }

  // The empty state is the COMMON case, not the edge case: there are currently
  // four published briefings against eight properties, and the property link
  // field does not exist in Airtable yet. A section that silently renders
  // nothing makes a page look broken, so this says what it is and offers the
  // one thing that always works — the area's own intel feed.
  if (matched.length === 0) {
    return (
      <div className="market-articles market-articles--empty">
        <p className="market-articles__empty-copy">
          No briefings cover this{property?.city ? ` part of ${property.city}` : " area"} yet.
        </p>
        <Link href={areaIntelHref(property)} className="market-articles__empty-cta">
          Browse market intel →
        </Link>
      </div>
    );
  }

  return (
    <section className="market-articles-shell" aria-label="Local market briefings">
      <div className="market-articles__header">
        <div>
          <span className="market-articles__label">Spatial intelligence</span>
          <span className="market-articles__count">
            {matched.length} location-matched {matched.length === 1 ? "briefing" : "briefings"}
          </span>
        </div>
        {matched.length > 1 && (
          <div className="market-articles__controls" aria-label="Briefing navigation">
            <button type="button" onClick={() => moveRail(-1)} aria-label="Previous briefings">
              <ChevronLeft size={17} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => moveRail(1)} aria-label="Next briefings">
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="market-articles" ref={railRef}>
        {matched.map((article) => (
          <ArticleRow key={article.slug} article={article} />
        ))}
      </div>
    </section>
  );
}

function MarketNumbers({ deepIntel, unlocked }) {
  if (unlocked) {
    return (
      <div className="market-numbers">
        {MARKET_FIELDS.map((label, i) => {
          const raw = deepIntel ? deepIntel[label] : undefined;
          const value =
            raw != null && String(raw).trim() !== "" ? raw : null;
          return (
            <div
              key={label}
              className="market-numbers__row"
              style={{
                borderBottom:
                  i < MARKET_FIELDS.length - 1 ? "1px solid #262626" : "none",
              }}
            >
              <span className="market-numbers__label">{label}</span>
              {/* Standing Rule 3: never render a number you cannot source. */}
              {value !== null ? (
                <span className="market-numbers__value">{value}</span>
              ) : (
                <span className="market-numbers__missing">Not recorded</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="market-numbers market-numbers--locked">
      <div aria-hidden="true">
        {MARKET_FIELDS.map((label, i) => (
          <div
            key={label}
            className="market-numbers__row"
            style={{
              borderBottom:
                i < MARKET_FIELDS.length - 1 ? "1px solid #262626" : "none",
            }}
          >
            <span className="market-numbers__label">{label}</span>
            <span className="market-numbers__missing">— — —</span>
          </div>
        ))}
      </div>
      <div className="market-numbers__lock">
        <div className="market-numbers__lock-title">
          <Lock size={15} strokeWidth={1.5} style={{ color: ACCENT, flexShrink: 0 }} />
          <span>Market Intelligence · Cluster Tier</span>
        </div>
        <a href="/pricing/seeker" className="market-numbers__lock-cta">
          Unlock with Cluster →
        </a>
      </div>
    </div>
  );
}

/**
 * @param {object}  property   Normalised property record
 * @param {Array}   articles   Intel briefings from the CMS bundle
 * @param {object}  deepIntel  Gated values, keyed by MARKET_FIELDS label
 * @param {string}  chapterNumber Display number, differs per flow
 * @param {string}  chapterLabel  Display name, owner-configurable
 * @param {string}  subtitle
 */
export default function MarketChapter({
  property,
  articles = [],
  deepIntel = null,
  chapterNumber = "06",
  chapterLabel = "The Market",
  subtitle = "",
}) {
  // SSR-safe: the tier is read from the browser, so the server render must
  // assume locked. Rendering unlocked-then-locked would flash real values at
  // someone who has not paid for them.
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    setUnlocked(canSee("marketIntel", getCurrentTier()));
  }, []);

  return (
    <>
      <div style={{ marginBottom: "32px" }}>
        <div className="market-chapter__eyebrow">
          {chapterNumber} — {chapterLabel}
        </div>
        {subtitle && <div className="market-chapter__subtitle">{subtitle}</div>}
        <div style={{ height: "1px", background: "var(--border)" }} />
      </div>

      <p className="market-chapter__lede">
        What is being written about this space and the market around it — and,
        for Verified Scouts, the numbers underneath.
      </p>

      <ArticlesBlock property={property} articles={articles} />

      <div className="market-chapter__divider" />

      <MarketNumbers deepIntel={deepIntel} unlocked={unlocked} />

    </>
  );
}
