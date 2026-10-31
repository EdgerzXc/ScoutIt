"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Bookmark, Building2, Compass, FileText, Layers, Radio, Search, TrendingUp } from "lucide-react";
import SignalDossierCard from "./SignalDossierCard";
import SignalComposer from "./SignalComposer";

const StratosphereTerminal = dynamic(() => import("./StratosphereTerminal"), {
  ssr: false,
  loading: () => (
    <div className="sw-empty" aria-busy="true">
      <p>Initializing Spatial Radar &amp; Signal Dossier…</p>
    </div>
  ),
});

export const ARTICLES_PAGE_SIZE = 12;
import { COMMUNITY_SIGNALS, pipelineArticlesToSignals } from "@/lib/communitySignalsAdapter";
import { loadPublicCatalog } from "@/lib/cms/publicCatalog";
import {
  BUILDING_STAGES,
  TREND_STAGES,
  getArticleClassification,
  matchesJourneyStage,
  validJourneyStage,
} from "@/lib/layerTwoJourney";
import { mergeStratosphereArticles } from "@/lib/stratosphereArticles";
import { getSession } from "@/lib/authClient";
import InfoTip from "@/components/ui/InfoTip";
import StratosphereAtmosphere from "./StratosphereAtmosphere";
import "./stratosphere-workspace.css";

const ALL_CURATED_STAGES = [
  { key: "all", label: "All Intelligence", hint: "Combined pipeline and trend coverage" },
  { key: "all-buildings", label: "All Buildings", hint: "All active development projects" },
  { key: "all-trends", label: "All Trends", hint: "All macro and spatial dynamics" },
  { key: "building", label: "Under Construction", hint: "Active structural build-outs" },
  { key: "demand", label: "Market Demand", hint: "Absorption and residential surges" },
  { key: "zoning", label: "Policy & Zoning", hint: "Mandates and green standards" },
];

