"use client";

import LayerNav from "@/components/descent/LayerNav";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, Check, Lock, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BackgroundMetropolis from "@/components/descent/BackgroundMetropolis";
import LayerHeader from "@/components/descent/LayerHeader";
import LayerTransition from "@/components/descent/LayerTransition";
import {
  METROPOLIS_CATEGORIES,
  buildCategoryPreviews,
  getCategoryCounts,
  filterCategoryPreviews,
} from "@/lib/categoryPreviews";

const INITIAL_PREVIEWS = {
  Residential: [],
  Commercial: [],
  STR: [],
  Hospitality: [],
  Restaurants: [],
  Venues: [],
};

export default function MetropolisLayer() {
  const [category, setCategory] = useState("Residential");
  const [search, setSearch] = useState("");
  const [previews, setPreviews] = useState(INITIAL_PREVIEWS);
  const [loading, setLoading] = useState(true);
  const [offMarketData, setOffMarketData] = useState({
    properties: [],
    isUniverseSeeker: false,
    userTier: "starry",
    loaded: false,
  });
  const [offMarketLoading, setOffMarketLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/cms")
      .then((res) => {
        if (!res.ok) throw new Error("CMS catalog offline");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data?.properties)) {
          setPreviews(buildCategoryPreviews(data.properties));
        }
      })
      .catch(() => {
        // Preserves honest empty fallback state on offline or failure
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (category !== "Off-Market" || offMarketData.loaded) return;
    let active = true;
    setOffMarketLoading(true);
    async function loadOffMarket() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {};
        const res = await fetch("/api/off-market", { headers });
        if (!res.ok) {
          if (active) {
            setOffMarketData({
              properties: [],
              isUniverseSeeker: false,
              userTier: "starry",
              loaded: true,
            });
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setOffMarketData({
            properties: Array.isArray(data?.properties) ? data.properties : [],
            isUniverseSeeker: Boolean(data?.isUniverseSeeker),
            userTier: data?.userTier || "starry",
            loaded: true,
          });
        }
      } catch (err) {
        if (active) {
          setOffMarketData({
            properties: [],
            isUniverseSeeker: false,
            userTier: "starry",
            loaded: true,
          });
        }
      } finally {
        if (active) setOffMarketLoading(false);
      }
    }
    loadOffMarket();
    return () => {
      active = false;
    };
  }, [category, offMarketData.loaded]);

  const properties = filterCategoryPreviews(previews, category, search);
  const { counts } = getCategoryCounts(previews);

  const isOffMarketCategory = category === "Off-Market";
  const browseLabel = isOffMarketCategory
    ? "Off-Market Vault"
    : category === "Venues"
      ? "Venues/Events"
      : category;

  const filteredOffMarket = (offMarketData.properties || []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.type && p.type.toLowerCase().includes(q)) ||
      (p.spaceCategory && p.spaceCategory.toLowerCase().includes(q))
    );
  });

  return (
    <main
      className="min-h-screen bg-[#0d0d0d] text-white selection:bg-gold-accent selection:text-black overflow-hidden font-sans"
      style={{ paddingTop: "52px" }}
    >
      <LayerNav
        prev={{ href: "/layer/stratosphere", label: "Stratosphere" }}
        next={{ href: "/layer/crust", label: "Crust" }}
      />
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundMetropolis />
      </div>

      <div className="layer-pane metropolis-surface relative z-10">
        <LayerHeader 
          layerNum="03" 
          layerName="Metropolis" 
          title="Explore by Category" 
          description="Homes, offices, venues, hospitality."
          missionText="The property directory, building by building."
          missionTipId="metropolisMission"
          ctaText="Browse All Properties →"
          ctaHref="/property?_cb=1"
        />

        <div className="descent-split">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="descent-sidebar" style={{ justifyContent: "space-between" }}>
          <div>

            <nav className="descent-nav" aria-label="Layer categories">
              {METROPOLIS_CATEGORIES.map(c => {
                const count = counts[c] || 0;
                return (
                  <button
                    key={c}
                    className={`descent-cat${category === c ? " on" : ""}`}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => { setCategory(c); setSearch(""); }}
                  >
                    <span>{c === "Venues" ? "Venues/Events" : c}</span>
                    {count > 0 && <span className="descent-cat-count ml-1.5 opacity-60 font-normal">({count})</span>}
                  </button>
                );
              })}
              <div className="metro-nav-divider my-2 border-t border-[rgba(232,174,60,0.18)]" />
              <button
                className={`descent-cat offmarket-nav-btn${isOffMarketCategory ? " on" : ""}`}
                type="button"
                aria-pressed={isOffMarketCategory}
                onClick={() => { setCategory("Off-Market"); setSearch(""); }}
              >
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-[var(--accent)] shrink-0" aria-hidden="true" />
                  <span>Off-Market</span>
                </span>
                {offMarketData.properties.length > 0 && (
                  <span className="descent-cat-count ml-1.5 opacity-60 font-normal">({offMarketData.properties.length})</span>
                )}
              </button>
            </nav>

          </div>
          <Link
            href={isOffMarketCategory ? "/off-market" : `/property?type=${category}&_cb=1`}
            className="prominent-action-link metro-browse"
          >
            Browse {browseLabel} →
          </Link>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <div className="descent-content">
          <div className="metro-content-head">
            <h2 className="metro-content-title">
              {isOffMarketCategory
                ? offMarketData.isUniverseSeeker
                  ? "Off-Market Vault"
                  : offMarketData.properties.some((p) => p.isOwner)
                    ? "Your Private Cloud"
                    : "Off-Market Vault"
                : `${browseLabel} Spaces`}
            </h2>
            <p className="metro-content-sub">
              {isOffMarketCategory
                ? offMarketData.isUniverseSeeker
                  ? "Universe Exclusive · Confidential whisper inventory & quiet offers"
                  : offMarketData.properties.some((p) => p.isOwner)
                    ? "Owner Cloud View · Your unlisted properties stored in the cloud"
                    : "Confidential trophy inventory reserved for Universe Principals"
                : "Category preview"}
            </p>
          </div>

          {/* Search */}
          <label className="metro-search-shell">
            <Search size={18} aria-hidden="true" />
            <span className="metro-search-label">
              {isOffMarketCategory ? "Search off-market inventory" : "Search this category"}
            </span>
            <input
              className="metro-search"
              aria-label={isOffMarketCategory ? "Search off-market inventory" : `Search ${browseLabel} spaces`}
              placeholder={isOffMarketCategory ? "Title, location, or asset type" : "Name, city, or style"}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>

          {/* Off-Market / Property grid */}
          {isOffMarketCategory ? (
            offMarketLoading ? (
              <div className="metro-grid" aria-busy="true">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="metro-card animate-pulse">
                    <div className="metro-photo bg-white/5" />
                    <div className="metro-body space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : offMarketData.isUniverseSeeker ? (
              filteredOffMarket.length === 0 ? (
                <div className="metro-empty" role="status">
                  <span className="metro-empty-icon"><Lock size={22} aria-hidden="true" /></span>
                  <span className="metro-empty-kicker">Vault Signal</span>
                  <h3>{search ? "No matching off-market spaces" : "No off-market listings available"}</h3>
                  <p>
                    {search
                      ? "Try another search term or clear the filter."
                      : "The private whisper pipeline updates as owners deposit assets."}
                  </p>
                </div>
              ) : (
                <div className="metro-grid">
                  {filteredOffMarket.map((p) => (
                    <Link href={`/off-market?slug=${p.slug}`} key={p.id} className="metro-card">
                      <div
                        className="metro-photo"
                        style={{ backgroundImage: `url(${p.image || "/images/property-fallback.webp"})` }}
                      />
                      <div className="metro-body">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono tracking-wider uppercase rounded border border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-bright)] mb-1">
                          Confidential · Universe
                        </span>
                        <div className="metro-name">{p.title}</div>
                        <div className="metro-tag-row">
                          <span className="metro-tag-label">Type</span>
                          <span className="metro-tag-value">{p.type || p.spaceCategory || "Trophy Space"}</span>
                        </div>
                        <div className="metro-tag-row">
                          <span className="metro-tag-label">Location</span>
                          <span className="metro-tag-value">{p.location || "Confidential"}</span>
                        </div>
                        <div className="metro-tag-row">
                          <span className="metro-tag-label">Whisper</span>
                          <span className="metro-tag-value text-[var(--accent-bright)] font-mono">
                            {p.whisperPrice ? `₱${Number(p.whisperPrice).toLocaleString()}` : "Price Upon Request"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : offMarketData.properties.some((p) => p.isOwner) ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[var(--accent-muted)] bg-[rgba(232,174,60,0.06)] backdrop-blur">
                  <p className="text-xs text-[var(--accent-bright)] font-mono uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[var(--accent-bright)] shrink-0" aria-hidden="true" />
                    <span>Private Cloud Storage (Owner View)</span>
                  </p>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    You are viewing your own off-market assets stored in the cloud. As a property owner, your private storage is unlimited and free. To browse the global confidential pipeline, subscribe to Universe Seeker.
                  </p>
                </div>
                <div className="metro-grid">
                  {filteredOffMarket.map((p) => (
                    <Link href={`/dashboard`} key={p.id} className="metro-card">
                      <div
                        className="metro-photo"
                        style={{ backgroundImage: `url(${p.image || "/images/property-fallback.webp"})` }}
                      />
                      <div className="metro-body">
                        <span className="inline-block px-2 py-0.5 text-xs font-mono tracking-wider uppercase rounded border border-white/20 bg-white/5 text-white/80 mb-1">
                          Owned · Cloud Vault
                        </span>
                        <div className="metro-name">{p.title}</div>
                        <div className="metro-tag-row">
                          <span className="metro-tag-label">Status</span>
                          <span className="metro-tag-value">
                            {p.quietlyOpenToOffers ? "Quietly Open to Offers" : "Private Storage (Hidden)"}
                          </span>
                        </div>
                        <div className="metro-tag-row">
                          <span className="metro-tag-label">Location</span>
                          <span className="metro-tag-value">{p.location || "Philippines"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="metro-vault-gate p-8 md:p-12 rounded-2xl border border-[rgba(232,174,60,0.35)] bg-gradient-to-b from-[#161616] to-[#0d0d0d] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl text-center max-w-2xl mx-auto my-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 flex items-center justify-center text-xl text-[var(--accent-bright)]">
                  <Lock size={22} className="text-[var(--accent-bright)]" aria-hidden="true" />
                </div>
                <span className="inline-block px-3 py-1 mb-3 text-xs font-mono tracking-widest uppercase rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-bright)]">
                  Universe Seeker Exclusive · ₱2,499/mo
                </span>
                <h3 className="text-2xl md:text-3xl font-display text-white mb-3 tracking-wide">
                  The Confidential Off-Market Vault
                </h3>
                <p className="text-sm text-text-secondary max-w-lg mx-auto mb-6 leading-relaxed">
                  Access unlisted trophy estates, private commercial portfolios, and discreet whisper acquisitions withheld from public channels. Direct quiet offers with verified owners under strict discretion.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left max-w-md mx-auto text-xs text-text-secondary">
                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <p className="text-[var(--accent-bright)] font-mono font-medium mb-1 flex items-center gap-1">
                      <Check size={12} aria-hidden="true" />
                      <span>Whisper Deals</span>
                    </p>
                    <p>Pre-market trophy assets before public discovery.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <p className="text-[var(--accent-bright)] font-mono font-medium mb-1 flex items-center gap-1">
                      <Check size={12} aria-hidden="true" />
                      <span>Quiet Offers</span>
                    </p>
                    <p>Discreet counterparty handshake via Connects.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <p className="text-[var(--accent-bright)] font-mono font-medium mb-1 flex items-center gap-1">
                      <Check size={12} aria-hidden="true" />
                      <span>Deed Provenance</span>
                    </p>
                    <p>Verified titleholder sovereignty and safe harbor.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/pricing"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-bright)] text-black font-semibold text-xs tracking-wider uppercase transition-transform hover:scale-[1.02] shadow-[0_0_25px_rgba(232,174,60,0.35)]"
                  >
                    Unlock Universe Access →
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[var(--accent-muted)] text-[var(--accent-bright)] text-xs font-mono uppercase tracking-wider hover:bg-[rgba(232,174,60,0.08)]"
                  >
                    Owner Sign In
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="metro-grid">
              {properties.length === 0 ? (
                <div className="metro-empty" role="status">
                  <span className="metro-empty-icon"><Building2 size={22} aria-hidden="true" /></span>
                  <span className="metro-empty-kicker">Directory signal</span>
                  <h3>{search ? "No matching spaces" : `No ${browseLabel.toLowerCase()} previews yet`}</h3>
                  <p>
                    {search
                      ? "Try another name, city, or style—or open the complete directory."
                      : "This layer stays honest when a preview is unavailable. The complete directory may have more live spaces."}
                  </p>
                  <Link href={`/property?type=${category}&_cb=1`} className="metro-empty-action">
                    Browse {browseLabel} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                properties.map(p => (
                  <Link href={`/property/${p.slug || p.id}`} key={p.id} className="metro-card">
                    <div
                      className="metro-photo"
                      style={{ backgroundImage: `url(${p.image || "/images/property-fallback.webp"})` }}
                    />
                    <div className="metro-body">
                      <div className="metro-name">{p.title}</div>
                      {p.tags.map((tag, i) => {
                        const [label, ...rest] = tag.split(":");
                        const value = rest.join(":").trim();
                        return (
                          <div className="metro-tag-row" key={i}>
                            <span className="metro-tag-label">{label.trim()}</span>
                            <span className="metro-tag-value">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
          
          </div>
        </div>
        <LayerTransition 
          nextNum="04" 
          nextName="Crust" 
          nextHref="/layer/crust" 
          teaser="Go street-level. Meet the professionals who move spaces." 
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Metropolis foreground only. The fixed BackgroundMetropolis canvas is intentionally untouched. */
        .metropolis-surface,
        .metropolis-surface * {
          box-sizing: border-box;
        }

        .metropolis-surface {
          max-width: 1540px;
          padding: 28px 28px 64px;
          gap: 18px;
        }

        .metropolis-surface .layer-global-header {
          width: 100%;
          padding: clamp(24px, 3vw, 38px);
          border: 1px solid rgba(232, 174, 60, 0.28);
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(13, 13, 13, 0.94), rgba(18, 18, 18, 0.78));
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(22px) saturate(115%);
          overflow: hidden;
        }

        .metropolis-surface .layer-global-header::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(247, 198, 78, 0.65), transparent);
          pointer-events: none;
        }

        .metropolis-surface .layer-header-top {
          margin-bottom: 22px;
          text-align: left;
        }

        .metropolis-surface .layer-kicker {
          padding: 8px 12px;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 999px;
          background: rgba(232, 174, 60, 0.08);
          color: var(--accent-bright);
          line-height: 1;
        }

        .metropolis-surface .layer-header-split {
          align-items: stretch;
          gap: clamp(28px, 5vw, 72px);
        }

        .metropolis-surface .layer-header-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          max-width: 760px;
        }

        .metropolis-surface .layer-title {
          margin: 0 0 12px;
          color: var(--text-primary);
          font-size: clamp(36px, 4.5vw, 62px);
          font-weight: 500;
          letter-spacing: -0.035em;
          text-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
        }

        .metropolis-surface .layer-desc {
          max-width: 660px;
          color: var(--text-secondary);
          font-size: clamp(15px, 1.25vw, 18px);
          line-height: 1.65;
        }

        .metropolis-surface .layer-primary-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          margin-top: 24px;
          padding: 12px 20px;
          border-color: var(--accent-bright);
          border-radius: 10px;
          background: var(--accent-bright);
          color: var(--on-accent);
          font-weight: 700;
          box-shadow: 0 10px 30px rgba(232, 174, 60, 0.2);
        }

        .metropolis-surface .layer-primary-cta:hover {
          background: var(--accent-bright);
          border-color: var(--accent-bright);
          color: var(--on-accent);
          transform: translateY(-1px);
          box-shadow: 0 14px 36px rgba(247, 198, 78, 0.28);
        }

        .metropolis-surface .layer-header-right {
          flex: 0 1 390px;
          display: flex;
        }

        .metropolis-surface .layer-mission-block {
          width: 100%;
          padding: 22px;
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.035);
        }

        .metropolis-surface .layer-mission-label {
          margin-bottom: 12px;
          color: var(--accent-bright);
        }

        .metropolis-surface .layer-mission-text {
          margin: 0;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.7;
        }

        .metropolis-surface .descent-split {
          min-height: 520px;
          grid-template-columns: 270px minmax(0, 1fr);
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 22px;
          background: rgba(13, 13, 13, 0.84);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.38);
          backdrop-filter: blur(22px) saturate(110%);
          overflow: hidden;
        }

        .metropolis-surface .descent-sidebar {
          position: static;
          height: auto;
          min-height: 100%;
          padding: 28px 22px;
          border-right-color: rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.025);
        }

        .metropolis-surface .descent-nav {
          gap: 7px;
        }

        .metropolis-surface .descent-cat {
          min-height: 46px;
          padding: 12px 14px;
          border: 1px solid transparent;
          border-radius: 10px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metropolis-surface .descent-cat:hover,
        .metropolis-surface .descent-cat.on {
          padding-left: 14px;
          border: 1px solid rgba(232, 174, 60, 0.32);
          background: rgba(232, 174, 60, 0.09);
          color: var(--accent-bright);
        }

        .metropolis-surface .descent-cat.on {
          box-shadow: inset 3px 0 0 var(--accent-bright), 0 8px 24px rgba(0, 0, 0, 0.16);
          text-shadow: none;
        }

        .metro-browse {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          width: 100%;
          max-width: 100%;
          margin-top: 24px;
          padding: 11px 14px !important;
          box-sizing: border-box;
          white-space: nowrap;
          font-size: 12px !important;
        }

        .metropolis-surface .descent-content {
          min-height: 520px;
          padding: clamp(28px, 4vw, 48px);
        }

        .metro-content-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.09);
        }

        .metro-content-title {
          margin: 0 0 6px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 500;
          letter-spacing: -0.02em;
        }

        .metro-content-sub {
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .metro-search-shell {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-areas: "icon label" "icon input";
          align-items: center;
          column-gap: 12px;
          width: 100%;
          max-width: 620px;
          min-height: 62px;
          margin-bottom: 24px;
          padding: 10px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.045);
          color: var(--accent-bright);
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .metro-search-shell:focus-within {
          border-color: rgba(247, 198, 78, 0.58);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(232, 174, 60, 0.08);
        }

        .metro-search-shell > svg { grid-area: icon; }

        .metro-search-label {
          grid-area: label;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          line-height: 1.2;
          text-transform: uppercase;
        }

        .metropolis-surface .metro-search-shell input.metro-search {
          grid-area: input;
          width: 100%;
          min-width: 0;
          min-height: 26px;
          height: 26px;
          padding: 2px 0 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 15px;
        }

        .metropolis-surface .metro-search-shell input.metro-search::placeholder { color: var(--text-secondary); }

        .metro-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }

        .metro-card {
          display: block;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 14px;
          background: rgba(18, 18, 18, 0.92);
          color: inherit;
          text-decoration: none;
          transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metro-card:hover {
          border-color: rgba(247, 198, 78, 0.48);
          transform: translateY(-3px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.3);
        }

        .metro-photo {
          width: 100%;
          height: 160px;
          background-color: rgba(255, 255, 255, 0.04);
          background-position: center;
          background-size: cover;
        }

        .metro-body { padding: 16px; }

        .metro-name {
          margin-bottom: 12px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 17px;
          line-height: 1.35;
        }

        .metro-tag-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }

        .metro-tag-row:last-child { border-bottom: 0; }

        .metro-tag-label,
        .metro-tag-value {
          font-size: 12px;
        }

        .metro-tag-label {
          color: var(--accent);
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .metro-tag-value {
          color: var(--text-secondary);
          font-family: var(--font-body);
          text-align: right;
        }

        .metro-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-height: 230px;
          padding: clamp(24px, 4vw, 42px);
          border: 1px dashed rgba(232, 174, 60, 0.3);
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(232, 174, 60, 0.06), rgba(255, 255, 255, 0.02));
        }

        .metro-empty-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin-bottom: 20px;
          border: 1px solid rgba(232, 174, 60, 0.34);
          border-radius: 12px;
          background: rgba(232, 174, 60, 0.1);
          color: var(--accent-bright);
        }

        .metro-empty-kicker {
          margin-bottom: 8px;
          color: var(--accent-bright);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .metro-empty h4 {
          margin: 0 0 8px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: clamp(20px, 2.3vw, 28px);
          font-weight: 500;
        }

        .metro-empty p {
          max-width: 650px;
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
          line-height: 1.65;
        }

        .metro-empty-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          margin-top: 22px;
          padding: 10px 14px;
          border: 1px solid rgba(232, 174, 60, 0.4);
          border-radius: 9px;
          color: var(--accent-bright);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .metro-empty-action:hover {
          border-color: var(--accent-bright);
          background: rgba(232, 174, 60, 0.1);
        }

        .metro-hint {
          margin: 0;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 800px) {
          .metropolis-surface {
            padding: 16px 16px 48px;
            gap: 14px;
          }

          .metropolis-surface .layer-global-header {
            padding: 24px 20px;
            border-radius: 18px;
          }

          .metropolis-surface .layer-header-split {
            gap: 22px;
          }

          .metropolis-surface .layer-header-right {
            flex: none;
            width: 100%;
          }

          .metropolis-surface .layer-mission-block {
            padding: 18px;
            border-top: 1px solid rgba(232, 174, 60, 0.25);
          }

          .metropolis-surface .descent-split {
            grid-template-columns: minmax(0, 1fr);
            min-height: 0;
            border-radius: 18px;
          }

          .metropolis-surface .descent-sidebar {
            min-height: 0;
            padding: 18px;
            border-right: 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .metropolis-surface .descent-nav {
            margin: 0 -18px;
            padding: 2px 18px 10px;
          }

          .metropolis-surface .descent-cat,
          .metropolis-surface .descent-cat:hover,
          .metropolis-surface .descent-cat.on {
            min-height: 44px;
            padding: 11px 15px;
            border-left-width: 1px;
            border-radius: 999px;
          }

          .metropolis-surface .descent-cat.on {
            box-shadow: none;
          }

          .metro-browse {
            width: auto;
            align-self: flex-start;
            margin-top: 10px;
          }

          .metropolis-surface .descent-content {
            min-height: 0;
            padding: 24px 18px;
          }

          .metro-card:hover { transform: none; }
        }

        @media (max-width: 560px) {
          .metropolis-surface { padding: 10px 10px 40px; }
          .metropolis-surface .layer-global-header { padding: 22px 16px; }
          .metropolis-surface .layer-title { font-size: 34px; }
          .metropolis-surface .layer-primary-cta { width: 100%; }
          .metro-content-head { align-items: flex-start; }
          .metro-search { font-size: 16px; }
          .metro-grid { grid-template-columns: minmax(0, 1fr); }
          .metro-empty { min-height: 0; padding: 24px 20px; }
          .metro-browse { width: 100%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .metro-card,
          .metropolis-surface .layer-primary-cta { transition: none; }
        }
      `}} />
    </main>
  );
}
