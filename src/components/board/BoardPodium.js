"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rankBoard, BOARD_CATEGORIES } from "@/data/mockShowcase";

const TIER = {
  universe: { color: "#E8AE3C", rgb: "232, 174, 60" },
  cluster: { color: "#C0C0C0", rgb: "192,192,192" },
  solar: { color: "#CD7F32", rgb: "205,127,50" },
  starry: { color: "#c8c8c8", rgb: "138,138,138" },
};

function BoardCard({ e, variant }) {
  const t = TIER[e.tier] || TIER.starry;
  return (
    <Link href="/showcase" className={`bp-card bp-${variant}`} style={{ borderColor: `rgba(${t.rgb},0.6)`, "--tg": `rgba(${t.rgb},0.55)`, "--tc": t.color }}>
      <div className="bp-photo" style={e.photo ? { backgroundImage: `url(${e.photo})` } : undefined}>
        <span className="bp-rank" style={{ color: t.color, borderColor: `rgba(${t.rgb},0.65)` }}>#{String(e.rank).padStart(2, "0")}</span>
        {variant === "hero" && <span className="bp-tier-tag" style={{ color: t.color, borderColor: `rgba(${t.rgb},0.5)` }}>{e.tier === "universe" ? "Champion" : e.tier === "cluster" ? "Runner-up" : e.tier === "solar" ? "Podium" : "Contender"}</span>}
        <span className="bp-showcase">Showcase →</span>
      </div>
      <div className="bp-body">
        {e.category && <div className="bp-cat" style={{ color: t.color }}>{e.category}</div>}
        <div className="bp-name">{e.name}</div>
        {e.location && <div className="bp-loc">{e.location}</div>}
        {variant === "hero" && (
          <>
            <div className="bp-divider" />
            <div className="bp-stats">
              {[["Inquiries", e.inquiry_count], ["Views", e.views], ["Saves", e.saves]].filter(([, v]) => v).map(([l, v]) => (
                <div className="bp-stat" key={l}><span className="bp-num" style={{ color: t.color }}>{v}</span><span className="bp-lbl">{l}</span></div>
              ))}
            </div>
          </>
        )}
        {variant !== "hero" && (
          <div className="bp-mini-stat"><span style={{ color: t.color }}>{e.inquiry_count}</span> inquiries</div>
        )}
      </div>
    </Link>
  );
}