async function fetchCommunitySignals() {
  const { data: { session } } = await getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  const response = await fetch("/api/community/signals?limit=60", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  return response.json();
}

async function fetchMySignals() {
  const { data: { session } } = await getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) return { ok: false, error: "Sign in to view your signals." };
  const response = await fetch("/api/community/signals?mine=1", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return response.json();
}

async function fetchSavedSignals() {
  const { data: { session } } = await getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  if (!token) return { ok: false, error: "Sign in to view your saved signals." };
  const response = await fetch("/api/community/signals?saved=1", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return response.json();
}

export default function StratosphereWorkspace({
  initialView = "articles",
  initialStage = "all",
  initialQuery = "",
  initialSignal = null,
} = {}) {
  const router = useRouter();
  const [liveArticles, setLiveArticles] = useState([]);
  const [view, setView] = useState(initialView);
  const [stage, setStage] = useState(validJourneyStage(initialStage));
  const [query, setQuery] = useState(initialQuery);
  const [returnSignal, setReturnSignal] = useState(initialSignal);
  const [liveSignals, setLiveSignals] = useState([]);
  const [mySignals, setMySignals] = useState([]);
  const [mySignalsLoading, setMySignalsLoading] = useState(false);
  const [mySignalsError, setMySignalsError] = useState(null);
  const [savedSignals, setSavedSignals] = useState([]);
  const [savedSignalsLoading, setSavedSignalsLoading] = useState(false);
  const [savedSignalsError, setSavedSignalsError] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [visibleArticleCount, setVisibleArticleCount] = useState(ARTICLES_PAGE_SIZE);
  const signalsFetchedRef = useRef(false);

  const loadMySignals = useCallback(() => {
    setMySignalsLoading(true);
    setMySignalsError(null);
    fetchMySignals()
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) {
          setMySignals(json.signals);
        } else {
          setMySignalsError(json?.error || "Could not load your signals.");
        }
      })
      .catch(() => setMySignalsError("Could not load your signals."))
      .finally(() => setMySignalsLoading(false));
  }, []);

  const loadSavedSignals = useCallback(() => {
    setSavedSignalsLoading(true);
    setSavedSignalsError(null);
    fetchSavedSignals()
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) {
          setSavedSignals(json.signals);
        } else {
          setSavedSignalsError(json?.error || "Could not load your saved signals.");
        }
      })
      .catch(() => setSavedSignalsError("Could not load your saved signals."))
      .finally(() => setSavedSignalsLoading(false));
  }, []);

  useEffect(() => {
    const handleSavedChanged = (e) => {
      if (e.detail && typeof e.detail.isSaved === "boolean") {
        if (!e.detail.isSaved) {
          setSavedSignals((prev) => prev.filter((s) => s.id !== e.detail.signalId));
        } else if (e.detail.signal) {
          setSavedSignals((prev) => {
            if (prev.some((s) => s.id === e.detail.signalId)) return prev;
            return [{ ...e.detail.signal, isSaved: true }, ...prev];
          });
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scoutit:signal-saved-changed", handleSavedChanged);
      return () => window.removeEventListener("scoutit:signal-saved-changed", handleSavedChanged);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "radar") setView("radar");
    else if (params.get("view") === "articles") setView("articles");
    else if (params.get("view") === "my-signals") {
      setView("my-signals");
      loadMySignals();
    } else if (params.get("view") === "saved-signals") {
      // Saved follow-ups belong in the dashboard workplace (when logged in) or Your Board (when offline)
      getSession().then(({ data }) => {
        if (data?.session?.user) {
          router.replace("/dashboard");
        } else {
          router.replace("/wishlist");
        }
      }).catch(() => {
        router.replace("/wishlist");
      });
      setView("saved-signals");
    }
    if (params.get("stage")) setStage(validJourneyStage(params.get("stage")));
    if (params.has("q")) setQuery(params.get("q") || "");
    if (params.has("signal")) setReturnSignal(params.get("signal"));
  }, [loadMySignals, loadSavedSignals, router]);

  // Pipeline 1: Load Articles catalog on mount
  useEffect(() => {
    let alive = true;
    loadPublicCatalog()
      .then((data) => {
        if (alive) setLiveArticles(data?.intel || []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Pipeline 2: Lazy-load Community Signals only when Radar view is active
  useEffect(() => {
    if (view !== "radar") return;
    let alive = true;
    fetchCommunitySignals()
      .then((json) => {
        if (alive && json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [view]);

  const refreshLiveSignals = useCallback(() => {
    signalsFetchedRef.current = true;
    fetchCommunitySignals()
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
  }, []);

  const handleSignalClosed = useCallback(
    (id, outcome) => {
      if (outcome === "refreshed") {
        refreshLiveSignals();
        return;
      }
      setLiveSignals((current) => current.filter((signal) => signal.id !== id));
    },
    [refreshLiveSignals]
  );

  const articles = useMemo(() => mergeStratosphereArticles(liveArticles), [liveArticles]);
  const radarSignals = useMemo(
    () => [...liveSignals, ...pipelineArticlesToSignals(articles), ...COMMUNITY_SIGNALS],
    [liveSignals, articles]
  );

  const filteredArticles = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return articles.filter((article) => {
      if (!matchesJourneyStage(article, stage)) return false;
      if (!words.length) return true;
      const corpus = [
        article.title,
        article.city,
        article.category,
        article.excerpt,
        article.intelType,
      ]
        .join(" ")
        .toLowerCase();
      return words.every((word) => corpus.includes(word));
    });
  }, [articles, stage, query]);

  const visibleArticles = useMemo(
    () => filteredArticles.slice(0, visibleArticleCount),
    [filteredArticles, visibleArticleCount]
  );

  const updateUrl = (name, value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  };

  const chooseStage = (next) => {
    setStage(next);
    setVisibleArticleCount(ARTICLES_PAGE_SIZE);
    updateUrl("stage", next === "all" ? "" : next);
  };

  const chooseView = (next) => {
    setView(next);
    updateUrl("view", next === "articles" ? "" : next);
    if (next === "my-signals") {
      loadMySignals();
    }
  };

  const search = (value) => {
    setQuery(value);
    setVisibleArticleCount(ARTICLES_PAGE_SIZE);
    updateUrl("q", value);
  };

  // Derive which top-level track is active
  const activeTrack = useMemo(() => {
    if (stage === "buildings" || BUILDING_STAGES.some((s) => s.key === stage)) return "buildings";
    if (stage === "trends" || TREND_STAGES.some((s) => s.key === stage)) return "trends";
    return "all";
  }, [stage]);

  const buildingCount = useMemo(
    () => articles.filter((a) => matchesJourneyStage(a, "buildings")).length,
    [articles]
  );
  const trendCount = useMemo(
    () => articles.filter((a) => matchesJourneyStage(a, "trends")).length,
    [articles]
  );

  const articleHref = (article) => {
    const params = new URLSearchParams({
      fromStratosphere: "1",
      view: "articles",
      stage,
      signal: article.slug,
    });
    if (query) params.set("q", query);
    return `/intel/${encodeURIComponent(article.slug)}?${params}`;
  };

  return (
    <main data-scoutit-guide="stratosphere-entry" className={`sw-page${view === "radar" ? " sw-page--radar" : ""}`}>
      <StratosphereAtmosphere />
      <div className="sw-top-bar">
        <Link href="/dashboard" className="sw-back-dashboard-btn">
          <ArrowLeft size={14} aria-hidden="true" /> Back to Dashboard
        </Link>
      </div>
      <header className="sw-intro">
        <span className="sw-kicker">INSIDE LAYER 02 · STRATOSPHERE</span>
        <h1>Explore what is <span className="sw-headline-accent">changing</span>.</h1>
        <p>
          Building updates, market trends, and spatial signals across{" "}
          <span className="sw-tip-anchor">
            Metro Manila.
            <InfoTip tipId="stratosphereWorkspace" label="About Stratosphere" />
          </span>
        </p>
      </header>

      <div className="sw-view-row">
        <div className="sw-view-switch" role="group" aria-label="Explore Stratosphere">
          <button
            type="button"
            aria-pressed={view === "articles"}
            className={view === "articles" ? "is-active" : ""}
            onClick={() => chooseView("articles")}
          >
            <FileText size={15} aria-hidden="true" /> All Articles
          </button>
          <button
            type="button"
            data-scoutit-guide="spatial-signal-radar"
            aria-pressed={view === "radar"}
            className={view === "radar" ? "is-active" : ""}
            onClick={() => chooseView("radar")}
          >
            <Compass size={15} aria-hidden="true" /> Radar &amp; Community
          </button>
          <button
            type="button"
            aria-pressed={view === "my-signals"}
            className={view === "my-signals" ? "is-active" : ""}
            onClick={() => chooseView("my-signals")}
          >
            <Radio size={15} aria-hidden="true" /> My Signals
          </button>
        </div>
        <button type="button" data-scoutit-guide="signal-composer-trigger" className="sw-post-btn" onClick={() => setComposerOpen(true)}>
          <span aria-hidden="true">+</span> POST A SIGNAL
        </button>
      </div>

      <SignalComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => {
          refreshLiveSignals();
          loadMySignals();
          chooseView("my-signals");
        }}
      />

      {view === "saved-signals" ? (
        <section className="sw-my-signals" aria-label="Saved Signals Routing">
          <div className="sw-my-signals-header">
            <div>
              <span className="sw-kicker">SAVED SIGNALS · FOLLOW-UP LIST</span>
              <h2>Saved Follow-ups Location</h2>
              <p>Saved follow-ups are located in your Dashboard Workspace when signed in, or on Your Board when offline.</p>
            </div>
            <button type="button" className="sw-post-btn" onClick={() => chooseView("radar")}>
              <Compass size={14} aria-hidden="true" style={{ marginRight: 6 }} /> EXPLORE ON RADAR
            </button>
          </div>
          <div className="sw-empty">
            <Bookmark size={32} style={{ color: "var(--accent)", marginBottom: 12 }} />
            <p className="font-working-title text-base mb-2">Saved signals are accessible in your personal workspace.</p>
            <p className="text-xs text-text-secondary max-w-md mb-6 leading-relaxed">
              If you are signed in, track your opportunities and requests in your Dashboard. If you are browsing as a guest, your saved follow-ups are preserved on Your Board.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                className="font-label-caps text-[12px] tracking-widest uppercase text-background bg-gold-accent hover:opacity-90 px-5 py-2.5 rounded transition font-bold"
              >
                Dashboard Workspace →
              </Link>
              <Link
                href="/wishlist"
                className="font-label-caps text-[12px] tracking-widest uppercase text-gold-accent border border-gold-accent/40 hover:bg-gold-accent/10 px-5 py-2.5 rounded transition font-bold"
              >
                Your Board (Offline) →
              </Link>
            </div>
          </div>
        </section>
      ) : view === "my-signals" ? (
        <section className="sw-my-signals" aria-label="My Signals">
          <div className="sw-my-signals-header">
            <div>
              <span className="sw-kicker">MY SIGNALS &amp; LIFECYCLE</span>
              <h2>Your community posts</h2>
              <p>Track pending responses, answers under review, and receipts for your signals.</p>
            </div>
            <button type="button" className="sw-post-btn" onClick={() => setComposerOpen(true)}>
              <span aria-hidden="true">+</span> POST A SIGNAL
            </button>
          </div>
          {mySignalsLoading ? (
            <p className="sw-loading-text">Loading your signals…</p>
          ) : mySignalsError ? (
            <div className="sw-empty">
              <p>{mySignalsError}</p>
              <Link href="/onboarding" className="sw-auth-link">
                Sign in to your account
              </Link>
            </div>
          ) : mySignals.length === 0 ? (
            <div className="sw-empty">
              <p>You have not posted any signals yet.</p>
              <button type="button" onClick={() => setComposerOpen(true)}>
                Post your first signal
              </button>
            </div>
          ) : (
            <div className="sw-my-signals-grid">
              {mySignals.map((signal) => (
                <SignalDossierCard
                  key={signal.id}
                  signal={signal}
                  onClosed={() => {
                    loadMySignals();
                    refreshLiveSignals();
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : view === "articles" ? (
        <>
          <section className="sw-track-deck" aria-label="Intelligence streams and stages">
            <div className="sw-track-nav" role="tablist" aria-label="Filter intelligence track">
              <button
                type="button"
                role="tab"
                aria-selected={activeTrack === "all"}
                className={`sw-track-tab ${activeTrack === "all" ? "is-active" : ""}`}
                onClick={() => chooseStage("all")}
              >
                <Layers size={14} aria-hidden="true" />
                <span className="sw-track-tab-label">All Intelligence</span>
                <span className="sw-track-tab-label-short">All</span>
                <span className="sw-track-badge">{articles.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTrack === "buildings"}
                className={`sw-track-tab ${activeTrack === "buildings" ? "is-active" : ""}`}
                onClick={() => {
                  if (activeTrack !== "buildings") chooseStage("all-buildings");
                }}
              >
                <Building2 size={14} aria-hidden="true" />
                <span className="sw-track-tab-label">Building Developments</span>
                <span className="sw-track-tab-label-short">Buildings</span>
                <span className="sw-track-badge">{buildingCount}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTrack === "trends"}
                className={`sw-track-tab ${activeTrack === "trends" ? "is-active" : ""}`}
                onClick={() => {
                  if (activeTrack !== "trends") chooseStage("all-trends");
                }}
              >
                <TrendingUp size={14} aria-hidden="true" />
                <span className="sw-track-tab-label">Market Trends &amp; Policy</span>
                <span className="sw-track-tab-label-short">Market Trends</span>
                <span className="sw-track-badge">{trendCount}</span>
              </button>
            </div>

            <div className="sw-stage">
              <div className="sw-stage-heading">
                {activeTrack === "buildings" ? (
                  <h2>
                    <span className="sw-tip-anchor">
                      Development Pipeline Stages
                      <InfoTip tipId="pipelineStages" label="About development pipeline stages" />
                    </span>
                  </h2>
                ) : activeTrack === "trends" ? (
                  <h2>
                    <span className="sw-tip-anchor">
                      Market Trend Subcategories
                      <InfoTip tipId="marketTrends" label="About market trend subcategories" />
                    </span>
                  </h2>
                ) : (
                  <h2>
                    <span className="sw-tip-anchor">
                      Curated Intelligence Streams
                      <InfoTip tipId="curatedStreams" label="About curated intelligence streams" />
                    </span>
                  </h2>
                )}
              </div>

              <div
                className={`sw-stage-options ${activeTrack === "buildings" || activeTrack === "trends" ? "sw-stage-options--lead" : ""}`}
                role="group"
                aria-label="Subcategory filters"
              >
                {(activeTrack === "buildings"
                  ? BUILDING_STAGES
                  : activeTrack === "trends"
                  ? TREND_STAGES
                  : ALL_CURATED_STAGES
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={stage === item.key}
                    aria-label={`${item.label} · ${item.hint}`}
                    className={`sw-stage-btn ${stage === item.key ? "is-active" : ""}`}
                    onClick={() => chooseStage(item.key)}
                  >
                    <span>{item.label}</span>
                    <span className="sw-stage-tooltip" role="tooltip" aria-hidden="true">
                      {item.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="sw-library" aria-label="Article library">
              <div className="sw-library-head">
                <div>
                  <span className="sw-kicker">THE LIBRARY</span>
                  <h2>All articles</h2>
                </div>
                <label className="sw-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => search(event.target.value)}
                    placeholder="Search stories, places, or topics"
                    aria-label="Search articles"
                  />
                </label>
              </div>
              <p className="sw-count">
                {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"} shown
              </p>
              {filteredArticles.length === 0 ? (
                <div className="sw-empty">
                  <p>No articles match this stage or search query.</p>
                  <button
                    type="button"
                    onClick={() => {
                      chooseStage("all");
                      search("");
                    }}
                  >
                    Show all articles
                  </button>
                </div>
              ) : (
                <>
                  <div className="sw-article-grid">
                    {visibleArticles.map((article, index) => {
                      const classification = getArticleClassification(article);
                      const isBuilding = classification.domain === "building";
                      return (
                        <article
                          key={article.slug}
                          style={{ "--stagger-index": Math.min(index, 20) }}
                          className={`sw-article${returnSignal === article.slug ? " is-returned" : ""}`}
                        >
                          <div className="sw-article-meta">
                            <span className={`sw-class-badge ${classification.badgeClass}`}>
                              {isBuilding ? (
                                <Building2 size={11} aria-hidden="true" />
                              ) : (
                                <TrendingUp size={11} aria-hidden="true" />
                              )}
                              {classification.domainLabel} · {classification.substageLabel}
                            </span>
                            <span className="sw-category-tag">{article.category || "Intel"}</span>
                          </div>
                          <h3>{article.title}</h3>
                          <p>{article.excerpt || "Open the full briefing for details."}</p>
                          <div className="sw-article-foot">
                            <span className="sw-location-date">
                              {article.city || "Philippines"}
                              {article.date ? ` · ${article.date}` : ""}
                            </span>
                            {article.isSample ? (
                              <span className="sw-sample">Sample for exploring</span>
                            ) : null}
                          </div>
                          <Link href={articleHref(article)} className="sw-article-link">
                            Read full article <ArrowRight size={14} aria-hidden="true" />
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                  {filteredArticles.length > visibleArticleCount && (
                    <div className="sw-load-more-wrap">
                      <button
                        type="button"
                        className="sw-post-btn"
                        onClick={() => setVisibleArticleCount((c) => c + ARTICLES_PAGE_SIZE)}
                      >
                        LOAD MORE ARTICLES ({filteredArticles.length - visibleArticleCount} REMAINING)
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <section className="sw-radar" aria-label="Spatial radar">
              <div className="sw-radar-note">
                <span className="sw-radar-note-lead">
                  <strong>Explore by area.</strong>
                  <InfoTip tipId="exploreByArea" label="About district location signals" />
                </span>
                <span className="sw-radar-note-body">Pins appear when updates have verified coordinates.</span>
              </div>
              <StratosphereTerminal
                initialSignals={radarSignals}
                stageFilter={stage}
                onSelectStage={chooseStage}
                onClearStage={() => chooseStage("all")}
                onSignalClosed={handleSignalClosed}
              />
            </section>
          )}
        </main>
      );
    }
