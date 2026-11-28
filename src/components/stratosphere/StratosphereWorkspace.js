"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bookmark, Building2, Compass, FileText, Layers, Radio, Search, TrendingUp, Users } from "lucide-react";
import SignalDossierCard from "./SignalDossierCard";
import SignalComposer from "./SignalComposer";
import { getLocalSavedSignals } from "@/lib/savedSignalsClient";
import { stratosphereFeedHref } from "@/lib/stratosphereFeed";

const CommunityConnectModal = dynamic(() => import("./CommunityConnectModal"), { ssr: false });

const StratosphereTerminal = dynamic(() => import("./StratosphereTerminal"), {
  ssr: false,
  loading: () => (
    <div className="sw-empty" aria-busy="true">
      <p>Loading signals…</p>
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

async function fetchFullCommunityFeed(signal) {
  const { data: { session } } = await getSession().catch(() => ({ data: {} }));
  const token = session?.access_token;
  const posts = new Map();
  const visited = new Set();
  let cursor;
  do {
    const params = new URLSearchParams({ page: "1", limit: "100" });
    if (cursor) params.set("cursor", cursor);
    const response = await fetch(`/api/community/signals?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal,
    });
    const page = await response.json();
    if (!response.ok || !page.ok || page.degraded || !Array.isArray(page.signals)) throw new Error("Community feed unavailable");
    for (const post of page.signals) posts.set(post.id, post);
    cursor = page.nextCursor;
    if (cursor && visited.has(cursor)) throw new Error("Community feed cursor repeated");
    if (cursor) visited.add(cursor);
  } while (cursor);
  return [...posts.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
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
  initialView = "radar",
  resultsOnly = false,
  initialStage = "all",
  initialQuery = "",
  initialSignal = null,
} = {}) {
  const router = useRouter();
  const params = useSearchParams();
  const communityOnly = resultsOnly && params.get("source") === "community";
  const [liveArticles, setLiveArticles] = useState([]);
  const [view, setView] = useState(initialView);
  const [stage, setStage] = useState(validJourneyStage(initialStage));
  const [query, setQuery] = useState(initialQuery);
  const [returnSignal, setReturnSignal] = useState(initialSignal);
  const [liveSignals, setLiveSignals] = useState([]);
  const [feedState, setFeedState] = useState("loading");
  const [feedRevision, setFeedRevision] = useState(0);
  const [mySignals, setMySignals] = useState([]);
  const [mySignalsLoading, setMySignalsLoading] = useState(false);
  const [mySignalsError, setMySignalsError] = useState(null);
  const [savedSignals, setSavedSignals] = useState([]);
  const [savedSignalsLoading, setSavedSignalsLoading] = useState(false);
  const [savedSignalsError, setSavedSignalsError] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [connectModalSignal, setConnectModalSignal] = useState(null);
  const [communityProfile, setCommunityProfile] = useState(null);
  const [visibleArticleCount, setVisibleArticleCount] = useState(ARTICLES_PAGE_SIZE);
  const signalsFetchedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    getSession()
      .then(async ({ data }) => {
        const token = data?.session?.access_token;
        if (!token || !alive) return;
        const res = await fetch("/api/community/me", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const json = await res.json().catch(() => null);
        if (alive && json?.ok) {
          setCommunityProfile({
            role: json.role || null,
            primaryMode: json.primaryMode || null,
            activeRoles: Array.isArray(json.activeRoles) ? json.activeRoles : [],
            providerType: json.providerType || null,
          });
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
    const localList = getLocalSavedSignals();
    fetchSavedSignals()
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) {
          const seen = new Set(json.signals.map((s) => s.id));
          setSavedSignals([...json.signals, ...localList.filter((s) => s?.id && !seen.has(s.id))]);
        } else {
          setSavedSignals(localList);
        }
      })
      .catch(() => setSavedSignals(localList))
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
    function restoreWorkspace() {
      const params = new URLSearchParams(window.location.search);
      const paramView = params.get("view");
      const next = !resultsOnly && ["articles", "my-signals", "saved-signals"].includes(paramView) ? paramView : "radar";
      setView(next);
      setStage(validJourneyStage(params.get("stage")));
      setQuery(params.get("q") || "");
      setReturnSignal(params.get("signal"));
      if (next === "my-signals") loadMySignals();
      if (next === "saved-signals") loadSavedSignals();
    }
    restoreWorkspace();
    window.addEventListener("popstate", restoreWorkspace);
    return () => window.removeEventListener("popstate", restoreWorkspace);
  }, [resultsOnly, loadMySignals, loadSavedSignals]);

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
    if (view !== "radar" || resultsOnly) return;
    let alive = true;
    fetchCommunitySignals()
      .then((json) => {
        if (alive && json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [view, resultsOnly]);

  useEffect(() => {
    if (!resultsOnly) return;
    const controller = new AbortController();
    setFeedState("loading");
    fetchFullCommunityFeed(controller.signal).then((posts) => {
      if (controller.signal.aborted) return;
      setLiveSignals(posts);
      setFeedState("ready");
    }).catch(() => {
      if (!controller.signal.aborted) setFeedState("unavailable");
    });
    return () => controller.abort();
  }, [resultsOnly, feedRevision]);

  const refreshLiveSignals = useCallback(() => {
    if (resultsOnly) {
      setFeedRevision((revision) => revision + 1);
      return;
    }
    signalsFetchedRef.current = true;
    fetchCommunitySignals()
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
  }, [resultsOnly]);

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
    () => communityOnly ? liveSignals : [...liveSignals, ...pipelineArticlesToSignals(articles), ...COMMUNITY_SIGNALS],
    [liveSignals, articles, communityOnly]
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

  const chooseView = (next, signalId) => {
    if (next !== view) {
      const url = new URL(window.location.href);
      if (next === "radar") url.searchParams.delete("view");
      else url.searchParams.set("view", next);
      if (signalId) {
        url.searchParams.set("signal", signalId);
        url.searchParams.set("mode", "list");
      }
      window.history.pushState(null, "", url);
      setView(next);
    }
    if (next === "my-signals") {
      loadMySignals();
    } else if (next === "saved-signals") {
      loadSavedSignals();
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
    <main data-scoutit-guide="stratosphere-entry" className={`sw-page${view === "radar" ? " sw-page--radar" : ""}${resultsOnly ? " sw-page--results" : ""}${communityOnly ? " sw-page--community" : ""}`}>
      <StratosphereAtmosphere />
      {!resultsOnly && (
        <div className="sw-top-bar">
          <Link href="/dashboard" className="sw-back-dashboard-btn">
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="sw-label-wide">Back to Dashboard</span>
            <span className="sw-label-mobile">Dashboard</span>
          </Link>
        </div>
      )}
      <div className="sw-masthead">
        <header className="sw-intro">
          <span className="sw-kicker">LAYER 02 · STRATOSPHERE</span>
          <div className="sw-intro-title">
            <h1>{resultsOnly ? (communityOnly ? "Community" : "Signals") : (<>
              <span className="sw-label-wide">Explore what is <span className="sw-headline-accent">changing</span>.</span>
              <span className="sw-label-mobile">Stratosphere</span>
            </>)}</h1>
            <InfoTip tipId="stratosphereWorkspace" label="About Stratosphere" />
          </div>
          <p>{resultsOnly
            ? communityOnly ? "Member posts about spaces, needs, and opportunities." : "Member posts and ScoutIt updates in one feed."
            : "Building updates, market trends, and community posts."}</p>
        </header>

        {resultsOnly ? (
          <nav className="sw-view-row sw-feed-nav" aria-label="Signal feeds">
            <Link href={stratosphereFeedHref(params, "map")}>Radar</Link>
            <Link href={stratosphereFeedHref(params)} aria-current={!communityOnly ? "page" : undefined}>All signals</Link>
            <Link href={stratosphereFeedHref(params, "community")} aria-current={communityOnly ? "page" : undefined}>Community</Link>
          </nav>
        ) : (
        <div className="sw-view-row">
          <div className="sw-view-switch" role="group" aria-label="Explore Stratosphere">
            <button
              type="button"
              data-scoutit-guide="spatial-signal-radar"
              aria-pressed={view === "radar"}
              className={view === "radar" ? "is-active" : ""}
              onClick={() => chooseView("radar")}
            >
              <Compass size={15} aria-hidden="true" />
              <span className="sw-view-label-full">Radar</span>
              <span className="sw-view-label-short">Signals</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "articles"}
              className={view === "articles" ? "is-active" : ""}
              onClick={() => chooseView("articles")}
            >
              <FileText size={15} aria-hidden="true" />
              <span>Articles</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "my-signals"}
              className={view === "my-signals" ? "is-active" : ""}
              onClick={() => chooseView("my-signals")}
            >
              <Radio size={15} aria-hidden="true" />
              <span className="sw-view-label-full">My Signals</span>
              <span className="sw-view-label-short">Mine</span>
            </button>
            <button
              type="button"
              aria-pressed={view === "saved-signals"}
              className={view === "saved-signals" ? "is-active" : ""}
              onClick={() => chooseView("saved-signals")}
            >
              <Bookmark size={15} aria-hidden="true" />
              <span>Saved</span>
            </button>
          </div>
        </div>
        )}
        <button type="button" data-scoutit-guide="signal-composer-trigger" className="sw-post-btn sw-workspace-post" aria-label="Post a signal" onClick={() => setComposerOpen(true)}>
          <span aria-hidden="true">+</span>
          <span className="sw-label-wide">POST A SIGNAL</span>
          <span className="sw-label-mobile">POST</span>
        </button>
      </div>

      {!resultsOnly && view === "radar" && (
        <nav className="sw-feed-entry" aria-label="Browse the full feeds">
          <Link href={stratosphereFeedHref(params)}><Radio size={15} aria-hidden="true" /> All signals <ArrowRight size={13} aria-hidden="true" /></Link>
          <Link href={stratosphereFeedHref(params, "community")}><Users size={15} aria-hidden="true" /> Community posts <ArrowRight size={13} aria-hidden="true" /></Link>
        </nav>
      )}

      <SignalComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => {
          if (resultsOnly) router.push("/stratosphere?view=my-signals");
          else {
            refreshLiveSignals();
            chooseView("my-signals");
          }
        }}
      />

      <CommunityConnectModal
        signal={connectModalSignal}
        isOpen={Boolean(connectModalSignal)}
        onClose={() => setConnectModalSignal(null)}
      />

      {view === "saved-signals" ? (
        <section className="sw-my-signals" aria-label="Saved Signals">
          <div className="sw-my-signals-header">
            <div>
              <h2 className="sw-tip-anchor">
                Saved Signals
                <InfoTip tipId="signalSavedWorkspace" label="About saved signals" />
              </h2>
            </div>
            <button type="button" className="sw-post-btn" onClick={() => chooseView("radar")}>
              <Compass size={14} aria-hidden="true" /> BROWSE SIGNALS
            </button>
          </div>
          {savedSignalsLoading ? (
            <p className="sw-loading-text">Loading saved signals…</p>
          ) : savedSignalsError ? (
            <div className="sw-empty">
              <p>{savedSignalsError}</p>
            </div>
          ) : savedSignals.length === 0 ? (
            <div className="sw-empty">
              <Bookmark size={32} style={{ color: "var(--accent)", marginBottom: 12 }} aria-hidden="true" />
              <p>No saved signals yet.</p>
              <button type="button" onClick={() => chooseView("radar")}>
                Browse signals
              </button>
            </div>
          ) : (
            <div className="sw-my-signals-grid">
              {savedSignals.map((signal) => (
                <SignalDossierCard
                  key={signal.id}
                  signal={{ ...signal, isSaved: true }}
                  onSelect={(sig) => chooseView("radar", sig.id)}
                  onConnect={(sig) => setConnectModalSignal(sig)}
                  onClosed={() => {
                    loadSavedSignals();
                    refreshLiveSignals();
                  }}
                />
              ))}
            </div>
          )}
        </section>
      ) : view === "my-signals" ? (
        <section className="sw-my-signals" aria-label="My Signals">
          <div className="sw-my-signals-header">
            <div>
              <h2>My signals</h2>
              <p>Track responses, answers under review, and receipts.</p>
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
                <span className="sw-track-tab-label-short">Trends</span>
                <span className="sw-track-badge">{trendCount}</span>
              </button>
            </div>

            <div className="sw-stage">
              <div className="sw-stage-heading">
                {activeTrack === "buildings" ? (
                  <h2>
                    <span className="sw-tip-anchor">
                      Building stages
                      <InfoTip tipId="pipelineStages" label="About development pipeline stages" />
                    </span>
                  </h2>
                ) : activeTrack === "trends" ? (
                  <h2>
                    <span className="sw-tip-anchor">
                      Trend topics
                      <InfoTip tipId="marketTrends" label="About market trend subcategories" />
                    </span>
                  </h2>
                ) : (
                  <h2>
                    <span className="sw-tip-anchor">
                      Topics
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
                <h2 className="sw-library-title">Articles</h2>
                <label className="sw-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => search(event.target.value)}
                    placeholder="Search articles"
                    aria-label="Search articles"
                  />
                </label>
              </div>
              <p className="sw-count">
                {filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"}
              </p>
              {filteredArticles.length === 0 ? (
                <div className="sw-empty">
                  <p>No matching articles.</p>
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
                          {article.excerpt && <p>{article.excerpt}</p>}
                          <div className="sw-article-foot">
                            <span className="sw-location-date">
                              {article.city || "Philippines"}
                              {article.date ? ` · ${article.date}` : ""}
                            </span>
                            {article.isSample ? (
                              <span className="sw-sample">Sample</span>
                            ) : null}
                          </div>
                          <Link href={articleHref(article)} className="sw-article-link">
                            Read article <ArrowRight size={14} aria-hidden="true" />
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
                        MORE ARTICLES ({filteredArticles.length - visibleArticleCount})
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <section className="sw-radar" aria-label={resultsOnly ? "Signal results" : "Spatial radar"}>
            {!resultsOnly && (
              <div className="sw-radar-note">
                <span className="sw-radar-note-lead">
                  <strong>Explore by area.</strong>
                  <InfoTip tipId="exploreByArea" label="About district location signals" />
                </span>
                <span className="sw-radar-note-body">Pins appear when updates have verified coordinates.</span>
              </div>
            )}
              <StratosphereTerminal
                initialSignals={radarSignals}
                userProfile={communityProfile}
                stageFilter={stage}
                onSelectStage={chooseStage}
                onClearStage={() => chooseStage("all")}
                onSignalClosed={handleSignalClosed}
                resultsOnly={resultsOnly}
                feedState={resultsOnly ? feedState : "ready"}
                onRetryFeed={refreshLiveSignals}
              />
            </section>
          )}
        </main>
      );
    }
