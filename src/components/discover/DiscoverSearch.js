"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X, MapPin, ArrowRight, SlidersHorizontal } from "lucide-react";

import SpatialIntelMap from "@/components/intel/SpatialIntelMap";
import { distanceKm, formatDistance } from "@/lib/geo";
import {
  ARTICLES,
  EVENT_TYPES,
  SPACE_TYPES,
  getTerritories,
} from "@/data/mock/mockArticles";
import "./discover-search.css";

/*
 * DISCOVER — the search engine.
 *
 * This is where someone goes when they know what they are hunting for.
 * Intel is browsed; Discover is queried. That division is the whole reason
 * the text search was removed from Intel.
 *
 * Articles are the PRIMARY result. Properties appear below as a secondary
 * band, because Layer 03 Metropolis is already the property directory and
 * two competing directories is how this codebase ended up with two article
 * datasets disagreeing about the same slug.
 *
 * Everything here is derived from the article list, so the page grows with
 * the archive without edits: territories, counts and map geometry are all
 * computed, never hardcoded.
 */

const RADIUS_MIN = 1;
const RADIUS_MAX = 80;
const DEFAULT_RADIUS = 12;

/** Live CMS articles may predate the two-axis schema. Normalise defensively. */
function normalizeArticle(raw) {
  if (!raw || !raw.slug || !raw.title) return null;
  return {
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt || raw.snippet || "",
    category: raw.category || null,
    event: raw.event || null,
    city: raw.city || raw.region || null,
    region: raw.region || null,
    lat: typeof raw.lat === "number" ? raw.lat : null,
    lng: typeof raw.lng === "number" ? raw.lng : null,
    date: raw.date || "",
    status: raw.status || null,
  };
}

