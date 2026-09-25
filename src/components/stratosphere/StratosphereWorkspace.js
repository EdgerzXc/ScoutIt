"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, FileText, Search } from "lucide-react";
import StratosphereTerminal from "./StratosphereTerminal";
import SignalComposer from "./SignalComposer";
import { COMMUNITY_SIGNALS, pipelineArticlesToSignals } from "@/lib/communitySignalsAdapter";
import { loadPublicCatalog } from "@/lib/cms/publicCatalog";
import { JOURNEY_STAGES, matchesJourneyStage, stageForSignal, validJourneyStage } from "@/lib/layerTwoJourney";
import { mergeStratosphereArticles } from "@/lib/stratosphereArticles";
import InfoTip from "@/components/ui/InfoTip";
import "./stratosphere-workspace.css";

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
    loadPublicCatalog().then((data) => {
      if (alive) setLiveArticles(data?.intel || []);
    }).catch(() => {});
    // Live member posts ride above pipeline + sample rows. A failed or
    // degraded read leaves the samples in place — never an empty radar.
    fetch("/api/community/signals?limit=60")
      .then((res) => res.json())
      .then((json) => {
        if (alive && json?.ok && Array.isArray(json.signals)) setLiveSignals(json.signals);
      })
      .catch(() => {});
    return () => { alive = false; };
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
      const corpus = [article.title, article.city, article.category, article.excerpt, article.intelType]
        .join(" ").toLowerCase();
      return words.every((word) => corpus.includes(word));
    });
  }, [articles, stage, query]);

  const updateUrl = (name, value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    window.history.replaceState(null, "", url);
  };
  const chooseStage = (next) => { setStage(next); updateUrl("stage", next === "all" ? "" : next); };
  const chooseView = (next) => { setView(next); updateUrl("view", next === "articles" ? "" : next); };
  const search = (value) => { setQuery(value); updateUrl("q", value); };

  const articleHref = (article) => {
    const params = new URLSearchParams({ fromStratosphere: "1", view: "articles", stage, signal: article.slug });
    if (query) params.set("q", query);
    return `/intel/${encodeURIComponent(article.slug)}?${params}`;
  };

  return (
    <main className="sw-page">
      <nav className="sw-route-nav" aria-label="Stratosphere journey">
        <Link href="/layer/stratosphere">← Layer 2 entrance</Link>
        <Link href="/layer/metropolis">Continue to Metropolis →</Link>
      </nav>
      <header className="sw-intro">
        <span className="sw-kicker">INSIDE LAYER 02 / STRATOSPHERE</span>
        <h1>Explore what is changing.</h1>
        <p>
          Building updates, market briefings, and spatial signals.{" "}
          <InfoTip tipId="stratosphereWorkspace" label="About Stratosphere" />
        </p>
      </header>

      <div className="sw-view-row">
        <div className="sw-view-switch" role="group" aria-label="Explore Stratosphere">
          <button type="button" aria-pressed={view === "articles"} className={view === "articles" ? "is-active" : ""} onClick={() => chooseView("articles")}><FileText size={15} aria-hidden="true" /> All Articles</button>
          <button type="button" aria-pressed={view === "radar"} className={view === "radar" ? "is-active" : ""} onClick={() => chooseView("radar")}><Compass size={15} aria-hidden="true" /> Radar &amp; Community</button>
        </div>
        <button type="button" className="sw-post-btn" onClick={() => setComposerOpen(true)}>
          <span aria-hidden="true">+</span> POST A SIGNAL
        </button>
      </div>
      <SignalComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={() => { refreshLiveSignals(); chooseView("radar"); }}
      />

      <section className="sw-stage" aria-label="Building stage">
        <div className="sw-stage-heading">
          <h2>Building stage</h2>
          <p>Stages apply to building updates. Choose All Articles to include other stories.</p>
        </div>
        <div className="sw-stage-options" role="group" aria-label="Filter building stage">
          {JOURNEY_STAGES.map((item) => (
            <button key={item.key} type="button" aria-pressed={stage === item.key}
              className={stage === item.key ? "is-active" : ""} onClick={() => chooseStage(item.key)}>
              <span>{item.key === "all" ? "All Articles" : item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </div>
      </section>

      {view === "articles" ? (
        <section className="sw-library" aria-label="Article library">
          <div className="sw-library-head">
            <div><span className="sw-kicker">THE LIBRARY</span><h2>All articles</h2></div>
            <label className="sw-search"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => search(event.target.value)} placeholder="Search stories or places" aria-label="Search articles" /></label>
          </div>
          <p className="sw-count">{filteredArticles.length} {filteredArticles.length === 1 ? "article" : "articles"} shown</p>
          {filteredArticles.length === 0 ? (
            <div className="sw-empty"><p>No articles match this stage or search.</p><button type="button" onClick={() => { chooseStage("all"); search(""); }}>Show all articles</button></div>
          ) : (
            <div className="sw-article-grid">
              {filteredArticles.map((article) => {
                const articleStage = stageForSignal(article);
                return (
                  <article key={article.slug} className={`sw-article${returnSignal === article.slug ? " is-returned" : ""}`}>
                    <div className="sw-article-meta"><span>{article.category || "Article"}</span>{articleStage ? <span>{JOURNEY_STAGES.find((item) => item.key === articleStage)?.label}</span> : null}</div>
                    <h3>{article.title}</h3>
                    <p>{article.excerpt || "Open the full briefing for details."}</p>
                    <div className="sw-article-foot"><span>{article.city || "Philippines"}{article.date ? ` · ${article.date}` : ""}</span>{article.isSample ? <span className="sw-sample">Sample for exploring</span> : null}</div>
                    <Link href={articleHref(article)} className="sw-article-link">Read full article <ArrowRight size={15} aria-hidden="true" /></Link>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="sw-radar" aria-label="Spatial radar">
          <div className="sw-radar-note"><strong>Explore by area.</strong> Pins appear only when an update has a reliable location. Other building updates remain in the list.</div>
          <StratosphereTerminal initialSignals={radarSignals} stageFilter={stage} onClearStage={() => chooseStage("all")} />
        </section>
      )}
    </main>
  );
}