export default function BoardPodium() {
  const [entries, setEntries] = useState([]);
  const [category, setCategory] = useState("All");

  useEffect(() => {
    let alive = true;
    fetch("/api/showcase").then((r) => r.json()).then((d) => { if (alive && d.entries) setEntries(d.entries); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const ranked = useMemo(() => rankBoard(entries, { award: "Most Inquired", category }).slice(0, 4), [entries, category]);
  const hero = ranked[0];
  const rest = ranked.slice(1);

  return (
    <div className="descent-split relative z-10">
      {/* LEFT — menu */}
      <aside className="descent-sidebar" style={{ justifyContent: "space-between" }}>
        <nav className="descent-nav">
          {BOARD_CATEGORIES.map((c) => (
            <button key={c} className={`descent-cat ${category === c ? "on" : ""}`} onClick={() => setCategory(c)}>
              {c === "All" ? "All Properties" : c}
            </button>
          ))}
        </nav>

        <Link href="/showcase" className="board-seeall">See The Showcase →</Link>
      </aside>

      {/* RIGHT — leaderboard preview */}
      <div className="descent-content">
        <div className="board-content-head">
          <h3 className="board-content-title">{category === "All" ? "Overall" : category} · Most Inquired</h3>
          <div className="board-content-sub">Live Leaderboard — Updated Monthly</div>
        </div>

        {ranked.length === 0 ? (
          <div className="board-empty">No ranked spaces in this category yet.</div>
        ) : (
          <div className="board-podium">
            {hero && <BoardCard e={hero} variant="hero" />}
            <div className="board-runners">
              {rest.map((e, i) => <BoardCard key={e.rank} e={e} variant={i === 0 ? "mid" : "mini"} />)}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .board-kicker { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; }
        .board-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(34px, 4vw, 48px); color: #f0ede8; margin: 12px 0 8px; }
        .board-sub { font-family: Georgia, serif; font-style: italic; font-size: 14px; color: #c8c8c8; line-height: 1.6; margin-bottom: 28px; }
        
        .board-mission { margin-top: 24px; max-width: 260px; }
        .board-mission h3 { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 8px; }
        .board-mission p { font-family: Georgia, serif; font-size: 13px; color: var(--accent); line-height: 1.6; font-style: italic; opacity: 0.85; }

        :global(.board-seeall) {
          font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--accent); text-decoration: none; border: 1px solid rgba(232, 174, 60,0.5);
          padding: 16px; text-align: center; transition: background 0.2s; margin-top: 28px;
        }
        :global(.board-seeall:hover) { background: rgba(232, 174, 60,0.12); }

        .board-content { padding: clamp(24px, 4vh, 48px) clamp(28px, 4vw, 56px); display: flex; flex-direction: column; min-width: 0; overflow-y: auto; }
        .board-content::-webkit-scrollbar { display: none; }
        .board-content { scrollbar-width: none; }
        .board-content-head { margin-bottom: 24px; text-align: right; }
        .board-content-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(24px, 3vw, 34px); color: #f0ede8; }
        .board-content-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.22em; color: #555; text-transform: uppercase; margin-top: 8px; }
        .board-empty { font-family: Georgia, serif; font-style: italic; color: #666; font-size: 18px; padding: 60px 0; text-align: right; }

        .board-podium { display: flex; flex-direction: column; gap: 14px; max-width: 440px; margin-left: auto; }
        .board-runners { display: flex; flex-direction: column; gap: 14px; }

        :global(.bp-card) {
          position: relative; display: flex; background: rgba(10,10,12,0.35); backdrop-filter: blur(16px);
          border: 1px solid; border-radius: 5px; overflow: hidden; text-decoration: none;
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }
        :global(.bp-card:hover) { transform: translateY(-4px); box-shadow: 0 0 0 1px var(--tg), 0 16px 44px -18px var(--tg); background: rgba(15,15,18,0.5); }
        :global(.bp-hero) { flex-direction: column; min-height: 240px; }
        :global(.bp-mid), :global(.bp-mini) { flex-direction: row; min-height: 110px; }
        :global(.bp-photo) { position: relative; background: #161616; background-size: cover; background-position: center; flex-shrink: 0; overflow: hidden; transition: transform 0.5s ease; }
        :global(.bp-hero .bp-photo) { width: 100%; height: 160px; }
        :global(.bp-mid .bp-photo), :global(.bp-mini .bp-photo) { width: 38%; min-width: 100px; height: auto; }
        :global(.bp-card:hover .bp-photo) { transform: scale(1.05); }
        :global(.bp-rank) { position: absolute; top: 10px; left: 10px; font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; padding: 3px 9px; border: 1px solid; background: rgba(0,0,0,0.62); backdrop-filter: blur(6px); }
        :global(.bp-tier-tag) { position: absolute; top: 10px; right: 10px; font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; padding: 3px 8px; border: 1px solid; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); }
        :global(.bp-showcase) { position: absolute; bottom: 10px; right: 10px; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: #fff; background: rgba(0,0,0,0.6); padding: 4px 9px; opacity: 0; transform: translateY(6px); transition: all 0.28s ease; }
        :global(.bp-card:hover .bp-showcase) { opacity: 1; transform: translateY(0); }
        :global(.bp-body) { padding: 14px; display: flex; flex-direction: column; flex: 1; min-width: 0; }
        :global(.bp-cat) { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 5px; }
        :global(.bp-name) { font-family: Georgia, serif; color: #f0ede8; line-height: 1.25; }
        :global(.bp-hero .bp-name) { font-size: 22px; }
        :global(.bp-mid .bp-name) { font-size: 16px; }
        :global(.bp-mini .bp-name) { font-size: 14px; }
        :global(.bp-loc) { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #666; margin-top: 4px; }
        :global(.bp-divider) { height: 1px; background: rgba(255,255,255,0.08); margin: 12px 0; }
        :global(.bp-stats) { display: flex; gap: 16px; }
        :global(.bp-stat) { display: flex; flex-direction: column; }
        :global(.bp-num) { font-family: Georgia, serif; font-size: 18px; }
        :global(.bp-lbl) { font-family: var(--font-mono); font-size: 7px; letter-spacing: 0.16em; text-transform: uppercase; color: #777; margin-top: 2px; }
        :global(.bp-mini-stat) { font-family: var(--font-mono); font-size: 9px; color: #777; letter-spacing: 0.1em; text-transform: uppercase; margin-top: auto; }
        :global(.bp-mini-stat span) { font-family: Georgia, serif; font-size: 14px; }

        @media (max-width: 1024px) {
          .board-split { grid-template-columns: 260px 1fr; }
        }
        @media (max-width: 820px) {
          .board-split { grid-template-columns: 1fr; }
          .board-menu { border-right: none; border-bottom: 1px solid #1a1a1a; padding: 32px 20px; }
          
          /* Horizontal Carousel for Categories */
          .board-nav { 
            display: flex;
            flex-direction: row; 
            flex-wrap: nowrap; 
            overflow-x: auto; 
            white-space: nowrap; 
            -webkit-overflow-scrolling: touch;
            padding-bottom: 12px;
            width: 100vw;
            margin-left: -20px;
            padding: 0 20px;
            scroll-snap-type: x mandatory;
          }
          .board-nav::-webkit-scrollbar { display: none; }
          .board-nav { scrollbar-width: none; }
          .board-cat { font-size: 14px; padding: 10px 14px; flex-shrink: 0; scroll-snap-align: start; }

          /* Horizontal Carousel for Podium Cards */
          .board-podium { 
            display: flex; 
            flex-direction: row; 
            overflow-x: auto; 
            scroll-snap-type: x mandatory; 
            padding-bottom: 24px;
            gap: 16px;
            width: 100vw;
            margin-left: -28px;
            padding: 0 28px;
            -webkit-overflow-scrolling: touch;
          }
          .board-podium::-webkit-scrollbar { display: none; }
          .board-podium { scrollbar-width: none; }
          
          .board-runners { 
            display: contents; 
          }

          /* Force cards to fit horizontal carousel */
          :global(.bp-hero), :global(.bp-mid), :global(.bp-mini) { 
            min-width: 80vw; 
            scroll-snap-align: start; 
            flex-shrink: 0;
            margin-right: 16px;
          }
          
          .board-title { font-size: 32px; }
          .board-content-title { font-size: 26px; }
        }
        @media (max-width: 560px) {
          :global(.bp-hero), :global(.bp-mid), :global(.bp-mini) { 
            flex-direction: column; 
          }
          :global(.bp-hero .bp-photo), :global(.bp-mid .bp-photo), :global(.bp-mini .bp-photo) { 
            width: 100%; height: 200px; 
          }
          :global(.bp-hero .bp-name) { font-size: 20px; }
          :global(.bp-mid .bp-name), :global(.bp-mini .bp-name) { font-size: 16px; }
        }
      `}</style>
    </div>
  );
}