export default function DiscoverSearch() {
  const [query, setQuery] = useState("");
  const [event, setEvent] = useState(null);
  const [space, setSpace] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [radar, setRadar] = useState(null);
  const [liveArticles, setLiveArticles] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  /* Merge the tagged local set with anything live, de-duped by slug.
     Live rows that predate the `event`/coords fields still appear in text
     and city search; they simply cannot match an event or radius filter. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        const rows = (data.intel || []).map(normalizeArticle).filter(Boolean);
        if (!cancelled) setLiveArticles(rows);
      } catch {
        // Offline or no credentials: the tagged local set stands alone.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const articles = useMemo(() => {
    const bySlug = new Map();
    for (const a of ARTICLES) bySlug.set(a.slug, a);
    for (const a of liveArticles) if (!bySlug.has(a.slug)) bySlug.set(a.slug, a);
    return [...bySlug.values()];
  }, [liveArticles]);

  const territories = useMemo(() => getTerritories(), []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles
      .map((art) => {
        const d =
          radar && art.lat != null && art.lng != null
            ? distanceKm(radar.lat, radar.lng, art.lat, art.lng)
            : null;
        return { ...art, distanceKm: d };
      })
      .filter((art) => {
        if (event && art.event !== event) return false;
        if (space && art.category !== space) return false;
        if (selectedCity && art.city !== selectedCity) return false;
        if (radar) {
          if (art.distanceKm == null) return false;
          if (art.distanceKm > radar.radiusKm) return false;
        }
        if (q) {
          const hay = [art.title, art.excerpt, art.city, art.category, art.event]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Nearest first when a radar is down, otherwise leave source order.
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
  }, [articles, query, event, space, selectedCity, radar]);

  const activeCount =
    (query.trim() ? 1 : 0) +
    (event ? 1 : 0) +
    (space ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (radar ? 1 : 0);

  const clearAll = () => {
    setQuery("");
    setEvent(null);
    setSpace(null);
    setSelectedCity(null);
    setRadar(null);
  };

  return (
    <section className="dsc" aria-labelledby="dsc-title">
      <header className="dsc-head">
        <p className="dsc-kicker">
          <SlidersHorizontal size={12} aria-hidden="true" />
          Search
        </p>
        <h1 id="dsc-title" className="dsc-title">
          Find what changed, and&nbsp;
          <span className="dsc-title-accent">where</span>.
        </h1>
      </header>

      {/* ── The query bar ── */}
      <div className="dsc-bar">
        <div className="dsc-input-wrap">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            className="dsc-input"
            placeholder="Search headlines, places, topics"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search intel"
          />
          {query ? (
            <button
              type="button"
              className="dsc-input-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="dsc-filter-toggle"
          aria-expanded={showFilters}
          onClick={() => setShowFilters((v) => !v)}
        >
          Filters
          {activeCount ? <span className="dsc-badge">{activeCount}</span> : null}
        </button>
      </div>

      {/* ── Refinements. Deliberately collapsed by default: filters are
             refinements, never a gate you must pass through. ── */}
      {showFilters ? (
        <div className="dsc-filters">
          <fieldset className="dsc-group">
            <legend>What changed</legend>
            <div className="dsc-chips">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`dsc-chip${event === t ? " is-on" : ""}`}
                  aria-pressed={event === t}
                  onClick={() => setEvent(event === t ? null : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="dsc-group">
            <legend>Kind of space</legend>
            <div className="dsc-chips">
              {SPACE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`dsc-chip${space === t ? " is-on" : ""}`}
                  aria-pressed={space === t}
                  onClick={() => setSpace(space === t ? null : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="dsc-group">
            <legend>Territory</legend>
            <div className="dsc-chips">
              {territories.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`dsc-chip${selectedCity === t ? " is-on" : ""}`}
                  aria-pressed={selectedCity === t}
                  onClick={() => setSelectedCity(selectedCity === t ? null : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      ) : null}

      {/* ── Map + results, side by side on desktop ── */}
      <div className="dsc-body">
        <div className="dsc-map">
          <SpatialIntelMap
            articles={results}
            mode="search"
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            radiusKm={radar ? radar.radiusKm : null}
            center={radar}
            onRadarChange={(next) =>
              setRadar((r) => ({
                radiusKm: r ? r.radiusKm : DEFAULT_RADIUS,
                ...next,
              }))
            }
            height={430}
          />

          <div className="dsc-radar">
            {radar ? (
              <>
                <label className="dsc-radar-label" htmlFor="dsc-radius">
                  Within
                  <output className="dsc-radar-value">{radar.radiusKm} km</output>
                </label>
                <input
                  id="dsc-radius"
                  type="range"
                  min={RADIUS_MIN}
                  max={RADIUS_MAX}
                  step="1"
                  value={radar.radiusKm}
                  onChange={(e) =>
                    setRadar((r) => ({ ...r, radiusKm: Number(e.target.value) }))
                  }
                  className="dsc-radar-range"
                />
                <button
                  type="button"
                  className="dsc-radar-clear"
                  onClick={() => setRadar(null)}
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                type="button"
                className="dsc-radar-start"
                onClick={() =>
                  setRadar({ lat: 14.5547, lng: 121.0244, radiusKm: DEFAULT_RADIUS })
                }
              >
                Search within a radius
              </button>
            )}
          </div>
        </div>

        <div className="dsc-results">
          <div className="dsc-results-head">
            <h2 className="dsc-results-title">
              {results.length} {results.length === 1 ? "result" : "results"}
            </h2>
            {activeCount ? (
              <button type="button" className="dsc-clear-all" onClick={clearAll}>
                Clear all
              </button>
            ) : null}
          </div>

          {results.length === 0 ? (
            /* An empty result is a normal outcome, not a failure. Say what
               was searched and offer the one action that always works. */
            <div className="dsc-empty">
              <p className="dsc-empty-lead">Nothing matches that yet.</p>
              <p className="dsc-empty-sub">
                The archive is still small. Try widening the radius or clearing
                a filter.
              </p>
              {activeCount ? (
                <button type="button" className="dsc-empty-action" onClick={clearAll}>
                  Clear all filters
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="dsc-list">
              {results.map((art, i) => (
                <li key={art.slug} className="dsc-row" style={{ "--i": i }}>
                  <Link href={`/intel/${art.slug}`} className="dsc-link">
                    <span className="dsc-index" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span className="dsc-row-body">
                      {art.status ? (
                        <span className="dsc-status">{art.status}</span>
                      ) : null}
                      <span className="dsc-row-title">{art.title}</span>
                      <span className="dsc-row-meta">
                        <MapPin size={11} aria-hidden="true" />
                        {art.city || "Philippines"}
                        {art.event ? (
                          <>
                            <span className="dsc-sep" aria-hidden="true">
                              /
                            </span>
                            <span className="dsc-sr-only">, </span>
                            {art.event}
                          </>
                        ) : null}
                        {art.distanceKm != null ? (
                          <>
                            <span className="dsc-sep" aria-hidden="true">
                              /
                            </span>
                            <span className="dsc-sr-only">, </span>
                            {art.distanceKm < 1
                              ? `${Math.round(art.distanceKm * 1000)} m`
                              : `${art.distanceKm.toFixed(1)} km`}
                          </>
                        ) : null}
                      </span>
                    </span>

                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
