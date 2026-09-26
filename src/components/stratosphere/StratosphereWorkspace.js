"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, Compass, FileText, Layers, Search, TrendingUp } from "lucide-react";
import StratosphereTerminal from "./StratosphereTerminal";
import SignalComposer from "./SignalComposer";
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
import InfoTip from "@/components/ui/InfoTip";
import "./stratosphere-workspace.css";

const ALL_CURATED_STAGES = [
  { key: "all", label: "All Intelligence", hint: "Combined pipeline and trend coverage" },
  { key: "all-buildings", label: "All Buildings", hint: "All active development projects" },
  { key: "all-trends", label: "All Trends", hint: "All macro and spatial dynamics" },
  { key: "building", label: "Under Construction", hint: "Active structural build-outs" },
  { key: "demand", label: "Market Demand", hint: "Absorption and residential surges" },
  { key: "zoning", label: "Policy & Zoning", hint: "Mandates and green standards" },
];

export default function StratosphereWorkspace() {
  const [liveArticles, setLiveArticles] = useState([]);
  const [view, setView] = useState("articles");
  const [stage, setStage] = useState("all");
  const [query, setQuery] = useState("");
  const [returnSignal, setReturnSignal] = useState(null);
  const [liveSignals, setLiveSignals] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "radar") setView("radar");
    setStage(validJourneyStage(params.get("stage")));
    setQuery(params.get("q") || "");
    setReturnSignal(params.get("signal"));
  }, []);

  useEffect(() => {
    let alive = true;
    loadPublicCatalog()
      .then((data) => {
        if (alive) setLiveArticles(data?.intel || []);
      })
      .catch(() => {});

    fetch("/api/community/signals?limit=60")
      .then((res) => res.json())
      .then((json) => {
        if (alive && json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const refreshLiveSignals = useCallback(() => {
    fetch("/api/community/signals?limit=60")
      .then((res) => res.json())
      .then((json) => {
        if (json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
  }, []);

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

  const updateUrl = (name, value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  };

  const chooseStage = (next) => {
    setStage(next);
    updateUrl("stage", next === "all" ? "" : next);
  };

  const chooseView = (next) => {
    setView(next);
    updateUrl("view", next === "articles" ? "" : next);
  };

  const search = (value) => {
    setQuery(value);
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
    <main className={`sw-page${view === "radar" ? " sw-page--radar" : ""}`}>
      <header className="sw-intro">
        <span className="sw-kicker">INSIDE LAYER 02 / STRATOSPHERE</span>
        <h1>Explore what is changing.</h1>
        <p>
          Building updates, market trends, and spatial signals across Metro Manila.{" "}
          <InfoTip tipId="stratosphereWorkspace" label="About Stratosphere" />
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
            aria-pressed={view === "radar"}
            className={view === "radar" ? "is-active" : ""}
            onClick={() => chooseView("radar")}
          >
            <Compass size={15} aria-hidden="true" /> Radar &amp; Community
          </button>
        </div>
        <button type="button" className="sw-post-btn" onClick={() => setComposerOpen(true)}>
          <span aria-hidden="true">+</span> POST A SIGNAL
        </button>
      </div>

      <SignalComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => {
          refreshLiveSignals();
          chooseView("radar");
        }}
      />

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
            <span>All Intelligence</span>
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
            <span>Building Developments</span>
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
            <span>Market Trends &amp; Policy</span>
            <span className="sw-track-badge">{trendCount}</span>
          </button>
        </div>

        <div className="sw-stage">
          <div className="sw-stage-heading">
            {activeTrack === "buildings" ? (
              <>
                <h2>Development Pipeline Stages</h2>
                <p>Filter building updates by project construction and delivery milestones.</p>
              </>
            ) : activeTrack === "trends" ? (
              <>
                <h2>Market Trend Subcategories</h2>
                <p>Explore macro demand shifts, policy changes, zoning, and infrastructure.</p>
              </>
            ) : (
              <>
                <h2>Curated Intelligence Streams</h2>
                <p>Select a quick stream or pick a track above to focus on buildings or market trends.</p>
              </>
            )}
          </div>

          <div className="sw-stage-options" role="group" aria-label="Subcategory filters">
            {activeTrack === "buildings"
              ? BUILDING_STAGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={stage === item.key}
                    className={stage === item.key ? "is-active" : ""}
                    onClick={() => chooseStage(item.key)}
                  >
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </button>
                ))
              : activeTrack === "trends"
              ? TREND_STAGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={stage === item.key}
                    className={stage === item.key ? "is-active" : ""}
                    onClick={() => chooseStage(item.key)}
                  >
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </button>
                ))
              : ALL_CURATED_STAGES.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={stage === item.key}
                    className={stage === item.key ? "is-active" : ""}
                    onClick={() => chooseStage(item.key)}
                  >
                    <span>{item.label}</span>
                    <small>{item.hint}</small>
                  </button>
                ))}
          </div>
        </div>
      </section>

      {view === "articles" ? (
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
            <div className="sw-article-grid">
              {filteredArticles.map((article, index) => {
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
          )}
        </section>
      ) : (
        <section className="sw-radar" aria-label="Spatial radar">
          <div className="sw-radar-note">
            <strong>Explore by area.</strong> Pins appear only when an update has a reliable
            location. Other building updates and market trend reports remain in the list.
          </div>
          <StratosphereTerminal
            initialSignals={radarSignals}
            stageFilter={stage}
            onClearStage={() => chooseStage("all")}
          />
        </section>
      )}
    </main>
  );
}
